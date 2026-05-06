import React from 'react';
import { View, Text } from 'react-native';
import { Map as MapIcon } from 'lucide-react-native';

const AttendanceMap = () => {
  return (
    <View className="flex-1 bg-slate-100 justify-center items-center p-5">
      <MapIcon size={40} color="#4f46e5" />
      <Text className="mt-2 text-slate-800 font-bold text-center">Interactive Map View</Text>
      <Text className="text-slate-400 text-xs text-center mt-1">Available on Mobile Devices</Text>
    </View>
  );
};

export default AttendanceMap;
