const express = require('express');
const { getCampaigns, createCampaign, updateCampaign, deleteCampaign } = require('../controllers/campaign.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { createCampaignSchema, updateCampaignSchema } = require('../validators/campaign.schema');

const router = express.Router();

router.use(protect);

router.get('/', getCampaigns);
router.post('/', validate({ body: createCampaignSchema }), createCampaign);
router.put('/:id', validate({ params: idParam, body: updateCampaignSchema }), updateCampaign);
router.delete('/:id', validate({ params: idParam }), deleteCampaign);

module.exports = router;
