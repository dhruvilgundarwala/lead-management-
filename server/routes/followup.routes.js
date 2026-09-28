const express = require('express');
const { getFollowUps, createFollowUp, updateFollowUpStatus, deleteFollowUp } = require('../controllers/followup.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { createFollowUpSchema, updateFollowUpStatusSchema } = require('../validators/followup.schema');

const router = express.Router();

router.use(protect);

router.get('/', getFollowUps);
router.post('/', validate({ body: createFollowUpSchema }), createFollowUp);
router.patch('/:id/status', validate({ params: idParam, body: updateFollowUpStatusSchema }), updateFollowUpStatus);
router.delete('/:id', validate({ params: idParam }), deleteFollowUp);

module.exports = router;
