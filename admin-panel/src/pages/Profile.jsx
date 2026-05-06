import { Building2, Mail, Phone, ShieldCheck, User, Activity, Users } from 'lucide-react';
import { useSelector } from 'react-redux';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="max-w-6xl animate-fade-up space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight m-0">My Profile</h2>
          <p className="text-slate-600 font-bold text-[13px] mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Status: Active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 flex items-center gap-2">
            <ShieldCheck size={14} />
            Admin Account
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/40 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-violet-600" />
            <div className="relative mt-8">
              <div className="w-28 h-28 rounded-[2.5rem] bg-white p-1 shadow-2xl mx-auto mb-6">
                <div className="w-full h-full rounded-[2.2rem] bg-indigo-600 text-white flex items-center justify-center text-4xl font-bold transition-transform duration-500 shadow-inner">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1">{user?.name || 'Admin User'}</h3>
              <p className="text-[11px] font-bold text-indigo-600 tracking-tight bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 inline-block mb-6">
                {user?.role || 'Admin'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 tracking-tight">Access</p>
                  <p className="text-sm font-bold text-slate-800">Full</p>
                </div>
                <div className="text-center border-l border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 tracking-tight">Area</p>
                  <p className="text-sm font-bold text-slate-800">Global</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 mb-6">
                <ShieldCheck className="text-indigo-400" size={24} />
              </div>
              <h4 className="font-bold text-base tracking-tight mb-4">Security</h4>
              <p className="text-[13px] text-slate-400 leading-relaxed font-bold">
                Your account is secure. Geographic tracking is active for security purposes.
              </p>
              <button className="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">User Details</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Verified account information</p>
              </div>
              <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified
              </div>
            </div>

            <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Name', value: user?.name || 'Admin User', icon: <User size={20} />, sub: 'Full account name' },
                { label: 'Email', value: user?.email || 'admin@example.com', icon: <Mail size={20} />, sub: 'Primary contact email' },
                { label: 'Phone', value: user?.mobile || '+91 9876543210', icon: <Phone size={20} />, sub: 'Registered phone' },
                { label: 'Department', value: user?.department || 'Operations', icon: <Building2 size={20} />, sub: 'Primary department' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-5 p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-100 border border-slate-100 hover:border-indigo-200 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-500 flex items-center justify-center border border-slate-200 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-slate-900 tracking-tight mb-1">{item.value}</p>
                    <p className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <Activity size={20} className="text-indigo-200" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-indigo-200 tracking-tight">System Health</p>
                  <p className="text-2xl font-bold">99.9%</p>
                </div>
              </div>
              <div className="mt-10">
                <p className="text-xs font-bold text-indigo-100 mb-2">Network</p>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[98%] h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/40 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Users size={20} className="text-slate-400" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 tracking-tight">Active Stats</p>
                  <p className="text-2xl font-bold text-slate-900">Active</p>
                </div>
              </div>
              <div className="mt-10">
                <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                  View Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
