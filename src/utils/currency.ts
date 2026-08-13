import { CurrencyCode } from '../types';

export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string; rateToINR: number }> = {
  INR: { symbol: '₹', name: 'Indian Rupee', rateToINR: 1 },
  USD: { symbol: '$', name: 'US Dollar', rateToINR: 0.012 },
  EUR: { symbol: '€', name: 'Euro', rateToINR: 0.011 },
  GBP: { symbol: '£', name: 'British Pound', rateToINR: 0.0095 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', rateToINR: 0.044 }
};

export function formatCurrency(amount: number, code: CurrencyCode = 'INR'): string {
  const curr = CURRENCIES[code] || CURRENCIES.INR;
  const convertedAmount = amount * curr.rateToINR;

  if (code === 'INR') {
    // Format according to Indian numbering system (Lakhs, Crores)
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(Math.round(convertedAmount));
    return `${curr.symbol}${formatted}`;
  } else {
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(Math.round(convertedAmount));
    return `${curr.symbol}${formatted}`;
  }
}
