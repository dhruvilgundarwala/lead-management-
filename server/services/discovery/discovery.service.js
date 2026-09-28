const nominatim = require('./providers/nominatim.provider');
const overpass = require('./providers/overpass.provider');
const { resolveCategory, NAME_SEARCH_KEYS } = require('./categories');
const { scoreLead } = require('../scoring.service');
const AppError = require('../../utils/AppError');

// Fetch more than requested so results the user already has can be skipped.
const OVERFETCH_FACTOR = 3;
const OVERFETCH_EXTRA = 50;
const MAX_FETCH = 500;
// After Overpass fails, go straight to the fallback for a while instead of waiting on timeouts.
const OVERPASS_COOLDOWN_MS = 2 * 60 * 1000;

/** The same shop is often mapped twice (a point and a building outline). */
const dedupeKey = (b) =>
  `${b.name.toLowerCase().replace(/\s+/g, ' ')}|${b.latitude?.toFixed(3)}|${b.longitude?.toFixed(3)}`;

/** Applies the user's requirements in code (the fallback provider can't filter server-side). */
const meetsRequirements = (b, q) => {
  if (!b.name || b.name.trim().length < 3) return false;
  if (q.websiteRequirement === 'missing' && (b.website || b.brand)) return false;
  if (q.websiteRequirement === 'required' && !b.website) return false;
  if (q.emailRequired && !b.email) return false;
  if (q.phoneRequired && !b.phone) return false;
  return true;
};

/** Search phrases for the fallback provider, e.g. cafe -> ["cafe", "coffee", "tea"]. */
const phrasesFor = (category) => [
  ...new Set(category.tags.flatMap(([, values]) => values.split('|')).map((v) => v.replace(/_/g, ' '))),
];

/** Nominatim phrase searches can return loosely related places; keep only real category matches. */
const matchesCategory = (el, category) =>
  category
    ? category.tags.some(([key, values]) => values.split('|').includes(el.tags?.[key]))
    : NAME_SEARCH_KEYS.some((key) => el.tags?.[key]);

class DiscoveryService {
  constructor() {
    this.overpassRetryAt = 0;
  }

  /**
   * Primary source: Overpass (complete results, filtered server-side).
   * Fallback: Nominatim POI search (up to a few hundred results, filtered here).
   */
  async fetchBusinesses({ place, category, keywords, requirements, limit }) {
    let overpassError;
    if (Date.now() >= this.overpassRetryAt) {
      try {
        const businesses = await overpass.search({ place, category, keywords, requirements, limit });
        return { dataSource: 'OpenStreetMap (Overpass)', businesses };
      } catch (err) {
        if (!(err instanceof AppError)) throw err; // a bug in our query, not an outage
        overpassError = err;
        this.overpassRetryAt = Date.now() + OVERPASS_COOLDOWN_MS;
        console.warn(`[discovery] ${err.message}. Falling back to Nominatim for ${OVERPASS_COOLDOWN_MS / 1000}s`);
      }
    }

    const elements = await nominatim.searchPois({ place, phrases: category ? phrasesFor(category) : keywords, limit });
    const businesses = elements.filter((el) => matchesCategory(el, category)).map((el) => overpass.normalizeElement(el, place));

    if (businesses.length === 0 && (overpassError || Date.now() < this.overpassRetryAt)) {
      throw new AppError('The free map data service is busy right now, so the search could not complete. Please try again in a minute or two.', 503);
    }
    return { dataSource: 'OpenStreetMap (Nominatim)', businesses };
  }

  /**
   * Finds real businesses matching a structured query. No data is ever fabricated:
   * if OpenStreetMap has 7 matches, you get 7.
   *
   * @param {object} query validated parsedQuery (see validators/search.schema.js)
   * @returns {Promise<{ place, category, dataSource, candidates: object[] }>} candidates sorted best-first
   */
  async discover(query) {
    const category = resolveCategory(query.category, query.industry);
    const keywords = category ? [] : [...query.keywords, query.industry].map(overpass.sanitizeKeyword).filter(Boolean);
    if (!category && keywords.length === 0) {
      throw new AppError('Could not work out what type of business to search for. Try e.g. "cafes", "dentists" or "interior designers".', 422);
    }

    const place = await nominatim.geocode(query.location);
    console.log(`[discovery] ${category?.key || `name~${keywords.join('|')}`} in ${place.displayName}`);

    const { dataSource, businesses } = await this.fetchBusinesses({
      place,
      category,
      keywords,
      requirements: {
        websiteRequirement: query.websiteRequirement,
        emailRequired: query.emailRequired,
        phoneRequired: query.phoneRequired,
      },
      limit: Math.min(query.limit * OVERFETCH_FACTOR + OVERFETCH_EXTRA, MAX_FETCH),
    });

    const seen = new Set();
    const candidates = businesses
      .filter((b) => meetsRequirements(b, query))
      .filter((b) => {
        const key = dedupeKey(b);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((b) => ({
        ...b,
        score: scoreLead({ contact: { ...b, emailStatus: b.email ? 'public_unverified' : 'not_found' }, location: b }),
      }))
      // Most contactable leads first, so the user's limit keeps the best ones.
      .sort((a, b) => b.score - a.score);

    console.log(`[discovery] ${candidates.length} candidates via ${dataSource}`);
    return { place, category, dataSource, candidates };
  }
}

module.exports = new DiscoveryService();
module.exports.phrasesFor = phrasesFor;
module.exports.meetsRequirements = meetsRequirements;
