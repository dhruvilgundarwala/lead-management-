const mongoose = require('mongoose');
const { LEAD_STATUSES, EMAIL_STATUSES, WEBSITE_STATUSES } = require('./constants');

const LeadSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business: {
      name: { type: String, required: true, trim: true },
      category: String,
      industry: String,
      description: String,
    },
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      latitude: Number,
      longitude: Number,
    },
    contact: {
      email: String,
      emailStatus: { type: String, enum: EMAIL_STATUSES, default: 'unknown' },
      phone: String,
      website: String,
      websiteStatus: { type: String, enum: WEBSITE_STATUSES, default: 'unknown' },
      // Businesses without a website often still have a social page; useful for outreach.
      social: {
        facebook: String,
        instagram: String,
      },
    },
    source: {
      provider: String,
      externalId: { type: String, required: true },
      sourceUrl: String,
    },
    score: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: LEAD_STATUSES, default: 'NEW' },
    notes: { type: String, maxlength: 5000 },
    searchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Search' },
    campaignIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
    verification: {
      websiteCheckedAt: Date,
      emailCheckedAt: Date,
      lastVerifiedAt: Date,
    },
  },
  { timestamps: true }
);

LeadSchema.index({ owner: 1, 'source.externalId': 1 }, { unique: true });
LeadSchema.index({ owner: 1, status: 1 });
LeadSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', LeadSchema);
