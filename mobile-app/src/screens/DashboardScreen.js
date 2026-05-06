import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  Activity,
  Bell,
  Calendar,
  Clock,
  History,
  Map as MapIcon,
  Search,
  User as UserIcon,
  Zap
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import AttendanceMap from '../components/AttendanceMap';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const DashboardScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data.data);
      setAttendance(res.data.todayAttendance);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Map Section */}
      <View className="h-[45%] w-full">
        <AttendanceMap 
          latitude={18.5204} 
          longitude={73.8567} 
          radius={200} 
        />

        <View className="absolute top-14 left-5 right-5 flex-row justify-between">
          <TouchableOpacity className="w-11 h-11 rounded-2xl bg-white/90 justify-center items-center shadow-md shadow-slate-200 backdrop-blur-md">
            <Search size={22} color="#1e293b" />
          </TouchableOpacity>
          <TouchableOpacity className="w-11 h-11 rounded-2xl bg-white/90 justify-center items-center shadow-md shadow-slate-200 backdrop-blur-md">
            <Bell size={22} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sliding Panel Content */}
      <View className="flex-1 bg-white -mt-8 rounded-t-[32px] px-6 shadow-2xl shadow-slate-900/10 border-t border-slate-100">
        <View className="items-center py-4">
          <View className="w-10 h-1 bg-slate-200 rounded-full" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Status Header */}
          <View className="flex-row justify-between items-center mb-6 mt-2">
            <View className="flex-row items-center gap-4">
              <View className="w-14 h-14 rounded-2xl bg-indigo-100 justify-center items-center">
                <Text className="text-indigo-600 font-bold text-xl">{userData?.name?.charAt(0) || 'E'}</Text>
              </View>
              <View>
                <Text className="text-xl font-extrabold text-slate-900 tracking-tight">{userData?.name || 'Employee'}</Text>
                <View className="flex-row items-center mt-1">
                  <View className={`w-2.5 h-2.5 rounded-full mr-2 ${attendance ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <Text className="text-sm font-bold text-slate-500  tracking-widest">{attendance ? 'On Duty' : 'Off Duty'}</Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center bg-slate-50 px-3 py-2 rounded-xl">
              <Activity size={14} color="#64748b" className="mr-2" />
              <Text className="text-xs font-bold text-slate-500 ">95%</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-8">
            <View className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 items-center">
              <Zap size={20} color="#4f46e5" />
              <Text className="text-[10px] font-bold text-slate-400  tracking-widest mt-2">Status</Text>
              <Text className="text-sm font-bold text-slate-800 mt-0.5">{attendance?.status || 'Absent'}</Text>
            </View>
            <View className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 items-center">
              <Clock size={20} color="#10b981" />
              <Text className="text-[10px] font-bold text-slate-400  tracking-widest mt-2">In Time</Text>
              <Text className="text-sm font-bold text-slate-800 mt-0.5">
                {attendance?.punchIn?.time ? new Date(attendance.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </Text>
            </View>
            <View className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 items-center">
              <History size={20} color="#f59e0b" />
              <Text className="text-[10px] font-bold text-slate-400  tracking-widest mt-2">Working</Text>
              <Text className="text-sm font-bold text-slate-800 mt-0.5">{attendance?.workingHours ? `${attendance.workingHours}h` : '0h'}</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            className="bg-slate-50 rounded-3xl p-5 border border-slate-100 mb-8 active:scale-95 transition-transform"
            onPress={() => navigation.navigate('Attendance')}
          >
            <View className="flex-row items-center">
              <View className={`w-14 h-14 rounded-2xl justify-center items-center shadow-md ${attendance ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-500 shadow-emerald-200'}`}>
                <Clock size={28} color="white" />
              </View>
              <View className="flex-1 ml-5">
                <Text className="text-lg font-extrabold text-slate-900 tracking-tight">{attendance ? 'Punch Out' : 'Punch In'}</Text>
                <Text className="text-sm font-medium text-slate-500 mt-0.5">
                  {attendance ? 'End your shift for today' : 'Start your attendance mark'}
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-white justify-center items-center border border-slate-100">
                <ChevronRight size={18} color="#64748b" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Shift Info */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-400  tracking-[2px] mb-4">Work Schedule</Text>
            <View className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-200">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-white/20 justify-center items-center">
                  <Calendar size={20} color="white" />
                </View>
                <View className="ml-4">
                  <Text className="text-indigo-100 text-xs font-bold  tracking-widest">Active Shift</Text>
                  <Text className="text-white text-lg font-bold mt-0.5">{userData?.shift?.name || 'General Shift'}</Text>
                </View>
              </View>
              <View className="mt-6 pt-6 border-t border-white/10 flex-row justify-between">
                <View>
                  <Text className="text-indigo-200 text-[10px] font-bold  tracking-wider">Starts At</Text>
                  <Text className="text-white font-bold text-lg">{userData?.shift?.startTime || '09:00 AM'}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-indigo-200 text-[10px] font-bold  tracking-wider">Ends At</Text>
                  <Text className="text-white font-bold text-lg">{userData?.shift?.endTime || '06:00 PM'}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-xl flex-row justify-around pt-3 border-t border-slate-100 px-6">
        <TouchableOpacity className="items-center">
          <Activity size={24} color="#4f46e5" />
          <Text className="text-[10px] mt-1 font-bold text-indigo-600  tracking-widest">Home</Text>
          <View className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1" />
        </TouchableOpacity>
        <TouchableOpacity className="items-center opacity-40" onPress={() => navigation.navigate('Leave')}>
          <Calendar size={24} color="#64748b" />
          <Text className="text-[10px] mt-1 font-bold text-slate-500  tracking-widest">Leave</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center opacity-40" onPress={() => navigation.navigate('Profile')}>
          <UserIcon size={24} color="#64748b" />
          <Text className="text-[10px] mt-1 font-bold text-slate-500  tracking-widest">Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DashboardScreen;
