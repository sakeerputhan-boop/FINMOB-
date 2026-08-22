import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building2,
  CreditCard,
  Building,
  PiggyBank,
  Coins,
  Banknote,
  Bell,
  Sparkles,
  Calculator,
  Calendar,
  Percent,
  Layers,
  Gift,
  Heart,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import {
  FinancialItem,
  ItemType,
  AssetCategory,
  CurrencyCode,
  LoanType
} from '../types';
import { COUNTRIES, CURRENCIES, calculateEmi, calculateLoanBreakdown, formatCurrency } from '../utils/currency';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<FinancialItem> & { title: string; amount: number; type: ItemType }) => void;
  initialItem?: FinancialItem | null;
  defaultType?: ItemType;
  currency: CurrencyCode;
  selectedCountry?: string;
}

const NON_FINANCIAL_CATEGORIES = [
  'Documents & ID',
  'Vehicle & Transport',
  'Insurance & Health',
  'Tenancy & Property',
  'Personal & Family',
  'Other'
];

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

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  defaultType = 'bank_account',
  currency,
  selectedCountry
}) => {
  const [type, setType] = useState<ItemType>(defaultType);
  const [country, setCountry] = useState<string>('UAE');
  const [itemCurrency, setItemCurrency] = useState<CurrencyCode>('AED');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // FD & Investment
  const [interestRate, setInterestRate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [maturityAmount, setMaturityAmount] = useState('');
  const [isStandalone, setIsStandalone] = useState(false);

  // Asset / Gold
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('Gold & Jewellery');
  const [purityOrUnits, setPurityOrUnits] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  // Credit Card
  const [creditLimit, setCreditLimit] = useState('');
  const [cashbackRewardPoints, setCashbackRewardPoints] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [minimumDue, setMinimumDue] = useState('');

  // Loan (EMI vs Lump Sum)
  const [loanType, setLoanType] = useState<LoanType>('emi');
  const [interestCalcType, setInterestCalcType] = useState<'flat' | 'diminishing'>('diminishing');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [remainingMonths, setRemainingMonths] = useState('');
  const [emiDueDay, setEmiDueDay] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [totalInterestPayable, setTotalInterestPayable] = useState('');
  const [totalPayableAmount, setTotalPayableAmount] = useState('');

  // Cash
  const [cashLocation, setCashLocation] = useState('');

  // Reminder (Financial vs Non-Financial)
  const [isNonFinancial, setIsNonFinancial] = useState(false);
  const [reminderCategory, setReminderCategory] = useState('Documents & ID');

  // Gift details
  const [giftDirection, setGiftDirection] = useState<'received' | 'given'>('received');
  const [personName, setPersonName] = useState('');
  const [occasion, setOccasion] = useState('Wedding');
  const [giftDescription, setGiftDescription] = useState('');
  const [returnGiftStatus, setReturnGiftStatus] = useState<'not_applicable' | 'pending_return' | 'returned'>('not_applicable');

  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setCountry(initialItem.country || 'UAE');
      setItemCurrency(initialItem.currency || 'AED');
      setTitle(initialItem.title || '');
      setAmount(initialItem.amount !== undefined ? initialItem.amount.toString() : '');
      setSubtitle(initialItem.subtitle || '');
      setBankName(initialItem.bankName || '');
      setAccountNumber(initialItem.accountNumber || '');
      setInterestRate(initialItem.interestRate ? initialItem.interestRate.toString() : '');
      setMaturityDate(initialItem.maturityDate || '');
      setMaturityAmount(initialItem.maturityAmount ? initialItem.maturityAmount.toString() : '');
      setIsStandalone(Boolean(initialItem.isStandalone));
      setAssetCategory(initialItem.assetCategory || 'Gold & Jewellery');
      setPurityOrUnits(initialItem.purityOrUnits || '');
      setPurchasePrice(initialItem.purchasePrice ? initialItem.purchasePrice.toString() : '');
      setCreditLimit(initialItem.creditLimit ? initialItem.creditLimit.toString() : '');
      setCashbackRewardPoints(initialItem.cashbackRewardPoints ? initialItem.cashbackRewardPoints.toString() : '');
      setDueDate(initialItem.dueDate || '');
      setMinimumDue(initialItem.minimumDue ? initialItem.minimumDue.toString() : '');
      setLoanType(initialItem.loanType || 'emi');
      setInterestCalcType(initialItem.interestCalculationType || 'diminishing');
      setPrincipalAmount(initialItem.principalAmount ? initialItem.principalAmount.toString() : (initialItem.amount ? initialItem.amount.toString() : ''));
      setMonthlyEmi(initialItem.monthlyEmi ? initialItem.monthlyEmi.toString() : '');
      setTotalMonths(initialItem.totalMonths ? initialItem.totalMonths.toString() : '');
      setRemainingMonths(initialItem.remainingMonths ? initialItem.remainingMonths.toString() : '');
      setEmiDueDay(initialItem.emiDueDay ? initialItem.emiDueDay.toString() : '');
      setLenderName(initialItem.lenderName || '');
      setTotalInterestPayable(initialItem.totalInterestPayable ? initialItem.totalInterestPayable.toString() : '');
      setTotalPayableAmount(initialItem.totalPayableAmount ? initialItem.totalPayableAmount.toString() : '');
      setCashLocation(initialItem.cashLocation || '');
      setIsNonFinancial(Boolean(initialItem.isNonFinancial));
      setReminderCategory(initialItem.reminderCategory || 'Documents & ID');
      setGiftDirection(initialItem.giftDirection || 'received');
      setPersonName(initialItem.personName || '');
      setOccasion(initialItem.occasion || 'Wedding');
      setGiftDescription(initialItem.giftDescription || '');
      setReturnGiftStatus(initialItem.returnGiftStatus || 'not_applicable');
      setNotes(initialItem.notes || '');
    } else {
      setType(defaultType);
      const initialCountry = selectedCountry && selectedCountry !== 'ALL' ? selectedCountry : 'UAE';
      setCountry(initialCountry);
      const foundCountry = COUNTRIES.find((c) => c.name.toLowerCase() === initialCountry.toLowerCase());
      setItemCurrency(foundCountry ? foundCountry.currency : currency || 'AED');
      setTitle('');
      setAmount('');
      setSubtitle('');
      setBankName('');
      setAccountNumber('');
      setInterestRate('');
      setMaturityDate('');
      setMaturityAmount('');
      setIsStandalone(false);
      setAssetCategory('Gold & Jewellery');
      setPurityOrUnits('');
      setPurchasePrice('');
      setCreditLimit('');
      setCashbackRewardPoints('');
      setDueDate('');
      setMinimumDue('');
      setLoanType('emi');
      setPrincipalAmount('');
      setMonthlyEmi('');
      setTotalMonths('');
      setRemainingMonths('');
      setEmiDueDay('');
      setLenderName('');
      setCashLocation('');
      setIsNonFinancial(false);
      setReminderCategory('Documents & ID');
      setGiftDirection('received');
      setPersonName('');
      setOccasion('Wedding');
      setGiftDescription('');
      setReturnGiftStatus('not_applicable');
      setNotes('');
    }
  }, [initialItem, defaultType, selectedCountry, isOpen]);

  // Sync Currency when Country changes
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const found = COUNTRIES.find((c) => c.name === newCountry);
    if (found) {
      setItemCurrency(found.currency);
    }
  };

  // Auto-calculate Loan Breakdown (Flat vs Diminishing)
  const handleAutoCalculateEmi = () => {
    const p = parseFloat(principalAmount || amount);
    const r = parseFloat(interestRate || '0');
    const n = parseInt(totalMonths || remainingMonths || '12', 10);
    if (p && n) {
      const result = calculateLoanBreakdown(p, r, n, interestCalcType);
      setMonthlyEmi(result.monthlyEmi.toString());
      setTotalInterestPayable(result.totalInterest.toString());
      setTotalPayableAmount(result.totalPayable.toString());
      if (!amount || amount === '0') {
        setAmount(p.toString());
      }
    }
  };

  // Live Loan Calculation helper
  const liveLoanBreakdown = React.useMemo(() => {
    if (type !== 'emi_loan') return null;
    const p = parseFloat(principalAmount || amount);
    const r = parseFloat(interestRate || '0');
    const n = parseInt(totalMonths || remainingMonths || '12', 10);
    if (p > 0 && n > 0) {
      return calculateLoanBreakdown(p, r, n, interestCalcType);
    }
    return null;
  }, [type, principalAmount, amount, interestRate, totalMonths, remainingMonths, interestCalcType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !personName.trim()) return;

    const finalTitle = title.trim() || (type === 'gift' ? `${giftDirection === 'received' ? 'Gift from' : 'Gift to'} ${personName.trim()}` : 'Record');
    let numAmount = (type === 'reminder' && isNonFinancial) ? 0 : parseFloat(amount) || 0;
    
    // For loans: ensure amount defaults to principalAmount if amount was 0 or omitted
    if (type === 'emi_loan' && numAmount === 0 && principalAmount) {
      numAmount = parseFloat(principalAmount) || 0;
    }

    onSave({
      ...(initialItem ? { id: initialItem.id, createdAt: initialItem.createdAt } : {}),
      type,
      title: finalTitle,
      amount: numAmount,
      country,
      currency: itemCurrency,
      subtitle: subtitle.trim() || giftDescription.trim() || undefined,
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      maturityDate: maturityDate || undefined,
      maturityAmount: maturityAmount ? parseFloat(maturityAmount) : undefined,
      isStandalone: type === 'fixed_deposit' ? isStandalone : undefined,
      assetCategory: type === 'asset' ? assetCategory : undefined,
      purityOrUnits: purityOrUnits.trim() || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      cashbackRewardPoints: cashbackRewardPoints ? parseFloat(cashbackRewardPoints) : undefined,
      dueDate: dueDate || undefined,
      minimumDue: minimumDue ? parseFloat(minimumDue) : undefined,
      loanType: type === 'emi_loan' ? loanType : undefined,
      interestCalculationType: type === 'emi_loan' ? interestCalcType : undefined,
      principalAmount: principalAmount ? parseFloat(principalAmount) : (type === 'emi_loan' ? numAmount : undefined),
      monthlyEmi: monthlyEmi ? parseFloat(monthlyEmi) : undefined,
      totalMonths: totalMonths ? parseInt(totalMonths, 10) : undefined,
      remainingMonths: remainingMonths ? parseInt(remainingMonths, 10) : undefined,
      emiDueDay: emiDueDay ? parseInt(emiDueDay, 10) : undefined,
      lenderName: lenderName.trim() || undefined,
      totalInterestPayable: totalInterestPayable ? parseFloat(totalInterestPayable) : undefined,
      totalPayableAmount: totalPayableAmount ? parseFloat(totalPayableAmount) : undefined,
      cashLocation: cashLocation.trim() || undefined,
      isNonFinancial: type === 'reminder' ? isNonFinancial : undefined,
      reminderCategory: type === 'reminder' ? (isNonFinancial ? (reminderCategory as any) : 'Financial') : undefined,
      giftDirection: type === 'gift' ? giftDirection : undefined,
      personName: type === 'gift' ? personName.trim() : undefined,
      occasion: type === 'gift' ? occasion : undefined,
      giftDescription: type === 'gift' ? giftDescription.trim() : undefined,
      returnGiftStatus: type === 'gift' ? returnGiftStatus : undefined,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {initialItem ? 'Edit Financial Record' : 'Add Financial Item'}
              </h2>
              <p className="text-xs text-slate-400">
                Multi-country financial tracker • Synced to Cloud
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Item Category Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">Record Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'bank_account', label: 'Bank', icon: Building2 },
                { id: 'credit_card', label: 'Credit Card', icon: CreditCard },
                { id: 'emi_loan', label: 'Loan', icon: Building },
                { id: 'fixed_deposit', label: 'FD Deposit', icon: PiggyBank },
                { id: 'asset', label: 'Gold / Asset', icon: Coins },
                { id: 'cash_entry', label: 'Cash Wallet', icon: Banknote },
                { id: 'reminder', label: 'Reminder', icon: Bell },
                { id: 'gift', label: 'Gift Record', icon: Gift }
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as ItemType)}
                    className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition border text-center ${
                      isSelected
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-[10px] leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country & Currency Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Country Location</label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Operating Currency</label>
              <select
                value={itemCurrency}
                onChange={(e) => setItemCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 outline-none"
              >
                {Object.values(CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name} ({curr.symbol.trim()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* REMINDER SPECIFIC: Financial vs Non-Financial Toggle */}
          {type === 'reminder' && (
            <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-amber-400">Reminder Type</label>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsNonFinancial(false)}
                    className={`px-2.5 py-0.5 rounded-md font-bold transition ${
                      !isNonFinancial ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    💰 Financial Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNonFinancial(true)}
                    className={`px-2.5 py-0.5 rounded-md font-bold transition ${
                      isNonFinancial ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    📋 Non-Financial / Document
                  </button>
                </div>
              </div>

              {isNonFinancial && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Document / Expiry Category</label>
                  <select
                    value={reminderCategory}
                    onChange={(e) => setReminderCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    {NON_FINANCIAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Due / Expiry Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* GIFT SPECIFIC: Direction, Person Name, Occasion */}
          {type === 'gift' && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-900/40 space-y-3">
              <label className="text-[10px] font-bold uppercase text-purple-400">Gift Registry Details</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGiftDirection('received')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                    giftDirection === 'received'
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>🎁 Gift Received</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGiftDirection('given')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                    giftDirection === 'given'
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>💝 Gift Given</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  {giftDirection === 'received' ? 'Received From (Person / Family)' : 'Given To (Person / Couple)'} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uncle Rashid, Dr. Rajesh, Faisal & Aisha"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Occasion / Event</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  >
                    {COMMON_OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Gift Item Description</label>
                <input
                  type="text"
                  placeholder="e.g. Gold Coin 8g 24K, 1000 AED Cash Envelope, Smart Watch"
                  value={giftDescription}
                  onChange={(e) => setGiftDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Title / Name (when not gift) */}
          {type !== 'gift' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                {type === 'reminder' ? 'Reminder / Document Title' : 'Title / Account Name'}{' '}
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={
                  type === 'bank_account'
                    ? 'e.g. Emirates NBD Current, HDFC Salary'
                    : type === 'credit_card'
                    ? 'e.g. ADCB TouchPoints, HDFC Regalia'
                    : type === 'emi_loan'
                    ? 'e.g. Home Loan, Car Loan'
                    : type === 'fixed_deposit'
                    ? 'e.g. SBI Term Deposit'
                    : type === 'asset'
                    ? 'e.g. 24K Gold Bar, 1200 Sq Ft Land'
                    : type === 'reminder'
                    ? isNonFinancial
                      ? 'e.g. UAE Residence Visa Expiry, Car Mulkiya'
                      : 'e.g. Credit Card Bill, Apartment Rent'
                    : 'e.g. Wallet Pocket Cash'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Amount / Balance (Optional when non-financial reminder or gift) */}
          {(!isNonFinancial || type !== 'reminder') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                {type === 'bank_account' || type === 'cash_entry'
                  ? `Current Available Balance (${itemCurrency})`
                  : type === 'credit_card'
                  ? `Current Due Balance (${itemCurrency})`
                  : type === 'emi_loan'
                  ? `Remaining Outstanding Principal (${itemCurrency})`
                  : type === 'fixed_deposit'
                  ? `Deposit Principal Amount (${itemCurrency})`
                  : type === 'asset'
                  ? `Current Market Valuation (${itemCurrency})`
                  : type === 'gift'
                  ? `Estimated Value / Cash Amount (${itemCurrency}) (Optional)`
                  : `Bill Amount Due (${itemCurrency})`}{' '}
                {type !== 'gift' && <span className="text-rose-400">*</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required={type !== 'gift'}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-14 py-3 text-lg font-black text-white font-mono focus:border-indigo-500 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs font-mono">
                  {itemCurrency}
                </span>
              </div>
            </div>
          )}

          {/* LOAN SPECIFIC: EMI vs Lump Sum (Non-EMI) options */}
          {type === 'emi_loan' && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-rose-400">Loan Repayment Structure</label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoanType('emi')}
                  className={`py-2 px-3 rounded-xl font-bold text-center border transition ${
                    loanType === 'emi'
                      ? 'bg-rose-600/30 text-rose-300 border-rose-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Regular Monthly EMI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoanType('lump_sum')}
                  className={`py-2 px-3 rounded-xl font-bold text-center border transition ${
                    loanType === 'lump_sum'
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Lump Sum (Non-EMI)</span>
                </button>
              </div>

              {loanType === 'emi' ? (
                <>
                  {/* Flat Interest vs Diminishing / Reducing Interest Selector */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-indigo-300">
                        Interest Calculation Model
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {interestCalcType === 'diminishing' ? 'Reducing Balance' : 'Flat Principal Rate'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInterestCalcType('diminishing')}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          interestCalcType === 'diminishing'
                            ? 'bg-indigo-600/25 border-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>Diminishing Rate</span>
                          {interestCalcType === 'diminishing' && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          Reducing balance (interest decreases over time)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInterestCalcType('flat')}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          interestCalcType === 'flat'
                            ? 'bg-indigo-600/25 border-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>Flat Interest</span>
                          {interestCalcType === 'flat' && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          Fixed % on total original principal
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Loan Parameters */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Principal / Outstanding ({itemCurrency})
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={principalAmount || amount}
                        onChange={(e) => {
                          setPrincipalAmount(e.target.value);
                          setAmount(e.target.value);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Interest Rate (% p.a.)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5.5"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Total Tenure (Mo)</label>
                      <input
                        type="number"
                        placeholder="e.g. 36"
                        value={totalMonths}
                        onChange={(e) => {
                          setTotalMonths(e.target.value);
                          if (!remainingMonths) setRemainingMonths(e.target.value);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Remaining (Mo)</label>
                      <input
                        type="number"
                        placeholder="e.g. 24"
                        value={remainingMonths}
                        onChange={(e) => setRemainingMonths(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Due Day (1-31)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="e.g. 5"
                        value={emiDueDay}
                        onChange={(e) => setEmiDueDay(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Monthly EMI Amount ({itemCurrency})</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={monthlyEmi}
                        onChange={(e) => setMonthlyEmi(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-rose-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAutoCalculateEmi}
                        className="px-3 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-bold border border-rose-800/40 flex items-center gap-1.5 transition shrink-0"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Calculate Loan</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Loan Calculation Breakdown Card */}
                  {liveLoanBreakdown && liveLoanBreakdown.monthlyEmi > 0 && (
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-rose-300">
                        <span>
                          {interestCalcType === 'flat' ? 'Flat Rate Loan Breakdown' : 'Diminishing Rate Loan Breakdown'}:
                        </span>
                        <button
                          type="button"
                          onClick={handleAutoCalculateEmi}
                          className="text-[10px] text-rose-300 underline hover:text-white"
                        >
                          Apply to Form
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[9px] uppercase">Monthly EMI</span>
                          <span className="font-bold font-mono text-rose-300">
                            {formatCurrency(liveLoanBreakdown.monthlyEmi, itemCurrency)}
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[9px] uppercase">Total Interest</span>
                          <span className="font-bold font-mono text-amber-300">
                            {formatCurrency(liveLoanBreakdown.totalInterest, itemCurrency)}
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[9px] uppercase">Total Payable</span>
                          <span className="font-bold font-mono text-white">
                            {formatCurrency(liveLoanBreakdown.totalPayable, itemCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-200/80">
                    Non-EMI loans (bullet repayment, interest-free family borrowing, or private loan settlements).
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Lender / Partner Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Partner Capital"
                        value={lenderName}
                        onChange={(e) => setLenderName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Target Repayment Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CREDIT CARD SPECIFIC */}
          {type === 'credit_card' && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-900/40 space-y-2.5">
              <label className="text-[10px] font-bold uppercase text-cyan-400">Card Limits & Rewards</label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Total Credit Limit</label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Cashback Points</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={cashbackRewardPoints}
                    onChange={(e) => setCashbackRewardPoints(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono text-xs focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Minimum Due Amount</label>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={minimumDue}
                    onChange={(e) => setMinimumDue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ASSET SPECIFIC */}
          {type === 'asset' && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-900/40 space-y-2.5">
              <label className="text-[10px] font-bold uppercase text-amber-400">Asset Category & Units</label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 outline-none"
                  >
                    <option value="Gold & Jewellery">Gold & Jewellery</option>
                    <option value="Precious Metals">Precious Metals (Silver/Platinum)</option>
                    <option value="Real Estate / Land">Real Estate / Land</option>
                    <option value="Stocks & Bonds">Stocks & Bonds</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Crypto / Digital Assets">Crypto / Digital Assets</option>
                    <option value="Other Asset">Other Asset</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Purity / Weight / Units</label>
                  <input
                    type="text"
                    placeholder="e.g. 50g 24K, 1500 Sq Ft, 100 Shares"
                    value={purityOrUnits}
                    onChange={(e) => setPurityOrUnits(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Original Acquisition Cost Basis</label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* FIXED DEPOSIT SPECIFIC */}
          {type === 'fixed_deposit' && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-purple-400">FD Accounting Mode</label>
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                  isStandalone
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isStandalone ? 'Valuation Only (Stand Alone)' : 'Consolidated with Wealth'}
                </span>
              </div>

              {/* Toggle Buttons: Consolidate vs Stand Alone */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsStandalone(false)}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    !isStandalone
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Consolidate</span>
                    {!isStandalone && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Include in total wealth & net worth calculations
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStandalone(true)}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    isStandalone
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Stand Alone</span>
                    {isStandalone && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Valuation only (isolated locked investment)
                  </p>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Annual Yield (% p.a.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5.25"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Maturity Date</label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank Name / Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(type === 'bank_account' || type === 'credit_card' || type === 'fixed_deposit' || type === 'emi_loan') && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Financial Institution / Bank</label>
                <input
                  type="text"
                  placeholder="e.g. Emirates NBD, HDFC, Chase"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {type === 'bank_account' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Account / Card Number (Masked)</label>
                <input
                  type="text"
                  placeholder="e.g. •••• 4521"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {type === 'cash_entry' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Cash Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Pocket Wallet, Home Vault, Safe"
                  value={cashLocation}
                  onChange={(e) => setCashLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Main salary savings, locker #12, monthly expense buffer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Submit */}
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
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30 transition text-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
