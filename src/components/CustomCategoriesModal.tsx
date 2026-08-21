import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag,
  FolderPlus,
  Check,
  Sparkles,
  Receipt,
  FileText,
  Coins,
  TrendingUp
} from 'lucide-react';
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

interface CustomCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated?: () => void;
}

export const CustomCategoriesModal: React.FC<CustomCategoriesModalProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdated
}) => {
  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [customList, setCustomList] = useState<CategoryItem[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [feedback, setFeedback] = useState('');

  const refreshCategories = () => {
    setCustomList(getCustomCategories());
  };

  useEffect(() => {
    if (isOpen) {
      refreshCategories();
      setNewCatName('');
      setFeedback('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCustomCategory(newCatName, activeTab);
    setNewCatName('');
    setFeedback('Category added successfully!');
    setTimeout(() => setFeedback(''), 2000);
    refreshCategories();
    if (onCategoriesUpdated) onCategoriesUpdated();
  };

  const handleDelete = (id: string) => {
    deleteCustomCategory(id);
    refreshCategories();
    if (onCategoriesUpdated) onCategoriesUpdated();
  };

  const currentTabCustom = customList.filter((c) => c.type === activeTab);
  const currentTabDefaults =
    activeTab === 'expense'
      ? DEFAULT_EXPENSE_CATEGORIES
      : activeTab === 'income'
      ? DEFAULT_INCOME_CATEGORIES
      : activeTab === 'reminder'
      ? DEFAULT_REMINDER_CATEGORIES
      : DEFAULT_ASSET_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Custom Categories Manager</h2>
              <p className="text-xs text-slate-400">
                Separate Income & Expense categories with personalized tags
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 grid grid-cols-4 gap-1.5">
          <button
            onClick={() => setActiveTab('expense')}
            className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition ${
              activeTab === 'expense'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition ${
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>

          <button
            onClick={() => setActiveTab('reminder')}
            className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition ${
              activeTab === 'reminder'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Reminders</span>
          </button>

          <button
            onClick={() => setActiveTab('asset')}
            className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition ${
              activeTab === 'asset'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Assets</span>
          </button>
        </div>

        {/* Form to Add New Category */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              required
              placeholder={`New ${activeTab} category (e.g. ${
                activeTab === 'expense'
                  ? 'Freelance Tools, Pet Care'
                  : activeTab === 'income'
                  ? 'Consulting, Rental Yield'
                  : activeTab === 'reminder'
                  ? 'Passport Renewal'
                  : 'Rolex Watch'
              })`}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
          {feedback && (
            <p className="text-[11px] font-bold text-emerald-400 mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{feedback}</span>
            </p>
          )}
        </div>

        {/* Body Lists */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Custom Categories List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-indigo-400">
                Your Custom Categories ({currentTabCustom.length})
              </span>
            </div>

            {currentTabCustom.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                No custom categories added yet for {activeTab}. Use the input above to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentTabCustom.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 group hover:border-indigo-500/50 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span className="font-bold text-white truncate">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Standard Default Categories Reference */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Default System Categories ({currentTabDefaults.length})
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
