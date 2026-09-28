const mongoose = require('mongoose');
const { FOLLOW_UP_STATUSES, PRIORITIES } = require('./constants');

const FollowUpSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    scheduledAt: { type: Date, required: true },
    note: { type: String },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: FOLLOW_UP_STATUSES, default: 'Pending' },
  },
  { timestamps: true }
);

FollowUpSchema.index({ owner: 1, scheduledAt: 1 });

module.exports = mongoose.model('FollowUp', FollowUpSchema);
