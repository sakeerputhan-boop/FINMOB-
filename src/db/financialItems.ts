import { db } from './index.ts';
import { financialItems } from './schema.ts';
import { eq, and } from 'drizzle-orm';
import { FinancialItem } from '../types.ts';

export async function getUserFinancialItems(userUid: string): Promise<FinancialItem[]> {
  try {
    const rows = await db.select()
      .from(financialItems)
      .where(eq(financialItems.userUid, userUid));

    return rows.map((row) => ({
      id: row.id,
      userId: row.userUid,
      type: row.type as any,
      title: row.title,
      amount: row.amount,
      subtitle: row.subtitle || undefined,
      accountNumber: row.accountNumber || undefined,
      bankName: row.bankName || undefined,
      interestRate: row.interestRate !== null ? row.interestRate : undefined,
      maturityDate: row.maturityDate || undefined,
      assetCategory: row.assetCategory as any || undefined,
      purityOrUnits: row.purityOrUnits || undefined,
      purchasePrice: row.purchasePrice !== null ? row.purchasePrice : undefined,
      creditLimit: row.creditLimit !== null ? row.creditLimit : undefined,
      dueDate: row.dueDate || undefined,
      notes: row.notes || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    console.error('Database query failed in getUserFinancialItems:', error);
    throw new Error('Failed to retrieve financial items from Cloud SQL.', { cause: error });
  }
}

export async function saveFinancialItem(item: FinancialItem, userUid: string): Promise<FinancialItem> {
  try {
    const now = new Date().toISOString();
    const result = await db.insert(financialItems)
      .values({
        id: item.id,
        userUid: userUid,
        type: item.type,
        title: item.title,
        amount: item.amount,
        subtitle: item.subtitle || null,
        accountNumber: item.accountNumber || null,
        bankName: item.bankName || null,
        interestRate: item.interestRate !== undefined ? item.interestRate : null,
        maturityDate: item.maturityDate || null,
        assetCategory: item.assetCategory || null,
        purityOrUnits: item.purityOrUnits || null,
        purchasePrice: item.purchasePrice !== undefined ? item.purchasePrice : null,
        creditLimit: item.creditLimit !== undefined ? item.creditLimit : null,
        dueDate: item.dueDate || null,
        notes: item.notes || null,
        createdAt: item.createdAt || now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: financialItems.id,
        set: {
          type: item.type,
          title: item.title,
          amount: item.amount,
          subtitle: item.subtitle || null,
          accountNumber: item.accountNumber || null,
          bankName: item.bankName || null,
          interestRate: item.interestRate !== undefined ? item.interestRate : null,
          maturityDate: item.maturityDate || null,
          assetCategory: item.assetCategory || null,
          purityOrUnits: item.purityOrUnits || null,
          purchasePrice: item.purchasePrice !== undefined ? item.purchasePrice : null,
          creditLimit: item.creditLimit !== undefined ? item.creditLimit : null,
          dueDate: item.dueDate || null,
          notes: item.notes || null,
          updatedAt: now,
        },
      })
      .returning();

    const row = result[0];
    return {
      id: row.id,
      userId: row.userUid,
      type: row.type as any,
      title: row.title,
      amount: row.amount,
      subtitle: row.subtitle || undefined,
      accountNumber: row.accountNumber || undefined,
      bankName: row.bankName || undefined,
      interestRate: row.interestRate !== null ? row.interestRate : undefined,
      maturityDate: row.maturityDate || undefined,
      assetCategory: row.assetCategory as any || undefined,
      purityOrUnits: row.purityOrUnits || undefined,
      purchasePrice: row.purchasePrice !== null ? row.purchasePrice : undefined,
      creditLimit: row.creditLimit !== null ? row.creditLimit : undefined,
      dueDate: row.dueDate || undefined,
      notes: row.notes || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Database query failed in saveFinancialItem:', error);
    throw new Error('Failed to save financial item to Cloud SQL.', { cause: error });
  }
}

export async function deleteFinancialItem(id: string, userUid: string): Promise<boolean> {
  try {
    await db.delete(financialItems)
      .where(and(
        eq(financialItems.id, id),
        eq(financialItems.userUid, userUid)
      ));
    return true;
  } catch (error) {
    console.error('Database query failed in deleteFinancialItem:', error);
    throw new Error('Failed to delete financial item from Cloud SQL.', { cause: error });
  }
}

export async function bulkSyncFinancialItems(items: FinancialItem[], userUid: string): Promise<FinancialItem[]> {
  try {
    const saved: FinancialItem[] = [];
    for (const item of items) {
      const res = await saveFinancialItem(item, userUid);
      saved.push(res);
    }
    return saved;
  } catch (error) {
    console.error('Database query failed in bulkSyncFinancialItems:', error);
    throw new Error('Failed to bulk sync items to Cloud SQL.', { cause: error });
  }
}
