const express = require('express');
const { z } = require('zod');
const { generateEmail, sendEmail } = require('../controllers/email.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { aiEmailLimiter, sendEmailLimiter } = require('../middleware/rateLimiters');
const { objectId } = require('../validators/common');
const { generateEmailSchema, sendEmailSchema } = require('../validators/email.schema');

const router = express.Router();

router.use(protect);

router.post(
  '/generate/:leadId',
  aiEmailLimiter,
  validate({ params: z.object({ leadId: objectId }), body: generateEmailSchema }),
  generateEmail
);
router.post('/send', sendEmailLimiter, validate({ body: sendEmailSchema }), sendEmail);

module.exports = router;
