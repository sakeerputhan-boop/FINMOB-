import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  FileText,
  CreditCard,
  Building,
  Car,
  Shield,
  FileCheck,
  Share2,
  Sparkles,
  Save,
  Tag
} from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency, COUNTRIES, getCountryByName } from '../utils/currency';
import {
  getLastUsedCategory,
  sortCategoriesWithLastUsedOnTop,
  recordLastUsedCategory
} from '../utils/recentUsage';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: FinancialItem[];
  currency: CurrencyCode;
  selectedCountry: string;
  onSaveReminder: (itemData: Partial<FinancialItem> & { title: string; amount: number; type: 'reminder' }) => void;
  onEditReminder: (item: FinancialItem) => void;
  onDeleteReminder: (item: FinancialItem) => void;
}

const NON_FINANCIAL_CATEGORIES = [
  'Documents & ID',
  'Vehicle & Transport',
  'Insurance & Health',
  'Tenancy & Property',
  'Personal & Family',
  'Other'
];

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  items = [],
  currency,
  selectedCountry,
  onSaveReminder,
  onEditReminder,
  onDeleteReminder
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'financial' | 'non_financial'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Reminder Form State
  const [isNonFinancial, setIsNonFinancial] = useState(false);
  const [title, setTitle] = useState('');
  const sortedCategories = useMemo(() => {
    return sortCategoriesWithLastUsedOnTop(NON_FINANCIAL_CATEGORIES, 'reminder');
  }, []);
  const [reminderCategory, setReminderCategory] = useState<string>(() => {
    return getLastUsedCategory('reminder') || 'Documents & ID';
  });
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [country, setCountry] = useState(selectedCountry && selectedCountry !== 'ALL' ? selectedCountry : 'UAE');
  const [notes, setNotes] = useState('');

  // Extract all reminders
  const reminderItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.type === 'reminder' &&
        (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
    );
  }, [items, selectedCountry]);

  // Filtered
  const filteredReminders = useMemo(() => {
    return reminderItems.filter((item) => {
      if (activeFilter === 'financial') {
        return !item.isNonFinancial && item.amount > 0;
      }
      if (activeFilter === 'non_financial') {
        return item.isNonFinancial || !item.amount || item.amount === 0;
      }
      return true;
    });
  }, [reminderItems, activeFilter]);

  // Days left calculation
  const getDaysRemaining = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveReminder({
      type: 'reminder',
      title: title.trim(),
      isNonFinancial,
      reminderCategory: isNonFinancial ? (reminderCategory as any) : 'Financial',
      amount: isNonFinancial ? 0 : parseFloat(amount) || 0,
      currency,
      country,
      dueDate,
      notes: notes.trim() || undefined,
      isCompleted: false
    });

    // Reset
    setTitle('');
    setAmount('');
    setNotes('');
    setIsAddingNew(false);
  };

  const handleToggleComplete = (item: FinancialItem) => {
    onSaveReminder({
      ...item,
      type: 'reminder',
      title: item.title,
      amount: item.amount,
      isCompleted: !item.isCompleted
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Smart Reminders Manager</h2>
              <p className="text-xs text-slate-400">
                Financial bills, loan EMIs, and non-financial document expiries
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

        {/* Toolbar & Filter Tabs */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({reminderItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('financial')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                activeFilter === 'financial' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Financial Bills</span>
            </button>
            <button
              onClick={() => setActiveFilter('non_financial')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                activeFilter === 'non_financial' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Non-Financial / Expiries</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isAddingNew ? 'Close Form' : '+ Add Reminder'}</span>
          </button>
        </div>

        {/* In-Modal Add Reminder Form */}
        {isAddingNew && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-slate-950/90 border-b border-amber-900/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-black text-amber-300 uppercase">Create New Reminder</span>
              
              {/* Type Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsNonFinancial(false)}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    !isNonFinancial ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  💰 Financial Bill
                </button>
                <button
                  type="button"
                  onClick={() => setIsNonFinancial(true)}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    isNonFinancial ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  📋 Non-Financial / Document
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  {isNonFinancial ? 'Document / Task Title' : 'Bill / EMI Title'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isNonFinancial
                      ? 'e.g. UAE Residence Visa Expiry, Car Mulkiya Renewal'
                      : 'e.g. Credit Card Bill, Loan EMI, Apartment Rent'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              {isNonFinancial ? (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Category Tag</label>
                  <select
                    value={reminderCategory}
                    onChange={(e) => setReminderCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    {sortedCategories.map((cat, idx) => {
                      const isLastUsed = idx === 0 && !!getLastUsedCategory('reminder') && getLastUsedCategory('reminder')?.toLowerCase() === cat.toLowerCase();
                      return (
                        <option key={cat} value={cat}>
                          {isLastUsed ? `⚡ ${cat} (Last Used)` : cat}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Due Amount ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Due / Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Country Location</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[10px] uppercase font-bold text-slate-400">Notes / Action Details</label>
              <input
                type="text"
                placeholder="e.g. Requires vehicle inspection, insurance policy #7812, renew on Tamm / RTA app"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md"
              >
                Save Reminder
              </button>
            </div>
          </form>
        )}

        {/* Reminders List Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredReminders.length === 0 ? (
            <div className="rounded-2xl bg-slate-950 border border-dashed border-slate-800 p-8 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-300">No Reminders Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Schedule financial bill alerts or non-financial document expiries (Passport, Visa, Insurance, Registration).
              </p>
              <button
                onClick={() => setIsAddingNew(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold shadow-md"
              >
                + Add First Reminder
              </button>
            </div>
          ) : (
            filteredReminders.map((item) => {
              const daysLeft = getDaysRemaining(item.dueDate);
              const isOverdue = daysLeft !== null && daysLeft < 0;
              const isDueSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
              const itemCurr = item.currency || currency;
              const flag = item.country ? getCountryByName(item.country).flag : '';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    item.isCompleted
                      ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                      : isOverdue
                      ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700'
                      : isDueSoon
                      ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(item)}
                      className={`p-2 rounded-xl border mt-0.5 transition ${
                        item.isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'
                      }`}
                      title={item.isCompleted ? 'Mark Pending' : 'Mark Completed'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-bold ${
                            item.isCompleted ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </h4>

                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                            item.isNonFinancial || item.amount === 0
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}
                        >
                          {item.isNonFinancial ? item.reminderCategory || 'Non-Financial' : 'Financial Bill'}
                        </span>

                        {flag && <span>{flag}</span>}
                      </div>

                      {/* Due Date & Days badge */}
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Due: {item.dueDate || 'No Date'}</span>
                        </span>

                        {daysLeft !== null && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              isOverdue
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                                : isDueSoon
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isOverdue
                              ? `Overdue by ${Math.abs(daysLeft)} days`
                              : daysLeft === 0
                              ? 'Due Today!'
                              : `${daysLeft} days remaining`}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-400 mt-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800/80">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Amount & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {item.amount && item.amount > 0 ? (
                      <div className="text-sm font-black text-slate-200 font-mono">
                        {formatCurrency(item.amount, itemCurr)}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-cyan-400 uppercase bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/30">
                        Document / Task
                      </span>
                    )}

                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => onEditReminder(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteReminder(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
