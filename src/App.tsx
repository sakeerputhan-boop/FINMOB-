import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuickActions } from './components/QuickActions';
import { LiquidCashCard } from './components/LiquidCashCard';
import { FdSection } from './components/FdSection';
import { AssetSection } from './components/AssetSection';
import { BottomNav, TabType } from './components/BottomNav';
import { ItemModal } from './components/ItemModal';
import { AuthModal } from './components/AuthModal';
import { DeployGuideModal } from './components/DeployGuideModal';
import { WhatsAppPdfModal } from './components/WhatsAppPdfModal';
import { CreditSimulatorModal } from './components/CreditSimulatorModal';
import { PinSetupModal, PinLockScreen } from './components/PinSecurityModal';
import {
  AccountsView,
  CashView,
  FdsView,
  CardsView,
  LoansView,
  RemindersView
} from './components/SectionViews';
import {
  FinancialItem,
  CurrencyCode,
  ItemType,
  UserProfile,
  SyncState
} from './types';
import { SAMPLE_ITEMS } from './data/sampleData';
import {
  auth,
  onAuthStateChanged,
  signInAnonymously,
  subscribeToUserItems,
  saveFinancialItem as saveFirestoreFinancialItem,
  removeFinancialItem as removeFirestoreFinancialItem
} from './lib/firebase';
import { Plus } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

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

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalDefaultType, setItemModalDefaultType] = useState<ItemType>('bank_account');
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [isWhatsAppPdfOpen, setIsWhatsAppPdfOpen] = useState(false);
  const [isCreditSimulatorOpen, setIsCreditSimulatorOpen] = useState(false);

  // PWA Install Prompt
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // PWA Install listener
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

  // Firebase Auth & Real-Time Firestore Sync setup
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

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

        // Subscribe to real-time Firestore collection
        unsubscribeFirestore = subscribeToUserItems(
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
            console.warn('Firestore sync warning:', err);
            setSyncState('offline');
          }
        );
      } else {
        // Sign in anonymously to enable seamless cloud ready state
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn('Anonymous auth fallback to localStorage:', e);
          setUser(null);
          setSyncState('guest');
          
          const local = localStorage.getItem('finmob_local_items');
          if (local) {
            try {
              setItems(JSON.parse(local));
            } catch {
              setItems(SAMPLE_ITEMS.map((s, idx) => ({ ...s, id: `local_${idx}`, userId: 'guest' })));
            }
          } else {
            const initial = SAMPLE_ITEMS.map((s, idx) => ({ ...s, id: `local_${idx}`, userId: 'guest' }));
            setItems(initial);
            localStorage.setItem('finmob_local_items', JSON.stringify(initial));
          }
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Save Item Handler
  const handleSaveItem = async (itemData: Partial<FinancialItem> & { title: string; amount: number; type: ItemType }) => {
    if (user) {
      try {
        setSyncState('syncing');
        await saveFirestoreFinancialItem(user.uid, itemData);
        setSyncState('synced');
      } catch (err) {
        console.error('Failed to save to Firestore:', err);
        setSyncState('offline');
      }
    } else {
      // Local Storage Fallback
      let updatedItems: FinancialItem[] = [];
      if (itemData.id) {
        updatedItems = items.map((i) =>
          i.id === itemData.id ? { ...i, ...itemData, updatedAt: new Date().toISOString() } : i
        );
      } else {
        const newItem: FinancialItem = {
          ...itemData,
          id: `local_${Date.now()}`,
          userId: 'guest',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedItems = [newItem, ...items];
      }
      setItems(updatedItems);
      localStorage.setItem('finmob_local_items', JSON.stringify(updatedItems));
    }
  };

  // Delete Item Handler
  const handleDeleteItem = async (id: string) => {
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
  };

  // Financial Computations
  const bankTotal = items.filter((i) => i.type === 'bank_account').reduce((a, b) => a + b.amount, 0);
  const cashTotal = items.filter((i) => i.type === 'cash_entry').reduce((a, b) => a + b.amount, 0);
  const fdTotal = items.filter((i) => i.type === 'fixed_deposit').reduce((a, b) => a + b.amount, 0);
  const assetTotal = items.filter((i) => i.type === 'asset').reduce((a, b) => a + b.amount, 0);

  const cardTotal = items.filter((i) => i.type === 'credit_card').reduce((a, b) => a + b.amount, 0);
  const loanTotal = items.filter((i) => i.type === 'emi_loan').reduce((a, b) => a + b.amount, 0);

  const grossWealth = bankTotal + cashTotal + fdTotal + assetTotal;
  const totalLiabilities = cardTotal + loanTotal;

  // Open Add Item Modal helper
  const handleOpenAddModal = (type: ItemType = 'bank_account') => {
    setEditingItem(null);
    setItemModalDefaultType(type);
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: FinancialItem) => {
    setEditingItem(item);
    setItemModalDefaultType(item.type);
    setIsItemModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-24 selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Header
        currency={currency}
        onCurrencyChange={setCurrency}
        user={user}
        syncState={syncState}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        onOpenExportModal={() => setIsWhatsAppPdfOpen(true)}
        deferredInstallPrompt={deferredInstallPrompt}
        onInstallPwa={handleInstallPwa}
        savedPin={savedPin}
        onOpenPinSetup={() => setIsPinSetupOpen(true)}
        onLockApp={() => setIsAppLocked(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 pt-5 space-y-5 flex-1">
        
        {/* Main Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Quick Actions Card matching FINMOB screenshot */}
            <QuickActions
              onOpenAddItem={handleOpenAddModal}
              onOpenCreditSimulator={() => setIsCreditSimulatorOpen(true)}
              onOpenWhatsAppPdf={() => setIsWhatsAppPdfOpen(true)}
            />

            {/* Daily Operating Liquidity Card (Bank & Cash) */}
            <LiquidCashCard
              bankTotal={bankTotal}
              cashTotal={cashTotal}
              currency={currency}
            />

            {/* Fixed Deposits (Independent Investment Section) */}
            <FdSection
              items={items}
              currency={currency}
              onAddItem={() => handleOpenAddModal('fixed_deposit')}
              onEditItem={handleOpenEditModal}
              onDeleteItem={handleDeleteItem}
            />

            {/* Gold & Independent Asset Section */}
            <AssetSection
              items={items}
              currency={currency}
              onAddItem={() => handleOpenAddModal('asset')}
              onEditItem={handleOpenEditModal}
              onDeleteItem={handleDeleteItem}
            />

          </div>
        )}

        {/* Section Views according to Active Tab */}
        {activeTab === 'accounts' && (
          <AccountsView
            items={items}
            currency={currency}
            onAddItem={() => handleOpenAddModal('bank_account')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'cash' && (
          <CashView
            items={items}
            currency={currency}
            onAddItem={() => handleOpenAddModal('cash_entry')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'fds' && (
          <FdsView
            items={items}
            currency={currency}
            onAddItem={() => handleOpenAddModal('fixed_deposit')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'gold' && (
          <AssetSection
            items={items}
            currency={currency}
            onAddItem={() => handleOpenAddModal('asset')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'cards' && (
          <CardsView
            items={items}
            currency={currency}
            onAddItem={() => handleOpenAddModal('credit_card')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'loans' && (
          <LoansView
            items={items}
            currency={currency}
            onAddItem={() => handleOpenAddModal('emi_loan')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            items={items}
            currency={currency}
            onAddItem={() => handleOpenAddModal('reminder')}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
          />
        )}

      </main>

      {/* Floating Add Item Quick Button */}
      <button
        onClick={() => handleOpenAddModal(activeTab === 'gold' ? 'asset' : 'bank_account')}
        className="fixed bottom-20 right-5 z-40 h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-transform"
        title="Quick Add Item"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Bottom Tab Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingItem}
        defaultType={itemModalDefaultType}
        currency={currency}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        syncState={syncState}
      />

      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />

      <WhatsAppPdfModal
        isOpen={isWhatsAppPdfOpen}
        onClose={() => setIsWhatsAppPdfOpen(false)}
        items={items}
        currency={currency}
      />

      <CreditSimulatorModal
        isOpen={isCreditSimulatorOpen}
        onClose={() => setIsCreditSimulatorOpen(false)}
        items={items}
        currency={currency}
      />

      <PinSetupModal
        isOpen={isPinSetupOpen}
        onClose={() => setIsPinSetupOpen(false)}
        savedPin={savedPin}
        onSavePin={handleSavePin}
      />

      <PinLockScreen
        isLocked={isAppLocked}
        savedPin={savedPin || ''}
        onUnlock={() => setIsAppLocked(false)}
      />

    </div>
  );
}
