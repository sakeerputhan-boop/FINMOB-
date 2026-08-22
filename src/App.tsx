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
import { calculateUpcomingDueItems, requestMobileNotificationPermission, sendLocalDueNotification } from './utils/notifications';
import { getSavedTheme, saveTheme, applyThemeToDocument } from './utils/theme';
import {
  recordLastUsedCard,
  recordLastUsedCategory,
  recordLastUsedItem
} from './utils/recentUsage';
import { SignIn } from './components/SignIn';
import {
  auth,
  onAuthStateChanged,
  signInAnonymously,
  subscribeToUserItems,
  subscribeToUserTransactions,
  subscribeToUserSettings,
  saveUserSettings,
  subscribeToUserCustomCategories,
  saveFinancialItem as saveFirestoreFinancialItem,
  removeFinancialItem as removeFirestoreFinancialItem,
  saveTransaction as saveFirestoreTransaction,
  removeTransaction as removeFirestoreTransaction,
  isUserProfileInitialized,
  markUserProfileInitialized,
  migrateLocalDataToFirestore
} from './lib/firebase';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [items, setItems] = useState<FinancialItem[]>(() => {
    try {
      const cached = localStorage.getItem('finmob_local_items');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const cached = localStorage.getItem('finmob_local_txs');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    return (localStorage.getItem('finmob_currency') as CurrencyCode) || 'AED';
  });
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return localStorage.getItem('finmob_country') || 'ALL';
  });
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<AppTheme>(() => getSavedTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
    const uid = user?.uid || auth.currentUser?.uid;
    if (uid) {
      saveUserSettings(uid, { theme: newTheme });
    }
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    localStorage.setItem('finmob_currency', newCurrency);
    const uid = user?.uid || auth.currentUser?.uid;
    if (uid) {
      saveUserSettings(uid, { currency: newCurrency });
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setSelectedCountry(newCountry);
    localStorage.setItem('finmob_country', newCountry);
    const uid = user?.uid || auth.currentUser?.uid;
    if (uid) {
      saveUserSettings(uid, { selectedCountry: newCountry });
    }
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

  // Firebase Auth & Real-Time Sync (Items + Transactions + Settings + Categories)
  useEffect(() => {
    let unsubscribeItems: (() => void) | null = null;
    let unsubscribeTxs: (() => void) | null = null;
    let unsubscribeSettings: (() => void) | null = null;
    let unsubscribeCategories: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setIsAuthChecking(false);
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
          (remoteItems) => {
            setItems(remoteItems);
            localStorage.setItem('finmob_local_items', JSON.stringify(remoteItems));
            setSyncState('synced');
            markUserProfileInitialized(currentUser.uid);
          },
          (err) => {
            console.warn('Firestore items sync warning:', err);
            setSyncState('offline');
          }
        );

        // Subscribe to real-time Transactions collection
        unsubscribeTxs = subscribeToUserTransactions(
          currentUser.uid,
          (remoteTxs) => {
            setTransactions(remoteTxs);
            localStorage.setItem('finmob_local_txs', JSON.stringify(remoteTxs));
          },
          (err) => {
            console.warn('Firestore transactions sync warning:', err);
          }
        );

        // Subscribe to User Preferences / Settings
        unsubscribeSettings = subscribeToUserSettings(
          currentUser.uid,
          (remoteSettings) => {
            if (remoteSettings.currency) {
              setCurrency(remoteSettings.currency);
              localStorage.setItem('finmob_currency', remoteSettings.currency);
            }
            if (remoteSettings.selectedCountry) {
              setSelectedCountry(remoteSettings.selectedCountry);
              localStorage.setItem('finmob_country', remoteSettings.selectedCountry);
            }
            if (remoteSettings.theme) {
              setTheme(remoteSettings.theme);
              saveTheme(remoteSettings.theme);
            }
          }
        );

        // Subscribe to User Custom Categories
        unsubscribeCategories = subscribeToUserCustomCategories(
          currentUser.uid,
          (remoteCats) => {
            if (Array.isArray(remoteCats) && remoteCats.length > 0) {
              localStorage.setItem('myfin_custom_categories_v2', JSON.stringify(remoteCats));
            }
          }
        );
      } else {
        setUser(null);
        setSyncState('guest');
        setItems([]);
        setTransactions([]);
        localStorage.removeItem('finmob_local_items');
        localStorage.removeItem('finmob_local_txs');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeItems) unsubscribeItems();
      if (unsubscribeTxs) unsubscribeTxs();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeCategories) unsubscribeCategories();
    };
  }, []);

  // Save Item Handler
  const handleSaveItem = async (
    itemData: Partial<FinancialItem> & { title: string; amount: number; type: any }
  ) => {
    const nowIso = new Date().toISOString();
    const itemId = itemData.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: FinancialItem = {
      ...itemData,
      id: itemId,
      userId: user ? user.uid : 'guest',
      createdAt: itemData.createdAt || nowIso,
      updatedAt: nowIso,
      lastUsedAt: nowIso
    } as FinancialItem;

    if (fullItem.id && fullItem.type === 'credit_card') {
      recordLastUsedCard(fullItem.id);
    }
    if (fullItem.id) {
      recordLastUsedItem(fullItem.id, fullItem.type);
    }
    if (fullItem.reminderCategory) {
      recordLastUsedCategory(fullItem.reminderCategory, 'reminder');
    }
    if (fullItem.assetCategory) {
      recordLastUsedCategory(fullItem.assetCategory, 'asset');
    }

    // 1. Immediately & optimistically update local state & localStorage
    setItems((prevItems) => {
      const exists = prevItems.some((i) => i.id === fullItem.id);
      const updated = exists ? prevItems.map((i) => (i.id === fullItem.id ? fullItem : i)) : [fullItem, ...prevItems];
      localStorage.setItem('finmob_local_items', JSON.stringify(updated));
      return updated;
    });

    // 2. Sync to Firestore if authenticated
    if (user) {
      try {
        setSyncState('syncing');
        await saveFirestoreFinancialItem(user.uid, fullItem);
        setSyncState('synced');
      } catch (err) {
        console.error('Failed to save to Firestore:', err);
        setSyncState('offline');
      }
    }
  };

  // Perform Item Deletion (after red confirmation modal approval)
  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;

    // 1. Immediately & optimistically update local state & localStorage
    setItems((prevItems) => {
      const updated = prevItems.filter((i) => i.id !== id);
      localStorage.setItem('finmob_local_items', JSON.stringify(updated));
      return updated;
    });

    // 2. Sync deletion to Firestore if authenticated
    if (user) {
      try {
        setSyncState('syncing');
        await removeFirestoreFinancialItem(user.uid, id);
        setSyncState('synced');
      } catch (err) {
        console.error('Failed to delete from Firestore:', err);
        setSyncState('offline');
      }
    }

    setItemToDelete(null);
  };

  // Perform Transaction Deletion (after red confirmation modal approval)
  const handleConfirmDeleteTx = async () => {
    if (!txToDelete) return;
    const id = txToDelete.id;

    // 1. Immediately & optimistically update local state & localStorage
    setTransactions((prevTxs) => {
      const updated = prevTxs.filter((t) => t.id !== id);
      localStorage.setItem('finmob_local_txs', JSON.stringify(updated));
      return updated;
    });

    // 2. Sync deletion to Firestore if authenticated
    if (user) {
      try {
        await removeFirestoreTransaction(user.uid, id);
      } catch (err) {
        console.error('Failed to delete transaction from Firestore:', err);
      }
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

    // 1. Atomically update items state & localStorage immediately
    setItems((prevItems) => {
      const nextItems = prevItems.map((i) => {
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

    // 2. Construct & record the transaction record in local state & localStorage immediately
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullTx: Transaction = {
      id: txId,
      userId: user ? user.uid : 'guest',
      itemId: transaction.itemId || updatedTargetItem.id,
      itemTitle: transaction.itemTitle || updatedTargetItem.title,
      itemType: transaction.itemType || updatedTargetItem.type,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency || updatedTargetItem.currency || currency,
      country: transaction.country || updatedTargetItem.country || 'UAE',
      category: transaction.category || 'General',
      description: transaction.description || '',
      date: transaction.date || nowIso,
      sourceAccountId: transaction.sourceAccountId,
      sourceAccountTitle: transaction.sourceAccountTitle,
      rewardPointsUsed: transaction.rewardPointsUsed,
      cashbackAmount: transaction.cashbackAmount,
      createdAt: nowIso
    };

    setTransactions((prevTxs) => {
      const updatedTxs = [fullTx, ...prevTxs];
      localStorage.setItem('finmob_local_txs', JSON.stringify(updatedTxs));
      return updatedTxs;
    });

    // 3. Persist items and transaction to Cloud Firestore if authenticated
    if (user) {
      try {
        setSyncState('syncing');
        await saveFirestoreFinancialItem(user.uid, stampedTarget);
        if (stampedSource) {
          await saveFirestoreFinancialItem(user.uid, stampedSource);
        }
        await saveFirestoreTransaction(user.uid, fullTx);
        setSyncState('synced');
      } catch (err) {
        console.error('Failed to sync transaction to Firestore:', err);
        setSyncState('offline');
      }
    }
  };

  const handleToggleFdConsolidation = (item: FinancialItem) => {
    const updatedItem: FinancialItem = {
      ...item,
      isStandalone: !item.isStandalone,
      updatedAt: new Date().toISOString()
    };
    handleSaveItem(updatedItem);
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

  // 1. Initial Auth Verification Loader Screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 space-y-4 selection:bg-emerald-500 selection:text-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
            <img src="/icon.svg" alt="MYFIN" className="h-10 w-10 object-contain animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-[#0B0F19] flex items-center justify-center animate-ping" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-lg font-black tracking-wider text-white">MYFIN</h1>
          <p className="text-xs text-slate-400 font-medium">Securing financial workspace...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate: Show dedicated Sign In / Sign Up screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-3 sm:p-6 selection:bg-emerald-500 selection:text-slate-950">
        <SignIn />
      </div>
    );
  }

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
            onToggleConsolidation={handleToggleFdConsolidation}
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

      {/* 6. Consolidated App Settings Modal (Categories, PIN, Currency, Holding Countries, CSV Backup) */}
      <AppSettingsModal
        isOpen={isAppSettingsOpen}
        onClose={() => setIsAppSettingsOpen(false)}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        selectedCountry={selectedCountry}
        onCountryChange={handleCountryChange}
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
        transactions={transactions}
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

      {/* 12. WhatsApp PDF Financial Report & CSV Backup Modal */}
      <WhatsAppPdfModal
        isOpen={isWhatsAppPdfOpen}
        onClose={() => setIsWhatsAppPdfOpen(false)}
        items={items}
        transactions={transactions}
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
