const express = require('express');
const router = express.Router();
const { getAIAnalytics } = require('../controllers/aiAnalytics');
const { protect, authorize } = require('../middleware/auth');

router.get('/analytics', protect, authorize('admin'), getAIAnalytics);

module.exports = router;
