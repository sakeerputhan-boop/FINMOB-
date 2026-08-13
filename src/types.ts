export type ItemType =
  | 'bank_account'
  | 'credit_card'
  | 'emi_loan'
  | 'fixed_deposit'
  | 'asset'
  | 'cash_entry'
  | 'reminder';

export type AssetCategory =
  | 'Gold & Jewellery'
  | 'Real Estate / Land'
  | 'Vehicles'
  | 'Precious Metals'
  | 'Stocks & Bonds'
  | 'Other Asset';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  liveRateToINR: number;
}

export interface FinancialItem {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  amount: number;
  subtitle?: string;
  accountNumber?: string;
  bankName?: string;
  interestRate?: number;
  maturityDate?: string;
  assetCategory?: AssetCategory;
  purityOrUnits?: string; // e.g., '22K Gold', '10 Grams', '2 Acres'
  purchasePrice?: number;
  creditLimit?: number;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  currency: CurrencyCode;
  currencySymbol: string;
  theme: 'dark' | 'light';
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
