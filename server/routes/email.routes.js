const express = require('express');
const { generateEmail, sendEmail } = require('../controllers/email.controller');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/generate/:leadId', protect, generateEmail);
router.post('/send', protect, sendEmail);

module.exports = router;

