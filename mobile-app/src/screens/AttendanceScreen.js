import { Camera, CheckCircle, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const AttendanceScreen = ({ navigation }) => {
  const [hasSelfie, setHasSelfie] = useState(false);

  const handlePunch = () => {
    if (!hasSelfie) {
      Alert.alert('Required', 'Please capture a selfie for verification');
      return;
    }
    Alert.alert('Success', 'Punch in successful!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-20 px-6 pb-6">
        <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Mark Attendance</Text>
        <Text className="text-slate-500 font-medium mt-1">Verify your location and identity</Text>
      </View>

      <View className="p-6 gap-8">
        <View className="flex-row items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-100">
          <View className="w-12 h-12 rounded-2xl bg-indigo-100 justify-center items-center">
            <MapPin size={24} color="#4f46e5" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-[10px] font-bold text-slate-400  tracking-widest">Office Location</Text>
            <Text className="text-base font-bold text-slate-800 mt-0.5">Central Tech Park, Pune</Text>
            <View className="flex-row items-center mt-1">
              <CheckCircle size={12} color="#10b981" />
              <Text className="text-xs font-bold text-emerald-600 ml-1">Within Allowed Radius</Text>
            </View>
          </View>
        </View>

        <View className="gap-4">
          <Text className="text-xs font-bold text-slate-400  tracking-[2px] ml-1">Identity Verification</Text>
          <TouchableOpacity
            className="h-80 bg-slate-50 rounded-[40px] border-2 border-slate-200 border-dashed justify-center items-center active:scale-[0.98] transition-transform overflow-hidden"
            onPress={() => setHasSelfie(true)}
          >
            {hasSelfie ? (
              <View className="items-center">
                <View className="w-24 h-24 rounded-full bg-emerald-100 justify-center items-center mb-4">
                  <CheckCircle size={48} color="#10b981" />
                </View>
                <Text className="text-emerald-600 text-lg font-bold  tracking-widest">Selfie Captured</Text>
                <Text className="text-slate-400 font-medium mt-2">Tap to recapture if needed</Text>
              </View>
            ) : (
              <View className="items-center">
                <View className="w-20 h-20 rounded-full bg-slate-100 justify-center items-center mb-4">
                  <Camera size={32} color="#94a3b8" />
                </View>
                <Text className="text-slate-500 font-bold text-lg">Capture Live Selfie</Text>
                <Text className="text-slate-400 text-sm mt-2 font-medium">Verification required for punch in</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`h-16 rounded-2xl justify-center items-center mt-4 shadow-xl ${hasSelfie ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-200 shadow-none opacity-60'}`}
          onPress={handlePunch}
          disabled={!hasSelfie}
        >
          <Text className="text-white text-lg font-bold  tracking-widest">Confirm & Punch In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="items-center"
        >
          <Text className="text-slate-400 font-bold  text-[10px] tracking-widest">Cancel Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AttendanceScreen;
