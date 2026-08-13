import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  X,
  Check,
  AlertCircle,
  Delete,
  RotateCcw,
  Sparkles,
  Smartphone
} from 'lucide-react';
import finmobLogo from '../assets/images/finmob_app_logo_1786598798207.jpg';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPin: string | null;
  onSavePin: (pin: string | null) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isOpen,
  onClose,
  savedPin,
  onSavePin
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm' | 'current'>('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setError('');
      setSuccess('');
      if (savedPin) {
        setStep('current');
      } else {
        setStep('create');
      }
    }
  }, [isOpen, savedPin]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    setError('');
    if (step === 'current' || step === 'create') {
      if (pin.length < 4) {
        const next = pin + num;
        setPin(next);
        if (next.length === 4) {
          if (step === 'current') {
            if (next === savedPin) {
              // Verified current PIN
              setPin('');
              setStep('create');
            } else {
              setError('Incorrect current PIN');
              setPin('');
            }
          } else if (step === 'create') {
            setStep('confirm');
          }
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 4) {
        const next = confirmPin + num;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            onSavePin(next);
            setSuccess('PIN Security Enabled Successfully!');
            setTimeout(() => {
              onClose();
            }, 1200);
          } else {
            setError('PINs do not match. Try again.');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleDisablePin = () => {
    onSavePin(null);
    setSuccess('PIN Security Disabled.');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const activeValue = step === 'confirm' ? confirmPin : pin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <img
              src={finmobLogo}
              alt="FINMOB Logo"
              className="w-9 h-9 rounded-xl object-cover border border-indigo-500/30 shadow-md"
            />
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>PIN Security Setup</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Protect your financial data with a 4-digit PIN code.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-5">
          {success ? (
            <div className="py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-sm font-extrabold text-emerald-300">{success}</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  {step === 'current'
                    ? 'Enter Current PIN'
                    : step === 'create'
                    ? 'Set 4-Digit Security PIN'
                    : 'Confirm Your 4-Digit PIN'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {step === 'current'
                    ? 'Enter your existing PIN to change settings'
                    : step === 'create'
                    ? 'Choose a memorable 4-digit passcode'
                    : 'Re-enter your 4-digit PIN to confirm'}
                </p>
              </div>

              {/* Dots Display */}
              <div className="flex items-center justify-center gap-3 my-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                      activeValue.length > idx
                        ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/40'
                        : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-mono text-lg font-bold border border-slate-800 hover:border-indigo-500/40 transition active:scale-95 shadow-sm"
                  >
                    {num}
                  </button>
                ))}
                <div className="flex items-center justify-center">
                  {savedPin && (
                    <button
                      type="button"
                      onClick={handleDisablePin}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline"
                      title="Disable PIN Security"
                    >
                      Turn Off
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-mono text-lg font-bold border border-slate-800 hover:border-indigo-500/40 transition active:scale-95 shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition active:scale-95"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface PinLockScreenProps {
  isLocked: boolean;
  savedPin: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  isLocked,
  savedPin,
  onUnlock
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 4) {
      const next = pin + num;
      setPin(next);
      if (next.length === 4) {
        if (next === savedPin) {
          setPin('');
          onUnlock();
        } else {
          setError(true);
          setPin('');
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#0B0F19] text-white animate-in fade-in duration-300">
      
      <div className="w-full max-w-sm text-center space-y-6">
        
        {/* FINMOB App Logo & Header */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <img
              src={finmobLogo}
              alt="FINMOB App Logo"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/30"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-indigo-600 text-white shadow-md">
              <Lock className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white">FINMOB</h1>
            <p className="text-xs text-indigo-300/80 font-medium mt-0.5">
              App Locked — Enter 4-Digit Security PIN
            </p>
          </div>
        </div>

        {/* PIN Input Dots */}
        <div className="flex items-center justify-center gap-4 my-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-indigo-500 border-indigo-400 scale-125 shadow-lg shadow-indigo-500/50'
                  : error
                  ? 'bg-rose-500 border-rose-400 animate-shake'
                  : 'bg-slate-900 border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-400 animate-bounce">
            Incorrect PIN code. Please try again.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-mono text-xl font-bold border border-slate-800 hover:border-indigo-500/50 transition active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          <div className="flex items-center justify-center">
            {/* Blank or Biometric visual */}
            <Smartphone className="w-5 h-5 text-slate-600" />
          </div>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-mono text-xl font-bold border border-slate-800 hover:border-indigo-500/50 transition active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 pt-4">
          Protected with FINMOB Encrypted Storage
        </p>

      </div>
    </div>
  );
};
