const express = require('express');
const { getLeads, getLead, verifyLead, updateLead } = require('../controllers/lead.controller');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .get(getLeads);

router.route('/:id')
  .get(getLead)
  .patch(updateLead);

router.post('/:id/verify', verifyLead);

module.exports = router;
