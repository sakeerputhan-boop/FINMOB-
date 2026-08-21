import React, { useMemo } from 'react';
import {
  Wallet,
  Globe,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Share2,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Plus,
  Bell,
  Sparkles,
  Tag,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { CurrencyCode, UserProfile, SyncState, FinancialItem } from '../types';
import { COUNTRIES, CURRENCIES, getCountryByName } from '../utils/currency';

interface HeaderProps {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  items: FinancialItem[];
  remindersCount: number;
  upcomingDueCount: number;
  onOpenReminders: () => void;
  onOpenUpcomingAlerts: () => void;
  onOpenAppSettings: () => void;
  user: UserProfile | null;
  syncState: SyncState;
  onOpenAuth: () => void;
  onOpenDeployGuide: () => void;
  onOpenExportModal: () => void;
  deferredInstallPrompt: any;
  onInstallPwa: () => void;
  savedPin: string | null;
  onLockApp: () => void;
  onQuickAddItem: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onCurrencyChange,
  selectedCountry,
  onCountryChange,
  items = [],
  remindersCount = 0,
  upcomingDueCount = 0,
  onOpenReminders,
  onOpenUpcomingAlerts,
  onOpenAppSettings,
  user,
  syncState,
  onOpenAuth,
  onOpenDeployGuide,
  onOpenExportModal,
  deferredInstallPrompt,
  onInstallPwa,
  savedPin,
  onLockApp,
  onQuickAddItem
}) => {
  // Only show countries where the user holds accounts/items (or default UAE + India if empty)
  const holdingCountryNames = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.country && i.country.trim() && i.country.toUpperCase() !== 'ALL') {
        set.add(i.country.trim());
      }
    });
    if (set.size === 0) {
      set.add('UAE');
      set.add('India');
    }
    return Array.from(set);
  }, [items]);

  const activeHoldingCountries = useMemo(() => {
    return holdingCountryNames.map((name) => getCountryByName(name));
  }, [holdingCountryNames]);

  // When switching country, automatically sync currency to that country's currency!
  const handleSelectCountry = (countryName: string) => {
    onCountryChange(countryName);
    if (countryName !== 'ALL') {
      const matched = getCountryByName(countryName);
      if (matched && matched.currency) {
        onCurrencyChange(matched.currency);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-2.5">
        
        {/* Top Row: App Brand, Alerts, Reminders, Quick Add, Security, Sync, Auth */}
        <div className="flex items-center justify-between gap-3">
          
          {/* HD Logo & Brand: MYFIN */}
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0">
              <img
                src="/icon.svg"
                alt="MYFIN Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white tracking-tight">MYFIN</h1>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Global
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Multi-Country Financial Hub</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            
            {/* Unified Smart Reminders & 7-Day Due Alerts Bell Icon */}
            <button
              onClick={() => {
                if (upcomingDueCount > 0) {
                  onOpenUpcomingAlerts();
                } else {
                  onOpenReminders();
                }
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition text-xs font-bold active:scale-95 shadow-sm ${
                upcomingDueCount > 0
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 animate-pulse shadow-rose-500/10'
                  : remindersCount > 0
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 shadow-amber-500/10'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Smart Reminders, Bill Expiries & Upcoming Dues"
            >
              <Bell className={`w-4 h-4 ${upcomingDueCount > 0 ? 'text-rose-400' : remindersCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Reminders</span>
              {(upcomingDueCount > 0 || remindersCount > 0) && (
                <span
                  className={`font-black text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center text-white ${
                    upcomingDueCount > 0 ? 'bg-rose-500' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {upcomingDueCount > 0 ? upcomingDueCount : remindersCount}
                </span>
              )}
            </button>

            {/* Consolidated App Settings Button */}
            <button
              onClick={onOpenAppSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 transition text-xs font-bold active:scale-95 shadow-sm"
              title="App Settings (Categories, PIN, Currency, Holding Countries)"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* In-header Add Button */}
            <button
              onClick={onQuickAddItem}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add</span>
            </button>

            {/* Export WhatsApp PDF */}
            <button
              onClick={onOpenExportModal}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Export WhatsApp Statement & PDF"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
            </button>

            {/* PIN Security button */}
            {savedPin && (
              <button
                onClick={onLockApp}
                className="p-2 rounded-xl bg-amber-950/30 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40 transition"
                title="Lock App with PIN"
              >
                <Lock className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* Cloud Sync Status / Auth */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                syncState === 'synced'
                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                  : syncState === 'syncing'
                  ? 'bg-indigo-950/30 text-indigo-300 border-indigo-800/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Cloud Synchronization & Account"
            >
              {syncState === 'synced' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Synced</span>
                </>
              ) : syncState === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span className="hidden sm:inline">Syncing</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </button>

            {/* Install PWA Prompt */}
            {deferredInstallPrompt && (
              <button
                onClick={onInstallPwa}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}

          </div>

        </div>

        {/* Bottom Row: Only Show Account Holding Countries & Auto Sync Currency */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Holding Countries:
            </span>

            {/* Global / All Option */}
            <button
              onClick={() => handleSelectCountry('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap text-xs border ${
                selectedCountry === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              🌐 Global (All)
            </button>

            {/* ONLY Show Account Holding Countries */}
            {activeHoldingCountries.map((c) => {
              const isSelected = selectedCountry.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.code}
                  onClick={() => handleSelectCountry(c.name)}
                  className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap text-xs border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-extrabold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-indigo-200 font-mono' : 'text-slate-500'}`}>
                    ({c.currency})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Display Currency Conversion Picker */}
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
              title="Display Currency"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol.trim()})
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>
    </header>
  );
};

