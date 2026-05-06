import { Loader2, Lock, LogIn, Mail, Send, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { setCredentials } from '../store/authSlice';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error('Please enter email or mobile number');

    setLoading(true);
    try {
      await api.post('/auth/send-otp', { identifier });
      toast.success('OTP sent successfully!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter OTP');

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { identifier, otp });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch(setCredentials({
        user: user,
        token: token
      }));
      toast.success('Login Successful');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-[460px] animate-fade-up">
        <div className="glass-card p-8 sm:p-10 md:p-12 bg-white border-slate-200 shadow-2xl shadow-slate-200/50">
          <div className="text-center mb-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200">
              <Lock className="text-white" size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3">Admin Portal</h2>
            <p className="text-slate-400 text-xs font-bold tracking-tight">Login to your account</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">Email or Phone</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Enter email or mobile"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-14 pr-6 py-4 rounded-2xl outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 px-8 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {loading ? 'Sending...' : 'Get OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">Enter OTP</label>
                <div className="relative group">
                  <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="7-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={7}
                    className="w-full bg-slate-50 border border-slate-200 pl-14 pr-6 py-4 rounded-2xl outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-900 text-center text-xl tracking-[0.5em] placeholder:text-slate-300 placeholder:tracking-normal"
                  />
                </div>
                <p className="text-center text-[10px] text-slate-400 font-bold">We sent a 7-digit code to your device</p>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 px-8 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-slate-400 hover:text-indigo-600 text-[10px] font-bold tracking-wider transition-colors py-2"
              >
                Change Email or Phone
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-[10px] font-bold tracking-tight opacity-50">
            &copy; 2026 HRMS Geo System • Secure Admin Link
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
