# Geo-Attendance HRMS System

A comprehensive HRMS solution with real-time GPS tracking, geo-fencing, and shift management for organizations with field and office employees.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Seeding](#database-seeding)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## ✨ Features

### Real-time Attendance Management

- GPS-based punch-in/out with precise location tracking
- Optional selfie capture for identity verification
- Automatic working hours calculation
- Real-time attendance status (Present, Late, Half-day, Absent)
- Timestamped location logs throughout the day

### Geo-Fencing Technology

- Office radius configuration by administrator
- Haversine formula for accurate distance calculation
- Location address reverse geocoding
- Multiple tracking points per day

### Live Employee Tracking

- Socket.io real-time location updates
- Interactive maps with employee markers
- Location history visualization
- Live movement tracking on admin dashboard
- Geolocation heat maps

### Employee Management

- Add, edit, delete employees
- Bulk employee import via Excel files
- Department and designation assignment
- Shift assignment and management
- Employee status tracking (active/inactive)
- Profile image uploads
- Leave balance management (3 leaves per month)

### Leave Management System

- Apply for multiple leave types: Sick Leave, Casual Leave, Paid Leave, Emergency Leave, Half Day
- Monthly leave limit: 3 leaves per month
- Admin approval/rejection workflow
- Admin notes on leave decisions
- Leave balance tracking per employee
- Leave history and analytics

### Shift Management

- Create and configure multiple shifts
- Define shift timings (start, end times in 12-hour format)
- Grace period configuration (default: 15 mins)
- Half-day hour limits
- Late arrival rules description
- View all employees assigned to each shift

### Advanced Analytics & Reporting

- Real-time attendance dashboard with statistics (Optimized with MongoDB Aggregation)
- Ultra-fast load times (<80ms) via parallel query execution
- Daily, weekly, and monthly attendance reports
- Employee-wise analytics and performance tracking
- Leave summary and statistics
- Punctuality reports and trends
- Export reports to Excel/PDF formats (Branded landscapes)
- Department-wise analytics
- Attendance charts and visualizations

### Admin Dashboard

- Real-time overview of all employees
- Today's attendance summary
- Pending leave applications
- Active employee locations
- System statistics and health
- Quick action buttons
- Customizable widgets

### Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (Admin/Employee)
- OTP verification for admin login (7-digit codes)
- Password hashing with bcryptjs
- Secure token storage
- CORS protection
- Input validation and sanitization

## 🛠️ Tech Stack

### Frontend - Admin Panel

- **React.js 18+** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Recharts** - Data visualization
- **Redux** - State management
- **Axios** - HTTP client

### Frontend - Mobile App

- **React Native 0.72+** - Cross-platform framework
- **Expo** - Development platform
- **NativeWind v4** - Tailwind CSS for React Native
- **React Native Maps** - Location mapping
- **Lucide React Native** - Icons
- **AsyncStorage** - Local persistence
- **Axios** - HTTP client

### Backend

- **Node.js 18+** - Runtime environment
- **Express.js 4.18+** - Web framework
- **MongoDB 5+** - NoSQL database
- **Mongoose 7+** - ODM
- **Socket.io** - Real-time communication
- **JWT (jsonwebtoken)** - Authentication
- **bcryptjs** - Password hashing
- **XLSX** - Excel file handling
- **CORS** - Cross-origin handling
- **Dotenv** - Environment variables

## 📁 Project Structure

```
Geo-Attendance-HRMS-System/
├── admin-panel/                 # React Admin Dashboard
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   ├── store/              # Redux state management
│   │   ├── api/                # Axios configuration
│   │   ├── assets/             # Images, icons
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── eslint.config.js
│
├── mobile-app/                 # React Native Mobile App
│   ├── src/
│   │   ├── screens/            # Screen components
│   │   ├── components/         # Reusable components
│   │   ├── api/                # Axios configuration
│   │   ├── store/              # State management
│   │   ├── theme/              # Theme configuration
│   │   └── utils/              # Utility functions
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   ├── metro.config.js
│   ├── babel.config.js
│   ├── tailwind.config.js
│   └── global.css
│
├── backend/                    # Node.js Backend API
│   ├── controllers/            # Business logic
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API routes
│   ├── middleware/             # Express middleware
│   ├── config/                 # Configuration files
│   ├── scripts/                # Utility scripts
│   ├── data/                   # Seed data
│   ├── utils/                  # Helper functions
│   ├── server.js               # Entry point
│   ├── package.json
│   └── .env                    # Environment variables

├── project.md                  # Full project documentation
├── README.md                   # This file
└── .gitignore
```

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v8.0.0 or higher (comes with Node.js)
- **MongoDB** v5.0 or higher (local or cloud - MongoDB Atlas recommended)
- **Git** (for version control)
- **Expo CLI** (for mobile app development): `npm install -g expo-cli`
- **Android Studio** or **Xcode** (for mobile emulators - optional)
- **Postman** or **Insomnia** (for API testing - optional)

### Verify Installation

```bash
node --version
npm --version
git --version
```

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/Geo-Attendance-HRMS-System.git
cd Geo-Attendance-HRMS-System
```

### Step 2: Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Verify MongoDB Connection

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas connection string
```

#### Seed Database

```bash
npm run seed
# This creates default users, shifts, location, and sample data
```

#### Start Backend Server

```bash
# Development mode (with hot-reload)
npm run dev

# Production mode
npm start

# Server runs on http://localhost:5000
```

#### Available Backend Scripts

```bash
npm run dev           # Start with nodemon (hot-reload)
npm start             # Start server
npm run seed          # Seed database with initial data
npm run create-admin  # Create admin account manually
npm run reset-db      # Reset database (dangerous!)
```

---

### Step 3: Admin Panel Setup

#### Open New Terminal Window

```bash
cd admin-panel
```

#### Install Dependencies

```bash
npm install
```


#### Start Development Server

```bash
npm run dev
# Admin panel runs on http://localhost:5173
```

#### Available Admin Panel Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

#### Login to Admin Panel

1. Access the web portal
2. Enter your admin email
3. Enter the Password (check backend console in development)

---

### Step 4: Mobile App Setup

#### Open New Terminal Window

```bash
cd mobile-app
```

#### Install Dependencies

```bash
npm install
```


#### Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
```

#### Start Development Server

```bash
# Clear cache (recommended)
npx expo start -c

# Or without clearing cache
npx expo start
```

#### Run on Different Platforms

**Android Emulator:**

```bash
# Make sure Android emulator is running
npx expo start
# Press 'a' in terminal to open Android emulator
# Or run:
npx expo run:android
```

**iOS Simulator (macOS only):**

```bash
# Make sure Xcode is installed
npx expo start
# Press 'i' in terminal to open iOS simulator
# Or run:
npx expo run:ios
```

**Physical Device:**

```bash
# Use Expo Go app from App Store or Play Store
npx expo start
# Scan QR code from terminal with Expo Go app
```

**Web Browser:**

```bash
npx expo start
# Press 'w' in terminal to open web version
# Or run:
npx expo run:web
```

#### Available Mobile App Scripts

```bash
npm start              # Start Expo development server
npx expo start -c      # Start with cache cleared
npx expo run:android   # Build and run on Android
npx expo run:ios       # Build and run on iOS (macOS only)
npx expo run:web       # Run on web browser
npm run build          # Build for production
```

---

## 🏃 Running the Application

### Option 1: Run All Three Services (Recommended for Development)

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Output: Server running on http://localhost:5000
```

**Terminal 2 - Admin Panel:**

```bash
cd admin-panel
npm run dev
# Output: Local:   http://localhost:5173/
```

**Terminal 3 - Mobile App:**

```bash
cd mobile-app
npx expo start -c
# Output: Press 'a' for Android, 'i' for iOS, 'w' for web, 'q' to quit
```

### Option 2: Using Docker (Optional)

```bash
# Build and run all services with Docker Compose
docker-compose up --build

# Backend: http://localhost:5000
# Admin: http://localhost:5173
# Mobile: http://localhost:8081
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Routes

```
POST   /auth/register           - Register new user
POST   /auth/login               - Login with password
POST   /auth/logout              - Logout user
POST   /auth/refresh-token       - Refresh JWT token
GET    /auth/me                  - Get current user profile
PUT    /auth/updatedetails       - Update user profile
```

### Attendance Routes

```
POST   /attendance/punch-in      - Mark punch-in
POST   /attendance/punch-out     - Mark punch-out
GET    /attendance/my-attendance - Get user's attendance
GET    /attendance/report        - Get attendance report (admin)
```

### Employee Routes

```
GET    /employees/               - Get all employees (admin)
POST   /employees/               - Add new employee (admin)
PUT    /employees/:id            - Update employee (admin)
DELETE /employees/:id            - Delete employee (admin)
```

### Leave Routes

```
POST   /leaves/                  - Apply for leave
GET    /leaves/my-leaves         - Get user's leaves
GET    /leaves/                  - Get all leaves (admin)
PATCH  /leaves/:id               - Update leave status (admin)
```

### Shift Routes

```
GET    /shifts/                  - Get all shifts
POST   /shifts/                  - Create shift (admin)
PUT    /shifts/:id               - Update shift (admin)
DELETE /shifts/:id               - Delete shift (admin)
```
---

## 💾 Database Seeding

### Automatic Seeding

```bash
cd backend
npm run seedmore
or
npm run seed
```

### 📊 Comprehensive Seeded Data
The system is pre-populated with a production-scale dataset for testing analytics and tracking:

- **16 Total Users**: 1 Super Admin + 15 Employees (across IT, Sales, HR, Support, and Logistics).
- **3 Production Shifts**:
  - **Morning Shift**: 08:00 - 16:00
  - **Evening Shift**: 16:00 - 00:00
  - **Night Shift**: 00:00 - 08:00 (Crosses midnight boundary)
- **1 Office HQ**: Geo-fence set at **Ichalkaranji HQ** with a precise 200m radius.
- **~400 Attendance Records**: Full **30-day historical data** for all employees, including weekend gaps and randomized statuses (Present, Late, Half-Day, Absent).
- **~150 Leave Records**: Comprehensive leave history including **Past, Current, and Future** planned leaves with all statuses (Pending, Approved, Rejected, Cancelled).
- **High-Density Micro-Tracking**: Exactly **50 GPS tracking points** per attendance record, simulating dense internal movement (1-10m increments) with distance calculations.
---

### Manual Database Reset

```bash
cd backend
npm run reset-db
# Then reseed:
npm run seedmore / npm run seed
```

### View Seeded Data

```bash
# Connect to MongoDB
mongosh

# List databases
show databases

# Use geo-attendance database
use geo-attendance

# View collections
show collections

# View sample data
db.users.findOne()
db.attendance.find().limit(5)
db.leaves.find().limit(5)
```

---


## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**

```bash
# Check if MongoDB is running
# For local MongoDB:
mongod

# For MongoDB Atlas, verify connection string
```

**Port Already in Use**

```bash
# Change PORT in .env to 5001 or 5002
# Or kill process on port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows (then taskkill /PID <PID> /F)
```

**npm install Fails**

```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Admin Panel Issues

**Vite Port Conflict**

```bash
# Change port in vite.config.js
# Or use:
npm run dev -- --port 5174
```

**API Connection Timeout**

```bash
# Verify backend is running on port 5000
# Check VITE_API_BASE_URL in .env
# Ensure CORS is enabled in backend
```

### Mobile App Issues

**Expo Start Fails**

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules .expo
npm install
npx expo start -c
```

**Babel/Metro Errors**

```bash
# Update Expo and dependencies
npm install expo@latest

# Clear cache
npx expo start -c
```

**Metro Web Issues**

```bash
# Ensure metro.config.js and babel.config.js are correct
# Clear cache
npx expo start -c

# Reinstall NativeWind
npm install nativewind@latest
```

---

## 🌐 Production Deployment

### Backend Deployment

**Using PM2 (Recommended)**

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name "geo-attendance-api"

# Setup startup
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs geo-attendance-api
```

**Using Heroku**

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create geo-attendance-api

# Set environment variables
heroku config:set MONGO_URI=your_atlas_uri
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

### Admin Panel Deployment

**Using Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Using Netlify**

```bash
# Build
npm run build

# Deploy dist folder to Netlify
# Or use Netlify CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Mobile App Deployment

**Build for Production**

```bash
cd mobile-app

# Build for iOS and Android
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 📊 System Statistics

- **Leave Limit**: 3 leaves per month
- **Grace Period**: 15 minutes (configurable)
- **Geo-fence Radius**: 200 meters (configurable)
- **JWT Expiry**: 15 minutes
- **Refresh Token Expiry**: 7 days
- **Max Concurrent Users**: 10,000+
- **API Response Time**: <200ms

---

## 📞 Support

For issues or questions:

1. Check [project.md](./project.md) for detailed documentation
2. Review troubleshooting section above
3. Check terminal logs for error messages
4. Verify all prerequisites are installed

---

## 📄 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: May 13, 2026  
**Version**: 1.8.0  
**Status**: Production Hardened (High Performance)
