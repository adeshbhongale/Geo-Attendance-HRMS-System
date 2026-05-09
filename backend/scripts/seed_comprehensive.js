const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Shift = require('../models/Shift');
const Location = require('../models/Location');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Clear existing data
    await Promise.all([
      User.deleteMany(),
      Attendance.deleteMany(),
      Leave.deleteMany(),
      Shift.deleteMany(),
      Location.deleteMany()
    ]);
    console.log('Cleared existing collections.');

    // 2. Create Shifts
    const shifts = await Shift.insertMany([
      { name: 'Morning Shift', startTime: '08:00', endTime: '14:00', gracePeriod: 15, halfDayAfter: '10:00', workingHours: 8 },
      { name: 'Evening Shift', startTime: '14:00', endTime: '22:00', gracePeriod: 15, halfDayAfter: '16:00', workingHours: 8 },
      { name: 'Night Shift', startTime: '22:00', endTime: '04:00', gracePeriod: 15, halfDayAfter: '00:00', workingHours: 8, isNightShift: true }
    ]);
    console.log(`Created ${shifts.length} Shifts.`);

    // 3. Create Office Location
    const office = await Location.create({
      name: 'Office Main HQ',
      latitude: 16.7018,
      longitude: 74.4496,
      radius: 200,
      address: 'Jawaharnagar, Ichalkaranji, Maharashtra, India'
    });
    console.log('Created Office Location.');

    // 4. Create Admin
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'Global Admin',
      email: 'admin@example.com',
      mobile: '9000000000',
      password: adminPassword,
      role: 'admin',
      department: 'Management'
    });
    console.log('Created Admin User (admin@example.com / admin123).');

    // 5. Create Employees
    const departments = ['IT', 'Sales', 'HR', 'Support', 'Logistics'];
    const employeeData = [];
    const empCount = 14; 

    for (let i = 1; i <= empCount; i++) {
      const dept = departments[i % departments.length];
      const shift = shifts[i % shifts.length];
      const hashedPassword = await bcrypt.hash('password123', 10);

      employeeData.push({
        name: `Employee ${i}`,
        email: `emp${i}@example.com`,
        mobile: `91000000${i.toString().padStart(2, '0')}`,
        password: hashedPassword,
        role: 'employee',
        department: dept,
        designation: i % 2 === 0 ? 'Project Lead' : 'Systems Engineer',
        shift: shift._id,
        headquarter: i % 3 === 0 ? 'Ichalkaranji HQ' : 'Pune HQ',
        leaveBalance: 3,
        monthlyLeaveLimit: 3
      });
    }

    // Add Fresh Test User (Shreyas Kadam)
    const shreyasPassword = await bcrypt.hash('password123', 10);
    employeeData.push({
      name: 'Shreyas Kadam',
      email: 'shreyas@example.com',
      mobile: '9876543210',
      password: shreyasPassword,
      role: 'employee',
      department: 'Sales',
      designation: 'Sr.Sales Engineer',
      shift: shifts[0]._id, 
      headquarter: 'Mumbai HQ',
      leaveBalance: 3,
      monthlyLeaveLimit: 3
    });

    const employees = await User.insertMany(employeeData);
    console.log(`Created ${employees.length} Employees (including Shreyas Kadam).`);

    // 6. Generate History (Last 30 Days)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const attendanceRecords = [];
    const leaveRecords = [];

    for (let d = 0; d < 30; d++) {
      const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      date.setUTCDate(date.getUTCDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const isWeekend = date.getUTCDay() === 0; // Skip Sundays

      for (const emp of employees) {
        // SPECIAL CASE: Shreyas Kadam is ALWAYS fresh for today (not punched in)
        if (emp.name === 'Shreyas Kadam' && dateStr === todayStr) {
          continue;
        }

        if (isWeekend) continue;

        const empIndex = employees.indexOf(emp);
        
        // Random Status Picker
        const rand = Math.random();
        
        if (rand < 0.12) { // 12% Leave (increase diversity)
          const leaveStatusRand = Math.random();
          let leaveStatus = 'Approved';
          if (leaveStatusRand < 0.3) leaveStatus = 'Pending';
          else if (leaveStatusRand < 0.5) leaveStatus = 'Rejected';

          leaveRecords.push({
            user: emp._id,
            leaveType: leaveStatusRand < 0.5 ? 'Sick Leave' : 'Casual Leave',
            startDate: date,
            endDate: date,
            reason: leaveStatus === 'Sick Leave' ? 'Feeling unwell' : 'Personal work',
            status: leaveStatus
          });
          if (leaveStatus === 'Approved') continue; // Only skip attendance if approved
        }

        if (rand < 0.15) { // 7% Absent (total 15% not present)
          continue;
        }

        // Employee is Present/Late/Half-Day
        let status = 'Present';
        let isLate = false;
        let isHalfDay = false;
        
        if (rand < 0.35) { // 20% Late
          status = 'Late';
          isLate = true;
        } else if (rand < 0.45) { // 10% Half Day
          status = 'Half Day';
          isHalfDay = true;
        }

        // Realistic times
        const punchIn = new Date(date);
        const inHour = isLate ? 10 : 8 + Math.floor(Math.random() * 2);
        const inMin = Math.floor(Math.random() * 59);
        punchIn.setUTCHours(inHour, inMin, 0);

        const punchOut = new Date(date);
        const outHour = isHalfDay ? 13 : 17 + Math.floor(Math.random() * 3);
        const outMin = Math.floor(Math.random() * 59);
        punchOut.setUTCHours(outHour, outMin, 0);

        // Tracking Logic
        const trackingLogs = [];
        let totalDistance = 0;
        for (let k = 0; k < 10; k++) {
          if (k === 0 || k === 9) {
            lat = office.latitude;
            lng = office.longitude;
          } else {
            const offset = (empIndex * 0.005) + (d * 0.001) + (k * 0.002);
            lat = office.latitude + (Math.sin(offset) * 0.01);
            lng = office.longitude + (Math.cos(offset) * 0.01);
          }

          let distFromPrev = 0;
          if (k > 0) {
            const prev = trackingLogs[k - 1];
            const dLat = (lat - prev.latitude) * 111;
            const dLng = (lng - prev.longitude) * 111;
            distFromPrev = Math.sqrt(dLat * dLat + dLng * dLng);
            totalDistance += distFromPrev;
          }
          trackingLogs.push({
            time: new Date(punchIn.getTime() + (k * 60 * 60000)),
            latitude: lat,
            longitude: lng,
            address: k === 0 || k === 9 ? office.address : `Route ${k} Near ${emp.department} Zone`,
            isOutside: k !== 0 && k !== 9,
            distanceFromPrevious: distFromPrev * 1000 
          });
        }

        const workingHours = parseFloat(((punchOut - punchIn) / (1000 * 60 * 60)).toFixed(2));

        // Breaks Logic
        const breaks = [];
        const numBreaks = Math.floor(Math.random() * 2) + 1;
        for (let b = 0; b < numBreaks; b++) {
          const breakStart = new Date(punchIn.getTime() + (3 + b * 2) * 60 * 60000);
          const breakDuration = 30 + Math.floor(Math.random() * 30);
          const breakEnd = new Date(breakStart.getTime() + breakDuration * 60000);
          breaks.push({
            startTime: breakStart,
            endTime: breakEnd,
            duration: breakDuration,
            type: b === 0 ? 'Lunch Break' : 'Tea Break'
          });
        }

        // Geo-fencing status
        const isOutsideToday = Math.random() < 0.4; 

        attendanceRecords.push({
          user: emp._id,
          date: date,
          status: status,
          punchIn: {
            time: punchIn,
            location: { 
              latitude: isOutsideToday && Math.random() > 0.5 ? office.latitude + 0.05 : office.latitude, 
              longitude: office.longitude, 
              address: isOutsideToday && Math.random() > 0.5 ? 'Outside Authorized Zone' : office.address 
            },
            selfie: `https://i.pravatar.cc/150?u=${emp._id}in${d}`,
            isOutside: isOutsideToday
          },
          punchOut: {
            time: punchOut,
            location: { latitude: office.latitude, longitude: office.longitude, address: office.address },
            selfie: `https://i.pravatar.cc/150?u=${emp._id}out${d}`,
            isOutside: isOutsideToday
          },
          workingHours: workingHours,
          totalDistance: isOutsideToday ? totalDistance : 0,
          trackingLogs: isOutsideToday ? trackingLogs : [],
          breaks: breaks,
          isLate: isLate,
          isHalfDay: isHalfDay,
          isOutside: isOutsideToday,
          signalStatus: 'online'
        });
      }
    }

    await Attendance.insertMany(attendanceRecords);
    await Leave.insertMany(leaveRecords);

    console.log(`Successfully seeded:`);
    console.log(`- ${employees.length} Employees`);
    console.log(`- ${attendanceRecords.length} Attendance Records (30 Days)`);
    console.log(`- ${leaveRecords.length} Leave Records`);
    console.log('Seeding process finished.');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
