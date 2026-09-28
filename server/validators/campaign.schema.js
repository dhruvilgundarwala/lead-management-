const { z } = require('zod');
const { CAMPAIGN_STATUSES } = require('../models/constants');
const { objectId } = require('./common');

const campaignFields = {
  name: z.string().trim().min(1, 'Name is required').max(120),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  body: z.string().trim().min(1, 'Body is required').max(10000),
  status: z.enum(CAMPAIGN_STATUSES),
  leads: z.array(objectId).max(500),
  scheduledAt: z.coerce.date(),
};

const createCampaignSchema = z.object({
  ...campaignFields,
  status: campaignFields.status.default('Active'),
  leads: campaignFields.leads.default([]),
  scheduledAt: campaignFields.scheduledAt.optional(),
});

const updateCampaignSchema = z.object(campaignFields).partial().strict();

module.exports = { createCampaignSchema, updateCampaignSchema };
