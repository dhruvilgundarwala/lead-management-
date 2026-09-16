const express = require('express');
const { getFollowUps, createFollowUp, updateFollowUpStatus, deleteFollowUp } = require('../controllers/followup.controller');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/', getFollowUps);
router.post('/', createFollowUp);
router.patch('/:id/status', updateFollowUpStatus);
router.delete('/:id', deleteFollowUp);

module.exports = router;
