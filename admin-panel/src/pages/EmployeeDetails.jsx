import {
  Briefcase,
  Calendar,
  ChevronLeft,
  Clock,
  Download,
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
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
              {employee.role?.toUpperCase()}
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
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-slate-800 tracking-widest flex items-center gap-3">
              <TrendingUp size={18} className="text-indigo-600" />
              Performance Summary
            </h3>
            <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 border border-slate-100">
              Last 30 Days
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <SummaryCard label="Work Days" value={`${summary.workDays} days`} />
            <SummaryCard label="Leaves Approved" value={summary.approvedLeaves} colorClass="text-indigo-600" />
            <SummaryCard label="Days Present" value={`${summary.presentDays} days`} colorClass="text-emerald-600" />
            <SummaryCard label="Not Marked" value={`${summary.notMarked} days`} colorClass="text-red-500" />
            <SummaryCard label="Total Distance" value={`${(attendanceDetails.reduce((acc, curr) => acc + (curr.totalDistance || 0), 0)).toFixed(2)} KM`} colorClass="text-indigo-600" />
            <SummaryCard label="Late Count" value={summary.lateCount} colorClass="text-amber-500" />
            <SummaryCard label="Actual Worked" value={`${summary.actualWorkedHours.toFixed(1)}h`} colorClass="text-indigo-600" />
            <SummaryCard label="Below Target" value={`${Math.max(0, summary.expectedWorkHours - summary.actualWorkedHours).toFixed(1)}h`} colorClass="text-red-400" />
          </div>

          <div className="mt-12 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400">Attendance Status</p>
                <p className="text-sm font-bold text-slate-700">Perfectly tracked for the current cycle</p>
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
              {attendanceDetails.map((log, idx) => (
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
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-tighter ${log.isOutside ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {log.isOutside ? 'Outside' : 'Inside fenced area'}
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
                      <div className="px-2 py-0.5 rounded-full text-[8px] font-bold tracking-tighter bg-green-50 text-green-600">
                        Inside fenced area
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center border-r border-slate-50">
                    <span className="text-[11px] font-bold text-indigo-600">
                      {log.breaks?.reduce((acc, b) => acc + (b.duration || 0), 0) || 0}m ({log.breaks?.length || 0})
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center font-bold text-[11px] text-slate-800">
                    {log.loggedHours?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
