import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Banknote,
  Building,
  Gift,
  ArrowDownRight,
  ArrowUpRight,
  Repeat,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  AlertCircle,
  Plus,
  Tag,
  Zap
} from 'lucide-react';
import { FinancialItem, Transaction, TransactionType, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';
import { getAllCategoriesForType, addCustomCategory } from '../utils/categories';
import {
  recordLastUsedCategory,
  getLastUsedCategory,
  getRecentCategories,
  sortCategoriesWithLastUsedOnTop,
  recordLastUsedCard,
  recordLastUsedItem,
  sortItemsWithLastUsedOnTop
} from '../utils/recentUsage';

interface SpendPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: FinancialItem | null;
  allItems: FinancialItem[];
  defaultAction?: 'spend' | 'deposit' | 'card_payment' | 'loan_emi' | 'loan_lump_sum' | 'atm_withdrawal' | 'borrow' | 'lend' | 'transfer';
  onExecuteTransaction: (data: {
    transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>;
    updatedTargetItem: FinancialItem;
    updatedSourceItem?: FinancialItem;
  }) => void;
}

export const SpendPaymentModal: React.FC<SpendPaymentModalProps> = ({
  isOpen,
  onClose,
  targetItem,
  allItems = [],
  defaultAction = 'spend',
  onExecuteTransaction
}) => {
  const [actionType, setActionType] = useState<string>(defaultAction);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Custom category creation inline & selection
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // Credit Card Payment specific
  const [cardPaymentMethod, setCardPaymentMethod] = useState<'bank' | 'cash' | 'cashback'>('bank');
  const [sourceAccountId, setSourceAccountId] = useState<string>('');
  const [rewardPointsToRedeem, setRewardPointsToRedeem] = useState<string>('');
  
  // Loan Payment specific
  const [loanPaymentSource, setLoanPaymentSource] = useState<string>('');
  const [loanPaymentMode, setLoanPaymentMode] = useState<'emi_only' | 'emi_plus_extra' | 'extra_principal_only' | 'lump_sum'>('emi_only');
  const [extraPrincipalAmount, setExtraPrincipalAmount] = useState<string>('');
  
  // ATM / Transfer specific
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  
  // Borrow / Lend specific
  const [personName, setPersonName] = useState<string>('');

  useEffect(() => {
    const raw = getAllCategoriesForType(catType);
    const sorted = sortCategoriesWithLastUsedOnTop(raw, catType);
    setAvailableCategories(sorted);
  }, [catType, isOpen]);

  useEffect(() => {
    if (targetItem) {
      let effectiveAction: string = 'spend';
      if (defaultAction) {
        effectiveAction = defaultAction;
        setActionType(defaultAction);
      } else if (targetItem.type === 'credit_card') {
        effectiveAction = 'card_payment';
        setActionType('card_payment');
      } else if (targetItem.type === 'emi_loan') {
        effectiveAction = targetItem.loanType === 'emi' ? 'loan_emi' : 'loan_lump_sum';
        setActionType(effectiveAction);
      } else if (targetItem.type === 'cash_entry') {
        effectiveAction = 'spend';
        setActionType('spend');
      } else {
        effectiveAction = 'spend';
        setActionType('spend');
      }

      // Automatically set category type based on action
      const isIncomeAction =
        effectiveAction === 'deposit' ||
        effectiveAction === 'receive' ||
        effectiveAction === 'borrow';
      const initialCatType = isIncomeAction ? 'income' : 'expense';
      setCatType(initialCatType);

      // Last used category takes top priority
      const lastUsed = getLastUsedCategory(initialCatType);
      setCategory(lastUsed || (isIncomeAction ? 'Salary & Wages' : 'General'));

      // Pre-fill amounts for EMI or Credit card
      if (targetItem.type === 'emi_loan' && targetItem.monthlyEmi) {
        setAmount(targetItem.monthlyEmi.toString());
      } else if (targetItem.type === 'credit_card') {
        if (effectiveAction === 'spend') {
          setAmount('0');
        } else {
          setAmount(targetItem.amount ? targetItem.amount.toString() : '');
        }
      } else {
        setAmount('');
      }

      const targetCurrency = targetItem.currency || 'AED';

      // SAME-CURRENCY ONLY FILTERING with LAST USED on top
      const sameCurrencyBankAccounts = sortItemsWithLastUsedOnTop(
        allItems.filter(
          (i) => i.type === 'bank_account' && i.id !== targetItem.id && (i.currency || 'AED') === targetCurrency
        ),
        'bank_account'
      );
      if (sameCurrencyBankAccounts.length > 0) {
        setSourceAccountId(sameCurrencyBankAccounts[0].id);
        setLoanPaymentSource(sameCurrencyBankAccounts[0].id);
      } else {
        setSourceAccountId('');
        setLoanPaymentSource('');
      }

      // Auto select first same-currency cash account with LAST USED on top
      const sameCurrencyCashAccounts = sortItemsWithLastUsedOnTop(
        allItems.filter(
          (i) => i.type === 'cash_entry' && (i.currency || 'AED') === targetCurrency
        ),
        'cash_entry'
      );
      if (sameCurrencyCashAccounts.length > 0) {
        setTransferTargetId(sameCurrencyCashAccounts[0].id);
      } else {
        setTransferTargetId('');
      }

      setDescription('');
      setRewardPointsToRedeem('');
      setPersonName('');
      setShowNewCatInput(false);
      setNewCatName('');
    }
  }, [targetItem, defaultAction, isOpen, allItems]);

  if (!isOpen || !targetItem) return null;

  const curr = targetItem.currency || 'AED';
  const country = targetItem.country || 'UAE';

  // Enforce same currency accounts only with LAST USED priority on top
  const sameCurrencyBankAccounts = sortItemsWithLastUsedOnTop(
    allItems.filter(
      (i) => i.type === 'bank_account' && i.id !== targetItem.id && (i.currency || 'AED') === curr
    ),
    'bank_account'
  );
  const sameCurrencyCashAccounts = sortItemsWithLastUsedOnTop(
    allItems.filter(
      (i) => i.type === 'cash_entry' && i.id !== targetItem.id && (i.currency || 'AED') === curr
    ),
    'cash_entry'
  );

  const handleCreateCustomCategory = () => {
    if (!newCatName.trim()) return;
    addCustomCategory(newCatName.trim(), catType);
    const updated = getAllCategoriesForType(catType);
    setAvailableCategories(updated);
    setCategory(newCatName.trim());
    setNewCatName('');
    setShowNewCatInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    let txType: TransactionType = 'spend';
    let updatedTarget: FinancialItem = { ...targetItem, updatedAt: new Date().toISOString() };
    let updatedSource: FinancialItem | undefined = undefined;
    let sourceTitle: string | undefined = undefined;
    let cashbackAmount: number | undefined = undefined;
    let rewardPointsUsed: number | undefined = undefined;

    // 1. BANK ACCOUNT SPEND / DEPOSIT / TRANSFER
    if (targetItem.type === 'bank_account') {
      if (actionType === 'spend') {
        txType = 'spend';
        updatedTarget.amount = Math.max(0, targetItem.amount - numAmount);
      } else if (actionType === 'deposit') {
        txType = 'receive';
        updatedTarget.amount = targetItem.amount + numAmount;
      } else if (actionType === 'transfer') {
        txType = 'transfer';
        const targetAcc = allItems.find((i) => i.id === transferTargetId);
        if (targetAcc) {
          updatedTarget.amount = Math.max(0, targetItem.amount - numAmount);
          updatedSource = {
            ...targetAcc,
            amount: targetAcc.amount + numAmount,
            updatedAt: new Date().toISOString()
          };
          sourceTitle = targetAcc.title;
        }
      }
    }

    // 2. CREDIT CARD SPEND / BILL PAYMENT / CASHBACK REDEMPTION
    else if (targetItem.type === 'credit_card') {
      if (actionType === 'spend') {
        txType = 'spend';
        updatedTarget.amount = targetItem.amount + numAmount; // increases balance due
      } else if (actionType === 'card_payment') {
        txType = cardPaymentMethod === 'cashback' ? 'cashback_reward' : 'card_payment';
        updatedTarget.amount = Math.max(0, targetItem.amount - numAmount); // decreases balance due

        if (cardPaymentMethod === 'cashback') {
          cashbackAmount = numAmount;
          rewardPointsUsed = parseFloat(rewardPointsToRedeem) || numAmount;
          if (targetItem.cashbackRewardPoints) {
            updatedTarget.cashbackRewardPoints = Math.max(
              0,
              targetItem.cashbackRewardPoints - (rewardPointsUsed || 0)
            );
          }
        } else if (cardPaymentMethod === 'bank') {
          const bankSource = allItems.find((i) => i.id === sourceAccountId);
          if (bankSource) {
            updatedSource = {
              ...bankSource,
              amount: Math.max(0, bankSource.amount - numAmount),
              updatedAt: new Date().toISOString()
            };
            sourceTitle = bankSource.title;
          }
        } else if (cardPaymentMethod === 'cash') {
          const cashSource = allItems.find((i) => i.id === sourceAccountId);
          if (cashSource) {
            updatedSource = {
              ...cashSource,
              amount: Math.max(0, cashSource.amount - numAmount),
              updatedAt: new Date().toISOString()
            };
            sourceTitle = cashSource.title;
          }
        }
      }
    }

    // 3. CASH WALLET SPEND / RECEIVE / ATM / BORROW / LEND
    else if (targetItem.type === 'cash_entry') {
      if (actionType === 'spend') {
        txType = 'spend';
        updatedTarget.amount = Math.max(0, targetItem.amount - numAmount);
      } else if (actionType === 'deposit' || actionType === 'receive') {
        txType = 'receive';
        updatedTarget.amount = targetItem.amount + numAmount;
      } else if (actionType === 'atm_withdrawal') {
        txType = 'atm_withdrawal';
        const bankSource = allItems.find((i) => i.id === sourceAccountId);
        if (bankSource) {
          updatedSource = {
            ...bankSource,
            amount: Math.max(0, bankSource.amount - numAmount),
            updatedAt: new Date().toISOString()
          };
          sourceTitle = bankSource.title;
          updatedTarget.amount = targetItem.amount + numAmount;
        }
      } else if (actionType === 'borrow') {
        txType = 'borrow';
        updatedTarget.amount = targetItem.amount + numAmount;
      } else if (actionType === 'lend') {
        txType = 'lend';
        updatedTarget.amount = Math.max(0, targetItem.amount - numAmount);
      }
    }

    // 4. LOANS (EMI vs LUMP SUM REPAYMENT / EXTRA PRINCIPAL DIRECT REDUCTION)
    else if (targetItem.type === 'emi_loan') {
      const isEmi = actionType === 'loan_emi' || (targetItem.loanType === 'emi' && actionType !== 'loan_lump_sum');
      txType = isEmi ? 'loan_emi' : 'loan_lump_sum';

      let baseEmiPaid = 0;
      let extraPrincipalPaid = 0;

      if (loanPaymentMode === 'emi_only') {
        baseEmiPaid = numAmount;
      } else if (loanPaymentMode === 'emi_plus_extra') {
        baseEmiPaid = numAmount;
        extraPrincipalPaid = Math.max(0, parseFloat(extraPrincipalAmount) || 0);
      } else if (loanPaymentMode === 'extra_principal_only') {
        extraPrincipalPaid = Math.max(0, parseFloat(extraPrincipalAmount) || numAmount);
      } else {
        baseEmiPaid = numAmount;
      }

      const totalLoanDeduction = baseEmiPaid + extraPrincipalPaid;
      const currentBalance = typeof targetItem.amount === 'number' ? targetItem.amount : (targetItem.principalAmount || 0);
      updatedTarget.amount = Math.max(0, currentBalance - totalLoanDeduction);

      let monthsToReduce = 0;
      if (baseEmiPaid > 0) {
        monthsToReduce += 1;
      }
      if (extraPrincipalPaid > 0 && targetItem.monthlyEmi && targetItem.monthlyEmi > 0) {
        const extraMonthsSaved = Math.floor(extraPrincipalPaid / targetItem.monthlyEmi);
        monthsToReduce += extraMonthsSaved;
      }

      if (isEmi && updatedTarget.remainingMonths && updatedTarget.remainingMonths > 0) {
        updatedTarget.remainingMonths = Math.max(0, updatedTarget.remainingMonths - monthsToReduce);
      }

      // Deduct from Bank Account or Cash Reserve if selected
      if (loanPaymentSource) {
        const sourceAcc = allItems.find((i) => i.id === loanPaymentSource);
        if (sourceAcc) {
          updatedSource = {
            ...sourceAcc,
            amount: Math.max(0, sourceAcc.amount - totalLoanDeduction),
            updatedAt: new Date().toISOString()
          };
          sourceTitle = sourceAcc.title;
        }
      }
    }

    let finalTxAmount = numAmount;
    if (targetItem.type === 'emi_loan') {
      const extraVal = Math.max(0, parseFloat(extraPrincipalAmount) || 0);
      if (loanPaymentMode === 'emi_plus_extra') {
        finalTxAmount = numAmount + extraVal;
      } else if (loanPaymentMode === 'extra_principal_only') {
        finalTxAmount = extraVal > 0 ? extraVal : numAmount;
      }
    }

    const txDesc =
      description.trim() ||
      (actionType === 'card_payment' && cardPaymentMethod === 'cashback'
        ? `Cashback Reward Redemption (${rewardPointsUsed || numAmount} pts)`
        : actionType === 'card_payment'
        ? `Credit Card Bill Payment`
        : targetItem.type === 'emi_loan' && loanPaymentMode === 'emi_plus_extra'
        ? `Loan EMI (${formatCurrency(numAmount, curr)}) + Extra Principal (${formatCurrency(parseFloat(extraPrincipalAmount) || 0, curr)})`
        : targetItem.type === 'emi_loan' && loanPaymentMode === 'extra_principal_only'
        ? `Loan Extra Principal Prepayment`
        : actionType === 'loan_emi'
        ? `Monthly Loan EMI Installment`
        : actionType === 'atm_withdrawal'
        ? `ATM Cash Withdrawal from ${sourceTitle || 'Bank'}`
        : actionType === 'borrow'
        ? `Borrowed Cash from ${personName || 'Lender'}`
        : actionType === 'lend'
        ? `Lent Cash to ${personName || 'Borrower'}`
        : actionType === 'spend'
        ? `Expense / Payment`
        : `Deposit / Income`);

    // Record Last Used Category, Card & Item tracking
    if (category) {
      recordLastUsedCategory(category, catType);
    }
    if (targetItem.type === 'credit_card') {
      recordLastUsedCard(targetItem.id);
    }
    recordLastUsedItem(targetItem.id, targetItem.type);

    if (sourceAccountId) {
      recordLastUsedItem(sourceAccountId, 'bank_account');
    }
    if (loanPaymentSource) {
      recordLastUsedItem(loanPaymentSource, 'bank_account');
    }

    onExecuteTransaction({
      transaction: {
        itemId: targetItem.id,
        itemTitle: targetItem.title,
        itemType: targetItem.type,
        type: txType,
        amount: finalTxAmount,
        currency: curr,
        country: country,
        category: category,
        description: txDesc,
        date: new Date(date).toISOString(),
        sourceAccountId: sourceAccountId || loanPaymentSource || undefined,
        sourceAccountTitle: sourceTitle,
        rewardPointsUsed,
        cashbackAmount
      },
      updatedTargetItem: updatedTarget,
      updatedSourceItem: updatedSource
    });

    onClose();
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {targetItem.type === 'credit_card' ? (
                <CreditCard className="w-5 h-5 text-cyan-400" />
              ) : targetItem.type === 'emi_loan' ? (
                <Building className="w-5 h-5 text-rose-400" />
              ) : targetItem.type === 'cash_entry' ? (
                <Banknote className="w-5 h-5 text-emerald-400" />
              ) : (
                <Building2 className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {targetItem.title}
              </h2>
              <p className="text-xs text-slate-400">
                {targetItem.country} • Current Balance: {formatCurrency(targetItem.amount, curr)}
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

        {/* Currency Rule Reminder Banner */}
        <div className="px-5 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 text-[11px] text-indigo-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Currency: <strong className="text-white font-mono">{curr} ({country})</strong> — Same-currency transactions only</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Action Type Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">Select Operation</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              
              {/* Bank Account Actions */}
              {targetItem.type === 'bank_account' && (
                <>
                  <button
                    type="button"
                    onClick={() => setActionType('spend')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'spend'
                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>Spend / Debit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('deposit')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'deposit'
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Deposit / Income</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('transfer')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'transfer'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Transfer Funds</span>
                  </button>
                </>
              )}

              {/* Credit Card Actions */}
              {targetItem.type === 'credit_card' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('card_payment');
                      setAmount(targetItem.amount ? targetItem.amount.toString() : '');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'card_payment'
                        ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pay Card Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('spend');
                      setAmount('0');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'spend'
                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>Spend / Charge</span>
                  </button>
                </>
              )}

              {/* Cash Wallet Actions */}
              {targetItem.type === 'cash_entry' && (
                <>
                  <button
                    type="button"
                    onClick={() => setActionType('spend')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'spend'
                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>Spend Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('deposit')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'deposit'
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Receive Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('atm_withdrawal')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'atm_withdrawal'
                        ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>ATM Withdraw</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('borrow')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'borrow'
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>Borrow Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('lend')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition border ${
                      actionType === 'lend'
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>Lend Cash</span>
                  </button>
                </>
              )}

              {/* Loan Actions */}
              {targetItem.type === 'emi_loan' && (
                <div className="col-span-2 sm:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('loan_emi');
                      setLoanPaymentMode('emi_only');
                      if (targetItem.monthlyEmi) setAmount(targetItem.monthlyEmi.toString());
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition border text-center ${
                      actionType === 'loan_emi' && loanPaymentMode === 'emi_only'
                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px]">Regular EMI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType('loan_emi');
                      setLoanPaymentMode('emi_plus_extra');
                      if (targetItem.monthlyEmi) setAmount(targetItem.monthlyEmi.toString());
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition border text-center ${
                      actionType === 'loan_emi' && loanPaymentMode === 'emi_plus_extra'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px]">EMI + Extra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType('loan_emi');
                      setLoanPaymentMode('extra_principal_only');
                      setAmount('0');
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition border text-center ${
                      actionType === 'loan_emi' && loanPaymentMode === 'extra_principal_only'
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px]">Extra Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType('loan_lump_sum');
                      setLoanPaymentMode('lump_sum');
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition border text-center ${
                      actionType === 'loan_lump_sum' || loanPaymentMode === 'lump_sum'
                        ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px]">Lump Sum</span>
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Credit Card Payment Method (Bank, Cash, or Cashback Rewards) */}
          {targetItem.type === 'credit_card' && actionType === 'card_payment' && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <label className="text-[10px] font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                <span>Payment Source & Cashback Rewards</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCardPaymentMethod('bank')}
                  className={`p-2 rounded-lg font-bold text-center border transition ${
                    cardPaymentMethod === 'bank'
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                  <span>Bank ({curr})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardPaymentMethod('cash')}
                  className={`p-2 rounded-lg font-bold text-center border transition ${
                    cardPaymentMethod === 'cash'
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Banknote className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span>Cash ({curr})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardPaymentMethod('cashback')}
                  className={`p-2 rounded-lg font-bold text-center border transition ${
                    cardPaymentMethod === 'cashback'
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <span>Cashback</span>
                </button>
              </div>

              {/* Bank Source Dropdown (Filtered to SAME CURRENCY) */}
              {cardPaymentMethod === 'bank' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Deduct from {curr} Bank Account
                  </label>
                  {sameCurrencyBankAccounts.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>No bank account found in {curr}. Please select Cash payment or add a {curr} bank account.</span>
                    </div>
                  ) : (
                    <select
                      value={sourceAccountId}
                      onChange={(e) => setSourceAccountId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                    >
                      {sameCurrencyBankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({formatCurrency(b.amount, curr)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Cash Source Dropdown (Filtered to SAME CURRENCY) */}
              {cardPaymentMethod === 'cash' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Deduct from {curr} Cash Reserve
                  </label>
                  {sameCurrencyCashAccounts.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>No {curr} cash reserve found.</span>
                    </div>
                  ) : (
                    <select
                      value={sourceAccountId}
                      onChange={(e) => setSourceAccountId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                    >
                      {sameCurrencyCashAccounts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({formatCurrency(c.amount, curr)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Cashback Reward Points Options */}
              {cardPaymentMethod === 'cashback' && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 space-y-2">
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span className="font-bold">✨ Available Reward Balance:</span>
                    <span className="font-black font-mono">
                      {targetItem.cashbackRewardPoints || 0} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Redeem your credit card cash-back rewards or points directly against your bill balance. No bank deduction occurs!
                  </p>
                  <div>
                    <label className="text-[10px] text-slate-300 block mb-1">Reward Points to Redeem</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={rewardPointsToRedeem}
                      onChange={(e) => {
                        setRewardPointsToRedeem(e.target.value);
                        if (!amount) setAmount(e.target.value);
                      }}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-amber-300 font-mono text-xs focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loan Payment Source (Filtered to SAME CURRENCY) */}
          {targetItem.type === 'emi_loan' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Deduct Payment From ({curr} Accounts)
              </label>
              {sameCurrencyBankAccounts.length === 0 && sameCurrencyCashAccounts.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>No {curr} accounts found. Transaction will record loan balance reduction directly.</span>
                </div>
              ) : (
                <select
                  value={loanPaymentSource}
                  onChange={(e) => setLoanPaymentSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                >
                  <optgroup label={`Bank Accounts (${curr})`}>
                    {sameCurrencyBankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (Balance: {formatCurrency(b.amount, curr)})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={`Cash Reserves (${curr})`}>
                    {sameCurrencyCashAccounts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (Cash: {formatCurrency(c.amount, curr)})
                      </option>
                    ))}
                  </optgroup>
                </select>
              )}
            </div>
          )}

          {/* ATM Withdrawal Source (Filtered to SAME CURRENCY) */}
          {targetItem.type === 'cash_entry' && actionType === 'atm_withdrawal' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40">
              <label className="text-[10px] font-bold uppercase text-amber-300">
                Withdraw From {curr} Bank Account
              </label>
              {sameCurrencyBankAccounts.length === 0 ? (
                <p className="text-xs text-rose-400 mt-1">No {curr} bank account available to withdraw cash from.</p>
              ) : (
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 outline-none mt-1"
                >
                  {sameCurrencyBankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (Available: {formatCurrency(b.amount, curr)})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-amber-300/80 mt-1">
                Deducts cash from your selected {curr} bank account and adds it directly to this {curr} cash reserve.
              </p>
            </div>
          )}

          {/* Transfer Target Dropdown (Filtered to SAME CURRENCY) */}
          {targetItem.type === 'bank_account' && actionType === 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Transfer Funds To (Same Currency: {curr})
              </label>
              {sameCurrencyBankAccounts.length === 0 && sameCurrencyCashAccounts.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs">
                  No other {curr} account or cash reserve available to receive transfers.
                </div>
              ) : (
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                >
                  {sameCurrencyBankAccounts.length > 0 && (
                    <optgroup label={`Bank Accounts (${curr})`}>
                      {sameCurrencyBankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({formatCurrency(b.amount, curr)})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {sameCurrencyCashAccounts.length > 0 && (
                    <optgroup label={`Physical Cash Reserves (${curr})`}>
                      {sameCurrencyCashAccounts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({formatCurrency(c.amount, curr)})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>
          )}

          {/* Borrow / Lend Person Name */}
          {targetItem.type === 'cash_entry' && (actionType === 'borrow' || actionType === 'lend') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                {actionType === 'borrow' ? 'Borrowed From (Person / Entity)' : 'Lent To (Person / Entity)'}
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe, Business Partner"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Amount Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                {targetItem.type === 'emi_loan' && loanPaymentMode === 'emi_plus_extra'
                  ? `Regular Monthly EMI (${curr})`
                  : targetItem.type === 'emi_loan' && loanPaymentMode === 'extra_principal_only'
                  ? `Base Amount (${curr})`
                  : `Amount (${curr})`}
              </label>
              {/* Credit Card Quick Amount Buttons */}
              {targetItem.type === 'credit_card' && targetItem.amount > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmount(targetItem.amount.toString())}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    Full Due ({formatCurrency(targetItem.amount, curr)})
                  </button>
                  {targetItem.minimumDue && (
                    <button
                      type="button"
                      onClick={() => setAmount((targetItem.minimumDue || 0).toString())}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      Min Due ({formatCurrency(targetItem.minimumDue, curr)})
                    </button>
                  )}
                </div>
              )}

              {/* Loan Quick Amount Buttons */}
              {targetItem.type === 'emi_loan' && (
                <div className="flex items-center gap-2">
                  {targetItem.monthlyEmi && targetItem.monthlyEmi > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(targetItem.monthlyEmi!.toString())}
                      className="text-[10px] bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 px-2 py-0.5 rounded font-bold transition"
                    >
                      Monthly EMI: {formatCurrency(targetItem.monthlyEmi, curr)}
                    </button>
                  )}
                  {targetItem.amount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(targetItem.amount.toString())}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline font-bold"
                    >
                      Full Balance ({formatCurrency(targetItem.amount, curr)})
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                required={targetItem.type !== 'emi_loan' || loanPaymentMode !== 'extra_principal_only'}
                value={amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-16 py-3 text-lg font-black text-white font-mono focus:border-indigo-500 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs font-mono">
                {curr}
              </span>
            </div>
          </div>

          {/* Dedicated Extra Principal / Etran Prepayment Field */}
          {targetItem.type === 'emi_loan' && (loanPaymentMode === 'emi_plus_extra' || loanPaymentMode === 'extra_principal_only') && (
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Additional / Extra Principal Payment (Etran)</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-bold">Direct Principal Reduction</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00 (e.g. 1000)"
                  value={extraPrincipalAmount}
                  onChange={(e) => setExtraPrincipalAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-indigo-500/60 rounded-xl pl-4 pr-16 py-2.5 text-base font-black text-indigo-200 font-mono focus:border-indigo-400 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-indigo-400 text-xs font-mono">
                  {curr}
                </span>
              </div>

              {/* Quick Extra Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {[500, 1000, 2500, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setExtraPrincipalAmount(preset.toString())}
                    className="px-2 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 text-[10px] font-bold text-indigo-300 font-mono transition"
                  >
                    +{formatCurrency(preset, curr)}
                  </button>
                ))}
                {extraPrincipalAmount && (
                  <button
                    type="button"
                    onClick={() => setExtraPrincipalAmount('')}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-slate-400 hover:text-white font-bold ml-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                ⚡ Paying extra principal directly bypasses loan interest, reducing remaining installments & tenure immediately.
              </p>
            </div>
          )}

          {/* Category with Custom Category Option & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Category:</span>
                  <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setCatType('expense');
                        const lastUsed = getLastUsedCategory('expense');
                        const raw = getAllCategoriesForType('expense');
                        const sorted = sortCategoriesWithLastUsedOnTop(raw, 'expense');
                        setAvailableCategories(sorted);
                        setCategory(lastUsed || 'General');
                      }}
                      className={`px-1.5 py-0.5 rounded-md font-bold transition ${
                        catType === 'expense'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCatType('income');
                        const lastUsed = getLastUsedCategory('income');
                        const raw = getAllCategoriesForType('income');
                        const sorted = sortCategoriesWithLastUsedOnTop(raw, 'income');
                        setAvailableCategories(sorted);
                        setCategory(lastUsed || 'Salary & Wages');
                      }}
                      className={`px-1.5 py-0.5 rounded-md font-bold transition ${
                        catType === 'income'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(!showNewCatInput)}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Custom</span>
                </button>
              </div>

              {/* Quick Category Chips with Last Used on Top */}
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                {availableCategories.slice(0, 4).map((c, idx) => {
                  const isLastUsed =
                    idx === 0 &&
                    !!getLastUsedCategory(catType) &&
                    getLastUsedCategory(catType)?.toLowerCase() === c.toLowerCase();
                  const isSelected = category.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : isLastUsed
                          ? 'bg-indigo-950/70 text-indigo-300 border-indigo-600/40 hover:bg-indigo-900/60'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {isLastUsed && <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                      <span>{c}</span>
                      {isLastUsed && <span className="text-[8px] opacity-75 font-semibold">(Last)</span>}
                    </button>
                  );
                })}
              </div>

              {showNewCatInput ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder={`New ${catType} category...`}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-xl px-2.5 py-2 text-white text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomCategory}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                >
                  {availableCategories.map((c, idx) => {
                    const isLastUsed =
                      idx === 0 &&
                      !!getLastUsedCategory(catType) &&
                      getLastUsedCategory(catType)?.toLowerCase() === c.toLowerCase();
                    return (
                      <option key={c} value={c}>
                        {isLastUsed ? `⚡ ${c} (Last Used)` : c}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Transaction Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Description Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">Notes / Merchant (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Carrefour Supermarket, Monthly Rent Transfer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Live Impact Preview Card for Loans / Cards / Transfers */}
          {(numAmount > 0 || (targetItem.type === 'emi_loan' && parseFloat(extraPrincipalAmount) > 0)) && (
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2 animate-in fade-in">
              {targetItem.type === 'emi_loan' ? (
                (() => {
                  const extraVal = Math.max(0, parseFloat(extraPrincipalAmount) || 0);
                  const isExtraOnly = loanPaymentMode === 'extra_principal_only';
                  const isEmiPlusExtra = loanPaymentMode === 'emi_plus_extra';
                  const baseVal = isExtraOnly ? 0 : numAmount;
                  const totalPaid = baseVal + (isExtraOnly || isEmiPlusExtra ? extraVal : 0);
                  const newBalance = Math.max(0, (targetItem.amount || 0) - totalPaid);
                  const monthsSaved = targetItem.monthlyEmi && targetItem.monthlyEmi > 0 && extraVal > 0
                    ? Math.floor(extraVal / targetItem.monthlyEmi)
                    : 0;

                  return (
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between font-bold text-indigo-300 pb-1 border-b border-indigo-500/20">
                        <span>Total Loan Payment:</span>
                        <span className="font-mono text-sm text-indigo-200">{formatCurrency(totalPaid, curr)}</span>
                      </div>
                      {isEmiPlusExtra && (
                        <div className="flex justify-between text-slate-400">
                          <span>• Regular EMI + Extra Principal:</span>
                          <span className="font-mono text-slate-200">
                            {formatCurrency(baseVal, curr)} + {formatCurrency(extraVal, curr)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Outstanding Debt:</span>
                        <span className="font-mono text-rose-400 font-bold">{formatCurrency(targetItem.amount, curr)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">New Outstanding After Payment:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {formatCurrency(newBalance, curr)}
                        </span>
                      </div>
                      {monthsSaved > 0 && (
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold">
                          <span>🚀 Tenure Reduction Benefit:</span>
                          <span>~{monthsSaved} Month(s) Knocked Off Loan!</span>
                        </div>
                      )}
                      {loanPaymentSource && (
                        <div className="flex justify-between pt-1 border-t border-indigo-500/20">
                          <span className="text-slate-400">Deducted from Bank / Cash:</span>
                          <span className="font-mono text-amber-300 font-bold">
                            {allItems.find(i => i.id === loanPaymentSource)?.title || 'Selected Account'} (-{formatCurrency(totalPaid, curr)})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <>
                  <div className="flex items-center justify-between font-bold text-indigo-300">
                    <span>Transaction Impact Preview:</span>
                    <span className="font-mono">{formatCurrency(numAmount, curr)}</span>
                  </div>
                  {targetItem.type === 'credit_card' && actionType === 'card_payment' && (
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Card Due:</span>
                        <span className="font-mono text-rose-400 font-bold">{formatCurrency(targetItem.amount, curr)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">New Card Due After Payment:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {formatCurrency(Math.max(0, targetItem.amount - numAmount), curr)}
                        </span>
                      </div>
                    </div>
                  )}
                  {targetItem.type === 'bank_account' && actionType === 'spend' && (
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Account Balance:</span>
                        <span className="font-mono text-slate-200">{formatCurrency(targetItem.amount, curr)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">New Account Balance:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {formatCurrency(Math.max(0, targetItem.amount - numAmount), curr)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Submit Buttons */}
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
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30 transition text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Record Transaction</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
