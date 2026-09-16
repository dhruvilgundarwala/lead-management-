const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, company } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({
      name, email, passwordHash: password, company
    });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, token }
    });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    user.lastLoginAt = Date.now();
    await user.save();
    
    const token = generateToken(user._id);
    res.json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, token }
    });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.logout = async (req, res, next) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
