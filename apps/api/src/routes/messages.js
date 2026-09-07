import express from 'express';
import twilio from 'twilio';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Replaces {{variable}} placeholders in text with values from variables object and member fields.
 * @param {string} text - Text with {{variable}} placeholders
 * @param {object} variables - Variables object
 * @param {object} member - Member object from PocketBase
 * @returns {string} - Text with placeholders replaced
 */
function replaceVariables(text, variables = {}, member = {}) {
  let result = text;

  // Replace {{variable}} placeholders from variables object
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value || ''));
  });

  // Replace {{member.field}} placeholders from member object
  Object.entries(member).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{member.${key}}}`, 'g');
    result = result.replace(placeholder, String(value || ''));
  });

  // Replace {{field}} placeholders from member object (shorthand)
  Object.entries(member).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value || ''));
  });

  return result;
}

// POST /messages/send - Send message using template
router.post('/send', async (req, res) => {
  const { template_id, recipient_id, message_type, variables } = req.body;

  // Input validation
  if (!template_id || typeof template_id !== 'string' || template_id.trim() === '') {
    return res.status(400).json({ error: 'template_id is required and must be a non-empty string' });
  }

  if (!recipient_id || typeof recipient_id !== 'string' || recipient_id.trim() === '') {
    return res.status(400).json({ error: 'recipient_id is required and must be a non-empty string' });
  }

  if (!message_type || typeof message_type !== 'string' || message_type.trim() === '') {
    return res.status(400).json({ error: 'message_type is required and must be a non-empty string' });
  }

  if (!['sms', 'whatsapp', 'email'].includes(message_type)) {
    return res.status(400).json({ error: 'message_type must be "sms", "whatsapp", or "email"' });
  }

  // Fetch template from PocketBase
  const template = await pb.collection('message_templates').getOne(template_id);

  if (!template) {
    throw new Error(`Message template not found: ${template_id}`);
  }

  // Fetch member from PocketBase
  const member = await pb.collection('members').getOne(recipient_id);

  if (!member) {
    throw new Error(`Member not found: ${recipient_id}`);
  }

  // Replace variables in template content and subject
  const messageContent = replaceVariables(template.content, variables, member);
  const messageSubject = template.subject ? replaceVariables(template.subject, variables, member) : '';

  let messageId = null;
  let status = 'sent';
  let sendError = null;

  try {
    if (message_type === 'email') {
      // Send email via PocketBase mailer
      if (!member.email) {
        throw new Error(`Member ${recipient_id} does not have an email address`);
      }

      // Create message record in PocketBase - PocketBase hook will send email
      const messageRecord = await pb.collection('messages').create({
        recipient_type: 'member',
        recipient_id,
        channel: 'email',
        message_text: messageContent,
        subject: messageSubject,
        recipient_email: member.email,
        status: 'pending',
        sent_at: new Date().toISOString(),
        template_id,
      });

      messageId = messageRecord.id;
      status = 'pending';

      logger.info(`Email message created via template. MessageId: ${messageId}, TemplateId: ${template_id}, RecipientId: ${recipient_id}`);
    } else if (message_type === 'sms' || message_type === 'whatsapp') {
      // Send SMS or WhatsApp via Twilio
      if (!member.phone_number) {
        throw new Error(`Member ${recipient_id} does not have a phone number`);
      }

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials not configured in environment variables');
      }

      // Initialize Twilio client
      const client = twilio(accountSid, authToken);

      const toNumber = message_type === 'whatsapp' ? `whatsapp:${member.phone_number}` : member.phone_number;
      const fromParam = message_type === 'whatsapp' ? whatsappNumber : fromNumber;

      const smsMessage = await client.messages.create({
        body: messageContent,
        from: fromParam,
        to: toNumber,
      });

      messageId = smsMessage.sid;
      status = 'sent';

      logger.info(`${message_type.toUpperCase()} message sent via template. MessageId: ${messageId}, TemplateId: ${template_id}, RecipientId: ${recipient_id}`);
    }
  } catch (error) {
    status = 'failed';
    sendError = error.message;
    logger.error(`Failed to send ${message_type} message via template:`, error);
    throw error;
  } finally {
    // Log send attempt to message_history
    try {
      await pb.collection('message_history').create({
        template_id,
        recipient_id,
        message_type,
        status,
        message_id: messageId,
        error: sendError || null,
        sent_at: new Date().toISOString(),
      });
    } catch (historyError) {
      logger.error('Failed to log message to message_history:', historyError);
    }
  }

  res.json({
    success: true,
    messageId,
    status,
  });
});

router.post('/send-message', async (req, res) => {
  const { recipient_id, recipient_type, channel, message_text, subject } = req.body;

  // Input validation
  if (!recipient_id || !recipient_type || !channel || !message_text) {
    return res.status(400).json({ error: 'Missing required fields: recipient_id, recipient_type, channel, message_text' });
  }

  if (!['member', 'group'].includes(recipient_type)) {
    return res.status(400).json({ error: 'recipient_type must be "member" or "group"' });
  }

  if (!['sms', 'whatsapp', 'email'].includes(channel)) {
    return res.status(400).json({ error: 'channel must be "sms", "whatsapp", or "email"' });
  }

  // Validate subject for email channel
  if (channel === 'email') {
    if (!subject || subject.trim() === '') {
      return res.status(400).json({ error: 'Subject is required for email messages' });
    }
  }

  // Get contact info (phone or email) based on recipient type and channel
  let contacts = [];

  if (recipient_type === 'member') {
    const member = await pb.collection('members').getOne(recipient_id);
    
    if (channel === 'email') {
      if (!member.email) {
        return res.status(400).json({ error: 'Member does not have an email address' });
      }
      contacts = [{ type: 'email', value: member.email, memberId: recipient_id }];
    } else {
      if (!member.phone_number) {
        return res.status(400).json({ error: 'Member does not have a phone number' });
      }
      contacts = [{ type: 'phone', value: member.phone_number }];
    }
  } else if (recipient_type === 'group') {
    const groupMembers = await pb.collection('group_members').getList(1, 500, {
      filter: `group_id="${recipient_id}"`,
    });

    if (groupMembers.items.length === 0) {
      return res.status(400).json({ error: 'Group has no members' });
    }

    // Fetch contact info for each group member
    for (const groupMember of groupMembers.items) {
      const member = await pb.collection('members').getOne(groupMember.member_id);
      
      if (channel === 'email') {
        if (member.email) {
          contacts.push({ type: 'email', value: member.email, memberId: groupMember.member_id });
        }
      } else {
        if (member.phone_number) {
          contacts.push({ type: 'phone', value: member.phone_number });
        }
      }
    }

    if (contacts.length === 0) {
      const contactType = channel === 'email' ? 'email addresses' : 'phone numbers';
      return res.status(400).json({ error: `No members in group have ${contactType}` });
    }
  }

  // Handle email messages: create record with pending status, PocketBase hook will send
  if (channel === 'email') {
    const messageRecords = [];

    for (const contact of contacts) {
      const messageData = {
        recipient_type: 'member',
        recipient_id: contact.memberId,
        channel: 'email',
        message_text,
        subject,
        recipient_email: contact.value,
        status: 'pending',
        sent_at: new Date().toISOString(),
        created_by: req.auth?.id || null,
      };

      // Create message record - PocketBase hook will send email and update status
      const messageRecord = await pb.collection('messages').create(messageData);
      messageRecords.push(messageRecord);
    }

    logger.info(`Email messages created for ${contacts.length} recipient(s). PocketBase hook will send emails.`);

    res.json({
      success: true,
      messageIds: messageRecords.map(m => m.id),
      recipientCount: messageRecords.length,
      status: 'pending',
      note: 'Emails will be sent via PocketBase hook',
    });
    return;
  }

  // Handle SMS and WhatsApp messages via Twilio
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  for (const contact of contacts) {
    const toNumber = channel === 'whatsapp' ? `whatsapp:${contact.value}` : contact.value;
    const fromParam = channel === 'whatsapp' ? `whatsapp:${fromNumber}` : fromNumber;

    const formData = new URLSearchParams();
    formData.append('From', fromParam);
    formData.append('To', toNumber);
    formData.append('Body', message_text);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Twilio error for ${contact.value}:`, errorData);
      throw new Error(`Twilio API error: ${errorData.message || 'Failed to send message'}`);
    }
  }

  // Create message record in PocketBase for SMS/WhatsApp
  const messageData = {
    recipient_type,
    recipient_id,
    channel,
    message_text,
    status: 'sent',
    sent_at: new Date().toISOString(),
    created_by: req.auth?.id || null,
  };

  const messageRecord = await pb.collection('messages').create(messageData);

  logger.info(`${channel.toUpperCase()} message sent successfully. ID: ${messageRecord.id}, Recipients: ${contacts.length}`);

  res.json(messageRecord);
});

// Send SMS to individual phone number
router.post('/sms/send', async (req, res) => {
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

export default router;