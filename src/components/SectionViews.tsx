import React from 'react';
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
  ArrowUpRight
} from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';

interface ViewProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  onAddItem: () => void;
  onEditItem: (item: FinancialItem) => void;
  onDeleteItem: (id: string) => void;
}

// 1. Bank Accounts View
export const AccountsView: React.FC<ViewProps> = ({ items, currency, onAddItem, onEditItem, onDeleteItem }) => {
  const bankItems = items.filter((i) => i.type === 'bank_account');
  const totalBank = bankItems.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-800/40 p-5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-indigo-400">Total Liquid Bank Balance</span>
            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Daily Operating
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalBank, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{bankItems.length} Daily Operating Bank Account(s)</p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bank</span>
        </button>
      </div>

      <div className="p-3 bg-indigo-950/20 border border-indigo-800/30 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
        <span>📌 <strong>Daily Accounts Only</strong>: Bank accounts listed here are strictly your daily active operating accounts. Fixed Deposits (FDs) are kept independent in the FDs tab.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bankItems.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.bankName || 'Bank'} {item.accountNumber ? `• ${item.accountNumber}` : ''}</p>
                {item.subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-indigo-300 font-mono">
                {formatCurrency(item.amount, currency)}
              </div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <button onClick={() => onEditItem(item)} className="p-1 text-slate-400 hover:text-white">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteItem(item.id)} className="p-1 text-slate-400 hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Physical Cash View
export const CashView: React.FC<ViewProps> = ({ items, currency, onAddItem, onEditItem, onDeleteItem }) => {
  const cashItems = items.filter((i) => i.type === 'cash_entry');
  const totalCash = cashItems.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-800/40 p-5 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase text-emerald-400">Total Physical Cash Reserve</span>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalCash, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Wallet, Vault & Home Reserve</p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cash</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cashItems.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                {item.subtitle && <p className="text-xs text-slate-400">{item.subtitle}</p>}
                {item.notes && <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-emerald-300 font-mono">
                {formatCurrency(item.amount, currency)}
              </div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <button onClick={() => onEditItem(item)} className="p-1 text-slate-400 hover:text-white">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteItem(item.id)} className="p-1 text-slate-400 hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Fixed Deposits View
export const FdsView: React.FC<ViewProps> = ({ items, currency, onAddItem, onEditItem, onDeleteItem }) => {
  const fdItems = items.filter((i) => i.type === 'fixed_deposit');
  const totalFD = fdItems.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-900 border border-purple-800/40 p-5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-purple-400">Total Fixed Deposits (FD)</span>
            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Independent Investment
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalFD, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Guaranteed Fixed Yield Term Portfolio</p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add FD</span>
        </button>
      </div>

      <div className="p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl text-xs text-purple-300 flex items-center justify-between">
        <span>🔒 <strong>Independent Investment</strong>: Fixed Deposits (FDs) are locked investment accounts — tracked separately from your daily active operating bank accounts.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fdItems.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">
                  {item.bankName || 'Bank'} {item.interestRate ? `• ${item.interestRate}% p.a.` : ''}
                </p>
                {item.maturityDate && (
                  <p className="text-[11px] text-purple-300 mt-0.5">Matures: {item.maturityDate}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-purple-300 font-mono">
                {formatCurrency(item.amount, currency)}
              </div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <button onClick={() => onEditItem(item)} className="p-1 text-slate-400 hover:text-white">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteItem(item.id)} className="p-1 text-slate-400 hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Credit Cards View
export const CardsView: React.FC<ViewProps> = ({ items, currency, onAddItem, onEditItem, onDeleteItem }) => {
  const cardItems = items.filter((i) => i.type === 'credit_card');
  const totalCardDue = cardItems.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-800/40 p-5 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase text-cyan-400">Total Credit Card Due Balance</span>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalCardDue, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{cardItems.length} Active Card(s)</p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Card</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cardItems.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">
                  {item.bankName || 'Bank'} {item.creditLimit ? `• Limit: ${formatCurrency(item.creditLimit, currency)}` : ''}
                </p>
                {item.dueDate && <p className="text-[11px] text-amber-400 mt-0.5">Due: {item.dueDate}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-cyan-300 font-mono">
                {formatCurrency(item.amount, currency)}
              </div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <button onClick={() => onEditItem(item)} className="p-1 text-slate-400 hover:text-white">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteItem(item.id)} className="p-1 text-slate-400 hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. EMI Loans View
export const LoansView: React.FC<ViewProps> = ({ items, currency, onAddItem, onEditItem, onDeleteItem }) => {
  const loanItems = items.filter((i) => i.type === 'emi_loan');
  const totalLoan = loanItems.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-900 border border-rose-800/40 p-5 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase text-rose-400">Total Outstanding Loans & EMI</span>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalLoan, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{loanItems.length} Outstanding Loan(s)</p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Loan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loanItems.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">
                  {item.bankName || 'Bank'} {item.interestRate ? `• ${item.interestRate}% p.a.` : ''}
                </p>
                {item.subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-rose-400 font-mono">
                {formatCurrency(item.amount, currency)}
              </div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <button onClick={() => onEditItem(item)} className="p-1 text-slate-400 hover:text-white">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteItem(item.id)} className="p-1 text-slate-400 hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 6. Reminders View
export const RemindersView: React.FC<ViewProps> = ({ items, currency, onAddItem, onEditItem, onDeleteItem }) => {
  const reminderItems = items.filter((i) => i.type === 'reminder');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border border-amber-800/40 p-5 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase text-amber-400">Bill & Maturity Reminders</span>
          <h2 className="text-lg font-black text-white mt-0.5">Upcoming Financial Schedules</h2>
          <p className="text-xs text-slate-400 mt-0.5">Never miss a credit card or loan EMI deadline</p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Reminder</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reminderItems.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
            <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-300">No Custom Reminders Added</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Click "Add Reminder" to schedule payment alerts.</p>
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
                  {formatCurrency(item.amount, currency)}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <button onClick={() => onEditItem(item)} className="p-1 text-slate-400 hover:text-white">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeleteItem(item.id)} className="p-1 text-slate-400 hover:text-rose-400">
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
