const express = require('express');
const { getCampaigns, createCampaign, updateCampaign, deleteCampaign } = require('../controllers/campaign.controller');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/', getCampaigns);
router.post('/', createCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

module.exports = router;
