import * as Location from 'expo-location';
import {
  Calendar,
  CircleCheck,
  Clock,
  MapPin,
  Timer,
  User,
  X
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import api from '../api/axios';
import { formatWorkingHours } from '../utils/timeFormat';


const DashboardScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [stats, setStats] = useState(null);
  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mapFull, setMapFull] = useState(false);

  const [isPunchIn, setIsPunchIn] = useState(false);
  const [isPunchOut, setIsPunchOut] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setShowOnlineStatus(true);
        setTimeout(() => setShowOnlineStatus(false), 2000);
      }
      appState.current = nextAppState;
    });

    // Also show on initial load
    setShowOnlineStatus(true);
    setTimeout(() => setShowOnlineStatus(false), 2000);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const punchIn = !!attendance?.punchIn?.time;
    const punchOut = !!attendance?.punchOut?.time;
    setIsPunchIn(punchIn);
    setIsPunchOut(punchOut);
    setIsOnDuty(punchIn && !punchOut);
  }, [attendance]);

  const getCountdown = (shift) => {
    if (!shift) return null;
    const now = new Date();
    const [sHour, sMin] = shift.startTime.split(':').map(Number);
    const [eHour, eMin] = shift.endTime.split(':').map(Number);

    let cutoffStr = shift.punchInCutoff;
    if (!cutoffStr) {
      if (sHour < 12) cutoffStr = "14:00";
      else if (sHour < 20) cutoffStr = "22:00";
      else cutoffStr = "06:00";
    }

    const [cHour, cMin] = cutoffStr.split(':').map(Number);
    const start = new Date(now);
    start.setHours(sHour, sMin, 0, 0);

    const cutoff = new Date(now);
    cutoff.setHours(cHour, cMin, 0, 0);
    if (cHour < 12 && now.getHours() > 12) cutoff.setDate(cutoff.getDate() + 1);

    const end = new Date(now);
    end.setHours(eHour, eMin, 0, 0);
    if (shift.isNightShift && eHour < 12) end.setDate(end.getDate() + 1);

    if (isPunchIn || isPunchOut) {
      if (now < end) {
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return { label: 'Ends in', time: `${h}h ${m}m`, color: 'text-emerald-400', isActive: true };
      }
      return { label: 'Shift Ended', time: 'Over', color: 'text-slate-500', isOver: true };
    }

    if (now < new Date(start.getTime() - 3600000)) {
      const diff = start - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return { label: 'Upcoming Shift', time: `Starts in ${h}h ${m}m`, color: 'text-indigo-400', isFuture: true };
    } else if (now < start) {
      const diff = start - now;
      const m = Math.floor(diff / 60000);
      return { label: 'Starts in', time: `${m}m`, color: 'text-indigo-400', isActive: true };
    } else if (now < end) {
      const diff = end - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return { label: 'Ends in', time: `${h}h ${m}m`, color: 'text-emerald-400', isActive: true };
    } else if (now > cutoff && !isPunchIn) {
      return { label: 'Shift Missed', time: 'Absent', color: 'text-rose-500', isMissed: true };
    }
    return { label: 'Shift Ended', time: 'Over', color: 'text-slate-500', isOver: true };
  };

  const [countdown, setCountdown] = useState(null);
  const [liveStats, setLiveStats] = useState({ worked: 0, breaks: 0 });

  const updateLiveStats = () => {
    if (!stats) return;

    let worked = stats.totalWorkedHours || 0;
    if (isOnDuty && attendance?.punchIn?.time && !attendance?.breaks?.some(b => !b.endTime)) {
      const punchIn = new Date(attendance.punchIn.time);
      const backendCurrentHours = stats.currentWorkingHours || 0;
      const liveExtraMinutes = Math.max(0, (new Date() - punchIn) / 60000
        - (attendance.breaks?.reduce((acc, b) => acc + (b.duration || 0), 0) || 0));
      worked = (stats.totalWorkedHours || 0) + Math.max(0, liveExtraMinutes / 60 - backendCurrentHours);
    }

    let breaks = (stats.totalBreakMinutes || 0) / 60;
    const activeBreak = attendance?.breaks?.find(b => !b.endTime);
    if (activeBreak) {
      const start = new Date(activeBreak.startTime);
      breaks += (new Date() - start) / 3600000;
    }
    setLiveStats({ worked, breaks });
  };

  useEffect(() => {
    updateLiveStats();
    const timer = setInterval(updateLiveStats, 10000); // 10s update
    return () => clearInterval(timer);
  }, [stats, isOnDuty, attendance]);

  useEffect(() => {
    if (userData?.shift) {
      setCountdown(getCountdown(userData.shift));
      const timer = setInterval(() => {
        setCountdown(getCountdown(userData.shift));
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [userData, isPunchIn, isPunchOut]);

  const fetchDashboardData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const results = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/reports/my-stats'),
        api.get('/attendance/history'),
        api.get('/settings/office'),
      ]);

      if (results[0].status === 'fulfilled') setUserData(results[0].value.data.data);
      if (results[1].status === 'fulfilled') setStats(results[1].value.data.data);
      if (results[3].status === 'fulfilled') setOffice(results[3].value.data.data);

      if (results[2].status === 'fulfilled') {
        const records = results[2].value.data.data || [];
        let currentSession = records.find(r => r.punchIn?.time && !r.punchOut?.time);
        if (!currentSession && records.length > 0) {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          currentSession = records.find(r => {
            if (!r.punchIn?.time) return false;
            const rDate = r.date ? new Date(r.date).toISOString().split('T')[0] : null;
            const pOutDate = r.punchOut?.time ? new Date(r.punchOut.time).toISOString().split('T')[0] : null;
            return rDate === todayStr || pOutDate === todayStr;
          });
        }
        if (currentSession && currentSession.status === 'Absent') currentSession = null;
        setAttendance(currentSession || null);
      }
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchDashboardData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });
    return unsubscribe;
  }, [navigation, fetchDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (err) { }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-slate-400 font-bold text-sm">Initializing Dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f1f5f9]">
      <StatusBar barStyle="dark-content" />

      {showOnlineStatus && (
        <View className="absolute top-10 left-0 right-0 z-[1000] items-center px-6">
          <View className="bg-emerald-500/90 px-6 py-2 rounded-full shadow-lg shadow-emerald-200 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
            <Text className="text-white font-bold text-[11px]  tracking-widest">Employee is Online</Text>
          </View>
        </View>
      )}
      <View className="bg-blue-600 pt-14 pb-5 px-6 border-b border-slate-100 flex-row justify-between items-center">
        <View><Text className="text-white text-[10px] font-bold tracking-widest mb-1">Welcome Back</Text><Text className="text-2xl font-bold text-white tracking-tighter">{userData?.name || 'Employee'}</Text></View>
        <TouchableOpacity className="w-12 h-12 rounded-2xl bg-indigo-50 justify-center items-center border border-indigo-100 overflow-hidden" onPress={() => navigation.navigate('Profile')}>
          {userData?.profileImage ? <Image source={{ uri: userData.profileImage }} className="w-full h-full" /> : <User size={24} color="#4f46e5" />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}>
        <View className="px-6 mt-6">
          <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200 border border-slate-50">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center"><View className="w-3 h-3 rounded-full mr-2 bg-emerald-500" /><Text className="font-bold text-slate-400 text-[10px] tracking-widest">Live Status</Text></View>
              <Text className="text-slate-400 font-bold text-xs">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
            </View>

            <View className="flex-row items-center justify-between mb-8">
              <View className="items-center flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-2 tracking-widest">Punch In</Text>
                <View className="bg-emerald-50 px-3 py-1 rounded-lg"><Text className="text-xl font-bold text-emerald-700">{attendance?.punchIn?.time ? new Date(attendance.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text></View>
              </View>
              <View className="w-[1px] h-10 bg-slate-100 mx-2" />
              <View className="items-center flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-2 tracking-widest">Punch Out</Text>
                <View className="bg-rose-50 px-3 py-1 rounded-lg"><Text className="text-xl font-bold text-rose-700">{attendance?.punchOut?.time ? new Date(attendance.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text></View>
              </View>
            </View>

            {isPunchOut || countdown?.isMissed ? (
              <View className="h-16 rounded-2xl bg-slate-50 flex-row justify-center items-center border border-slate-100 shadow-sm"><CircleCheck size={24} color="#10b981" /><View className="ml-3"><Text className="font-bold text-lg text-slate-800 tracking-tight">Day Completed</Text>{countdown?.isMissed && <Text className="text-[10px] text-rose-500 font-bold">Marked as Absent</Text>}</View></View>
            ) : (
              <TouchableOpacity onPress={() => (countdown?.isFuture) ? null : navigation.navigate('Attendance')} disabled={countdown?.isFuture} activeOpacity={0.8} className={`h-16 rounded-2xl flex-row justify-center items-center shadow-lg ${countdown?.isFuture ? 'bg-slate-50 border border-slate-100' : isOnDuty ? 'bg-rose-500 shadow-rose-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
                <Clock size={20} color={countdown?.isFuture ? '#94a3b8' : 'white'} /><Text className={`ml-3 font-bold text-lg tracking-tight ${countdown?.isFuture ? 'text-slate-400' : 'text-white'}`}>{countdown?.isFuture ? 'Shift Not Started' : isOnDuty ? 'Punch Out Now' : 'Punch In Now'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="px-6 mt-6">
          <View className="bg-white px-6 py-2.5 rounded-full border border-slate-100 shadow-sm flex-row items-center justify-center">
            <Calendar size={14} color="#4f46e5" />
            <Text className="text-[11px] font-bold text-slate-700 tracking-widest ml-2">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Attendance Summary</Text>
          </View>
        </View>

        <View className="px-6 mt-4">
          <View className="bg-indigo-600 rounded-3xl p-4 border border-indigo-500 shadow-lg shadow-indigo-200 items-center mb-4 flex-row justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center">
                <CircleCheck size={20} color="white" />
              </View>
              <View>
                <Text className="text-white text-lg font-bold">{stats?.workingDays || 0} Days</Text>
                <Text className="text-indigo-100 text-[8px] font-bold tracking-widest ">Total Working Days</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-white text-lg font-bold">{stats?.presentDays || 0}</Text>
              <Text className="text-indigo-100 text-[8px] font-bold tracking-widest ">Present Only</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-3xl p-4 border border-slate-50 shadow-sm items-center"><Clock size={16} color="#f59e0b" className="mb-1" /><Text className="text-xl font-bold text-slate-900">{stats?.lateDays || 0}</Text><Text className="text-[8px] font-bold text-slate-400 tracking-widest ">Late</Text></View>
            <View className="flex-1 bg-white rounded-3xl p-4 border border-slate-50 shadow-sm items-center"><Timer size={16} color="#f97316" className="mb-1" /><Text className="text-xl font-bold text-slate-900">{stats?.halfDayCount || 0}</Text><Text className="text-[8px] font-bold text-slate-400 tracking-widest ">Half Day</Text></View>
            <View className="flex-1 bg-white rounded-3xl p-4 border border-slate-50 shadow-sm items-center"><X size={16} color="#f43f5e" className="mb-1" /><Text className="text-xl font-bold text-slate-900">{stats?.absentDays || 0}</Text><Text className="text-[8px] font-bold text-slate-400 tracking-widest ">Absent</Text></View>
          </View>

          <View className="flex-row gap-3 mt-3">
            <View className="flex-1 bg-white rounded-3xl p-4 border border-slate-50 shadow-sm items-center"><Calendar size={16} color="#6366f1" className="mb-1" /><Text className="text-xl font-bold text-slate-900">{stats?.leaveDays || 0}</Text><Text className="text-[8px] font-bold text-slate-400 tracking-widest ">Leave</Text></View>
            <View className="flex-1 bg-white rounded-3xl p-4 border border-slate-50 shadow-sm items-center"><Clock size={16} color="#10b981" className="mb-1" /><Text className="text-lg font-bold text-slate-900">{formatWorkingHours(liveStats.worked)}</Text><Text className="text-[8px] font-bold text-slate-400 tracking-widest ">Worked</Text></View>
            <View className="flex-1 bg-white rounded-3xl p-4 border border-slate-50 shadow-sm items-center"><MapPin size={16} color="#0ea5e9" className="mb-1" /><Text className="text-xl font-bold text-slate-900">{(stats?.totalDistanceKm || 0).toFixed(1)}</Text><Text className="text-[8px] font-bold text-slate-400 tracking-widest ">KM Dist</Text></View>
          </View>
        </View>

        <View className="px-6 mt-6">
          <View className="bg-slate-900 rounded-[32px] p-6 shadow-2xl">
            <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 rounded-2xl bg-white/10 justify-center items-center"><Calendar size={24} color="white" /></View>
              <View className="ml-4 flex-1">
                <View className="flex-row justify-between items-center"><Text className="text-slate-400 text-[10px] font-bold tracking-widest">Assigned Shift</Text>{countdown && <View className="bg-white/10 px-2 py-1 rounded-lg"><Text className={`text-[10px] font-bold ${countdown.color}`}>{countdown.time}</Text></View>}</View>
                <Text className="text-white text-xl font-bold mt-0.5">{userData?.shift?.name || 'Standard'}</Text>
              </View>
            </View>
            <View className="flex-row justify-between pt-6 border-t border-white/10">
              <View><Text className="text-slate-500 text-[10px] font-bold mb-1 ">Starts</Text><Text className="text-white font-bold text-lg">{userData?.shift?.startTime || '--:--'}</Text></View>
              <View className="items-end"><Text className="text-slate-500 text-[10px] font-bold mb-1 ">Ends</Text><Text className="text-white font-bold text-lg">{userData?.shift?.endTime || '--:--'}</Text></View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;
