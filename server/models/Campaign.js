const mongoose = require('mongoose');
const { CAMPAIGN_STATUSES } = require('./constants');

const CampaignSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: 'Active' },
    leads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
    statistics: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      replied: { type: Number, default: 0 },
    },
    scheduledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CampaignSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Campaign', CampaignSchema);
