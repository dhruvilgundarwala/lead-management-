const { z } = require('zod');
const { objectId } = require('./common');

const generateEmailSchema = z.object({
  context: z.string().trim().max(1000).optional(),
});

const sendEmailSchema = z.object({
  leadId: objectId,
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  body: z.string().trim().min(1, 'Body is required').max(10000),
  recipientEmail: z.email('Invalid recipient email').trim().toLowerCase().optional(),
});

module.exports = { generateEmailSchema, sendEmailSchema };
