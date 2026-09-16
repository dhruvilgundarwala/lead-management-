const mongoose = require('mongoose');

const SearchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalPrompt: { type: String, required: true },
  parsedQuery: {
    industry: String,
    category: String,
    location: { city: String, state: String, country: String },
    limit: Number,
    websiteRequirement: String,
    emailRequired: Boolean,
    phoneRequired: Boolean,
    filters: [String]
  },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  statistics: {
    discovered: { type: Number, default: 0 },
    duplicatesRemoved: { type: Number, default: 0 },
    websiteChecked: { type: Number, default: 0 },
    emailsFound: { type: Number, default: 0 },
    leadsCreated: { type: Number, default: 0 }
  },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Search', SearchSchema);
