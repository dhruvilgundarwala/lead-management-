const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business: {
    name: { type: String, required: true },
    category: String,
    industry: String,
    description: String
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    latitude: Number,
    longitude: Number
  },
  contact: {
    email: String,
    emailStatus: { type: String, enum: ['verified_public', 'public_unverified', 'not_found', 'invalid', 'unknown'], default: 'unknown' },
    phone: String,
    website: String,
    websiteStatus: { type: String, enum: ['verified_found', 'not_listed', 'likely_none', 'unknown', 'verification_failed'], default: 'unknown' }
  },
  source: {
    provider: String,
    externalId: String,
    sourceUrl: String
  },
  score: { type: Number, default: 0 },
  status: { type: String, enum: ['NEW', 'READY', 'CONTACTED', 'FOLLOW_UP_DUE', 'FOLLOW_UP_SENT', 'REPLIED', 'QUALIFIED', 'WON', 'LOST', 'ARCHIVED'], default: 'NEW' },
  searchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Search' },
  campaignIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
  verification: {
    websiteCheckedAt: Date,
    emailCheckedAt: Date,
    lastVerifiedAt: Date
  }
}, { timestamps: true });

LeadSchema.index({ owner: 1, 'source.externalId': 1 }, { unique: true });
LeadSchema.index({ owner: 1, status: 1 });
LeadSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('Lead', LeadSchema);
