import { Home, Calendar, CreditCard, User, ShieldAlert, Award, MessageSquare, Bot } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  hasPendingPayments?: boolean;
}

export default function BottomNav({ currentRoute, onNavigate, hasPendingPayments }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'ai-chat', label: 'Coach', icon: Bot },
    { id: 'plan', label: 'Plan', icon: Award },
    { id: 'attendance', label: 'Attend', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-xl z-40 pb-safe" id="mobile-bottom-nav">
      <div className="flex justify-between items-center h-16 px-2" id="mobile-nav-flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRoute === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 focus:outline-none transition-all duration-150 relative ${
                isActive ? 'text-orange-500 font-medium' : 'text-gray-400 hover:text-gray-600'
              }`}
              id={`nav-tab-${tab.id}`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab.id === 'payments' && hasPendingPayments && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight truncate max-w-full font-mono">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
