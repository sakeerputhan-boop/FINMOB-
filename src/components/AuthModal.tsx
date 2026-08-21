import React from 'react';
import {
  X,
  LogOut,
  Smartphone,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  User as UserIcon,
  Mail,
  RefreshCw,
  Zap
} from 'lucide-react';
import { UserProfile, SyncState } from '../types';
import { signOut, auth } from '../lib/firebase';
import { SignIn } from './SignIn';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  syncState: SyncState;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  syncState
}) => {
  if (!isOpen) return null;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-auto">
        
        {/* If user is actively authenticated with real account */}
        {user && !user.isAnonymous ? (
          <div className="p-5 sm:p-6 space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/40 shadow-lg flex items-center justify-center">
                  <img
                    src="/icon.svg"
                    alt="MYFIN Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-1.5">
                    <span>MYFIN Account</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Cloud Sync
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Multi-Device Realtime Backup</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Active Card */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Real-Time Cloud Sync Active</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-emerald-900/60 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-700/50">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Live</span>
                </div>
              </div>
              <p className="text-sm font-black text-white truncate">{user.email || user.displayName || 'Authenticated User'}</p>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span>UID:</span>
                <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 text-slate-300 truncate max-w-[240px]">
                  {user.uid}
                </span>
              </div>
            </div>

            {/* Multi Device Info */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span>Multi-Device Synchronization:</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                You can sign into this same email address (<strong className="text-white">{user.email}</strong>) on your smartphone, tablet, or desktop. All net worth updates, card transactions, and reminders synchronize automatically.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 text-xs font-bold transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition text-center"
              >
                Done
              </button>
            </div>

          </div>
        ) : (
          /* Render full mobile-first SignIn experience inside the modal */
          <div className="max-h-[90vh] overflow-y-auto no-scrollbar">
            <SignIn
              isModal={true}
              onClose={onClose}
              onSuccess={onClose}
            />
          </div>
        )}

      </div>
    </div>
  );
};
