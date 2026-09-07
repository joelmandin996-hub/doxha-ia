import express from 'express';
import twilio from 'twilio';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/send', async (req, res) => {
  const { recipientPhone, message, subject } = req.body;

  logger.info('WhatsApp send request received', { recipientPhone, messageLength: message?.length });

  // Input validation
  if (!recipientPhone || typeof recipientPhone !== 'string' || recipientPhone.trim() === '') {
    return res.status(400).json({ error: 'recipientPhone is required and must be a non-empty string' });
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required and must be a non-empty string' });
  }

  // Extract digits from recipientPhone
  const digitsOnly = recipientPhone.replace(/\D/g, '');

  // Validate phone number has at least 10 digits
  if (digitsOnly.length < 10) {
    return res.status(400).json({ error: 'Invalid phone number: must contain at least 10 digits' });
  }

  // Format recipientPhone to whatsapp:+XXXXXXXXXXX
  let formattedRecipientPhone = recipientPhone.trim();
  
  // Remove 'whatsapp:' prefix if it exists
  if (formattedRecipientPhone.startsWith('whatsapp:')) {
    formattedRecipientPhone = formattedRecipientPhone.substring(9);
  }
  
  // Ensure it starts with '+'
  if (!formattedRecipientPhone.startsWith('+')) {
    formattedRecipientPhone = `+${digitsOnly}`;
  }
  
  // Add 'whatsapp:' prefix
  formattedRecipientPhone = `whatsapp:${formattedRecipientPhone}`;

  logger.info('Formatted phone number', { original: recipientPhone, formatted: formattedRecipientPhone });

  // Get Twilio credentials from environment
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured in environment variables');
  }

  // Initialize Twilio client
  const client = twilio(accountSid, authToken);

  // Send WhatsApp message via Twilio
  const result = await client.messages.create({
    from: fromNumber,
    to: formattedRecipientPhone,
    body: message,
  });

  logger.info('WhatsApp message sent successfully', {
    messageSid: result.sid,
    to: formattedRecipientPhone,
    status: result.status,
  });

  res.json({
    success: true,
    sid: result.sid,
    status: 'sent',
  });
});

export default router;