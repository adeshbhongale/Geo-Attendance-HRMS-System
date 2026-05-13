import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  Coffee,
  Eye,
  MapPin,
  Maximize,
  Minimize,
  PlayCircle,
  RotateCcw,
  X
} from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../api/axios';
import AttendanceMap from '../components/AttendanceMap';
import socket from '../socket';
import { formatWorkingHours } from '../utils/timeFormat';

const LOCATION_TASK_NAME = 'background-location-task';

const AttendanceScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [office, setOffice] = useState(null);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data.data;
      setUser(userData);
      if (userData?._id) {
        socket.emit('join', userData._id);
      }
    } catch (err) {}
  };

  const fetchOfficeSettings = async () => {
    try {
      const res = await api.get('/settings/office');
      setOffice(res.data.data);
    } catch (err) {}
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/attendance/history');
      const records = res.data.data || [];
      setHistory(records);

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
      setTodayAttendance(currentSession || null);
    } catch (err) {} finally {
      setHistoryLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      setLocationLoading(true);
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setToast({ show: true, message: 'Location access required.', type: 'error' });
        return;
      }
      
      // Request background permission for always tracking
      await Location.requestBackgroundPermissionsAsync();

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      let addr = 'Current Location';
      try {
        const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${MAPS_KEY}`);
        const geoData = await geoRes.json();
        if (geoData.status === 'OK' && geoData.results.length > 0) addr = geoData.results[0].formatted_address;
      } catch (e) {}
      setLocation({ latitude, longitude, address: addr });
    } catch (err) {
    } finally {
      setLocationLoading(false);
    }
  };

  const init = useCallback(async () => {
    await Promise.all([getLocation(), fetchUser(), fetchHistory(), fetchOfficeSettings()]);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (location && office) {
      const R = 6371e3;
      const lat1 = location.latitude;
      const lon1 = location.longitude;
      const lat2 = office.latitude;
      const lon2 = office.longitude;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      setDistance(R * c);
    }
  }, [location, office]);

  // --- BACKGROUND TRACKING HANDLER ---
  useEffect(() => {
    const isPunchedIn = !!todayAttendance?.punchIn?.time;
    const isPunchedOut = !!todayAttendance?.punchOut?.time;

    const manageBackgroundTracking = async () => {
      try {
        if (isPunchedIn && !isPunchedOut) {
          const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
          if (bgStatus === 'granted') {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000, // 10 seconds
              distanceInterval: 10, // 10 meters
              foregroundService: {
                notificationTitle: 'Geo-Attendance HRMS',
                notificationBody: 'Tracking your work location...',
                notificationColor: '#4f46e5'
              }
            });
          }
        } else {
          const hasTask = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
          if (hasTask) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      } catch (e) {}
    };

    manageBackgroundTracking();
  }, [todayAttendance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await init();
    setRefreshing(false);
  };

  const alreadyPunchedIn = !!todayAttendance?.punchIn?.time;
  const alreadyPunchedOut = !!todayAttendance?.punchOut?.time;

  const getShiftStatus = () => {
    if (!user?.shift) return { allowed: true };
    const now = new Date();
    const [sHour, sMin] = user.shift.startTime.split(':').map(Number);
    const start = new Date(now);
    start.setHours(sHour, sMin, 0, 0);

    if (alreadyPunchedIn && alreadyPunchedOut) return { allowed: false, status: 'Completed', message: 'Attendance Complete' };
    if (alreadyPunchedIn && !alreadyPunchedOut) return { allowed: true };
    if (now < new Date(start.getTime() - 3600000)) return { allowed: false, status: 'Upcoming', message: 'Shift Not Started' };
    return { allowed: true };
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', allowsEditing: false, quality: 0.5, base64: true });
    if (!result.canceled) setSelfie(result.assets[0]);
  };

  const handlePunchIn = async () => {
    if (!location || !selfie) return;
    setPunchLoading(true);
    try {
      const res = await api.post('/attendance/punch-in', {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        selfie: `data:image/jpeg;base64,${selfie.base64}`,
      });
      setTodayAttendance(res.data.data);
      setSelfie(null);
      await fetchHistory();
      setToast({ show: true, message: 'Punched In!', type: 'success' });
      setTimeout(() => { setToast(prev => ({ ...prev, show: false })); navigation.navigate('Home'); }, 1500);
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || 'Error', type: 'error' });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
    } finally { setPunchLoading(false); }
  };

  const handlePunchOut = async () => {
    if (!location || !selfie) return;
    Alert.alert('Punch Out', 'End shift?', [{ text: 'Cancel' }, { text: 'Punch Out', onPress: async () => {
      setPunchLoading(true);
      try {
        const res = await api.post('/attendance/punch-out', {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          selfie: `data:image/jpeg;base64,${selfie.base64}`,
        });
        setTodayAttendance(res.data.data);
        setSelfie(null);
        await fetchHistory();
        setToast({ show: true, message: 'Punched Out!', type: 'success' });
        setTimeout(() => { setToast(prev => ({ ...prev, show: false })); navigation.navigate('Home'); }, 1500);
      } catch (err) {
        setToast({ show: true, message: err.response?.data?.message || 'Error', type: 'error' });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
      } finally { setPunchLoading(false); }
    }}]);
  };

  const handleToggleBreak = async () => {
    try {
      setPunchLoading(true);
      const res = await api.post('/attendance/break');
      setTodayAttendance(res.data.data);
      await fetchHistory();
      setToast({ show: true, message: res.data.message || 'Break updated', type: 'success' });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
    } catch (err) {
      setToast({ show: true, message: 'Error', type: 'error' });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
    } finally { setPunchLoading(false); }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <View className="pt-14 px-6 pb-5 bg-blue-600 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.navigate('Home')} className="w-10 h-10 rounded-xl bg-slate-50 justify-center items-center mr-4">
            <ArrowLeft size={20} color="#64748b" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-extrabold text-white">Attendance</Text>
            <Text className="text-white font-bold text-xs">Verify location</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} className="w-10 h-10 rounded-xl bg-slate-50 justify-center items-center">
          <RotateCcw size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 110 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {todayAttendance && (
          <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[10px] font-bold text-slate-400 tracking-widest ">TODAY'S RECORD</Text>
              <View className={`px-2 py-1 rounded-lg ${todayAttendance.status === 'Late' ? 'bg-amber-50 text-amber-600' : todayAttendance.status === 'Half Day' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <Text className="text-[10px] font-bold">{todayAttendance.status || 'Present'}</Text>
              </View>
            </View>
            <View className="flex-row justify-between py-2 border-t border-slate-50">
              <View className="items-start flex-1"><Text className="text-[8px] font-bold text-slate-400">In</Text><Text className="text-sm font-bold text-slate-800">{todayAttendance.punchIn?.time ? new Date(todayAttendance.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text></View>
              <View className="items-center flex-1"><Text className="text-[8px] font-bold text-slate-400">Worked</Text><Text className="text-sm font-bold text-slate-800">{formatWorkingHours(todayAttendance.workingHours || 0)}</Text></View>
              <View className="items-end flex-1"><Text className="text-[8px] font-bold text-slate-400">Out</Text><Text className="text-sm font-bold text-slate-800">{todayAttendance.punchOut?.time ? new Date(todayAttendance.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text></View>
            </View>

            {alreadyPunchedIn && !alreadyPunchedOut && (
              <TouchableOpacity onPress={handleToggleBreak} activeOpacity={0.8} className={`mt-4 h-12 rounded-xl flex-row justify-center items-center border ${todayAttendance.breaks?.some(b => !b.endTime) ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <Text className={`font-bold ${todayAttendance.breaks?.some(b => !b.endTime) ? 'text-emerald-600' : 'text-amber-600'}`}>{todayAttendance.breaks?.some(b => !b.endTime) ? 'END BREAK' : 'START BREAK'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-5 shadow-sm">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-2xl bg-indigo-50 justify-center items-center"><MapPin size={22} color="#4f46e5" /></View>
            <View className="ml-4 flex-1"><Text className="text-[10px] font-bold text-slate-400 tracking-widest">LOCATION</Text><Text className="text-base font-bold text-slate-800" numberOfLines={1}>{location?.address || 'Detecting...'}</Text></View>
          </View>
          <View className="h-48 w-full mt-4 rounded-2xl overflow-hidden border border-slate-100">
            <AttendanceMap latitude={office?.latitude} longitude={office?.longitude} radius={office?.radius} userLocation={location} />
          </View>
        </View>

        {!alreadyPunchedOut && (
          <TouchableOpacity className={`h-48 bg-white rounded-3xl border-2 border-dashed ${selfie ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'} justify-center items-center mb-6 overflow-hidden`} onPress={takeSelfie}>
            {selfie ? <Image source={{ uri: selfie.uri }} className="w-full h-full" /> : <View className="items-center"><Camera size={32} color="#94a3b8" /><Text className="text-slate-400 font-bold mt-2">Take Selfie to Verify</Text></View>}
          </TouchableOpacity>
        )}

        {(() => {
          const status = getShiftStatus();
          if (!status.allowed) {
            return (
              <View className="bg-slate-100 rounded-3xl p-8 items-center border border-slate-200">
                <Clock size={32} color="#94a3b8" />
                <Text className="font-extrabold text-lg text-slate-800 mt-4">{status.message}</Text>
                <Text className="text-slate-500 font-bold text-sm text-center mt-1">{alreadyPunchedOut ? 'Shift completed successfully' : 'Please wait for shift start time'}</Text>
              </View>
            );
          }
          return (
            <TouchableOpacity className={`h-16 rounded-2xl justify-center items-center ${alreadyPunchedIn ? 'bg-rose-500' : (location && selfie ? 'bg-indigo-600' : 'bg-slate-300')}`} onPress={alreadyPunchedIn ? handlePunchOut : handlePunchIn} disabled={punchLoading || (!alreadyPunchedIn && (!location || !selfie))}>
              {punchLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-extrabold text-lg">{alreadyPunchedIn ? 'Punch Out' : 'Punch In'}</Text>}
            </TouchableOpacity>
          );
        })()}

        {history.length > 0 && (
          <View className="mt-8">
            <Text className="text-slate-900 font-extrabold text-sm tracking-widest mb-4">RECENT LOGS</Text>
            {history.slice(0, 5).map((item, i) => (
              <View key={i} className="bg-white rounded-2xl p-4 border border-slate-100 mb-3 shadow-sm flex-row justify-between items-center">
                <View><Text className="text-slate-800 font-bold text-sm">{new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text><Text className="text-slate-400 text-[10px] font-bold">{item.shiftInfo?.name || 'Shift'}</Text></View>
                <View className={`px-2 py-1 rounded-lg ${item.status === 'Late' ? 'bg-amber-50 text-amber-600' : item.status === 'Half Day' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}><Text className="text-[10px] font-bold">{item.status || 'Present'}</Text></View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AttendanceScreen;
