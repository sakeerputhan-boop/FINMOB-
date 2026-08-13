import React from 'react';
import { PiggyBank, Plus, Edit2, Trash2, Shield, Calendar, Percent } from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';

interface FdSectionProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  onAddItem: () => void;
  onEditItem: (item: FinancialItem) => void;
  onDeleteItem: (id: string) => void;
}

export const FdSection: React.FC<FdSectionProps> = ({
  items,
  currency,
  onAddItem,
  onEditItem,
  onDeleteItem
}) => {
  const fdItems = items.filter((i) => i.type === 'fixed_deposit');
  const totalFD = fdItems.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4">
      {/* Section Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  FIXED DEPOSITS (INDEPENDENT INVESTMENT)
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Locked Portfolio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Guaranteed yield fixed term deposits — strictly independent from daily operating bank accounts.
              </p>
            </div>
          </div>

          <button
            onClick={onAddItem}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Fixed Deposit</span>
          </button>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total FD Portfolio Capital</div>
            <div className="text-lg font-black text-purple-300 font-mono mt-0.5">
              {formatCurrency(totalFD, currency)}
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Active Term Deposits</div>
            <div className="text-lg font-black text-slate-200 font-mono mt-0.5">
              {fdItems.length} Locked FD Deposit(s)
            </div>
          </div>
        </div>
      </div>

      {/* FD Items List */}
      {fdItems.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <PiggyBank className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No Fixed Deposits Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add your bank fixed deposits (FDs) or term reserves here to keep them safely separated from your daily operating accounts.
          </p>
          <button
            onClick={onAddItem}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold transition border border-purple-500/30"
          >
            + Add First Fixed Deposit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fdItems.map((fd) => (
            <div
              key={fd.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {fd.bankName || 'Term Deposit'}
                    </span>
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
                      onClick={() => onDeleteItem(fd.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                      title="Delete FD"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount display */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Deposit Amount</div>
                    <div className="text-xl font-black text-purple-300 font-mono mt-0.5">
                      {formatCurrency(fd.amount, currency)}
                    </div>
                  </div>
                  {fd.maturityDate && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3 text-purple-400" /> Maturity
                      </div>
                      <div className="text-xs font-bold text-amber-300 font-mono mt-0.5">
                        {fd.maturityDate}
                      </div>
                    </div>
                  )}
                </div>

                {fd.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg mt-3 border border-slate-800/50">
                    {fd.notes}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-400" />
                  Independent Investment (Not daily account)
                </span>
                <span>Updated {new Date(fd.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
