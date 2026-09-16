const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Active', 'Scheduled', 'Completed'], default: 'Active' },
  leads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
  statistics: {
    sent: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    replied: { type: Number, default: 0 }
  },
  scheduledAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema);
