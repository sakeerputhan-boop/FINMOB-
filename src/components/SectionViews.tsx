import React, { useState } from 'react';
import {
  Building2,
  Banknote,
  PiggyBank,
  CreditCard,
  Building,
  Bell,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Calendar,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Sparkles,
  History,
  Gift,
  Layers
} from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency, formatItemAmount, calculateEmi } from '../utils/currency';
import {
  sortCardsWithLastUsedOnTop,
  getLastUsedCardId,
  sortItemsWithLastUsedOnTop,
  getLastUsedItemId
} from '../utils/recentUsage';

interface ViewProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  selectedCountry: string; // 'ALL' or specific country like 'UAE', 'India'
  onAddItem: (type?: any) => void;
  onEditItem: (item: FinancialItem) => void;
  onDeleteItem: (item: FinancialItem) => void;
  onOpenSpendPayment: (item: FinancialItem, defaultAction?: string) => void;
  onOpenTransactions: (item: FinancialItem) => void;
}

// 1. Bank Accounts & Physical Cash View (Operating Accounts & Cash Ledgers)
export const AccountsView: React.FC<ViewProps> = ({
  items = [],
  currency,
  selectedCountry,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenSpendPayment,
  onOpenTransactions
}) => {
  const [accountSubTab, setAccountSubTab] = useState<'all' | 'bank' | 'cash'>('all');

  const rawBankItems = items.filter(
    (i) =>
      i.type === 'bank_account' &&
      (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
  );
  const rawCashItems = items.filter(
    (i) =>
      i.type === 'cash_entry' &&
      (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
  );

  const bankItems = sortItemsWithLastUsedOnTop(rawBankItems, 'bank_account');
  const cashItems = sortItemsWithLastUsedOnTop(rawCashItems, 'cash_entry');
  const lastUsedBankId = getLastUsedItemId('bank_account');
  const lastUsedCashId = getLastUsedItemId('cash_entry');

  const totalBank = bankItems.reduce((acc, i) => acc + i.amount, 0);
  const totalCash = cashItems.reduce((acc, i) => acc + i.amount, 0);
  const totalCombined = totalBank + totalCash;

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-800/40 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-indigo-400">
              {accountSubTab === 'bank'
                ? 'Total Operating Bank Balance'
                : accountSubTab === 'cash'
                ? 'Total Physical Cash Reserves'
                : 'Total Liquid Funds (Bank + Cash)'}
            </span>
            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {selectedCountry === 'ALL' ? 'Multi-National Liquid' : `${selectedCountry} Liquid`}
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(
              accountSubTab === 'bank' ? totalBank : accountSubTab === 'cash' ? totalCash : totalCombined,
              currency
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-indigo-300 font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Banks: {formatCurrency(totalBank, currency)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-300 font-semibold">
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash: {formatCurrency(totalCash, currency)}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => onAddItem('bank_account')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Bank</span>
          </button>
          <button
            onClick={() => onAddItem('cash_entry')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cash</span>
          </button>
        </div>
      </div>

      {/* Sub-Section Filter Switcher */}
      <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => setAccountSubTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              accountSubTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Liquid ({bankItems.length + cashItems.length})</span>
          </button>

          <button
            onClick={() => setAccountSubTab('bank')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              accountSubTab === 'bank'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Accounts ({bankItems.length})</span>
          </button>

          <button
            onClick={() => setAccountSubTab('cash')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              accountSubTab === 'cash'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Cash & Wallets ({cashItems.length})</span>
          </button>
        </div>
      </div>

      {/* 1. Bank Accounts Section */}
      {(accountSubTab === 'all' || accountSubTab === 'bank') && (
        <div className="space-y-3">
          {accountSubTab === 'all' && (
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Operating Bank Accounts</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {formatCurrency(totalBank, currency)}
              </span>
            </div>
          )}

          {bankItems.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-6 text-center text-slate-400">
              <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-300">No Bank Accounts in this View</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 mb-3">
                Add your bank accounts to track balances, record expenses, and receive transfers.
              </p>
              <button
                onClick={() => onAddItem('bank_account')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold transition shadow-md"
              >
                + Add Bank Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {bankItems.map((item, idx) => {
                const itemCurr = item.currency || currency;
                const isLastUsed = (lastUsedBankId && item.id === lastUsedBankId) || (idx === 0 && !!item.lastUsedAt);

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-slate-900 border transition flex flex-col justify-between ${
                      isLastUsed ? 'border-indigo-600/50 shadow-md shadow-indigo-950/40' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-white">{item.title}</h3>
                              {isLastUsed && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Last Used</span>
                                </span>
                              )}
                              {item.country && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {item.country}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {item.bankName || 'Bank'} {item.accountNumber ? `• ${item.accountNumber}` : ''}
                            </p>
                            {item.subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Edit Account"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Balance Display */}
                      <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Available Operating Balance</div>
                          <div className="text-xl font-black text-indigo-300 font-mono mt-0.5">
                            {formatCurrency(item.amount, itemCurr)}
                          </div>
                        </div>
                        <button
                          onClick={() => onOpenTransactions(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-800 transition"
                        >
                          <History className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Ledger</span>
                        </button>
                      </div>
                    </div>

                    {/* Direct Action Buttons: Spend, Deposit, Transfer */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => onOpenSpendPayment(item, 'spend')}
                        className="py-1.5 px-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 text-xs font-bold border border-rose-800/40 flex items-center justify-center gap-1 transition"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                        <span>Spend</span>
                      </button>
                      <button
                        onClick={() => onOpenSpendPayment(item, 'deposit')}
                        className="py-1.5 px-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-300 hover:text-emerald-200 text-xs font-bold border border-emerald-800/40 flex items-center justify-center gap-1 transition"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Deposit</span>
                      </button>
                      <button
                        onClick={() => onOpenSpendPayment(item, 'transfer')}
                        className="py-1.5 px-2 rounded-xl bg-indigo-950/30 hover:bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 text-xs font-bold border border-indigo-800/40 flex items-center justify-center gap-1 transition"
                      >
                        <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Transfer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Physical Cash & Wallets Section */}
      {(accountSubTab === 'all' || accountSubTab === 'cash') && (
        <div className="space-y-3 pt-2">
          {accountSubTab === 'all' && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" />
                <span>Physical Cash, Wallets & Vaults</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {formatCurrency(totalCash, currency)}
              </span>
            </div>
          )}

          {cashItems.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-6 text-center text-slate-400">
              <Banknote className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-300">No Physical Cash Records</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 mb-3">
                Track physical cash in your wallet, home vault, or office safe.
              </p>
              <button
                onClick={() => onAddItem('cash_entry')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold transition shadow-md"
              >
                + Add Cash Reserve
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {cashItems.map((item) => {
                const itemCurr = item.currency || currency;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Banknote className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white">{item.title}</h3>
                              {item.country && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {item.country}
                                </span>
                              )}
                            </div>
                            {item.cashLocation && (
                              <p className="text-xs text-slate-400">Location: {item.cashLocation}</p>
                            )}
                            {item.notes && <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Available Cash Notes</div>
                          <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">
                            {formatCurrency(item.amount, itemCurr)}
                          </div>
                        </div>
                        <button
                          onClick={() => onOpenTransactions(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-800 transition"
                        >
                          <History className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ledger</span>
                        </button>
                      </div>
                    </div>

                    {/* Direct Action Buttons: Spend, Receive, ATM Withdrawal */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => onOpenSpendPayment(item, 'spend')}
                        className="py-1.5 px-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-bold border border-rose-800/40 flex items-center justify-center gap-1 transition"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                        <span>Spend</span>
                      </button>
                      <button
                        onClick={() => onOpenSpendPayment(item, 'deposit')}
                        className="py-1.5 px-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-300 text-xs font-bold border border-emerald-800/40 flex items-center justify-center gap-1 transition"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Receive</span>
                      </button>
                      <button
                        onClick={() => onOpenSpendPayment(item, 'atm_withdrawal')}
                        className="py-1.5 px-2 rounded-xl bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 text-xs font-bold border border-amber-800/40 flex items-center justify-center gap-1 transition"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>ATM In</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 2. Physical Cash View (Spend, Receive, ATM Withdrawal, Borrow/Lend)
export const CashView: React.FC<ViewProps> = ({
  items = [],
  currency,
  selectedCountry,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenSpendPayment,
  onOpenTransactions
}) => {
  const rawCashItems = items.filter(
    (i) =>
      i.type === 'cash_entry' &&
      (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
  );
  const cashItems = sortItemsWithLastUsedOnTop(rawCashItems, 'cash_entry');
  const lastUsedCashId = getLastUsedItemId('cash_entry');
  const totalCash = cashItems.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-800/40 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-emerald-400">Total Physical Cash Reserve</span>
            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Liquid Notes
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalCash, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Wallet, Vault, Safe & Cash in Hand</p>
        </div>
        <button
          onClick={() => onAddItem('cash_entry')}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Cash Reserve</span>
        </button>
      </div>

      {cashItems.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <Banknote className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No Physical Cash Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Record physical cash in your wallet, home vault, or office safe to track ATM withdrawals and daily cash expenses.
          </p>
          <button
            onClick={() => onAddItem('cash_entry')}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition shadow-md"
          >
            + Add Cash Reserve
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {cashItems.map((item, idx) => {
            const itemCurr = item.currency || currency;
            const isLastUsed = (lastUsedCashId && item.id === lastUsedCashId) || (idx === 0 && !!item.lastUsedAt);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-slate-900 border transition flex flex-col justify-between ${
                  isLastUsed ? 'border-emerald-600/50 shadow-md shadow-emerald-950/40' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{item.title}</h3>
                          {isLastUsed && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Last Used</span>
                            </span>
                          )}
                          {item.country && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {item.country}
                            </span>
                          )}
                        </div>
                        {item.cashLocation && (
                          <p className="text-xs text-slate-400">Location: {item.cashLocation}</p>
                        )}
                        {item.notes && <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Available Cash Notes</div>
                      <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">
                        {formatCurrency(item.amount, itemCurr)}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenTransactions(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-800 transition"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ledger</span>
                    </button>
                  </div>
                </div>

                {/* Direct Action Buttons: Spend, Receive, ATM Withdrawal, Borrow/Lend */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => onOpenSpendPayment(item, 'spend')}
                    className="py-1.5 px-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-bold border border-rose-800/40 flex items-center justify-center gap-1 transition"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>Spend</span>
                  </button>
                  <button
                    onClick={() => onOpenSpendPayment(item, 'deposit')}
                    className="py-1.5 px-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-300 text-xs font-bold border border-emerald-800/40 flex items-center justify-center gap-1 transition"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Receive</span>
                  </button>
                  <button
                    onClick={() => onOpenSpendPayment(item, 'atm_withdrawal')}
                    className="py-1.5 px-2 rounded-xl bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 text-xs font-bold border border-amber-800/40 flex items-center justify-center gap-1 transition"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>ATM In</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 3. Credit Cards View (Limit, Due, Available, Cashback Rewards Redemption, Spend & Pay)
export const CardsView: React.FC<ViewProps> = ({
  items = [],
  currency,
  selectedCountry,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenSpendPayment,
  onOpenTransactions
}) => {
  const rawCardItems = items.filter(
    (i) =>
      i.type === 'credit_card' &&
      (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
  );
  const cardItems = sortCardsWithLastUsedOnTop(rawCardItems);
  const lastUsedCardId = getLastUsedCardId();

  const totalCardDue = cardItems.reduce((acc, i) => acc + i.amount, 0);
  const totalLimit = cardItems.reduce((acc, i) => acc + (i.creditLimit || 0), 0);
  const totalAvailable = Math.max(0, totalLimit - totalCardDue);
  const totalRewards = cardItems.reduce((acc, i) => acc + (i.cashbackRewardPoints || 0), 0);

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-800/40 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-cyan-400">Total Credit Card Outstanding</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {cardItems.length} Active Card(s)
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {formatCurrency(totalCardDue, currency)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Total Limit: {formatCurrency(totalLimit, currency)} • Available: {formatCurrency(totalAvailable, currency)}
            </p>
          </div>
          <button
            onClick={() => onAddItem('credit_card')}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Credit Card</span>
          </button>
        </div>

        {totalRewards > 0 && (
          <div className="mt-4 pt-3 border-t border-cyan-900/40 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Total Cashback & Rewards Points:
            </span>
            <span className="font-black text-amber-400 font-mono text-sm">
              {totalRewards.toLocaleString()} Points Available
            </span>
          </div>
        )}
      </div>

      {cardItems.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <CreditCard className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No Credit Cards Added</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add your UAE or India credit cards to track due bills, credit limits, cashback points, and make payments with bank or rewards.
          </p>
          <button
            onClick={() => onAddItem('credit_card')}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold transition shadow-md"
          >
            + Add First Credit Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {cardItems.map((item, idx) => {
            const itemCurr = item.currency || currency;
            const limit = item.creditLimit || 0;
            const due = item.amount || 0;
            const available = Math.max(0, limit - due);
            const utilRate = limit > 0 ? (due / limit) * 100 : 0;
            const isLastUsed = (lastUsedCardId && item.id === lastUsedCardId) || (idx === 0 && !!item.lastUsedAt);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-slate-900 border transition flex flex-col justify-between ${
                  isLastUsed ? 'border-cyan-500/60 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{item.title}</h3>
                          {isLastUsed && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-sm">
                              <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                              <span>Last Used Card</span>
                            </span>
                          )}
                          {item.country && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {item.country}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {item.bankName || 'Bank'} {limit > 0 ? `• Limit: ${formatCurrency(limit, itemCurr)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Due & Available Metrics */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Outstanding Due</div>
                        <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
                          {formatCurrency(due, itemCurr)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Available Credit</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                          {formatCurrency(available, itemCurr)}
                        </div>
                      </div>
                    </div>

                    {/* Utilization Bar */}
                    {limit > 0 && (
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            utilRate > 75
                              ? 'bg-rose-500'
                              : utilRate > 40
                              ? 'bg-amber-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, utilRate)}%` }}
                        />
                      </div>
                    )}

                    {/* Rewards & Due Date row */}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                      {item.dueDate ? (
                        <span className="text-amber-300 font-medium">Due: {item.dueDate}</span>
                      ) : (
                        <span>No due date set</span>
                      )}
                      {item.cashbackRewardPoints && item.cashbackRewardPoints > 0 ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Gift className="w-3 h-3" /> {item.cashbackRewardPoints} Rewards pts
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons: Pay Card Bill, Spend/Charge, Ledger */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => onOpenSpendPayment(item, 'card_payment')}
                    className="py-1.5 px-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-extrabold text-xs border border-cyan-700/50 flex items-center justify-center gap-1 transition shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pay Bill</span>
                  </button>
                  <button
                    onClick={() => onOpenSpendPayment(item, 'spend')}
                    className="py-1.5 px-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-bold border border-rose-800/40 flex items-center justify-center gap-1 transition"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>Charge</span>
                  </button>
                  <button
                    onClick={() => onOpenTransactions(item)}
                    className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ledger</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 4. Loans View (EMI loans vs Lump Sum Non-EMI Loans with details & repayment options)
export const LoansView: React.FC<ViewProps> = ({
  items = [],
  currency,
  selectedCountry,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenSpendPayment,
  onOpenTransactions
}) => {
  const rawLoanItems = items.filter(
    (i) =>
      i.type === 'emi_loan' &&
      (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
  );
  const loanItems = sortItemsWithLastUsedOnTop(rawLoanItems, 'emi_loan');
  const lastUsedLoanId = getLastUsedItemId('emi_loan');

  const totalLoan = loanItems.reduce((acc, i) => acc + i.amount, 0);
  const emiLoans = loanItems.filter((i) => (i.loanType || 'emi') === 'emi');
  const lumpSumLoans = loanItems.filter((i) => i.loanType === 'lump_sum');
  const totalMonthlyEmi = emiLoans.reduce((acc, i) => acc + (i.monthlyEmi || 0), 0);

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-900 border border-rose-800/40 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-rose-400">Total Outstanding Debt & Liabilities</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {loanItems.length} Active Loan(s)
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {formatCurrency(totalLoan, currency)}
            </div>
            {totalMonthlyEmi > 0 && (
              <p className="text-xs text-rose-300/90 mt-0.5">
                Total Monthly EMI Liability: <strong>{formatCurrency(totalMonthlyEmi, currency)}/mo</strong>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddItem('emi_loan')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Loan (EMI / Lump sum)</span>
            </button>
          </div>
        </div>
      </div>

      {loanItems.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <Building className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No Loans Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add your Home loans, Car loans, Personal loans (EMI), or Lump-sum bullet borrowing to track principal and payments.
          </p>
          <button
            onClick={() => onAddItem('emi_loan')}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold transition shadow-md"
          >
            + Add First Loan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {loanItems.map((item, idx) => {
            const isEmi = (item.loanType || 'emi') === 'emi';
            const itemCurr = item.currency || currency;
            const isLastUsed = (lastUsedLoanId && item.id === lastUsedLoanId) || (idx === 0 && !!item.lastUsedAt);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-slate-900 border transition flex flex-col justify-between ${
                  isLastUsed ? 'border-rose-600/50 shadow-md shadow-rose-950/40' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{item.title}</h3>
                          {isLastUsed && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Last Active</span>
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                              isEmi
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {isEmi ? 'EMI-Based' : 'Lump Sum (Non-EMI)'}
                          </span>
                          {isEmi && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {item.interestCalculationType === 'flat' ? 'Flat Interest' : 'Diminishing Rate'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {item.bankName || item.lenderName || 'Lender'} {item.interestRate !== undefined ? `• ${item.interestRate}% p.a.` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Loan Metrics Display */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Remaining Outstanding</div>
                        <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
                          {formatCurrency(item.amount, itemCurr)}
                        </div>
                      </div>
                      {isEmi && item.monthlyEmi && (
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Monthly EMI</div>
                          <div className="text-sm font-black text-indigo-300 font-mono mt-0.5">
                            {formatCurrency(item.monthlyEmi, itemCurr)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* EMI tenor or repayment date */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80 text-slate-400 flex-wrap gap-1">
                      {isEmi ? (
                        <>
                          <span>
                            Tenor: {item.remainingMonths || 0} / {item.totalMonths || item.remainingMonths || 0} months left
                          </span>
                          {item.emiDueDay && (
                            <span className="text-amber-300">Due Day: {item.emiDueDay}th of month</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span>Lump Sum Repayment</span>
                          {item.dueDate && (
                            <span className="text-amber-300">Target Date: {item.dueDate}</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Total interest & payable if recorded */}
                    {isEmi && (item.totalInterestPayable || item.totalPayableAmount) && (
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60 text-slate-400 font-mono">
                        {item.totalInterestPayable && (
                          <span>Total Interest: <strong className="text-amber-300">{formatCurrency(item.totalInterestPayable, itemCurr)}</strong></span>
                        )}
                        {item.totalPayableAmount && (
                          <span>Total Payable: <strong className="text-slate-200">{formatCurrency(item.totalPayableAmount, itemCurr)}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons: Pay Monthly EMI, Lump Sum Repay, Ledger */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                  {isEmi ? (
                    <button
                      onClick={() => onOpenSpendPayment(item, 'loan_emi')}
                      className="py-1.5 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-extrabold text-xs border border-rose-700/50 flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Pay Monthly EMI</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenSpendPayment(item, 'loan_lump_sum')}
                      className="py-1.5 px-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-extrabold text-xs border border-amber-700/50 flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Make Repayment</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenTransactions(item)}
                    className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Loan Ledger</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 5. Reminders View
export const RemindersView: React.FC<ViewProps> = ({
  items,
  currency,
  selectedCountry,
  onAddItem,
  onEditItem,
  onDeleteItem
}) => {
  const reminderItems = items.filter(
    (i) =>
      i.type === 'reminder' &&
      (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border border-amber-800/40 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-amber-400">Bill & Maturity Reminders</span>
          <h2 className="text-lg font-black text-white mt-0.5">Upcoming Financial Deadlines</h2>
          <p className="text-xs text-slate-400 mt-0.5">Never miss a credit card bill or loan EMI installment</p>
        </div>
        <button
          onClick={() => onAddItem('reminder')}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Add Reminder</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reminderItems.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
            <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-300">No Custom Reminders Scheduled</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Click "+ Add Reminder" to schedule customized alerts.</p>
          </div>
        ) : (
          reminderItems.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  {item.dueDate && <p className="text-xs text-amber-300">Due Date: {item.dueDate}</p>}
                  {item.notes && <p className="text-[11px] text-slate-400 mt-0.5">{item.notes}</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-slate-200 font-mono">
                  {formatCurrency(item.amount, item.currency || currency)}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <button onClick={() => onEditItem(item)} className="p-1 text-slate-400 hover:text-white">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeleteItem(item)} className="p-1 text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
