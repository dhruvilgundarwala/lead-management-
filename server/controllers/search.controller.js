const aiService = require('../services/ai/ai.service');
const searchService = require('../services/search.service');
const Search = require('../models/Search');
const AppError = require('../utils/AppError');
const { parsedQuerySchema } = require('../validators/search.schema');

exports.parsePrompt = async (req, res) => {
  const raw = await aiService.parseSearchPrompt(req.validated.body.prompt);
  // Throws a 400 with a friendly message (e.g. no city mentioned) if the prompt couldn't be understood.
  const parsedQuery = parsedQuerySchema.parse(raw);
  res.json({ success: true, data: parsedQuery });
};

exports.executeSearch = async (req, res) => {
  const { prompt, parsedQuery } = req.validated.body;
  const result = await searchService.runSearch({ user: req.user, prompt, parsedQuery });
  res.json({ success: true, data: result });
};

exports.getSearchHistory = async (req, res) => {
  const searches = await Search.find({ user: req.user._id }).sort('-createdAt').limit(200);
  res.json({ success: true, data: searches });
};

exports.deleteSearchHistory = async (req, res) => {
  const search = await Search.findOneAndDelete({ _id: req.validated.params.id, user: req.user._id });
  if (!search) throw AppError.notFound('Search history item');
  res.json({ success: true, message: 'Search history deleted' });
};
