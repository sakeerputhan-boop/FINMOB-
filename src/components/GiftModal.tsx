import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Gift,
  Heart,
  Calendar,
  Sparkles,
  Tag,
  User,
  MapPin,
  FileText,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Receipt
} from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { COUNTRIES, CURRENCIES, getCountryByName } from '../utils/currency';

export type EntryMode = 'gift' | 'iou';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (giftData: Partial<FinancialItem> & { title: string; amount: number; type: FinancialItem['type'] }) => void;
  initialItem?: FinancialItem | null;
  defaultDirection?: 'received' | 'given' | 'borrow' | 'lend';
  currency: CurrencyCode;
  selectedCountry?: string;
}

const COMMON_OCCASIONS = [
  'Wedding',
  'Eid / Ramadan',
  'Birthday',
  'Housewarming / Gruhapravesam',
  'Anniversary',
  'Baby Shower / Newborn',
  'Graduation',
  'Festival / Diwali / Christmas',
  'Corporate / Business',
  'Return Gift',
  'Other Occasion'
];

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  defaultDirection = 'received',
  currency,
  selectedCountry
}) => {
  const [entryMode, setEntryMode] = useState<EntryMode>(
    defaultDirection === 'borrow' || defaultDirection === 'lend' ? 'iou' : 'gift'
  );

  // Gift fields
  const [giftDirection, setGiftDirection] = useState<'received' | 'given'>(
    defaultDirection === 'given' ? 'given' : 'received'
  );
  const [occasion, setOccasion] = useState('Wedding');
  const [customOccasion, setCustomOccasion] = useState('');
  const [giftDescription, setGiftDescription] = useState('');
  const [returnGiftStatus, setReturnGiftStatus] = useState<'not_applicable' | 'pending_return' | 'returned'>('not_applicable');

  // IOU fields (Borrow vs Lend)
  const [iouType, setIouType] = useState<'borrow' | 'lend'>(
    defaultDirection === 'borrow' ? 'borrow' : 'lend'
  );
  const [iouStatus, setIouStatus] = useState<'pending' | 'partially_settled' | 'settled'>('pending');
  const [settledAmount, setSettledAmount] = useState('');

  // Shared fields
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [itemCurrency, setItemCurrency] = useState<CurrencyCode>(currency || 'AED');
  const [country, setCountry] = useState('UAE');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialItem) {
      if (initialItem.type === 'iou') {
        setEntryMode('iou');
        setIouType(initialItem.iouType || 'borrow');
        setIouStatus(initialItem.iouStatus || 'pending');
        setSettledAmount(initialItem.settledAmount ? initialItem.settledAmount.toString() : '');
        setPersonName(initialItem.person || initialItem.personName || initialItem.title || '');
      } else {
        setEntryMode('gift');
        setGiftDirection(initialItem.giftDirection || 'received');
        setPersonName(initialItem.personName || initialItem.person || initialItem.title || '');
        const occ = initialItem.occasion || 'Wedding';
        if (COMMON_OCCASIONS.includes(occ)) {
          setOccasion(occ);
          setCustomOccasion('');
        } else {
          setOccasion('Other Occasion');
          setCustomOccasion(occ);
        }
        setGiftDescription(initialItem.giftDescription || initialItem.subtitle || '');
        setReturnGiftStatus(initialItem.returnGiftStatus || 'not_applicable');
      }

      setAmount(initialItem.amount !== undefined ? initialItem.amount.toString() : '');
      setItemCurrency(initialItem.currency || currency || 'AED');
      setCountry(initialItem.country || 'UAE');
      setDate(initialItem.dueDate || (initialItem.createdAt ? initialItem.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]));
      setNotes(initialItem.notes || '');
    } else {
      const isIou = defaultDirection === 'borrow' || defaultDirection === 'lend';
      setEntryMode(isIou ? 'iou' : 'gift');
      setGiftDirection(defaultDirection === 'given' ? 'given' : 'received');
      setIouType(defaultDirection === 'borrow' ? 'borrow' : 'lend');
      setIouStatus('pending');
      setSettledAmount('');
      setPersonName('');
      setOccasion('Wedding');
      setCustomOccasion('');
      setGiftDescription('');
      setAmount('');
      const initCountry = selectedCountry && selectedCountry !== 'ALL' ? selectedCountry : 'UAE';
      setCountry(initCountry);
      const matched = getCountryByName(initCountry);
      setItemCurrency(matched.currency || currency || 'AED');
      setDate(new Date().toISOString().split('T')[0]);
      setReturnGiftStatus('not_applicable');
      setNotes('');
    }
  }, [initialItem, defaultDirection, selectedCountry, currency, isOpen]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const found = COUNTRIES.find((c) => c.name === newCountry);
    if (found) {
      setItemCurrency(found.currency);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;

    const numAmount = parseFloat(amount) || 0;

    if (entryMode === 'iou') {
      const isBorrow = iouType === 'borrow';
      const titleText = `${isBorrow ? 'Borrowed from' : 'Lent to'} ${personName.trim()}`;
      const numSettled = parseFloat(settledAmount) || 0;

      onSave({
        ...(initialItem ? { id: initialItem.id, createdAt: initialItem.createdAt } : {}),
        type: 'iou',
        title: titleText,
        person: personName.trim(),
        personName: personName.trim(),
        iouType,
        iouStatus,
        settledAmount: numSettled,
        amount: numAmount,
        currency: itemCurrency,
        country,
        dueDate: date,
        subtitle: isBorrow ? `I owe ${personName.trim()}` : `${personName.trim()} owes me`,
        notes: notes.trim() || undefined
      });
    } else {
      // Gift mode
      const finalOccasion = occasion === 'Other Occasion' && customOccasion.trim()
        ? customOccasion.trim()
        : occasion;

      const titleText = `${giftDirection === 'received' ? 'Gift from' : 'Gift to'} ${personName.trim()} (${finalOccasion})`;

      onSave({
        ...(initialItem ? { id: initialItem.id, createdAt: initialItem.createdAt } : {}),
        type: 'gift',
        title: titleText,
        personName: personName.trim(),
        person: personName.trim(),
        occasion: finalOccasion,
        giftDescription: giftDescription.trim() || undefined,
        giftDirection,
        amount: numAmount,
        currency: itemCurrency,
        country,
        dueDate: date,
        returnGiftStatus,
        subtitle: giftDescription.trim() || finalOccasion,
        notes: notes.trim() || undefined
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {entryMode === 'gift' ? <Gift className="w-5 h-5" /> : <HandCoins className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {initialItem
                  ? `Edit ${entryMode === 'gift' ? 'Gift Record' : 'IOU Record'}`
                  : `New ${entryMode === 'gift' ? 'Gift' : 'IOU (Borrow / Lend)'} Entry`}
              </h2>
              <p className="text-xs text-slate-400">
                Gift & IOU registry with tracking & reminders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entry Mode Switcher: Gift vs IOU */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEntryMode('gift')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              entryMode === 'gift'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>🎁 Gift Record</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryMode('iou')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              entryMode === 'iou'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>🤝 IOU (Borrow / Lend)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* GIFT MODE: Received vs Given */}
          {entryMode === 'gift' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Gift Type / Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGiftDirection('received')}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                    giftDirection === 'received'
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span>🎁 Received (In)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGiftDirection('given')}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                    giftDirection === 'given'
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Heart className="w-4 h-4 text-purple-400" />
                  <span>💝 Given (Out)</span>
                </button>
              </div>
            </div>
          )}

          {/* IOU MODE: Borrow vs Lend */}
          {entryMode === 'iou' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">IOU Type (Borrow or Lend)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIouType('borrow')}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                    iouType === 'borrow'
                      ? 'bg-rose-600/30 text-rose-300 border-rose-500 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                  <span>📥 Borrowed (I Owe Money)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIouType('lend')}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                    iouType === 'lend'
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span>📤 Lent (They Owe Me)</span>
                </button>
              </div>
            </div>
          )}

          {/* Person Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">
              {entryMode === 'iou'
                ? iouType === 'borrow'
                  ? 'Borrowed From (Lender Person)'
                  : 'Lent To (Borrower Person)'
                : giftDirection === 'received'
                ? 'Received From (Person / Family)'
                : 'Given To (Person / Couple / Family)'}{' '}
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Faisal Khan, Dr. Rajesh, Sister Fatima"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs focus:border-indigo-500 outline-none"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Gift Specific Occasion & Item description */}
          {entryMode === 'gift' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Occasion / Event</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-indigo-500 outline-none"
                >
                  {COMMON_OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
                {occasion === 'Other Occasion' && (
                  <input
                    type="text"
                    placeholder="Specify occasion..."
                    value={customOccasion}
                    onChange={(e) => setCustomOccasion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none mt-1.5"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Gift Item Description</label>
                <input
                  type="text"
                  placeholder="e.g. Gold Coin 8g 24K, Cash in Envelope, Smart Watch, Silver Thali"
                  value={giftDescription}
                  onChange={(e) => setGiftDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-indigo-500 outline-none"
                />
              </div>
            </>
          )}

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                {entryMode === 'iou' ? 'Loan / IOU Amount' : 'Estimated Value / Amount'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required={entryMode === 'iou'}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Currency</label>
              <select
                value={itemCurrency}
                onChange={(e) => setItemCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 outline-none"
              >
                {Object.values(CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol.trim()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* IOU Settlement Status & Amount */}
          {entryMode === 'iou' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Settlement Status</label>
                <select
                  value={iouStatus}
                  onChange={(e) => setIouStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                >
                  <option value="pending">⏳ Pending (Unpaid)</option>
                  <option value="partially_settled">🟡 Partially Paid</option>
                  <option value="settled">✅ Fully Settled (Paid Off)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Already Settled / Repaid Amount</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={settledAmount}
                  onChange={(e) => setSettledAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Country & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Country</label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                {entryMode === 'iou' ? 'Due / Target Date' : 'Date Received / Given'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Return Gift Status (for Gift mode) */}
          {entryMode === 'gift' && giftDirection === 'received' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Return Gift Tracking</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'not_applicable', label: 'Not Required' },
                  { id: 'pending_return', label: 'Need to Return' },
                  { id: 'returned', label: 'Gift Returned' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setReturnGiftStatus(st.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition ${
                      returnGiftStatus === st.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">Notes / Remarks / Purpose</label>
            <input
              type="text"
              placeholder="e.g. For emergency car repair, wedding reception Dubai, personal loan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`py-2.5 px-5 rounded-xl font-extrabold text-white shadow-lg transition text-xs flex items-center gap-1.5 ${
                entryMode === 'iou'
                  ? iouType === 'borrow'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : giftDirection === 'received'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{initialItem ? 'Update Record' : entryMode === 'iou' ? 'Save IOU Entry' : 'Save Gift Record'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
