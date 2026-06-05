import { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ProfileView from './components/ProfileView';
import PlanView from './components/PlanView';
import AttendanceView from './components/AttendanceView';
import PaymentsView from './components/PaymentsView';
import PayNowView from './components/PayNowView';
import SupportView from './components/SupportView';
import AiChatView from './components/AiChatView';

import { authService } from './services/authService';
import { userService } from './services/userService';
import { Member, DashboardSummary, Attendance, Payment, Plan } from './types';
import { ShieldAlert, LogOut, Copy, Check, Dumbbell, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [authUser, setAuthUser] = useState<any>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isProfileUnlinked, setIsProfileUnlinked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Aggregated component state values
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [globalMessages, setGlobalMessages] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [syncError, setSyncError] = useState<string>('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Initial authentication synchronization setup on mount
  useEffect(() => {
    let active = true;
    setLoading(true);

    const initializeAuthSession = async () => {
      try {
        // 1. First, check if there is a cached passwordless fast-login member in localStorage
        const cachedMemberId = localStorage.getItem('gymdesk_logged_member_id');
        if (cachedMemberId && active) {
          const profile = await userService.getMemberById(cachedMemberId);
          if (profile) {
            await loadBypassedMemberProfile(profile);
            setLoading(false);
            return;
          }
        }

        // 2. Second, verify if there is an active Firebase user session
        const user = await authService.getCurrentUser();
        if (!active) return;

        if (user) {
          setAuthUser(user);
          await loadMemberProfile(user.uid);
        } else {
          // No active sessions, redirect directly to standard credentials portal
          setAuthUser(null);
          setMember(null);
          setDashboardSummary(null);
          setCurrentRoute('login');
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Auth initialization failed:", err);
        setSyncError(err.message || "Failed to contact database");
        setCurrentRoute('login');
        setLoading(false);
      }
    };

    initializeAuthSession();

    // Listen to real-time auth changes from Firebase Auth
    const subscription = authService.onAuthStateChange(async (user) => {
      if (!active) return;
      if (user) {
        const cachedMembId = localStorage.getItem('gymdesk_logged_member_id');
        // Prefer cached fast-login member if already set, else standard Firebase user account
        if (!cachedMembId) {
          setAuthUser(user);
          await loadMemberProfile(user.uid);
        }
      } else {
        // Only trigger logout if there isn't a fast-login session active
        const cachedMembId = localStorage.getItem('gymdesk_logged_member_id');
        if (!cachedMembId) {
          setAuthUser(null);
          setMember(null);
          setIsProfileUnlinked(false);
          setDashboardSummary(null);
          setCurrentRoute('login');
        }
      }
    });

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Real-time listener for Dashboard
  useEffect(() => {
    if (!member?.id) return;
    
    // Subscribe to member
    const unsubMember = userService.subscribeToMember(member.id, (m) => {
       if (m) {
         setMember(prev => (prev?.id === m.id ? m : prev));
         userService.getDashboardSummary(m.id).then(setDashboardSummary).catch(console.error);
       }
    });

    // Subscribe to payments
    const unsubPayments = userService.subscribeToMyPayments(member.id, (pays) => {
       setPayments(pays);
       userService.getDashboardSummary(member.id).then(setDashboardSummary).catch(console.error);
    });

    // Subscribe to global messages
    const unsubMessages = userService.subscribeToGlobalMessages((msgs) => {
      setGlobalMessages(msgs);
    });

    return () => {
      unsubMember();
      unsubPayments();
      unsubMessages();
    };
  }, [member?.id]);

  // Fetch Member profile & corresponding listing details from Firestore
  const loadMemberProfile = async (uid: string) => {
    try {
      setSyncError('');
      // Check for direct profile matching uid (which is the document ID of standard registers)
      let memberProfile = await userService.getMemberById(uid);

      // Helper fallback: query by uid / user_id property
      if (!memberProfile) {
        memberProfile = await userService.getCurrentMember();
      }
      
      if (!memberProfile) {
        setIsProfileUnlinked(true);
        setCurrentRoute('unlinked');
        setLoading(false);
        return;
      }

      setMember(memberProfile);
      setIsProfileUnlinked(false);

      // Fetch all member details in parallel to prevent bottlenecks
      const [summaryData, attendanceData, paymentsData, planData] = await Promise.all([
        userService.getDashboardSummary(memberProfile.id).catch(err => {
          console.warn("Could not aggregate summary details:", err);
          return null;
        }),
        userService.getMyAttendance(memberProfile.id).catch(() => []),
        userService.getMyPayments(memberProfile.id).catch(() => []),
        userService.getMyPlan(memberProfile.id).catch(() => null)
      ]);

      setDashboardSummary(summaryData);
      setAttendance(attendanceData);
      setPayments(paymentsData);
      setCurrentPlan(planData);

      // Route based on member registration status
      if (memberProfile.status === 'Pending Approval' || memberProfile.status === 'Pending') {
        setCurrentRoute('pending-approval');
      } else if (currentRoute === 'login' || currentRoute === 'unlinked' || currentRoute === 'pending-approval') {
        setCurrentRoute('dashboard');
      }
    } catch (err: any) {
      console.error("Error retrieving member profile details:", err);
      setSyncError("Could not retrieve profile statistics. Verify if tables are initialized in your account.");
    } finally {
      setLoading(false);
    }
  };

  // Fast passwordless bypass mode profile loader
  const loadBypassedMemberProfile = async (selectedMember: Member) => {
    setLoading(true);
    try {
      setSyncError('');
      setMember(selectedMember);
      setIsProfileUnlinked(false);
      localStorage.setItem('gymdesk_logged_member_id', selectedMember.id);
      setAuthUser({
        id: selectedMember.user_id || `bypass-${selectedMember.id}`,
        email: `${selectedMember.name.toLowerCase().replace(/\s+/g, '')}@gymdesk.co`,
        isBypassed: true
      });

      // Fetch all member details in parallel to prevent bottlenecks
      const [summaryData, attendanceData, paymentsData, planData] = await Promise.all([
        userService.getDashboardSummary(selectedMember.id).catch(err => {
          console.warn("Could not aggregate summary details:", err);
          return null;
        }),
        userService.getMyAttendance(selectedMember.id).catch(() => []),
        userService.getMyPayments(selectedMember.id).catch(() => []),
        userService.getMyPlan(selectedMember.id).catch(() => null)
      ]);

      setDashboardSummary(summaryData);
      setAttendance(attendanceData);
      setPayments(paymentsData);
      setCurrentPlan(planData);
      
      // Navigate to dashboard or pending depending on status
      if (selectedMember.status === 'Pending Approval' || selectedMember.status === 'Pending') {
        setCurrentRoute('pending-approval');
      } else {
        setCurrentRoute('dashboard');
      }
    } catch (err: any) {
      console.error("Error in bypass profile load:", err);
      setSyncError("Could not load details for this member.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('gymdesk_logged_member_id');
      const hasSession = await authService.getCurrentUser();
      if (hasSession) {
        await authService.signOut();
      }
    } catch (err) {
      console.error("Logout issue:", err);
    } finally {
      setAuthUser(null);
      setMember(null);
      setIsProfileUnlinked(false);
      setDashboardSummary(null);
      setCurrentRoute('login');
      setLoading(false);
    }
  };

  const copyUserIdToClipboard = () => {
    if (!authUser?.id) return;
    navigator.clipboard.writeText(authUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
  };

  // Render view router based on current route
  const renderCurrentRouteView = () => {
    if (loading) return null;

    switch (currentRoute) {
      case 'dashboard':
        if (dashboardSummary && member) {
          const todayStr = new Date().toISOString().split('T')[0];
          const hasCheckedInToday = attendance.some(att => att.date === todayStr);
          return (
            <DashboardView 
              summary={dashboardSummary} 
              attendance={attendance}
              onNavigate={navigateTo} 
              hasCheckedInToday={hasCheckedInToday}
              hasPendingInvoice={payments.some(p => p.status === 'Pending' || p.status === 'Pending_Invoice' || p.status === 'Partial')}
              onUpdateGoal={async (updates) => {
                try {
                  await userService.updateMemberProfile(member.id, updates);
                  await loadMemberProfile(member.id);
                  showToast('Goals updated successfully!', 'success');
                } catch (err: any) {
                  showToast(err.message || 'Failed to update goals', 'error');
                }
              }}
              onCheckIn={async () => {
                try {
                  const todayStr = new Date().toISOString().split('T')[0];
                  await userService.addAttendance(member.id, todayStr);
                  // Refresh member profile stats immediately 
                  await loadMemberProfile(member.id);
                  showToast("Check-in successful! Have a great workout.", "success");
                } catch (err: any) {
                  showToast(err.message, "error");
                }
              }}
            />
          );
        }
        return (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl" id="dash-fallback">
            <AlertTriangle className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">No Account Connected Or Configured</p>
            <p className="text-xs text-slate-400 font-mono mt-1.5 leading-relaxed max-w-sm mx-auto">
              We connected to the Firebase database successfully, but could not retrieve your account mapping. Contact Gym Support to assign your member details.
            </p>
          </div>
        );
      case 'profile':
        if (member) {
          return (
            <ProfileView 
              member={member} 
              onRefreshProfile={async () => {
                // reload member profile info to reflect changes in header, tabs, and greeting cards
                await loadMemberProfile(member.id);
              }}
            />
          );
        }
        return null;
      case 'plan':
        if (member) {
          return (
            <PlanView 
              member={member} 
              plan={currentPlan} 
              daysLeft={dashboardSummary?.daysLeft || 0} 
              onNavigate={navigateTo} 
            />
          );
        }
        return null;
      case 'attendance':
        return <AttendanceView attendance={attendance} />;
      case 'payments':
        return <PaymentsView payments={payments} onNavigate={navigateTo} />;
      case 'pay-now':
        if (member) {
          return <PayNowView member={member} payments={payments} onPaymentSuccess={() => loadMemberProfile(member.id)} />;
        }
        return null;
      case 'support':
        if (member) {
          return <SupportView member={member} />;
        }
        return null;
      case 'ai-chat':
        if (member) {
          return <AiChatView 
            member={member} 
            attendance={attendance} 
            payments={payments} 
            dashboardSummary={dashboardSummary} 
            currentPlan={currentPlan} 
          />;
        }
        return null;
      default:
        return <div className="p-8 text-center" id="route-notfound">View not found</div>;
    }
  };

  const hasNotifications = payments.some(p => p.status === 'Pending' || p.status === 'Pending_Invoice' || p.status === 'Partial');

  // 1. Display loader if verifying credentials on page load
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50" id="loading-screen">
        <div className="text-center space-y-4" id="loading-spinner">
          <div className="inline-flex p-3.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/25 animate-bounce mb-2" id="spinner-logo">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold">Synchronizing Portal</h2>
          <div className="flex justify-center" id="spinner-dots">
            <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // 2. Handle case: Authenticated and profile is Pending
  if (authUser && member && (member.status === 'Pending Approval' || member.status === 'Pending')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="pending-approval-screen">
        <Header member={member} onLogout={handleLogout} onNavigate={navigateTo} hasNotifications={hasNotifications} globalMessages={globalMessages} />
        
        <main className="flex-grow flex items-center justify-center px-4 py-12" id="pending-approval-main">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-white border border-slate-200 shadow-xl rounded-3xl p-6 sm:p-10 text-center space-y-6"
            id="pending-approval-card"
          >
            <div className="relative mb-3 inline-flex items-center justify-center p-4 bg-amber-500 text-white rounded-2xl shadow-md space-y-2 mx-auto">
              <Dumbbell className="h-8 w-8 animate-bounce" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-7">Hold Tight!</h1>
              <h2 className="text-md font-bold text-indigo-600">Your account is pending admin approval</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                We've received your gym request and are currently confirming your credentials. Our administrative team will review and approve your membership details shortly. Keep an eye on this space!
              </p>
            </div>

            {/* Registration Details Overview */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5 font-sans" id="pending-data-review">
              <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-600 border-b border-slate-200/60 pb-1.5">Submitted Details</p>
              
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">FullName:</span>
                <span className="font-semibold text-slate-800">{member.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="font-extrabold text-indigo-700">{member.plan}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Mobile/WhatsApp:</span>
                <span className="font-semibold text-slate-800">{member.mobile}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-mono">Email:</span>
                <span className="font-semibold text-slate-700 break-all">{member.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 text-[9px] font-mono tracking-wider bg-amber-100 text-amber-800 uppercase rounded-md font-extrabold">Pending</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <button
                onClick={() => authUser && loadMemberProfile(authUser.uid)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
                id="pending-refresh-btn"
              >
                Refresh Connection Status
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-slate-200"
                id="pending-logout-btn"
              >
                Log Out & Retry
              </button>
            </div>
          </motion.div>
        </main>
        
        <footer className="py-6 text-center text-[10px] text-slate-400 font-mono border-t border-slate-100 bg-white" id="pending-footer">
          GYM MEMBER PORTAL • SECURE CREDENTIAL PROCESSING
        </footer>
      </div>
    );
  }

  // 3. Handle case: Authenticated, but no corresponding Member record linked
  if (authUser && isProfileUnlinked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="unlinked-screen">
        <Header member={null} onLogout={handleLogout} onNavigate={navigateTo} hasNotifications={false} globalMessages={globalMessages} />
        
        <main className="flex-grow flex items-center justify-center px-4 py-12" id="unlinked-main">
          <div className="max-w-md w-full bg-white border border-slate-200/70 rounded-3xl shadow-xl p-8 text-center space-y-6" id="unlinked-card">
            <div className="mx-auto h-14 w-14 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center justify-center" id="unlinked-alert-icon">
              <ShieldAlert className="h-6 w-6" />
            </div>
            
            <div className="space-y-2 text-center" id="unlinked-text">
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Profile Unlinked</h1>
              <p className="text-sm font-semibold text-rose-600">
                Your gym account is not mapped inside the databases yet. Please contact gym admin.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mt-2" id="unlinked-explain">
                An authenticated Firebase session exists, but your account is not connected to any membership card document in the gym database registry.
              </p>
            </div>

            {/* Display User Id to facilitate admin alignment */}
            <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 space-y-3" id="unlinked-copy-container">
              <div>
                <span className="text-[10px] font-mono text-slate-400 tracking-wider block font-bold uppercase select-none">Registered Identity</span>
                <span className="text-xs text-slate-800 break-all font-mono font-medium block mt-0.5">{authUser.email}</span>
              </div>
              <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-4" id="unlinked-copy-inner">
                <div className="min-w-0" id="unlinked-copy-text">
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider block font-bold uppercase select-none">Firebase User ID</span>
                  <span className="text-[10px] text-slate-600 truncate font-mono block mt-0.5" title={authUser.id}>{authUser.id}</span>
                </div>
                <button
                  onClick={copyUserIdToClipboard}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 hover:text-white rounded-lg text-[10px] font-mono font-bold text-white flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  id="unlinked-copy-btn"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3 w-3 text-white" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy ID
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              id="unlinked-logout-btn"
            >
              <LogOut className="h-4 w-4 text-indigo-400" /> Log out & Retry
            </button>
          </div>
        </main>

        <footer className="py-6 text-center text-[10px] text-slate-400 font-mono border-t border-slate-100 bg-white" id="unlinked-footer">
          GYMDESK USER PORTAL • AUTH SYNCHRONIZATION SAFEKEEPING
        </footer>
      </div>
    );
  }

  // 4. If not logged in, or explicitly on login screen, present the portal entrance
  if (currentRoute === 'login' || !member) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="login-screen-layout">
        <Header member={null} onLogout={handleLogout} onNavigate={navigateTo} hasNotifications={false} globalMessages={globalMessages} />
        <main className="flex-grow flex items-center justify-center font-sans" id="login-viewport">
          <LoginView 
            onLoginSuccess={() => {
              authService.getCurrentUser().then(user => {
                if (user) {
                  setAuthUser(user);
                  loadMemberProfile(user.uid);
                }
              });
            }} 
            onBypassLogin={(selectedMember) => {
              localStorage.setItem('gymdesk_logged_member_id', selectedMember.id);
              loadBypassedMemberProfile(selectedMember);
            }}
          />
        </main>
        <footer className="py-6 text-center text-[10px] text-slate-400 font-mono border-t border-slate-100 bg-white" id="login-footer">
          GYMDESK USER PORTAL • FIREBASE AUTH & OPERATIONS GATEWAY
        </footer>
      </div>
    );
  }

  // 5. Standard layout for fully logged-in and mapped member
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white" id="app-layout">
      {/* 1. Global Header */}
      <div className="print:hidden">
        <Header 
          member={member} 
          onLogout={handleLogout} 
          onNavigate={navigateTo} 
          onProfileSwitch={loadBypassedMemberProfile} 
          hasNotifications={hasNotifications}
          globalMessages={globalMessages}
        />
      </div>

      {/* 2. Full Content Viewport */}
      <div className="flex-grow flex max-w-7xl w-full mx-auto font-sans print:w-full print:max-w-none print:block" id="app-viewport-inner">
        {/* Persistent Desktop Sidebar */}
        <div className="hidden md:flex print:hidden">
            <Sidebar currentRoute={currentRoute} onNavigate={navigateTo} onLogout={handleLogout} hasPendingPayments={payments.some(p => p.status === 'Pending' || p.status === 'Partial' || p.status === 'Pending_Invoice')} />
        </div>

        {/* Dynamic View Scrollport Container */}
        <main className={`flex-1 overflow-y-auto text-left relative print:overflow-visible print:px-0 print:py-0 ${currentRoute === 'ai-chat' ? 'p-0 pb-[72px] md:pb-0 flex flex-col overflow-hidden' : 'px-4 py-6 md:p-8 pb-24 md:pb-8'}`} id="main-content-scrollport">
          {syncError && (
            <div className="print:hidden p-4 bg-amber-50 border border-amber-100 text-amber-850 rounded-3xl text-xs flex items-center justify-between gap-4 mb-6 font-mono shadow-sm animate-fade-in" id="sync-error-notif">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                <span>{syncError}</span>
              </div>
              <button 
                onClick={() => member && loadMemberProfile(member.id)}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-55 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] tracking-tight font-bold shrink-0 transition-all cursor-pointer"
                id="refresh-sync-btn"
              >
                Sync Page
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <div key={currentRoute} className={currentRoute === 'ai-chat' ? 'flex-1 relative w-full h-full' : ''}>
              {renderCurrentRouteView()}
            </div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. Mobile Navigation Bottom Tab Bar (APK/PWA friendly) */}
      <div className="print:hidden">
        <BottomNav currentRoute={currentRoute} onNavigate={navigateTo} hasPendingPayments={payments.some(p => p.status === 'Pending' || p.status === 'Partial' || p.status === 'Pending_Invoice')} />
      </div>

      {/* 4. Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 w-max max-w-[90vw] font-mono select-none"
            style={{
              backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white'
            }}
          >
            {toast.type === 'success' ? <Check className="h-4.5 w-4.5 shrink-0" /> : <AlertTriangle className="h-4.5 w-4.5 shrink-0" />}
            <span className="text-sm font-bold tracking-tight whitespace-nowrap">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
