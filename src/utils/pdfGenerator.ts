import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency, getCountryByName } from './currency';

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

  // Filter items (Excluding reminders as requested)
  const bankItems = items.filter((i) => i.type === 'bank_account');
  const cashItems = items.filter((i) => i.type === 'cash_entry');
  const fdItems = items.filter((i) => i.type === 'fixed_deposit');
  const assetItems = items.filter((i) => i.type === 'asset');
  const cardItems = items.filter((i) => i.type === 'credit_card');
  const loanItems = items.filter((i) => i.type === 'emi_loan');

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
  doc.text('MYFIN WEALTH STATEMENT', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);
  doc.text(`Accounts, Credit Cards, Loans, and Assets Report`, 14, 28);

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
    doc.text('MYFIN Cloud Sync Enabled', 143, 21);
  }

  // Net Worth Card Summary Block
  let currentY = 44;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 28, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FINANCIAL STATEMENT POSITION', 20, currentY + 8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(netWorth >= 0 ? 16 : 225, netWorth >= 0 ? 185 : 29, netWorth >= 0 ? 129 : 72);
  doc.text(formatCurrency(netWorth, currency), 20, currentY + 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Gross Assets: ${formatCurrency(grossWealth, currency)}  |  Total Debt/Liabilities: ${formatCurrency(totalLiabilities, currency)}`, 20, currentY + 24);

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
      b.country || 'UAE',
      'Bank Account',
      b.title,
      b.bankName || '-',
      b.accountNumber ? `•••• ${b.accountNumber.slice(-4)}` : '-',
      formatCurrency(b.amount, b.currency || currency),
    ]);
  });
  cashItems.forEach((c) => {
    bankAndCashRows.push([
      c.country || 'UAE',
      'Cash Reserve',
      c.title,
      'Physical Cash',
      '-',
      formatCurrency(c.amount, c.currency || currency),
    ]);
  });

  renderTable(
    '1. BANK ACCOUNTS & CASH RESERVES',
    ['Country', 'Type', 'Title / Name', 'Institution / Source', 'Account No.', 'Amount'],
    bankAndCashRows,
    [16, 185, 129], // Emerald
    'Total Operating Liquidity',
    formatCurrency(totalBank + totalCash, currency)
  );

  // 2. Fixed Deposits (FDs)
  const fdRows = fdItems.map((f) => [
    f.country || 'UAE',
    f.title,
    f.bankName || 'Bank',
    f.interestRate ? `${f.interestRate}% p.a.` : '-',
    f.maturityDate || '-',
    formatCurrency(f.amount, f.currency || currency),
  ]);

  renderTable(
    '2. FIXED DEPOSIT INVESTMENTS',
    ['Country', 'FD Title', 'Bank / Provider', 'Interest Rate', 'Maturity Date', 'Deposit Amount'],
    fdRows,
    [147, 51, 234], // Purple
    'Total Fixed Deposits (FD)',
    formatCurrency(totalFD, currency)
  );

  // 3. Gold & Independent Assets
  const assetRows = assetItems.map((a) => {
    const cost = a.purchasePrice ? formatCurrency(a.purchasePrice, a.currency || currency) : '-';
    const val = formatCurrency(a.amount, a.currency || currency);
    return [
      a.country || 'UAE',
      a.assetCategory || 'Asset',
      a.title,
      a.purityOrUnits || '-',
      cost,
      val,
    ];
  });

  renderTable(
    '3. GOLD & INDEPENDENT ASSETS',
    ['Country', 'Category', 'Asset Title', 'Purity / Units', 'Cost Basis', 'Current Market Value'],
    assetRows,
    [217, 119, 6], // Amber
    'Total Gold & Asset Portfolio',
    formatCurrency(totalAssets, currency)
  );

  // 4. Credit Cards & Liabilities
  const cardRows = cardItems.map((c) => [
    c.country || 'UAE',
    c.title,
    c.bankName || 'Bank',
    c.creditLimit ? formatCurrency(c.creditLimit, c.currency || currency) : '-',
    c.dueDate || '-',
    formatCurrency(c.amount, c.currency || currency),
  ]);

  renderTable(
    '4. CREDIT CARDS (OUTSTANDING DUES)',
    ['Country', 'Card Name', 'Bank', 'Credit Limit', 'Due Date', 'Outstanding Balance'],
    cardRows,
    [225, 29, 72], // Rose
    'Total Credit Card Dues',
    formatCurrency(totalCards, currency)
  );

  // 5. EMI Loans & Debt
  const loanRows = loanItems.map((l) => [
    l.country || 'UAE',
    l.title,
    l.loanType === 'emi' ? 'EMI Loan' : 'Lump Sum Loan',
    l.bankName || 'Lender',
    l.interestRate ? `${l.interestRate}%` : '-',
    formatCurrency(l.amount, l.currency || currency),
  ]);

  renderTable(
    '5. LOANS & DEBT LIABILITIES',
    ['Country', 'Loan Title', 'Type', 'Lender Bank', 'Interest Rate', 'Remaining Balance'],
    loanRows,
    [15, 23, 42], // Slate
    'Total Loan Liabilities',
    formatCurrency(totalLoans, currency)
  );

  // Footer Disclaimer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MYFIN Real-time Multi-Country Wealth Tracker | Page ${i} of ${totalPages} | Confidential Financial Document`,
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
  filterCountry = 'all'
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
    // Check if new page is needed
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
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MYFIN Gifts & Occasions Registry | Page ${i} of ${totalPages} | Confidential Registry Record`,
      14,
      288
    );
  }

  return doc;
}
