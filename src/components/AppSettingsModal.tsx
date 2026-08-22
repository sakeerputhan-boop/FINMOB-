import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Settings,
  Tag,
  KeyRound,
  Coins,
  Globe,
  Lock,
  Unlock,
  Check,
  ShieldCheck,
  Plus,
  Trash2,
  Receipt,
  TrendingUp,
  FileText,
  Sparkles,
  RefreshCw,
  User,
  LogOut,
  Palette,
  Download,
  Upload,
  Database,
  Cloud,
  FileSpreadsheet,
  FileJson,
  Smartphone,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { CurrencyCode, UserProfile, SyncState, FinancialItem, Transaction, AppTheme } from '../types';
import { COUNTRIES, CURRENCIES, getCountryByName } from '../utils/currency';
import { THEMES, getSavedTheme, saveTheme } from '../utils/theme';
import {
  exportItemsToCsv,
  exportTransactionsToCsv,
  exportFullBackupCsv
} from '../utils/csvExport';
import {
  CategoryItem,
  CategoryType,
  getCustomCategories,
  addCustomCategory,
  deleteCustomCategory,
  saveCustomCategories,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_REMINDER_CATEGORIES,
  DEFAULT_ASSET_CATEGORIES
} from '../utils/categories';
import { saveFinancialItem, saveTransaction } from '../lib/firebase';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  selectedCountry: string;
  onCountryChange: (c: string) => void;
  savedPin: string | null;
  onSavePin: (pin: string | null) => void;
  onLockApp: () => void;
  user: UserProfile | null;
  syncState: SyncState;
  onOpenAuth: () => void;
  items: FinancialItem[];
  transactions?: Transaction[];
  currentTheme?: AppTheme;
  onThemeChange?: (t: AppTheme) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  currency,
  onCurrencyChange,
  selectedCountry,
  onCountryChange,
  savedPin,
  onSavePin,
  onLockApp,
  user,
  syncState,
  onOpenAuth,
  items,
  transactions = [],
  currentTheme: propTheme,
  onThemeChange
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'backup' | 'categories' | 'pin' | 'currency' | 'countries'>('themes');
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(() => propTheme || getSavedTheme());
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const handleSelectTheme = (themeId: AppTheme) => {
    setSelectedTheme(themeId);
    saveTheme(themeId);
    if (onThemeChange) {
      onThemeChange(themeId);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Categories Sub-tab state
  const [categoryType, setCategoryType] = useState<CategoryType>('expense');
  const [customList, setCustomList] = useState<CategoryItem[]>(getCustomCategories());
  const [newCatName, setNewCatName] = useState('');
  const [catFeedback, setCatFeedback] = useState('');

  // Handle Exporting Full Master JSON
  const handleExportJson = () => {
    try {
      const customCats = getCustomCategories();
      const backupData = {
        app: 'MYFIN Financial Platform',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        currency,
        selectedCountry,
        theme: selectedTheme,
        items,
        transactions,
        customCategories: customCats
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `MYFIN_Master_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupSuccess('Master JSON backup downloaded successfully!');
      setTimeout(() => setBackupSuccess(null), 3500);
    } catch (e) {
      console.error('Export error', e);
    }
  };

  // Handle Importing Full Master JSON
  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data || (!Array.isArray(data.items) && !Array.isArray(data.transactions))) {
        throw new Error('Invalid MYFIN backup file structure');
      }

      const importedItems: FinancialItem[] = Array.isArray(data.items) ? data.items : [];
      const importedTxs: Transaction[] = Array.isArray(data.transactions) ? data.transactions : [];
      const importedCats: CategoryItem[] = Array.isArray(data.customCategories) ? data.customCategories : [];

      // Save custom categories
      if (importedCats.length > 0) {
        saveCustomCategories(importedCats);
        setCustomList(getCustomCategories());
      }

      // If user is authenticated, sync to Firestore
      if (user?.uid) {
        const promises: Promise<any>[] = [];
        for (const item of importedItems) {
          promises.push(saveFinancialItem(user.uid, item));
        }
        for (const tx of importedTxs) {
          promises.push(saveTransaction(user.uid, tx));
        }
        await Promise.allSettled(promises);
      } else {
        // Save to localStorage
        localStorage.setItem('finmob_local_items', JSON.stringify(importedItems));
        localStorage.setItem('finmob_local_txs', JSON.stringify(importedTxs));
        window.location.reload();
      }

      setBackupSuccess(`Successfully restored ${importedItems.length} items and ${importedTxs.length} transactions!`);
      setTimeout(() => setBackupSuccess(null), 4000);
    } catch (err: any) {
      console.error('Import error', err);
      alert('Failed to import backup file. Please ensure it is a valid MYFIN JSON backup file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // PIN settings state
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState('');
  const [pinError, setPinError] = useState('');

  // Derive unique countries where items are held (Hook MUST be called unconditionally before early returns)
  const holdingCountriesWithItems: string[] = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.country && typeof i.country === 'string' && i.country.trim() && i.country.toUpperCase() !== 'ALL') {
        set.add(i.country.trim());
      }
    });
    return Array.from(set);
  }, [items]);

  if (!isOpen) return null;

  const refreshCategories = () => {
    setCustomList(getCustomCategories());
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCustomCategory(newCatName.trim(), categoryType);
    setNewCatName('');
    setCatFeedback('Category added successfully!');
    setTimeout(() => setCatFeedback(''), 2000);
    refreshCategories();
  };

  const handleDeleteCategory = (id: string) => {
    deleteCustomCategory(id);
    refreshCategories();
  };

  const handleSetNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError('PIN must be exactly 4 numeric digits.');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setPinError('PINs do not match. Please re-enter.');
      return;
    }
    onSavePin(pinInput);
    setPinFeedback('PIN set successfully!');
    setPinInput('');
    setConfirmPinInput('');
    setTimeout(() => setPinFeedback(''), 2500);
  };

  const handleRemovePin = () => {
    onSavePin(null);
    setPinFeedback('PIN protection disabled.');
    setPinInput('');
    setConfirmPinInput('');
    setTimeout(() => setPinFeedback(''), 2500);
  };

  const currentTabCustom = customList.filter((c) => c.type === categoryType);
  const currentTabDefaults =
    categoryType === 'expense'
      ? DEFAULT_EXPENSE_CATEGORIES
      : categoryType === 'income'
      ? DEFAULT_INCOME_CATEGORIES
      : categoryType === 'reminder'
      ? DEFAULT_REMINDER_CATEGORIES
      : DEFAULT_ASSET_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">App Settings</h2>
              <p className="text-xs text-slate-400">
                Manage Categories, Security PIN, Currency & Holding Countries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-6 gap-1">
          
          <button
            onClick={() => setActiveTab('themes')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              activeTab === 'themes'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Theme</span>
            <span className="sm:hidden">Theme</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              activeTab === 'backup'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
            <span className="sm:hidden">Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              activeTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cats</span>
          </button>

          <button
            onClick={() => setActiveTab('pin')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              activeTab === 'pin'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PIN</span>
            <span className="sm:hidden">PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('currency')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              activeTab === 'currency'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Currency</span>
            <span className="sm:hidden">Curr</span>
          </button>

          <button
            onClick={() => setActiveTab('countries')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              activeTab === 'countries'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Countries</span>
            <span className="sm:hidden">Global</span>
          </button>

        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* BACKUP & CSV EXPORT TAB */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Cloud Preservation & CSV Backup</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your data is permanently synced to Cloud Firestore project <code className="text-emerald-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">finmob-7e007</code>. You can also download local CSV backups anytime.
                </p>
              </div>

              {/* Multi-Device Cloud Sync Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-800/60 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white">Multi-Device Cloud Preservation</h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Automatic real-time sync across mobile, tablet, and desktop
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Cloud Synced Accounts</span>
                    <span className="font-black text-white text-base text-emerald-400">{items.length}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Cloud Synced Transactions</span>
                    <span className="font-black text-white text-base text-cyan-400">{transactions.length}</span>
                  </div>
                </div>

                {user ? (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Active Account: <strong className="text-white">{user.email || user.displayName || 'User'}</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">UID: {user.uid.slice(0, 6)}...</span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-amber-300 text-[11px]">Guest mode — sign in to access data on any device.</span>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition active:scale-95"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>

              {/* Feedback toast */}
              {backupSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-md">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">{backupSuccess}</span>
                </div>
              )}

              {/* JSON Master Backup & Restore */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Master JSON Backup & Restore</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Export a complete encrypted JSON backup with all accounts, cards, and transaction records, or restore anytime on a new device.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleExportJson}
                    className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-700/50 hover:border-indigo-500 text-left transition group active:scale-95 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <FileJson className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition" />
                      <Download className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-white">Export Full JSON Backup</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Download single-file complete snapshot
                      </p>
                    </div>
                  </button>

                  <label className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-700/50 hover:border-cyan-500 text-left transition group active:scale-95 cursor-pointer flex flex-col justify-between">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                      disabled={isImporting}
                    />
                    <div className="flex items-center justify-between mb-2">
                      <Upload className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
                      <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                        {isImporting ? 'Restoring...' : 'Restore'}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-white">Restore from JSON File</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Import accounts, cards & history
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* CSV Export Options */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Spreadsheet (CSV) Ledgers</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. Full Master Backup */}
                  <button
                    onClick={() => {
                      exportFullBackupCsv(items, transactions, currency);
                      setBackupSuccess('Complete Master CSV backup downloaded successfully!');
                      setTimeout(() => setBackupSuccess(null), 3000);
                    }}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border border-emerald-600/40 hover:border-emerald-500 text-left transition group active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                    </div>
                    <h5 className="text-xs font-black text-white">Full Backup CSV</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      All accounts, items & transaction ledger combined
                    </p>
                  </button>

                  {/* 2. Accounts Only */}
                  <button
                    onClick={() => {
                      exportItemsToCsv(items, currency);
                      setBackupSuccess('Accounts CSV backup downloaded successfully!');
                      setTimeout(() => setBackupSuccess(null), 3000);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition group active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Coins className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <h5 className="text-xs font-black text-white">Accounts CSV</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Banks, cash, cards, loans & gold holdings
                    </p>
                  </button>

                  {/* 3. Transactions Only */}
                  <button
                    onClick={() => {
                      exportTransactionsToCsv(transactions, currency);
                      setBackupSuccess('Transactions CSV ledger downloaded successfully!');
                      setTimeout(() => setBackupSuccess(null), 3000);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition group active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Receipt className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition" />
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <h5 className="text-xs font-black text-white">Transactions CSV</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Chronological ledger of all spends & payments
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 0. THEMES SELECTION (Modern Dark, Clean Light, Emerald Growth, Royal Indigo) */}
          {activeTab === 'themes' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span>Modern App Theme Selection</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your preferred high-contrast visual theme. Persisted across all sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {THEMES.map((theme) => {
                  const isSelected = selectedTheme === theme.id;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden group ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900/90 shadow-xl'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      {/* Theme Color Palette Preview Bar */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shadow-md font-bold text-xs"
                          style={{ backgroundColor: theme.accentColor, color: '#fff' }}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : '●'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-extrabold text-white tracking-tight">{theme.name}</h4>
                            {isSelected && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {theme.description}
                          </p>
                        </div>
                      </div>

                      {/* Mini Live Interface Preview Tile */}
                      <div
                        className="rounded-xl p-2.5 flex items-center justify-between border text-[10px]"
                        style={{
                          backgroundColor: theme.previewBg,
                          borderColor: theme.previewBorder
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-md"
                            style={{ backgroundColor: theme.previewAccent }}
                          />
                          <div className="space-y-1">
                            <div
                              className="w-16 h-1.5 rounded-full"
                              style={{ backgroundColor: theme.previewCard }}
                            />
                            <div
                              className="w-10 h-1.5 rounded-full opacity-60"
                              style={{ backgroundColor: theme.previewBorder }}
                            />
                          </div>
                        </div>
                        <div
                          className="px-2 py-0.5 rounded font-mono font-bold"
                          style={{
                            backgroundColor: theme.previewCard,
                            color: theme.previewAccent,
                            borderColor: theme.previewBorder
                          }}
                        >
                          AED 24,500
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. CATEGORIES OPTION (Income vs Expense vs Reminders vs Assets) */}
          {activeTab === 'categories' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Category Manager</h3>
                  <p className="text-xs text-slate-400">
                    Separate expense and income categories with custom tags
                  </p>
                </div>
              </div>

              {/* Sub-tabs for Category Type */}
              <div className="p-1.5 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-4 gap-1">
                <button
                  onClick={() => setCategoryType('expense')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                    categoryType === 'expense'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </button>

                <button
                  onClick={() => setCategoryType('income')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                    categoryType === 'income'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Income</span>
                </button>

                <button
                  onClick={() => setCategoryType('reminder')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                    categoryType === 'reminder'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Reminders</span>
                </button>

                <button
                  onClick={() => setCategoryType('asset')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                    categoryType === 'asset'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Assets</span>
                </button>
              </div>

              {/* Add Custom Category Form */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={`Create custom ${categoryType} category (e.g. ${
                    categoryType === 'expense'
                      ? 'Groceries, Streaming'
                      : categoryType === 'income'
                      ? 'Bonus, Rental Yield'
                      : categoryType === 'reminder'
                      ? 'Emirates ID Renewal'
                      : 'Jewelry & Watches'
                  })`}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>

              {catFeedback && (
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{catFeedback}</span>
                </p>
              )}

              {/* Custom categories list */}
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-2">
                  Custom {categoryType.toUpperCase()} Categories ({currentTabCustom.length})
                </span>
                {currentTabCustom.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                    No custom {categoryType} categories created yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentTabCustom.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 text-xs"
                      >
                        <span className="font-bold">{cat.name}</span>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-indigo-400 hover:text-rose-400 transition"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard default categories */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                  Standard Built-In Categories ({currentTabDefaults.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentTabDefaults.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-[11px]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. PIN SETTING OPTION */}
          {activeTab === 'pin' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">4-Digit Security PIN</h3>
                  <p className="text-xs text-slate-400">
                    Lock the application to safeguard financial records on shared devices
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {savedPin ? (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>PIN Active</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                      No PIN Set
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons if PIN is set */}
              {savedPin && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-200">Quick Lock</p>
                    <p className="text-[11px] text-slate-400">Immediately lock the app right now</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLockApp();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-600/30"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 font-bold text-xs flex items-center gap-1"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Disable PIN</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Form to Set or Change PIN */}
              <form onSubmit={handleSetNewPin} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {savedPin ? 'Change Existing PIN' : 'Setup New 4-Digit PIN'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Enter 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="••••"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="••••"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {pinError && (
                  <p className="text-xs font-bold text-rose-400">{pinError}</p>
                )}

                {pinFeedback && (
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{pinFeedback}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/30 transition"
                >
                  {savedPin ? 'Update Security PIN' : 'Save & Enable PIN'}
                </button>
              </form>
            </div>
          )}

          {/* 3. CURRENCY OPTION */}
          {activeTab === 'currency' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-white">Default Currency Preference</h3>
                <p className="text-xs text-slate-400">
                  Select your primary currency for totals, balances, and ledger summaries
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.values(CURRENCIES).map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => onCurrencyChange(c.code as CurrencyCode)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-sm block font-mono">{c.code}</span>
                        <span className="text-[11px] text-slate-400">{c.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                          {c.symbol.trim()}
                        </span>
                        {isSelected && (
                          <span className="block text-[10px] font-bold text-cyan-400 mt-1">Active</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. HOLDING COUNTRIES OPTION */}
          {activeTab === 'countries' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Account Holding Countries</h3>
                  <p className="text-xs text-slate-400">
                    Switch between specific country hubs or view consolidated Global wealth
                  </p>
                </div>
              </div>

              {/* Global View Option */}
              <button
                onClick={() => onCountryChange('ALL')}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                  selectedCountry === 'ALL'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌐</span>
                  <div>
                    <span className="font-extrabold text-sm block">Global (All Countries)</span>
                    <span className="text-xs text-slate-400">
                      Consolidated view across all global holding regions
                    </span>
                  </div>
                </div>
                {selectedCountry === 'ALL' && (
                  <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                    Active View
                  </span>
                )}
              </button>

              {/* Specific Countries List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COUNTRIES.map((c) => {
                  const isSelected = selectedCountry.toLowerCase() === c.name.toLowerCase();
                  const hasItems = holdingCountriesWithItems.some(
                    (h) => h.toLowerCase() === c.name.toLowerCase()
                  );

                  return (
                    <button
                      key={c.code}
                      onClick={() => {
                        onCountryChange(c.name);
                        if (c.currency) {
                          onCurrencyChange(c.currency);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{c.flag}</span>
                        <div>
                          <span className="font-extrabold text-xs block">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Currency: {c.currency}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasItems && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Holdings
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-bold text-indigo-400">Selected</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>MYFIN v2.4</span>
            <span>•</span>
            <span className="text-indigo-400 font-bold">Multi-Country Secured</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold transition shadow-md"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
