const Lead = require('../models/Lead');
const verificationService = require('../services/verification/verification.service');

exports.getLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find({ owner: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: leads });
  } catch (error) { next(error); }
};

exports.getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, owner: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) { next(error); }
};

exports.verifyLead = async (req, res, next) => {
  try {
    const lead = await verificationService.verifyLead(req.params.id);
    res.json({ success: true, data: lead, message: 'Lead verified successfully' });
  } catch (error) { next(error); }
};

exports.updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) { next(error); }
};
