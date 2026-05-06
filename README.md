# Geo-Attendance HRMS System

A comprehensive HRMS solution with real-time GPS tracking, geo-fencing, and shift management.

## Features
- **Real-time Attendance**: GPS-based punch-in/out with selfie validation.
- **Geo-Fencing**: Automatic validation of employee location within office radius.
- **Live Tracking**: Socket.io integration for real-time location markers on admin dashboard.
- **Employee Management**: CRUD operations with bulk Excel upload support.
- **Leave Management**: Simplified workflow for leave applications and approvals.
- **Analytics**: Beautiful charts for attendance, leaves, and department statistics.

## Project Structure
- `backend/`: Node.js, Express, Mongoose, Socket.io
- `admin-panel/`: React, Vite, Recharts, Framer Motion
- `mobile-app/`: React Native, Expo, Google Maps

## Running the Application Locally

You will need three separate terminal windows to run the full stack simultaneously.

### 1. Backend (API Server)
```bash
cd backend
npm install
# Create .env from .env.example
node scripts/seedData.js # Run once to seed initial data
npm run dev # Starts the server on port 5000
```

### 2. Admin Panel (Web Dashboard)
```bash
cd admin-panel
npm install
npm run dev # Starts Vite server on port 5173
```

### 3. Mobile App (Employee Portal)
```bash
cd mobile-app
npm install
npx expo start -c # The -c flag clears the cache to prevent Babel/Metro styling issues
```

## Admin Credentials
Admin credentials can be configured in the `backend/.env` file using `ADMIN_EMAIL` and `ADMIN_PASSWORD` keys.