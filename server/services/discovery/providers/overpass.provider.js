const axios = require('axios');
const env = require('../../../config/env');
const AppError = require('../../../utils/AppError');
const { NAME_SEARCH_KEYS } = require('../categories');

const QUERY_TIMEOUT_SECONDS = 25;
const RATE_LIMIT_RETRY_MS = 3000;
const WEBSITE_KEYS = ['website', 'contact:website', 'url'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Keywords come from user/AI input and end up inside an Overpass regex, so reduce them to
 * letters, digits and spaces. That makes query injection impossible.
 */
const sanitizeKeyword = (s) => String(s || '').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);

/** Tag filters appended to every statement, derived from the user's requirements. */
const buildFilters = ({ websiteRequirement, emailRequired, phoneRequired }) => {
  let f = '["name"]';
  if (websiteRequirement === 'missing') {
    f += WEBSITE_KEYS.map((k) => `[!"${k}"]`).join('');
    // Branded chains (Domino's, a bank branch...) always have a corporate website even when OSM doesn't list it.
    f += '[!"brand"][!"brand:wikidata"]';
  } else if (websiteRequirement === 'required') {
    f += `[~"^(${WEBSITE_KEYS.join('|')})$"~"."]`;
  }
  if (emailRequired) f += '[~"^(email|contact:email)$"~"@"]';
  if (phoneRequired) f += '[~"^(phone|contact:phone|mobile|contact:mobile)$"~"."]';
  return f;
};

/**
 * Builds an Overpass QL query.
 * @param {object} p
 * @param {{areaId: number|null, lat: number, lon: number, radiusMeters: number}} p.place
 * @param {Array<[string, string]>} p.tags   trusted [key, "value1|value2"] pairs from categories.js
 * @param {string[]} p.nameKeywords          untrusted, sanitised here
 */
const buildQuery = ({ place, tags = [], nameKeywords = [], requirements, limit }) => {
  const scope = place.areaId ? '(area.searchArea)' : `(around:${Math.round(place.radiusMeters)},${place.lat},${place.lon})`;
  const filters = buildFilters(requirements);

  const statements = tags.map(([key, values]) => `nwr["${key}"~"^(${values})$"]${filters}${scope};`);

  const nameTerms = nameKeywords.map(sanitizeKeyword).filter(Boolean);
  if (nameTerms.length) {
    // One statement per key so each can use Overpass's key index.
    const nameFilter = `["name"~"${nameTerms.join('|')}",i]`;
    statements.push(...NAME_SEARCH_KEYS.map((key) => `nwr["${key}"]${nameFilter}${filters}${scope};`));
  }
  if (!statements.length) throw new Error('Overpass query needs at least one tag or keyword');

  return [
    `[out:json][timeout:${QUERY_TIMEOUT_SECONDS}];`,
    place.areaId ? `area(id:${place.areaId})->.searchArea;` : '',
    `(${statements.join('')});`,
    `out tags center ${Math.min(Math.max(limit, 1), 1000)};`,
  ].join('');
};

const firstValue = (value) => (value ? String(value).split(';')[0].trim() : null);

const normalizeWebsite = (url) => {
  const v = firstValue(url);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

const normalizeEmail = (email) => {
  const v = firstValue(email)?.replace(/^mailto:/i, '').toLowerCase();
  return v && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? v : null;
};

/** Converts an OSM element into the provider-neutral shape the discovery service expects. */
const normalizeElement = (el, place) => {
  const t = el.tags || {};
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const address = [t['addr:unit'], street, t['addr:suburb'] || t['addr:neighbourhood']].filter(Boolean).join(', ');

  return {
    externalId: `osm_${el.type}_${el.id}`,
    name: t.name,
    category: t.shop || t.amenity || t.office || t.craft || t.healthcare || t.tourism || t.leisure || null,
    description: t.description || null,
    address: address || t['addr:full'] || null,
    city: t['addr:city'] || place.city,
    state: t['addr:state'] || place.state,
    country: place.country,
    postalCode: t['addr:postcode'] || null,
    latitude: el.lat ?? el.center?.lat,
    longitude: el.lon ?? el.center?.lon,
    phone: firstValue(t.phone || t['contact:phone'] || t['contact:mobile'] || t.mobile),
    email: normalizeEmail(t.email || t['contact:email']),
    website: normalizeWebsite(t.website || t['contact:website'] || t.url),
    brand: t.brand || t['brand:wikidata'] || null,
    social: {
      facebook: firstValue(t['contact:facebook'] || t.facebook),
      instagram: firstValue(t['contact:instagram'] || t.instagram),
    },
    source: 'OpenStreetMap',
    sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
};

class OverpassProvider {
  constructor() {
    this.client = axios.create({
      timeout: (QUERY_TIMEOUT_SECONDS + 10) * 1000,
      headers: { 'User-Agent': env.OSM_USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async post(url, query) {
    const { data } = await this.client.post(url, new URLSearchParams({ data: query }).toString());
    // Overpass reports server-side timeouts as a 200 with a "remark" and partial/empty results.
    if (data?.remark && /runtime error|timed out|too busy/i.test(data.remark)) {
      throw new Error(`Overpass remark: ${data.remark}`);
    }
    return Array.isArray(data?.elements) ? data.elements : [];
  }

  /** Runs a query against each configured mirror until one succeeds. */
  async run(query) {
    let lastError;
    for (const url of env.overpassUrls) {
      try {
        return await this.post(url, query);
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        // 400 means our query is malformed; retrying another mirror won't help.
        if (status === 400) {
          console.error('[overpass] Bad query:', query);
          throw new Error(`Overpass rejected the query: ${String(err.response?.data).slice(0, 300)}`);
        }
        // 429 = too many parallel queries from our IP; a slot usually frees up within seconds.
        if (status === 429) {
          await sleep(RATE_LIMIT_RETRY_MS);
          try {
            return await this.post(url, query);
          } catch (retryErr) {
            lastError = retryErr;
          }
        }
        console.warn(`[overpass] ${url} failed (${status || err.code || err.message})`);
      }
    }
    throw new AppError(`Overpass unavailable: ${lastError?.message}`, 503);
  }

  /**
   * @returns {Promise<object[]>} normalised businesses (not yet deduplicated or limited)
   */
  async search({ place, category, keywords, requirements, limit }) {
    const params = {
      tags: category?.tags || [],
      nameKeywords: category ? [] : keywords,
      requirements,
      limit,
    };

    let elements = await this.run(buildQuery({ ...params, place }));

    // Some places have no Overpass area (e.g. a node-only town). Retry with a radius search.
    if (elements.length === 0 && place.areaId) {
      elements = await this.run(buildQuery({ ...params, place: { ...place, areaId: null } }));
    }

    return elements.filter((el) => el.tags?.name).map((el) => normalizeElement(el, place));
  }
}

module.exports = new OverpassProvider();
module.exports.buildQuery = buildQuery;
module.exports.normalizeElement = normalizeElement;
module.exports.sanitizeKeyword = sanitizeKeyword;
