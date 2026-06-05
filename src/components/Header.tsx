import { Dumbbell, LogOut, User, CheckCircle, AlertTriangle, Bell, Info } from 'lucide-react';
import { Member, GlobalMessage } from '../types';
import { DEMO_MEMBERS_MAP } from '../services/userService';
import { useState } from 'react';

interface HeaderProps {
  member: Member | null;
  onLogout: () => void;
  onNavigate: (route: string) => void;
  onProfileSwitch?: (member: Member) => void;
  hasNotifications?: boolean;
  globalMessages?: GlobalMessage[];
}

export default function Header({ member, onLogout, onNavigate, onProfileSwitch, hasNotifications = false, globalMessages = [] }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm" id="header-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" id="header-inner">
        {/* Brand Identity */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer selection:bg-transparent" 
          onClick={() => onNavigate('dashboard')}
          id="header-logo"
        >
          <div className="p-2 bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20" id="header-logo-icon">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <span className="font-sans font-extrabold text-lg tracking-tight text-gray-900 block leading-none">GYM<span className="text-orange-500">DESK</span></span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mt-0.5 font-medium">Member Portal</span>
          </div>
        </div>

        {/* Actions Container */}
        <div className="flex items-center gap-3 sm:gap-4" id="header-actions">
          
          {/* Member Specific Actions */}
          {member ? (
            <>
              {/* Status Chip */}
              <div className="hidden sm:block" id="header-status-pill">
                {member.status === 'Active' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle className="h-3 w-3" />
                    Active Status
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                    <AlertTriangle className="h-3 w-3" />
                    Expired Account
                  </span>
                )}
              </div>

              {/* Notification Bell */}
            <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all duration-150 relative"
                title="Notifications"
                id="header-notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {(hasNotifications || globalMessages.length > 0) && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white px-1 shadow-sm">
                    {globalMessages.length > 0 ? (globalMessages.length > 9 ? '9+' : globalMessages.length) : '!'}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none" onClick={() => setShowNotifications(false)}></div>
                  <div className="fixed sm:absolute top-[72px] sm:top-auto sm:mt-2 left-4 right-4 sm:left-auto sm:right-0 sm:w-80 bg-white rounded-3xl sm:rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col transition-all" style={{ maxHeight: 'calc(100vh - 120px)' }} id="notifications-dropdown">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Alerts & Announcements</h3>
                      <div className="flex items-center gap-3">
                        {globalMessages.length > 0 && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {globalMessages.length} New
                          </span>
                        )}
                        <button className="sm:hidden text-slate-400 hover:text-slate-600 p-1" onClick={() => setShowNotifications(false)}>
                          <span className="sr-only">Close</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                      {globalMessages.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                          <p className="text-sm font-bold text-slate-700">No active alerts</p>
                          <p className="text-xs mt-1">You're completely caught up!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {globalMessages.map((msg, idx) => (
                            <div key={msg.id || idx} className="p-5 hover:bg-slate-50/50 transition-colors bg-white">
                              <h4 className="text-sm font-bold text-slate-900 mb-1.5">{msg.title}</h4>
                              <p className="text-[13px] text-slate-600 leading-relaxed block font-medium">{msg.text || msg.message}</p>
                              {msg.createdAt && (
                                <span className="text-[10px] text-slate-400 mt-3 block font-bold uppercase tracking-widest">
                                  {new Date(msg.createdAt).toLocaleString(undefined, { 
                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Trigger */}
            <button 
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 group text-left selection:bg-transparent focus:outline-none"
              id="header-profile-btn"
            >
              <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-sm tracking-wide shadow-inner overflow-hidden uppercase transition-transform group-hover:scale-105" id="header-avatar">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : member.name ? (
                  member.name.substring(0, 2)
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="hidden md:block" id="header-member-info">
                <p className="text-xs font-medium text-gray-800 leading-tight group-hover:text-orange-600 transition-colors uppercase font-mono">{member.name}</p>
                <p className="text-[10px] text-gray-400 font-mono tracking-tighter">Member ID: #{member.id.substring(0, 6)}</p>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
              title="Logout"
              id="header-logout-btn"
            >
              <LogOut className="h-5 w-5" />
            </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
