import { ArrowLeft, ChevronLeft, ChevronRight, Home, Settings2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import api from '../api/axios';

import { useNavigation } from '@react-navigation/native';

const MonthlyViewScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchMonthlyData();
  }, [currentDate]);

  const fetchUserData = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch (err) {}
  };

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await api.get(`/attendance/monthly-view?month=${month}&year=${year}`);
      setData(res.data.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    if (!data) return null;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = data.daysInMonth;
    const dailyStatus = data.dailyStatus;

    const calendarRows = [];
    let cells = [];

    // Empty cells for first week
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<View key={`empty-${i}`} className="flex-1 h-16" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const status = dailyStatus[day];
      const showDot = status && status.color && status.color !== 'transparent' && !status.isFuture;
      
      cells.push(
        <View key={day} className="flex-1 h-16 items-center justify-center">
          <Text className="text-slate-700 font-bold text-base">{day}</Text>
          {showDot && (
            <View 
              style={{ backgroundColor: status.color }} 
              className="w-2.5 h-2.5 rounded-full mt-1.5" 
            />
          )}
        </View>
      );

      if (cells.length === 7) {
        calendarRows.push(<View key={`row-${day}`} className="flex-row">{cells}</View>);
        cells = [];
      }
    }

    // Remaining cells for last week
    if (cells.length > 0) {
      while (cells.length < 7) {
        cells.push(<View key={`empty-last-${cells.length}`} className="flex-1 h-16" />);
      }
      calendarRows.push(<View key="row-last" className="flex-row">{cells}</View>);
    }

    return (
      <View className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        <View className="flex-row mb-4">
          {days.map(d => (
            <Text key={d} className="flex-1 text-center text-slate-400 font-bold text-xs">{d}</Text>
          ))}
        </View>
        {calendarRows}
      </View>
    );
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" />
      
      {/* Blue Header (Matching Image) */}
      <View className="bg-indigo-600 pt-14 pb-6 px-6 flex-row items-center justify-between shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold tracking-tight">Monthly View</Text>
        </View>
        <View className="flex-row gap-4">
          <TouchableOpacity><Settings2 size={24} color="white" /></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Main')}><Home size={24} color="white" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Employee Details Section */}
        <View className="mb-6">
          <Text className="text-slate-900 font-bold text-lg mb-2">Employee Details</Text>
          <View className="flex-row mb-1">
            <Text className="w-28 text-slate-400 font-bold text-sm">Name</Text>
            <Text className="text-slate-800 font-bold text-sm">: {user?.name || '...'}</Text>
          </View>
          <View className="flex-row mb-1">
            <Text className="w-28 text-slate-400 font-bold text-sm">Designation</Text>
            <Text className="text-slate-800 font-bold text-sm">: {user?.role === 'admin' ? 'Administrator' : 'Employee'}</Text>
          </View>
          <View className="flex-row mb-4">
            <Text className="w-28 text-slate-400 font-bold text-sm">Department</Text>
            <Text className="text-slate-800 font-bold text-sm">: {user?.department || 'General'}</Text>
          </View>
        </View>

        {/* Summary Stats Grid */}
        <View className="flex-row gap-3 mb-8">
          <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center">
             <View className="flex-row items-center mb-2">
               <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
               <Text className="text-slate-800 font-bold text-xs">Present</Text>
             </View>
             <Text className="text-emerald-600 text-2xl font-black">{data?.summary?.present + (data?.summary?.late || 0) + (data?.summary?.halfDay || 0) || 0}</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center">
             <View className="flex-row items-center mb-2">
               <View className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2" />
               <Text className="text-slate-800 font-bold text-xs">Absent</Text>
             </View>
             <Text className="text-rose-600 text-2xl font-black">{data?.summary?.absent || 0}</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center">
             <View className="flex-row items-center mb-2">
               <View className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2" />
               <Text className="text-slate-800 font-bold text-xs">On Leave</Text>
             </View>
             <Text className="text-amber-600 text-2xl font-black">{data?.summary?.onLeave || 0}</Text>
          </View>
        </View>

        {/* Date Selector Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-slate-900 font-black text-sm">01 {monthName.slice(0,3)} {year} - {data?.daysInMonth} {monthName.slice(0,3)} {year}</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => changeMonth(-1)} className="p-1"><ChevronLeft size={20} color="#4f46e5" /></TouchableOpacity>
            <TouchableOpacity onPress={() => changeMonth(1)} className="p-1"><ChevronRight size={20} color="#4f46e5" /></TouchableOpacity>
          </View>
        </View>

        {/* Calendar View */}
        <View className="mb-4">
           <Text className="text-center text-slate-800 font-bold text-lg mb-4">{monthName} {year}</Text>
           {loading ? (
             <View className="h-64 justify-center items-center">
               <ActivityIndicator color="#4f46e5" size="large" />
             </View>
           ) : (
             renderCalendar()
           )}
        </View>
      </ScrollView>
    </View>
  );
};

export default MonthlyViewScreen;
