const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const { z } = require('zod');

const booleanString = z.enum(['true', 'false']).transform((v) => v === 'true');
const csv = (value) => value.split(',').map((s) => s.trim()).filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/ai-leads'),

  JWT_SECRET: z.string().min(1).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Comma-separated list of allowed browser origins, e.g. "http://localhost:5173,https://myapp.vercel.app"
  CLIENT_URL: z.string().default('http://localhost:5173'),
  // Number of reverse proxies in front of the app (1 on Render/Railway/Heroku). Needed for correct client IPs.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  SEED_DEMO_USERS: booleanString.optional(),

  GROQ_API_KEY: z.string().optional(),
  // Tried in order. Groq retires models regularly; current list: https://console.groq.com/docs/models
  GROQ_MODELS: z.string().default('openai/gpt-oss-120b,openai/gpt-oss-20b,qwen/qwen3.8-27b'),

  // OpenStreetMap services are free but require an identifying User-Agent.
  // Nominatim policy: https://operations.osmfoundation.org/policies/nominatim/
  OSM_USER_AGENT: z.string().default('AILeadFinder/1.0 (student project)'),
  NOMINATIM_URL: z.url().default('https://nominatim.openstreetmap.org'),
  // Tried in order. More public instances: https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances
  OVERPASS_URLS: z.string().default('https://overpass-api.de/api/interpreter'),

  // Optional SMTP for actually sending emails (e.g. Gmail with an App Password, or Brevo's free tier).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanString.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

// Treat `KEY=` (empty) in .env the same as an unset variable.
const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const e = parsed.data;
const isProd = e.NODE_ENV === 'production';

if (isProd && (!e.JWT_SECRET || e.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production');
}
if (!isProd && (!e.JWT_SECRET || e.JWT_SECRET.length < 32) && e.NODE_ENV !== 'test') {
  console.warn('[env] JWT_SECRET is missing or shorter than 32 characters. This is fine locally but will be rejected in production.');
}
if (isProd && e.SEED_DEMO_USERS) {
  throw new Error('SEED_DEMO_USERS must not be enabled in production');
}

module.exports = Object.freeze({
  ...e,
  JWT_SECRET: e.JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-production',
  isProd,
  corsOrigins: csv(e.CLIENT_URL).map((o) => o.replace(/\/$/, '')),
  groqModels: csv(e.GROQ_MODELS),
  overpassUrls: csv(e.OVERPASS_URLS),
  seedDemoUsers: e.SEED_DEMO_USERS ?? e.NODE_ENV === 'development',
  smtpEnabled: Boolean(e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS),
});
