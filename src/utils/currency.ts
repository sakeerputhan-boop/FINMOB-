import { CurrencyCode, CountryConfig, CurrencyConfig } from '../types';

export const COUNTRIES: CountryConfig[] = [
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', currencySymbol: 'AED' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹' },
  { code: 'US', name: 'USA', flag: '🇺🇸', currency: 'USD', currencySymbol: '$' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', currencySymbol: 'SAR' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR', currencySymbol: 'QAR' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', currency: 'KWD', currencySymbol: 'KWD' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', currency: 'OMR', currencySymbol: 'OMR' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', currency: 'BHD', currencySymbol: 'BHD' },
  { code: 'GB', name: 'UK', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺', currency: 'EUR', currencySymbol: '€' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', currencySymbol: 'S$' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$' },
];

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', rateToINR: 22.8 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToINR: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToINR: 83.5 },
  SAR: { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal', rateToINR: 22.25 },
  QAR: { code: 'QAR', symbol: 'QAR ', name: 'Qatari Riyal', rateToINR: 22.9 },
  KWD: { code: 'KWD', symbol: 'KWD ', name: 'Kuwaiti Dinar', rateToINR: 272.0 },
  OMR: { code: 'OMR', symbol: 'OMR ', name: 'Omani Rial', rateToINR: 217.0 },
  BHD: { code: 'BHD', symbol: 'BHD ', name: 'Bahraini Dinar', rateToINR: 221.5 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToINR: 106.5 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToINR: 91.0 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateToINR: 62.5 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateToINR: 61.2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToINR: 55.0 },
};

export function getCountryByCurrency(currency: CurrencyCode): CountryConfig {
  const found = COUNTRIES.find((c) => c.currency === currency);
  return found || COUNTRIES[1]; // Default India
}

export function getCountryByName(name?: string): CountryConfig {
  if (!name) return COUNTRIES[0]; // Default UAE or India
  const found = COUNTRIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() || c.code.toLowerCase() === name.toLowerCase()
  );
  return found || COUNTRIES[0];
}

export function formatCurrency(amount: number, code: CurrencyCode = 'AED'): string {
  const curr = CURRENCIES[code] || CURRENCIES.AED;
  const num = isNaN(amount) ? 0 : amount;

  if (code === 'INR') {
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(num) ? 0 : 2
    }).format(num);
    return `${curr.symbol}${formatted}`;
  } else if (code === 'KWD' || code === 'OMR' || code === 'BHD') {
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 3,
      minimumFractionDigits: 2
    }).format(num);
    return `${curr.symbol}${formatted}`;
  } else {
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(num) ? 0 : 2
    }).format(num);
    return `${curr.symbol}${formatted}`;
  }
}

// Format native amount with provided currency and optional country flag
export function formatItemAmount(amount: number, currency?: CurrencyCode, country?: string): string {
  const curr = currency || 'AED';
  const flag = country ? getCountryByName(country).flag : '';
  const formatted = formatCurrency(amount, curr);
  return flag ? `${flag} ${formatted}` : formatted;
}

// Calculate standard Equated Monthly Installment (EMI) (Reducing / Diminishing Rate)
export function calculateEmi(principal: number, annualInterestRate: number, tenureMonths: number): number {
  if (!principal || principal <= 0 || !tenureMonths || tenureMonths <= 0) return 0;
  if (!annualInterestRate || annualInterestRate <= 0) {
    return Math.round(principal / tenureMonths);
  }
  const monthlyRate = annualInterestRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

export interface LoanCalcResult {
  interestType: 'flat' | 'diminishing';
  principal: number;
  annualRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
  monthlyInterestAvg: number;
  monthlyPrincipalAvg: number;
}

// Calculate comprehensive loan metrics for Flat vs Diminishing (Reducing Balance) Interest
export function calculateLoanBreakdown(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  interestType: 'flat' | 'diminishing' = 'diminishing'
): LoanCalcResult {
  const p = Math.max(0, principal || 0);
  const r = Math.max(0, annualInterestRate || 0);
  const n = Math.max(1, tenureMonths || 12);

  if (p === 0 || n === 0) {
    return {
      interestType,
      principal: p,
      annualRate: r,
      tenureMonths: n,
      monthlyEmi: 0,
      totalInterest: 0,
      totalPayable: 0,
      monthlyInterestAvg: 0,
      monthlyPrincipalAvg: 0
    };
  }

  if (r === 0) {
    const emi = Math.round(p / n);
    return {
      interestType,
      principal: p,
      annualRate: 0,
      tenureMonths: n,
      monthlyEmi: emi,
      totalInterest: 0,
      totalPayable: p,
      monthlyInterestAvg: 0,
      monthlyPrincipalAvg: emi
    };
  }

  if (interestType === 'flat') {
    // Flat Rate: Interest is calculated on the entire original principal for the entire tenure
    const tenureYears = n / 12;
    const totalInterest = Math.round((p * r * tenureYears) / 100);
    const totalPayable = p + totalInterest;
    const monthlyEmi = Math.round(totalPayable / n);
    return {
      interestType: 'flat',
      principal: p,
      annualRate: r,
      tenureMonths: n,
      monthlyEmi,
      totalInterest,
      totalPayable,
      monthlyInterestAvg: Math.round(totalInterest / n),
      monthlyPrincipalAvg: Math.round(p / n)
    };
  } else {
    // Diminishing / Reducing Balance Rate: Interest is calculated on the remaining balance
    const monthlyRate = r / 12 / 100;
    const emiFactor = Math.pow(1 + monthlyRate, n);
    const emi = (p * monthlyRate * emiFactor) / (emiFactor - 1);
    const roundedEmi = Math.round(emi);
    const totalPayable = Math.round(roundedEmi * n);
    const totalInterest = Math.max(0, totalPayable - p);
    return {
      interestType: 'diminishing',
      principal: p,
      annualRate: r,
      tenureMonths: n,
      monthlyEmi: roundedEmi,
      totalInterest,
      totalPayable,
      monthlyInterestAvg: Math.round(totalInterest / n),
      monthlyPrincipalAvg: Math.round(p / n)
    };
  }
}
