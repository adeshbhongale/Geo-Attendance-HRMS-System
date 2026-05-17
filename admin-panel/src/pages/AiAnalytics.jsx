import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Lightbulb,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ScoreCard = ({ title, score, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 min-w-[240px]"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600`}>
        {icon}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-3xl font-bold text-slate-900">{score}%</span>
        <span className="text-[10px] font-bold text-slate-400  tracking-widest">Score</span>
      </div>
    </div>
    <h3 className="text-sm font-bold text-slate-600 tracking-tight">{title}</h3>
    <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={`h-full bg-${color}-500`}
      />
    </div>
  </motion.div>
);

const InsightCard = ({ title, content, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 p-8 text-${color}-50 opacity-20 group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon, { size: 120 })}
    </div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm font-medium">{content}</p>
    </div>
  </motion.div>
);

const CustomDropdown = ({ options, selected, onSelect, icon: Icon, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
      >
        <div className="flex items-center gap-3">
          <Icon className="absolute left-5 text-slate-400" size={18} />
          <span>{selected === 'All' ? placeholder : selected}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onSelect(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-6 py-3 text-sm font-bold transition-colors ${selected === opt
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {opt === 'All' ? placeholder : opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AiAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  useEffect(() => {
    const cachedData = localStorage.getItem('ai_analytics_cache');
    if (cachedData) {
      setData(JSON.parse(cachedData));
      setLoading(false);
    } else {
      fetchAIStats();
    }
  }, []);

  const fetchAIStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/ai/analytics');
      setData(res.data);
      localStorage.setItem('ai_analytics_cache', JSON.stringify(res.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to AI engine. Verify API key.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
          <BrainCircuit className="text-indigo-600 animate-bounce relative z-10" size={64} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-8 tracking-tight">Consulting Gemini AI...</h2>
        <p className="text-slate-500 font-bold text-sm mt-2">Aggregating workforce data and generating insights</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 max-w-md text-center">
          <AlertTriangle className="text-rose-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-rose-900 tracking-tight">Analysis Interrupted</h2>
          <p className="text-rose-600 font-medium text-sm mt-2 leading-relaxed">{error}</p>
          <button
            onClick={fetchAIStats}
            className="mt-6 bg-rose-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-rose-700 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const ai = data.data;
  const rawEmployeeScores = data.employeeScores || [];

  // Extract unique departments
  const departments = ['All', ...new Set(rawEmployeeScores.map(e => e.department))];

  // Combined Filtering Logic
  const filteredScores = rawEmployeeScores.filter(e => {
    const matchesSearch = (e.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || e.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Business AI Insights</h1>
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full  tracking-widest flex items-center gap-1.5 shadow-lg shadow-indigo-100">
                <Sparkles size={10} /> Powered by Gemini
              </span>
            </div>
            <p className="text-slate-500 font-bold text-sm mt-1">Real-time performance metrics and predictive workforce summaries</p>
          </div>
        </div>

        <button
          onClick={fetchAIStats}
          className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCcw size={16} /> Refresh AI Data
        </button>
      </div>

      {/* Main Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard
          title="Attendance Efficiency"
          score={ai.attendanceScore}
          icon={<TrendingUp size={24} />}
          color="indigo"
          delay={0.1}
        />
        <ScoreCard
          title="Punctuality Rating"
          score={ai.punctualityScore}
          icon={<Clock size={24} />}
          color="amber"
          delay={0.2}
        />
        <ScoreCard
          title="Workforce Reliability"
          score={ai.reliabilityScore}
          icon={<ShieldCheck size={24} />}
          color="emerald"
          delay={0.3}
        />
        <div className="bg-slate-900 p-8 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BrainCircuit size={100} color="white" />
          </div>
          <span className="text-slate-400 text-[10px] font-bold  tracking-[0.2em] mb-2">Consistency Index</span>
          <h3 className={`text-4xl font-bold ${ai.consistency === 'High' ? 'text-emerald-400' : 'text-amber-400'} tracking-tight`}>
            {ai.consistency}
          </h3>
          <p className="text-slate-500 text-xs mt-3 font-bold">Aggregated from 30-day patterns</p>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InsightCard
          title="Workforce Summary"
          content={ai.workforceSummary}
          icon={<Users />}
          color="indigo"
          delay={0.4}
        />
        <InsightCard
          title="Department Insights"
          content={ai.departmentInsights}
          icon={<Lightbulb />}
          color="amber"
          delay={0.5}
        />
      </div>

      {/* Employee Rankings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm"
      >
        {/* Table Toolbar */}
        <div className="p-8 border-b border-slate-50 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Workforce Performance Rankings</h3>
                <p className="text-slate-400 text-[11px] font-bold  tracking-widest mt-0.5">30-Day Efficiency Leaderboard</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search employee by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
              />
            </div>

            {/* Custom Dept Filter */}
            <CustomDropdown
              options={departments}
              selected={selectedDept}
              onSelect={setSelectedDept}
              icon={Building2}
              placeholder="All Departments"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400  tracking-[0.2em]">Rank</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400  tracking-[0.2em]">Employee</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400  tracking-[0.2em]">Department</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400  tracking-[0.2em] text-center">Overall AI Score</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400  tracking-[0.2em]">AI Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredScores.map((emp, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * (index % 10) }}
                  className="hover:bg-indigo-50/30 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${index < 3 && searchTerm === '' && selectedDept === 'All' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold  tracking-widest">
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center">
                      <span className={`text-lg font-bold ${emp.overallScore >= 80 ? 'text-emerald-600' : emp.overallScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {emp.overallScore}%
                      </span>
                      <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${emp.overallScore >= 80 ? 'bg-emerald-500' : emp.overallScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${emp.overallScore}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                      <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
                      {emp.recommendation}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredScores.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-bold">
              No employees found matching your search criteria.
            </div>
          )}
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">AI HR Recommendations</h3>
            <p className="text-slate-400 text-[11px] font-bold  tracking-widest mt-0.5">Strategic Action Plan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ai.hrRecommendations.map((rec, i) => (
            <motion.div
              key={i}
              whileHover={{ x: 5 }}
              className="flex items-start gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 group transition-all"
            >
              <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
              <p className="text-slate-700 text-sm font-semibold leading-relaxed">{rec}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AiAnalytics;
