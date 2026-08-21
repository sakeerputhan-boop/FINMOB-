import React, { useState } from 'react';
import {
  Coins,
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  Shield,
  TrendingUp,
  Percent,
  Calendar,
  Building,
  Layers,
  Sparkles
} from 'lucide-react';
import { FinancialItem, CurrencyCode, AssetCategory } from '../types';
import { formatCurrency, formatItemAmount } from '../utils/currency';

interface AssetSectionProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  selectedCountry: string; // 'ALL' or 'UAE', 'India', etc.
  onAddItem: (category?: AssetCategory | 'fixed_deposit') => void;
  onEditItem: (item: FinancialItem) => void;
  onDeleteItem: (item: FinancialItem) => void;
}

export const AssetSection: React.FC<AssetSectionProps> = ({
  items = [],
  currency,
  selectedCountry,
  onAddItem,
  onEditItem,
  onDeleteItem
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Filter assets and FDs by selected country if not 'ALL'
  const allAssetItems = items.filter(
    (i) =>
      (i.type === 'asset' || i.type === 'fixed_deposit') &&
      (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
  );

  // Categorize
  const fdItems = allAssetItems.filter((i) => i.type === 'fixed_deposit');
  const goldItems = allAssetItems.filter(
    (i) => i.type === 'asset' && (i.assetCategory === 'Gold & Jewellery' || i.assetCategory === 'Precious Metals')
  );
  const realEstateItems = allAssetItems.filter(
    (i) => i.type === 'asset' && i.assetCategory === 'Real Estate / Land'
  );
  const stockItems = allAssetItems.filter(
    (i) => i.type === 'asset' && i.assetCategory === 'Stocks & Bonds'
  );
  const otherItems = allAssetItems.filter(
    (i) =>
      i.type === 'asset' &&
      i.assetCategory !== 'Gold & Jewellery' &&
      i.assetCategory !== 'Precious Metals' &&
      i.assetCategory !== 'Real Estate / Land' &&
      i.assetCategory !== 'Stocks & Bonds'
  );

  // Filtered list based on active sub-category pill
  const filteredList =
    activeCategoryFilter === 'all'
      ? allAssetItems
      : activeCategoryFilter === 'fixed_deposit'
      ? fdItems
      : activeCategoryFilter === 'gold'
      ? goldItems
      : activeCategoryFilter === 'real_estate'
      ? realEstateItems
      : activeCategoryFilter === 'stocks'
      ? stockItems
      : otherItems;

  const totalAssetValue = allAssetItems.reduce((acc, i) => acc + i.amount, 0);
  const totalFdValue = fdItems.reduce((acc, i) => acc + i.amount, 0);
  const totalPhysicalGold = goldItems.reduce((acc, i) => acc + i.amount, 0);
  const totalRealEstate = realEstateItems.reduce((acc, i) => acc + i.amount, 0);
  const totalCostBasis = allAssetItems.reduce((acc, i) => acc + (i.purchasePrice || i.amount), 0);
  const totalGain = totalAssetValue - totalCostBasis;
  const gainPercentage = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  return (
    <div className="space-y-4">
      
      {/* Consolidated Asset Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-800/40 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  ASSET PORTFOLIO (GOLD, FDS & VALUATIONS)
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Consolidated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total wealth assets: Fixed Deposits (FDs), Physical Gold, Real Estate, Land, and Investments.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onAddItem('fixed_deposit')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition"
            >
              <PiggyBank className="w-4 h-4" />
              <span>+ Add FD</span>
            </button>
            <button
              onClick={() => onAddItem('Gold & Jewellery')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition"
            >
              <Coins className="w-4 h-4" />
              <span>+ Add Gold / Asset</span>
            </button>
          </div>
        </div>

        {/* Portfolio Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Asset Valuation</div>
            <div className="text-base font-black text-amber-400 font-mono mt-0.5">
              {formatCurrency(totalAssetValue, currency)}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-purple-400 uppercase">Fixed Deposits (FD)</div>
            <div className="text-base font-black text-purple-300 font-mono mt-0.5">
              {formatCurrency(totalFdValue, currency)}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-amber-400 uppercase">Gold & Precious Metals</div>
            <div className="text-base font-black text-amber-300 font-mono mt-0.5">
              {formatCurrency(totalPhysicalGold, currency)}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Unrealized Growth</div>
            <div className={`text-base font-black font-mono mt-0.5 ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Category Sub-Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            activeCategoryFilter === 'all'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          All Assets ({allAssetItems.length})
        </button>
        <button
          onClick={() => setActiveCategoryFilter('fixed_deposit')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${
            activeCategoryFilter === 'fixed_deposit'
              ? 'bg-purple-600 text-white font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>Fixed Deposits ({fdItems.length})</span>
        </button>
        <button
          onClick={() => setActiveCategoryFilter('gold')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${
            activeCategoryFilter === 'gold'
              ? 'bg-amber-600 text-white font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Gold & Jewellery ({goldItems.length})</span>
        </button>
        <button
          onClick={() => setActiveCategoryFilter('real_estate')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${
            activeCategoryFilter === 'real_estate'
              ? 'bg-emerald-600 text-white font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Real Estate / Land ({realEstateItems.length})</span>
        </button>
        {stockItems.length > 0 && (
          <button
            onClick={() => setActiveCategoryFilter('stocks')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeCategoryFilter === 'stocks'
                ? 'bg-indigo-600 text-white font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Stocks & Funds ({stockItems.length})
          </button>
        )}
      </div>

      {/* Asset Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <Coins className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No Assets in this Category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add Fixed Deposits (FDs), Gold Bullion, Jewellery, Land, or Investments to track their valuation in your net worth.
          </p>
          <button
            onClick={() => onAddItem()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition border border-amber-500/30"
          >
            + Add First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map((item) => {
            const isFd = item.type === 'fixed_deposit';
            const itemCurr = item.currency || currency;
            const purchase = item.purchasePrice || item.amount;
            const gain = item.amount - purchase;
            const gainPct = purchase > 0 ? (gain / purchase) * 100 : 0;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-4 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                            isFd
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : item.assetCategory === 'Gold & Jewellery'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isFd ? 'Fixed Deposit (FD)' : item.assetCategory || 'Asset'}
                        </span>
                        {item.country && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {item.country}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-white mt-1.5">
                        {item.title}
                      </h3>
                      {item.bankName && (
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                          {item.bankName}
                        </p>
                      )}
                      {item.purityOrUnits && (
                        <p className="text-xs font-semibold text-amber-300/90 mt-0.5">
                          Holdings: {item.purityOrUnits}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Edit Asset"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Valuation Display Box */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {isFd ? 'Deposit Principal' : 'Estimated Current Value'}
                      </div>
                      <div
                        className={`text-lg font-black font-mono mt-0.5 ${
                          isFd ? 'text-purple-300' : 'text-amber-400'
                        }`}
                      >
                        {formatCurrency(item.amount, itemCurr)}
                      </div>
                    </div>

                    {isFd ? (
                      <div className="text-right">
                        {item.interestRate && (
                          <div className="text-xs font-bold text-purple-400 flex items-center gap-1 justify-end">
                            <Percent className="w-3 h-3" /> {item.interestRate}% p.a.
                          </div>
                        )}
                        {item.maturityDate && (
                          <div className="text-[11px] font-bold text-amber-300 mt-0.5">
                            Matures: {item.maturityDate}
                          </div>
                        )}
                      </div>
                    ) : (
                      item.purchasePrice && item.purchasePrice > 0 && (
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Acquisition</div>
                          <div className="text-xs font-bold text-slate-300 font-mono">
                            {formatCurrency(item.purchasePrice, itemCurr)}
                          </div>
                          <div
                            className={`text-[11px] font-bold font-mono ${
                              gain >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg mt-2.5 border border-slate-800/50">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Shield className={`w-3 h-3 ${isFd ? 'text-purple-400' : 'text-amber-400'}`} />
                    {isFd ? 'Locked Term Investment' : 'Valuation Holding'}
                  </span>
                  <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
