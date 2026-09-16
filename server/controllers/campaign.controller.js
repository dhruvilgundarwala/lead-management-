const Campaign = require('../models/Campaign');

exports.getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ owner: req.user._id })
      .populate('leads', 'business contact status')
      .sort('-createdAt');
    res.json({ success: true, data: campaigns });
  } catch (error) { next(error); }
};

exports.createCampaign = async (req, res, next) => {
  try {
    const { name, subject, body, status, leads, scheduledAt } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ success: false, message: 'Name, subject, and body are required' });
    }

    const campaign = await Campaign.create({
      owner: req.user._id,
      name,
      subject,
      body,
      status: status || 'Active',
      leads: leads || [],
      scheduledAt: scheduledAt || new Date(),
      statistics: {
        sent: Array.isArray(leads) ? leads.length : 0,
        opened: 0,
        replied: 0
      }
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

exports.updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

exports.deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) { next(error); }
};
