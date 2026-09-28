const User = require('../models/User');

// Local-development accounts only. env.js refuses to enable this in production.
const DEMO_USERS = [
  { name: 'Demo Admin', email: 'admin@example.com', role: 'ADMIN', company: 'AI Lead Finder Inc.' },
  { name: 'Demo User', email: 'demo@example.com', role: 'USER', company: 'LeadGen Co.' },
];
const DEMO_PASSWORD = 'password123';

const seedDemoUsers = async () => {
  for (const data of DEMO_USERS) {
    const exists = await User.exists({ email: data.email });
    if (exists) continue;
    const user = new User(data);
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
    console.log(`[seed] Created demo account ${data.email} / ${DEMO_PASSWORD}`);
  }
};

module.exports = { seedDemoUsers };
