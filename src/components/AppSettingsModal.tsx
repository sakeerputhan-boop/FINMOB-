import React, { useState, useMemo } from 'react';
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
  Palette
} from 'lucide-react';
import { CurrencyCode, UserProfile, SyncState, FinancialItem, AppTheme } from '../types';
import { COUNTRIES, CURRENCIES, getCountryByName } from '../utils/currency';
import { THEMES, getSavedTheme, saveTheme } from '../utils/theme';
import {
  CategoryItem,
  CategoryType,
  getCustomCategories,
  addCustomCategory,
  deleteCustomCategory,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_REMINDER_CATEGORIES,
  DEFAULT_ASSET_CATEGORIES
} from '../utils/categories';

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
  currentTheme: propTheme,
  onThemeChange
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'categories' | 'pin' | 'currency' | 'countries'>('themes');
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(() => propTheme || getSavedTheme());

  const handleSelectTheme = (themeId: AppTheme) => {
    setSelectedTheme(themeId);
    saveTheme(themeId);
    if (onThemeChange) {
      onThemeChange(themeId);
    }
  };

  // Categories Sub-tab
  const [categoryType, setCategoryType] = useState<CategoryType>('expense');
  const [customList, setCustomList] = useState<CategoryItem[]>(getCustomCategories());
  const [newCatName, setNewCatName] = useState('');
  const [catFeedback, setCatFeedback] = useState('');

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
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-5 gap-1.5">
          
          <button
            onClick={() => setActiveTab('themes')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
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
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
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
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
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
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
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
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
              activeTab === 'countries'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
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
