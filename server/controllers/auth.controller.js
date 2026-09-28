const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const signToken = (id) => jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const authPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  company: user.company,
  token: signToken(user._id),
});

// Compared against when the email doesn't exist, so response time doesn't reveal registered emails.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-dummy-password', 12);

exports.register = async (req, res) => {
  const { name, email, password, company } = req.validated.body;

  if (await User.exists({ email })) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = new User({ name, email, company });
  await user.setPassword(password);
  await user.save();

  res.status(201).json({ success: true, data: authPayload(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = user ? await user.matchPassword(password) : await bcrypt.compare(password, DUMMY_HASH);

  if (!user || !valid) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Account is disabled', 403);

  user.lastLoginAt = new Date();
  await user.save();

  res.json({ success: true, data: authPayload(user) });
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// JWTs are stateless; the client discards its token. Kept for API symmetry.
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
