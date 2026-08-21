import { FinancialItem } from '../types';

const LAST_USED_CARD_KEY = 'myfin_last_used_card_id';
const LAST_USED_CAT_PREFIX = 'myfin_last_used_cat_';
const RECENT_CATS_PREFIX = 'myfin_recent_cats_';
const LAST_USED_ITEM_PREFIX = 'myfin_last_used_item_';

// 1. Cards Tracking
export function recordLastUsedCard(cardId: string): void {
  try {
    if (!cardId) return;
    localStorage.setItem(LAST_USED_CARD_KEY, cardId);
  } catch (e) {
    console.error('Failed to save last used card', e);
  }
}

export function getLastUsedCardId(): string | null {
  try {
    return localStorage.getItem(LAST_USED_CARD_KEY);
  } catch (e) {
    return null;
  }
}

// 2. Categories Tracking (by type e.g. expense, income, reminder, asset, etc.)
export function recordLastUsedCategory(category: string, type: string = 'expense'): void {
  try {
    if (!category || typeof category !== 'string') return;
    const cleanCat = category.trim();
    if (!cleanCat) return;

    // Save singular last used
    localStorage.setItem(`${LAST_USED_CAT_PREFIX}${type}`, cleanCat);
    localStorage.setItem(`${LAST_USED_CAT_PREFIX}global`, cleanCat);

    // Save in recents queue (up to 8 recents, deduplicated)
    const recentKey = `${RECENT_CATS_PREFIX}${type}`;
    let recents: string[] = [];
    try {
      const raw = localStorage.getItem(recentKey);
      if (raw) recents = JSON.parse(raw);
    } catch {}

    recents = [cleanCat, ...recents.filter((c) => c.toLowerCase() !== cleanCat.toLowerCase())].slice(0, 8);
    localStorage.setItem(recentKey, JSON.stringify(recents));
  } catch (e) {
    console.error('Failed to save last used category', e);
  }
}

export function getLastUsedCategory(type: string = 'expense'): string | null {
  try {
    const specific = localStorage.getItem(`${LAST_USED_CAT_PREFIX}${type}`);
    if (specific) return specific;
    return localStorage.getItem(`${LAST_USED_CAT_PREFIX}global`);
  } catch (e) {
    return null;
  }
}

export function getRecentCategories(type: string = 'expense', limit: number = 6): string[] {
  try {
    const raw = localStorage.getItem(`${RECENT_CATS_PREFIX}${type}`);
    if (!raw) return [];
    const list: string[] = JSON.parse(raw);
    return list.slice(0, limit);
  } catch (e) {
    return [];
  }
}

// 3. Generic Item Tracking (Bank account, Cash, Loan, Asset, Gift)
export function recordLastUsedItem(itemId: string, itemType?: string): void {
  try {
    if (!itemId) return;
    if (itemType) {
      localStorage.setItem(`${LAST_USED_ITEM_PREFIX}${itemType}`, itemId);
    }
    localStorage.setItem(`${LAST_USED_ITEM_PREFIX}global`, itemId);
  } catch (e) {
    console.error('Failed to save last used item', e);
  }
}

export function getLastUsedItemId(itemType?: string): string | null {
  try {
    if (itemType) {
      const specific = localStorage.getItem(`${LAST_USED_ITEM_PREFIX}${itemType}`);
      if (specific) return specific;
    }
    return localStorage.getItem(`${LAST_USED_ITEM_PREFIX}global`);
  } catch (e) {
    return null;
  }
}

// 4. Sorting Helpers: Puts the last used card / items on TOP with priority
export function sortCardsWithLastUsedOnTop(cards: FinancialItem[], lastUsedId?: string | null): FinancialItem[] {
  const targetId = lastUsedId || getLastUsedCardId();
  
  return [...cards].sort((a, b) => {
    // 1. Explicitly last used card ID
    if (targetId) {
      if (a.id === targetId && b.id !== targetId) return -1;
      if (b.id === targetId && a.id !== targetId) return 1;
    }
    
    // 2. lastUsedAt timestamp if present
    if (a.lastUsedAt && b.lastUsedAt) {
      return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
    }
    if (a.lastUsedAt) return -1;
    if (b.lastUsedAt) return 1;

    // 3. updatedAt timestamp
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    return 0;
  });
}

export function sortItemsWithLastUsedOnTop(items: FinancialItem[], itemType?: string): FinancialItem[] {
  const targetId = getLastUsedItemId(itemType);

  return [...items].sort((a, b) => {
    // 1. Explicitly recorded last used ID
    if (targetId) {
      if (a.id === targetId && b.id !== targetId) return -1;
      if (b.id === targetId && a.id !== targetId) return 1;
    }

    // 2. lastUsedAt timestamp
    if (a.lastUsedAt && b.lastUsedAt) {
      return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
    }
    if (a.lastUsedAt) return -1;
    if (b.lastUsedAt) return 1;

    // 3. updatedAt timestamp
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    return 0;
  });
}

// 5. Category Sorting: Puts last used category at the very top of lists/dropdowns
export function sortCategoriesWithLastUsedOnTop(
  categories: string[],
  type: string = 'expense',
  currentSelected?: string
): string[] {
  const lastUsed = getLastUsedCategory(type);
  const recents = getRecentCategories(type, 5);

  const seen = new Set<string>();
  const result: string[] = [];

  // Priority 1: Current selected if any
  if (currentSelected && categories.some(c => c.toLowerCase() === currentSelected.toLowerCase())) {
    const matched = categories.find(c => c.toLowerCase() === currentSelected.toLowerCase()) || currentSelected;
    result.push(matched);
    seen.add(matched.toLowerCase());
  }

  // Priority 2: Last used category
  if (lastUsed && !seen.has(lastUsed.toLowerCase())) {
    const matched = categories.find(c => c.toLowerCase() === lastUsed.toLowerCase()) || lastUsed;
    result.push(matched);
    seen.add(matched.toLowerCase());
  }

  // Priority 3: Other recently used categories
  for (const r of recents) {
    if (!seen.has(r.toLowerCase())) {
      const matched = categories.find(c => c.toLowerCase() === r.toLowerCase()) || r;
      result.push(matched);
      seen.add(matched.toLowerCase());
    }
  }

  // Priority 4: All other remaining categories
  for (const c of categories) {
    if (!seen.has(c.toLowerCase())) {
      result.push(c);
      seen.add(c.toLowerCase());
    }
  }

  return result;
}
