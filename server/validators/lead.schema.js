const { z } = require('zod');
const { LEAD_STATUSES, WEBSITE_STATUSES } = require('../models/constants');
const { objectId } = require('./common');

const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

const listLeadsQuery = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  websiteStatus: z.enum(WEBSITE_STATUSES).optional(),
  hasEmail: booleanQuery.optional(),
  hasPhone: booleanQuery.optional(),
  searchId: objectId.optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});

// Only these fields may be edited by the client. Ownership, source and score are server-controlled.
const updateLeadSchema = z
  .object({
    status: z.enum(LEAD_STATUSES),
    notes: z.string().max(5000),
    business: z
      .object({
        name: z.string().trim().min(1).max(200),
        category: z.string().trim().max(100),
        industry: z.string().trim().max(100),
        description: z.string().trim().max(2000),
      })
      .partial()
      .strict(),
    contact: z
      .object({
        email: z.union([z.email().trim().toLowerCase(), z.literal('')]),
        phone: z.string().trim().max(40),
        website: z.string().trim().max(300),
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

module.exports = { listLeadsQuery, updateLeadSchema };
