import React, { useState } from 'react';
import { Attendance } from '../types';
import { Calendar, Clock, Smile, Flame, CheckCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AttendanceViewProps {
  attendance: Attendance[];
}

export default function AttendanceView({ attendance }: AttendanceViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats
  const totalSessions = attendance.length;
  
  // Calculate this month sessions based on current Date
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const thisMonthSessions = attendance.filter(att => {
    if (!att.date) return false;
    const attDate = new Date(att.date);
    return attDate.getFullYear() === currentYear && attDate.getMonth() === currentMonth;
  }).length;

  // Calendar logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentCalYear = currentDate.getFullYear();
  const currentCalMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentCalYear, currentCalMonth);
  const firstDay = getFirstDayOfMonth(currentCalYear, currentCalMonth);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Get dates attended in currently viewed month
  const attendedDatesInView = attendance.reduce((acc, att) => {
    if (!att.date) return acc;
    const d = new Date(att.date);
    if (d.getFullYear() === currentCalYear && d.getMonth() === currentCalMonth) {
      acc.add(d.getDate());
    }
    return acc;
  }, new Set<number>());

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 sm:h-12 border border-slate-100 bg-slate-50/30 rounded-lg"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isAttended = attendedDatesInView.has(d);
    
    // Check if it's today
    const isToday = new Date().getDate() === d && new Date().getMonth() === currentCalMonth && new Date().getFullYear() === currentCalYear;

    days.push(
      <div 
        key={`day-${d}`} 
        className={`relative flex items-center justify-center h-10 sm:h-12 border rounded-lg transition-all ${
          isAttended 
            ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold shadow-sm' 
            : isToday 
              ? 'bg-slate-100 border-slate-300 text-slate-800 font-semibold' 
              : 'border-slate-100 bg-white text-slate-600'
        }`}
      >
        <span className="text-sm">{d}</span>
        {isAttended && (
          <span className="absolute bottom-1.5 sm:bottom-2 mx-auto w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
        )}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-6 font-sans"
      id="attendance-view"
    >
      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="attend-stats-grid">
        {/* Stat 1 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center gap-4 animate-fade-in" id="attend-stat-monthly">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl" id="attend-stat-box-monthly">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Current Month</span>
            <span className="text-2xl font-black text-slate-800 block font-mono mt-0.5">{thisMonthSessions} Workouts</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center gap-4" id="attend-stat-alltime">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl" id="attend-stat-box-alltime">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">All Time Check-Ins</span>
            <span className="text-2xl font-black text-slate-800 block font-mono mt-0.5">{totalSessions} Logs</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center gap-4" id="attend-stat-days">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl" id="attend-stat-box-days">
            <Smile className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Attendance Grade</span>
            <span className="text-sm font-sans font-black text-slate-700 block mt-1">Excellent Consistency!</span>
          </div>
        </div>
      </div>

      {/* Interactive Calendar View */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">Monthly View</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Track your workout days</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 font-mono w-32 text-center text-sm">{monthName} {currentCalYear}</span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              disabled={currentCalYear === currentYear && currentCalMonth === currentMonth}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days}
        </div>
        
        <div className="mt-5 flex items-center justify-center gap-4 text-[10px] font-bold font-mono tracking-widest text-slate-500 uppercase border-t border-slate-100 pt-5">
           <div className="flex items-center gap-1.5">
             <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
             <span>Attended ({attendedDatesInView.size})</span>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="w-2.5 h-2.5 bg-slate-100 border border-slate-300 rounded-sm"></span>
             <span>Today</span>
           </div>
        </div>
      </div>

      {/* Attendance Grid log history */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm" id="attend-history-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-3" id="attend-header-bar">
          <div className="text-left">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">Attendance Log History</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Real-time daily desk check-ins and self punches</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/40 rounded-lg text-[10px] font-mono text-slate-500" id="attend-pwa-pill">
            <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            Active Customer Portal Sync
          </div>
        </div>

        {attendance.length === 0 ? (
          <div className="py-12 text-center text-slate-400" id="attend-empty-state">
            <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No attendance reports found on system</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 font-sans">You have not registered any attendance logs yet. Try performing a punch in from the Home tab dashboard above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto" id="attend-table-wrapper">
            <table className="w-full text-left border-collapse" id="attend-table">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold" id="attend-table-header">
                  <th className="py-3 px-4">Date Registered</th>
                  <th className="py-3 px-4">Punch In Time</th>
                  <th className="py-3 px-4">Log Remarks</th>
                  <th className="py-3 px-4 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 text-left animate-fade-in" id="attend-table-body">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors" id={`attend-row-${att.id}`}>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2" id={`attend-cell-date-${att.id}`}>
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {formatDateStr(att.date)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500" id={`attend-cell-in-${att.id}`}>
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        {att.check_in_time || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-400" id={`attend-cell-remarks-${att.id}`}>
                      {att.remarks || 'Self Punch Customer Portal'}
                    </td>
                    <td className="py-3.5 px-4 text-right" id={`attend-cell-status-${att.id}`}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        PRESENT ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
