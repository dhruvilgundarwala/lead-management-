const { z } = require('zod');

const email = z.email('Invalid email address').trim().toLowerCase().max(254);

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  company: z.string().trim().max(120).optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});

module.exports = { registerSchema, loginSchema };
