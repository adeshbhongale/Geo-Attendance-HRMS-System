import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { startHeartbeat, stopHeartbeat } from './heartbeat.service';
import { startSelfHealingWatchdog, stopSelfHealingWatchdog } from './selfHealingWatchdog';
import { forceSyncAll, startSyncLoop, stopSyncLoop } from './sync.service';
import { startTracking as startFgTracking, stopTracking as stopFgTracking } from './tracking.service';

const LOCATION_TRACKING_TASK = 'background-location-tracking';

/**
 * Fixed GPS collection interval (5 seconds).
 * 
 * WHY FIXED? On Realme/OPPO/ColorOS, dynamically restarting
 * startLocationUpdatesAsync() is interpreted as "battery abuse"
 * and the OS kills the foreground service. A fixed interval
 * avoids this entirely. Speed-based filtering happens server-side.
 */
const GPS_INTERVAL_MS = 5000;

let isManagerActive = false;

/**
 * Global Tracking Manager Service
 * Manages location tracking lifecycle independently of the UI.
 * 
 * ARCHITECTURE (Post-Fix):
 * - startFgTracking() sets up trip state + collects first point (NO watcher)
 * - startLocationUpdatesAsync() is the SINGLE GPS collection mechanism
 *   that works in both foreground and background via foreground service.
 * - No dynamic interval changes to avoid OS killing the service.
 */

export const initializeTracking = async () => {
  try {
    // Ensure socket room is joined immediately on startup or login
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      const socket = require('../socket').default;
      if (socket) {
        console.log('[TrackingManager] Ensuring socket is joined for user:', userId);
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit('join', userId);
      }
    }

    const activeTripId = await AsyncStorage.getItem('activeTripId');
    if (activeTripId) {
      console.log('[TrackingManager] Auto-resuming tracking for active trip:', activeTripId);
      await startTrackingSession(activeTripId);
      return;
    }

    // Fallback: If they logged in but activeTripId is missing locally (e.g. fresh login/re-install)
    const token = await AsyncStorage.getItem('token');
    if (token) {
      console.log('[TrackingManager] Active trip not found locally, checking server...');
      const api = require('../api/axios').default; // import dynamically to avoid circular references
      const res = await api.get('/auth/me');
      const todayAttendance = res.data?.todayAttendance;
      if (todayAttendance && todayAttendance.punchIn?.time && !todayAttendance.punchOut?.time) {
        console.log('[TrackingManager] Active session found on server. Starting tracking session:', todayAttendance._id);
        await startTrackingSession(todayAttendance._id);
      }
    }
  } catch (err) {
    console.error('[TrackingManager] Initialization failed:', err);
  }
  // Listen for network reconnection and try to restart tracking
  try {
    NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        try {
          const activeTripId = await AsyncStorage.getItem('activeTripId');
          if (activeTripId) {
            console.log('[TrackingManager] Network reconnected — ensuring tracking is running for trip:', activeTripId);
            await restartTracking();
          }
        } catch (e) {
          console.warn('[TrackingManager] NetInfo handler error:', e.message);
        }
      }
    });
  } catch (netErr) {
    console.warn('[TrackingManager] Failed to subscribe NetInfo:', netErr.message);
  }
};

export const startTrackingSession = async (tripId) => {
  if (isManagerActive) return;
  isManagerActive = true;

  try {
    // 1. Cache the trip ID persistently
    await AsyncStorage.setItem('activeTripId', tripId);

    // 2. Ensure permissions
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();

    if (fg === 'granted') {
      // 3. Start foreground tracking (sets trip state + first point, NO watcher)
      await startFgTracking(tripId);
      // 4. Start synchronization background loop
      startSyncLoop();
    }

    if (fg === 'granted' && bg === 'granted') {
      // 5. Start the SINGLE GPS collection system: startLocationUpdatesAsync
      // This works in BOTH foreground and background via foreground service notification.
      // Uses a FIXED interval to prevent Realme/OPPO from killing the service.
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: GPS_INTERVAL_MS,
        distanceInterval: 3,
        foregroundService: {
          notificationTitle: "Geo-Track HRMS",
          notificationBody: "Tracking active until punch out",
          notificationColor: "#4f46e5"
        },
        // Android-specific: keep alive in background
        activityType: Location.ActivityType.AutomotiveNavigation,
        showsBackgroundLocationIndicator: true,
      });
      console.log(`[TrackingManager] Background location updates started (fixed ${GPS_INTERVAL_MS}ms interval)`);
    }

    // Start tracking health monitoring services (heartbeat + local watchdog)
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      startHeartbeat(userId, tripId);
      startSelfHealingWatchdog(userId);
    }

    console.log('[TrackingManager] Tracking session started successfully for trip:', tripId);
  } catch (err) {
    console.error('[TrackingManager] Failed to start tracking session:', err);
    isManagerActive = false;
  }
};

export const stopTrackingSession = async () => {
  try {
    // 1. Force uploading remaining points in SQLite before stop
    await forceSyncAll();

    // 2. Stop foreground tracking state
    await stopFgTracking();

    // 3. Stop sync loops
    stopSyncLoop();

    // 4. Stop background location updater
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    }

    // Stop tracking health monitoring services
    stopHeartbeat();
    stopSelfHealingWatchdog();

    console.log('[TrackingManager] Tracking session stopped');
  } catch (err) {
    console.error('[TrackingManager] Failed to stop tracking session:', err);
  } finally {
    isManagerActive = false;
  }
};

export const clearTrackingSession = async () => {
  await stopTrackingSession();
  await AsyncStorage.removeItem('activeTripId');
  console.log('[TrackingManager] Active trip ID cleared persistently');
};

/**
 * Restart tracking session (used for recovery)
 */
export const restartTracking = async () => {
  console.log('[TrackingManager] restartTracking called');
  const activeTripId = await AsyncStorage.getItem('activeTripId');
  if (activeTripId) {
    await stopTrackingSession();
    await new Promise(resolve => setTimeout(resolve, 500));
    await startTrackingSession(activeTripId);
  }
};
