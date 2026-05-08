const express = require('express');
const {
  getDailyReport,
  getMonthlyReport,
  getStats,
  getEmployeeStats,
  getTrackingStats,
  getAttendanceDashboard,
  getEmployeeReports,
  getEmployeePersonalDetails,
  getEmployeeTrackDetails
} = require('../controllers/reports');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/my-stats', getEmployeeStats);

// Admin only routes
router.get('/daily', authorize('admin'), getDailyReport);
router.get('/monthly', authorize('admin'), getMonthlyReport);
router.get('/stats', authorize('admin'), getStats);
router.get('/tracking', authorize('admin'), getTrackingStats);
router.get('/attendance-dashboard', authorize('admin'), getAttendanceDashboard);
router.get('/employee-reports', authorize('admin'), getEmployeeReports);
router.get('/employee-details/:userId', authorize('admin'), getEmployeePersonalDetails);
router.get('/track-details/:userId', authorize('admin'), getEmployeeTrackDetails);

module.exports = router;
