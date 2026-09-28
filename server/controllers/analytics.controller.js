const Lead = require('../models/Lead');
const Search = require('../models/Search');
const Campaign = require('../models/Campaign');
const FollowUp = require('../models/FollowUp');

const CONTACTED = ['CONTACTED', 'FOLLOW_UP_DUE', 'FOLLOW_UP_SENT', 'REPLIED', 'QUALIFIED', 'WON'];
const POSITIVE = ['REPLIED', 'QUALIFIED', 'WON'];
const present = { $nin: [null, ''] };
const absent = { $in: [null, ''] }; // also matches documents where the field doesn't exist

const percentage = (part, whole) => (whole > 0 ? ((part / whole) * 100).toFixed(1) : 0);

exports.getAnalyticsStats = async (req, res) => {
  const owner = req.user._id;

  const [
    totalLeads,
    totalSearches,
    totalCampaigns,
    totalFollowUps,
    contactedLeads,
    positiveReplies,
    leadsWithEmail,
    leadsWithPhone,
    leadsWithoutWebsite,
    industryStats,
    statusStats,
  ] = await Promise.all([
    Lead.countDocuments({ owner }),
    Search.countDocuments({ user: owner }),
    Campaign.countDocuments({ owner }),
    FollowUp.countDocuments({ owner }),
    Lead.countDocuments({ owner, status: { $in: CONTACTED } }),
    Lead.countDocuments({ owner, status: { $in: POSITIVE } }),
    Lead.countDocuments({ owner, 'contact.email': present }),
    Lead.countDocuments({ owner, 'contact.phone': present }),
    Lead.countDocuments({ owner, 'contact.website': absent }),
    Lead.aggregate([
      { $match: { owner } },
      { $group: { _id: '$business.industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Lead.aggregate([{ $match: { owner } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    data: {
      summary: {
        totalLeads,
        contactedLeads,
        positiveReplies,
        totalSearches,
        totalCampaigns,
        totalFollowUps,
        conversionRate: percentage(contactedLeads, totalLeads),
        replyRate: percentage(positiveReplies, contactedLeads),
        leadsWithEmail,
        leadsWithPhone,
        leadsWithoutWebsite,
      },
      industryBreakdown: industryStats.map((i) => ({ industry: i._id || 'Unspecified', count: i.count })),
      statusBreakdown: statusStats.map((s) => ({ status: s._id, count: s.count })),
    },
  });
};
