const Lead = require('../models/Lead');
const verificationService = require('../services/verification/verification.service');
const { scoreLead } = require('../services/scoring.service');
const AppError = require('../utils/AppError');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Flattens { contact: { email } } into { 'contact.email': ... } so partial updates don't wipe siblings. */
const flatten = (obj, prefix = '') =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) Object.assign(acc, flatten(value, path));
    else acc[path] = value;
    return acc;
  }, {});

exports.getLeads = async (req, res) => {
  const { status, websiteStatus, hasEmail, hasPhone, searchId, q, page, limit } = req.validated.query;

  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (websiteStatus) filter['contact.websiteStatus'] = websiteStatus;
  if (searchId) filter.searchId = searchId;
  if (hasEmail !== undefined) filter['contact.email'] = hasEmail ? { $nin: [null, ''] } : { $in: [null, ''] };
  if (hasPhone !== undefined) filter['contact.phone'] = hasPhone ? { $nin: [null, ''] } : { $in: [null, ''] };
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ 'business.name': regex }, { 'location.city': regex }, { 'business.category': regex }];
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Lead.countDocuments(filter),
  ]);

  res.json({ success: true, data: leads, meta: { total, page, limit } });
};

exports.getLead = async (req, res) => {
  const lead = await Lead.findOne({ _id: req.validated.params.id, owner: req.user._id });
  if (!lead) throw AppError.notFound('Lead');
  res.json({ success: true, data: lead });
};

exports.updateLead = async (req, res) => {
  const lead = await Lead.findOne({ _id: req.validated.params.id, owner: req.user._id });
  if (!lead) throw AppError.notFound('Lead');

  const updates = req.validated.body;
  lead.set(flatten(updates));

  // Edited contact details need re-verification.
  if (updates.contact?.website !== undefined) lead.contact.websiteStatus = updates.contact.website ? 'unknown' : 'not_listed';
  if (updates.contact?.email !== undefined) lead.contact.emailStatus = updates.contact.email ? 'unknown' : 'not_found';
  lead.score = scoreLead(lead);

  await lead.save();
  res.json({ success: true, data: lead });
};

exports.deleteLead = async (req, res) => {
  const lead = await Lead.findOneAndDelete({ _id: req.validated.params.id, owner: req.user._id });
  if (!lead) throw AppError.notFound('Lead');
  res.json({ success: true, message: 'Lead deleted' });
};

exports.verifyLead = async (req, res) => {
  const lead = await verificationService.verifyLead(req.validated.params.id, req.user._id);
  res.json({ success: true, data: lead, message: 'Lead verified successfully' });
};
