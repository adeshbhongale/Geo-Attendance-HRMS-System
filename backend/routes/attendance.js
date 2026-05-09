const express = require('express');
const {
  punchIn,
  punchOut,
  getHistory,
  getAllAttendance,
  trackLocation,
  getMonthlyView,
} = require('../controllers/attendance');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/punch-in', punchIn);
router.post('/punch-out', punchOut);
router.get('/history', getHistory);
router.get('/monthly-view', getMonthlyView);
router.post('/track', trackLocation);
router.get('/', authorize('admin'), getAllAttendance);

module.exports = router;
