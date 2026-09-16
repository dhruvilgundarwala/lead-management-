const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Built-in middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/searches', require('./routes/search.routes'));
app.use('/api/v1/leads', require('./routes/lead.routes'));
app.use('/api/v1/emails', require('./routes/email.routes'));
app.use('/api/v1/campaigns', require('./routes/campaign.routes'));
app.use('/api/v1/follow-ups', require('./routes/followup.routes'));
app.use('/api/v1/analytics', require('./routes/analytics.routes'));


// Basic route for testing
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'AI Lead Finder API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: env.NODE_ENV === 'production' ? null : err.stack,
  });
});

module.exports = app;
