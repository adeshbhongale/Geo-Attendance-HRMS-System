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
      { name: 'Morning Shift', startTime: '09:00', endTime: '18:00', gracePeriod: 15, halfDayAfter: '11:00', workingHours: 9 },
      { name: 'Evening Shift', startTime: '14:00', endTime: '23:00', gracePeriod: 15, halfDayAfter: '16:00', workingHours: 9 },
      { name: 'Night Shift', startTime: '22:00', endTime: '07:00', gracePeriod: 15, halfDayAfter: '00:00', workingHours: 9, isNightShift: true }
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
      password: 'admin123', // Model will hash it on save if middleware is active, but we can also pre-hash
      role: 'admin',
      department: 'Management'
    });
    console.log('Created Admin User (admin@example.com / admin123).');

    // 5. Create Employees
    const departments = ['IT', 'Sales', 'HR', 'Support'];
    const employeeData = [];

    for (let i = 1; i <= 15; i++) {
      const dept = departments[i % departments.length];
      const shift = shifts[i % shifts.length];

      // Pre-hash password for insertMany since it skips middleware
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      employeeData.push({
        name: `Employee ${i}`,
        email: `emp${i}@example.com`,
        mobile: `91000000${i.toString().padStart(2, '0')}`,
        password: hashedPassword,
        role: 'employee',
        department: dept,
        designation: i % 2 === 0 ? 'Senior Executive' : 'Junior Associate',
        shift: shift._id,
        headquarter: i % 3 === 0 ? 'Ichalkaranji HQ' : 'Pune HQ',
        leaveBalance: 3,
        monthlyLeaveLimit: 3
      });
    }
    const employees = await User.insertMany(employeeData);
    console.log(`Created ${employees.length} Employees with hashed passwords.`);

    // 6. Generate Attendance (Last 30 Days)
    const today = new Date();
    const attendanceRecords = [];
    const leaveRecords = [];

    for (let d = 0; d < 30; d++) {
      const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      date.setUTCDate(date.getUTCDate() - d);

      const isWeekend = date.getUTCDay() === 0; // Sunday

      for (const emp of employees) {
        if (isWeekend) continue; // Skip Sundays for attendance

        // 10% chance of being on leave
        if (Math.random() < 0.1) {
          leaveRecords.push({
            user: emp._id,
            leaveType: 'Sick Leave',
            startDate: date,
            endDate: date,
            reason: 'Not feeling well',
            status: Math.random() > 0.3 ? 'Approved' : 'Pending'
          });
          continue;
        }

        // 5% chance of being absent
        if (Math.random() < 0.05) continue;

        const isLate = Math.random() < 0.2;
        const status = isLate ? 'Late' : 'Present';

        const punchIn = new Date(date);
        punchIn.setUTCHours(9, isLate ? 30 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 15), 0);

        const punchOut = new Date(date);
        punchOut.setUTCHours(18, Math.floor(Math.random() * 45), 0);

        // Tracking logs for last 7 days - Circular road coverage (Closed loop: Start/End at Office)
        const trackingLogs = [];
        let totalDistance = 0;

        if (d < 7) {
          const radius = 0.006 + Math.random() * 0.004;
          const startAngle = Math.random() * Math.PI * 2;
          const sweep = (Math.random() > 0.5 ? 1 : -1) * (Math.PI + Math.random() * Math.PI);

          for (let k = 0; k < 20; k++) {
            let lat, lng;
            if (k === 0 || k === 19) {
              // Forced closed loop: First and last points are the office HQ
              lat = office.latitude;
              lng = office.longitude;
            } else {
              const angle = startAngle + (k / 19) * sweep;
              const jitter = (Math.random() - 0.5) * 0.0005;
              lat = office.latitude + (radius + jitter) * Math.cos(angle);
              lng = office.longitude + (radius + jitter) * Math.sin(angle);
            }

            if (k > 0) {
              const prev = trackingLogs[k - 1];
              // Simple distance calculation (km)
              const dLat = (lat - prev.latitude) * 111;
              const dLng = (lng - prev.longitude) * 111 * Math.cos(lat * Math.PI / 180);
              totalDistance += Math.sqrt(dLat * dLat + dLng * dLng);
            }

            trackingLogs.push({
              time: new Date(punchIn.getTime() + (k * 30 * 60000)),
              latitude: lat,
              longitude: lng,
              address: k === 0 || k === 19 ? office.address : `Road ${Math.floor(k / 3) + 1}, Ichalkaranji Sector`,
              battery: 98 - (k * 1),
              isOutside: k !== 0 && k !== 19
            });
          }
        }

        attendanceRecords.push({
          user: emp._id,
          date: date,
          status: status,
          punchIn: {
            time: punchIn,
            location: { latitude: office.latitude, longitude: office.longitude, address: office.address },
            selfie: `https://i.pravatar.cc/150?u=${emp._id}in`
          },
          punchOut: {
            time: punchOut,
            location: { latitude: office.latitude, longitude: office.longitude, address: office.address },
            selfie: `https://i.pravatar.cc/150?u=${emp._id}out`
          },
          workingHours: 8 + Math.random(),
          totalDistance: totalDistance,
          trackingLogs: trackingLogs,
          battery: 80 + Math.random() * 20,
          signalStatus: 'online',
          isLate: isLate,
          isOutside: trackingLogs.some(log => log.isOutside)
        });
      }
    }

    await Attendance.insertMany(attendanceRecords);
    await Leave.insertMany(leaveRecords);

    console.log(`Seeded ${attendanceRecords.length} Attendance records.`);
    console.log(`Seeded ${leaveRecords.length} Leave records.`);
    console.log('Seeding completed successfully!');
    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
