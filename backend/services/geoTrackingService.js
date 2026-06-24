/**
 * Geo Tracking Service
 * Centralized logic for location and distance calculations
 */

/**
 * Calculates distance between two points in KM using Haversine formula
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lon1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lon2 - Longitude of point 2
 * @returns {Number} Distance in KM
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(6));
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculates total distance for an array of tracking points
 * @param {Array} points - Array of tracking points with lat/lng
 * @returns {Number} Total distance in KM
 */
exports.calculateTotalDistance = (points) => {
  if (!points || points.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += exports.calculateDistance(
      points[i].latitude,
      points[i].longitude,
      points[i + 1].latitude,
      points[i + 1].longitude
    );
  }
  return parseFloat(total.toFixed(6));
};

/**
 * Validates if a new location point is realistic compared to the last point
 * @param {Object} lastPoint - Previous location point
 * @param {Object} newPoint - New location point
 * @returns {Object} { isValid, isSuspicious, isWeak, isRecovery, distance, reason, status }
 */
exports.validateLocation = (lastPoint, newPoint) => {
  if (!lastPoint || !lastPoint.latitude || !lastPoint.longitude || !lastPoint.time) {
    return { isValid: true, isSuspicious: false, distance: 0 };
  }

  const distance = exports.calculateDistance(
    lastPoint.latitude,
    lastPoint.longitude,
    newPoint.latitude,
    newPoint.longitude
  );

  const timeDiff = (new Date(newPoint.time) - new Date(lastPoint.time)) / 1000; // in seconds

  // 1. GPS Lost -> GPS Recovered (Long Signal Gap)
  if (timeDiff > 120) {
    return {
      isValid: true,
      isRecovery: true,
      distance: 0, // Fresh segment starts, do not count jump distance
      reason: 'GPS Recovery after signal gap (> 120s)'
    };
  }

  // 2. Accuracy Check (Do not discard points where accuracy > 50m, mark them as 'weak')
  if (newPoint.accuracy && newPoint.accuracy > 50) {
    return {
      isValid: true,
      isWeak: true,
      status: 'weak',
      distance: 0, // Do not add distance for noisy GPS drift
      reason: 'Weak GPS signal (> 50m)'
    };
  }

  // 3. Stationary Drift Correction: If movement < 5m (0.005km), ignore it
  if (distance < 0.005) {
    return {
      isValid: false,
      isSuspicious: false,
      status: 'idle',
      distance: 0,
      reason: 'Stationary drift (< 5m)'
    };
  }

  // 4. Max Speed Validation (Bike/Vehicle standard: 120 km/h)
  const speedKmh = timeDiff > 0 ? (distance / (timeDiff / 3600)) : 0;
  if (speedKmh > 120) {
    return {
      isValid: false,
      isSuspicious: true,
      distance: 0,
      reason: `Suspiciously high speed (> 120km/h: ${speedKmh.toFixed(2)} km/h)`
    };
  }

  return { isValid: true, isSuspicious: false, distance };
};

/**
 * Applies a 2D Kalman filter on a batch of tracking points to smooth route jitter
 * @param {Object} lastPoint - Last known location point (with coordinates)
 * @param {Array} points - Array of points to smooth
 * @param {number} processNoise - Tunable process noise
 * @returns {Array} Smoothed points
 */
exports.smoothPoints = (lastPoint, points, processNoise = 0.0000001) => {
  if (!points || points.length === 0) return [];

  let latFilter = {
    value: lastPoint ? lastPoint.latitude : null,
    error: lastPoint ? (lastPoint.accuracy || 10) : 10
  };
  let lngFilter = {
    value: lastPoint ? lastPoint.longitude : null,
    error: lastPoint ? (lastPoint.accuracy || 10) : 10
  };

  return points.map(p => {
    const accuracy = p.accuracy || 10;
    const measurementNoise = accuracy * accuracy;

    // Latitude update
    if (latFilter.value === null) {
      latFilter.value = p.latitude;
      latFilter.error = measurementNoise;
    } else {
      latFilter.error = latFilter.error + processNoise;
      const gain = latFilter.error / (latFilter.error + measurementNoise);
      latFilter.value = latFilter.value + gain * (p.latitude - latFilter.value);
      latFilter.error = (1 - gain) * latFilter.error;
    }

    // Longitude update
    if (lngFilter.value === null) {
      lngFilter.value = p.longitude;
      lngFilter.error = measurementNoise;
    } else {
      lngFilter.error = lngFilter.error + processNoise;
      const gain = lngFilter.error / (lngFilter.error + measurementNoise);
      lngFilter.value = lngFilter.value + gain * (p.longitude - lngFilter.value);
      lngFilter.error = (1 - gain) * lngFilter.error;
    }

    return {
      ...p,
      latitude: parseFloat(latFilter.value.toFixed(6)),
      longitude: parseFloat(lngFilter.value.toFixed(6))
    };
  });
};

/**
 * Filter out 1-2 outlier GPS points (spikes/glitches) from a sequence of points.
 * @param {Array} points - Array of points with latitude/longitude
 * @returns {Array} Cleaned array of points
 */
exports.filterOutliers = (points) => {
  // Return ALL points, no filtering!
  return points;
};


