const { RawTrackingPoint, TrackingSession, TrackingLog, LiveEmployeeStatus } = require('../models/Tracking');
const geoService = require('./geoTrackingService');
const { reverseGeocodeLatLng } = require('../utils/googleMaps');
const Attendance = require('../models/Attendance');

/**
 * Enterprise Tracking Service
 * Handles high-fidelity tracking, batching, and aggregation.
 */

// Memory buffer for 1-minute aggregation (Temporary store before DB write)
const aggregationBuffer = new Map(); 

exports.processTrackingBatch = async (userId, batch, socketIo) => {
  if (!batch || batch.length === 0) return;

  const mongoose = require('mongoose');
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('[EnterpriseTracking] Invalid or missing userId for tracking batch:', userId);
    return { success: false, error: 'Invalid userId' };
  }

  try {
    const validPoints = [];
    let batchDistance = 0;

    // 1. Fetch or create Live Status for real-time broadcast
    let liveStatus = await LiveEmployeeStatus.findOne({ userId });
    if (!liveStatus) {
      liveStatus = new LiveEmployeeStatus({ userId });
    }

    // Determine the start point for Kalman smoothing
    const startPoint = liveStatus.lastLocation?.coordinates ? {
      latitude: liveStatus.lastLocation.coordinates[1],
      longitude: liveStatus.lastLocation.coordinates[0],
      accuracy: 10
    } : null;

    // Apply Kalman Filter route smoothing on incoming batch
    const smoothedBatch = geoService.smoothPoints(startPoint, batch);

    let lastValidPoint = null;

    // 2. Process each point in the smoothed batch
    for (const point of smoothedBatch) {
      const { latitude, longitude, accuracy, speed, timestamp, isMock, heading } = point;

      if (isMock) {
        // Flag mock location usage
        liveStatus.movementState = 'Suspicious (Mock)';
      }

      const currentPoint = {
        userId,
        location: { type: 'Point', coordinates: [longitude, latitude] },
        accuracy,
        speed,
        heading,
        timestamp: new Date(timestamp),
        status: 'valid'
      };

      // Speed & Jump Validation against last known valid point
      const lastPointRef = lastValidPoint || (liveStatus.lastLocation?.coordinates ? {
        latitude: liveStatus.lastLocation.coordinates[1],
        longitude: liveStatus.lastLocation.coordinates[0],
        time: liveStatus.lastUpdate
      } : null);

      const validation = geoService.validateLocation(lastPointRef, {
        latitude,
        longitude,
        accuracy,
        time: timestamp
      });

      // Handle GPS Recovery Gap
      if (validation.isRecovery) {
        currentPoint.status = 'valid';
        lastValidPoint = { latitude, longitude, time: timestamp };
        validPoints.push(currentPoint);
        continue;
      }

      // Handle Weak Signal (Don't discard, flag status and skip distance accumulation)
      if (validation.isWeak) {
        currentPoint.status = 'weak';
        validPoints.push(currentPoint);
        continue;
      }

      // Handle Invalid / Suspicious points
      if (!validation.isValid) {
        if (validation.isSuspicious) {
          currentPoint.status = 'suspicious';
          lastValidPoint = { latitude, longitude, time: timestamp }; // Reset baseline to recover tracking instantly
          validPoints.push(currentPoint);
        }
        continue; // Skip noise / drift
      }

      // Valid Point
      batchDistance += validation.distance;
      lastValidPoint = { latitude, longitude, time: timestamp };
      validPoints.push(currentPoint);
    }

    // 3. Batch insert raw points for route history (preventing duplicates)
    if (validPoints.length > 0) {
      const timestamps = validPoints.map(p => p.timestamp);
      const existingRawPoints = await RawTrackingPoint.find({
        userId,
        timestamp: { $in: timestamps }
      });
      const existingTimes = new Set(existingRawPoints.map(p => p.timestamp.getTime()));
      const uniqueValidPoints = validPoints.filter(p => !existingTimes.has(p.timestamp.getTime()));

      let lastPoint = null;
      if (uniqueValidPoints.length > 0) {
        const insertedPoints = await RawTrackingPoint.insertMany(uniqueValidPoints);
        lastPoint = insertedPoints[insertedPoints.length - 1];
      } else {
        lastPoint = await RawTrackingPoint.findOne({ userId }).sort('-timestamp');
      }

      // Update active Attendance record for distance calculations and dashboard stats
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);
      
      const attendance = await Attendance.findOne({
        user: userId,
        date: { $gte: todayStart, $lte: todayEnd }
      }).sort('-date');

      if (attendance) {
        const logsToPush = uniqueValidPoints.map(p => ({
          time: p.timestamp,
          latitude: p.location.coordinates[1],
          longitude: p.location.coordinates[0],
          isSuspicious: p.status === 'suspicious',
          accuracy: p.accuracy,
          speed: p.speed,
          heading: p.heading
        }));

        const mergedLogs = [...attendance.trackingLogs, ...logsToPush];
        mergedLogs.sort((a, b) => new Date(a.time) - new Date(b.time));

        const deduplicatedLogs = [];
        const seenTimes = new Set();
        for (const log of mergedLogs) {
          const timeMs = new Date(log.time).getTime();
          if (!seenTimes.has(timeMs)) {
            seenTimes.add(timeMs);
            deduplicatedLogs.push(log);
          }
        }

        let accumulatedDistance = 0;
        for (let i = 0; i < deduplicatedLogs.length; i++) {
          if (i === 0) {
            deduplicatedLogs[i].distanceFromPrevious = 0;
            deduplicatedLogs[i].totalDistanceTillNow = 0;
          } else {
            const prev = deduplicatedLogs[i - 1];
            const curr = deduplicatedLogs[i];
            const dist = geoService.calculateDistance(
              prev.latitude,
              prev.longitude,
              curr.latitude,
              curr.longitude
            );
            const validDist = dist >= 0.005 ? dist : 0;
            deduplicatedLogs[i].distanceFromPrevious = parseFloat((validDist * 1000).toFixed(2));
            accumulatedDistance += validDist;
            deduplicatedLogs[i].totalDistanceTillNow = parseFloat(accumulatedDistance.toFixed(6));
          }
        }

        attendance.trackingLogs = deduplicatedLogs;
        attendance.totalDistance = parseFloat(accumulatedDistance.toFixed(6));
        attendance.distance = attendance.totalDistance;
        await attendance.save();
      }

      if (lastPoint) {
        // 4. Update Live Status
        liveStatus.lastLocation = lastPoint.location;
        liveStatus.currentSpeed = lastPoint.speed;
        liveStatus.lastUpdate = lastPoint.timestamp;
        liveStatus.totalDistanceToday = attendance ? attendance.totalDistance : (liveStatus.totalDistanceToday + batchDistance);
        liveStatus.movementState = detectMovementState(lastPoint.speed);
        liveStatus.currentStatus = 'online';
      }

      // Background Geocoding Check (Decouple and throttle to > 100m or > 5 min)
      const currentCoords = lastPoint.location.coordinates;
      let shouldGeocode = false;

      if (!liveStatus.lastAddress) {
        shouldGeocode = true;
      } else {
        const lastGeocodedCoords = liveStatus.lastGeocodedLocation?.coordinates || liveStatus.lastLocation?.coordinates;
        if (lastGeocodedCoords) {
          const distSinceLastGeocode = geoService.calculateDistance(
            lastGeocodedCoords[1], lastGeocodedCoords[0],
            currentCoords[1], currentCoords[0]
          );
          const timeSinceLastGeocode = liveStatus.lastGeocodeTime ? (Date.now() - new Date(liveStatus.lastGeocodeTime).getTime()) / 1000 : Infinity;

          if (distSinceLastGeocode > 0.1 || timeSinceLastGeocode > 300) {
            shouldGeocode = true;
          }
        } else {
          shouldGeocode = true;
        }
      }

      if (shouldGeocode) {
        // Execute background geocoding asynchronously without awaiting
        reverseGeocodeAsync(userId, lastPoint).catch(err => {
          console.error('[EnterpriseTracking] Background geocoding invocation failed:', err);
        });
      }

      await liveStatus.save();

      // 5. Real-time broadcast to Admin (Socket.IO)
      if (socketIo) {
        socketIo.emit('liveTrackingUpdate', {
          userId,
          latitude: lastPoint.location.coordinates[1],
          longitude: lastPoint.location.coordinates[0],
          speed: lastPoint.speed,
          distance: liveStatus.totalDistanceToday,
          status: liveStatus.movementState,
          timestamp: lastPoint.timestamp,
          address: liveStatus.lastAddress || 'Live Tracking...',
          path: validPoints.map(p => ({ 
            lat: p.location.coordinates[1], 
            lng: p.location.coordinates[0],
            status: p.status,
            speed: p.speed,
            timestamp: p.timestamp
          }))
        });
      }

      // 6. Handle 1-minute Aggregation
      await bufferForAggregation(userId, validPoints, batchDistance);
    }

    return { success: true, pointsProcessed: validPoints.length };
  } catch (err) {
    console.error('[EnterpriseTracking] Error processing batch:', err);
    throw err;
  }
};

/**
 * Background Asynchronous Geocode Worker
 */
async function reverseGeocodeAsync(userId, lastPoint) {
  try {
    const [longitude, latitude] = lastPoint.location.coordinates;
    const address = await reverseGeocodeLatLng(latitude, longitude);

    if (address) {
      // 1. Update Live Employee Status
      await LiveEmployeeStatus.updateOne(
        { userId },
        { 
          $set: { 
            lastAddress: address,
            lastGeocodedLocation: lastPoint.location,
            lastGeocodeTime: new Date()
          } 
        }
      );

      // 2. Update the address on the RawTrackingPoint itself
      await RawTrackingPoint.updateOne(
        { _id: lastPoint._id },
        { $set: { address } }
      );

      // 3. Update active Attendance tracking log
      const attendance = await Attendance.findOne({
        user: userId,
        "punchOut.time": { $exists: false }
      }).sort('-date');

      if (attendance && attendance.trackingLogs.length > 0) {
        const lastLogIndex = attendance.trackingLogs.length - 1;
        await Attendance.updateOne(
          { _id: attendance._id, "trackingLogs._id": attendance.trackingLogs[lastLogIndex]._id },
          { $set: { "trackingLogs.$.address": address } }
        );
      }
    }
  } catch (err) {
    console.error('[EnterpriseTracking] Asynchronous reverse geocoding task failed:', err.message);
  }
}

exports.reverseGeocodeAsync = reverseGeocodeAsync;

/**
 * Buffers points for 1-minute aggregation
 */
async function bufferForAggregation(userId, points, distance) {
  const now = new Date();
  const minuteKey = `${userId}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}`;
  
  let buffer = aggregationBuffer.get(minuteKey);
  if (!buffer) {
    buffer = {
      userId,
      points: [],
      distance: 0,
      startTime: points[0].timestamp,
      count: 0
    };
    aggregationBuffer.set(minuteKey, buffer);
    
    // Schedule flush after 1 minute
    setTimeout(() => flushAggregation(minuteKey), 65000);
  }

  buffer.points.push(...points);
  buffer.distance += distance;
  buffer.count += points.length;
}

/**
 * Flushes 1-minute buffer to TrackingLog collection
 */
async function flushAggregation(minuteKey) {
  const buffer = aggregationBuffer.get(minuteKey);
  if (!buffer) return;

  try {
    const { userId, points, distance, startTime } = buffer;
    if (points.length === 0) return;

    const endTime = points[points.length - 1].timestamp;
    const avgSpeed = points.reduce((acc, p) => acc + (p.speed || 0), 0) / points.length;
    const maxSpeed = Math.max(...points.map(p => p.speed || 0));
    
    const log = new TrackingLog({
      userId,
      startTime,
      endTime,
      startLocation: points[0].location,
      endLocation: points[points.length - 1].location,
      distance: parseFloat(distance.toFixed(3)),
      avgSpeed: parseFloat(avgSpeed.toFixed(2)),
      maxSpeed: parseFloat(maxSpeed.toFixed(2)),
      movementStatus: detectMovementState(avgSpeed),
      path: points.map(p => p.location.coordinates),
      avgAccuracy: points.reduce((acc, p) => acc + (p.accuracy || 0), 0) / points.length
    });

    await log.save();
    aggregationBuffer.delete(minuteKey);
    
    // Notify admin dashboard of new log row
    // (Could be via socket too)
  } catch (err) {
    console.error('[EnterpriseTracking] Flush Error:', err);
  }
}

function detectMovementState(speedMs) {
  const speedKmh = speedMs * 3.6;
  if (speedKmh < 1) return 'Idle';
  if (speedKmh < 6) return 'Walking';
  if (speedKmh < 25) return 'Bike';
  if (speedKmh < 100) return 'Vehicle';
  return 'Suspicious';
}
