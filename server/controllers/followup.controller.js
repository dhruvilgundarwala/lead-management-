const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');
const AppError = require('../utils/AppError');

const LEAD_FIELDS = 'business contact status score';

exports.getFollowUps = async (req, res) => {
  const followUps = await FollowUp.find({ owner: req.user._id }).populate('lead', LEAD_FIELDS).sort('scheduledAt');
  res.json({ success: true, data: followUps });
};

exports.createFollowUp = async (req, res) => {
  const { lead, scheduledAt, note, priority } = req.validated.body;

  if (!(await Lead.exists({ _id: lead, owner: req.user._id }))) throw AppError.notFound('Lead');

  const followUp = await FollowUp.create({ owner: req.user._id, lead, scheduledAt, note, priority });
  await followUp.populate('lead', LEAD_FIELDS);
  res.status(201).json({ success: true, data: followUp });
};

exports.updateFollowUpStatus = async (req, res) => {
  const followUp = await FollowUp.findOneAndUpdate(
    { _id: req.validated.params.id, owner: req.user._id },
    { status: req.validated.body.status },
    { returnDocument: 'after', runValidators: true }
  ).populate('lead', LEAD_FIELDS);

  if (!followUp) throw AppError.notFound('Follow-up');
  res.json({ success: true, data: followUp });
};

exports.deleteFollowUp = async (req, res) => {
  const followUp = await FollowUp.findOneAndDelete({ _id: req.validated.params.id, owner: req.user._id });
  if (!followUp) throw AppError.notFound('Follow-up');
  res.json({ success: true, message: 'Follow-up deleted' });
};
