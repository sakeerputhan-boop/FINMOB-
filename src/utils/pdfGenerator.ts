import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency } from './currency';

export interface GeneratePdfOptions {
  items: FinancialItem[];
  currency: CurrencyCode;
  password?: string;
}

export function generateFinancialPdf({ items, currency, password }: GeneratePdfOptions): jsPDF {
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

  // Colors
  const primaryColor = [15, 23, 42]; // slate-900
  const emeraldColor = [16, 185, 129]; // emerald-500
  const purpleColor = [147, 51, 234]; // purple-600
  const amberColor = [217, 119, 6]; // amber-600
  const roseColor = [225, 29, 72]; // rose-600

  // Filter items
  const bankItems = items.filter((i) => i.type === 'bank_account');
  const cashItems = items.filter((i) => i.type === 'cash_entry');
  const fdItems = items.filter((i) => i.type === 'fixed_deposit');
  const assetItems = items.filter((i) => i.type === 'asset');
  const cardItems = items.filter((i) => i.type === 'credit_card');
  const loanItems = items.filter((i) => i.type === 'emi_loan');
  const reminderItems = items.filter((i) => i.type === 'reminder');

  // Summary Totals
  const totalBank = bankItems.reduce((acc, i) => acc + i.amount, 0);
  const totalCash = cashItems.reduce((acc, i) => acc + i.amount, 0);
  const totalFD = fdItems.reduce((acc, i) => acc + i.amount, 0);
  const totalAssets = assetItems.reduce((acc, i) => acc + i.amount, 0);
  const grossWealth = totalBank + totalCash + totalFD + totalAssets;

  const totalCards = cardItems.reduce((acc, i) => acc + i.amount, 0);
  const totalLoans = loanItems.reduce((acc, i) => acc + i.amount, 0);
  const totalLiabilities = totalCards + totalLoans;

  const netWorth = grossWealth - totalLiabilities;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FINMOB WEALTH STATEMENT', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);
  doc.text(`All Financial Entries Included`, 14, 28);

  if (cleanPassword) {
    doc.setFillColor(220, 38, 38); // red badge
    doc.roundedRect(140, 10, 56, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('LOCKED PDF STATEMENT', 143, 16);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Password Protected Document', 143, 21);
  } else {
    doc.setFillColor(16, 185, 129); // emerald badge
    doc.roundedRect(140, 10, 56, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFIED STATEMENT', 143, 16);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('FINMOB PWA Sync Enabled', 143, 21);
  }

  // Net Worth Card Summary Block
  let currentY = 44;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 28, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CONSOLIDATED NET WORTH', 20, currentY + 8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(netWorth >= 0 ? 16 : 225, netWorth >= 0 ? 185 : 29, netWorth >= 0 ? 129 : 72);
  doc.text(formatCurrency(netWorth, currency), 20, currentY + 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Gross Assets: ${formatCurrency(grossWealth, currency)}  |  Liabilities: ${formatCurrency(totalLiabilities, currency)}`, 20, currentY + 24);

  currentY += 34;

  // Function to render table
  const renderTable = (title: string, headers: string[], data: string[][], headerBgColor: number[], totalLabel?: string, totalVal?: string) => {
    if (data.length === 0) return;

    doc.setFontSize(11);
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
        fillColor: headerBgColor as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
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

  // 1. Daily Operating Accounts (Bank & Cash)
  const bankAndCashRows: string[][] = [];
  bankItems.forEach((b) => {
    bankAndCashRows.push([
      'Bank Account',
      b.title,
      b.bankName || '-',
      b.accountNumber ? `•••• ${b.accountNumber.slice(-4)}` : '-',
      formatCurrency(b.amount, currency),
    ]);
  });
  cashItems.forEach((c) => {
    bankAndCashRows.push([
      'Cash Reserve',
      c.title,
      'Physical Cash',
      '-',
      formatCurrency(c.amount, currency),
    ]);
  });

  renderTable(
    '1. DAILY OPERATING ACCOUNTS (BANK & CASH)',
    ['Type', 'Title / Name', 'Institution / Source', 'Account No.', 'Amount'],
    bankAndCashRows,
    [16, 185, 129], // Emerald
    'Total Operating Liquidity',
    formatCurrency(totalBank + totalCash, currency)
  );

  // 2. Fixed Deposits (FDs)
  const fdRows = fdItems.map((f) => [
    f.title,
    f.bankName || 'Bank',
    f.interestRate ? `${f.interestRate}% p.a.` : '-',
    f.maturityDate || '-',
    formatCurrency(f.amount, currency),
  ]);

  renderTable(
    '2. FIXED DEPOSIT INVESTMENTS (INDEPENDENT)',
    ['FD Title', 'Bank / Provider', 'Interest Rate', 'Maturity Date', 'Deposit Amount'],
    fdRows,
    [147, 51, 234], // Purple
    'Total Fixed Deposits (FD)',
    formatCurrency(totalFD, currency)
  );

  // 3. Gold & Independent Assets
  const assetRows = assetItems.map((a) => {
    const cost = a.purchasePrice ? formatCurrency(a.purchasePrice, currency) : '-';
    const val = formatCurrency(a.amount, currency);
    return [
      a.assetCategory || 'Asset',
      a.title,
      a.purityOrUnits || '-',
      cost,
      val,
    ];
  });

  renderTable(
    '3. GOLD & INDEPENDENT ASSETS',
    ['Category', 'Asset Title', 'Purity / Units', 'Cost Basis', 'Current Market Value'],
    assetRows,
    [217, 119, 6], // Amber
    'Total Gold & Asset Portfolio',
    formatCurrency(totalAssets, currency)
  );

  // 4. Credit Cards & Liabilities
  const cardRows = cardItems.map((c) => [
    c.title,
    c.bankName || 'Bank',
    c.creditLimit ? formatCurrency(c.creditLimit, currency) : '-',
    c.dueDate || '-',
    formatCurrency(c.amount, currency),
  ]);

  renderTable(
    '4. CREDIT CARDS (OUTSTANDING DUES)',
    ['Card Name', 'Bank', 'Credit Limit', 'Due Date', 'Outstanding Balance'],
    cardRows,
    [225, 29, 72], // Rose
    'Total Credit Card Dues',
    formatCurrency(totalCards, currency)
  );

  // 5. EMI Loans & Debt
  const loanRows = loanItems.map((l) => [
    l.title,
    l.bankName || 'Lender',
    l.interestRate ? `${l.interestRate}%` : '-',
    formatCurrency(l.amount, currency),
  ]);

  renderTable(
    '5. EMI LOANS & DEBT LIABILITIES',
    ['Loan Title', 'Lender Bank', 'Interest Rate', 'Remaining Balance'],
    loanRows,
    [15, 23, 42], // Slate
    'Total Loan Liabilities',
    formatCurrency(totalLoans, currency)
  );

  // 6. Reminders
  if (reminderItems.length > 0) {
    const reminderRows = reminderItems.map((r) => [
      r.title,
      r.dueDate || '-',
      r.notes || '-',
      formatCurrency(r.amount, currency),
    ]);

    renderTable(
      '6. UPCOMING BILL REMINDERS',
      ['Title', 'Due Date', 'Notes', 'Amount'],
      reminderRows,
      [99, 102, 241], // Indigo
      'Total Reminders Due',
      formatCurrency(reminderItems.reduce((a, b) => a + b.amount, 0), currency)
    );
  }

  // Footer Disclaimer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FINMOB Real-time Wealth Tracker | Page ${i} of ${totalPages} | Confidential Financial Document`,
      14,
      288
    );
  }

  return doc;
}
