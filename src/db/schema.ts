import { relations } from 'drizzle-orm';
import { doublePrecision, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table matching Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  currency: text('currency').default('INR'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Financial Items table for FINMOB (Bank Accounts, FDs, Assets, Cash, Credit, Loans)
export const financialItems = pgTable('financial_items', {
  id: text('id').primaryKey(),
  userUid: text('user_uid').references(() => users.uid).notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  amount: doublePrecision('amount').notNull().default(0),
  subtitle: text('subtitle'),
  accountNumber: text('account_number'),
  bankName: text('bank_name'),
  interestRate: doublePrecision('interest_rate'),
  maturityDate: text('maturity_date'),
  assetCategory: text('asset_category'),
  purityOrUnits: text('purity_or_units'),
  purchasePrice: doublePrecision('purchase_price'),
  creditLimit: doublePrecision('credit_limit'),
  dueDate: text('due_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  items: many(financialItems),
}));

export const financialItemsRelations = relations(financialItems, ({ one }) => ({
  user: one(users, {
    fields: [financialItems.userUid],
    references: [users.uid],
  }),
}));
