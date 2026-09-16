const aiService = require('../services/ai/ai.service');
const discoveryService = require('../services/discovery/discovery.service');
const Search = require('../models/Search');
const Lead = require('../models/Lead');

exports.parsePrompt = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });
    const parsedQuery = await aiService.parseSearchPrompt(prompt);
    res.json({ success: true, data: parsedQuery });
  } catch (error) { next(error); }
};

exports.executeSearch = async (req, res, next) => {
  try {
    const { prompt, parsedQuery } = req.body;
    if (!parsedQuery || !prompt) {
      return res.status(400).json({ success: false, message: 'Parsed query and prompt are required' });
    }

    const search = await Search.create({
      user: req.user._id,
      originalPrompt: prompt,
      parsedQuery,
      status: 'PROCESSING'
    });
    
    const rawLeads = await discoveryService.discoverLeads(parsedQuery);
    
    let duplicatesRemoved = 0;
    let leadsCreated = 0;
    const createdLeads = [];

    for (const raw of rawLeads) {
      const exists = await Lead.findOne({ owner: req.user._id, 'source.externalId': raw.externalId });
      if (exists) {
        duplicatesRemoved++;
        continue;
      }

      let score = 0;
      if (raw.email) score += 30;
      if (raw.phone) score += 10;
      if (raw.website) score += 10;
      if (raw.address) score += 10;

      const lead = new Lead({
        owner: req.user._id,
        business: {
          name: raw.name,
          category: raw.category,
          industry: parsedQuery.industry
        },
        location: {
          address: raw.address,
          city: raw.city,
          state: raw.state,
          country: raw.country,
          latitude: raw.latitude,
          longitude: raw.longitude
        },
        contact: {
          email: raw.email,
          phone: raw.phone,
          website: raw.website,
        },
        source: {
          provider: raw.source,
          externalId: raw.externalId,
          sourceUrl: raw.sourceUrl
        },
        score,
        searchId: search._id
      });
      await lead.save();
      createdLeads.push(lead);
      leadsCreated++;
    }

    search.statistics = {
      discovered: rawLeads.length,
      duplicatesRemoved,
      leadsCreated
    };
    search.status = 'COMPLETED';
    search.completedAt = new Date();
    await search.save();

    res.json({
      success: true,
      data: {
        search,
        leads: createdLeads
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getSearchHistory = async (req, res, next) => {
  try {
    const searches = await Search.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: searches });
  } catch (error) { next(error); }
};

exports.deleteSearchHistory = async (req, res, next) => {
  try {
    const search = await Search.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!search) return res.status(404).json({ success: false, message: 'Search history item not found' });
    res.json({ success: true, message: 'Search history deleted' });
  } catch (error) { next(error); }
};

