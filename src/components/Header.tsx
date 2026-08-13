import React, { useState } from 'react';
import {
  Wallet,
  Globe,
  Smartphone,
  Share2,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  Download,
  FileText,
  Rocket,
  CheckCircle2,
  Wifi,
  Sparkles
} from 'lucide-react';
import { CurrencyCode, SyncState, UserProfile } from '../types';
import { CURRENCIES } from '../utils/currency';
import finmobLogo from '../assets/images/finmob_app_logo_1786598798207.jpg';

interface HeaderProps {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  user: UserProfile | null;
  syncState: SyncState;
  onOpenAuth: () => void;
  onOpenDeployGuide: () => void;
  onOpenExportModal: () => void;
  deferredInstallPrompt: any;
  onInstallPwa: () => void;
  savedPin: string | null;
  onOpenPinSetup: () => void;
  onLockApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onCurrencyChange,
  user,
  syncState,
  onOpenAuth,
  onOpenDeployGuide,
  onOpenExportModal,
  deferredInstallPrompt,
  onInstallPwa,
  savedPin,
  onOpenPinSetup,
  onLockApp
}) => {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <img
            src={finmobLogo}
            alt="FINMOB App Logo"
            className="h-10 w-10 rounded-xl object-cover border border-indigo-500/40 shadow-lg shadow-indigo-500/20"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                FINMOB
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Daily Operating Accounts, Independent FDs & Gold Assets
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* PIN Lock Security Button */}
          <button
            onClick={savedPin ? onLockApp : onOpenPinSetup}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              savedPin
                ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/80'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={savedPin ? 'Lock App Now (PIN Active)' : 'Set 4-Digit Security PIN'}
          >
            {savedPin ? (
              <>
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline text-[11px]">Lock App</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline text-[11px]">Set PIN</span>
              </>
            )}
          </button>
          
          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 hover:bg-indigo-900/50 text-indigo-300 text-xs font-medium transition"
              title="Select Currency"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currency} {CURRENCIES[currency].symbol}</span>
              <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1 rounded uppercase font-bold tracking-wider">LIVE</span>
            </button>

            {showCurrencyDropdown && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  Select Currency
                </div>
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onCurrencyChange(c);
                      setShowCurrencyDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                      currency === c ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{CURRENCIES[c].name}</span>
                    <span className="font-mono text-slate-400">{CURRENCIES[c].symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sync & Auth Status Badge */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              user && !user.isAnonymous
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
            }`}
            title="Firebase Sync & Account"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                syncState === 'synced' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                syncState === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="hidden md:inline max-w-[120px] truncate">
              {user && !user.isAnonymous ? user.email : 'Multi-Device Sync'}
            </span>
            <span className="md:hidden">
              {user && !user.isAnonymous ? 'Sync On' : 'Login'}
            </span>
          </button>

          {/* Deploy to Vercel/Netlify Guide */}
          <button
            onClick={onOpenDeployGuide}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Deploy to Vercel or Netlify Guide"
          >
            <Rocket className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Export / WhatsApp Statement */}
          <button
            onClick={onOpenExportModal}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="WhatsApp PDF & Export"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
          </button>

          {/* PWA Install Button */}
          {deferredInstallPrompt && (
            <button
              onClick={onInstallPwa}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-md hover:from-indigo-500 hover:to-purple-500 transition animate-pulse"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install PWA</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
