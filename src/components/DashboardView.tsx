import { useState, useMemo } from 'react';
import { DashboardSummary, Member } from '../types';
import { 
  Award, 
  Calendar, 
  CreditCard, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2,
  Sparkles,
  Fingerprint,
  X,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
  summary: DashboardSummary;
  onNavigate: (route: string) => void;
  hasCheckedInToday: boolean;
  hasPendingInvoice?: boolean;
  onCheckIn: () => Promise<void>;
  onUpdateGoal: (updates: Partial<Member>) => Promise<void>;
  attendance?: any[];
}

export default function DashboardView({ summary, onNavigate, hasCheckedInToday, hasPendingInvoice, onCheckIn, onUpdateGoal, attendance = [] }: DashboardViewProps) {
  const { member, plan, daysLeft, attendanceThisMonth, lastCheckIn, totalPaidThisMonth, pendingDue } = summary;
  const [punching, setPunching] = useState(false);
  const [punchSuccess, setPunchSuccess] = useState(false);
  const [editGoalMode, setEditGoalMode] = useState(false);
  const [goalForm, setGoalForm] = useState({
    weekly_goal: member.weekly_goal || 4,
    start_weight: member.start_weight || '',
    current_weight: member.current_weight || '',
    target_weight: member.target_weight || '',
    fitness_goal: member.fitness_goal || 'Weight Loss'
  });
  const [savingGoal, setSavingGoal] = useState(false);

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      await onUpdateGoal({
        weekly_goal: Number(goalForm.weekly_goal) || 4,
        start_weight: Number(goalForm.start_weight) || undefined,
        current_weight: Number(goalForm.current_weight) || undefined,
        target_weight: Number(goalForm.target_weight) || undefined,
        fitness_goal: goalForm.fitness_goal
      });
      setEditGoalMode(false);
    } finally {
      setSavingGoal(false);
    }
  };

  // Format Helper: date strings to nice local display
  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return 'Not configured';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePunchInAction = async () => {
    if (hasCheckedInToday || punching) return;
    setPunching(true);
    try {
      await onCheckIn();
      setPunchSuccess(true);
      setTimeout(() => setPunchSuccess(false), 3000);
    } catch (err) {
      console.error("Check-in failed:", err);
    } finally {
      setPunching(false);
    }
  };

  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

  // Calculate chart data based on attendance
  const chartData = useMemo(() => {
    if (!attendance || attendance.length === 0) return [];
    
    const data = [];
    const today = new Date();
    
    // Create 4 weekly buckets going backward from today
    for (let i = 3; i >= 0; i--) {
      const end = new Date(today);
      end.setDate(end.getDate() - (i * 7));
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      
      const bucketLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      
      let count = 0;
      attendance.forEach(att => {
        if (!att.date) return;
        const attDate = new Date(att.date);
        if (attDate >= start && attDate <= new Date(end.setHours(23, 59, 59, 999))) {
          count++;
        }
      });
      
      data.push({
        name: bucketLabel,
        workouts: count
      });
    }
    
    return data;
  }, [attendance]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 font-sans"
      id="dashboard-view"
    >
      {/* 1. Header Greeting Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl" id="dash-greeting-card">
        {/* Decorative ambient vector glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-505/10 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-slate-500/5 rounded-full blur-2xl -mb-12" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="dash-greeting-inner">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] tracking-wider uppercase text-indigo-300 font-bold mb-3" id="dash-motto">
              <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
              Member space
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" id="dash-greeting-title">
              Greeting, {member.name || 'Athlete'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 font-medium max-w-md">
              Maintain your exercise routines and monitor registered active memberships.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all text-left sm:text-right" onClick={() => onNavigate('profile')} id="dash-member-card">
            <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-405 text-indigo-400 block font-bold">Joined Gym</span>
            <span className="text-base font-extrabold tracking-tight text-white block mt-0.5">{formatDateStr(member.join_date)}</span>
            <span className="text-[11px] text-slate-400 font-mono tracking-tighter block mt-1 hover:underline">View registration logs</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Punch-In Section (My Area / Home Check In Button) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6" id="dash-punch-in-panel">
        <div className="flex items-center gap-4 text-left w-full md:w-auto" id="punch-meta">
          <div className={`p-4 rounded-2xl transition-all ${
            hasCheckedInToday ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
          }`} id="punch-icon-box">
            <Fingerprint className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">Daily Attendance Log</p>
            <h2 className="text-lg font-black text-slate-800 tracking-tight mt-0.5" id="punch-status-text">
              {hasCheckedInToday ? 'Checked In successfully!' : 'Ready for Workspace Check-In?'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {hasCheckedInToday 
                ? 'Your present status has been recorded for today. Great job keeping your fitness active!' 
                : 'Click check-in as you enter the gym premises to automatically file your daily logs.'}
            </p>
          </div>
        </div>

        {hasCheckedInToday ? (
          <div className="w-full md:w-auto px-6 py-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2" id="checked-in-complete">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Checked In ✓</span>
          </div>
        ) : (
          <button
            onClick={handlePunchInAction}
            disabled={punching}
            className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shrink-0"
            id="punch-action-btn"
          >
            {punching ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg> Recording Check-In...
              </span>
            ) : (
              <>
                <span>Check In Now</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* 3. Pending Invoice or Renewal Alert if expiring */}
      {hasPendingInvoice ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse shadow-sm" id="pending-invoice-banner">
          <div className="flex items-center gap-4" id="pending-invoice-lead">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl" id="pending-invoice-icon">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-rose-800">Payment Required</p>
              <p className="text-xs text-rose-700 mt-1 font-medium">You have a pending invoice of ₹{summary.pendingDue.toLocaleString('en-IN')}. Please clear your dues.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => onNavigate('pay-now')}
            className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl tracking-widest uppercase shrink-0 transition-transform cursor-pointer shadow-md flex justify-center items-center gap-2"
            id="pending-invoice-action-btn"
          >
            Pay Now <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : isExpiringSoon ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse shadow-sm" id="renew-soon-banner">
          <div className="flex items-center gap-4" id="renew-soon-lead">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl" id="renew-icon-box">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-amber-800">Membership Expiring Soon!</p>
              <p className="text-xs text-amber-700 mt-1 font-medium">Your plan expires in {daysLeft} days. Submit a renewal request to avoid interruptions.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => onNavigate('plan')}
            className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl tracking-widest uppercase shrink-0 transition-transform cursor-pointer shadow-md flex justify-center items-center gap-2"
            id="renew-action-btn"
          >
            Renew Now <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* 4. Membership Overview Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="dash-stats-grid-primary">
        {/* Plan & End Status */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="dash-plan-card">
          <div id="dash-plan-header">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono _uppercase tracking-widest text-slate-400 font-bold uppercase">Active Plan</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-snug uppercase">
              {plan?.name || 'No Active Plan'}
            </h3>
            <p className="text-xs text-indigo-600 font-bold mt-1">{plan?.price ? `₹${plan.price.toLocaleString('en-IN')}` : 'Price not set'}</p>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 space-y-2 text-xs text-slate-600" id="dash-plan-dates">
            <div className="flex justify-between" id="dash-plan-start">
              <span>Start Date:</span>
              <span className="font-semibold text-slate-800">{formatDateStr(member.plan_start_date)}</span>
            </div>
            <div className="flex justify-between" id="dash-plan-end">
              <span>End Date:</span>
              <span className="font-semibold text-slate-800">{formatDateStr(member.plan_end_date)}</span>
            </div>
          </div>
        </div>

        {/* Days Left Countdown */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="dash-countdown-card">
          <div id="dash-countdown-header">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Time Remaining</span>
              <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1" id="dash-days-left-count">
              <span className="text-5xl font-black text-slate-800 tracking-tighter font-mono">{daysLeft}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Days Left</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4" id="dash-countdown-status">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Membership Status:</span>
              {member.status === 'Active' && daysLeft > 0 ? (
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-rose-50 text-rose-700 border border-rose-100">Expired</span>
              )}
            </div>
          </div>
        </div>

        {/* Attendance counter */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="dash-attendance-card">
          <div id="dash-attendance-header">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">This Month's Workouts</span>
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5" id="dash-attendance-count">
              <span className="text-5xl font-black text-indigo-700 tracking-tighter font-mono">{attendanceThisMonth}</span>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Sessions</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4" id="dash-attendance-last">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-bold leading-none">Last Check-In</span>
            <span className="text-xs font-semibold text-slate-800 block mt-1">
              {lastCheckIn ? `${formatDateStr(lastCheckIn.date)} @ ${lastCheckIn.check_in_time || 'N/A'}` : 'No sessions recorded yet'}
            </span>
          </div>
        </div>
      </div>

      {/* 4.5 My Fitness Goals Tracker */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6" id="dash-fitness-goals">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
               <Award className="h-5 w-5" />
             </div>
             <div>
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">My Fitness Goals</h3>
               <p className="text-xs text-slate-500 font-medium mt-0.5">Track your progress</p>
             </div>
           </div>
           <button 
             onClick={() => setEditGoalMode(true)}
             className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold rounded-lg uppercase tracking-wider transition"
           >
             Edit Goals
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Weekly Workouts */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex flex-col justify-center">
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <h4 className="text-[11px] uppercase tracking-widest font-bold text-emerald-800">Weekly Workout Goal</h4>
                   <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{summary.attendanceThisWeek} of {summary.weeklyGoal} completed</p>
                 </div>
                 <span className="text-xl font-black text-emerald-700 font-mono">
                    {Math.round((summary.attendanceThisWeek / summary.weeklyGoal) * 100)}%
                 </span>
               </div>
               <div className="w-full h-2.5 bg-emerald-100 rounded-full overflow-hidden relative">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min((summary.attendanceThisWeek / summary.weeklyGoal) * 100, 100)}%` }}
                   transition={{ duration: 1, ease: 'easeOut' }}
                   className={`h-full rounded-full ${summary.attendanceThisWeek >= summary.weeklyGoal ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                 />
               </div>
               {summary.attendanceThisWeek >= summary.weeklyGoal && (
                 <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 mt-2 flex items-center gap-1">
                   <CheckCircle2 className="h-3 w-3" /> Goal Achieved!
                 </p>
               )}
            </div>

           {/* Weight Goal */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col justify-center">
               <div className="flex justify-between items-end mb-2">
                 <div>
                   <h4 className="text-[11px] uppercase tracking-widest font-bold text-indigo-800">{member.fitness_goal || 'Weight Goal'}</h4>
                   <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                     {member.current_weight ? `${member.current_weight} kg` : '--'} → {member.target_weight ? `${member.target_weight} kg` : '--'}
                   </p>
                 </div>
                 <span className="text-xl font-black text-indigo-700 font-mono">
                    {(() => {
                       if (!member.start_weight || !member.current_weight || !member.target_weight) return '0%';
                       const totalDiff = Math.abs(member.start_weight - member.target_weight);
                       const currentDiff = Math.abs(member.start_weight - member.current_weight);
                       if (totalDiff === 0) return '100%';
                       return Math.min(Math.round((currentDiff / totalDiff) * 100), 100) + '%';
                    })()}
                 </span>
               </div>
               <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden relative">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: (() => {
                       if (!member.start_weight || !member.current_weight || !member.target_weight) return '0%';
                       const totalDiff = Math.abs(member.start_weight - member.target_weight);
                       const currentDiff = Math.abs(member.start_weight - member.current_weight);
                       if (totalDiff === 0) return '100%';
                       return `${Math.min((currentDiff / totalDiff) * 100, 100)}%`;
                   })() }}
                   transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                   className="h-full rounded-full bg-indigo-500"
                 />
               </div>
            </div>
        </div>
      </div>

      {/* 4.8 Consistency Trend */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6" id="dash-consistency-trend">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Attendance Trend</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Your weekly consistency over the last month</p>
          </div>
        </div>

        <div className="h-48 w-full mt-2" style={{ minHeight: '192px' }}>
          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: '192px' }}>
              <ResponsiveContainer width="100%" height={192}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600, fontFamily: 'monospace' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600, fontFamily: 'monospace' }} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#EEF2FF' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                  />
                  <Bar 
                    dataKey="workouts" 
                    fill="#6366F1" 
                    radius={[4, 4, 0, 0]} 
                    barSize={32}
                    name="Workouts"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs font-bold text-slate-400 font-mono uppercase tracking-widest bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No Data Available
            </div>
          )}
        </div>
      </div>

      {/* 5. Financial Status & Direct Dues Bar */}
      <div className="bg-slate-100/70 border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6" id="dash-finances-panel">
        <div className="flex items-center gap-4" id="dash-finances-meta">
          <div className="p-3.5 bg-white text-indigo-600 rounded-2xl shadow-sm border border-slate-200/40" id="finance-icon-box">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">Dues & Payments Balance</p>
            <div className="flex items-baseline gap-4 mt-1" id="finances-totals">
              <p className="text-xs text-slate-600">
                Paid this month: <span className="text-base font-black text-slate-800 font-mono">₹{totalPaidThisMonth.toLocaleString('en-IN')}</span>
              </p>
              <span className="h-3 w-px bg-slate-300" />
              <p className="text-xs text-slate-600">
                Pending dues: <span className="text-base font-black text-rose-600 font-mono">₹{pendingDue.toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('payments')}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          id="dash-pay-now-action-btn"
        >
          View Billing Ledger <ArrowRight className="h-4 w-4 text-indigo-400" />
        </button>
      </div>

      {/* 6. Shortcuts block */}
      <div className="pt-4 text-left" id="dash-shortcuts">
        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-3 block">Shortcut Operations</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="dash-shortcuts-grid">
          {[
            { id: 'profile', label: 'My Profile', desc: 'Contact details' },
            { id: 'plan', label: 'My Plan', desc: 'Membership benefits' },
            { id: 'attendance', label: 'Attendance logs', desc: 'Check in dates' },
            { id: 'support', label: 'Support ticket', desc: 'Complaints/Assistance' }
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => onNavigate(sc.id)}
              className="p-3.5 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl shadow-sm shadow-slate-100 hover:shadow-md text-left transition-all group focus:outline-none cursor-pointer"
              id={`dash-shortcut-${sc.id}`}
            >
              <p className="text-xs font-extrabold text-slate-700 group-hover:text-indigo-600 uppercase transition-colors">{sc.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">{sc.desc}</p>
            </button>
          ))}
        </div>
      </div>
      {/* Edit Goals Modal */}
      {editGoalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100"
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-widest">Edit Fitness Goals</h2>
              <button onClick={() => setEditGoalMode(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-500 uppercase font-bold tracking-widest mb-1.5 font-sans">Goal Type</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  value={goalForm.fitness_goal}
                  onChange={(e) => setGoalForm({...goalForm, fitness_goal: e.target.value})}
                >
                  <option>Weight Loss</option>
                  <option>Muscle Gain</option>
                  <option>Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold tracking-widest mb-1.5 font-sans">Weekly Workouts</label>
                <input 
                  type="number" 
                  min="1" max="7"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                  value={goalForm.weekly_goal}
                  onChange={(e) => setGoalForm({...goalForm, weekly_goal: e.target.value})}
                  placeholder="e.g. 4"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase font-bold tracking-widest mb-1.5 font-sans">Start Weight (kg)</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                    value={goalForm.start_weight}
                    onChange={(e) => setGoalForm({...goalForm, start_weight: e.target.value})}
                    placeholder="e.g. 80"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase font-bold tracking-widest mb-1.5 font-sans">Current Weight</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                    value={goalForm.current_weight}
                    onChange={(e) => setGoalForm({...goalForm, current_weight: e.target.value})}
                    placeholder="e.g. 78"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold tracking-widest mb-1.5 font-sans">Target Weight (kg)</label>
                <input 
                  type="number" step="0.1"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                  value={goalForm.target_weight}
                  onChange={(e) => setGoalForm({...goalForm, target_weight: e.target.value})}
                  placeholder="e.g. 70"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveGoal}
              disabled={savingGoal}
              className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition disabled:opacity-50"
            >
              {savingGoal ? 'Saving...' : 'Save Goals'}
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
