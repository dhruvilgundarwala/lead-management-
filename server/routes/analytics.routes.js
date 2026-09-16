const express = require('express');
const { getAnalyticsStats } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/stats', getAnalyticsStats);

module.exports = router;
