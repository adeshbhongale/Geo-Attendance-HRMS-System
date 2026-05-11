import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

const WebMapPlaceholder = () => (
  <View style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <MapPin size={32} color="#94a3b8" />
    <Text style={{ color: '#64748b', fontWeight: 'bold', marginTop: 12 }}>Map View Restricted</Text>
    <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>Only available on native mobile devices</Text>
  </View>
);

export const MapView = WebMapPlaceholder;
export const Circle = View;
export const Marker = View;
export const Polyline = View;
export const PROVIDER_GOOGLE = 'google';

export default MapView;
