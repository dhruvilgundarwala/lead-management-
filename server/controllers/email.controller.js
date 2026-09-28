const aiService = require('../services/ai/ai.service');
const mailer = require('../services/email/mailer.service');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const AppError = require('../utils/AppError');

// Statuses that come before first contact; sending moves these to CONTACTED.
const PRE_CONTACT_STATUSES = ['NEW', 'READY'];

exports.generateEmail = async (req, res) => {
  const lead = await Lead.findOne({ _id: req.validated.params.leadId, owner: req.user._id });
  if (!lead) throw AppError.notFound('Lead');

  const draft = await aiService.generateEmail(lead, {
    context: req.validated.body.context,
    tone: req.user.preferences?.emailTone,
    senderName: req.user.name,
    senderCompany: req.user.company,
  });

  res.json({ success: true, data: draft });
};

exports.sendEmail = async (req, res) => {
  const { leadId, subject, body, recipientEmail } = req.validated.body;

  const lead = await Lead.findOne({ _id: leadId, owner: req.user._id });
  if (!lead) throw AppError.notFound('Lead');

  const to = recipientEmail || lead.contact?.email;
  if (!to) throw AppError.badRequest('This lead has no email address. Add one or contact them by phone.');

  if (!mailer.isEnabled()) {
    throw new AppError(
      'Sending from the app is not set up on the server (SMTP settings missing). Use "Open in mail app" or copy the email instead.',
      503
    );
  }

  try {
    await mailer.sendMail({ to, subject, text: body, replyTo: req.user.email, fromName: req.user.name });
  } catch (err) {
    console.error(`[email] SMTP send failed: ${err.message}`);
    throw new AppError('The email could not be sent. Check the SMTP settings on the server.', 502);
  }

  if (PRE_CONTACT_STATUSES.includes(lead.status)) lead.status = 'CONTACTED';
  await lead.save();

  await Campaign.create({
    owner: req.user._id,
    name: `Outreach to ${lead.business.name}`,
    subject,
    body,
    status: 'Completed',
    leads: [lead._id],
    statistics: { sent: 1, opened: 0, replied: 0 },
  });

  res.json({ success: true, message: `Email sent to ${to}`, data: lead });
};
