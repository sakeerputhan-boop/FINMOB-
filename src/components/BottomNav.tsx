import React from 'react';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Building,
  Coins,
  Banknote,
  Gift
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'accounts'
  | 'cards'
  | 'loans'
  | 'assets'
  | 'cash'
  | 'gifts';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs: { id: TabType; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Building2 },
    { id: 'cards', label: 'Cards', icon: CreditCard },
    { id: 'loans', label: 'Loans', icon: Building },
    { id: 'assets', label: 'ASSET', icon: Coins },
    { id: 'gifts', label: 'Gift & IOU', icon: Gift }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-800/80 px-1 py-1.5 transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-around gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 min-w-[48px] ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 font-black border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-400' : ''}`} />
              <span className={`text-[10px] mt-1 tracking-tight truncate ${isActive ? 'font-black text-indigo-300' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
