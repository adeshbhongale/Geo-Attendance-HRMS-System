import { useJsApiLoader } from '@react-google-maps/api';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, MapPin, Navigation, Save, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Settings = () => {
  const [radius, setRadius] = useState(200);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasOffice, setHasOffice] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry']
  });

  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const marker = useRef(null);
  const circle = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isLoaded && !loading && !googleMap.current && mapRef.current) {
      console.log('Initializing Google Map...');
      initMap();
    }
  }, [isLoaded, loading]);

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
    const pos = lat !== 0 ? { lat: parseFloat(lat), lng: parseFloat(lng) } : { lat: 18.5204, lng: 73.8567 }; // Default to Pune if not set
    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: pos,
      zoom: lat !== 0 ? 15 : 5,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });
    if (lat !== 0) {
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
    }
    googleMap.current.addListener('click', (e) => {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setLat(newPos.lat.toFixed(6));
      setLng(newPos.lng.toFixed(6));

      if (!marker.current) {
        marker.current = new window.google.maps.Marker({
          position: newPos,
          map: googleMap.current,
          draggable: true,
          title: "Office Location"
        });
        marker.current.addListener('dragend', () => {
          const p = marker.current.getPosition();
          setLat(p.lat().toFixed(6));
          setLng(p.lng().toFixed(6));
        });
      }

      if (!circle.current) {
        circle.current = new window.google.maps.Circle({
          map: googleMap.current,
          radius: parseInt(radius),
          fillColor: "#4f46e5",
          fillOpacity: 0.15,
          strokeColor: "#4f46e5",
          strokeOpacity: 0.5,
          strokeWeight: 2,
          center: newPos,
        });
      }
    });

    if (marker.current) {
      marker.current.addListener('dragend', () => {
        const newPos = marker.current.getPosition();
        setLat(newPos.lat().toFixed(6));
        setLng(newPos.lng().toFixed(6));
      });
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/office');
      if (res.data.success && res.data.data) {
        setRadius(res.data.data.radius || 200);
        setLat(res.data.data.latitude);
        setLng(res.data.data.longitude);
        setHasOffice(true);
      } else {
        setHasOffice(false);
      }
    } catch (err) {
      // toast.error('Failed to load settings');
      setHasOffice(false);
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
      setHasOffice(true);
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
    <div className="max-w-5xl animate-fade-up space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">
            {hasOffice ? 'Location Settings' : 'Initial Office Setup'}
          </h2>
          <p className="text-slate-600 font-bold text-sm mt-2">
            {hasOffice ? 'Set office location and attendance range' : 'Please configure your headquarters location on the map'}
          </p>
        </div>
        {!hasOffice && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100 animate-pulse">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-bold  tracking-widest">Setup Mode Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          {!hasOffice ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl space-y-6 sticky top-8"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">Setup Office</h3>
                  <p className="text-[10px] font-bold text-slate-400  tracking-tighter">Step 1: Click on map</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400  tracking-widest">Fencing Radius</span>
                    <span className="text-xs font-bold text-indigo-600">{radius}m</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, #4f46e5 ${((radius - 100) / (1000 - 100)) * 100}%, #e2e8f0 ${((radius - 100) / (1000 - 100)) * 100}%)`
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer transition-all bg-slate-200 slider-thumb"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400  mb-1">Latitude</p>
                    <p className="text-[11px] font-bold text-slate-700 truncate">{lat || 'Click map to set'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400  mb-1">Longitude</p>
                    <p className="text-[11px] font-bold text-slate-700 truncate">{lng || 'Click map to set'}</p>
                  </div>
                </div>
              </div>

              <button
                disabled={!lat || !lng || saving}
                onClick={handleSave}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Set Location
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Latitude</label>
                  <input
                    type="number"
                    value={lat || ''}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 px-4 py-3 rounded-xl outline-none text-sm font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Longitude</label>
                  <input
                    type="number"
                    value={lng || ''}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 px-4 py-3 rounded-xl outline-none text-sm font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-slate-400  tracking-widest ml-1">Radius (Meters)</label>
                    <span className="text-[10px] font-bold text-indigo-600">{radius}m</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="50"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, #4f46e5 ${((radius - 100) / (5000 - 100)) * 100}%, #e2e8f0 ${((radius - 100) / (5000 - 100)) * 100}%)`
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer transition-all bg-slate-200 slider-thumb"
                  />
                </div>
              </div>

              <button
                disabled={saving}
                onClick={handleSave}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Update Settings
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm h-[600px] min-h-[500px] relative overflow-hidden">
            <style>
              {`
                .slider-thumb::-webkit-slider-thumb {
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  background: #4f46e5;
                  border-radius: 50%;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .slider-thumb::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  background: #4f46e5;
                  border-radius: 50%;
                  cursor: pointer;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
              `}
            </style>
            <div ref={mapRef} className="w-full h-full rounded-[1.5rem] bg-slate-100" />
            {!isLoaded && (
              <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <span className="text-xs font-bold text-slate-500">Initializing Map...</span>
              </div>
            )}
            {!hasOffice && isLoaded && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-2xl border border-indigo-100 shadow-2xl z-10 pointer-events-none">
                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-3">
                  <Navigation size={14} className="text-indigo-600 animate-bounce" />
                  Click anywhere on the map to set your office location
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{hasOffice ? 'Confirm Office Relocation?' : 'Confirm Office Setup?'}</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
                    {hasOffice
                      ? 'Changing the office location will affect geofencing for all employees. Are you sure you want to update the official headquarters location?'
                      : 'This will set the official headquarters location for your organization. All employees will need to be within the specified radius for attendance.'
                    }
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
                    {hasOffice ? 'Yes, Change Location' : 'Yes, Set Location'}
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
