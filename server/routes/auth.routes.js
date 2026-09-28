const express = require('express');
const { register, login, getMe, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');
const { registerSchema, loginSchema } = require('../validators/auth.schema');

const router = express.Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
