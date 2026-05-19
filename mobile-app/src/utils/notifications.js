import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../api/axios';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken() {
  try {
    if (Platform.OS === 'web') return;

    // Create the required Android Notification Channel with maximum importance for background alerts
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      const simulatedToken = `sandbox_token_${Platform.OS}_${Math.random().toString(36).substring(7)}`;
      await api.post('/notifications/register-token', {
        fcmToken: simulatedToken,
        deviceType: Platform.OS.toUpperCase()
      });
      return;
    }

    let token;
    try {
      // Prioritize raw native device push tokens (FCM/APNs) required by firebase-admin SDK
      const deviceTokenObj = await Notifications.getDevicePushTokenAsync().catch(() => null);
      if (deviceTokenObj && deviceTokenObj.data) {
        token = deviceTokenObj.data;
      } else {
        const expoTokenObj = await Notifications.getExpoPushTokenAsync().catch(() => null);
        token = expoTokenObj ? expoTokenObj.data : null;
      }

      if (!token) {
        token = `expo_simulated_${Platform.OS}_${Math.random().toString(36).substring(7)}`;
      }
    } catch (tokenErr) {
      token = `expo_simulated_${Platform.OS}_${Math.random().toString(36).substring(7)}`;
    }

    await api.post('/notifications/register-token', {
      fcmToken: token,
      deviceType: Platform.OS.toUpperCase()
    });
  } catch (err) {
    console.log('Push registration failed. Running simulator fallback...', err.message);
    try {
      const simulatedToken = `fallback_token_${Platform.OS}_${Math.random().toString(36).substring(7)}`;
      await api.post('/notifications/register-token', {
        fcmToken: simulatedToken,
        deviceType: Platform.OS.toUpperCase()
      });
    } catch (fallbackErr) {
      console.log('Push token fallback failed:', fallbackErr.message);
    }
  }
}
