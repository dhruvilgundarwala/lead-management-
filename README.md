# AI Lead Finder

Finds **real local businesses that don't have a website** (e.g. "25 dentists in Ahmedabad without a website"),
scores them as sales leads, and helps you write and track outreach. Everything runs on free services.

| Part | Stack |
| --- | --- |
| `client/` | React 19, Vite, TanStack Query, Tailwind |
| `server/` | Node.js 20+, Express 5, MongoDB (Mongoose), Zod |

## How the data is found (free, no API keys)

```
"Find 25 dentists in Ahmedabad without a website"
        │
        ▼  Groq LLM (free tier) → structured query; rule-based parser as fallback
{ category: "dentist", city: "Ahmedabad", websiteRequirement: "missing", limit: 25 }
        │
        ▼  Nominatim (OpenStreetMap geocoder) → search area for the city
        ▼  Overpass API (OpenStreetMap database) → businesses tagged amenity=dentist
        │     with no website / contact:website / url tag, excluding chain brands
        │     (fallback when Overpass is busy: Nominatim POI search)
        ▼
Deduplicate, skip leads you already have, score, save to MongoDB
```

No lead is ever invented: every result links to its OpenStreetMap entry (`source.sourceUrl`).
OSM coverage varies by city and category: restaurants, cafes, clinics, salons, shops and hotels are well mapped;
niche professions (e.g. interior designers) may return only a few results.

## Running locally

Prerequisites: Node.js 20+, MongoDB (local install, or a free MongoDB Atlas cluster).

```bash
# API
cd server
cp .env.example .env       # then fill in JWT_SECRET and GROQ_API_KEY
npm install
npm run dev                # http://localhost:5000/api/v1/health

# Frontend (second terminal)
cd client
npm install
npm run dev                # http://localhost:5173
```

In development, demo accounts are created automatically: `admin@example.com` / `password123`.

```bash
cd server && npm test      # unit tests (no DB or network needed)
```

See [server/README.md](server/README.md) for the API reference, architecture and deployment.
