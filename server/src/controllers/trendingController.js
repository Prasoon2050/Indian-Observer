const News = require('../models/News');
const SystemStatus = require('../models/SystemStatus');
const { runTrendingIngestion, refreshCategoryFeeds } = require('../services/trendingService');

const forceRefreshTrending = async (req, res) => {
  try {
    const results = await runTrendingIngestion();
    const status = await SystemStatus.findOne({ key: 'ingestion' }).lean();
    res.json({ refreshed: results.length, items: results, status });
  } catch (error) {
    res.status(500).json({ message: 'Trending refresh failed', error: error.message });
  }
};

const listTrending = async (req, res) => {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  let news = await News.find({
    isTrending: true,
    generatedAt: { $gte: fourHoursAgo }
  }).sort({ generatedAt: -1 });

  if (!news.length) {
    // Fallback: If no fresh news, return the latest available trending news
    news = await News.find({ isTrending: true })
      .sort({ generatedAt: -1 })
      .limit(10);
  }
  res.json(news);
};

const getTrendingStatus = async (req, res) => {
  const status =
    (await SystemStatus.findOne({ key: 'ingestion' }).lean()) || {
      lastRunStatus: 'idle',
    };
  res.json(status);
};

const refreshCategoriesOnly = async (req, res) => {
  try {
    const items = await refreshCategoryFeeds();
    res.json({ refreshed: items.length, items });
  } catch (error) {
    res.status(500).json({ message: 'Category refresh failed', error: error.message });
  }
};

module.exports = { forceRefreshTrending, listTrending, getTrendingStatus, refreshCategoriesOnly };

