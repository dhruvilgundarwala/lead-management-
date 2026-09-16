const express = require('express');
const { parsePrompt, executeSearch, getSearchHistory, deleteSearchHistory } = require('../controllers/search.controller');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/parse', protect, parsePrompt);
router.post('/execute', protect, executeSearch);
router.get('/history', protect, getSearchHistory);
router.delete('/history/:id', protect, deleteSearchHistory);

module.exports = router;

