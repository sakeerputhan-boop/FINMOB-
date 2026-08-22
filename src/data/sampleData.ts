import { FinancialItem, Transaction } from '../types';

// Zero sample data: clean user-driven financial database
export const SAMPLE_ITEMS: Omit<FinancialItem, 'id' | 'userId'>[] = [];
export const SAMPLE_TRANSACTIONS: Omit<Transaction, 'id' | 'userId'>[] = [];
