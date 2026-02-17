const router = require('express').Router();
const {
  getPublishedNews,
  getDraftNews,
  getNewsDetail,
  publishNews,
  addComment,
  deleteNews,
  generateNews,
} = require('../controllers/newsController');
const { requireAuth } = require('../middleware/auth');
// routes/admin.js or wherever your admin routes live
router.post('/trigger-ingestion', async (req, res) => {
  try {
    // Run in background so the request doesn't time out
    res.json({ message: 'Ingestion started' });
    
    await runTrendingIngestion();
    await refreshCategoryFeeds();
  } catch (err) {
    console.error('Manual ingestion failed:', err.message);
  }
});
router.get('/', getPublishedNews);
router.get('/drafts', requireAuth('admin'), getDraftNews);
router.post('/generate', requireAuth('admin'), generateNews);
router.get('/:id', getNewsDetail);
router.patch('/:id/publish', requireAuth('admin'), publishNews);
router.delete('/:id', requireAuth('admin'), deleteNews);
router.post('/:id/comments', requireAuth(), addComment);

module.exports = router;

