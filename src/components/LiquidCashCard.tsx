import React from 'react';
import { Wallet, Landmark, Banknote, ShieldCheck } from 'lucide-react';
import { CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';

interface LiquidCashCardProps {
  bankTotal: number;
  cashTotal: number;
  currency: CurrencyCode;
}

export const LiquidCashCard: React.FC<LiquidCashCardProps> = ({
  bankTotal,
  cashTotal,
  currency
}) => {
  const liquidTotal = bankTotal + cashTotal;

  return (
    <div className="rounded-2xl bg-white text-slate-900 p-6 shadow-xl border border-slate-100 relative overflow-hidden transition-all">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600">
            DAILY OPERATING LIQUIDITY (BANK & CASH)
          </span>
          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Daily Accounts
          </span>
        </div>
        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
          <Wallet className="w-5 h-5 stroke-[2]" />
        </div>
      </div>

      {/* Main Big Amount */}
      <div className="mb-2">
        <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
          {formatCurrency(liquidTotal, currency)}
        </div>
      </div>

      {/* Subtitle breakdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
        <p className="font-semibold">
          Bank Balance: <span className="font-bold text-slate-900">{formatCurrency(bankTotal, currency)}</span> • Cash Reserve: <span className="font-bold text-slate-900">{formatCurrency(cashTotal, currency)}</span>
        </p>
      </div>

      <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Strictly active daily operating accounts — excludes locked FDs, Gold & Assets.</span>
      </p>
    </div>
  );
};

