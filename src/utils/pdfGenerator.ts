import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialItem, Transaction, CurrencyCode } from '../types';
import { formatCurrency, getCountryByName, COUNTRIES } from './currency';

export type ReportType = 'country_wealth' | 'category_expenses' | 'comprehensive';
export type DateRangeFilter = 'all' | 'this_month' | 'last_month' | 'this_year';

export interface GeneratePdfOptions {
  items: FinancialItem[];
  transactions?: Transaction[];
  currency: CurrencyCode;
  password?: string;
  selectedCountry?: string; // 'ALL' or specific country name e.g. 'UAE', 'India'
  reportType?: ReportType;
  dateRange?: DateRangeFilter;
}

/**
 * Filter transactions based on date range
 */
function filterTransactionsByDate(
  transactions: Transaction[],
  dateRange: DateRangeFilter = 'all'
): Transaction[] {
  if (dateRange === 'all') return transactions;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  return transactions.filter((tx) => {
    if (!tx.date) return false;
    const txDate = new Date(tx.date);
    if (isNaN(txDate.getTime())) return false;

    if (dateRange === 'this_month') {
      return (
        txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth
      );
    }
    if (dateRange === 'last_month') {
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      return (
        txDate.getFullYear() === lastMonthYear && txDate.getMonth() === lastMonth
      );
    }
    if (dateRange === 'this_year') {
      return txDate.getFullYear() === currentYear;
    }
    return true;
  });
}

/**
 * Helper to determine country currency code
 */
function resolveCountryCurrency(
  countryName: string | undefined,
  fallbackCurrency: CurrencyCode
): CurrencyCode {
  if (!countryName) return fallbackCurrency;
  const config = getCountryByName(countryName);
  return config?.currency || fallbackCurrency;
}

/**
 * Main PDF Generation Engine:
 * Generates Country-Wise (Unconsolidated) Wealth Reports,
 * Category Expense Breakdown Reports, or Comprehensive Combined Statements.
 */
export function generateFinancialPdf({
  items,
  transactions = [],
  currency,
  password,
  selectedCountry = 'ALL',
  reportType = 'country_wealth',
  dateRange = 'all',
}: GeneratePdfOptions): jsPDF {
  // Initialize jsPDF with password encryption if provided
  const docOptions: Record<string, any> = {
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  };

  const cleanPassword = password ? password.trim() : '';
  if (cleanPassword.length > 0) {
    docOptions.encryption = {
      userPassword: cleanPassword,
      ownerPassword: cleanPassword,
      userPermissions: ['print', 'copy', 'modify', 'annot-forms'],
    };
  }

  const doc = new jsPDF(docOptions);

  // Filter items by country if specific country is chosen (and exclude reminders)
  const validItems = items.filter(
    (i) =>
      i.type !== 'reminder' &&
      (selectedCountry === 'ALL' || (i.country || 'UAE').toLowerCase() === selectedCountry.toLowerCase())
  );

  // Group items by country strictly (DO NOT CONSOLIDATE across countries)
  const countryMap = new Map<string, FinancialItem[]>();
  validItems.forEach((item) => {
    const cName = item.country || 'UAE';
    if (!countryMap.has(cName)) {
      countryMap.set(cName, []);
    }
    countryMap.get(cName)!.push(item);
  });

  // Sort country keys so UAE/India appear standard or alphabetically
  const countries = Array.from(countryMap.keys()).sort((a, b) => {
    if (a === 'UAE') return -1;
    if (b === 'UAE') return 1;
    return a.localeCompare(b);
  });

  // Helper to render section title and table
  let currentY = 16;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > 275) {
      doc.addPage();
      currentY = 20;
    }
  };

  const renderTable = (
    title: string,
    headers: string[],
    data: string[][],
    headerBgColor: [number, number, number],
    totalLabel?: string,
    totalVal?: string
  ) => {
    if (data.length === 0) return;

    checkPageBreak(25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
    doc.text(title, 14, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: headerBgColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;

    if (totalLabel && totalVal) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(`${totalLabel}: ${totalVal}`, 14, currentY);
      currentY += 6;
    } else {
      currentY += 2;
    }
  };

  // =========================================================================
  // SECTION 1: COUNTRY-WISE WEALTH & PORTFOLIO STATEMENT (UNCONSOLIDATED)
  // =========================================================================
  if (reportType === 'country_wealth' || reportType === 'comprehensive') {
    // Top Document Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 36, 'F');

    // Accent line
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 34, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MYFIN COUNTRY-WISE WEALTH STATEMENT', 14, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • Multi-Country Segregated Audit`,
      14,
      22
    );
    doc.text(
      selectedCountry === 'ALL'
        ? `Scope: All Countries (Individual Country Positions & Breakdowns)`
        : `Scope: ${selectedCountry} Only (Segregated Position)`,
      14,
      28
    );

    // Password / Security Badge
    if (cleanPassword) {
      doc.setFillColor(220, 38, 38); // red badge
      doc.roundedRect(138, 9, 58, 16, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('LOCKED PDF STATEMENT', 141, 15);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Password Protected File', 141, 20);
    } else {
      doc.setFillColor(16, 185, 129); // emerald badge
      doc.roundedRect(138, 9, 58, 16, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('VERIFIED STATEMENT', 141, 15);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Unconsolidated Report', 141, 20);
    }

    currentY = 44;

    // 1.1 Multi-Country Executive Overview Table (Comparing each country in its own currency)
    if (countries.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('1. MULTI-COUNTRY POSITION SUMMARY (BY NATIVE CURRENCY)', 14, currentY);
      currentY += 3;

      const summaryRows = countries.map((cName) => {
        const cItems = countryMap.get(cName) || [];
        const cCurr = resolveCountryCurrency(cName, currency);
        const cConfig = getCountryByName(cName);
        const flag = cConfig?.flag || '🌐';

        const banks = cItems.filter((i) => i.type === 'bank_account' || i.type === 'cash_entry');
        const consolidatedFds = cItems.filter((i) => i.type === 'fixed_deposit' && !i.isStandalone);
        const assets = cItems.filter((i) => i.type === 'asset');
        const cardsAndLoans = cItems.filter((i) => i.type === 'credit_card' || i.type === 'emi_loan');

        const liquid = banks.reduce((acc, i) => acc + i.amount, 0);
        const consolidatedFdTotal = consolidatedFds.reduce((acc, i) => acc + i.amount, 0);
        const assetTotal = assets.reduce((acc, i) => acc + i.amount, 0);
        const gross = liquid + consolidatedFdTotal + assetTotal;
        const liab = cardsAndLoans.reduce((acc, i) => acc + i.amount, 0);
        const net = gross - liab;

        return [
          `${flag} ${cName}`,
          cCurr,
          formatCurrency(liquid, cCurr),
          formatCurrency(consolidatedFdTotal + assetTotal, cCurr),
          formatCurrency(gross, cCurr),
          formatCurrency(liab, cCurr),
          formatCurrency(net, cCurr),
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            'Country',
            'Currency',
            'Liquid & Bank',
            'Consolidated FDs & Assets',
            'Gross Wealth',
            'Liabilities & Debt',
            'Country Net Position',
          ],
        ],
        body: summaryRows,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          fontStyle: 'bold',
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249],
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // 1.2 Iterate Through Each Country Separately (DO NOT CONSOLIDATE)
    countries.forEach((cName, index) => {
      const cItems = countryMap.get(cName) || [];
      const cCurr = resolveCountryCurrency(cName, currency);
      const cConfig = getCountryByName(cName);
      const flag = cConfig?.flag || '🌐';

      const bankItems = cItems.filter((i) => i.type === 'bank_account');
      const cashItems = cItems.filter((i) => i.type === 'cash_entry');
      const fdItems = cItems.filter((i) => i.type === 'fixed_deposit');
      const consolidatedFdItems = fdItems.filter((i) => !i.isStandalone);
      const standaloneFdItems = fdItems.filter((i) => Boolean(i.isStandalone));
      const assetItems = cItems.filter((i) => i.type === 'asset');
      const cardItems = cItems.filter((i) => i.type === 'credit_card');
      const loanItems = cItems.filter((i) => i.type === 'emi_loan');

      const totalBank = bankItems.reduce((acc, i) => acc + i.amount, 0);
      const totalCash = cashItems.reduce((acc, i) => acc + i.amount, 0);
      const totalConsolidatedFD = consolidatedFdItems.reduce((acc, i) => acc + i.amount, 0);
      const totalStandaloneFD = standaloneFdItems.reduce((acc, i) => acc + i.amount, 0);
      const totalFD = fdItems.reduce((acc, i) => acc + i.amount, 0);
      const totalAssets = assetItems.reduce((acc, i) => acc + i.amount, 0);
      
      // Gross Wealth correctly includes Liquid + Consolidated FDs + Assets
      const grossWealth = totalBank + totalCash + totalConsolidatedFD + totalAssets;

      const totalCards = cardItems.reduce((acc, i) => acc + i.amount, 0);
      const totalLoans = loanItems.reduce((acc, i) => acc + i.amount, 0);
      const totalLiabilities = totalCards + totalLoans;
      const netWorth = grossWealth - totalLiabilities;

      // Page break check for country header block
      checkPageBreak(50);

      // Country Header Box
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(14, currentY, 182, 28, 3, 3, 'FD');

      // Decorative left pill
      doc.setFillColor(16, 185, 129); // emerald
      doc.rect(14, currentY, 4, 28, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${flag} ${cName.toUpperCase()} - FINANCIAL & WEALTH REPORT`, 22, currentY + 8);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Native Currency: ${cCurr} (${cConfig?.currencySymbol || cCurr}) • Total Records: ${cItems.length}`, 22, currentY + 14);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(netWorth >= 0 ? 16 : 220, netWorth >= 0 ? 185 : 38, netWorth >= 0 ? 129 : 38);
      doc.text(
        `Country Net Position: ${formatCurrency(netWorth, cCurr)}`,
        22,
        currentY + 22
      );

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const fdNote = totalStandaloneFD > 0 ? ` (Standalone FDs: ${formatCurrency(totalStandaloneFD, cCurr)})` : '';
      doc.text(
        `Gross Assets: ${formatCurrency(grossWealth, cCurr)}   |   Liabilities: ${formatCurrency(totalLiabilities, cCurr)}${fdNote}`,
        96,
        currentY + 22
      );

      currentY += 34;

      // A. Bank & Cash for this country
      const bankAndCashRows: string[][] = [];
      bankItems.forEach((b) => {
        bankAndCashRows.push([
          'Bank Account',
          b.title,
          b.bankName || '-',
          b.accountNumber ? `•••• ${b.accountNumber.slice(-4)}` : '-',
          formatCurrency(b.amount, b.currency || cCurr),
        ]);
      });
      cashItems.forEach((c) => {
        bankAndCashRows.push([
          'Physical Cash',
          c.title,
          'Liquid Reserve',
          '-',
          formatCurrency(c.amount, c.currency || cCurr),
        ]);
      });

      renderTable(
        `${cName} - Bank Accounts & Cash Reserves`,
        ['Type', 'Account / Cash Name', 'Institution / Source', 'Account No.', `Balance (${cCurr})`],
        bankAndCashRows,
        [16, 185, 129], // Emerald
        `Total Operating Liquidity (${cName})`,
        formatCurrency(totalBank + totalCash, cCurr)
      );

      // B. Fixed Deposits for this country
      const fdRows = fdItems.map((f) => [
        f.title,
        f.bankName || 'Bank',
        f.interestRate ? `${f.interestRate}% p.a.` : '-',
        f.maturityDate || '-',
        f.isStandalone ? 'Stand-Alone (Valuation Only)' : 'Consolidated with Wealth',
        formatCurrency(f.amount, f.currency || cCurr),
      ]);

      const fdTotalLabel =
        totalStandaloneFD > 0
          ? `${formatCurrency(totalFD, cCurr)} (${formatCurrency(totalConsolidatedFD, cCurr)} Consolidated in Net Position)`
          : formatCurrency(totalFD, cCurr);

      renderTable(
        `${cName} - Fixed Deposit (FD) Investments`,
        ['FD Title', 'Bank / Provider', 'Interest Rate', 'Maturity Date', 'Accounting Mode', `Deposit Amount (${cCurr})`],
        fdRows,
        [147, 51, 234], // Purple
        `Total Fixed Deposits (${cName})`,
        fdTotalLabel
      );

      // C. Gold & Assets for this country
      const assetRows = assetItems.map((a) => {
        const cost = a.purchasePrice ? formatCurrency(a.purchasePrice, a.currency || cCurr) : '-';
        const val = formatCurrency(a.amount, a.currency || cCurr);
        return [
          a.assetCategory || 'Asset',
          a.title,
          a.purityOrUnits || '-',
          cost,
          val,
        ];
      });

      renderTable(
        `${cName} - Gold & Asset Portfolio`,
        ['Category', 'Asset Title', 'Purity / Units / Area', 'Cost Basis', `Market Value (${cCurr})`],
        assetRows,
        [217, 119, 6], // Amber
        `Total Assets Valuation (${cName})`,
        formatCurrency(totalAssets, cCurr)
      );

      // D. Credit Cards for this country
      const cardRows = cardItems.map((c) => [
        c.title,
        c.bankName || 'Bank',
        c.creditLimit ? formatCurrency(c.creditLimit, c.currency || cCurr) : '-',
        c.dueDate || '-',
        formatCurrency(c.amount, c.currency || cCurr),
      ]);

      renderTable(
        `${cName} - Credit Cards (Outstanding Dues)`,
        ['Card Name', 'Issuing Bank', 'Credit Limit', 'Due Date', `Outstanding Balance (${cCurr})`],
        cardRows,
        [225, 29, 72], // Rose
        `Total Credit Card Dues (${cName})`,
        formatCurrency(totalCards, cCurr)
      );

      // E. Loans for this country
      const loanRows = loanItems.map((l) => [
        l.title,
        l.loanType === 'emi' ? 'EMI Loan' : 'Lump Sum Loan',
        l.bankName || 'Lender',
        l.interestRate ? `${l.interestRate}%` : '-',
        formatCurrency(l.amount, l.currency || cCurr),
      ]);

      renderTable(
        `${cName} - Loans & Debt Liabilities`,
        ['Loan Title', 'Loan Type', 'Lender Bank', 'Interest Rate', `Remaining Balance (${cCurr})`],
        loanRows,
        [51, 65, 85], // Slate
        `Total Loan Liabilities (${cName})`,
        formatCurrency(totalLoans, cCurr)
      );

      // Spacing between country sections
      currentY += 4;
    });
  }

  // =========================================================================
  // SECTION 2: CATEGORY EXPENSE ANALYSIS REPORT
  // =========================================================================
  if (reportType === 'category_expenses' || reportType === 'comprehensive') {
    // If comprehensive, start on a fresh page
    if (reportType === 'comprehensive') {
      doc.addPage();
      currentY = 16;
    }

    // Filter transactions for expenses
    const rawExpenseTxs = transactions.filter(
      (t) =>
        t.type === 'spend' ||
        t.type === 'card_payment' ||
        t.type === 'loan_emi' ||
        t.type === 'loan_lump_sum' ||
        t.type === 'atm_withdrawal'
    );

    // Apply country filter if selected
    const countryFilteredTxs = rawExpenseTxs.filter(
      (t) =>
        selectedCountry === 'ALL' ||
        (t.country || 'UAE').toLowerCase() === selectedCountry.toLowerCase()
    );

    // Apply date range filter
    const expenseTxs = filterTransactionsByDate(countryFilteredTxs, dateRange);

    // Header Banner for Category Expense Report
    doc.setFillColor(30, 27, 75); // indigo-950
    doc.rect(0, 0, 210, 36, 'F');

    // Accent line
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 34, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MYFIN CATEGORY EXPENSE ANALYSIS REPORT', 14, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(199, 210, 254); // indigo-200
    const dateRangeLabel =
      dateRange === 'this_month'
        ? 'Current Month'
        : dateRange === 'last_month'
        ? 'Previous Month'
        : dateRange === 'this_year'
        ? 'Current Year (YTD)'
        : 'All Time Recorded Spends';

    doc.text(
      `Period: ${dateRangeLabel} • Country Scope: ${selectedCountry === 'ALL' ? 'All Countries' : selectedCountry}`,
      14,
      22
    );
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • Category Breakdown & Ledgers`,
      14,
      28
    );

    // Category Report Badge
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.roundedRect(138, 9, 58, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('EXPENSE AUDIT', 141, 15);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${expenseTxs.length} Transactions Analyzed`, 141, 20);

    currentY = 44;

    // Group expenses by Category
    const categoryMap = new Map<
      string,
      {
        total: number;
        count: number;
        currency: CurrencyCode;
        countryTotals: Map<string, number>;
        txList: Transaction[];
      }
    >();

    let grandTotalExpense = 0;
    const expenseByCurrency = new Map<CurrencyCode, number>();

    expenseTxs.forEach((tx) => {
      const cat = tx.category?.trim() || 'General Expense';
      const txCurr = tx.currency || currency;
      const txCountry = tx.country || 'UAE';

      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          total: 0,
          count: 0,
          currency: txCurr,
          countryTotals: new Map<string, number>(),
          txList: [],
        });
      }

      const catObj = categoryMap.get(cat)!;
      catObj.total += tx.amount;
      catObj.count += 1;
      catObj.txList.push(tx);

      const curCountryVal = catObj.countryTotals.get(txCountry) || 0;
      catObj.countryTotals.set(txCountry, curCountryVal + tx.amount);

      grandTotalExpense += tx.amount;
      const currSum = expenseByCurrency.get(txCurr) || 0;
      expenseByCurrency.set(txCurr, currSum + tx.amount);
    });

    // Sort categories by total spent descending
    const sortedCategories = Array.from(categoryMap.entries()).sort(
      (a, b) => b[1].total - a[1].total
    );

    const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'None';
    const topCatPct =
      grandTotalExpense > 0 && sortedCategories.length > 0
        ? ((sortedCategories[0][1].total / grandTotalExpense) * 100).toFixed(1)
        : '0';

    // Summary Card Block
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 26, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL EXPENSES TRACKED', 20, currentY + 7);
    doc.text('TOTAL ENTRIES', 80, currentY + 7);
    doc.text('HIGHEST SPEND CATEGORY', 130, currentY + 7);

    // Multi-currency display
    const currencyTotalsText = Array.from(expenseByCurrency.entries())
      .map(([currCode, sum]) => formatCurrency(sum, currCode))
      .join('  |  ') || formatCurrency(0, currency);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(currencyTotalsText, 20, currentY + 16);

    doc.setTextColor(30, 41, 59);
    doc.text(`${expenseTxs.length} Transactions`, 80, currentY + 16);

    doc.setTextColor(79, 70, 229);
    doc.text(`${topCategory} (${topCatPct}%)`, 130, currentY + 16);

    currentY += 34;

    // 2.1 Category Breakdown Table
    if (sortedCategories.length > 0) {
      const categoryRows = sortedCategories.map(([catName, data]) => {
        const pct = grandTotalExpense > 0 ? ((data.total / grandTotalExpense) * 100).toFixed(1) : '0.0';
        const avg = data.count > 0 ? data.total / data.count : 0;
        const countryBreakdown = Array.from(data.countryTotals.entries())
          .map(([c, amt]) => `${c}: ${formatCurrency(amt, resolveCountryCurrency(c, currency))}`)
          .join(', ');

        return [
          catName,
          `${data.count} tx`,
          formatCurrency(data.total, currency),
          `${pct}%`,
          formatCurrency(avg, currency),
          countryBreakdown || 'General',
        ];
      });

      renderTable(
        '1. EXPENSES CATEGORY BREAKDOWN & SHARE (%)',
        ['Expense Category', 'Frequency', 'Total Spent', '% Share', 'Average / Tx', 'Country Breakdown'],
        categoryRows,
        [79, 70, 229], // Indigo
        'Total Category Outflows',
        currencyTotalsText
      );
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('No expense transactions recorded for the selected scope/period.', 14, currentY);
      currentY += 10;
    }

    // 2.2 Detailed Itemized Expense Ledger (Recent / All)
    if (expenseTxs.length > 0) {
      checkPageBreak(30);

      const recentTxs = [...expenseTxs].sort((a, b) => {
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });

      const txRows = recentTxs.slice(0, 100).map((t) => [
        t.date ? t.date.split('T')[0] : '-',
        t.category || 'General',
        t.description || t.itemTitle || '-',
        t.itemTitle || t.sourceAccountTitle || '-',
        t.country || 'UAE',
        formatCurrency(t.amount, t.currency || resolveCountryCurrency(t.country, currency)),
      ]);

      renderTable(
        '2. ITEMIZED EXPENSE TRANSACTIONS LEDGER',
        ['Date', 'Category', 'Description / Merchant', 'Account / Card', 'Country', 'Amount'],
        txRows,
        [15, 23, 42], // Slate-900
        `Itemized Total (${recentTxs.length} items)`,
        currencyTotalsText
      );
    }
  }

  // =========================================================================
  // DOCUMENT FOOTERS (Page Numbers & Disclaimer)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MYFIN Multi-Country Wealth & Category Expense Tracker | Page ${i} of ${totalPages} | Confidential Financial Document`,
      14,
      288
    );
  }

  return doc;
}

export interface GenerateGiftsPdfOptions {
  items: FinancialItem[];
  currency: CurrencyCode;
  filterDirection?: 'all' | 'received' | 'given';
  filterOccasion?: string;
  filterCountry?: string;
}

export function generateGiftsPdf({
  items,
  currency,
  filterDirection = 'all',
  filterOccasion = 'all',
  filterCountry = 'all',
}: GenerateGiftsPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const allGifts = items.filter((i) => i.type === 'gift');
  const filteredGifts = allGifts.filter((g) => {
    const matchDir = filterDirection === 'all' || g.giftDirection === filterDirection;
    const matchOcc = filterOccasion === 'all' || g.occasion === filterOccasion;
    const matchCountry = filterCountry === 'all' || g.country === filterCountry;
    return matchDir && matchOcc && matchCountry;
  });

  const receivedGifts = filteredGifts.filter((g) => g.giftDirection === 'received');
  const givenGifts = filteredGifts.filter((g) => g.giftDirection === 'given');
  const totalReceived = receivedGifts.reduce((acc, g) => acc + (g.amount || 0), 0);
  const totalGiven = givenGifts.reduce((acc, g) => acc + (g.amount || 0), 0);

  // Header Banner: Royal Purple & Navy Slate
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  // Decorative Purple Accent Bar
  doc.setFillColor(168, 85, 247); // purple-500
  doc.rect(0, 34, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MYFIN GIFTS REGISTRY REPORT', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(192, 132, 252); // purple-300
  doc.text(`Occasions, Weddings, Festivals & Family Registry`, 14, 23);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 29);

  // Badge on top right
  doc.setFillColor(147, 51, 234); // purple-600
  doc.roundedRect(138, 10, 58, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL REGISTRY', 142, 16);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${filteredGifts.length} Records Catalogued`, 142, 21);

  // Metrics summary block
  let currentY = 42;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 24, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FILTER SCOPE', 20, currentY + 6);
  doc.text('TOTAL RECEIVED', 75, currentY + 6);
  doc.text('TOTAL GIVEN', 130, currentY + 6);

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const scopeText = `${filterOccasion !== 'all' ? filterOccasion : 'All Events'} (${filterCountry !== 'all' ? filterCountry : 'Global'})`;
  doc.text(scopeText.length > 22 ? scopeText.substring(0, 22) + '...' : scopeText, 20, currentY + 14);

  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`${receivedGifts.length} items | ${formatCurrency(totalReceived, currency)}`, 75, currentY + 14);

  doc.setTextColor(168, 85, 247); // purple
  doc.text(`${givenGifts.length} items | ${formatCurrency(totalGiven, currency)}`, 130, currentY + 14);

  currentY += 30;

  // 1. GIFTS RECEIVED TABLE
  if (receivedGifts.length > 0 && (filterDirection === 'all' || filterDirection === 'received')) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('1. GIFTS RECEIVED (INCOMING)', 14, currentY);
    currentY += 3;

    const receivedRows = receivedGifts.map((g) => {
      const itemCurr = g.currency || currency;
      const valStr = g.amount ? formatCurrency(g.amount, itemCurr) : 'Sentimental';
      const desc = g.giftDescription || g.subtitle || '-';
      const notes = g.notes ? ` (${g.notes})` : '';
      return [
        g.country || 'Global',
        g.personName || g.title,
        g.occasion || 'Event',
        `${desc}${notes}`,
        g.dueDate || (g.createdAt ? g.createdAt.split('T')[0] : '-'),
        valStr,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Country', 'From (Person / Family)', 'Occasion', 'Item Description / Notes', 'Date', 'Value']],
      body: receivedRows,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`Subtotal Received: ${formatCurrency(totalReceived, currency)} (${receivedGifts.length} records)`, 14, currentY);
    currentY += 8;
  }

  // 2. GIFTS GIVEN TABLE
  if (givenGifts.length > 0 && (filterDirection === 'all' || filterDirection === 'given')) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(147, 51, 234);
    doc.text('2. GIFTS GIVEN (OUTGOING / RETURNED)', 14, currentY);
    currentY += 3;

    const givenRows = givenGifts.map((g) => {
      const itemCurr = g.currency || currency;
      const valStr = g.amount ? formatCurrency(g.amount, itemCurr) : 'Sentimental';
      const desc = g.giftDescription || g.subtitle || '-';
      const notes = g.notes ? ` (${g.notes})` : '';
      return [
        g.country || 'Global',
        g.personName || g.title,
        g.occasion || 'Event',
        `${desc}${notes}`,
        g.dueDate || (g.createdAt ? g.createdAt.split('T')[0] : '-'),
        valStr,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Country', 'To (Recipient / Family)', 'Occasion', 'Item Description / Notes', 'Date', 'Value']],
      body: givenRows,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [250, 245, 255],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`Subtotal Given: ${formatCurrency(totalGiven, currency)} (${givenGifts.length} records)`, 14, currentY);
    currentY += 8;
  }

  // Footer on each page
  const totalGiftPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalGiftPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MYFIN Gifts & Occasions Registry | Page ${i} of ${totalGiftPages} | Confidential Registry Record`,
      14,
      288
    );
  }

  return doc;
}
