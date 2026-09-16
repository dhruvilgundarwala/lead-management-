const Lead = require('../models/Lead');
const Search = require('../models/Search');
const Campaign = require('../models/Campaign');
const FollowUp = require('../models/FollowUp');

exports.getAnalyticsStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalLeads, totalSearches, totalCampaigns, totalFollowUps] = await Promise.all([
      Lead.countDocuments({ owner: userId }),
      Search.countDocuments({ user: userId }),
      Campaign.countDocuments({ owner: userId }),
      FollowUp.countDocuments({ owner: userId })
    ]);

    const contactedLeads = await Lead.countDocuments({
      owner: userId,
      status: { $in: ['CONTACTED', 'FOLLOW_UP_DUE', 'FOLLOW_UP_SENT', 'REPLIED', 'QUALIFIED', 'WON'] }
    });

    const positiveReplies = await Lead.countDocuments({
      owner: userId,
      status: { $in: ['REPLIED', 'QUALIFIED', 'WON'] }
    });

    const leadsWithEmail = await Lead.countDocuments({
      owner: userId,
      'contact.email': { $ne: null, $exists: true }
    });

    const leadsWithPhone = await Lead.countDocuments({
      owner: userId,
      'contact.phone': { $ne: null, $exists: true }
    });

    const leadsWithoutWebsite = await Lead.countDocuments({
      owner: userId,
      $or: [{ 'contact.website': null }, { 'contact.website': '' }]
    });

    // Industry aggregation
    const industryStats = await Lead.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: '$business.industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Status breakdown
    const statusStats = await Lead.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const conversionRate = totalLeads > 0 ? ((contactedLeads / totalLeads) * 100).toFixed(1) : 0;
    const replyRate = contactedLeads > 0 ? ((positiveReplies / contactedLeads) * 100).toFixed(1) : 0;

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
          conversionRate,
          replyRate,
          leadsWithEmail,
          leadsWithPhone,
          leadsWithoutWebsite
        },
        industryBreakdown: industryStats.map(i => ({ industry: i._id || 'Unspecified', count: i.count })),
        statusBreakdown: statusStats.map(s => ({ status: s._id, count: s.count }))
      }
    });
  } catch (error) { next(error); }
};
