import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, ChevronDown, Clock, Filter, Info, RotateCcw, X, Coffee } from 'lucide-react-native';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from 'react-native';
import api from '../api/axios';
import { formatWorkingHours, formatDuration } from '../utils/timeFormat';

const ShiftManagementScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState(10);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleRefresh = useCallback(async (isSilent = false) => {
    if (!isSilent) setHistoryLoading(true);
    try {
      const [userRes, historyRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/attendance/history')
      ]);
      setUserData(userRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch (e) {
      console.error('Refresh Error:', e.message);
    } finally {
      setHistoryLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const onRefresh = () => {
    setRefreshing(true);
    handleRefresh(true);
  };

  const filteredHistory = useMemo(() => {
    return history
      .filter(h => {
        const matchesStatus = statusFilter === 'All' || h.status === statusFilter;
        const matchesDate = !dateFilter || (h.date && new Date(h.date).toISOString().split('T')[0] === formatLocalDate(dateFilter));
        return matchesStatus && matchesDate && h.status !== 'Absent';
      });
  }, [history, statusFilter, dateFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Present': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
      case 'Late': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' };
      case 'Half Day': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
      case 'Absent': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };
    }
  };

  const to12Hour = (time24) => {
    if (!time24) return '--:--';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
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
      <View className="pt-14 px-6 pb-5 bg-blue-600 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.navigate('Home')} className="w-10 h-10 rounded-xl bg-slate-50 justify-center items-center mr-4">
            <ArrowLeft size={20} color="#64748b" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-white">Shift Info</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} className="w-10 h-10 rounded-xl bg-slate-50 justify-center items-center">
          <RotateCcw size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {userData?.shift ? (
          <View className="bg-indigo-600 rounded-3xl p-6 mb-8 shadow-xl">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 justify-center items-center"><Clock size={24} color="white" /></View>
                <View className="ml-4">
                  <Text className="text-white font-bold text-lg">{userData.shift.name}</Text>
                  <Text className="text-indigo-100 text-xs font-bold">Current Assignment</Text>
                </View>
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-full"><Text className="text-white text-[10px] font-bold">Active</Text></View>
            </View>
            <View className="flex-row justify-between pt-4 border-t border-white/10">
              <View><Text className="text-indigo-200 text-[10px] font-bold mb-1">Shift Time</Text><Text className="text-white font-bold">{to12Hour(userData.shift.startTime)} - {to12Hour(userData.shift.endTime)}</Text></View>
              <View className="items-center"><Text className="text-indigo-200 text-[10px] font-bold mb-1">Grace Period</Text><Text className="text-white font-bold">{userData.shift.gracePeriod || 0}m</Text></View>
              <View className="items-end"><Text className="text-indigo-200 text-[10px] font-bold mb-1">Half Day After</Text><Text className="text-white font-bold">{to12Hour(userData.shift.halfDayAfter)}</Text></View>
            </View>
          </View>
        ) : (
          <View className="bg-white rounded-3xl p-6 mb-8 border border-slate-100 border-dashed items-center"><Clock size={32} color="#cbd5e1" /><Text className="text-slate-400 font-bold mt-2">No shift assigned</Text></View>
        )}

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[10px] font-bold text-slate-400 tracking-[2px]">ATTENDANCE HISTORY</Text>
        </View>

        <View className="mb-6 flex-row gap-3">
          <TouchableOpacity onPress={() => setShowStatusModal(true)} className="flex-1 bg-white h-12 rounded-2xl border border-slate-100 flex-row items-center px-4 shadow-sm">
            <Filter size={16} color="#6366f1" /><Text className="flex-1 ml-2 text-xs font-bold text-slate-700">{statusFilter === 'All' ? 'STATUS' : statusFilter.toUpperCase()}</Text><ChevronDown size={16} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-1 bg-white h-12 rounded-2xl border border-slate-100 flex-row items-center px-4 shadow-sm">
            <Calendar size={16} color="#6366f1" /><Text className="flex-1 ml-2 text-xs font-bold text-slate-700">{dateFilter ? formatLocalDate(dateFilter) : 'DATE'}</Text>
          </TouchableOpacity>
        </View>

        {historyLoading ? <ActivityIndicator color="#4f46e5" className="py-10" /> : (
          filteredHistory.slice(0, visibleLogs).map((log) => {
            const style = getStatusStyle(log.status);
            const totalBreakMinutes = log.breaks?.reduce((acc, b) => acc + (b.duration || 0), 0) || 0;
            return (
              <View key={log._id} className="bg-white rounded-3xl p-5 border border-slate-100 mb-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-slate-400 text-[10px] font-bold tracking-wider">{new Date(log.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    <Text className="text-lg font-bold text-slate-900 mt-0.5">{log.shiftInfo?.name || 'Standard Shift'}</Text>
                  </View>
                  <View className={`${style.bg} ${style.border} border px-3 py-1.5 rounded-xl`}><Text className={`${style.text} text-[10px] font-bold`}>{log.status}</Text></View>
                </View>
                <View className="flex-row gap-4 mb-4">
                  <View className="flex-1 bg-slate-50 p-3 items-center rounded-2xl">
                    <Clock size={12} color="#94a3b8" className="mb-1" />
                    <Text className="text-[9px] font-bold text-slate-400 mb-1">In - Out</Text>
                    <Text className="text-slate-800 font-bold text-xs">{log.punchIn?.time ? new Date(log.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} - {log.punchOut?.time ? new Date(log.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text>
                  </View>
                  <View className="flex-1 bg-slate-50 p-3 items-center rounded-2xl">
                    <Coffee size={12} color="#94a3b8" className="mb-1" />
                    <Text className="text-[9px] font-bold text-slate-400 mb-1">Worked (Net)</Text>
                    <Text className="text-indigo-600 font-bold text-xs">{formatWorkingHours(log.workingHours || 0)}</Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center pt-4 border-t border-slate-50">
                  <View className="flex-row gap-4">
                    <View><Text className="text-[9px] font-bold text-slate-400">Breaks</Text><Text className="text-xs font-bold text-amber-600">{formatDuration(totalBreakMinutes)}</Text></View>
                    <View><Text className="text-[9px] font-bold text-slate-400">Late</Text><Text className="text-xs font-bold text-rose-500">{log.lateTime || 0}m</Text></View>
                    <View><Text className="text-[9px] font-bold text-slate-400">Distance</Text><Text className="text-xs font-bold text-slate-700">{(log.distance || log.totalDistance || 0).toFixed(2)}km</Text></View>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {filteredHistory.length > visibleLogs && (
          <TouchableOpacity onPress={() => setVisibleLogs(prev => prev + 10)} className="mt-4 py-4 bg-white rounded-2xl border border-slate-100 items-center"><Text className="text-indigo-600 font-bold text-xs">Load More Logs</Text></TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={showStatusModal} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setShowStatusModal(false)} className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 pb-12">
            <Text className="text-xl font-bold text-slate-900 mb-6">Filter Status</Text>
            {['All', 'Present', 'Late', 'Half Day', 'Absent'].map(s => (
              <TouchableOpacity key={s} onPress={() => { setStatusFilter(s); setShowStatusModal(false); }} className={`py-4 px-6 rounded-2xl mb-2 ${statusFilter === s ? 'bg-indigo-50' : 'bg-slate-50'}`}><Text className={`font-bold ${statusFilter === s ? 'text-indigo-600' : 'text-slate-600'}`}>{s}</Text></TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && <DateTimePicker value={dateFilter || new Date()} mode="date" display="default" maximumDate={new Date()} onChange={(e, d) => { setShowDatePicker(false); if (d) setDateFilter(d); }} />}
    </View>
  );
};

export default ShiftManagementScreen;
