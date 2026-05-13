import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Calendar, CalendarCheck, Clock, Home, User as UserIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import api from './src/api/axios';

enableScreens();

import AttendanceScreen from './src/screens/AttendanceScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LeaveScreen from './src/screens/LeaveScreen';
import LoginScreen from './src/screens/LoginScreen';
import MonthlyViewScreen from './src/screens/MonthlyViewScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ShiftManagementScreen from './src/screens/ShiftManagementScreen';
import TrackMyRoute from './src/screens/TrackMyRoute';
import { navigationRef } from './src/utils/navigation';
import ErrorBoundary from './src/components/ErrorBoundary';
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs(true);

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[BACKGROUND] Task Error:', error.message);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      try {
        await api.post('/attendance/track', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: 'Background tracking...',
          battery: 100
        });
      } catch (err) {
        // Silent fail in background
      }
    }
  }
});

const RootStack = createStackNavigator();
const DashboardStackNav = createStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStack() {
  return (
    <DashboardStackNav.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStackNav.Screen name="DashboardMain" component={DashboardScreen} />
    </DashboardStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 85,
          paddingTop: 12,
          paddingBottom: 25,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginTop: 4,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let Icon;
          if (route.name === 'Home') Icon = Home;
          else if (route.name === 'Attendance') Icon = CalendarCheck;
          else if (route.name === 'Shift') Icon = Clock;
          else if (route.name === 'Leave') Icon = Calendar;
          else if (route.name === 'Profile') Icon = UserIcon;

          return (
            <View className="items-center">
              <Icon size={24} color={color} />
              {focused && <View className="w-1 h-1 rounded-full bg-indigo-600 mt-1" />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardStack} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Shift" component={ShiftManagementScreen} />
      <Tab.Screen name="Leave" component={LeaveScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <RootStack.Navigator
              initialRouteName="Login"
              screenOptions={{ headerShown: false }}
            >
              <RootStack.Screen name="Login" component={LoginScreen} />
              <RootStack.Screen name="Main" component={MainTabs} />
              <RootStack.Screen name="MonthlyViewScreen" component={MonthlyViewScreen} />
              <RootStack.Screen name="TrackMyRoute" component={TrackMyRoute} />
            </RootStack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
