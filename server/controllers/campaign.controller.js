const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');
const AppError = require('../utils/AppError');

/** Ensures every referenced lead belongs to the user, so campaigns can't point at other users' data. */
const assertOwnLeads = async (leadIds, ownerId) => {
  const unique = [...new Set(leadIds)];
  if (!unique.length) return unique;
  const count = await Lead.countDocuments({ _id: { $in: unique }, owner: ownerId });
  if (count !== unique.length) throw AppError.badRequest('One or more selected leads were not found');
  return unique;
};

exports.getCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({ owner: req.user._id })
    .populate('leads', 'business contact status')
    .sort('-createdAt');
  res.json({ success: true, data: campaigns });
};

exports.createCampaign = async (req, res) => {
  const body = req.validated.body;
  const leads = await assertOwnLeads(body.leads, req.user._id);

  const campaign = await Campaign.create({
    ...body,
    owner: req.user._id,
    leads,
    scheduledAt: body.scheduledAt || new Date(),
    // Statistics start at zero; only emails actually sent are counted.
    statistics: { sent: 0, opened: 0, replied: 0 },
  });

  res.status(201).json({ success: true, data: campaign });
};

exports.updateCampaign = async (req, res) => {
  const updates = { ...req.validated.body };
  if (updates.leads) updates.leads = await assertOwnLeads(updates.leads, req.user._id);

  const campaign = await Campaign.findOneAndUpdate({ _id: req.validated.params.id, owner: req.user._id }, updates, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!campaign) throw AppError.notFound('Campaign');
  res.json({ success: true, data: campaign });
};

exports.deleteCampaign = async (req, res) => {
  const campaign = await Campaign.findOneAndDelete({ _id: req.validated.params.id, owner: req.user._id });
  if (!campaign) throw AppError.notFound('Campaign');
  res.json({ success: true, message: 'Campaign deleted successfully' });
};
