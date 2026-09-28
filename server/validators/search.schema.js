const { z } = require('zod');
const { WEBSITE_REQUIREMENTS } = require('../models/constants');

const optionalText = (max) => z.string().trim().max(max).nullish().transform((v) => v ?? '');

/**
 * Shape of a structured search. Used both to normalise the AI's output and to validate what the
 * client sends back to /execute (the user may have edited it). Lenient `.catch` defaults keep a
 * slightly-off AI response usable; the city is the only hard requirement.
 */
const parsedQuerySchema = z.object({
  industry: optionalText(100),
  category: z.string().trim().toLowerCase().max(60).nullish().transform((v) => v || 'other'),
  keywords: z.array(z.string().trim().max(40)).max(5).catch([]).default([]),
  location: z.object(
    {
      city: z.string({ error: 'Please mention a city or area to search in' }).trim().min(1, 'Please mention a city or area to search in').max(100),
      state: optionalText(100),
      country: optionalText(100),
    },
    { error: 'Please mention a city or area to search in' }
  ),
  limit: z.coerce.number().int().min(1).max(100).catch(20).default(20),
  websiteRequirement: z.enum(WEBSITE_REQUIREMENTS).catch('any').default('any'),
  emailRequired: z.boolean().catch(false).default(false),
  phoneRequired: z.boolean().catch(false).default(false),
  filters: z.array(z.string().max(100)).max(10).catch([]).default([]),
});

const parsePromptSchema = z.object({
  prompt: z.string().trim().min(3, 'Please describe what you are looking for').max(500),
});

const executeSearchSchema = z.object({
  prompt: z.string().trim().min(3).max(500),
  parsedQuery: parsedQuerySchema,
});

module.exports = { parsedQuerySchema, parsePromptSchema, executeSearchSchema };
