# AI Lead Finder API

Express 5 + MongoDB API that discovers real businesses from OpenStreetMap, with AI-assisted search
parsing and email drafting via Groq's free tier.

## Project structure

```
server/
├── server.js                 # start-up, graceful shutdown
├── app.js                    # middleware pipeline and routes
├── config/                   # env validation (Zod), DB connection, dev seed users
├── middleware/               # auth (JWT), validate (Zod), rate limits, error handler
├── validators/               # request schemas, one file per resource
├── models/                   # Mongoose schemas + shared enums (constants.js)
├── controllers/              # thin HTTP handlers
├── services/
│   ├── ai/                   # Groq prompt parsing + email drafting (with non-AI fallbacks)
│   ├── discovery/            # categories → OSM tags, Nominatim + Overpass providers
│   ├── verification/         # website/email checks, SSRF-safe HTTP client
│   ├── email/                # optional SMTP sending (nodemailer)
│   ├── search.service.js     # runs a search, dedupes, stores leads + history
│   └── scoring.service.js    # opportunity score 0-100
└── tests/                    # node:test unit tests
```

## Environment variables

See [.env.example](.env.example). The server validates them at start-up and refuses to boot in
production with a weak `JWT_SECRET`.

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | local or MongoDB Atlas (free M0) |
| `JWT_SECRET` | prod | ≥ 32 random characters |
| `CLIENT_URL` | prod | allowed browser origins, comma-separated |
| `GROQ_API_KEY` | no | free at console.groq.com; without it, rule-based parsing and templates are used |
| `OSM_USER_AGENT` | no | identify your app to OpenStreetMap |
| `SMTP_*`, `EMAIL_FROM` | no | enables "Send" in the app (e.g. Gmail App Password) |
| `TRUST_PROXY` | prod | `1` behind Render/Railway so rate limits see real IPs |

## API

All routes are under `/api/v1`. Responses are `{ success, data?, message?, errors? }`.
Protected routes need `Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | API + database status |
| POST | `/auth/register` | `{ name, email, password (≥8), company? }` |
| POST | `/auth/login` | `{ email, password }` → token |
| GET | `/auth/me` | current user |
| POST | `/searches/parse` | `{ prompt }` → structured query (preview) |
| POST | `/searches/execute` | `{ prompt, parsedQuery }` → `{ search, leads }` |
| GET | `/searches/history` | past searches with stats, matched location and data source |
| DELETE | `/searches/history/:id` | |
| GET | `/leads` | filters: `status, websiteStatus, hasEmail, hasPhone, searchId, q, page, limit` |
| GET/PATCH/DELETE | `/leads/:id` | PATCH accepts only `status, notes, business.*, contact.email/phone/website` |
| POST | `/leads/:id/verify` | checks website is live, scrapes a public email, validates email domain (MX) |
| POST | `/emails/generate/:leadId` | `{ context? }` → `{ subject, body }` |
| POST | `/emails/send` | `{ leadId, subject, body, recipientEmail? }`; returns 503 if SMTP isn't configured |
| GET/POST | `/campaigns` | |
| PUT/DELETE | `/campaigns/:id` | |
| GET/POST | `/follow-ups` | |
| PATCH | `/follow-ups/:id/status` | `{ status: Pending \| Completed \| Cancelled }` |
| DELETE | `/follow-ups/:id` | |
| GET | `/analytics/stats` | dashboard counts and breakdowns |

## Lead scoring

| Signal | Points |
| --- | --- |
| Email (not known invalid) | +30 |
| Phone | +25 |
| Street address | +10 |
| Facebook/Instagram page | +5 |
| No website | +30 |
| Website listed but dead | +20 |

## Security measures

- Input validated with Zod on every route; unknown fields rejected (no mass assignment, no NoSQL operator injection).
- Every query is scoped to the logged-in user, including leads referenced by campaigns and follow-ups.
- Passwords hashed with bcrypt (cost 12); constant-time login to avoid user enumeration.
- Lead website checks go through an SSRF-safe client: http(s) only, ports 80/443, and every resolved IP
  (including after redirects) must be public.
- User text sent to Overpass is reduced to letters/digits/spaces, so queries can't be injected.
- Helmet headers, CORS allowlist, 100 KB body limit, rate limits (global, login, search, AI, sending).
- Errors are centralised; stack traces and internal messages are never sent in production.

## Free usage limits to respect

- **Nominatim**: max 1 request/second (enforced by a built-in queue); results cached for 24h.
- **Overpass**: shared public server; can be busy at peak times. The app then falls back to Nominatim for 2 minutes.
- **Groq**: free tier rate limits apply; the app falls back to non-AI logic if a call fails.

## Deploying for free

1. **Database**: MongoDB Atlas → create a free M0 cluster → copy the `mongodb+srv://` URI
   → under Network Access allow `0.0.0.0/0` (Render's IPs are not fixed).
2. **API**: Render → New Web Service → root directory `server`, build `npm install`, start `npm start`.
   Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL=https://<your-frontend>`,
   `TRUST_PROXY=1`, `GROQ_API_KEY`. (Free instances sleep after inactivity; the first request takes ~1 min.)
3. **Frontend**: Vercel or Netlify → root `client`, build `npm run build`, output `dist`,
   env `VITE_API_URL=https://<your-api>.onrender.com/api/v1`.
