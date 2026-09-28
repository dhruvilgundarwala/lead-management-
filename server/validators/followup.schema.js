const { z } = require('zod');
const { FOLLOW_UP_STATUSES, PRIORITIES } = require('../models/constants');
const { objectId } = require('./common');

const createFollowUpSchema = z.object({
  lead: objectId,
  scheduledAt: z.coerce.date({ error: 'A valid date is required' }),
  note: z.string().trim().max(2000).optional(),
  priority: z.enum(PRIORITIES).default('Medium'),
});

const updateFollowUpStatusSchema = z.object({
  status: z.enum(FOLLOW_UP_STATUSES),
});

module.exports = { createFollowUpSchema, updateFollowUpStatusSchema };
