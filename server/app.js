const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { isDBConnected } = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);

app.use(helmet());
// Vite moves to 5174, 5175... when 5173 is taken, so any localhost port is accepted outside production.
const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const isAllowedOrigin = (origin) =>
  env.corsOrigins.includes(origin.replace(/\/$/, '')) || (!env.isProd && LOCALHOST_ORIGIN.test(origin));

app.use(
  cors({
    // Requests without an Origin header (curl, server-to-server) are allowed; browsers must be on the allowlist.
    origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
  })
);
app.use(express.json({ limit: '100kb' }));
if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

app.get('/api/v1/health', (req, res) => {
  const db = isDBConnected();
  res.status(db ? 200 : 503).json({
    success: db,
    message: 'AI Lead Finder API',
    database: db ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/searches', require('./routes/search.routes'));
app.use('/api/v1/leads', require('./routes/lead.routes'));
app.use('/api/v1/emails', require('./routes/email.routes'));
app.use('/api/v1/campaigns', require('./routes/campaign.routes'));
app.use('/api/v1/follow-ups', require('./routes/followup.routes'));
app.use('/api/v1/analytics', require('./routes/analytics.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
