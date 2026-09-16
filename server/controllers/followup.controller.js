const FollowUp = require('../models/FollowUp');

exports.getFollowUps = async (req, res, next) => {
  try {
    const followUps = await FollowUp.find({ owner: req.user._id })
      .populate('lead', 'business contact status score')
      .sort('scheduledAt');
    res.json({ success: true, data: followUps });
  } catch (error) { next(error); }
};

exports.createFollowUp = async (req, res, next) => {
  try {
    const { lead, scheduledAt, note, priority } = req.body;
    if (!lead || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Lead ID and scheduledAt date are required' });
    }

    const followUp = await FollowUp.create({
      owner: req.user._id,
      lead,
      scheduledAt,
      note,
      priority: priority || 'Medium'
    });

    const populated = await FollowUp.findById(followUp._id).populate('lead', 'business contact status score');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

exports.updateFollowUpStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const followUp = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status },
      { new: true }
    ).populate('lead', 'business contact status score');

    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, data: followUp });
  } catch (error) { next(error); }
};

exports.deleteFollowUp = async (req, res, next) => {
  try {
    const followUp = await FollowUp.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, message: 'Follow-up deleted' });
  } catch (error) { next(error); }
};
