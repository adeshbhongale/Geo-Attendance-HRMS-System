import { Loader2, MapPin, Navigation, Save, AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Settings = () => {
  const [radius, setRadius] = useState(0);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const marker = useRef(null);
  const circle = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isLoaded && lat !== 0 && lng !== 0 && !googleMap.current) {
      initMap();
    }
  }, [isLoaded, lat, lng]);

  useEffect(() => {
    if (googleMap.current && marker.current && circle.current) {
      const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };
      marker.current.setPosition(pos);
      circle.current.setCenter(pos);
      circle.current.setRadius(parseInt(radius));
      googleMap.current.panTo(pos);
    }
  }, [lat, lng, radius]);

  const initMap = () => {
    if (!mapRef.current) return;
    const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };
    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: pos,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });
    marker.current = new window.google.maps.Marker({
      position: pos,
      map: googleMap.current,
      draggable: true,
      title: "Office Location"
    });
    circle.current = new window.google.maps.Circle({
      map: googleMap.current,
      radius: parseInt(radius),
      fillColor: "#4f46e5",
      fillOpacity: 0.15,
      strokeColor: "#4f46e5",
      strokeOpacity: 0.5,
      strokeWeight: 2,
      center: pos,
    });
    googleMap.current.addListener('click', (e) => {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setLat(newPos.lat.toString());
      setLng(newPos.lng.toString());
      updateAddress(newPos.lat, newPos.lng);
    });

    marker.current.addListener('dragend', () => {
      const newPos = marker.current.getPosition();
      setLat(newPos.lat().toFixed(6));
      setLng(newPos.lng().toFixed(6));
    });
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/office');
      if (res.data.success) {
        setRadius(res.data.data.radius || 200);
        setLat(res.data.data.latitude || 16.7050);
        setLng(res.data.data.longitude || 74.2433);
      }
    } catch (err) {
      toast.error('Failed to load settings');
      setRadius(200);
      setLat(16.7050);
      setLng(74.2433);
    } finally {
      setLoading(false);
    }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSave = async () => {
    if (!lat || !lng || lat === 0 || lng === 0) {
      toast.error('Invalid location.');
      return;
    }
    if (!radius || radius < 10) {
      toast.error('Invalid radius. Minimum 10m required.');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    try {
      setSaving(true);
      await api.put('/settings/office', {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        radius: parseInt(radius)
      });
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // Calculate percentage for range line color increase
  const rangePercent = ((radius - 100) / (5000 - 100)) * 100;

  return (
    <div className="max-w-5xl animate-fade-up space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">Location Settings</h2>
          <p className="text-slate-600 font-bold text-sm mt-2">Set office location and attendance range</p>
        </div>
        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 tracking-tight">
          <MapPin size={14} className="text-indigo-600" />
          Drag marker on map
        </div>
      </div>

      <div className="glass-card p-6 md:p-10 flex flex-col gap-8 bg-white border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Office Latitude</label>
            <div className="relative group">
              <Navigation size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="number"
                value={lat || ''}
                placeholder="0.0000"
                step="0.000001"
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white pl-12 pr-4 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Office Longitude</label>
            <div className="relative group">
              <Navigation size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="number"
                value={lng || ''}
                placeholder="0.0000"
                step="0.000001"
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white pl-12 pr-4 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Attendance Range (Meters)</label>
            <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
              {radius} Meters
            </div>
          </div>

          <div className="flex flex-col gap-8 p-6 md:p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
            <div className="relative">
              <input
                type="number"
                min="100"
                max="5000"
                value={radius || ''}
                onChange={(e) => setRadius(parseInt(e.target.value) || 0)}
                className="w-full bg-white border-2 border-indigo-100 pl-6 pr-16 py-5 rounded-2xl outline-none transition-all text-lg font-bold text-indigo-600 shadow-sm"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Meters</div>
            </div>

            <div className="px-2">
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={radius || 100}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                style={{
                   background: `linear-gradient(to right, #4f46e5 ${rangePercent}%, #e2e8f0 ${rangePercent}%)`
                }}
                className="w-full h-3 rounded-full appearance-none cursor-pointer accent-indigo-600 transition-all shadow-inner border border-slate-100"
              />
            </div>
            
            <div className="flex justify-between text-[10px] font-bold text-slate-400 tracking-tighter px-1">
              <span>Short Range (100m)</span>
              <span>Long Range (5km)</span>
            </div>
          </div>
        </div>

        <div
          ref={mapRef}
          className="h-[400px] md:h-[550px] bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner relative"
        >
          {!lat && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <span className="font-bold text-[11px]">Loading Map...</span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <button
            className="flex items-center gap-2 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 shadow-inner">
                  <AlertTriangle size={40} />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Confirm Office Relocation?</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
                    Changing the office location will affect geofencing for all employees. 
                    Are you sure you want to update the official headquarters location?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="py-4 rounded-2xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSave}
                    className="py-4 rounded-2xl font-bold text-sm text-white bg-indigo-600 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Yes, Change Location
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
