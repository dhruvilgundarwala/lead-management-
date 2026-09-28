const axios = require('axios');
const env = require('../../../config/env');
const AppError = require('../../../utils/AppError');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
// Nominatim usage policy: absolute maximum of 1 request per second.
const MIN_INTERVAL_MS = 1100;
const MAX_POI_REQUESTS = 6;
const POI_PAGE_SIZE = 40; // Nominatim's maximum

// Overpass derives area ids from OSM ids: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#By_area_(area)
const AREA_ID_OFFSET = { relation: 3600000000, way: 2400000000 };

// Nominatim place_rank 12-20 = city, town, suburb level (https://nominatim.org/release-docs/latest/customize/Ranking/)
const isSettlementRank = (rank) => rank >= 12 && rank <= 20;

// When a place is only a point (common for cities in India), search this far around it.
const RADIUS_BY_TYPE = { city: 12000, town: 6000, municipality: 6000, village: 3000, suburb: 2500, quarter: 2000, neighbourhood: 1500 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const metersToDegreesLat = (m) => m / 111320;
const metersToDegreesLon = (m, lat) => m / (111320 * Math.cos((lat * Math.PI) / 180));

class NominatimProvider {
  constructor() {
    this.client = axios.create({
      baseURL: env.NOMINATIM_URL,
      timeout: 15000,
      headers: { 'User-Agent': env.OSM_USER_AGENT, 'Accept-Language': 'en' },
    });
    this.cache = new Map();
    this.queue = Promise.resolve();
    this.lastRequestAt = 0;
  }

  // Serialises requests so concurrent searches never exceed the rate limit.
  throttle(fn) {
    const run = this.queue.then(async () => {
      const wait = this.lastRequestAt + MIN_INTERVAL_MS - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastRequestAt = Date.now();
      return fn();
    });
    this.queue = run.catch(() => {});
    return run;
  }

  async get(params) {
    const { data } = await this.throttle(() => this.client.get('/search', { params: { format: 'jsonv2', ...params } }));
    return Array.isArray(data) ? data : [];
  }

  /**
   * Resolves a place name to a search scope.
   * @returns {{ displayName, city, state, country, lat, lon, areaId: number|null, radiusMeters, viewbox: string }}
   */
  async geocode({ city, state, country }) {
    const q = [city, state, country].filter(Boolean).join(', ');
    const cacheKey = q.toLowerCase();

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    let results;
    try {
      results = await this.get({ q, addressdetails: 1, limit: 5 });
    } catch (err) {
      console.error('[nominatim] Geocoding failed:', err.message);
      throw new AppError('The location service is temporarily unavailable. Please try again in a minute.', 503);
    }
    if (results.length === 0) {
      throw new AppError(`Could not find a place called "${q}". Try adding the state or country.`, 422);
    }

    // Results come ranked by importance. Prefer the first city/town-level match: for "Ahmedabad" the
    // relation is the whole district, while the city itself is a point.
    const best = results.find((r) => isSettlementRank(r.place_rank)) || results[0];
    const addr = best.address || {};
    const lat = Number(best.lat);
    const lon = Number(best.lon);
    const areaId = AREA_ID_OFFSET[best.osm_type] ? AREA_ID_OFFSET[best.osm_type] + Number(best.osm_id) : null;
    const radiusMeters = RADIUS_BY_TYPE[best.type] || 5000;

    let viewbox;
    if (areaId && Array.isArray(best.boundingbox)) {
      const [south, north, west, east] = best.boundingbox;
      viewbox = `${west},${north},${east},${south}`;
    } else {
      const dLat = metersToDegreesLat(radiusMeters);
      const dLon = metersToDegreesLon(radiusMeters, lat);
      viewbox = `${lon - dLon},${lat + dLat},${lon + dLon},${lat - dLat}`;
    }

    const value = {
      displayName: best.display_name,
      city: addr.city || addr.town || addr.village || addr.suburb || addr.county || city,
      state: addr.state || state || '',
      country: addr.country || country || '',
      lat,
      lon,
      areaId,
      radiusMeters,
      viewbox,
    };

    if (this.cache.size >= CACHE_MAX_ENTRIES) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  /**
   * Fallback business search used when Overpass is unavailable. Nominatim understands phrases such
   * as "dentist" or "hairdresser" as OSM tags, and `extratags` includes website/phone/email.
   * Returns results converted to Overpass element shape so one normaliser handles both.
   */
  async searchPois({ place, phrases, limit }) {
    const seen = new Set();
    const elements = [];

    for (const phrase of phrases.slice(0, MAX_POI_REQUESTS)) {
      if (elements.length >= limit) break;
      let results;
      try {
        results = await this.get({
          q: phrase,
          viewbox: place.viewbox,
          bounded: 1,
          extratags: 1,
          addressdetails: 1,
          limit: POI_PAGE_SIZE,
        });
      } catch (err) {
        console.warn(`[nominatim] POI search for "${phrase}" failed: ${err.message}`);
        continue;
      }

      for (const r of results) {
        const key = `${r.osm_type}/${r.osm_id}`;
        if (seen.has(key) || !r.name) continue;
        seen.add(key);
        elements.push(this.toOverpassElement(r));
      }
    }

    if (elements.length === 0 && phrases.length) {
      console.warn('[nominatim] POI fallback found nothing');
    }
    return elements;
  }

  toOverpassElement(r) {
    const a = r.address || {};
    return {
      type: r.osm_type,
      id: r.osm_id,
      lat: Number(r.lat),
      lon: Number(r.lon),
      tags: {
        ...r.extratags,
        name: r.name,
        [r.category]: r.type,
        'addr:housenumber': a.house_number,
        'addr:street': a.road,
        'addr:suburb': a.suburb || a.neighbourhood,
        'addr:city': a.city || a.town || a.village,
        'addr:state': a.state,
        'addr:postcode': a.postcode,
      },
    };
  }
}

module.exports = new NominatimProvider();
