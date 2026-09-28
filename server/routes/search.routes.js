const express = require('express');
const { parsePrompt, executeSearch, getSearchHistory, deleteSearchHistory } = require('../controllers/search.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { discoveryLimiter } = require('../middleware/rateLimiters');
const { idParam } = require('../validators/common');
const { parsePromptSchema, executeSearchSchema } = require('../validators/search.schema');

const router = express.Router();

router.use(protect);

router.post('/parse', discoveryLimiter, validate({ body: parsePromptSchema }), parsePrompt);
router.post('/execute', discoveryLimiter, validate({ body: executeSearchSchema }), executeSearch);
router.get('/history', getSearchHistory);
router.delete('/history/:id', validate({ params: idParam }), deleteSearchHistory);

module.exports = router;
