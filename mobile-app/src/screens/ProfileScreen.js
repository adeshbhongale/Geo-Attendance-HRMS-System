import AsyncStorage from '@react-native-async-storage/async-storage';
import { Briefcase, ChevronRight, LogOut, Mail, Phone, Shield, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to exit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }
      }
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="pt-20 pb-10 bg-white items-center rounded-b-[40px] shadow-sm shadow-slate-200">
        <View className="w-28 h-28 rounded-full bg-indigo-600 justify-center items-center mb-5 shadow-xl shadow-indigo-200">
          <Text className="text-white text-4xl font-bold">{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name || 'Loading...'}</Text>
        <View className="flex-row items-center mt-2 bg-indigo-50 px-4 py-1.5 rounded-full">
          <Briefcase size={14} color="#4f46e5" />
          <Text className="text-indigo-600 font-bold ml-2 text-xs  tracking-widest">
            {user?.designation || 'Staff'} • {user?.department || 'Department'}
          </Text>
        </View>
      </View>

      <View className="p-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm shadow-slate-100 border border-slate-100 mb-6">
          <Text className="text-[10px] font-bold text-slate-400  tracking-[2px] mb-6">Personal Details</Text>

          <View className="flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-xl bg-slate-50 justify-center items-center">
              <Mail size={20} color="#64748b" />
            </View>
            <View className="ml-4">
              <Text className="text-[10px] font-bold text-slate-400  tracking-widest">Email Address</Text>
              <Text className="text-base font-bold text-slate-800 mt-0.5">{user?.email || 'N/A'}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-xl bg-slate-50 justify-center items-center">
              <Phone size={20} color="#64748b" />
            </View>
            <View className="ml-4">
              <Text className="text-[10px] font-bold text-slate-400  tracking-widest">Mobile Number</Text>
              <Text className="text-base font-bold text-slate-800 mt-0.5">{user?.mobile || 'N/A'}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-slate-50 justify-center items-center">
              <Shield size={20} color="#64748b" />
            </View>
            <View className="ml-4">
              <Text className="text-[10px] font-bold text-slate-400  tracking-widest">System Role</Text>
              <Text className="text-base font-bold text-slate-800 mt-0.5  tracking-wider">{user?.role || 'Employee'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity className="bg-white flex-row items-center p-5 rounded-2xl shadow-sm shadow-slate-100 border border-slate-100 active:bg-slate-50">
          <View className="w-10 h-10 rounded-xl bg-indigo-50 justify-center items-center">
            <User size={20} color="#4f46e5" />
          </View>
          <Text className="flex-1 ml-4 text-slate-800 font-bold text-base">Edit Profile Info</Text>
          <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-rose-50 flex-row items-center p-5 rounded-2xl border border-rose-100 mt-8 active:bg-rose-100"
          onPress={handleLogout}
        >
          <View className="w-10 h-10 rounded-xl bg-rose-500 justify-center items-center shadow-lg shadow-rose-200">
            <LogOut size={20} color="white" />
          </View>
          <Text className="flex-1 ml-4 text-rose-600 font-bold  tracking-widest">Sign Out</Text>
          <ChevronRight size={20} color="#fb7185" />
        </TouchableOpacity>

        <Text className="text-center text-slate-300 text-[10px] mt-10 font-bold tracking-widest ">
          Version 2.4.0 • GeoHR Systems
        </Text>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
