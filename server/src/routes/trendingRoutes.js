const router = require('express').Router();
const {
  forceRefreshTrending,
  listTrending,
  getTrendingStatus,
  refreshCategoriesOnly,
} = require('../controllers/trendingController');
const { requireAuth } = require('../middleware/auth');

router.get('/', listTrending);
router.get('/status', getTrendingStatus);
router.post('/refresh', requireAuth('admin'), forceRefreshTrending);
router.post('/refresh-categories', requireAuth('admin'), refreshCategoriesOnly);

module.exports = router;

