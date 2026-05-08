const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Get daily attendance report
// @route   GET /api/reports/daily
// @access  Private/Admin
exports.getDailyReport = async (req, res, next) => {
  try {
    let targetDate;
    if (req.query.date) {
      const [year, month, day] = req.query.date.split('-').map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const attendance = await Attendance.find({ date: targetDate }).populate('user', 'name email department');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get monthly attendance report
// @route   GET /api/reports/monthly
// @access  Private/Admin
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const month = req.query.month; // 1-12
    const year = req.query.year;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('user', 'name email department');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get overall statistics
// @route   GET /api/reports/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });

    let targetDate;
    if (req.query.date) {
      const [year, month, day] = req.query.date.split('-').map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const presentToday = await Attendance.countDocuments({ date: targetDate });

    // Late count for the target date
    const lateToday = await Attendance.countDocuments({ date: targetDate, status: 'Late' });

    // Pending leaves (Total pending, not necessarily date-bound, but we could filter if needed)
    let pendingLeaves = 0;
    try {
      const Leave = require('../models/Leave');
      pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    } catch (e) { }

    // Department attendance counts for targetDate
    const departmentStats = await Attendance.aggregate([
      { $match: { date: targetDate } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$userInfo.department',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate weekly attendance trend (last 7 days)
    const attendanceTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(targetDate);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      const dayAttendance = await Attendance.countDocuments({
        date: { $gte: startOfDay, $lt: endOfDay }
      });

      attendanceTrend.push({
        name: dayNames[date.getDay()],
        attendance: dayAttendance
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        lateToday,
        pendingLeaves,
        attendanceRate: totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(2) : 0,
        departmentStats: departmentStats.map(d => ({ name: d._id || 'Other', value: d.count })),
        attendanceTrend
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get employee specific dashboard statistics
// @route   GET /api/reports/my-stats
// @access  Private
exports.getEmployeeStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 1. Days Present this month
    const presentDays = await Attendance.countDocuments({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['Present', 'Late'] }
    });

    // 2. Late counts this month
    const lateDays = await Attendance.countDocuments({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
      status: 'Late'
    });

    // 3. Approved Leaves this month
    const Leave = require('../models/Leave');
    const approvedLeaves = await Leave.countDocuments({
      user: userId,
      status: 'Approved',
      startDate: { $gte: startDate },
      endDate: { $lte: endDate }
    });

    // 4. User data for balance
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: {
        presentDays,
        lateDays,
        approvedLeaves,
        leaveBalance: user.leaveBalance,
        monthlyLimit: user.monthlyLeaveLimit
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get tracking dashboard statistics
// @route   GET /api/reports/tracking
// @access  Private/Admin
exports.getTrackingStats = async (req, res, next) => {
  try {
    let targetDate;
    if (req.query.date) {
      const [year, month, day] = req.query.date.split('-').map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const attendance = await Attendance.find({ date: targetDate }).populate('user', 'name email department mobile designation profileImage');
    
    const presentCount = attendance.length;
    const absentCount = Math.max(0, totalEmployees - presentCount);

    // Mocking tracking info
    const employeesData = attendance.map(att => {
      const latestLog = att.trackingLogs && att.trackingLogs.length > 0 
        ? att.trackingLogs[att.trackingLogs.length - 1] 
        : null;

      return {
        id: att._id,
        user: att.user,
        lastKnownLocation: latestLog ? {
          address: latestLog.address || 'Address not found',
          time: latestLog.time,
          latitude: latestLog.latitude,
          longitude: latestLog.longitude
        } : {
          address: att.punchIn?.location?.address || 'No location data',
          time: att.punchIn?.time || att.date,
          latitude: att.punchIn?.location?.latitude,
          longitude: att.punchIn?.location?.longitude
        },
        distance: att.totalDistance || 0,
        status: att.signalStatus || (Math.random() > 0.1 ? 'online' : 'offline'),
        attendanceStatus: att.status
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: totalEmployees,
          tracking: { enabled: totalEmployees, disabled: 0 },
          presence: { present: presentCount, absent: absentCount },
          permissions: { granted: presentCount, denied: 0 }
        },
        employees: employeesData
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get detailed attendance dashboard stats
// @route   GET /api/reports/attendance-dashboard
// @access  Private/Admin
exports.getAttendanceDashboard = async (req, res, next) => {
  try {
    let targetDate;
    if (req.query.date) {
      const [year, month, day] = req.query.date.split('-').map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const attendance = await Attendance.find({ date: targetDate }).populate('user', 'name department');
    
    const Leave = require('../models/Leave');
    const onLeaveCount = await Leave.countDocuments({
      status: 'Approved',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    });

    const presentRecords = attendance.filter(a => ['Present', 'Late', 'Half Day'].includes(a.status));
    const presentCount = presentRecords.length;
    const absentCount = Math.max(0, totalEmployees - presentCount - onLeaveCount);

    // Helper function to get stats by field
    const getStatsByField = async (field, isRef = false) => {
      let groups;
      if (isRef) {
        // For Shift which is a reference
        const Shift = require('../models/Shift');
        const allShifts = await Shift.find();
        groups = allShifts.map(s => ({ _id: s._id, name: s.name }));
      } else {
        const distinctValues = await User.distinct(field, { role: 'employee' });
        groups = distinctValues.map(v => ({ _id: v, name: v || 'Other' }));
      }

      return await Promise.all(groups.map(async (group) => {
        const query = { role: 'employee' };
        query[field] = group._id;
        const groupEmployees = await User.find(query);
        const groupEmployeeIds = groupEmployees.map(e => e._id.toString());
        
        const groupAttendance = attendance.filter(a => groupEmployeeIds.includes(a.user?._id?.toString()));
        const groupPresent = groupAttendance.filter(a => ['Present', 'Late', 'Half Day'].includes(a.status)).length;
        const groupLate = groupAttendance.filter(a => a.status === 'Late').length;
        const groupDeviators = groupAttendance.filter(a => a.isOutside).length;
        
        const groupOnLeave = await Leave.countDocuments({
          user: { $in: groupEmployees.map(e => e._id) },
          status: 'Approved',
          startDate: { $lte: targetDate },
          endDate: { $gte: targetDate }
        });

        return {
          name: group.name,
          total: groupEmployees.length,
          present: groupPresent,
          absent: Math.max(0, groupEmployees.length - groupPresent - groupOnLeave),
          onLeave: groupOnLeave,
          upcomingShift: 0,
          lateComers: groupLate,
          earlyLeavers: 0,
          deviators: groupDeviators
        };
      }));
    };

    const departmentStats = await getStatsByField('department');
    const headquarterStats = await getStatsByField('headquarter');
    const shiftStats = await getStatsByField('shift', true);

    res.status(200).json({
      success: true,
      data: {
        attendanceDetails: {
          present: presentCount,
          absent: absentCount,
          onLeave: onLeaveCount,
          upcomingShift: 0,
          total: totalEmployees
        },
        departmentStats,
        headquarterStats,
        shiftStats
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get detailed employee reports (Timesheet/Present)
// @route   GET /api/reports/employee-reports
// @access  Private/Admin
exports.getEmployeeReports = async (req, res, next) => {
  try {
    const { type, date, search = '' } = req.query;
    let targetDate;
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const attendance = await Attendance.find({ date: targetDate }).populate({
      path: 'user',
      select: 'name email mobile department designation shift profileImage',
      populate: {
        path: 'shift',
        select: 'name'
      }
    });
    
    // Filtering logic if search is provided
    let filteredAttendance = attendance;
    if (search) {
      filteredAttendance = attendance.filter(a => 
        a.user.name.toLowerCase().includes(search.toLowerCase()) || 
        a.user.mobile.includes(search)
      );
    }

    const reportData = filteredAttendance.map(a => {
      const totalBreakTime = a.breaks?.reduce((acc, b) => acc + (b.duration || 0), 0) || 0;
      return {
        id: a._id,
        userId: a.user._id,
        name: a.user.name,
        mobile: a.user.mobile,
        department: a.user.department,
        designation: a.user.designation,
        shift: a.user.shift?.name || 'NA',
        headquarter: a.user.shift?.headquarter?.name || 'Main HQ',
        timeIn: a.punchIn?.time,
        timeInLocation: a.punchIn?.location?.address,
        timeInSelfie: a.punchIn?.selfie,
        timeInOutside: a.punchIn?.isOutside,
        timeOut: a.punchOut?.time,
        timeOutLocation: a.punchOut?.location?.address,
        timeOutSelfie: a.punchOut?.selfie,
        timeOutOutside: a.punchOut?.isOutside,
        loggedHours: a.workingHours || 0,
        breaksTaken: a.breaks?.length || 0,
        totalBreakTime: totalBreakTime,
        breaks: a.breaks || [],
        totalHoursWorked: Math.max(0, (a.workingHours || 0) - (totalBreakTime / 60)),
        profileImage: a.user.profileImage,
        totalDistance: a.totalDistance || 0
      };
    });

    res.status(200).json({
      success: true,
      count: reportData.length,
      data: reportData,
      generatedOn: new Date().toISOString()
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get individual employee personal details & history
// @route   GET /api/reports/employee-details/:userId
// @access  Private/Admin
exports.getEmployeePersonalDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const attendance = await Attendance.find({ user: user._id }).sort({ date: -1 });
    const Leave = require('../models/Leave');
    const leaves = await Leave.find({ user: user._id, status: 'Approved' });

    const totalDays = 30; // Last 30 days summary
    const presentDays = attendance.length;
    const lateCount = attendance.filter(a => a.status === 'Late').length;
    const approvedLeaves = leaves.length;
    const actualWorkedHours = attendance.reduce((acc, a) => acc + (a.workingHours || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        employee: user,
        summary: {
          workDays: totalDays,
          presentDays: presentDays,
          lateCount: lateCount,
          approvedLeaves: approvedLeaves,
          notMarked: Math.max(0, totalDays - presentDays - approvedLeaves),
          expectedWorkHours: totalDays * 8, // Assuming 8h/day
          actualWorkedHours: actualWorkedHours
        },
        attendanceDetails: attendance.map(a => ({
          id: a._id,
          date: a.date,
          punchIn: a.punchIn,
          punchOut: a.punchOut,
          isOutside: a.isOutside,
          breaks: a.breaks,
          loggedHours: a.workingHours,
          totalDistance: a.totalDistance || 0
        }))
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get individual employee track route/data
// @route   GET /api/reports/track-details/:userId
// @access  Private/Admin
exports.getEmployeeTrackDetails = async (req, res, next) => {
  try {
    const { date } = req.query;
    let targetDate;
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const attendance = await Attendance.findOne({ user: req.params.userId, date: targetDate }).populate({
      path: 'user',
      select: 'name department designation shift battery signalStatus mobile profileImage',
      populate: {
        path: 'shift',
        select: 'name'
      }
    });
    
    if (!attendance) {
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
          message: 'No tracking data for this date'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        exists: true,
        employee: attendance.user,
        summary: {
          totalDistance: attendance.totalDistance,
          lastKnownLocation: attendance.trackingLogs?.length > 0 ? attendance.trackingLogs[attendance.trackingLogs.length - 1] : attendance.punchIn?.location
        },
        logs: attendance.trackingLogs || [],
        punchIn: attendance.punchIn,
        punchOut: attendance.punchOut
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
