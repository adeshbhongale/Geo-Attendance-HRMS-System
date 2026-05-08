import {
  Activity,
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  Edit2,
  Loader2, Mail, Phone,
  Save,
  Search,
  Shield,
  Trash2,
  UserPlus,
  X, Calendar, ChevronLeft, ChevronRight, RotateCcw, ChevronDown
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import CalendarPicker from '../components/CalendarPicker';
import { AnimatePresence, motion } from 'framer-motion';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmData, setConfirmData] = useState({ show: false, type: '', action: null, message: '' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.mobile.includes(searchTerm) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const formatDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(formatDateString(new Date()));
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    department: '',
    designation: '',
    shift: '',
    role: 'employee',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, shiftRes] = await Promise.all([
        api.get('/employees'),
        api.get('/shifts')
      ]);
      setEmployees(empRes.data.data);
      setShifts(shiftRes.data.data);
    } catch (err) {
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (emp = null) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData({
        name: emp.name,
        email: emp.email,
        mobile: emp.mobile,
        department: emp.department || '',
        designation: emp.designation || '',
        shift: emp.shift?._id || emp.shift || '',
        role: emp.role || 'employee',
        status: emp.status || 'active'
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        department: '',
        designation: '',
        shift: shifts[0]?._id || '',
        role: 'employee',
        status: 'active'
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
    const action = editingEmployee ? 'update' : 'add';
    requestActionConfirm(
      'save',
      async () => {
        try {
          setSaving(true);
          if (editingEmployee) {
            await api.put(`/employees/${editingEmployee._id}`, formData);
            toast.success('Staff details updated');
          } else {
            await api.post('/employees', formData);
            toast.success('New staff member added');
          }
          fetchData();
          setShowModal(false);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Action failed');
        } finally {
          setSaving(false);
        }
      },
      `Are you sure you want to ${action} this staff member?`
    );
  };

  const handleDeleteConfirm = (id) => {
    requestActionConfirm(
      'delete',
      async () => {
        try {
          await api.delete(`/employees/${id}`);
          toast.success('Staff member removed');
          fetchData();
        } catch (err) {
          toast.error('Failed to delete staff member');
        }
      },
      'This will remove the staff member. Are you sure?'
    );
  };

  const stats = {
    total: filteredEmployees.length,
    active: filteredEmployees.filter(e => e.isOnline).length
  };

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const calendarDays = [];
  const totalDays = daysInMonth(currentMonth);
  const startDay = startDayOfMonth(currentMonth);
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-up">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">Staff Directory</h2>
          <p className="text-slate-600 font-bold text-[13px] mt-2">Manage staff profiles and access</p>
        </div>
        <button
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          onClick={() => handleOpenModal()}
        >
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="relative" ref={calendarRef}>
              <div
                className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 transition-all"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <Calendar size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">{selectedDate}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>

              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 10 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 z-[110] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4"
                  >
                    <CalendarPicker
                      selectedDate={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all w-full text-sm font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-l-4 border-indigo-600">
           <div className="text-3xl font-bold text-slate-900 tracking-tighter">{stats.total}</div>
           <div className="text-[10px] font-bold text-slate-400 tracking-wider">Total Staff</div>
        </div>
        <div className="glass-card p-6 border-l-4 border-emerald-500">
           <div className="text-3xl font-bold text-slate-900 tracking-tighter">{stats.active}</div>
           <div className="text-[10px] font-bold text-slate-400 tracking-wider">Active Staff</div>
        </div>
      </div>

      <div className="glass-card overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left bg-slate-50/50">
                <th className="px-6 md:px-8 py-5 text-slate-500 text-[11px] font-bold tracking-tight">Staff Member</th>
                <th className="px-6 md:px-8 py-5 text-slate-500 text-[11px] font-bold tracking-tight">Contact</th>
                <th className="px-6 md:px-8 py-5 text-slate-500 text-[11px] font-bold tracking-tight">Job Info</th>
                <th className="px-6 md:px-8 py-5 text-slate-500 text-[11px] font-bold tracking-tight">Status</th>
                <th className="px-6 md:px-8 py-5 text-slate-500 text-[11px] font-bold tracking-tight text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-bold text-sm">No results found</td>
                </tr>
              ) : (
                filteredEmployees
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 md:px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            onClick={() => navigate(`/employee/${emp._id}`)}
                            className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-110 transition-transform overflow-hidden"
                          >
                            {emp.profileImage ? (
                              <img src={emp.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              emp.name.charAt(0)
                            )}
                          </div>
                          <div
                            className="cursor-pointer group/name"
                            onClick={() => navigate(`/employee/${emp._id}`)}
                          >
                            <div className="font-bold text-slate-900 text-sm tracking-tight group-hover/name:text-indigo-600 transition-colors">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold tracking-tight mt-0.5">Staff ID: {emp._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-xs text-slate-600 font-bold flex items-center gap-2 tracking-tight">
                            <Mail size={12} className="text-slate-400" /> {emp.email}
                          </div>
                          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-2 tracking-tight">
                            <Phone size={12} className="text-slate-400" /> {emp.mobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <div className="font-bold text-slate-800 text-xs tracking-tight">{emp.designation || 'Staff'}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="text-[10px] text-indigo-600 font-bold tracking-tight">{emp.department}</div>
                          <div className="text-[10px] text-slate-400 font-bold tracking-tight bg-slate-50 px-2 py-0.5 rounded-md self-start border border-slate-100">
                            {emp.shift?.name || 'General Shift'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight border ${emp.isOnline
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                          {emp.isOnline ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-5 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"
                            onClick={() => handleOpenModal(emp)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                            onClick={() => handleDeleteConfirm(emp._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 md:px-8 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tighter m-0">{editingEmployee ? 'Edit Details' : 'Add New Staff'}</h3>
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest mt-1">
                    Manage staff info
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Full Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800" placeholder="e.g., John Doe" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Email Address</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800" placeholder="email@company.com" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Mobile</label>
                    <input type="text" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800" placeholder="Mobile number" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Department</label>
                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800" placeholder="e.g., Operations" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Designation</label>
                    <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800" placeholder="e.g., Senior Analyst" />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Work Shift</label>
                    <div className="relative group">
                      <select 
                        value={formData.shift} 
                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })} 
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800 appearance-none"
                      >
                        <option value="">General Shift</option>
                        {shifts.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">Role</label>
                    <div className="relative group">
                      <select 
                        value={formData.role} 
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all text-sm font-bold text-slate-800 appearance-none"
                      >
                        <option value="employee">Staff Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-10">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all">Discard</button>
                  <button type="submit" disabled={saving} className="flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {saving ? 'Saving...' : (editingEmployee ? 'Save Changes' : 'Confirm Add')}
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2.5rem] p-10 w-full max-w-[380px] text-center shadow-2xl">
              <div className="w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center bg-indigo-50 text-indigo-600">
                <AlertCircle size={40} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tighter">Are you sure?</h4>
              <p className="text-slate-500 text-sm font-bold leading-relaxed mb-10 px-4">{confirmData.message}</p>
              <div className="flex gap-4">
                <button className="flex-1 bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all" onClick={() => setConfirmData({ ...confirmData, show: false })}>Cancel</button>
                <button className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg" onClick={executeConfirmedAction}>Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Employees;
