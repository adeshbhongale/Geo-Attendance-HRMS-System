const Attendance = require('../models/Attendance');
const Location = require('../models/Location');
const User = require('../models/User');
const Shift = require('../models/Shift');
const { calculateDistance } = require('../utils/geofence');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { getGoogleRoadDistance } = require('../utils/googleMaps');

// @desc    Punch In
// @route   POST /api/attendance/punch-in
// @access  Private
exports.punchIn = async (req, res, next) => {
  try {
    const { latitude, longitude, address, selfie } = req.body;
    const userId = req.user.id;

    // Upload selfie to Cloudinary if provided
    let selfieData = null;
    if (selfie && selfie !== 'skipped') {
      try {
        selfieData = await uploadToCloudinary(selfie, 'hrms/attendance/selfies');
      } catch (err) {
        console.log('Selfie upload warning:', err.message);
        // Continue without selfie if upload fails
      }
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    let existingAttendance = await Attendance.findOne({
      user: userId,
      $or: [
        { date: { $gte: startOfDay, $lt: endOfDay } },
        { "punchOut.time": { $gte: startOfDay, $lt: endOfDay } }
      ]
    });

    if (existingAttendance) {
      if (!existingAttendance.punchOut?.time) {
        return res.status(400).json({ success: false, message: 'You already have an active session. Please punch out first.' });
      } else {
        return res.status(400).json({ success: false, message: 'You have already completed your attendance for today.' });
      }
    }

    const office = await Location.findOne({ name: 'Office Main' }) || await Location.findOne();
    if (!office) {
      return res.status(500).json({ success: false, message: 'Office location not set by admin' });
    }

    const distance = calculateDistance(latitude, longitude, office.latitude, office.longitude);
    const isOutside = distance > office.radius;

    const user = await User.findById(userId).populate('shift');
    let isLate = false;
    let isHalfDay = false;
    let status = 'Present';

    if (user.shift) {
      const nowTime = new Date();
      
      // Calculate Late Status
      const [sHour, sMin] = user.shift.startTime.split(':').map(Number);
      const shiftStart = new Date(nowTime);
      shiftStart.setHours(sHour, sMin, 0, 0);
      const graceTime = new Date(shiftStart.getTime() + (user.shift.gracePeriod || 0) * 60000);
      
      if (nowTime > graceTime) {
        isLate = true;
        status = 'Late';
      }

      // Calculate Half Day Status
      if (user.shift.halfDayAfter) {
        const [hHour, hMin] = user.shift.halfDayAfter.split(':').map(Number);
        const halfDayTime = new Date(nowTime);
        halfDayTime.setHours(hHour, hMin, 0, 0);
        if (nowTime > halfDayTime) {
          isHalfDay = true;
          status = 'Half Day';
        }
      }
    }

    // Location status is recorded via isOutside, status remains Present or Late

    attendance = await Attendance.create({
      user: userId,
      date: today,
      punchIn: {
        time: new Date(),
        location: { latitude, longitude, address },
        selfie: selfieData ? selfieData.url : null,
        isOutside: isOutside
      },
      status,
      isLate,
      isHalfDay,
      isOutside,
    });

    res.status(201).json({
      success: true,
      message: 'Punched in successfully',
      data: attendance,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.punchOut = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;
    const userId = req.user.id;

    let attendance = await Attendance.findOne({
      user: userId,
      "punchOut.time": { $exists: false }
    }).sort('-date');

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No active punch-in session found' });
    }

    const office = await Location.findOne({ name: 'Office Main' }) || await Location.findOne();
    const outDistance = calculateDistance(latitude, longitude, office.latitude, office.longitude);
    const outOutside = outDistance > office.radius;

    attendance.punchOut = {
      time: new Date(),
      location: { latitude, longitude, address },
      isOutside: outOutside
    };

    const diff = attendance.punchOut.time - attendance.punchIn.time;
    const hours = diff / (1000 * 60 * 60);
    attendance.workingHours = parseFloat(hours.toFixed(2));

    const user = await User.findById(userId).populate('shift');
    
    // Half day check based on working hours if punch-in wasn't already half-day
    if (user.shift && !attendance.isHalfDay && hours < (user.shift.workingHours / 2)) {
      attendance.isHalfDay = true;
      attendance.status = 'Half Day';
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Punched out successfully',
      data: attendance,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get attendance history
// @route   GET /api/attendance/history
// @access  Private
exports.getHistory = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ user: req.user.id }).sort('-date');
    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get all attendance for Admin
// @route   GET /api/attendance
// @access  Private/Admin
exports.getAllAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    let query = {};
    let searchDate = new Date();

    if (date) {
      // Create a range for the entire day using UTC components to match the new storage format
      const [year, month, day] = date.split('-').map(Number);
      const start = new Date(Date.UTC(year, month - 1, day));
      const end = new Date(Date.UTC(year, month - 1, day));
      end.setUTCDate(end.getUTCDate() + 1);

      query.date = { $gte: start, $lt: end };
      searchDate = start;
    } else {
      const now = new Date();
      const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      
      query.date = { $gte: start, $lt: end };
      searchDate = start;
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'user',
        select: 'name email department shift',
        populate: { path: 'shift', select: 'name' }
      })
      .sort('-date');

    const allUsers = await User.find({ role: { $ne: 'admin' } }).populate('shift', 'name');
    const presentUserIds = new Set(attendance.map(a => a.user?._id?.toString()));
    
    const absentRecords = allUsers
      .filter(user => !presentUserIds.has(user._id.toString()))
      .map(user => ({
        _id: `absent_${user._id}`,
        user: user,
        date: searchDate,
        status: 'Absent',
        punchIn: null,
        punchOut: null,
        isLate: false,
        isHalfDay: false,
        isOutside: false,
        workingHours: 0,
        trackingLogs: [],
        totalDistance: 0
      }));

    const finalData = [...attendance, ...absentRecords];

    res.status(200).json({
      success: true,
      count: finalData.length,
      data: finalData,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Track Live Location
// @route   POST /api/attendance/track
// @access  Private
exports.trackLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;
    const userId = req.user.id;

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: startOfDay, $lt: endOfDay },
      "punchOut.time": { $exists: false }
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No active session found to track' });
    }

    if (attendance.punchOut?.time) {
      return res.status(400).json({ success: false, message: 'Shift already ended' });
    }

    const office = await Location.findOne({ name: 'Office Main' }) || await Location.findOne();
    const distance = calculateDistance(latitude, longitude, office.latitude, office.longitude);
    const isOutside = distance > office.radius;

    // Calculate distance from last point
    let incrementalDistance = 0;
    let lastLat, lastLng;

    if (attendance.trackingLogs.length > 0) {
      const lastPoint = attendance.trackingLogs[attendance.trackingLogs.length - 1];
      lastLat = lastPoint.latitude;
      lastLng = lastPoint.longitude;
    } else {
      // First log, calculate distance from punch-in
      lastLat = attendance.punchIn.location.latitude;
      lastLng = attendance.punchIn.location.longitude;
    }

    // Try Google Road Distance first, fallback to mathematical straight-line
    const googleDistance = await getGoogleRoadDistance(lastLat, lastLng, latitude, longitude);
    
    if (googleDistance !== null) {
      incrementalDistance = googleDistance;
      // Distance calculated

    } else {
      incrementalDistance = calculateDistance(latitude, longitude, lastLat, lastLng);
      // Fallback distance

    }

    attendance.totalDistance = (attendance.totalDistance || 0) + incrementalDistance;

    attendance.trackingLogs.push({
      time: new Date(),
      latitude,
      longitude,
      address,
      isOutside,
      distanceFromPrevious: incrementalDistance * 1000 // Store in meters for consistency
    });

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Location tracked',
      isOutside
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get monthly attendance summary and daily status
// @route   GET /api/attendance/monthly-view
// @access  Private
exports.getMonthlyView = async (req, res, next) => {
  try {
    const { month, year } = req.query; // Expects numeric month (1-12) and year (e.g., 2026)
    const userId = req.user.id;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide month and year' });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const attendance = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lt: endDate }
    }).sort('date');

    const summary = {
      present: 0,
      late: 0,
      halfDay: 0,
      absent: 0,
      onLeave: 0 // We'll need to fetch leaves too
    };

    // Fetch leaves for this month
    const Leave = require('../models/Leave');
    const leaves = await Leave.find({
      user: userId,
      status: 'Approved',
      $or: [
        { startDate: { $gte: startDate, $lt: endDate } },
        { endDate: { $gte: startDate, $lt: endDate } }
      ]
    });

    // Create a map of days
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyStatus = {};

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const today = now.getDate();

    // Initialize all days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(Date.UTC(year, month - 1, i));
      const isSunday = d.getUTCDay() === 0;
      
      const isFuture = (parseInt(year) > currentYear) || 
                      (parseInt(year) === currentYear && parseInt(month) > currentMonth) ||
                      (parseInt(year) === currentYear && parseInt(month) === currentMonth && i > today);

      dailyStatus[i] = { 
        status: isFuture ? 'Future' : 'Absent', 
        color: (isSunday || isFuture) ? 'transparent' : '#f43f5e', 
        isSunday,
        isFuture
      };
    }

    // Mark Leaves
    leaves.forEach(leave => {
      let start = new Date(leave.startDate);
      let end = new Date(leave.endDate);
      
      // Only process if it overlaps with our month
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)) {
          const day = d.getDate();
          dailyStatus[day] = { status: 'On Leave', color: '#f59e0b', isFuture: false }; 
          summary.onLeave++;
        }
      }
    });

    // Mark Attendance
    attendance.forEach(record => {
      const day = new Date(record.date).getUTCDate();
      let status = record.status || 'Present';
      let color = '#10b981'; // Emerald for present

      if (status === 'Late') color = '#f59e0b'; // Amber for late
      if (status === 'Half Day') color = '#3b82f6'; // Blue for half day

      dailyStatus[day] = { 
        status, 
        color,
        isFuture: false,
        punchIn: record.punchIn?.time,
        punchOut: record.punchOut?.time
      };

      if (status === 'Present') summary.present++;
      else if (status === 'Late') summary.late++;
      else if (status === 'Half Day') summary.halfDay++;
    });

    // Calculate Absent (days not present and not on leave, only up to today if current month)
    let relevantDaysCount = daysInMonth;
    if (parseInt(year) === currentYear && parseInt(month) === currentMonth) {
      relevantDaysCount = today;
    } else if (parseInt(year) > currentYear || (parseInt(year) === currentYear && parseInt(month) > currentMonth)) {
      relevantDaysCount = 0;
    }

    summary.absent = Math.max(0, relevantDaysCount - summary.present - summary.late - summary.halfDay - summary.onLeave);

    res.status(200).json({
      success: true,
      data: {
        summary,
        dailyStatus,
        daysInMonth,
        monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

