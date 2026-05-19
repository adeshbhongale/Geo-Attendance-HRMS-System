# Geo-Attendance HRMS System

A comprehensive HRMS solution with real-time GPS tracking, geo-fencing, and shift management for organizations with field and office employees.

---

## 🚀 Installation & Setup

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** v18.0.0 or higher
- **MongoDB** v5.0 or higher (running locally or Atlas)

### 2. Backend Setup
```bash
cd backend
npm install
npm run seedmore  # Seed database with comprehensive configuration & mock records
npm run dev       # Start backend server
```

### 3. Admin Panel Setup
```bash
cd admin-panel
npm install
npm run dev       # Start admin web portal
```

### 4. Mobile App Setup
```bash
cd mobile-app
npm install
npm start         # Start Expo development server
```

---

## 🏃 Running the Application

Start each service in a separate terminal:

1. **Backend**: `cd backend && npm run dev`
2. **Admin Panel**: `cd admin-panel && npm run dev`
3. **Mobile App**: `cd mobile-app && npm start`

---

## 💾 Essential Scripts (As defined in package.json)

### Backend
- `npm run dev` - Start development server using nodemon
- `npm start` - Start production server using node
- `npm run seedmore` - Seed comprehensive historical logs & demo data
- `npm run admin` - Create administrator account manually
- `npm run reset` - Reset database tables (wipes existing data)
- `npm run bench` - Run application benchmarks
- `npm run simulate` - Run real-time background location simulation

### Admin Panel
- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint checking
- `npm run preview` - Preview production build locally

### Mobile App
- `npm start` - Start Expo development server
- `npm run build` - Export production bundle
- `npm run android` - Compile and run on Android emulator/device
- `npm run ios` - Compile and run on iOS simulator/device
- `npm run web` - Run in browser
