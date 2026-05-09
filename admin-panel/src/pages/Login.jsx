import { Loader2, LogIn, Mail, Send, ShieldCheck } from 'lucide-react';
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

  const handleIdentifierChange = (val) => {
    // If input is digits only, limit to 10
    if (/^\d*$/.test(val)) {
      if (val.length <= 10) setIdentifier(val);
    } else {
      // If it contains letters/symbols, limit to 30
      if (val.length <= 30) setIdentifier(val);
    }
  };

  const handleOtpChange = (val) => {
    if (/^\d*$/.test(val) && val.length <= 7) {
      setOtp(val);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 sm:p-12">
      <div className="w-full max-w-[440px] animate-fade-up">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-slate-100 shadow-2xl shadow-slate-200/60">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <ShieldCheck className="text-white" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Admin Portal</h2>
            <p className="text-slate-400 text-[13px] font-medium">Secure access to HRMS dashboard</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold text-slate-400  tracking-widest">Identifier</label>
                  <span className="text-[10px] font-bold text-slate-300  tracking-widest">
                    {identifier.length} / {/^\d+$/.test(identifier) ? 10 : 30}
                  </span>
                </div>
                <div className="relative group">
                  <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Email or 10-digit mobile"
                    value={identifier}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 pl-16 pr-6 py-5 rounded-2xl outline-none focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 transition-all font-bold text-slate-800 placeholder:text-slate-300 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                {loading ? 'Sending OTP...' : 'Send Secure Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="text-center">
                  <label className="text-[11px] font-bold text-slate-400  tracking-widest block mb-4">Verification Code</label>
                  <div className="relative inline-block w-full">
                    <input
                      type="text"
                      placeholder="·······"
                      value={otp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 px-6 py-6 rounded-3xl outline-none focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 transition-all font-bold text-slate-900 text-center text-4xl tracking-[0.4em] placeholder:text-slate-200"
                    />
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <p className="text-[12px] text-slate-400 font-medium">We sent a code to <span className="text-slate-900 font-bold">{identifier}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={18} />}
                  {loading ? 'Verifying...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-slate-400 hover:text-indigo-600 text-[11px] font-bold tracking-widest transition-colors py-4 "
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-[11px] font-bold tracking-tight opacity-40">
            &copy; 2026 HRMS GEO SYSTEM • INTERNAL ADMIN NETWORK
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
