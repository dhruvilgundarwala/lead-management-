const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { EMAIL_TONES } = require('./constants');

const BCRYPT_ROUNDS = 12;

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    company: { type: String, trim: true, maxlength: 120 },
    avatar: { type: String },
    preferences: {
      aiProvider: { type: String, default: 'groq' },
      emailTone: { type: String, enum: EMAIL_TONES, default: 'professional' },
      followUpDays: { type: Number, default: 3, min: 1, max: 60 },
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, BCRYPT_ROUNDS);
};

UserSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
