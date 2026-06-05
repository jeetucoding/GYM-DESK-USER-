import { 
  Home, 
  User, 
  Award, 
  Calendar, 
  CreditCard, 
  Wallet, 
  MessageSquare, 
  LogOut,
  ChevronRight,
  Bot
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  hasPendingPayments?: boolean;
}

export default function Sidebar({ currentRoute, onNavigate, onLogout, hasPendingPayments }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'User Dashboard', icon: Home, desc: 'Overview of your gym stats & keys' },
    { id: 'ai-chat', label: 'AI Health Coach', icon: Bot, desc: 'Ask about diet & workouts' },
    { id: 'profile', label: 'My Profile', icon: User, desc: 'Manage your contact & info' },
    { id: 'plan', label: 'My Membership Plan', icon: Award, desc: 'Current pass & limits' },
    { id: 'attendance', label: 'Attendance logs', icon: Calendar, desc: 'Monthly history & streaks' },
    { id: 'payments', label: 'Payment Receipts', icon: CreditCard, desc: 'Receipts & paid dues' },
    { id: 'pay-now', label: 'Submit Payment', icon: Wallet, desc: 'Declare bank/cash receipts' },
    { id: 'support', label: 'Help & Support', icon: MessageSquare, desc: 'Request advice/complain' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 min-h-[calc(100vh-4rem)] p-6 shrink-0" id="desktop-sidebar">
      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5" id="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left focus:outline-none group relative ${
                isActive 
                  ? 'bg-orange-50 text-orange-600 font-medium' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
              id={`sidebar-item-${item.id}`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {item.id === 'payments' && hasPendingPayments && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0" id={`sidebar-text-${item.id}`}>
                <p className="text-sm font-sans block leading-none font-medium">{item.label}</p>
                <span className="text-[10px] text-gray-400 truncate block mt-0.5 font-mono">{item.desc}</span>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 transition-all ${isActive ? 'text-orange-500 opacity-100 translate-x-0' : 'text-gray-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Logout */}
      <div className="pt-4 border-t border-gray-100" id="sidebar-footer">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150 text-left"
          id="sidebar-logout-btn"
        >
          <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium">Log out</p>
            <span className="text-[10px] text-gray-400 font-mono">Sign out of active session</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
