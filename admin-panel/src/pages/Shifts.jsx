import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Info,
  Loader2,
  Plus,
  Save,
  Timer,
  Trash2, X, ChevronRight, RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { AnimatePresence, motion } from 'framer-motion';

const Shifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmData, setConfirmData] = useState({ show: false, type: '', action: null, message: '' });

  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriod: 15,
    halfDayLimit: 4,
    lateRules: 'Mark as late after grace period'
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shifts');
      setShifts(res.data.data);
    } catch (err) {
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
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

  const handleOpenModal = (shift = null) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriod: shift.gracePeriod,
        halfDayLimit: shift.halfDayLimit,
        lateRules: shift.lateRules || 'Mark as late after grace period'
      });
    } else {
      setEditingShift(null);
      setFormData({
        name: '',
        startTime: '09:00',
        endTime: '18:00',
        gracePeriod: 15,
        halfDayLimit: 4,
        lateRules: 'Mark as late after grace period'
      });
    }
    setShowModal(true);
  };

  const requestActionConfirm = (type, action, message) => {
    setConfirmData({ show: true, type, action, message });
  };

  const executeConfirmedAction = async () => {
    const { action } = confirmData;
    setConfirmData({ ...confirmData, show: false });
    if (action) await action();
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    const action = editingShift ? 'update' : 'create';
    requestActionConfirm(
      'save',
      async () => {
        try {
          setSaving(true);
          if (editingShift) {
            await api.put(`/shifts/${editingShift._id}`, formData);
            toast.success('Shift updated');
          } else {
            await api.post('/shifts', formData);
            toast.success('Shift created');
          }
          fetchShifts();
          setShowModal(false);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Action failed');
        } finally {
          setSaving(false);
        }
      },
      `Save this shift configuration?`
    );
  };

  const handleDeleteConfirm = (id) => {
    requestActionConfirm(
      'delete',
      async () => {
        try {
          await api.delete(`/shifts/${id}`);
          toast.success('Shift deleted');
          fetchShifts();
        } catch (err) {
          toast.error('Failed to delete shift');
        }
      },
      'This will remove the shift. Are you sure?'
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">Shift Setup</h2>
          <p className="text-slate-600 font-bold text-[13px] mt-2">Manage work timings and rules</p>
        </div>
        <button
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          onClick={() => handleOpenModal()}
        >
          <Plus size={18} />
          Add New Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <div key={shift._id} className="glass-card group flex flex-col bg-white border border-slate-100 overflow-hidden hover:shadow-xl transition-all">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base tracking-tight">{shift.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold">ID: {shift._id.slice(-6)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2.5 rounded-xl bg-white text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  onClick={() => handleOpenModal(shift)}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="p-2.5 rounded-xl bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                  onClick={() => handleDeleteConfirm(shift._id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <Timer size={14} className="text-slate-400" />
                  <span className="text-slate-500 text-[11px] font-bold tracking-tight">Work Hours</span>
                </div>
                <span className="font-bold text-slate-800 text-sm">{to12Hour(shift.startTime)} — {to12Hour(shift.endTime)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-slate-500 text-[11px] font-bold tracking-tight">Grace Period</span>
                </div>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-[10px] border border-emerald-100">
                  {shift.gracePeriod} mins
                </span>
              </div>

              <div className="space-y-2 py-2 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-slate-500 text-[11px] font-bold tracking-tight">Late Rules</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                  {shift.lateRules || 'No rules set'}
                </p>
              </div>

              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-3">
                  <Info size={14} className="text-slate-400" />
                  <span className="text-slate-500 text-[11px] font-bold tracking-tight">Half Day Limit</span>
                </div>
                <span className="font-bold text-slate-800 text-sm">{shift.halfDayLimit} hours</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tighter m-0">
                    {editingShift ? 'Edit Shift' : 'Add New Shift'}
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest mt-1">
                    Configure shift details
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Shift Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Morning Shift"
                    required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Start Time (12h format)</label>
                    <div className="relative group">
                      <Timer size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white pl-12 pr-4 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-50">
                        {to12Hour(formData.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">End Time (12h format)</label>
                    <div className="relative group">
                      <Timer size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white pl-12 pr-4 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-50">
                        {to12Hour(formData.endTime)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Grace Period (Mins)</label>
                    <input
                      type="number"
                      value={formData.gracePeriod}
                      onChange={(e) => setFormData({ ...formData, gracePeriod: e.target.value })}
                      required
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Half Day Limit (Hrs)</label>
                    <input
                      type="number"
                      value={formData.halfDayLimit}
                      onChange={(e) => setFormData({ ...formData, halfDayLimit: e.target.value })}
                      required
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Late Rules</label>
                  <textarea
                    value={formData.lateRules}
                    onChange={(e) => setFormData({ ...formData, lateRules: e.target.value })}
                    placeholder="Describe rules for late arrivals..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800 min-h-[100px] resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {saving ? 'Saving...' : (editingShift ? 'Save Changes' : 'Add Shift')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmData.show && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white rounded-[2.5rem] p-10 w-full max-w-[400px] text-center shadow-2xl"
            >
              <div className="w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center bg-indigo-50 text-indigo-600">
                <AlertCircle size={40} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tighter">
                Confirm Action
              </h4>
              <p className="text-slate-500 text-sm font-bold leading-relaxed mb-10 px-4">
                {confirmData.message}
              </p>
              <div className="flex gap-4">
                <button
                  className="flex-1 bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all"
                  onClick={() => setConfirmData({ ...confirmData, show: false })}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
                  onClick={executeConfirmedAction}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shifts;
