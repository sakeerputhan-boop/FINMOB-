import { FinancialItem } from '../types';

export const SAMPLE_ITEMS: Omit<FinancialItem, 'id' | 'userId'>[] = [
  {
    type: 'bank_account',
    title: 'HDFC Bank - Savings',
    amount: 154500,
    subtitle: 'Primary Salary Account',
    accountNumber: '•••• 8921',
    bankName: 'HDFC Bank',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'bank_account',
    title: 'ICICI Bank - Wealth',
    amount: 85200,
    subtitle: 'Emergency Savings Fund',
    accountNumber: '•••• 4012',
    bankName: 'ICICI Bank',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'cash_entry',
    title: 'Physical Cash in Wallet & Vault',
    amount: 24500,
    subtitle: 'Liquid Currency Notes',
    notes: 'Vault cash reserves & wallet daily expense cash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'fixed_deposit',
    title: 'SBI High Yield FD',
    amount: 350000,
    subtitle: 'Maturity: Oct 2027',
    bankName: 'State Bank of India',
    interestRate: 7.25,
    maturityDate: '2027-10-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'asset',
    title: '24K Physical Gold Bar',
    amount: 285000,
    subtitle: 'Independent Asset Holdings',
    assetCategory: 'Gold & Jewellery',
    purityOrUnits: '35 Grams 24K',
    purchasePrice: 220000,
    notes: 'Stored in secure bank locker. Independent asset holding, no active credit/debit operations.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'asset',
    title: 'Commercial Land Parcel',
    amount: 1250000,
    subtitle: 'Real Estate Valuation',
    assetCategory: 'Real Estate / Land',
    purityOrUnits: '1,200 Sq. Ft',
    purchasePrice: 950000,
    notes: 'Valued per latest local registry rates. Pure asset valuation holding.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'credit_card',
    title: 'HDFC Regalia Gold Credit Card',
    amount: 42000, // Balance due
    subtitle: 'Limit: ₹4,000,000 | Due in 12 days',
    creditLimit: 400000,
    dueDate: '2026-08-28',
    bankName: 'HDFC Bank',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    type: 'emi_loan',
    title: 'Home Loan EMI',
    amount: 850000, // Outstanding Loan Liability
    subtitle: 'Interest: 8.5% p.a. | SBI Home Finance',
    bankName: 'SBI Home Finance',
    interestRate: 8.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
