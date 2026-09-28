process.env.NODE_ENV = 'test';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildQuery, normalizeElement, sanitizeKeyword } = require('../services/discovery/providers/overpass.provider');
const { resolveCategory } = require('../services/discovery/categories');
const { meetsRequirements, phrasesFor } = require('../services/discovery/discovery.service');

const place = { areaId: null, lat: 23.02, lon: 72.57, radiusMeters: 12000, city: 'Ahmedabad', state: 'Gujarat', country: 'India' };

describe('resolveCategory', () => {
  test('exact key', () => assert.equal(resolveCategory('dentist').key, 'dentist'));
  test('alias in industry text', () => assert.equal(resolveCategory('other', 'Interior Designers').key, 'interior_design'));
  test('stem alias matches plural', () => assert.equal(resolveCategory('', 'plumbers').key, 'plumber'));
  test('short alias does not match inside a longer word', () => {
    assert.equal(resolveCategory('', 'barber shop').key, 'salon');
    assert.equal(resolveCategory('', 'taxi service'), null);
  });
  test('longest alias wins', () => assert.equal(resolveCategory('', 'medical store').key, 'pharmacy'));
  test('unknown returns null', () => assert.equal(resolveCategory('other', 'Solar Installers'), null));
});

describe('buildQuery', () => {
  test('excludes businesses with websites and chains when website is missing', () => {
    const q = buildQuery({ place, tags: [['amenity', 'cafe']], requirements: { websiteRequirement: 'missing' }, limit: 50 });
    assert.match(q, /nwr\["amenity"~"\^\(cafe\)\$"\]\["name"\]\[!"website"\]\[!"contact:website"\]\[!"url"\]\[!"brand"\]/);
    assert.match(q, /\(around:12000,23\.02,72\.57\)/);
    assert.match(q, /out tags center 50;$/);
  });

  test('uses the area when available', () => {
    const q = buildQuery({ place: { ...place, areaId: 3600001234 }, tags: [['shop', 'bakery']], requirements: {}, limit: 10 });
    assert.match(q, /area\(id:3600001234\)->\.searchArea;/);
    assert.match(q, /\(area\.searchArea\)/);
  });

  test('requires email/phone/website when asked', () => {
    const q = buildQuery({
      place,
      tags: [['shop', 'bakery']],
      requirements: { websiteRequirement: 'required', emailRequired: true, phoneRequired: true },
      limit: 10,
    });
    assert.match(q, /\[~"\^\(website\|contact:website\|url\)\$"~"\."\]/);
    assert.match(q, /\[~"\^\(email\|contact:email\)\$"~"@"\]/);
    assert.match(q, /\[~"\^\(phone\|contact:phone\|mobile\|contact:mobile\)\$"~"\."\]/);
  });

  test('name keywords cannot inject Overpass QL', () => {
    const q = buildQuery({ place, nameKeywords: ['solar"];out;(node(1);//'], requirements: {}, limit: 10 });
    assert.ok(!q.includes('"];out;'), q);
    assert.match(q, /\["name"~"solar out node 1",i\]/);
  });

  test('throws without tags or keywords', () => {
    assert.throws(() => buildQuery({ place, requirements: {}, limit: 10 }));
  });
});

test('sanitizeKeyword keeps unicode letters and strips syntax', () => {
  assert.equal(sanitizeKeyword('Café "x"|y'), 'Café x y');
});

describe('normalizeElement', () => {
  test('maps OSM tags to a lead', () => {
    const lead = normalizeElement(
      {
        type: 'node',
        id: 42,
        lat: 23.1,
        lon: 72.6,
        tags: {
          name: 'Denta Care',
          amenity: 'dentist',
          'addr:housenumber': '13',
          'addr:street': 'CG Road',
          phone: '+91 98 1111 2222; +91 98 3333 4444',
          email: 'MAILTO:Info@Denta.in',
          'contact:facebook': 'https://facebook.com/denta',
        },
      },
      place
    );
    assert.equal(lead.externalId, 'osm_node_42');
    assert.equal(lead.address, '13 CG Road');
    assert.equal(lead.city, 'Ahmedabad');
    assert.equal(lead.phone, '+91 98 1111 2222');
    assert.equal(lead.email, 'info@denta.in');
    assert.equal(lead.website, null);
    assert.equal(lead.social.facebook, 'https://facebook.com/denta');
    assert.equal(lead.sourceUrl, 'https://www.openstreetmap.org/node/42');
  });

  test('uses way centre and prefixes bare website domains', () => {
    const lead = normalizeElement({ type: 'way', id: 7, center: { lat: 1, lon: 2 }, tags: { name: 'X Shop', shop: 'x', website: 'x.com' } }, place);
    assert.equal(lead.latitude, 1);
    assert.equal(lead.website, 'https://x.com');
  });
});

describe('meetsRequirements', () => {
  const base = { name: 'Real Business', website: null, brand: null, email: null, phone: null };
  test('drops businesses with a website or brand when website is missing', () => {
    assert.equal(meetsRequirements(base, { websiteRequirement: 'missing' }), true);
    assert.equal(meetsRequirements({ ...base, website: 'https://a.com' }, { websiteRequirement: 'missing' }), false);
    assert.equal(meetsRequirements({ ...base, brand: "Domino's" }, { websiteRequirement: 'missing' }), false);
  });
  test('enforces email/phone requirements', () => {
    assert.equal(meetsRequirements(base, { emailRequired: true }), false);
    assert.equal(meetsRequirements({ ...base, phone: '1' }, { phoneRequired: true }), true);
  });
  test('drops junk names', () => assert.equal(meetsRequirements({ ...base, name: 'x' }, {}), false));
});

test('phrasesFor turns tag values into search phrases', () => {
  assert.deepEqual(phrasesFor(resolveCategory('cafe')), ['cafe', 'coffee', 'tea']);
});
