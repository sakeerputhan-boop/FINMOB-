import React from 'react';
import {
  Building2,
  Banknote,
  CreditCard,
  Building,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Globe,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency, getCountryByName } from '../utils/currency';

interface DashboardViewProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  selectedCountry: string; // 'ALL' or 'UAE', 'India', etc.
  onOpenAddItem: (type?: any) => void;
  onOpenSpendPayment: (item: FinancialItem, defaultAction?: string) => void;
  onOpenTransactions: (item: FinancialItem) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items = [],
  currency,
  selectedCountry,
  onOpenAddItem,
  onOpenSpendPayment,
  onOpenTransactions,
  onNavigateTab
}) => {
  // Extract all distinct countries that hold financial items
  const allHoldingCountries = Array.from(
    new Set(
      items
        .map((i) => i.country || 'UAE')
        .filter(Boolean)
    )
  );

  // If no items exist, default to current selected country or UAE
  const displayCountries =
    selectedCountry === 'ALL'
      ? allHoldingCountries.length > 0
        ? allHoldingCountries
        : ['UAE']
      : [selectedCountry];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner / Add Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
              Country-Wise Financial Overview
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {selectedCountry === 'ALL' ? `${displayCountries.length} Holding Countries` : selectedCountry}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Independent summaries for Accounts, Credit Cards, and Loans per country currency
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAddItem('bank_account')}
            className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Financial Item</span>
          </button>
        </div>
      </div>

      {/* Independent Country-Wise Summaries */}
      <div className="space-y-6">
        {displayCountries.map((countryName) => {
          const countryMeta = getCountryByName(countryName);
          const countryItems = items.filter(
            (i) => (i.country || 'UAE').toLowerCase() === countryName.toLowerCase()
          );

          const nativeCurrency: CurrencyCode =
            (countryItems.find((i) => i.currency)?.currency as CurrencyCode) ||
            countryMeta.currency;

          // Country Accounts (Bank + Cash)
          const bankItems = countryItems.filter((i) => i.type === 'bank_account');
          const cashItems = countryItems.filter((i) => i.type === 'cash_entry');
          const totalBank = bankItems.reduce((acc, i) => acc + i.amount, 0);
          const totalCash = cashItems.reduce((acc, i) => acc + i.amount, 0);
          const totalLiquid = totalBank + totalCash;

          // Country Credit Cards
          const cardItems = countryItems.filter((i) => i.type === 'credit_card');
          const totalCardDue = cardItems.reduce((acc, i) => acc + i.amount, 0);
          const totalCardLimit = cardItems.reduce((acc, i) => acc + (i.creditLimit || 0), 0);
          const totalCardAvailable = Math.max(0, totalCardLimit - totalCardDue);

          // Country Loans
          const loanItems = countryItems.filter((i) => i.type === 'emi_loan');
          const totalLoanDue = loanItems.reduce((acc, i) => acc + i.amount, 0);
          const emiLoans = loanItems.filter((i) => (i.loanType || 'emi') === 'emi');
          const totalMonthlyEmi = emiLoans.reduce((acc, i) => acc + (i.monthlyEmi || 0), 0);

          // Net position in this native currency
          const countryNet = totalLiquid - (totalCardDue + totalLoanDue);

          return (
            <div
              key={countryName}
              className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl"
            >
              {/* Country Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{countryMeta.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{countryName} Financial Summary</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {nativeCurrency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Independent position for {countryName} accounts & liabilities
                    </p>
                  </div>
                </div>

                {/* Country Net Balance */}
                <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Net Position:
                  </span>
                  <span
                    className={`text-base font-black font-mono ${
                      countryNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(countryNet, nativeCurrency)}
                  </span>
                </div>
              </div>

              {/* 3 Country Metrics Pillars: Accounts, Credit Cards, Loans */}
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
                  
                  {/* 1. Accounts Metric */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-indigo-400 text-[10px] font-bold uppercase">
                      <span>1. Bank & Cash Accounts</span>
                      <Building2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                      {formatCurrency(totalLiquid, nativeCurrency)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>{bankItems.length} Bank, {cashItems.length} Cash</span>
                      <button
                        onClick={() => onNavigateTab('accounts')}
                        className="text-indigo-400 hover:underline font-bold"
                      >
                        View →
                      </button>
                    </div>
                  </div>

                  {/* 2. Credit Cards Metric */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-cyan-400 text-[10px] font-bold uppercase">
                      <span>2. Credit Cards</span>
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-lg font-black text-rose-400 font-mono mt-1">
                      {formatCurrency(totalCardDue, nativeCurrency)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>Limit: {formatCurrency(totalCardLimit, nativeCurrency)}</span>
                      <button
                        onClick={() => onNavigateTab('cards')}
                        className="text-cyan-400 hover:underline font-bold"
                      >
                        View →
                      </button>
                    </div>
                  </div>

                  {/* 3. Loans Metric */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-rose-400 text-[10px] font-bold uppercase">
                      <span>3. Active Loans</span>
                      <Building className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-lg font-black text-rose-400 font-mono mt-1">
                      {formatCurrency(totalLoanDue, nativeCurrency)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>
                        {totalMonthlyEmi > 0 ? `EMI: ${formatCurrency(totalMonthlyEmi, nativeCurrency)}/mo` : `${loanItems.length} Active`}
                      </span>
                      <button
                        onClick={() => onNavigateTab('loans')}
                        className="text-rose-400 hover:underline font-bold"
                      >
                        View →
                      </button>
                    </div>
                  </div>

                </div>

                {/* Country Items Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                  
                  {/* Accounts Column */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Accounts ({bankItems.length + cashItems.length})</span>
                      </span>
                    </div>

                    {bankItems.length === 0 && cashItems.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-slate-500 text-xs">
                        No accounts in {countryName}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bankItems.map((acc) => (
                          <div
                            key={acc.id}
                            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="truncate mr-2">
                              <h5 className="font-bold text-white truncate">{acc.title}</h5>
                              <p className="text-[10px] text-slate-400">{acc.bankName || 'Bank'}</p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-1.5">
                              <span className="font-black text-emerald-400 font-mono">
                                {formatCurrency(acc.amount, nativeCurrency)}
                              </span>
                              <button
                                onClick={() => onOpenSpendPayment(acc, 'spend')}
                                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-800/40"
                              >
                                Spend
                              </button>
                            </div>
                          </div>
                        ))}

                        {cashItems.map((cash) => (
                          <div
                            key={cash.id}
                            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="truncate mr-2">
                              <h5 className="font-bold text-white truncate">{cash.title}</h5>
                              <p className="text-[10px] text-slate-400">Cash Reserve</p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-1.5">
                              <span className="font-black text-emerald-400 font-mono">
                                {formatCurrency(cash.amount, nativeCurrency)}
                              </span>
                              <button
                                onClick={() => onOpenSpendPayment(cash, 'spend')}
                                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-800/40"
                              >
                                Spend
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Credit Cards Column */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Credit Cards ({cardItems.length})</span>
                      </span>
                    </div>

                    {cardItems.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-slate-500 text-xs">
                        No credit cards in {countryName}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cardItems.map((card) => (
                          <div
                            key={card.id}
                            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="truncate mr-2">
                              <h5 className="font-bold text-white truncate">{card.title}</h5>
                              <p className="text-[10px] text-slate-400">
                                {card.dueDate ? `Due: ${card.dueDate}` : `Limit: ${formatCurrency(card.creditLimit || 0, nativeCurrency)}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-1.5">
                              <span className="font-black text-rose-400 font-mono">
                                {formatCurrency(card.amount, nativeCurrency)}
                              </span>
                              <button
                                onClick={() => onOpenSpendPayment(card, 'card_payment')}
                                className="px-2 py-1 bg-cyan-950/50 hover:bg-cyan-900 text-cyan-300 text-[10px] font-bold rounded-lg border border-cyan-800/40"
                              >
                                Pay
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Loans Column */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-rose-400" />
                        <span>Loans ({loanItems.length})</span>
                      </span>
                    </div>

                    {loanItems.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-slate-500 text-xs">
                        No active loans in {countryName}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {loanItems.map((loan) => {
                          const isEmi = (loan.loanType || 'emi') === 'emi';
                          return (
                            <div
                              key={loan.id}
                              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                            >
                              <div className="truncate mr-2">
                                <h5 className="font-bold text-white truncate">{loan.title}</h5>
                                <p className="text-[10px] text-slate-400">
                                  {isEmi && loan.monthlyEmi
                                    ? `EMI: ${formatCurrency(loan.monthlyEmi, nativeCurrency)}`
                                    : 'Lump Sum Loan'}
                                </p>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-1.5">
                                <span className="font-black text-rose-400 font-mono">
                                  {formatCurrency(loan.amount, nativeCurrency)}
                                </span>
                                <button
                                  onClick={() =>
                                    onOpenSpendPayment(loan, isEmi ? 'loan_emi' : 'loan_lump_sum')
                                  }
                                  className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-800/40"
                                >
                                  Pay
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
