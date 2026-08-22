import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  MessageSquare,
  Download,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Share2,
  Sparkles,
  KeyRound,
  FileSpreadsheet,
  Globe,
  PieChart,
  Layers,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { FinancialItem, Transaction, CurrencyCode } from '../types';
import { formatCurrency, getCountryByName, COUNTRIES } from '../utils/currency';
import {
  generateFinancialPdf,
  ReportType,
  DateRangeFilter
} from '../utils/pdfGenerator';
import {
  exportFullBackupCsv,
  exportCountryWiseCsv,
  exportCategoryExpensesToCsv
} from '../utils/csvExport';

interface WhatsAppPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: FinancialItem[];
  transactions?: Transaction[];
  currency: CurrencyCode;
}

export const WhatsAppPdfModal: React.FC<WhatsAppPdfModalProps> = ({
  isOpen,
  onClose,
  items,
  transactions = [],
  currency
}) => {
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [csvDownloaded, setCsvDownloaded] = useState<string | null>(null);

  // Filter & Report configurations
  const [reportType, setReportType] = useState<ReportType>('country_wealth');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');

  if (!isOpen) return null;

  // Extract all distinct countries from items and transactions
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.country) set.add(i.country);
    });
    transactions.forEach((t) => {
      if (t.country) set.add(t.country);
    });
    if (set.size === 0) set.add('UAE');
    return Array.from(set).sort();
  }, [items, transactions]);

  // Filter items (excluding reminders) based on selected country
  const filteredItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.type !== 'reminder' &&
        (selectedCountry === 'ALL' || (i.country || 'UAE').toLowerCase() === selectedCountry.toLowerCase())
    );
  }, [items, selectedCountry]);

  // Group items by country (Unconsolidated)
  const countryBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        banks: FinancialItem[];
        cash: FinancialItem[];
        fds: FinancialItem[];
        assets: FinancialItem[];
        cards: FinancialItem[];
        loans: FinancialItem[];
        grossAssets: number;
        liabilities: number;
        netWorth: number;
        currency: CurrencyCode;
      }
    >();

    filteredItems.forEach((item) => {
      const c = item.country || 'UAE';
      if (!map.has(c)) {
        const cConfig = getCountryByName(c);
        map.set(c, {
          banks: [],
          cash: [],
          fds: [],
          assets: [],
          cards: [],
          loans: [],
          grossAssets: 0,
          liabilities: 0,
          netWorth: 0,
          currency: cConfig?.currency || currency,
        });
      }
      const data = map.get(c)!;
      if (item.type === 'bank_account') data.banks.push(item);
      else if (item.type === 'cash_entry') data.cash.push(item);
      else if (item.type === 'fixed_deposit') data.fds.push(item);
      else if (item.type === 'asset') data.assets.push(item);
      else if (item.type === 'credit_card') data.cards.push(item);
      else if (item.type === 'emi_loan') data.loans.push(item);
    });

    // Calculate totals for each country (respecting Consolidated vs Stand-Alone FDs)
    map.forEach((data) => {
      const liquid = [...data.banks, ...data.cash].reduce((acc, i) => acc + i.amount, 0);
      const consolidatedFds = data.fds.filter((f) => !f.isStandalone);
      const consolidatedFdTotal = consolidatedFds.reduce((acc, i) => acc + i.amount, 0);
      const assetTotal = data.assets.reduce((acc, i) => acc + i.amount, 0);

      data.grossAssets = liquid + consolidatedFdTotal + assetTotal;
      data.liabilities = [...data.cards, ...data.loans].reduce((acc, i) => acc + i.amount, 0);
      data.netWorth = data.grossAssets - data.liabilities;
    });

    return map;
  }, [filteredItems, currency]);

  // Filter and group expense transactions
  const expenseData = useMemo(() => {
    const rawSpends = transactions.filter(
      (t) =>
        t.type === 'spend' ||
        t.type === 'card_payment' ||
        t.type === 'loan_emi' ||
        t.type === 'loan_lump_sum' ||
        t.type === 'atm_withdrawal'
    );

    const countryFiltered = rawSpends.filter(
      (t) =>
        selectedCountry === 'ALL' ||
        (t.country || 'UAE').toLowerCase() === selectedCountry.toLowerCase()
    );

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const dateFiltered = countryFiltered.filter((tx) => {
      if (dateRange === 'all' || !tx.date) return true;
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return true;

      if (dateRange === 'this_month') {
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      }
      if (dateRange === 'last_month') {
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        return txDate.getFullYear() === lastMonthYear && txDate.getMonth() === lastMonth;
      }
      if (dateRange === 'this_year') {
        return txDate.getFullYear() === currentYear;
      }
      return true;
    });

    const categoryMap = new Map<string, { total: number; count: number; currency: CurrencyCode }>();
    let totalExpense = 0;

    dateFiltered.forEach((tx) => {
      const cat = tx.category?.trim() || 'General Expense';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          total: 0,
          count: 0,
          currency: tx.currency || currency,
        });
      }
      const cObj = categoryMap.get(cat)!;
      cObj.total += tx.amount;
      cObj.count += 1;
      totalExpense += tx.amount;
    });

    const sorted = Array.from(categoryMap.entries()).sort((a, b) => b[1].total - a[1].total);

    return {
      transactions: dateFiltered,
      categories: sorted,
      totalExpense,
      topCategory: sorted.length > 0 ? sorted[0] : null,
    };
  }, [transactions, selectedCountry, dateRange, currency]);

  // Generate dynamic WhatsApp formatted text message
  const generateReportText = () => {
    let report = `📊 *MYFIN FINANCIAL & WEALTH STATEMENT*\n`;
    report += `📅 Date: ${new Date().toLocaleDateString()}\n`;
    if (password) {
      report += `🔒 *PDF Password*: ${password}\n`;
    }
    report += `------------------------------------\n`;

    // 1. Country-wise Wealth Statement (DO NOT CONSOLIDATE)
    if (reportType === 'country_wealth' || reportType === 'comprehensive') {
      report += `🌐 *COUNTRY-WISE WEALTH POSITIONS*\n\n`;

      if (countryBreakdown.size === 0) {
        report += `_No accounts or cards found for the selected scope._\n\n`;
      } else {
        countryBreakdown.forEach((data, countryName) => {
          const cConfig = getCountryByName(countryName);
          const flag = cConfig?.flag || '🌐';
          const cCurr = data.currency;

          report += `${flag} *${countryName.toUpperCase()} (${cCurr})*\n`;
          report += `💰 *Net Position*: ${formatCurrency(data.netWorth, cCurr)}\n`;
          report += `📈 Gross Assets: ${formatCurrency(data.grossAssets, cCurr)}\n`;
          report += `📉 Liabilities: ${formatCurrency(data.liabilities, cCurr)}\n`;

          if (data.banks.length > 0 || data.cash.length > 0) {
            report += `  🏦 *Operating Liquidity*:\n`;
            data.banks.forEach((b) => {
              report += `    • Bank: ${b.title} (${b.bankName || 'Bank'}) - ${formatCurrency(b.amount, b.currency || cCurr)}\n`;
            });
            data.cash.forEach((c) => {
              report += `    • Cash: ${c.title} - ${formatCurrency(c.amount, c.currency || cCurr)}\n`;
            });
          }

          if (data.fds.length > 0) {
            report += `  🔒 *Fixed Deposits*:\n`;
            data.fds.forEach((f) => {
              const modeTag = f.isStandalone ? ' [Stand-Alone]' : ' [Consolidated in Net Position]';
              report += `    • FD: ${f.title} - ${formatCurrency(f.amount, f.currency || cCurr)} (${f.interestRate || 0}% p.a.)${modeTag}\n`;
            });
          }

          if (data.assets.length > 0) {
            report += `  ✨ *Gold & Assets*:\n`;
            data.assets.forEach((a) => {
              report += `    • Asset: ${a.title} (${a.purityOrUnits || 'Holdings'}) - ${formatCurrency(a.amount, a.currency || cCurr)}\n`;
            });
          }

          if (data.cards.length > 0 || data.loans.length > 0) {
            report += `  💳 *Liabilities & Debt*:\n`;
            data.cards.forEach((card) => {
              report += `    • Card: ${card.title} - ${formatCurrency(card.amount, card.currency || cCurr)} (Due: ${card.dueDate || 'N/A'})\n`;
            });
            data.loans.forEach((loan) => {
              report += `    • Loan: ${loan.title} - ${formatCurrency(loan.amount, loan.currency || cCurr)}\n`;
            });
          }

          report += `\n`;
        });
      }
    }

    // 2. Category Expense Breakdown
    if (reportType === 'category_expenses' || reportType === 'comprehensive') {
      const periodLabel =
        dateRange === 'this_month'
          ? 'Current Month'
          : dateRange === 'last_month'
          ? 'Previous Month'
          : dateRange === 'this_year'
          ? 'Current Year'
          : 'All Time';

      report += `📈 *CATEGORY EXPENSE AUDIT (${periodLabel})*\n`;
      report += `💸 Total Expense: *${formatCurrency(expenseData.totalExpense, currency)}*\n`;
      report += `📋 Transactions: ${expenseData.transactions.length} entries\n\n`;

      if (expenseData.categories.length > 0) {
        report += `*Top Expense Categories:*\n`;
        expenseData.categories.slice(0, 10).forEach(([catName, cData], idx) => {
          const pct =
            expenseData.totalExpense > 0
              ? ((cData.total / expenseData.totalExpense) * 100).toFixed(1)
              : '0';
          report += `${idx + 1}. *${catName}*: ${formatCurrency(cData.total, currency)} (${pct}% • ${cData.count} tx)\n`;
        });
        report += `\n`;
      } else {
        report += `_No expense records for selected period._\n\n`;
      }
    }

    report += `------------------------------------\n`;
    report += `Generated securely via MYFIN Real-time Wealth & Expense Platform.`;
    return report;
  };

  const reportText = generateReportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const doc = generateFinancialPdf({
          items,
          transactions,
          currency,
          password,
          selectedCountry,
          reportType,
          dateRange,
        });
        const prefix =
          reportType === 'category_expenses'
            ? 'MYFIN_Category_Expense_Report'
            : reportType === 'comprehensive'
            ? 'MYFIN_Comprehensive_Master_Report'
            : 'MYFIN_Country_Wealth_Statement';

        const fileName = password
          ? `${prefix}_Protected_${new Date().toISOString().slice(0, 10)}.pdf`
          : `${prefix}_${new Date().toISOString().slice(0, 10)}.pdf`;

        doc.save(fileName);
      } catch (err) {
        console.error('PDF Generation Error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleWhatsAppShare = async () => {
    setIsGenerating(true);

    try {
      const doc = generateFinancialPdf({
        items,
        transactions,
        currency,
        password,
        selectedCountry,
        reportType,
        dateRange,
      });
      const pdfBlob = doc.output('blob');
      const fileName = password ? 'MYFIN_Protected_Statement.pdf' : 'MYFIN_Statement.pdf';
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'MYFIN Financial Report',
          text: `MYFIN Financial Report (${password ? 'Password Protected: ' + password : 'Country-Wise & Expense Statement'})`
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        doc.save(fileName);
        const shareMsg = password
          ? `📄 *MYFIN Encrypted Financial Statement*\n\n🔒 *Document Password*: \`${password}\`\n\nI have generated and attached the encrypted PDF statement with country-wise wealth and expense breakdown.`
          : reportText;

        const encoded = encodeURIComponent(shareMsg);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
      }
    } catch (err) {
      console.error('WhatsApp Share Error:', err);
      const encoded = encodeURIComponent(reportText);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-lg shadow-inner">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  PDF Export & Sharing Center
                </h2>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Unconsolidated Reports
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Export country-segregated wealth statements and itemized category expense audits.
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Report Type Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
              1. Select Report Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReportType('country_wealth')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  reportType === 'country_wealth'
                    ? 'bg-emerald-950/50 border-emerald-500/80 text-white shadow-md shadow-emerald-950/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Globe className={`w-4 h-4 ${reportType === 'country_wealth' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    Country-Wise Wealth
                  </span>
                  {reportType === 'country_wealth' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Unconsolidated per-country banks, cash, FDs, assets & liabilities.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType('category_expenses')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  reportType === 'category_expenses'
                    ? 'bg-indigo-950/50 border-indigo-500/80 text-white shadow-md shadow-indigo-950/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <PieChart className={`w-4 h-4 ${reportType === 'category_expenses' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    Category Expenses
                  </span>
                  {reportType === 'category_expenses' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Breakdown by category, % share, average spending & itemized logs.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType('comprehensive')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  reportType === 'comprehensive'
                    ? 'bg-purple-950/50 border-purple-500/80 text-white shadow-md shadow-purple-950/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Layers className={`w-4 h-4 ${reportType === 'comprehensive' ? 'text-purple-400' : 'text-slate-400'}`} />
                    Master Comprehensive
                  </span>
                  {reportType === 'comprehensive' && (
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Combined Country-Wise Wealth Statement + Category Expense Audit.
                </p>
              </button>
            </div>
          </div>

          {/* Filters Bar: Country Scope & Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            {/* Country Selector */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Country Scope</span>
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">🌐 All Countries (Individual Country Sections)</option>
                {availableCountries.map((c) => {
                  const conf = getCountryByName(c);
                  return (
                    <option key={c} value={c}>
                      {conf?.flag || '🏳️'} {c} ({conf?.currency || currency})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Date Range Selector (for Expense Analysis) */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Expense Period</span>
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Time Recorded Spends</option>
                <option value="this_month">Current Month Spends</option>
                <option value="last_month">Previous Month Spends</option>
                <option value="this_year">Current Year (YTD)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Summary Metric Badges */}
          {reportType === 'country_wealth' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-300">
                <span className="uppercase tracking-wider">Unconsolidated Country Positions</span>
                <span className="text-emerald-400 text-xs">{countryBreakdown.size} Country Regions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from(countryBreakdown.entries()).map(([cName, data]) => {
                  const cConfig = getCountryByName(cName);
                  return (
                    <div
                      key={cName}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                          <span>{cConfig?.flag || '🌐'}</span>
                          <span>{cName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({data.currency})</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Assets: {formatCurrency(data.grossAssets, data.currency)} | Debt: {formatCurrency(data.liabilities, data.currency)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black text-xs block ${
                            data.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(data.netWorth, data.currency)}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Net Position</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(reportType === 'category_expenses' || reportType === 'comprehensive') && (
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-300">
                <span className="uppercase tracking-wider">Category Expense Highlights</span>
                <span className="text-white">{expenseData.transactions.length} Transactions</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-950/80 border border-indigo-900/40">
                  <span className="text-[10px] text-slate-400 block">Total Expenses</span>
                  <span className="font-black text-rose-400">{formatCurrency(expenseData.totalExpense, currency)}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/80 border border-indigo-900/40">
                  <span className="text-[10px] text-slate-400 block">Categories Active</span>
                  <span className="font-black text-white">{expenseData.categories.length} Categories</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/80 border border-indigo-900/40 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block">Top Category</span>
                  <span className="font-black text-indigo-300 truncate block">
                    {expenseData.topCategory ? `${expenseData.topCategory[0]}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Password Protection Control */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wide">
                    PDF Password Encryption
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Optional password required to open the exported PDF file on any device.
                  </p>
                </div>
              </div>
              {password && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Encrypted
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Set password to encrypt PDF statement (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-20 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {password && (
                  <button
                    type="button"
                    onClick={() => setPassword('')}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-400 px-1.5 py-1"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Statement Text Preview (WhatsApp Formatted) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Text Statement Preview (WhatsApp Formatted)
              </label>
              <button
                onClick={handleCopy}
                className="text-[11px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={reportText}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px] leading-relaxed focus:outline-none select-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            
            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-white/20" />
              <span>{isGenerating ? 'Generating...' : 'WhatsApp Share'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{password ? 'Protected PDF' : 'Download PDF'}</span>
            </button>

            {/* CSV Export Dropdown / Buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  if (reportType === 'category_expenses') {
                    exportCategoryExpensesToCsv(transactions, currency, selectedCountry);
                    setCsvDownloaded('Category Expense CSV Downloaded!');
                  } else if (reportType === 'country_wealth') {
                    exportCountryWiseCsv(items, currency);
                    setCsvDownloaded('Country Wealth CSV Downloaded!');
                  } else {
                    exportFullBackupCsv(items, transactions, currency);
                    setCsvDownloaded('Master Backup CSV Downloaded!');
                  }
                  setTimeout(() => setCsvDownloaded(null), 3000);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs border border-slate-700 shadow-md transition cursor-pointer active:scale-95"
                title="Download CSV report matching current selection"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>

          </div>

          {csvDownloaded && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{csvDownloaded}</span>
            </div>
          )}

          {shareSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
              ✅ PDF Statement Shared Successfully via WhatsApp!
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
