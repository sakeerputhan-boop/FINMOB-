export type ItemType =
  | 'bank_account'
  | 'credit_card'
  | 'emi_loan'
  | 'fixed_deposit'
  | 'asset'
  | 'cash_entry'
  | 'reminder'
  | 'gift'
  | 'iou';

export type LoanType = 'emi' | 'lump_sum';

export type AssetCategory =
  | 'Fixed Deposit'
  | 'Gold & Jewellery'
  | 'Precious Metals'
  | 'Real Estate / Land'
  | 'Stocks & Bonds'
  | 'Vehicles'
  | 'Crypto / Digital Assets'
  | 'Other Asset';

export type CurrencyCode =
  | 'AED'
  | 'INR'
  | 'USD'
  | 'SAR'
  | 'QAR'
  | 'KWD'
  | 'OMR'
  | 'BHD'
  | 'GBP'
  | 'EUR'
  | 'SGD'
  | 'CAD'
  | 'AUD';

export interface CountryConfig {
  code: string; // 'AE', 'IN', 'US', etc.
  name: string;
  flag: string;
  currency: CurrencyCode;
  currencySymbol: string;
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToINR: number; // approximate conversion base
}

export interface FinancialItem {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  amount: number; // Current balance / value / due / outstanding
  country?: string; // e.g. 'UAE', 'India', 'USA', 'Saudi Arabia', etc.
  currency?: CurrencyCode; // e.g. 'AED', 'INR', 'USD', etc.
  subtitle?: string;
  accountNumber?: string;
  bankName?: string;
  
  // FD & Investment details
  interestRate?: number;
  maturityDate?: string;
  maturityAmount?: number;
  
  // Asset / Gold details
  assetCategory?: AssetCategory;
  purityOrUnits?: string; // e.g. '22K Gold 50g', '1200 Sq.Ft', '50 Shares'
  purchasePrice?: number;
  
  // Credit Card details
  creditLimit?: number;
  cashbackRewardPoints?: number;
  dueDate?: string;
  minimumDue?: number;
  
  // Loan details (EMI vs Lump sum)
  loanType?: LoanType; // 'emi' or 'lump_sum'
  interestCalculationType?: 'flat' | 'diminishing'; // Flat vs Diminishing interest
  principalAmount?: number;
  monthlyEmi?: number;
  totalMonths?: number;
  remainingMonths?: number;
  emiDueDay?: number; // 1 to 31
  lenderName?: string;
  totalInterestPayable?: number;
  totalPayableAmount?: number;
  
  // Cash details
  cashLocation?: string; // 'Wallet', 'Vault', 'Office Safe'
  
  // Reminder details (Financial & Non-Financial)
  isNonFinancial?: boolean;
  reminderCategory?:
    | 'Financial'
    | 'Documents & ID'
    | 'Vehicle & Transport'
    | 'Insurance & Health'
    | 'Tenancy & Property'
    | 'Personal & Family'
    | 'Other';
  isCompleted?: boolean;

  // Gift details (Received & Given records)
  giftDirection?: 'received' | 'given';
  personName?: string;
  occasion?: string;
  giftDescription?: string;
  returnGiftStatus?: 'not_applicable' | 'pending_return' | 'returned';

  // IOU (Borrow & Lend) details
  iouType?: 'borrow' | 'lend'; // borrow = I borrowed (payable), lend = I lent (receivable)
  iouPerson?: string;
  iouStatus?: 'pending' | 'partially_paid' | 'settled';
  iouDueDate?: string;
  iouSettledAmount?: number;

  notes?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'spend'
  | 'receive'
  | 'card_payment'
  | 'cashback_reward'
  | 'loan_emi'
  | 'loan_lump_sum'
  | 'atm_withdrawal'
  | 'transfer'
  | 'borrow'
  | 'lend';

export interface Transaction {
  id: string;
  userId: string;
  itemId: string; // Target account/card/loan/cash
  itemTitle: string;
  itemType: ItemType;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  country: string;
  category?: string; // 'Groceries', 'Salary', 'Rent', 'Travel', 'Utilities', 'Shopping', etc.
  description: string;
  date: string; // ISO date string
  sourceAccountId?: string;
  sourceAccountTitle?: string;
  rewardPointsUsed?: number;
  cashbackAmount?: number;
  createdAt: string;
}

export type AppTheme = 'modern_dark' | 'clean_light' | 'emerald_growth' | 'royal_indigo';

export interface UserSettings {
  currency: CurrencyCode;
  defaultCountry?: string;
  selectedCountry?: string;
  currencySymbol?: string;
  theme?: AppTheme;
  lastSynced?: string;
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'guest';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}
