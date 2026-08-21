import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { FinancialItem, Transaction } from '../types';
import { formatCurrency } from '../utils/currency';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemToDelete?: FinancialItem | null;
  transactionToDelete?: Transaction | null;
  itemName?: string;
  itemType?: string;
  itemAmount?: number;
  itemCurrency?: any;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Permanent Deletion',
  description,
  itemToDelete,
  transactionToDelete,
  itemName,
  itemType,
  itemAmount,
  itemCurrency
}) => {
  if (!isOpen) return null;

  const displayTitle =
    itemToDelete?.title ||
    transactionToDelete?.description ||
    itemName ||
    'Selected Item';

  const displayType =
    itemToDelete?.type?.replace('_', ' ').toUpperCase() ||
    (transactionToDelete ? `TRANSACTION (${transactionToDelete.type.replace('_', ' ').toUpperCase()})` : '') ||
    itemType ||
    'RECORD';

  const amount =
    itemToDelete?.amount !== undefined
      ? itemToDelete.amount
      : transactionToDelete?.amount !== undefined
      ? transactionToDelete.amount
      : itemAmount;

  const curr =
    itemToDelete?.currency ||
    transactionToDelete?.currency ||
    itemCurrency ||
    'AED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-rose-600/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-rose-950/60 animate-in zoom-in-95 duration-150">
        
        {/* Header Alert Strip */}
        <div className="bg-rose-950/80 border-b border-rose-800/60 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/40">
              <AlertTriangle className="w-6 h-6 text-rose-500 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-100 tracking-wide">
                {title}
              </h3>
              <p className="text-xs text-rose-300/80">
                Permanent Action • Cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {description ||
              'Are you sure you want to permanently delete this record from your MYFIN account? This will remove all associated ledger data and balance calculations.'}
          </p>

          {/* Item Details Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-900/40 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              <span>{displayType}</span>
              {itemToDelete?.country && <span>{itemToDelete.country}</span>}
            </div>
            <div className="text-sm font-black text-white truncate">
              {displayTitle}
            </div>
            {amount !== undefined && (
              <div className="text-base font-black text-rose-400 font-mono pt-1 border-t border-slate-800/80">
                {formatCurrency(amount, curr)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
