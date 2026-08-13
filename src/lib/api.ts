import { FinancialItem } from '../types.ts';

export async function fetchCloudSqlItems(token: string): Promise<FinancialItem[]> {
  const res = await fetch('/api/items', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch items from Cloud SQL');
  }

  const data = await res.json();
  return data.items || [];
}

export async function saveCloudSqlItem(token: string, item: FinancialItem): Promise<FinancialItem> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save item to Cloud SQL');
  }

  const data = await res.json();
  return data.item;
}

export async function deleteCloudSqlItem(token: string, id: string): Promise<boolean> {
  const res = await fetch(`/api/items/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete item from Cloud SQL');
  }

  return true;
}

export async function syncCloudSqlItems(token: string, items: FinancialItem[]): Promise<FinancialItem[]> {
  const res = await fetch('/api/items/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to sync items to Cloud SQL');
  }

  const data = await res.json();
  return data.items;
}
