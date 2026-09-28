const discoveryService = require('./discovery/discovery.service');
const Search = require('../models/Search');
const Lead = require('../models/Lead');
const AppError = require('../utils/AppError');

const toLeadDocument = (raw, { ownerId, searchId, industry }) => ({
  owner: ownerId,
  searchId,
  business: {
    name: raw.name,
    category: raw.category,
    industry,
    description: raw.description || undefined,
  },
  location: {
    address: raw.address || undefined,
    city: raw.city || undefined,
    state: raw.state || undefined,
    country: raw.country || undefined,
    postalCode: raw.postalCode || undefined,
    latitude: raw.latitude,
    longitude: raw.longitude,
  },
  contact: {
    email: raw.email || undefined,
    emailStatus: raw.email ? 'public_unverified' : 'not_found',
    phone: raw.phone || undefined,
    website: raw.website || undefined,
    websiteStatus: raw.website ? 'unknown' : 'not_listed',
    social: {
      facebook: raw.social?.facebook || undefined,
      instagram: raw.social?.instagram || undefined,
    },
  },
  source: { provider: raw.source, externalId: raw.externalId, sourceUrl: raw.sourceUrl },
  score: raw.score,
  status: 'NEW',
});

/**
 * Runs a discovery search for a user, stores new leads, and records the search in history.
 * Leads the user already has are skipped, so repeating a search surfaces new businesses.
 */
const runSearch = async ({ user, prompt, parsedQuery }) => {
  const search = await Search.create({ user: user._id, originalPrompt: prompt, parsedQuery, status: 'PROCESSING' });

  try {
    const { place, category, dataSource, candidates } = await discoveryService.discover(parsedQuery);

    const existingIds = new Set(
      await Lead.distinct('source.externalId', {
        owner: user._id,
        'source.externalId': { $in: candidates.map((c) => c.externalId) },
      })
    );
    const fresh = candidates.filter((c) => !existingIds.has(c.externalId)).slice(0, parsedQuery.limit);

    const industry = parsedQuery.industry || category?.label;
    const docs = fresh.map((raw) => toLeadDocument(raw, { ownerId: user._id, searchId: search._id, industry }));

    let leads = [];
    if (docs.length) {
      try {
        leads = await Lead.insertMany(docs, { ordered: false });
      } catch (err) {
        // A concurrent search may have inserted some of the same businesses; keep the rest.
        if (err.code !== 11000 && !err.writeErrors) throw err;
        leads = err.insertedDocs || [];
      }
    }

    search.resolvedLocation = place.displayName;
    search.dataSource = dataSource;
    search.statistics = {
      discovered: candidates.length,
      duplicatesRemoved: existingIds.size,
      websiteChecked: 0,
      emailsFound: leads.filter((l) => l.contact?.email).length,
      leadsCreated: leads.length,
    };
    search.status = 'COMPLETED';
    search.completedAt = new Date();
    await search.save();

    return { search, leads };
  } catch (err) {
    search.status = 'FAILED';
    search.error = err instanceof AppError ? err.message : 'Search failed due to an internal error';
    search.completedAt = new Date();
    await search.save().catch(() => {});
    throw err;
  }
};

module.exports = { runSearch };
