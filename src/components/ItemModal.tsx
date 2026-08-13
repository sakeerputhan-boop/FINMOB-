import React, { useState, useEffect } from 'react';
import { X, Save, Building2, CreditCard, Building, PiggyBank, Coins, Banknote, Bell } from 'lucide-react';
import { FinancialItem, ItemType, AssetCategory, CurrencyCode } from '../types';
import { CURRENCIES } from '../utils/currency';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<FinancialItem> & { title: string; amount: number; type: ItemType }) => void;
  initialItem?: FinancialItem | null;
  defaultType?: ItemType;
  currency: CurrencyCode;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  defaultType = 'bank_account',
  currency
}) => {
  const [type, setType] = useState<ItemType>(defaultType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('Gold & Jewellery');
  const [purityOrUnits, setPurityOrUnits] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setTitle(initialItem.title || '');
      setAmount(initialItem.amount ? initialItem.amount.toString() : '');
      setSubtitle(initialItem.subtitle || '');
      setBankName(initialItem.bankName || '');
      setAccountNumber(initialItem.accountNumber || '');
      setInterestRate(initialItem.interestRate ? initialItem.interestRate.toString() : '');
      setMaturityDate(initialItem.maturityDate || '');
      setAssetCategory(initialItem.assetCategory || 'Gold & Jewellery');
      setPurityOrUnits(initialItem.purityOrUnits || '');
      setPurchasePrice(initialItem.purchasePrice ? initialItem.purchasePrice.toString() : '');
      setCreditLimit(initialItem.creditLimit ? initialItem.creditLimit.toString() : '');
      setDueDate(initialItem.dueDate || '');
      setNotes(initialItem.notes || '');
    } else {
      setType(defaultType);
      setTitle('');
      setAmount('');
      setSubtitle('');
      setBankName('');
      setAccountNumber('');
      setInterestRate('');
      setMaturityDate('');
      setAssetCategory('Gold & Jewellery');
      setPurityOrUnits('');
      setPurchasePrice('');
      setCreditLimit('');
      setDueDate('');
      setNotes('');
    }
  }, [initialItem, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    onSave({
      ...(initialItem ? { id: initialItem.id, createdAt: initialItem.createdAt } : {}),
      type,
      title: title.trim(),
      amount: parseFloat(amount) || 0,
      subtitle: subtitle.trim() || undefined,
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      maturityDate: maturityDate || undefined,
      assetCategory: type === 'asset' ? assetCategory : undefined,
      purityOrUnits: purityOrUnits.trim() || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  const currSymbol = CURRENCIES[currency].symbol;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {initialItem ? 'Edit Item' : 'Add Financial Item'}
              </h2>
              <p className="text-xs text-slate-400">
                Real-time synchronized across all your devices
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Item Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Category Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'bank_account', label: 'Bank Account', icon: Building2 },
                { id: 'credit_card', label: 'Credit Card', icon: CreditCard },
                { id: 'emi_loan', label: 'EMI Loan', icon: Building },
                { id: 'fixed_deposit', label: 'Fixed Deposit', icon: PiggyBank },
                { id: 'asset', label: 'Gold & Asset', icon: Coins },
                { id: 'cash_entry', label: 'Physical Cash', icon: Banknote },
                { id: 'reminder', label: 'Reminder', icon: Bell }
              ].map((t) => {
                const Icon = t.icon;
                const isSel = type === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setType(t.id as ItemType)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition text-left ${
                      isSel
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Name / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={
                  type === 'bank_account' ? 'e.g. HDFC Salary Account' :
                  type === 'asset' ? 'e.g. 24K Gold Locker Bar' :
                  type === 'credit_card' ? 'e.g. ICICI Sapphiro Card' : 'Name of item'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Amount ({currSymbol}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Subtitle / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Subtitle / Subtext
            </label>
            <input
              type="text"
              placeholder="e.g. Primary Emergency Savings or Locker 1"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Specific Fields for Asset */}
          {type === 'asset' && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl space-y-3">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Independent Asset Details (Valuation Only)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Asset Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Gold & Jewellery">Gold & Jewellery</option>
                    <option value="Real Estate / Land">Real Estate / Land</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Precious Metals">Precious Metals</option>
                    <option value="Stocks & Bonds">Stocks & Bonds</option>
                    <option value="Other Asset">Other Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Units / Weight / Purity</label>
                  <input
                    type="text"
                    placeholder="e.g. 50 Grams 24K or 2 Acres"
                    value={purityOrUnits}
                    onChange={(e) => setPurityOrUnits(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Purchase Price / Acquisition Cost ({currSymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Purchase price to compute appreciation"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Specific Fields for Bank / Credit Card / Loan / FD */}
          {(type === 'bank_account' || type === 'credit_card' || type === 'emi_loan' || type === 'fixed_deposit') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC, SBI, ICICI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {type === 'bank_account' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Account Number (Last 4 digits)</label>
                  <input
                    type="text"
                    placeholder="e.g. •••• 8921"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {type === 'credit_card' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Credit Limit ({currSymbol})</label>
                  <input
                    type="number"
                    placeholder="e.g. 300000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {(type === 'fixed_deposit' || type === 'emi_loan') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 7.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {type === 'fixed_deposit' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Maturity Date</label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {type === 'credit_card' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              placeholder="Any details or reminders..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
