const aiService = require('../services/ai/ai.service');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');

exports.generateEmail = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { context } = req.body;
    
    const lead = await Lead.findOne({ _id: leadId, owner: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const emailDraft = await aiService.generateEmail(lead, context || 'They have no website and you want to build one for them.');
    
    res.json({ success: true, data: emailDraft });
  } catch (error) {
    next(error);
  }
};

exports.sendEmail = async (req, res, next) => {
  try {
    const { leadId, subject, body, recipientEmail } = req.body;

    const lead = await Lead.findOne({ _id: leadId, owner: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Update lead status to CONTACTED
    lead.status = 'CONTACTED';
    await lead.save();

    // Optionally log into default campaign
    await Campaign.create({
      owner: req.user._id,
      name: `Outreach to ${lead.business.name}`,
      subject,
      body,
      status: 'Completed',
      leads: [lead._id],
      statistics: { sent: 1, opened: 0, replied: 0 }
    });

    res.json({
      success: true,
      message: `Email dispatched successfully to ${recipientEmail || lead.contact.email || 'recipient'}`,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

