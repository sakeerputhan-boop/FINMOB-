import React from 'react';
import { ArrowUpRight, ShieldCheck, Wallet, PiggyBank, Coins, CreditCard } from 'lucide-react';
import { CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';

interface NetWorthCardProps {
  grossWealth: number;
  totalLiabilities: number;
  liquidTotal?: number;
  fdTotal?: number;
  assetTotal?: number;
  currency: CurrencyCode;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({
  grossWealth,
  totalLiabilities,
  liquidTotal = 0,
  fdTotal = 0,
  assetTotal = 0,
  currency
}) => {
  const netWorth = grossWealth - totalLiabilities;

  return (
    <div className="rounded-2xl bg-white text-slate-900 p-6 shadow-xl border border-slate-100 relative overflow-hidden transition-all">
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-600">
          CONSOLIDATED NET WORTH
        </span>
        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
          <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>

      {/* Main Big Amount */}
      <div className="mb-2">
        <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
          {formatCurrency(netWorth, currency)}
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-xs font-semibold text-slate-500 mb-4">
        Gross Wealth ({formatCurrency(grossWealth, currency)}) - Total Liabilities ({formatCurrency(totalLiabilities, currency)})
      </p>

      {/* Explicit Independent Category Breakdown */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* 1. Daily Operating Liquidity */}
        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/80">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-800">
            <Wallet className="w-3 h-3" />
            <span>1. Daily Accounts</span>
          </div>
          <div className="text-sm font-extrabold text-emerald-700 font-mono mt-1">
            {formatCurrency(liquidTotal, currency)}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            Bank & Cash
          </div>
        </div>

        {/* 2. Fixed Deposits */}
        <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100/80">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-purple-800">
            <PiggyBank className="w-3 h-3" />
            <span>2. Fixed Deposits (FD)</span>
          </div>
          <div className="text-sm font-extrabold text-purple-700 font-mono mt-1">
            {formatCurrency(fdTotal, currency)}
          </div>
          <div className="text-[10px] text-purple-600 font-medium mt-0.5">
            Locked Term Reserves
          </div>
        </div>

        {/* 3. Gold & Assets */}
        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100/80">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-800">
            <Coins className="w-3 h-3" />
            <span>3. Gold & Assets</span>
          </div>
          <div className="text-sm font-extrabold text-amber-700 font-mono mt-1">
            {formatCurrency(assetTotal, currency)}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
            Physical Asset Valuation
          </div>
        </div>
      </div>
    </div>
  );
};

