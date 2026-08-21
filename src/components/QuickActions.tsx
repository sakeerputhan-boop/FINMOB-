import React from 'react';
import {
  Plus,
  Building2,
  CreditCard,
  Building,
  PiggyBank,
  Coins,
  Banknote,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { ItemType } from '../types';

interface QuickActionsProps {
  onOpenAddItem: (type: ItemType) => void;
  onOpenCreditSimulator: () => void;
  onOpenWhatsAppPdf: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenAddItem,
  onOpenCreditSimulator,
  onOpenWhatsAppPdf
}) => {
  return (
    <div className="rounded-2xl bg-white text-slate-900 p-5 shadow-xl border border-slate-100 transition-all">
      {/* Title with Sparkle Icon matching FINMOB screenshot */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
          <span className="text-lg font-bold">✨</span>
        </div>
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          MYFIN Quick Actions
        </h2>
      </div>

      {/* Grid / Wrap of Action Pills */}
      <div className="flex flex-wrap gap-2.5">
        
        {/* Add Bank Account */}
        <button
          onClick={() => onOpenAddItem('bank_account')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-500" />
          <span>Add Bank Account</span>
        </button>

        {/* Add Credit Card */}
        <button
          onClick={() => onOpenAddItem('credit_card')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-500" />
          <span>Add Credit Card</span>
        </button>

        {/* Add EMI Loan */}
        <button
          onClick={() => onOpenAddItem('emi_loan')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-500" />
          <span>Add EMI Loan</span>
        </button>

        {/* Add Fixed Deposit */}
        <button
          onClick={() => onOpenAddItem('fixed_deposit')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-500" />
          <span>Add Fixed Deposit</span>
        </button>

        {/* Add Gold & Asset (Independent) */}
        <button
          onClick={() => onOpenAddItem('asset')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-amber-500" />
          <span>Add Gold & Asset</span>
        </button>

        {/* Manage Cash */}
        <button
          onClick={() => onOpenAddItem('cash_entry')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition shadow-sm"
        >
          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          <span>Manage Cash</span>
        </button>

        {/* Credit Simulator */}
        <button
          onClick={onOpenCreditSimulator}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold transition shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Credit Simulator</span>
        </button>

        {/* WhatsApp PDF */}
        <button
          onClick={onOpenWhatsAppPdf}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-50/80 border border-cyan-200 text-cyan-800 hover:bg-cyan-100 text-xs font-bold transition shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
          <span>WhatsApp PDF</span>
        </button>

      </div>
    </div>
  );
};
