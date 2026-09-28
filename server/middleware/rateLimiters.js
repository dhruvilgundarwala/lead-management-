const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const limiter = ({ windowMinutes, limit, message, perUser = false, ...rest }) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message },
    // Per-user limits must be mounted after `protect` so req.user is populated.
    keyGenerator: perUser ? (req) => (req.user ? `user:${req.user._id}` : ipKeyGenerator(req.ip)) : undefined,
    ...rest,
  });

// Generous global cap; the SPA refetches often.
const apiLimiter = limiter({ windowMinutes: 15, limit: 500, message: 'Too many requests, please slow down.' });

// Brute-force protection on login/register. Successful logins don't count.
const authLimiter = limiter({
  windowMinutes: 15,
  limit: 20,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again in 15 minutes.',
});

// Discovery hits free public APIs (Groq, Nominatim, Overpass); keep usage within their fair-use policies.
const discoveryLimiter = limiter({
  windowMinutes: 15,
  limit: 30,
  perUser: true,
  message: 'Search limit reached. Please wait a few minutes before running more searches.',
});

const aiEmailLimiter = limiter({
  windowMinutes: 60,
  limit: 60,
  perUser: true,
  message: 'Email generation limit reached. Please try again later.',
});

const sendEmailLimiter = limiter({
  windowMinutes: 60,
  limit: 20,
  perUser: true,
  message: 'Hourly send limit reached. Sending too fast can get your mailbox flagged as spam.',
});

module.exports = { apiLimiter, authLimiter, discoveryLimiter, aiEmailLimiter, sendEmailLimiter };
