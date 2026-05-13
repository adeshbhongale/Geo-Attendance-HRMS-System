/**
 * Reports Controller
 * ─────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH — All statistics are calculated by
 * employeeStatsService. No business logic lives in this file.
 */

const Attendance = require('../models/Attendance');
const User       = require('../models/User');
const Leave      = require('../models/Leave');
const Shift      = require('../models/Shift');
const statsService = require('../services/employeeStatsService');

// ─────────────────────────────────────────────────────────────
// Helper – build a UTC-midnight Date from a YYYY-MM-DD string
// ─────────────────────────────────────────────────────────────
const parseUTCDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const todayUTC = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/daily
// ─────────────────────────────────────────────────────────────
exports.getDailyReport = async (req, res) => {
  try {
    const targetDate = req.query.date ? parseUTCDate(req.query.date) : todayUTC();
    const attendance = await Attendance.find({ date: targetDate })
      .populate('user', 'name email department');

    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/monthly
// ─────────────────────────────────────────────────────────────
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('user', 'name email department');

    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/stats   (admin dashboard overview)
// ─────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let targetDate = todayUTC();
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = { date: { $gte: parseUTCDate(startDate), $lte: parseUTCDate(endDate) } };
    } else {
      targetDate = date ? parseUTCDate(date) : todayUTC();
      dateQuery = { date: targetDate };
    }

    const startOfTargetDate = new Date(targetDate);
    startOfTargetDate.setUTCHours(0, 0, 0, 0);
    const endOfTargetDate = new Date(targetDate);
    endOfTargetDate.setUTCHours(23, 59, 59, 999);

    const now = new Date();
    const isTargetToday = targetDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];

    const sDate = startDate ? parseUTCDate(startDate) : new Date(targetDate.getTime() - 6 * 24 * 60 * 60 * 1000);
    const eDate = endDate ? parseUTCDate(endDate) : targetDate;
    const diffDays = Math.min(31, Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1);

    const [
      totalEmployees,
      presentToday,
      onLeaveToday,
      leavesAppliedToday,
      approvedToday,
      pendingLeaves,
      departmentStats,
      trendData
    ] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      Attendance.countDocuments(dateQuery),
      Leave.countDocuments({
        status: 'Approved',
        startDate: { $lte: targetDate },
        endDate: { $gte: targetDate }
      }),
      Leave.countDocuments({
        createdAt: { $gte: startOfTargetDate, $lte: endOfTargetDate }
      }),
      Leave.countDocuments({
        status: 'Approved',
        createdAt: { $gte: startOfTargetDate, $lte: endOfTargetDate }
      }),
      Leave.countDocuments({ status: 'Pending' }),
      Attendance.aggregate([
        { $match: dateQuery },
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $group: { _id: '$userInfo.department', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]),
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: sDate, $lte: eDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const unpaidLeavesToday = await Leave.countDocuments({
      status: 'Approved',
      leaveType: 'Unpaid Leave',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    });

    // Enhanced logic: Count as absent today only if their shift has ended and they aren't new today
    let absentToday = 0;
    if (isTargetToday) {
      const allEmployees = await User.find({ role: 'employee' }).populate('shift');
      const presentUserIds = await Attendance.find(dateQuery).distinct('user');
      const presentUserIdsSet = new Set(presentUserIds.map(id => id.toString()));
      
      const onLeaveUsers = await Leave.find({
        status: 'Approved',
        startDate: { $lte: targetDate },
        endDate: { $gte: targetDate }
      }).distinct('user');
      const onLeaveUserIdsSet = new Set(onLeaveUsers.map(id => id.toString()));

      const realAbsentees = allEmployees.filter(user => {
        const empId = user._id.toString();
        if (presentUserIdsSet.has(empId) || onLeaveUserIdsSet.has(empId)) return false;

        const userCreated = new Date(user.createdAt);
        userCreated.setUTCHours(0, 0, 0, 0);
        if (userCreated.getTime() === targetDate.getTime()) return false;

        if (user.shift) {
          const [eH, eM] = user.shift.endTime.split(':').map(Number);
          const shiftEnd = new Date();
          shiftEnd.setHours(eH, eM, 0, 0);
          if (now < shiftEnd) return false;
        }
        return true;
      });
      absentToday = realAbsentees.length;
    } else {
      // For past dates, only count employees who existed on that date
      const activeEmployeesOnDate = await User.countDocuments({
        role: 'employee',
        createdAt: { $lte: endOfTargetDate }
      });
      absentToday = Math.max(0, activeEmployeesOnDate - presentToday - onLeaveToday);
    }

    // Map trend data into the expected format for the last X days
    const attendanceTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = trendData.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    for (let i = diffDays - 1; i >= 0; i--) {
      const date = new Date(eDate);
      date.setUTCDate(date.getUTCDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      attendanceTrend.push({
        name: diffDays > 7 ? `${date.getUTCDate()}/${date.getUTCMonth() + 1}` : dayNames[date.getUTCDay()],
        attendance: trendMap[dateStr] || 0
      });
    }

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        onLeaveToday,
        absentToday,
        pendingLeaves,
        leavesAppliedToday,
        approvedToday,
        unpaidLeavesToday,
        attendanceRate: totalEmployees > 0
          ? ((presentToday / (totalEmployees * diffDays)) * 100).toFixed(2) : 0,
        departmentStats,
        attendanceTrend
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/my-stats
// ─────────────────────────────────────────────────────────────
exports.getEmployeeStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const now = new Date();
    const defaultStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const defaultEnd   = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));

    const result = await statsService.getEmployeeFullStats(
      userId,
      startDate || defaultStart,
      endDate   || defaultEnd
    );

    res.json({
      success: true,
      data: {
        ...result.stats,
        currentWorkingHours: result.currentWorkingHours,
        currentBreakMinutes: result.currentBreakMinutes,
        currentDistanceKm:   result.currentDistanceKm,
        currentShift: result.user?.shift?.name || 'Not Assigned',
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/employee-stats/:userId
// ─────────────────────────────────────────────────────────────
exports.getAdminEmployeeStats = async (req, res) => {
  try {
    const { userId }            = req.params;
    const { startDate, endDate } = req.query;
    const result = await statsService.getEmployeeFullStats(userId, startDate, endDate);
    res.json({
      success: true,
      data: {
        ...result.stats,
        currentWorkingHours: result.currentWorkingHours,
        currentBreakMinutes: result.currentBreakMinutes,
        currentDistanceKm:   result.currentDistanceKm,
        currentShift:        result.user?.shift?.name || 'Not Assigned',
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/tracking
// ─────────────────────────────────────────────────────────────
exports.getTrackingStats = async (req, res) => {
  try {
    const targetDate     = req.query.date ? parseUTCDate(req.query.date) : todayUTC();
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const attendance     = await Attendance.find({ date: targetDate })
      .populate('user', 'name email department mobile designation profileImage isOnline createdAt shift');

    const presentCount = attendance.length;
    const onLeaveCount = await Leave.countDocuments({
      status: 'Approved',
      startDate: { $lte: targetDate },
      endDate:   { $gte: targetDate }
    });

    // Absent count for tracking overview (using same refined logic)
    const now = new Date();
    const isToday = targetDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
    let absentCount = 0;
    if (isToday) {
      const allEmployees = await User.find({ role: 'employee' }).populate('shift');
      const presentUserIds = new Set(attendance.map(a => a.user?._id?.toString()));
      const realAbsentees = allEmployees.filter(user => {
        const empId = user._id.toString();
        if (presentUserIds.has(empId)) return false;
        const userCreated = new Date(user.createdAt);
        userCreated.setUTCHours(0, 0, 0, 0);
        if (userCreated.getTime() === targetDate.getTime()) return false;
        if (user.shift) {
          const [eH, eM] = user.shift.endTime.split(':').map(Number);
          const shiftEnd = new Date();
          shiftEnd.setHours(eH, eM, 0, 0);
          if (now < shiftEnd) return false;
        }
        return true;
      });
      absentCount = Math.max(0, realAbsentees.length - onLeaveCount);
    } else {
      absentCount = Math.max(0, totalEmployees - presentCount - onLeaveCount);
    }

    const onlineCount  = await User.countDocuments({ role: 'employee', isOnline: true });
    const offlineCount = Math.max(0, totalEmployees - onlineCount);

    const outsideCount = attendance.filter(a => a.isOutside).length;
    const insideCount  = Math.max(0, presentCount - outsideCount);

    const employeesData = attendance
      .filter(att => att.user)
      .map(att => {
        const latestLog = att.trackingLogs?.length > 0
          ? att.trackingLogs[att.trackingLogs.length - 1]
          : null;

        return {
          id:   att._id,
          user: att.user,
          lastKnownLocation: latestLog ? {
            address:   latestLog.address || 'Address not found',
            time:      latestLog.time,
            latitude:  latestLog.latitude,
            longitude: latestLog.longitude
          } : {
            address:   att.punchIn?.location?.address || 'No location data',
            time:      att.punchIn?.time || att.date,
            latitude:  att.punchIn?.location?.latitude,
            longitude: att.punchIn?.location?.longitude
          },
          distance: parseFloat((att.totalDistance || att.distance || 0).toFixed(2)),
          workingHours:     statsService.calculateWorkingHours(att),
          status:           att.user.isOnline ? 'online' : 'offline',
          attendanceStatus: att.status,
          isOutside:        att.isOutside
        };
      });

    res.json({
      success: true,
      data: {
        stats: {
          total:       totalEmployees,
          connectivity: { online: onlineCount, offline: offlineCount },
          presence:     { present: presentCount, absent: absentCount, onLeave: onLeaveCount },
          geofence:     { inside: insideCount, outside: outsideCount }
        },
        employees: employeesData
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/attendance-dashboard
// ─────────────────────────────────────────────────────────────
exports.getAttendanceDashboard = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let dateQuery = {};
    let targetDate;
    if (startDate && endDate) {
      dateQuery = { date: { $gte: parseUTCDate(startDate), $lte: parseUTCDate(endDate) } };
      targetDate = parseUTCDate(endDate);
    } else {
      targetDate = date ? parseUTCDate(date) : todayUTC();
      dateQuery = { date: targetDate };
    }

    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const sDate = startDate ? parseUTCDate(startDate) : (date ? parseUTCDate(date) : todayUTC());
    const eDate = endDate ? parseUTCDate(endDate) : sDate;
    const diffDays = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
    const totalExpectedAttendance = totalEmployees * diffDays;

    const attendance = await Attendance.find(dateQuery).populate('user', 'name department createdAt shift');

    const onLeaveCount = await Leave.countDocuments({
      status: 'Approved',
      $or: [
        { startDate: { $lte: targetDate }, endDate: { $gte: parseUTCDate(startDate) || targetDate } }
      ]
    });

    const presentRecords = attendance.filter(a => ['Present', 'Late', 'Half Day'].includes(a.status));
    const presentCount   = presentRecords.length;
    
    const now = new Date();
    const isToday = targetDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
    
    let absentCount = 0;
    if (!isToday || diffDays > 1) {
      absentCount = Math.max(0, totalExpectedAttendance - presentCount - onLeaveCount);
    } else {
      const allEmployees = await User.find({ role: 'employee' }).populate('shift');
      const presentUserIds = new Set(attendance.map(a => a.user?._id?.toString()));
      const realAbsentees = allEmployees.filter(user => {
        const empId = user._id.toString();
        if (presentUserIds.has(empId)) return false;
        const userCreated = new Date(user.createdAt);
        userCreated.setUTCHours(0, 0, 0, 0);
        if (userCreated.getTime() === targetDate.getTime()) return false;
        if (user.shift) {
          const [eH, eM] = user.shift.endTime.split(':').map(Number);
          const shiftEnd = new Date();
          shiftEnd.setHours(eH, eM, 0, 0);
          if (now < shiftEnd) return false;
        }
        return true;
      });
      absentCount = Math.max(0, realAbsentees.length - onLeaveCount);
    }

    const getStatsByField = async (field, isRef = false) => {
      let groups;
      if (isRef) {
        const allShifts = await Shift.find();
        groups = allShifts.map(s => ({ _id: s._id, name: s.name }));
      } else {
        const distinctValues = await User.distinct(field, { role: 'employee' });
        groups = distinctValues.map(v => ({ _id: v, name: v || 'Other' }));
      }

      return Promise.all(groups.map(async (group) => {
        const query = { role: 'employee' };
        query[field] = group._id;
        const groupEmployees   = await User.find(query).populate('shift');
        const groupEmployeeIds = groupEmployees.map(e => e._id.toString());
        const groupAttendance  = attendance.filter(a => groupEmployeeIds.includes(a.user?._id?.toString()));
        const groupPresent     = groupAttendance.filter(a => ['Present', 'Late', 'Half Day'].includes(a.status)).length;
        const groupLate        = groupAttendance.filter(a => a.status === 'Late').length;
        const groupDeviators   = groupAttendance.filter(a => a.isOutside).length;

        const groupOnLeave = await Leave.countDocuments({
          user: { $in: groupEmployees.map(e => e._id) },
          status: 'Approved',
          $or: [
            { startDate: { $lte: targetDate }, endDate: { $gte: parseUTCDate(startDate) || targetDate } }
          ]
        });

        const groupAbsent = isToday 
          ? groupEmployees.filter(emp => {
              const empId = emp._id.toString();
              if (groupAttendance.some(a => a.user?._id?.toString() === empId)) return false;
              const userCreated = new Date(emp.createdAt);
              userCreated.setUTCHours(0, 0, 0, 0);
              if (userCreated.getTime() === targetDate.getTime()) return false;
              if (emp.shift) {
                const [eH, eM] = emp.shift.endTime.split(':').map(Number);
                const shiftEnd = new Date();
                shiftEnd.setHours(eH, eM, 0, 0);
                if (now < shiftEnd) return false;
              }
              return true;
            }).length - groupOnLeave
          : Math.max(0, (groupEmployees.length * diffDays) - groupPresent - groupOnLeave);

        return {
          name:          group.name,
          total:         groupEmployees.length * diffDays,
          present:       groupPresent,
          absent:        Math.max(0, groupAbsent),
          onLeave:       groupOnLeave,
          upcomingShift: 0,
          lateComers:    groupLate,
          earlyLeavers:  0,
          deviators:     groupDeviators,
          avgWorkingHours: groupPresent > 0
            ? groupAttendance.reduce((acc, a) => acc + statsService.calculateWorkingHours(a), 0) / groupPresent
            : 0
        };
      }));
    };

    const departmentStats = await getStatsByField('department');
    const shiftStats      = await getStatsByField('shift', true);

    res.json({
      success: true,
      data: {
        attendanceDetails: { present: presentCount, absent: absentCount, onLeave: onLeaveCount, upcomingShift: 0, total: totalExpectedAttendance },
        departmentStats,
        shiftStats
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/employee-reports
// ─────────────────────────────────────────────────────────────
exports.getEmployeeReports = async (req, res) => {
  try {
    const { date, startDate, endDate, search = '' } = req.query;
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = { date: { $gte: parseUTCDate(startDate), $lte: parseUTCDate(endDate) } };
    } else {
      const targetDate = date ? parseUTCDate(date) : todayUTC();
      dateQuery = { date: targetDate };
    }

    const attendance = await Attendance.find(dateQuery).populate({
      path: 'user',
      select: 'name email mobile department designation shift profileImage',
      populate: { path: 'shift', select: 'name startTime endTime' }
    });

    let reportData = attendance.map(a => {
      if (!a.user) return null;
      const hrs = statsService.calculateWorkingHours(a);
      const breakMins = statsService.calculateBreakMinutes(a);
      return {
        id: a._id, userId: a.user._id, name: a.user.name, mobile: a.user.mobile,
        profileImage: a.user.profileImage,
        department: a.user.department, designation: a.user.designation,
        shift: a.user.shift ? `${a.user.shift.name} (${a.user.shift.startTime} - ${a.user.shift.endTime})` : 'NA',
        date: a.date, timeIn: a.punchIn?.time, timeInLocation: a.punchIn?.location?.address,
        timeInSelfie: a.punchIn?.selfie,
        timeOut: a.punchOut?.time, timeOutLocation: a.punchOut?.location?.address,
        timeOutSelfie: a.punchOut?.selfie,
        totalHoursWorked: hrs, status: a.status,
        breaks: a.breaks || [],
        breaksTaken: a.breaks?.length || 0,
        totalBreakTime: breakMins
      };
    }).filter(item => item !== null);

    if (search) {
      reportData = reportData.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) || (item.mobile || '').includes(search)
      );
    }
    res.json({ success: true, count: reportData.length, data: reportData });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/employee-details/:userId
// ─────────────────────────────────────────────────────────────
exports.getEmployeePersonalDetails = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { userId }             = req.params;
    const result = await statsService.getEmployeeFullStats(userId, startDate, endDate);
    const { user, stats } = result;
    let records = await Attendance.find({ user: userId }).sort({ date: -1 });
    if (startDate && endDate) {
      records = records.filter(r => {
        const d = new Date(r.date);
        return d >= new Date(startDate) && d <= new Date(endDate);
      });
    }
    const attendanceDetails = records
      .filter(r => r.status !== 'Absent')
      .map(a => {
        const hrs = statsService.calculateWorkingHours(a);
        const dist = parseFloat((a.distance || a.totalDistance || 0).toFixed(2));
        const breakMins = statsService.calculateBreakMinutes(a);
        return {
          id: a._id, date: a.date, status: a.status, punchIn: a.punchIn, punchOut: a.punchOut,
          workingHours: hrs, totalHoursWorked: hrs, distance: dist, totalDistance: dist,
          breaks: a.breaks || [], totalBreakTime: breakMins
        };
      });

    res.json({ success: true, data: { employee: user, summary: { ...stats, currentWorkingHours: result.currentWorkingHours, currentBreakMinutes: result.currentBreakMinutes, currentDistanceKm: result.currentDistanceKm }, attendanceDetails } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/track-details/:userId
// ─────────────────────────────────────────────────────────────
exports.getEmployeeTrackDetails = async (req, res) => {
  try {
    const { date }   = req.query;
    const targetDate = date ? parseUTCDate(date) : todayUTC();
    const attendance = await Attendance.findOne({ user: req.params.userId, date: targetDate }).populate({
      path: 'user',
      select: 'name department designation shift battery signalStatus mobile profileImage',
      populate: { path: 'shift', select: 'name' }
    });
    if (!attendance) return res.json({ success: true, data: { exists: false, message: 'No tracking data' } });
    res.json({ success: true, data: { exists: true, employee: attendance.user, summary: { totalDistance: attendance.totalDistance || 0, workingHours: statsService.calculateWorkingHours(attendance), lastKnownLocation: attendance.trackingLogs?.length > 0 ? attendance.trackingLogs[attendance.trackingLogs.length - 1] : attendance.punchIn?.location }, logs: attendance.trackingLogs || [], punchIn: attendance.punchIn, punchOut: attendance.punchOut } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/track-details-me
// ─────────────────────────────────────────────────────────────
exports.getEmployeeTrackDetailsMe = async (req, res) => {
  try {
    const { date }   = req.query;
    const targetDate = date ? parseUTCDate(date) : todayUTC();
    const attendance = await Attendance.findOne({ user: req.user.id, date: targetDate });
    if (!attendance) return res.json({ success: true, data: { exists: false, message: 'No tracking data' } });
    res.json({ success: true, data: { exists: true, summary: { totalDistance: attendance.totalDistance || 0, workingHours: 0 }, logs: attendance.trackingLogs || [], punchIn: attendance.punchIn, punchOut: attendance.punchOut } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
