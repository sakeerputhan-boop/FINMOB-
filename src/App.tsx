import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AssetSection } from './components/AssetSection';
import { BottomNav, TabType } from './components/BottomNav';
import { ItemModal } from './components/ItemModal';
import { GiftModal } from './components/GiftModal';
import { GiftPdfShareModal } from './components/GiftPdfShareModal';
import { RemindersModal } from './components/RemindersModal';
import { GiftsView } from './components/GiftsView';
import { AuthModal } from './components/AuthModal';
import { DeployGuideModal } from './components/DeployGuideModal';
import { WhatsAppPdfModal } from './components/WhatsAppPdfModal';
import { CreditSimulatorModal } from './components/CreditSimulatorModal';
import { SpendPaymentModal } from './components/SpendPaymentModal';
import { ItemTransactionsModal } from './components/ItemTransactionsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PinSetupModal, PinLockScreen } from './components/PinSecurityModal';
import { UpcomingDueAlertModal } from './components/UpcomingDueAlertModal';
import { CustomCategoriesModal } from './components/CustomCategoriesModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import {
  AccountsView,
  CashView,
  CardsView,
  LoansView
} from './components/SectionViews';
import {
  FinancialItem,
  Transaction,
  CurrencyCode,
  ItemType,
  UserProfile,
  SyncState,
  AppTheme
} from './types';
import { SAMPLE_ITEMS, SAMPLE_TRANSACTIONS } from './data/sampleData';
import { calculateUpcomingDueItems, requestMobileNotificationPermission, sendLocalDueNotification } from './utils/notifications';
import { getSavedTheme, saveTheme, applyThemeToDocument } from './utils/theme';
import {
  recordLastUsedCard,
  recordLastUsedCategory,
  recordLastUsedItem
} from './utils/recentUsage';
import {
  auth,
  onAuthStateChanged,
  signInAnonymously,
  subscribeToUserItems,
  subscribeToUserTransactions,
  saveFinancialItem as saveFirestoreFinancialItem,
  removeFinancialItem as removeFirestoreFinancialItem,
  saveTransaction as saveFirestoreTransaction,
  removeTransaction as removeFirestoreTransaction
} from './lib/firebase';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('AED');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<AppTheme>(() => getSavedTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  // PIN Security state
  const [savedPin, setSavedPin] = useState<string | null>(() => {
    return localStorage.getItem('finmob_pin_code');
  });
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    return !!localStorage.getItem('finmob_pin_code');
  });
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);

  const handleSavePin = (newPin: string | null) => {
    if (newPin) {
      localStorage.setItem('finmob_pin_code', newPin);
      setSavedPin(newPin);
    } else {
      localStorage.removeItem('finmob_pin_code');
      setSavedPin(null);
      setIsAppLocked(false);
    }
  };

  // Item Modal (Add / Edit generic financial item)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalDefaultType, setItemModalDefaultType] = useState<ItemType>('bank_account');
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);

  // Gifts & IOU Modals State
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftModalDirection, setGiftModalDirection] = useState<'received' | 'given' | 'borrow' | 'lend'>('received');
  const [editingGift, setEditingGift] = useState<FinancialItem | null>(null);
  const [isGiftPdfShareOpen, setIsGiftPdfShareOpen] = useState(false);

  // Consolidated App Settings Modal
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);

  // Reminders Top Modal State
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  // 7-Day Upcoming Due Alerts Modal
  const [isUpcomingAlertsOpen, setIsUpcomingAlertsOpen] = useState(false);

  // Custom Categories Modal
  const [isCustomCategoriesOpen, setIsCustomCategoriesOpen] = useState(false);

  // Active Pending Reminders Count
  const pendingRemindersCount = useMemo(() => {
    return items.filter((i) => i.type === 'reminder' && !i.isCompleted).length;
  }, [items]);

  // Upcoming due items within 7 days
  const upcomingDueAlerts = useMemo(() => {
    return calculateUpcomingDueItems(items);
  }, [items]);

  // Auto-alert check on initial load if items are due within 7 days
  useEffect(() => {
    if (upcomingDueAlerts.length > 0 && !isAppLocked) {
      const hasSeenPrompt = sessionStorage.getItem('myfin_seen_due_alert');
      if (!hasSeenPrompt) {
        sendLocalDueNotification(upcomingDueAlerts);
        sessionStorage.setItem('myfin_seen_due_alert', 'true');
      }
    }
  }, [upcomingDueAlerts, isAppLocked]);

  // Spend & Payment Modal
  const [spendPaymentTarget, setSpendPaymentTarget] = useState<FinancialItem | null>(null);
  const [spendPaymentDefaultAction, setSpendPaymentDefaultAction] = useState<string | undefined>(undefined);

  // Item Transactions Ledger Modal
  const [ledgerItem, setLedgerItem] = useState<FinancialItem | null>(null);

  // Red Confirmation Delete Modal
  const [itemToDelete, setItemToDelete] = useState<FinancialItem | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Other Utility Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [isWhatsAppPdfOpen, setIsWhatsAppPdfOpen] = useState(false);
  const [isCreditSimulatorOpen, setIsCreditSimulatorOpen] = useState(false);

  // PWA Install Prompt
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  // Firebase Auth & Real-Time Sync (Items + Transactions)
  useEffect(() => {
    let unsubscribeItems: (() => void) | null = null;
    let unsubscribeTxs: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous
        });
        setSyncState('syncing');

        // Subscribe to real-time Items collection
        unsubscribeItems = subscribeToUserItems(
          currentUser.uid,
          async (remoteItems) => {
            if (remoteItems.length === 0) {
              // Seed sample items into Firestore if brand new user
              for (const sample of SAMPLE_ITEMS) {
                await saveFirestoreFinancialItem(currentUser.uid, sample as any);
              }
            } else {
              setItems(remoteItems);
              setSyncState('synced');
            }
          },
          (err) => {
            console.warn('Firestore items sync warning:', err);
            setSyncState('offline');
          }
        );

        // Subscribe to real-time Transactions collection
        unsubscribeTxs = subscribeToUserTransactions(
          currentUser.uid,
          async (remoteTxs) => {
            if (remoteTxs.length === 0) {
              for (const sampleTx of SAMPLE_TRANSACTIONS) {
                await saveFirestoreTransaction(currentUser.uid, sampleTx as any);
              }
            } else {
              setTransactions(remoteTxs);
            }
          },
          (err) => {
            console.warn('Firestore transactions sync warning:', err);
          }
        );
      } else {
        // Sign in anonymously to enable seamless cloud sync
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn('Anonymous auth fallback to localStorage:', e);
          setUser(null);
          setSyncState('guest');

          // Local storage fallback for items
          const localItems = localStorage.getItem('finmob_local_items');
          if (localItems) {
            try {
              setItems(JSON.parse(localItems));
            } catch {
              setItems(SAMPLE_ITEMS.map((s, idx) => ({ ...s, id: `local_${idx}`, userId: 'guest' })));
            }
          } else {
            const initial = SAMPLE_ITEMS.map((s, idx) => ({ ...s, id: `local_${idx}`, userId: 'guest' }));
            setItems(initial);
            localStorage.setItem('finmob_local_items', JSON.stringify(initial));
          }

          // Local storage fallback for transactions
          const localTxs = localStorage.getItem('finmob_local_txs');
          if (localTxs) {
            try {
              setTransactions(JSON.parse(localTxs));
            } catch {
              setTransactions(SAMPLE_TRANSACTIONS.map((t, idx) => ({ ...t, id: `localtx_${idx}`, userId: 'guest' })));
            }
          } else {
            const initialTxs = SAMPLE_TRANSACTIONS.map((t, idx) => ({ ...t, id: `localtx_${idx}`, userId: 'guest' }));
            setTransactions(initialTxs);
            localStorage.setItem('finmob_local_txs', JSON.stringify(initialTxs));
          }
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeItems) unsubscribeItems();
      if (unsubscribeTxs) unsubscribeTxs();
    };
  }, []);

  // Save Item Handler
  const handleSaveItem = async (
    itemData: Partial<FinancialItem> & { title: string; amount: number; type: any }
  ) => {
    const nowIso = new Date().toISOString();
    const itemWithTimestamp: Partial<FinancialItem> & { title: string; amount: number; type: any } = {
      ...itemData,
      lastUsedAt: nowIso,
      updatedAt: nowIso
    };

    if (itemData.id && itemData.type === 'credit_card') {
      recordLastUsedCard(itemData.id);
    }
    if (itemData.id) {
      recordLastUsedItem(itemData.id, itemData.type);
    }
    if (itemData.reminderCategory) {
      recordLastUsedCategory(itemData.reminderCategory, 'reminder');
    }
    if (itemData.assetCategory) {
      recordLastUsedCategory(itemData.assetCategory, 'asset');
    }

    if (user) {
      try {
        setSyncState('syncing');
        await saveFirestoreFinancialItem(user.uid, itemWithTimestamp);
        setSyncState('synced');
      } catch (err) {
        console.error('Failed to save to Firestore:', err);
        setSyncState('offline');
      }
    } else {
      let updatedItems: FinancialItem[] = [];
      if (itemData.id) {
        updatedItems = items.map((i) =>
          i.id === itemData.id ? { ...i, ...itemWithTimestamp } : i
        );
      } else {
        const newItem: FinancialItem = {
          ...itemWithTimestamp,
          id: `local_${Date.now()}`,
          userId: 'guest',
          createdAt: nowIso,
          updatedAt: nowIso,
          lastUsedAt: nowIso
        };
        if (newItem.type === 'credit_card') {
          recordLastUsedCard(newItem.id);
        }
        recordLastUsedItem(newItem.id, newItem.type);
        updatedItems = [newItem, ...items];
      }
      setItems(updatedItems);
      localStorage.setItem('finmob_local_items', JSON.stringify(updatedItems));
    }
  };

  // Perform Item Deletion (after red confirmation modal approval)
  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;

    if (user) {
      try {
        setSyncState('syncing');
        await removeFirestoreFinancialItem(user.uid, id);
        setSyncState('synced');
      } catch (err) {
        console.error('Failed to delete from Firestore:', err);
        setSyncState('offline');
      }
    } else {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      localStorage.setItem('finmob_local_items', JSON.stringify(updated));
    }

    setItemToDelete(null);
  };

  // Perform Transaction Deletion (after red confirmation modal approval)
  const handleConfirmDeleteTx = async () => {
    if (!txToDelete) return;
    const id = txToDelete.id;

    if (user) {
      try {
        await removeFirestoreTransaction(user.uid, id);
      } catch (err) {
        console.error('Failed to delete transaction from Firestore:', err);
      }
    } else {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      localStorage.setItem('finmob_local_txs', JSON.stringify(updated));
    }

    setTxToDelete(null);
  };

  // Handle Executing Spend / Payment / Transfer / Repayment Transactions
  const handleExecuteTransaction = async (payload: {
    transaction: Partial<Transaction> & { amount: number; type: any };
    updatedTargetItem: FinancialItem;
    updatedSourceItem?: FinancialItem;
  }) => {
    const { transaction, updatedTargetItem, updatedSourceItem } = payload;
    const nowIso = new Date().toISOString();

    // Track last used items & categories
    if (updatedTargetItem.type === 'credit_card') {
      recordLastUsedCard(updatedTargetItem.id);
    }
    recordLastUsedItem(updatedTargetItem.id, updatedTargetItem.type);

    if (updatedSourceItem) {
      if (updatedSourceItem.type === 'credit_card') {
        recordLastUsedCard(updatedSourceItem.id);
      }
      recordLastUsedItem(updatedSourceItem.id, updatedSourceItem.type);
    }

    if (transaction.category) {
      recordLastUsedCategory(transaction.category, transaction.type || 'expense');
    }

    const stampedTarget = {
      ...updatedTargetItem,
      lastUsedAt: nowIso,
      updatedAt: nowIso
    };
    const stampedSource = updatedSourceItem
      ? { ...updatedSourceItem, lastUsedAt: nowIso, updatedAt: nowIso }
      : undefined;

    // 1. Atomically update local state first so balance reductions are immediately applied
    setItems((prevItems) => {
      let nextItems = prevItems.map((i) => {
        if (i.id === stampedTarget.id) {
          return { ...i, ...stampedTarget };
        }
        if (stampedSource && i.id === stampedSource.id) {
          return { ...i, ...stampedSource };
        }
        return i;
      });
      localStorage.setItem('finmob_local_items', JSON.stringify(nextItems));
      return nextItems;
    });

    // 2. If logged in with Firestore, persist both target and source items
    if (user) {
      try {
        setSyncState('syncing');
        await saveFirestoreFinancialItem(user.uid, stampedTarget);
        if (stampedSource) {
          await saveFirestoreFinancialItem(user.uid, stampedSource);
        }
        setSyncState('synced');
      } catch (err) {
        console.error('Failed to sync updated items to Firestore:', err);
        setSyncState('offline');
      }
    }

    const txPayload: Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string } = {
      itemId: transaction.itemId || updatedTargetItem.id,
      itemTitle: transaction.itemTitle || updatedTargetItem.title,
      itemType: transaction.itemType || updatedTargetItem.type,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency || updatedTargetItem.currency || currency,
      country: transaction.country || updatedTargetItem.country || 'UAE',
      category: transaction.category || 'General',
      description: transaction.description || '',
      date: transaction.date || new Date().toISOString(),
      sourceAccountId: transaction.sourceAccountId,
      sourceAccountTitle: transaction.sourceAccountTitle,
      rewardPointsUsed: transaction.rewardPointsUsed,
      cashbackAmount: transaction.cashbackAmount
    };

    // 3. Save Transaction Record in Firestore / State
    if (user) {
      try {
        await saveFirestoreTransaction(user.uid, txPayload);
      } catch (e) {
        console.error('Error saving transaction record:', e);
      }
    } else {
      const newTx: Transaction = {
        ...txPayload,
        id: `tx_${Date.now()}`,
        userId: 'guest',
        createdAt: new Date().toISOString()
      };
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('finmob_local_txs', JSON.stringify(updatedTxs));
    }
  };

  // Navigation & Modal triggers
  const handleOpenAddModal = (type: ItemType = 'bank_account') => {
    if (type === 'gift' || type === 'iou') {
      setEditingGift(null);
      setGiftModalDirection('received');
      setIsGiftModalOpen(true);
      return;
    }
    setEditingItem(null);
    setItemModalDefaultType(type);
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: FinancialItem) => {
    if (item.type === 'gift' || item.type === 'iou') {
      setEditingGift(item);
      setGiftModalDirection(
        item.type === 'iou'
          ? item.iouType || 'borrow'
          : item.giftDirection || 'received'
      );
      setIsGiftModalOpen(true);
      return;
    }
    setEditingItem(item);
    setItemModalDefaultType(item.type);
    setIsItemModalOpen(true);
  };

  const handleOpenAddGift = (direction: 'received' | 'given' | 'borrow' | 'lend') => {
    setEditingGift(null);
    setGiftModalDirection(direction);
    setIsGiftModalOpen(true);
  };

  const handleOpenSpendPayment = (item: FinancialItem, defaultAction?: string) => {
    setSpendPaymentTarget(item);
    setSpendPaymentDefaultAction(defaultAction);
  };

  const handleOpenTransactions = (item: FinancialItem) => {
    setLedgerItem(item);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-24 selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header with Multi-Country Switcher, Reminders Tab, App Settings & Actions */}
      <Header
        currency={currency}
        onCurrencyChange={setCurrency}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        items={items}
        remindersCount={pendingRemindersCount}
        upcomingDueCount={upcomingDueAlerts.length}
        onOpenReminders={() => setIsRemindersModalOpen(true)}
        onOpenUpcomingAlerts={() => setIsUpcomingAlertsOpen(true)}
        onOpenAppSettings={() => setIsAppSettingsOpen(true)}
        user={user}
        syncState={syncState}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        onOpenExportModal={() => setIsWhatsAppPdfOpen(true)}
        deferredInstallPrompt={deferredInstallPrompt}
        onInstallPwa={handleInstallPwa}
        savedPin={savedPin}
        onLockApp={() => setIsAppLocked(true)}
        onQuickAddItem={() => handleOpenAddModal('bank_account')}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 pt-5 space-y-5 flex-1">
        
        {/* 1. Dashboard View (Country-wise Independent Summaries) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            items={items}
            currency={currency}
            selectedCountry={selectedCountry}
            onOpenAddItem={handleOpenAddModal}
            onOpenSpendPayment={handleOpenSpendPayment}
            onOpenTransactions={handleOpenTransactions}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* 2. Bank Accounts View */}
        {activeTab === 'accounts' && (
          <AccountsView
            items={items}
            currency={currency}
            selectedCountry={selectedCountry}
            onAddItem={() => handleOpenAddModal('bank_account')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={(item) => setItemToDelete(item)}
            onOpenSpendPayment={handleOpenSpendPayment}
            onOpenTransactions={handleOpenTransactions}
          />
        )}

        {/* 3. Credit Cards View */}
        {activeTab === 'cards' && (
          <CardsView
            items={items}
            currency={currency}
            selectedCountry={selectedCountry}
            onAddItem={() => handleOpenAddModal('credit_card')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={(item) => setItemToDelete(item)}
            onOpenSpendPayment={handleOpenSpendPayment}
            onOpenTransactions={handleOpenTransactions}
          />
        )}

        {/* 4. Loans View (EMI vs Lump Sum Non-EMI) */}
        {activeTab === 'loans' && (
          <LoansView
            items={items}
            currency={currency}
            selectedCountry={selectedCountry}
            onAddItem={() => handleOpenAddModal('emi_loan')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={(item) => setItemToDelete(item)}
            onOpenSpendPayment={handleOpenSpendPayment}
            onOpenTransactions={handleOpenTransactions}
          />
        )}

        {/* 5. Consolidated ASSET Tab (Gold, Fixed Deposits & Real Estate) */}
        {activeTab === 'assets' && (
          <AssetSection
            items={items}
            currency={currency}
            selectedCountry={selectedCountry}
            onAddItem={(catOrFd) =>
              handleOpenAddModal(catOrFd === 'fixed_deposit' ? 'fixed_deposit' : 'asset')
            }
            onEditItem={handleOpenEditModal}
            onDeleteItem={(item) => setItemToDelete(item)}
          />
        )}

        {/* 6. Physical Cash View */}
        {activeTab === 'cash' && (
          <CashView
            items={items}
            currency={currency}
            selectedCountry={selectedCountry}
            onAddItem={() => handleOpenAddModal('cash_entry')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={(item) => setItemToDelete(item)}
            onOpenSpendPayment={handleOpenSpendPayment}
            onOpenTransactions={handleOpenTransactions}
          />
        )}

        {/* 7. Independent GIFT & IOU Section */}
        {activeTab === 'gifts' && (
          <GiftsView
            items={items}
            currency={currency}
            selectedCountry={selectedCountry}
            onAddGift={handleOpenAddGift}
            onEditGift={handleOpenEditModal}
            onDeleteGift={(gift) => setItemToDelete(gift)}
            onOpenPdfShare={() => setIsGiftPdfShareOpen(true)}
          />
        )}

      </main>

      {/* Clean Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* --- MODALS --- */}

      {/* 1. Add / Edit Generic Financial Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingItem}
        defaultType={itemModalDefaultType}
        currency={currency}
        selectedCountry={selectedCountry}
      />

      {/* 2. Add / Edit Gift & IOU Record Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingGift}
        defaultDirection={giftModalDirection}
        currency={currency}
        selectedCountry={selectedCountry}
      />

      {/* 3. Gifts Registry PDF Report & WhatsApp Share Modal */}
      <GiftPdfShareModal
        isOpen={isGiftPdfShareOpen}
        onClose={() => setIsGiftPdfShareOpen(false)}
        items={items}
        currency={currency}
      />

      {/* 4. Smart Reminders Top Modal (Financial Bills & Non-Financial Expiries) */}
      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        items={items}
        currency={currency}
        selectedCountry={selectedCountry}
        onSaveReminder={handleSaveItem}
        onEditReminder={handleOpenEditModal}
        onDeleteReminder={(item) => setItemToDelete(item)}
      />

      {/* 5. 7-Day Due Upcoming Alert Modal & Mobile Notifications */}
      <UpcomingDueAlertModal
        isOpen={isUpcomingAlertsOpen}
        onClose={() => setIsUpcomingAlertsOpen(false)}
        alerts={upcomingDueAlerts}
        currency={currency}
        onOpenItemActions={(item) => {
          setIsUpcomingAlertsOpen(false);
          handleOpenSpendPayment(item);
        }}
        onOpenAllReminders={() => {
          setIsUpcomingAlertsOpen(false);
          setIsRemindersModalOpen(true);
        }}
      />

      {/* 6. Consolidated App Settings Modal (Categories, PIN, Currency, Holding Countries) */}
      <AppSettingsModal
        isOpen={isAppSettingsOpen}
        onClose={() => setIsAppSettingsOpen(false)}
        currency={currency}
        onCurrencyChange={setCurrency}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        savedPin={savedPin}
        onSavePin={handleSavePin}
        onLockApp={() => {
          setIsAppSettingsOpen(false);
          setIsAppLocked(true);
        }}
        user={user}
        syncState={syncState}
        onOpenAuth={() => {
          setIsAppSettingsOpen(false);
          setIsAuthModalOpen(true);
        }}
        items={items}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
      />

      {/* 7. Custom Categories Manager Modal (Backward Compatibility) */}
      <CustomCategoriesModal
        isOpen={isCustomCategoriesOpen}
        onClose={() => setIsCustomCategoriesOpen(false)}
        onCategoriesChanged={() => {}}
      />

      {/* 7. Spend / Payment / Transfer Modal */}
      <SpendPaymentModal
        isOpen={!!spendPaymentTarget}
        onClose={() => {
          setSpendPaymentTarget(null);
          setSpendPaymentDefaultAction(undefined);
        }}
        targetItem={spendPaymentTarget}
        allItems={items}
        defaultAction={spendPaymentDefaultAction}
        onExecuteTransaction={handleExecuteTransaction}
      />

      {/* 8. Item Transactions Ledger Modal */}
      <ItemTransactionsModal
        isOpen={!!ledgerItem}
        onClose={() => setLedgerItem(null)}
        item={ledgerItem}
        transactions={transactions}
        onDeleteTransaction={(tx) => setTxToDelete(tx)}
        onOpenNewTransaction={(it) => {
          setLedgerItem(null);
          handleOpenSpendPayment(it);
        }}
      />

      {/* 9. RED Confirmation Deletion Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete || !!txToDelete}
        onClose={() => {
          setItemToDelete(null);
          setTxToDelete(null);
        }}
        onConfirm={itemToDelete ? handleConfirmDeleteItem : handleConfirmDeleteTx}
        title={itemToDelete ? itemToDelete.title : txToDelete?.description || 'Transaction'}
        itemType={
          itemToDelete
            ? itemToDelete.type === 'credit_card'
              ? 'Credit Card'
              : itemToDelete.type === 'emi_loan'
              ? 'Loan Account'
              : itemToDelete.type === 'bank_account'
              ? 'Bank Account'
              : itemToDelete.type === 'fixed_deposit'
              ? 'Fixed Deposit'
              : itemToDelete.type === 'asset'
              ? 'Asset Valuation'
              : itemToDelete.type === 'gift'
              ? 'Gift Record'
              : itemToDelete.type === 'reminder'
              ? 'Reminder'
              : 'Record'
            : 'Transaction'
        }
        amount={
          itemToDelete
            ? itemToDelete.amount
            : txToDelete
            ? txToDelete.amount
            : undefined
        }
        currency={
          itemToDelete?.currency ||
          txToDelete?.currency ||
          currency
        }
      />

      {/* 10. Cloud Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        syncState={syncState}
      />

      {/* 11. Deploy & Firebase Guide */}
      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />

      {/* 12. WhatsApp PDF Financial Report Modal */}
      <WhatsAppPdfModal
        isOpen={isWhatsAppPdfOpen}
        onClose={() => setIsWhatsAppPdfOpen(false)}
        items={items}
        currency={currency}
      />

      {/* 13. Credit Simulator Modal */}
      <CreditSimulatorModal
        isOpen={isCreditSimulatorOpen}
        onClose={() => setIsCreditSimulatorOpen(false)}
        items={items}
        currency={currency}
      />

      {/* 14. Security PIN Setup / Reset Modal */}
      <PinSetupModal
        isOpen={isPinSetupOpen}
        onClose={() => setIsPinSetupOpen(false)}
        savedPin={savedPin}
        onSavePin={handleSavePin}
      />

      {/* 15. Security PIN Lock Screen */}
      <PinLockScreen
        isLocked={isAppLocked}
        savedPin={savedPin || ''}
        onUnlock={() => setIsAppLocked(false)}
      />

    </div>
  );
}
