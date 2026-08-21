import React from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CreditCard,
  Building2,
  Trash2,
  Calendar,
  Layers,
  Repeat,
  Tag
} from 'lucide-react';
import { FinancialItem, Transaction, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';

interface ItemTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FinancialItem | null;
  transactions: Transaction[];
  onDeleteTransaction: (tx: Transaction) => void;
  onOpenNewTransaction: (item: FinancialItem) => void;
}

export const ItemTransactionsModal: React.FC<ItemTransactionsModalProps> = ({
  isOpen,
  onClose,
  item,
  transactions = [],
  onDeleteTransaction,
  onOpenNewTransaction
}) => {
  if (!isOpen || !item) return null;

  const itemTxs = transactions.filter((t) => t.itemId === item.id);
  const curr = item.currency || 'AED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{item.title}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.country || 'Global'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transaction History & Ledger • {itemTxs.length} record(s)
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

        {/* Account Balance Summary Header */}
        <div className="bg-slate-950/40 p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Position</span>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {formatCurrency(item.amount, curr)}
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenNewTransaction(item);
            }}
            className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md transition flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+ New Transaction</span>
          </button>
        </div>

        {/* Transactions List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          {itemTxs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
              <Layers className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-300">No Transactions Recorded Yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Spend, payments, transfers, or cashback redemptions for this account will appear here.
              </p>
            </div>
          ) : (
            itemTxs.map((tx) => {
              const isPositive =
                tx.type === 'receive' ||
                tx.type === 'borrow' ||
                (item.type === 'credit_card' && (tx.type === 'card_payment' || tx.type === 'cashback_reward')) ||
                (item.type === 'emi_loan' && (tx.type === 'loan_emi' || tx.type === 'loan_lump_sum'));

              const isSpend = tx.type === 'spend' || tx.type === 'lend';
              const isReward = tx.type === 'cashback_reward';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl border ${
                        isReward
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : isPositive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {isReward ? (
                        <Sparkles className="w-4 h-4" />
                      ) : isPositive ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">
                          {tx.description || tx.category || 'Transaction'}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tx.category || 'General'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(tx.date).toLocaleDateString()}
                        </span>
                        {tx.sourceAccountTitle && (
                          <span className="text-indigo-400 font-semibold">
                            Via: {tx.sourceAccountTitle}
                          </span>
                        )}
                        {tx.rewardPointsUsed && (
                          <span className="text-amber-400 font-bold">
                            {tx.rewardPointsUsed} Points Redeemed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div
                      className={`text-sm font-black font-mono ${
                        isReward
                          ? 'text-amber-400'
                          : isPositive
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : '-'}{formatCurrency(tx.amount, tx.currency || curr)}
                    </div>
                    <button
                      onClick={() => onDeleteTransaction(tx)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
