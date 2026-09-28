const express = require('express');
const { getLeads, getLead, verifyLead, updateLead, deleteLead } = require('../controllers/lead.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { discoveryLimiter } = require('../middleware/rateLimiters');
const { idParam } = require('../validators/common');
const { listLeadsQuery, updateLeadSchema } = require('../validators/lead.schema');

const router = express.Router();

router.use(protect);

router.get('/', validate({ query: listLeadsQuery }), getLeads);
router.get('/:id', validate({ params: idParam }), getLead);
router.patch('/:id', validate({ params: idParam, body: updateLeadSchema }), updateLead);
router.delete('/:id', validate({ params: idParam }), deleteLead);
router.post('/:id/verify', discoveryLimiter, validate({ params: idParam }), verifyLead);

module.exports = router;
