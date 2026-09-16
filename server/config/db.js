const mongoose = require('mongoose');
const env = require('./env');
const User = require('../models/User');

const seedDefaultUser = async () => {
  try {
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      admin = new User({
        name: 'Demo Admin',
        email: 'admin@example.com',
        passwordHash: 'password123',
        role: 'ADMIN',
        company: 'AI Lead Finder Inc.'
      });
      await admin.save();
      console.log('🌱 Seeded admin account: admin@example.com / password123');
    }

    let demo = await User.findOne({ email: 'demo@example.com' });
    if (!demo) {
      demo = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        passwordHash: 'password123',
        role: 'USER',
        company: 'LeadGen Co.'
      });
      await demo.save();
      console.log('🌱 Seeded demo account: demo@example.com / password123');
    }
  } catch (err) {
    console.error('Failed to seed default users:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedDefaultUser();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

