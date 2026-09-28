process.env.NODE_ENV = 'test';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const aiService = require('../services/ai/ai.service');
const { parsedQuerySchema } = require('../validators/search.schema');

const parse = (prompt) => parsedQuerySchema.parse(aiService.fallbackParsePrompt(prompt));

describe('fallback prompt parser', () => {
  test('parses the example prompt from the UI', () => {
    const q = parse('Find 25 interior designers in Ahmedabad without a website and with a public email address.');
    assert.equal(q.limit, 25);
    assert.equal(q.location.city, 'Ahmedabad');
    assert.equal(q.category, 'interior_design');
    assert.equal(q.websiteRequirement, 'missing');
    assert.equal(q.emailRequired, true);
    assert.equal(q.phoneRequired, false);
  });

  test('handles "with a website" and multi-word cities', () => {
    const q = parse('Find cafes in New York with a website');
    assert.equal(q.location.city, 'New York');
    assert.equal(q.category, 'cafe');
    assert.equal(q.websiteRequirement, 'required');
  });

  test('defaults to any website and limit 20', () => {
    const q = parse('dentists near Surat');
    assert.equal(q.websiteRequirement, 'any');
    assert.equal(q.limit, 20);
    assert.equal(q.location.city, 'Surat');
  });

  test('"no email" does not require email', () => {
    assert.equal(parse('salons in Pune with no email').emailRequired, false);
  });

  test('rejects prompts without a location', () => {
    assert.throws(() => parse('find some plumbers'), /city or area/);
  });
});

describe('parseSearchPrompt', () => {
  test('explicit website/email phrases override a wrong AI answer', async (t) => {
    t.mock.method(aiService, 'completeJson', async () => ({
      industry: 'Dentists',
      category: 'dentist',
      location: { city: 'Ahmedabad' },
      websiteRequirement: 'any',
      emailRequired: false,
    }));
    const q = parsedQuerySchema.parse(await aiService.parseSearchPrompt('Find dentists in Ahmedabad without a website with email'));
    assert.equal(q.websiteRequirement, 'missing');
    assert.equal(q.emailRequired, true);
    assert.equal(q.industry, 'Dentists');
  });

  test('falls back to rules when the AI is unavailable', async (t) => {
    t.mock.method(aiService, 'completeJson', async () => null);
    const q = parsedQuerySchema.parse(await aiService.parseSearchPrompt('bakeries in Pune'));
    assert.equal(q.category, 'bakery');
    assert.equal(q.location.city, 'Pune');
  });
});

describe('parsedQuerySchema', () => {
  test('clamps and repairs sloppy AI output', () => {
    const q = parsedQuerySchema.parse({
      industry: 'Bakeries',
      category: 'BAKERY',
      location: { city: ' Pune ', state: null },
      limit: 5000,
      websiteRequirement: 'nope',
      emailRequired: 'yes',
    });
    assert.equal(q.category, 'bakery');
    assert.equal(q.location.city, 'Pune');
    assert.equal(q.location.state, '');
    assert.equal(q.limit, 20);
    assert.equal(q.websiteRequirement, 'any');
    assert.equal(q.emailRequired, false);
  });
});
