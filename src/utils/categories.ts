import { auth, saveUserCustomCategories } from '../lib/firebase';

export type CategoryType = 'expense' | 'income' | 'reminder' | 'asset';

export interface CategoryItem {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  isCustom?: boolean;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  'General',
  'Food & Dining',
  'Groceries & Supermarket',
  'Shopping & Retail',
  'Fuel & Transportation',
  'Utilities & Electricity/Water',
  'Mobile & Internet Bills',
  'Rent & Housing',
  'Healthcare & Pharmacy',
  'Travel & Flight Tickets',
  'Entertainment & Dining Out',
  'School & Tuition Fees',
  'Personal Care & Fitness',
  'Loan EMI Payment',
  'Credit Card Bill Payment',
  'Cash Withdrawal (ATM)',
  'Gift / Charitable Donation',
  'Vehicle Service & Insurance',
  'Maintenance & Repairs',
  'Other Expense'
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary & Wages',
  'Business / Freelance Revenue',
  'Rental & Real Estate Income',
  'Investment Dividends & Profits',
  'Bonus & Commissions',
  'Cashback & Card Rewards',
  'Gift & Cash Received',
  'Loan / Borrowing Inflow',
  'Refunds & Claims',
  'Interest & Returns',
  'Other Income'
];

export const DEFAULT_REMINDER_CATEGORIES = [
  'Documents & ID / Visa',
  'Vehicle Registration & Mulkiya',
  'Insurance Policies',
  'Tenancy Contract & Ejari',
  'Personal & Family',
  'Subscription & Memberships',
  'Credit Card & Loan Due',
  'Other Expiry'
];

export const DEFAULT_ASSET_CATEGORIES = [
  'Gold & Jewellery',
  'Precious Metals & Bullion',
  'Real Estate / Plots / Villas',
  'Fixed Deposits & Bonds',
  'Stocks & Equity Portfolio',
  'Vehicles & Motors',
  'Crypto / Digital Assets',
  'Other Valuation'
];

const STORAGE_KEY = 'myfin_custom_categories_v2';

export function getCustomCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom categories', e);
    return [];
  }
}

export function saveCustomCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    // Also sync to Firestore if user is authenticated
    if (auth.currentUser?.uid) {
      saveUserCustomCategories(auth.currentUser.uid, categories);
    }
  } catch (e) {
    console.error('Failed to save custom categories', e);
  }
}

export function addCustomCategory(name: string, type: CategoryType): CategoryItem {
  const existing = getCustomCategories();
  const trimmed = name.trim();
  const newCat: CategoryItem = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmed,
    type,
    isCustom: true
  };
  const updated = [...existing, newCat];
  saveCustomCategories(updated);
  return newCat;
}

export function deleteCustomCategory(id: string): void {
  const existing = getCustomCategories();
  const updated = existing.filter((c) => c.id !== id);
  saveCustomCategories(updated);
}

export function getAllCategoriesForType(type: CategoryType): string[] {
  const custom = getCustomCategories().filter((c) => c.type === type).map((c) => c.name);
  let base: string[] = [];
  if (type === 'expense') {
    base = DEFAULT_EXPENSE_CATEGORIES;
  } else if (type === 'income') {
    base = DEFAULT_INCOME_CATEGORIES;
  } else if (type === 'reminder') {
    base = DEFAULT_REMINDER_CATEGORIES;
  } else {
    base = DEFAULT_ASSET_CATEGORIES;
  }

  // Combine and deduplicate
  return Array.from(new Set([...base, ...custom]));
}
