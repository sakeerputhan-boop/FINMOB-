import { FinancialItem, Transaction, CurrencyCode } from '../types';

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
    return [
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
