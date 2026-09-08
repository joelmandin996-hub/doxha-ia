import express from 'express';
import twilio from 'twilio';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';

const router = express.Router();

// SMS uses the church's Twilio budget on every call, so it must not be
// reachable by anyone who merely finds the URL.
router.use(pocketbaseAuth({ requireVerified: false }));

// Send SMS to individual phone number
router.post('/send', async (req, res) => {
  const { phoneNumber, message } = req.body;

  // Input validation
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Missing required fields: phoneNumber, message' });
  }

  if (typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  // Validate phoneNumber: non-empty, starts with '+', contains only digits and '+'
  if (typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }

  if (!phoneNumber.startsWith('+')) {
    throw new Error('Numéro de téléphone invalide');
  }

  if (!/^\+[0-9]+$/.test(phoneNumber)) {
    throw new Error('Numéro de téléphone invalide');
  }

  // Get Twilio credentials from environment
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured in environment variables');
  }

  // Initialize Twilio client
  const client = twilio(accountSid, authToken);

  // Send SMS via Twilio
  const smsMessage = await client.messages.create({
    body: message,
    from: fromNumber,
    to: phoneNumber,
  });

  logger.info(`SMS sent successfully. MessageId: ${smsMessage.sid}, To: ${phoneNumber}`);

  res.json({
    success: true,
    message: 'SMS envoyé',
    messageSid: smsMessage.sid,
  });
});

// Send SMS to all members in a group
router.post('/group', async (req, res) => {
  const { groupId, message } = req.body;

  // Input validation
  if (!groupId || !message) {
    return res.status(400).json({ error: 'Missing required fields: groupId, message' });
  }

  if (typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  // Get Twilio credentials from environment
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured in environment variables');
  }

  // Fetch group members
  const groupMembers = await pb.collection('group_members').getList(1, 500, {
    filter: `group_id="${groupId}"`,
  });

  if (groupMembers.items.length === 0) {
    return res.status(400).json({ error: 'Group has no members' });
  }

  // Initialize Twilio client
  const client = twilio(accountSid, authToken);

  const results = [];
  const errors = [];

  // Send SMS to each group member
  for (const groupMember of groupMembers.items) {
    const member = await pb.collection('members').getOne(groupMember.member_id);

    // Skip members without phone numbers
    if (!member.phone_number) {
      logger.warn(`Skipping member ${member.id} (${member.name}): no phone number`);
      continue;
    }

    const smsMessage = await client.messages.create({
      body: message,
      from: fromNumber,
      to: member.phone_number,
    });

    logger.info(`SMS sent to group member. Name: ${member.name}, Phone: ${member.phone_number}, MessageId: ${smsMessage.sid}`);

    results.push({
      memberId: member.id,
      memberName: member.name,
      phoneNumber: member.phone_number,
      messageSid: smsMessage.sid,
      status: 'sent',
    });
  }

  if (results.length === 0) {
    return res.status(400).json({ error: 'No members in group have phone numbers' });
  }

  logger.info(`Group SMS campaign completed. GroupId: ${groupId}, Sent: ${results.length}, Skipped: ${groupMembers.items.length - results.length}`);

  res.json({
    success: true,
    groupId,
    totalMembers: groupMembers.items.length,
    sentCount: results.length,
    skippedCount: groupMembers.items.length - results.length,
    results,
  });
});

export default router;