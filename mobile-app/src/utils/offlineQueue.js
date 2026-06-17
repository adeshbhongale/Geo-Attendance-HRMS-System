import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import socket from '../socket';

const OFFLINE_QUEUE_KEY = 'location_offline_queue';

/**
 * Appends a tracking point to the offline persistent queue
 * @param {Object} point GPS location coordinates and metadata
 */
export const addPointToQueue = async (point) => {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = queueStr ? JSON.parse(queueStr) : [];
    queue.push(point);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('[OfflineQueue] Failed to add point:', err);
  }
};

/**
 * Retrieves all points currently in the queue
 * @returns {Promise<Array>} Array of queued tracking points
 */
export const getQueue = async () => {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (err) {
    console.error('[OfflineQueue] Failed to get queue:', err);
    return [];
  }
};

/**
 * Empties the queue
 */
export const clearQueue = async () => {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (err) {
    console.error('[OfflineQueue] Failed to clear queue:', err);
  }
};

/**
 * Synchronizes the queued offline points with the server.
 * Uses Socket.IO if connected, with an HTTP REST fallback.
 */
export const syncQueue = async () => {
  try {
    const queue = await getQueue();
    if (queue.length === 0) return;

    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    if (socket && socket.connected) {
      socket.emit('trackingBatch', { userId, batch: queue });
      await clearQueue();
    } else {
      // REST API fallback
      const response = await api.post('/attendance/track-batch', { userId, batch: queue });
      if (response.data && response.data.success) {
        await clearQueue();
      }
    }
  } catch (err) {
    console.warn('[OfflineQueue] Synchronisation failed, retaining points locally:', err.message);
  }
};
