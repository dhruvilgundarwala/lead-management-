const mongoose = require('mongoose');
const { WEBSITE_REQUIREMENTS } = require('./constants');

const SearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalPrompt: { type: String, required: true },
    parsedQuery: {
      industry: String,
      category: String,
      keywords: [String],
      location: { city: String, state: String, country: String },
      limit: Number,
      websiteRequirement: { type: String, enum: WEBSITE_REQUIREMENTS },
      emailRequired: Boolean,
      phoneRequired: Boolean,
      filters: [String],
    },
    // The place OpenStreetMap actually matched, e.g. "Ahmedabad, Gujarat, India".
    resolvedLocation: String,
    dataSource: String,
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    error: String,
    statistics: {
      discovered: { type: Number, default: 0 },
      duplicatesRemoved: { type: Number, default: 0 },
      websiteChecked: { type: Number, default: 0 },
      emailsFound: { type: Number, default: 0 },
      leadsCreated: { type: Number, default: 0 },
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

SearchSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Search', SearchSchema);
