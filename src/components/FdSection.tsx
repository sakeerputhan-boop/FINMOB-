import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Calendar,
  Percent,
  Sparkles,
  Layers,
  Link,
  Lock,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';

interface FdSectionProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  selectedCountry?: string;
  onAddItem: () => void;
  onEditItem: (item: FinancialItem) => void;
  onDeleteItem: (id: string | FinancialItem) => void;
  onToggleConsolidation?: (item: FinancialItem) => void;
  onBatchSetConsolidation?: (standalone: boolean) => void;
}

export const FdSection: React.FC<FdSectionProps> = ({
  items,
  currency,
  selectedCountry = 'ALL',
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleConsolidation,
  onBatchSetConsolidation
}) => {
  const [fdViewMode, setFdViewMode] = useState<'all' | 'consolidated' | 'standalone'>('all');

  const allFdItems = items.filter(
    (i) =>
      i.type === 'fixed_deposit' &&
      (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
  );

  const consolidatedFds = allFdItems.filter((i) => !i.isStandalone);
  const standaloneFds = allFdItems.filter((i) => Boolean(i.isStandalone));

  const filteredFds =
    fdViewMode === 'all'
      ? allFdItems
      : fdViewMode === 'consolidated'
      ? consolidatedFds
      : standaloneFds;

  const totalFD = allFdItems.reduce((acc, i) => acc + i.amount, 0);
  const totalConsolidated = consolidatedFds.reduce((acc, i) => acc + i.amount, 0);
  const totalStandalone = standaloneFds.reduce((acc, i) => acc + i.amount, 0);

  // Projected maturity calculation
  const totalProjectedMaturity = allFdItems.reduce((acc, i) => {
    if (i.maturityAmount) return acc + i.maturityAmount;
    const rate = i.interestRate || 0;
    // Estimate simple annual yield if 1 year tenure
    return acc + (i.amount * (1 + rate / 100));
  }, 0);

  const handleItemDelete = (fd: FinancialItem) => {
    onDeleteItem(fd);
  };

  return (
    <div className="space-y-4">
      {/* Section Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-900 border border-purple-800/40 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white tracking-wide">
                  FIXED DEPOSITS
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {selectedCountry === 'ALL' ? 'Global Portfolio' : `${selectedCountry} Holdings`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage fixed term deposits with instant toggle between <span className="text-emerald-400 font-semibold">Consolidated (Net Worth)</span> and <span className="text-indigo-300 font-semibold">Stand-Alone (Valuation Only)</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddItem}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Fixed Deposit</span>
            </button>
          </div>
        </div>

        {/* Global Financial Metrics & Mode Split */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Deposit Capital</div>
            <div className="text-lg font-black text-purple-300 font-mono mt-0.5">
              {formatCurrency(totalFD, currency)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {allFdItems.length} Total Term Deposit(s)
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">1. Consolidated (Wealth)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                In Net Worth
              </span>
            </div>
            <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
              {formatCurrency(totalConsolidated, currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {consolidatedFds.length} Deposit(s) included in totals
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-indigo-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">2. Stand-Alone (Valuation Only)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Isolated Yield
              </span>
            </div>
            <div className="text-lg font-black text-indigo-300 font-mono mt-0.5">
              {formatCurrency(totalStandalone, currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {standaloneFds.length} Independent Valuation(s)
            </div>
          </div>
        </div>
      </div>

      {/* View Filter Pill Switcher & Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFdViewMode('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              fdViewMode === 'all'
                ? 'bg-purple-600 text-white font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            All FDs ({allFdItems.length})
          </button>
          <button
            onClick={() => setFdViewMode('consolidated')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${
              fdViewMode === 'consolidated'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Consolidated ({consolidatedFds.length})</span>
          </button>
          <button
            onClick={() => setFdViewMode('standalone')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${
              fdViewMode === 'standalone'
                ? 'bg-indigo-600 text-white font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Stand Alone (Valuation Only) ({standaloneFds.length})</span>
          </button>
        </div>

        {allFdItems.length > 0 && onBatchSetConsolidation && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <button
              onClick={() => onBatchSetConsolidation(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 text-[11px] font-bold transition"
            >
              Consolidate All
            </button>
            <button
              onClick={() => onBatchSetConsolidation(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950/40 text-indigo-400 border border-indigo-800/30 text-[11px] font-bold transition"
            >
              Set All Stand-Alone
            </button>
          </div>
        )}
      </div>

      {/* FD Items List */}
      {filteredFds.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <PiggyBank className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">
            {fdViewMode === 'all'
              ? 'No Fixed Deposits Recorded'
              : fdViewMode === 'consolidated'
              ? 'No Consolidated Fixed Deposits'
              : 'No Stand-Alone Valuation FDs'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {fdViewMode === 'all'
              ? 'Add your bank fixed deposits (FDs) or term reserves here to keep them safely tracked with consolidation controls.'
              : 'Tap on any FD card to switch its consolidation status.'}
          </p>
          <button
            onClick={onAddItem}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold transition shadow-md"
          >
            + Add First Fixed Deposit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredFds.map((fd) => {
            const isStandAlone = Boolean(fd.isStandalone);
            const itemCurr = fd.currency || currency;

            return (
              <div
                key={fd.id}
                className={`rounded-2xl bg-slate-900 border p-4 transition flex flex-col justify-between ${
                  isStandAlone
                    ? 'border-indigo-900/50 hover:border-indigo-700/60 shadow-lg shadow-indigo-950/20'
                    : 'border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {fd.bankName || 'Fixed Deposit'}
                        </span>
                        {fd.country && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {fd.country}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-white mt-1.5">
                        {fd.title}
                      </h3>
                      {fd.interestRate && (
                        <p className="text-xs font-semibold text-purple-400 mt-0.5 flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" /> Yield: {fd.interestRate}% p.a.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(fd)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Edit FD"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleItemDelete(fd)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                        title="Delete FD"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tap-to-Consolidate / Stand-Alone Interactive Switch Pill */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => onToggleConsolidation && onToggleConsolidation(fd)}
                      className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                        isStandAlone
                          ? 'bg-indigo-950/40 hover:bg-indigo-950/70 border-indigo-700/50 text-indigo-300'
                          : 'bg-emerald-950/40 hover:bg-emerald-950/70 border-emerald-700/50 text-emerald-300'
                      }`}
                      title="Tap to toggle between Consolidated (in Net Worth) and Stand-Alone (Valuation Only)"
                    >
                      <div className="flex items-center gap-2">
                        {isStandAlone ? (
                          <Lock className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Link className="w-4 h-4 text-emerald-400" />
                        )}
                        <div className="text-left">
                          <span className="block font-black text-[11px] uppercase tracking-wide">
                            {isStandAlone ? 'Stand Alone (Valuation Only)' : 'Consolidated with Wealth'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal block leading-tight">
                            {isStandAlone
                              ? 'Tap to Consolidate into Net Worth'
                              : 'Tap to make Stand Alone (Valuation Only)'}
                          </span>
                        </div>
                      </div>

                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        isStandAlone
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {isStandAlone ? 'Isolated' : 'Included'}
                      </div>
                    </button>
                  </div>

                  {/* Amount & Maturity Display Box */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Deposit Principal</div>
                      <div className="text-xl font-black text-purple-300 font-mono mt-0.5">
                        {formatCurrency(fd.amount, itemCurr)}
                      </div>
                    </div>
                    {fd.maturityDate && (
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3 text-purple-400" /> Maturity Date
                        </div>
                        <div className="text-xs font-bold text-amber-300 font-mono mt-0.5">
                          {fd.maturityDate}
                        </div>
                      </div>
                    )}
                  </div>

                  {fd.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg mt-2.5 border border-slate-800/50">
                      {fd.notes}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Shield className={`w-3 h-3 ${isStandAlone ? 'text-indigo-400' : 'text-emerald-400'}`} />
                    {isStandAlone ? 'Valuation Only (Locked Reserve)' : 'Counted in Total Net Worth'}
                  </span>
                  <span>Updated {new Date(fd.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
