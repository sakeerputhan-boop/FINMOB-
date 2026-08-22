import { FinancialItem, Transaction, CurrencyCode } from '../types';
import { getCountryByName } from './currency';

/**
 * Escapes a field for CSV compliance (RFC 4180)
 */
function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const stringVal = String(val);
  if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return stringVal;
}

/**
 * Triggers a direct browser file download for CSV content
 */
export function downloadCsvFile(csvContent: string, filename: string) {
  // Include UTF-8 BOM for Microsoft Excel / Google Sheets compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all Financial Accounts, Cards, Assets, Loans, and Reminders to CSV
 */
export function exportItemsToCsv(items: FinancialItem[], defaultCurrency: CurrencyCode = 'AED') {
  const headers = [
    'ID',
    'Type',
    'Title',
    'Subtitle / Bank',
    'Amount',
    'Currency',
    'Country',
    'Consolidation Status',
    'Account / Card Number',
    'Credit Limit / Principal',
    'Interest Rate (%)',
    'Due Date / Maturity Date',
    'Monthly EMI',
    'Remaining Months',
    'Asset Category / Units',
    'Gift / IOU Person',
    'Status / Notes',
    'Created At',
    'Last Updated'
  ];

  const rows = items.map((item) => {
    const consolidationStatus =
      item.type === 'fixed_deposit'
        ? item.isStandalone
          ? 'Stand-Alone (Valuation Only)'
          : 'Consolidated (In Net Worth)'
        : 'Consolidated';

    return [
      escapeCsvField(item.id),
      escapeCsvField(item.type),
      escapeCsvField(item.title),
      escapeCsvField(item.subtitle || item.bankName || item.lenderName || ''),
      escapeCsvField(item.amount),
      escapeCsvField(item.currency || defaultCurrency),
      escapeCsvField(item.country || 'Global'),
      escapeCsvField(consolidationStatus),
      escapeCsvField(item.accountNumber || ''),
      escapeCsvField(item.creditLimit || item.principalAmount || ''),
      escapeCsvField(item.interestRate || ''),
      escapeCsvField(item.dueDate || item.maturityDate || item.iouDueDate || ''),
      escapeCsvField(item.monthlyEmi || ''),
      escapeCsvField(item.remainingMonths || ''),
      escapeCsvField(item.assetCategory || item.purityOrUnits || ''),
      escapeCsvField(item.personName || item.iouPerson || ''),
      escapeCsvField(item.notes || item.giftDescription || item.iouStatus || ''),
      escapeCsvField(item.createdAt || ''),
      escapeCsvField(item.updatedAt || '')
    ].join(',');
  });

  const csvString = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csvString, `MYFIN_Accounts_Backup_${dateStr}.csv`);
}

/**
 * Exports all Transactions and Spends to CSV
 */
export function exportTransactionsToCsv(transactions: Transaction[], defaultCurrency: CurrencyCode = 'AED') {
  const headers = [
    'Transaction ID',
    'Date',
    'Account / Source',
    'Type',
    'Category',
    'Amount',
    'Currency',
    'Country',
    'Description',
    'Created At'
  ];

  const rows = transactions.map((tx) => {
    return [
      escapeCsvField(tx.id),
      escapeCsvField(tx.date),
      escapeCsvField(tx.itemTitle || tx.sourceAccountTitle || ''),
      escapeCsvField(tx.type),
      escapeCsvField(tx.category || 'General'),
      escapeCsvField(tx.amount),
      escapeCsvField(tx.currency || defaultCurrency),
      escapeCsvField(tx.country || 'Global'),
      escapeCsvField(tx.description || ''),
      escapeCsvField(tx.createdAt || '')
    ].join(',');
  });

  const csvString = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csvString, `MYFIN_Transactions_Ledger_${dateStr}.csv`);
}

/**
 * Exports Category-wise Expense Breakdown Report to CSV
 */
export function exportCategoryExpensesToCsv(
  transactions: Transaction[],
  defaultCurrency: CurrencyCode = 'AED',
  selectedCountry: string = 'ALL'
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const lines: string[] = [];

  const expenseTxs = transactions.filter(
    (t) =>
      (t.type === 'spend' ||
        t.type === 'card_payment' ||
        t.type === 'loan_emi' ||
        t.type === 'loan_lump_sum' ||
        t.type === 'atm_withdrawal') &&
      (selectedCountry === 'ALL' || (t.country || 'UAE').toLowerCase() === selectedCountry.toLowerCase())
  );

  // Group by Category
  const categoryMap = new Map<
    string,
    {
      total: number;
      count: number;
      currency: CurrencyCode;
      txs: Transaction[];
    }
  >();

  let grandTotal = 0;
  expenseTxs.forEach((tx) => {
    const cat = tx.category?.trim() || 'General Expense';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        total: 0,
        count: 0,
        currency: tx.currency || defaultCurrency,
        txs: [],
      });
    }
    const catObj = categoryMap.get(cat)!;
    catObj.total += tx.amount;
    catObj.count += 1;
    catObj.txs.push(tx);
    grandTotal += tx.amount;
  });

  const sortedCats = Array.from(categoryMap.entries()).sort((a, b) => b[1].total - a[1].total);

  // Header metadata
  lines.push('=== MYFIN CATEGORY EXPENSE ANALYSIS REPORT ===');
  lines.push(`Generated Date,${new Date().toISOString()}`);
  lines.push(`Country Filter,${selectedCountry}`);
  lines.push(`Total Expenses,${grandTotal}`);
  lines.push(`Total Transactions,${expenseTxs.length}`);
  lines.push('');

  // Table 1: Category Summary Breakdown
  lines.push('--- CATEGORY BREAKDOWN SUMMARY ---');
  lines.push('Category,Transaction Count,Total Spent,Currency,Percentage Share (%),Average Per Transaction');

  sortedCats.forEach(([catName, data]) => {
    const pct = grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(2) : '0.00';
    const avg = data.count > 0 ? (data.total / data.count).toFixed(2) : '0.00';
    lines.push([
      escapeCsvField(catName),
      escapeCsvField(data.count),
      escapeCsvField(data.total),
      escapeCsvField(data.currency),
      escapeCsvField(`${pct}%`),
      escapeCsvField(avg),
    ].join(','));
  });

  lines.push('');
  lines.push('--- DETAILED ITEM EXPENSE TRANSACTIONS ---');
  lines.push('Date,Category,Description / Merchant,Account / Card,Country,Amount,Currency');

  expenseTxs.forEach((tx) => {
    lines.push([
      escapeCsvField(tx.date ? tx.date.split('T')[0] : ''),
      escapeCsvField(tx.category || 'General'),
      escapeCsvField(tx.description || tx.itemTitle || ''),
      escapeCsvField(tx.itemTitle || tx.sourceAccountTitle || ''),
      escapeCsvField(tx.country || 'Global'),
      escapeCsvField(tx.amount),
      escapeCsvField(tx.currency || defaultCurrency),
    ].join(','));
  });

  const csvContent = lines.join('\r\n');
  downloadCsvFile(csvContent, `MYFIN_Category_Expense_Report_${dateStr}.csv`);
}

/**
 * Exports Country-Wise Segregated Wealth Statement to CSV (DO NOT CONSOLIDATE)
 */
export function exportCountryWiseCsv(
  items: FinancialItem[],
  defaultCurrency: CurrencyCode = 'AED'
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const lines: string[] = [];

  lines.push('=== MYFIN COUNTRY-WISE WEALTH & ACCOUNTS REPORT (UNCONSOLIDATED) ===');
  lines.push(`Generated On,${new Date().toISOString()}`);
  lines.push('');

  // Group by Country
  const countryMap = new Map<string, FinancialItem[]>();
  items
    .filter((i) => i.type !== 'reminder')
    .forEach((item) => {
      const c = item.country || 'UAE';
      if (!countryMap.has(c)) {
        countryMap.set(c, []);
      }
      countryMap.get(c)!.push(item);
    });

  countryMap.forEach((cItems, countryName) => {
    const cConfig = getCountryByName(countryName);
    const curr = cConfig?.currency || defaultCurrency;

    lines.push(`--- COUNTRY: ${countryName.toUpperCase()} (${curr}) ---`);
    lines.push('Type,Title,Institution / Bank,Amount,Currency,Accounting Mode,Account / Card Number,Credit Limit / Principal,Interest Rate,Due Date / Maturity,Notes');

    cItems.forEach((i) => {
      const mode = i.type === 'fixed_deposit' ? (i.isStandalone ? 'Stand-Alone (Valuation Only)' : 'Consolidated with Wealth') : 'Standard';
      lines.push([
        escapeCsvField(i.type),
        escapeCsvField(i.title),
        escapeCsvField(i.bankName || i.subtitle || ''),
        escapeCsvField(i.amount),
        escapeCsvField(i.currency || curr),
        escapeCsvField(mode),
        escapeCsvField(i.accountNumber || ''),
        escapeCsvField(i.creditLimit || i.principalAmount || ''),
        escapeCsvField(i.interestRate || ''),
        escapeCsvField(i.dueDate || i.maturityDate || ''),
        escapeCsvField(i.notes || ''),
      ].join(','));
    });
    lines.push('');
  });

  const csvContent = lines.join('\r\n');
  downloadCsvFile(csvContent, `MYFIN_Country_Wealth_Report_${dateStr}.csv`);
}

/**
 * Combined Complete Data Backup in CSV Format
 */
export function exportFullBackupCsv(
  items: FinancialItem[],
  transactions: Transaction[],
  defaultCurrency: CurrencyCode = 'AED'
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const lines: string[] = [];

  // Metadata Header
  lines.push('=== MYFIN COMPLETE WEALTH & LEDGER BACKUP ===');
  lines.push(`Generated On,${new Date().toISOString()}`);
  lines.push(`Total Accounts / Items,${items.length}`);
  lines.push(`Total Transactions,${transactions.length}`);
  lines.push(`Base Currency,${defaultCurrency}`);
  lines.push('');

  // SECTION 1: HOLDINGS & ACCOUNTS
  lines.push('--- SECTION 1: HOLDINGS / ACCOUNTS / CARDS / LOANS ---');
  const itemHeaders = [
    'ID',
    'Type',
    'Title',
    'Subtitle / Institution',
    'Amount',
    'Currency',
    'Country',
    'Account Number',
    'Credit Limit / Principal',
    'Interest Rate (%)',
    'Due Date / Maturity Date',
    'Monthly EMI',
    'Remaining Months',
    'Asset Category / Units',
    'Gift / IOU Person',
    'Notes',
    'Created At',
    'Updated At'
  ];
  lines.push(itemHeaders.join(','));

  items.forEach((item) => {
    lines.push([
      escapeCsvField(item.id),
      escapeCsvField(item.type),
      escapeCsvField(item.title),
      escapeCsvField(item.subtitle || item.bankName || item.lenderName || ''),
      escapeCsvField(item.amount),
      escapeCsvField(item.currency || defaultCurrency),
      escapeCsvField(item.country || 'Global'),
      escapeCsvField(item.accountNumber || ''),
      escapeCsvField(item.creditLimit || item.principalAmount || ''),
      escapeCsvField(item.interestRate || ''),
      escapeCsvField(item.dueDate || item.maturityDate || item.iouDueDate || ''),
      escapeCsvField(item.monthlyEmi || ''),
      escapeCsvField(item.remainingMonths || ''),
      escapeCsvField(item.assetCategory || item.purityOrUnits || ''),
      escapeCsvField(item.personName || item.iouPerson || ''),
      escapeCsvField(item.notes || item.giftDescription || item.iouStatus || ''),
      escapeCsvField(item.createdAt || ''),
      escapeCsvField(item.updatedAt || '')
    ].join(','));
  });

  lines.push('');
  // SECTION 2: TRANSACTIONS & SPENDS
  lines.push('--- SECTION 2: TRANSACTIONS & EXPENSES ---');
  const txHeaders = [
    'Transaction ID',
    'Date',
    'Account / Source',
    'Type',
    'Category',
    'Amount',
    'Currency',
    'Country',
    'Description',
    'Created At'
  ];
  lines.push(txHeaders.join(','));

  transactions.forEach((tx) => {
    lines.push([
      escapeCsvField(tx.id),
      escapeCsvField(tx.date),
      escapeCsvField(tx.itemTitle || tx.sourceAccountTitle || ''),
      escapeCsvField(tx.type),
      escapeCsvField(tx.category || 'General'),
      escapeCsvField(tx.amount),
      escapeCsvField(tx.currency || defaultCurrency),
      escapeCsvField(tx.country || 'Global'),
      escapeCsvField(tx.description || ''),
      escapeCsvField(tx.createdAt || '')
    ].join(','));
  });

  const fullCsv = lines.join('\r\n');
  downloadCsvFile(fullCsv, `MYFIN_Complete_Backup_${dateStr}.csv`);
}
