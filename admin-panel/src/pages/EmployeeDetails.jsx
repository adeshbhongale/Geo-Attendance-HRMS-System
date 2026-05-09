import {
  Briefcase,
  Calendar,
  ChevronLeft,
  Clock,
  Download,
  Image as ImageIcon,
  Layers,
  Loader2,
  Phone,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

const EmployeeDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatDuration = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) return '0h 0m';
    const totalMinutes = Math.round(decimalHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/reports/employee-details/${userId}`);
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load employee details');
        navigate('/admin/reports');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-sm font-bold text-slate-400">Loading profile data...</p>
      </div>
    );
  }

  if (!data) return null;

  const { employee, summary, attendanceDetails } = data;

  const SummaryCard = ({ label, value, colorClass = "text-slate-800" }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 tracking-widest">{label}</p>
      <p className={`text-sm font-bold ${colorClass}`}>{value}</p>
    </div>
  );

  const handleDownload = () => {
    const headers = ["Date", "Punch In Time", "Punch In Location", "Punch Out Time", "Punch Out Location", "Logged Hours", "Distance (KM)"];
    const rows = attendanceDetails.map(log => [
      new Date(log.date).toLocaleDateString(),
      log.punchIn?.time ? new Date(log.punchIn.time).toLocaleTimeString() : '--',
      log.punchIn?.location?.address || 'NA',
      log.punchOut?.time ? new Date(log.punchOut.time).toLocaleTimeString() : '--',
      log.punchOut?.location?.address || 'NA',
      log.loggedHours?.toFixed(2) || '0',
      (log.totalDistance || 0).toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${employee.name}_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 transition-all hover:scale-105"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Employee Details</h1>
          <p className="text-xs font-bold text-slate-400">View detailed performance and history for {employee.name}</p>
        </div>
      </div>

      {/* Profile & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110" />

          <div className="relative flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center mb-6 overflow-hidden">
              {employee.profileImage ? (
                <img src={employee.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl font-bold text-indigo-600">
                  {employee.name.charAt(0)}
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-800">{employee.name}</h2>
            <div className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold tracking-widest mt-2 border border-indigo-100">
              {employee.designation || 'Staff'}
            </div>

            {/* Dynamic Status Indicator */}
            <div className="mt-4 flex items-center gap-2">
              {attendanceDetails.some(d =>
                new Date(d.date).toDateString() === new Date().toDateString() && d.punchIn?.time && !d.punchOut?.time
              ) ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-tight">ACTIVE NOW</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold tracking-tight">OFFLINE</span>
                </div>
              )}
            </div>

            <div className="mt-8 w-full space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                  <Phone size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider">Mobile No</p>
                  <p className="text-xs font-bold text-slate-700">{employee.mobile}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                  <Briefcase size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider">Department</p>
                  <p className="text-xs font-bold text-slate-700">{employee.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                  <Layers size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider">Designation</p>
                  <p className="text-xs font-bold text-slate-700">{employee.designation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-slate-800 tracking-widest flex items-center gap-3">
              <TrendingUp size={18} className="text-indigo-600" />
              Performance Summary
            </h3>
            <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 border border-slate-100">
              Last 30 Days
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-auto">
            <SummaryCard label="Work Days" value={`${summary.workDays} days`} />
            <SummaryCard label="Leaves Approved" value={summary.approvedLeaves} colorClass="text-indigo-600" />
            <SummaryCard label="Present Days" value={`${summary.presentDays} days`} colorClass="text-emerald-600" />
            <SummaryCard label="Late Count" value={summary.lateCount} colorClass="text-amber-500" />
            <SummaryCard label="Total Distance (30D)" value={`${(attendanceDetails.reduce((acc, curr) => acc + (curr.totalDistance || 0), 0)).toFixed(2)} KM`} colorClass="text-indigo-600" />
            <SummaryCard
              label="Today's Distance"
              value={`${(attendanceDetails.find(d => new Date(d.date).toDateString() === new Date().toDateString())?.totalDistance || 0).toFixed(2)} KM`}
              colorClass="text-indigo-600"
            />
            <SummaryCard label="Actual Worked" value={`${summary.actualWorkedHours.toFixed(1)}h`} colorClass="text-indigo-600" />
            <SummaryCard label="Break Time" value={`${(summary.totalBreakMinutes || 0)}m`} colorClass="text-rose-500" />
          </div>

          <div className="mt-8 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400">Attendance Status</p>
                <p className="text-sm font-bold text-slate-700">Detailed cycle metrics available below</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              <Download size={14} />
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Detail Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 tracking-widest flex items-center gap-3">
            <Clock size={18} className="text-indigo-600" />
            Detailed Attendance History
          </h3>
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-transparent hover:border-slate-200 transition-all">
              <Calendar size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th rowSpan={2} className="px-8 py-6 text-[10px] font-bold text-slate-400 tracking-wider text-center border-r border-slate-100">Date</th>
                <th colSpan={2} className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wider text-center border-b border-r border-slate-100">Timein</th>
                <th colSpan={2} className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wider text-center border-b border-r border-slate-100">Timeout</th>
                <th rowSpan={2} className="px-6 py-6 text-[10px] font-bold text-slate-400 tracking-wider text-center border-r border-slate-100">Break time</th>
                <th rowSpan={2} className="px-6 py-6 text-[10px] font-bold text-slate-400 tracking-wider text-center border-r border-slate-100">Distance (KM)</th>
                <th rowSpan={2} className="px-6 py-6 text-[10px] font-bold text-slate-400 tracking-wider text-center">Logged hours</th>
              </tr>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wider text-center border-r border-slate-100">Picture</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wider text-center border-r border-slate-100">Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wider text-center border-r border-slate-100">Picture</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wider text-center border-r border-slate-100">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendanceDetails
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6 text-center font-bold text-[11px] text-slate-700 border-r border-slate-50">
                      {new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                    </td>

                    {/* Punch In */}
                    <td className="px-6 py-4 border-r border-slate-50 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {log.punchIn?.selfie ? (
                          <img src={log.punchIn.selfie} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-800">{log.punchIn?.time ? new Date(log.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        <div className="text-[9px] text-slate-400 text-center max-w-[150px] line-clamp-1">{log.punchIn?.location?.address || 'Location unknown'}</div>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-tighter ${log.punchIn?.isOutside ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                          {log.punchIn?.isOutside ? 'Outside' : 'Inside fenced area'}
                        </div>
                      </div>
                    </td>

                    {/* Punch Out */}
                    <td className="px-6 py-4 border-r border-slate-50 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {log.punchOut?.selfie ? (
                          <img src={log.punchOut.selfie} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-800">{log.punchOut?.time ? new Date(log.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        <div className="text-[9px] text-slate-400 text-center max-w-[150px] line-clamp-1">{log.punchOut?.location?.address || 'Location unknown'}</div>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-tighter ${log.punchOut?.isOutside ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                          {log.punchOut?.isOutside ? 'Outside' : 'Inside fenced area'}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center border-r border-slate-50">
                      <span className="text-[11px] font-bold text-indigo-600">
                        {log.breaks?.reduce((acc, b) => acc + (b.duration || 0), 0) || 0}m ({log.breaks?.length || 0})
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center border-r border-slate-50 font-bold text-[11px] text-indigo-600">
                      {(log.totalDistance || 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-[11px] text-slate-800">
                      {formatDuration(log.netWorkedHours)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest">
            Showing {Math.min(attendanceDetails.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(attendanceDetails.length, currentPage * itemsPerPage)} of {attendanceDetails.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold border border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.ceil(attendanceDetails.length / itemsPerPage))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(attendanceDetails.length / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(attendanceDetails.length / itemsPerPage)}
              className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold border border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
