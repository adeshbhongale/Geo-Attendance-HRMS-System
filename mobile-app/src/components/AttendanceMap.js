import React from 'react';
import { View } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';

const AttendanceMap = ({ latitude, longitude, radius }) => {
  return (
    <MapView
      className="flex-1"
      initialRegion={{
        latitude: latitude || 18.5204,
        longitude: longitude || 73.8567,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{ latitude: latitude || 18.5204, longitude: longitude || 73.8567 }}
        title="Office Location"
      >
        <View className="w-5 h-5 rounded-full bg-indigo-600 border-2 border-white shadow-sm shadow-indigo-300" />
      </Marker>
      <Circle
        center={{ latitude: latitude || 18.5204, longitude: longitude || 73.8567 }}
        radius={radius || 200}
        fillColor="rgba(79, 70, 229, 0.15)"
        strokeColor="rgba(79, 70, 229, 0.4)"
      />
    </MapView>
  );
};

export default AttendanceMap;
