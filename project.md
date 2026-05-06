# Project Documentation: Geo-Attendance HRMS System

## Architecture Overview
The system follows a modern client-server architecture:
- **Client (Admin)**: A React-based web dashboard for HR administrators.
- **Client (Mobile)**: A React Native app for employees to log attendance and track locations.
- **Server**: A Node.js/Express API with Socket.io for real-time updates.
- **Database**: MongoDB for persistent data storage.

## Database Design (Mongoose Models)

### User / Employee
- `name`, `email`, `mobile`, `password`, `role` (Admin/Employee), `department`, `shift`, `status`, `profileImage`.

### Attendance
- `user` (Ref), `date`, `punchIn` (time, location, selfie), `punchOut` (time, location), `status`, `workingHours`, `isLate`, `isHalfDay`, `isOutside`.

### Shift
- `name`, `startTime`, `endTime`, `gracePeriod`, `halfDayLimit`.

### Location (Geo-Fence)
- `name`, `latitude`, `longitude`, `radius`, `address`.

## Geo-Fencing Logic
The system uses the **Haversine formula** to calculate the distance between the employee's current GPS coordinates and the predefined office coordinates.
If the distance > radius, the attendance is marked as "Outside Location".

## Authentication Flow
1. User logs in via Email/Mobile.
2. Server validates and issues a JWT and a Refresh Token.
3. Client stores tokens securely and includes the JWT in the `Authorization` header for subsequent requests.
4. If JWT expires, the Refresh Token is used to obtain a new JWT.

## Deployment Guide
- **Backend**: Can be deployed on AWS EC2, Heroku, or DigitalOcean using PM2.
- **Admin Panel**: Can be deployed on Vercel, Netlify, or AWS S3+CloudFront.
- **Mobile App**: Can be built using Expo EAS and distributed via App Store / Play Store.

## Recent System Refinements

### 1. Admin Panel UI & UX Modernization
- **Typography & Accessibility**: Completely removed uppercase and italic styling. Standardized on `font-bold` and replaced technical jargon with plain English across all pages (e.g., Login, Profile, Employees).
- **Dashboard Stabilization**: Fixed layout clipping issues that hid calendar popovers by adjusting `overflow` properties and aligning popovers dynamically.
- **Settings & Shifts Enhancements**: Added a dynamic, visually-increasing gradient track to the Geo-Fence radius slider. Upgraded the Shift configuration to utilize 12-hour (AM/PM) time formats and introduced dedicated "Late Rules" parameters.

### 2. Backend & Performance
- **Caching Disabled for Real-Time Data**: Implemented global Express middleware to enforce `Cache-Control: no-store, no-cache, must-revalidate` and disabled `ETag` generation. This prevents stale `304 Not Modified` responses and ensures dashboard data is always real-time.
- **Authentication**: Upgraded the OTP generation and validation logic to securely handle 7-digit codes.
- **Codebase Cleanup**: Removed unsecured temporary utility scripts (`verify_data.js`).

### 3. Mobile App & Infrastructure
- **Web Platform Compatibility**: Abstracted `react-native-maps` into a platform-agnostic component (`AttendanceMap.js` and `AttendanceMap.web.js`). This isolates native-only APIs and perfectly resolves Metro web-bundling crashes.
- **Login Redesign**: Overhauled the `LoginScreen` with a premium aesthetic (super-ellipse corners, deep shadows, bold headers) and integrated the 7-digit OTP workflow while correcting React Native JSX syntax rules.
- **NativeWind v4 Integration**: Restored broken Tailwind CSS styling by explicitly creating `metro.config.js` and mapping it to the `global.css` file using `withNativeWind`.
- **Reanimated Crash Resolution**: Resolved critical `installTurboModule` and `makeMutable` exceptions on Android by correcting the Babel configuration. Removed duplicate and legacy Reanimated plugins, allowing NativeWind's internal worklet plugin to handle AST transformations cleanly without corrupting the native threads.
