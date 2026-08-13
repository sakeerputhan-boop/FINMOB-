import React, { useState } from 'react';
import { X, ShieldCheck, TrendingUp, Sparkles, AlertCircle, CheckCircle2, Calculator } from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';

interface CreditSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: FinancialItem[];
  currency: CurrencyCode;
}

export const CreditSimulatorModal: React.FC<CreditSimulatorModalProps> = ({
  isOpen,
  onClose,
  items,
  currency
}) => {
  const [extraPayment, setExtraPayment] = useState('10000');
  const [simulateCardPayoff, setSimulateCardPayoff] = useState(true);
  const [simulateNewFD, setSimulateNewFD] = useState(false);

  if (!isOpen) return null;

  const cardItems = items.filter((i) => i.type === 'credit_card');
  const loanItems = items.filter((i) => i.type === 'emi_loan');
  
  const totalCardDue = cardItems.reduce((acc, i) => acc + i.amount, 0);
  const totalLoanBalance = loanItems.reduce((acc, i) => acc + i.amount, 0);
  const totalDebt = totalCardDue + totalLoanBalance;

  const totalCreditLimit = cardItems.reduce((acc, i) => acc + (i.creditLimit || 150000), 0);
  const currentUtilization = totalCreditLimit > 0 ? (totalCardDue / totalCreditLimit) * 100 : 0;

  // Calculate simulated utilization
  const simulatedCardDue = simulateCardPayoff ? Math.max(0, totalCardDue - parseFloat(extraPayment || '0')) : totalCardDue;
  const simulatedUtilization = totalCreditLimit > 0 ? (simulatedCardDue / totalCreditLimit) * 100 : 0;

  // Estimate Credit Score
  let baseScore = 740;
  if (currentUtilization > 50) baseScore -= 45;
  else if (currentUtilization > 30) baseScore -= 20;
  else if (currentUtilization < 10) baseScore += 25;

  let simulatedScore = 740;
  if (simulatedUtilization > 50) simulatedScore -= 45;
  else if (simulatedUtilization > 30) simulatedScore -= 20;
  else if (simulatedUtilization < 10) simulatedScore += 25;

  const scoreImprovement = Math.max(0, simulatedScore - baseScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                FINMOB Credit & Debt Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Simulate credit score boost & interest savings
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Estimated Score Meter */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 border border-amber-800/40 text-center">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Current Estimated Credit Score</div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                {baseScore} <span className="text-xs text-slate-400">/ 900</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Credit Utilization: {currentUtilization.toFixed(1)}%
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-emerald-800/50">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Simulated Future Score</div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                {simulatedScore} <span className="text-xs text-slate-400">/ 900</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-bold mt-1">
                +{scoreImprovement} Points Potential Boost
              </p>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>Debt Paydown Simulation</span>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Lump Sum Debt Payoff Amount ({formatCurrency(0, currency)[0]})
              </label>
              <input
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateCardPayoff}
                  onChange={(e) => setSimulateCardPayoff(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Apply payoff to high-interest Credit Card balance ({formatCurrency(totalCardDue, currency)})</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateNewFD}
                  onChange={(e) => setSimulateNewFD(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Simulate moving surplus liquid cash into 7.5% High-Yield FD</span>
              </label>
            </div>
          </div>

          {/* Key Takeaway Insights */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-1.5 text-indigo-200">
            <div className="font-bold flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Smart Wealth Recommendation:</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Keeping credit utilization below 30% ({formatCurrency(totalCreditLimit * 0.3, currency)}) is the single fastest way to boost your score above 800 while saving up to 36% p.a. on card interest charges.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
