import React from 'react';
import { Coins, Plus, Edit2, Trash2, Shield, TrendingUp, Info } from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';

interface AssetSectionProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  onAddItem: () => void;
  onEditItem: (item: FinancialItem) => void;
  onDeleteItem: (id: string) => void;
}

export const AssetSection: React.FC<AssetSectionProps> = ({
  items,
  currency,
  onAddItem,
  onEditItem,
  onDeleteItem
}) => {
  const assetItems = items.filter((i) => i.type === 'asset');
  const totalAssetValue = assetItems.reduce((acc, i) => acc + i.amount, 0);
  const totalPurchasePrice = assetItems.reduce((acc, i) => acc + (i.purchasePrice || i.amount), 0);
  const totalGain = totalAssetValue - totalPurchasePrice;
  const gainPercentage = totalPurchasePrice > 0 ? (totalGain / totalPurchasePrice) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Section Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/40 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  GOLD & INDEPENDENT ASSETS
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Valuation Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pure wealth valuation tracking — standalone holdings without active transaction operations.
              </p>
            </div>
          </div>

          <button
            onClick={onAddItem}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Asset</span>
          </button>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Asset Valuation</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              {formatCurrency(totalAssetValue, currency)}
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Acquisition / Cost Basis</div>
            <div className="text-lg font-black text-slate-200 font-mono mt-0.5">
              {formatCurrency(totalPurchasePrice, currency)}
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Unrealized Growth</div>
            <div className={`text-lg font-black font-mono mt-0.5 ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, currency)} ({gainPercentage.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Asset Items List */}
      {assetItems.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <Coins className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No Independent Assets Listed</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add Gold, Jewellery, Real Estate, Land, Vehicles or collectibles to include their current valuation in your total net worth.
          </p>
          <button
            onClick={onAddItem}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition border border-amber-500/30"
          >
            + Add First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assetItems.map((asset) => {
            const purchase = asset.purchasePrice || asset.amount;
            const gain = asset.amount - purchase;
            const gainPct = purchase > 0 ? (gain / purchase) * 100 : 0;

            return (
              <div
                key={asset.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-4 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {asset.assetCategory || 'Gold & Asset'}
                      </span>
                      <h3 className="text-base font-black text-white mt-1.5">
                        {asset.title}
                      </h3>
                      {asset.purityOrUnits && (
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                          Holdings: {asset.purityOrUnits}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(asset)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Edit Asset"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(asset.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Valuation metrics */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Current Estimated Value</div>
                      <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                        {formatCurrency(asset.amount, currency)}
                      </div>
                    </div>
                    {purchase > 0 && (
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Acquisition Cost</div>
                        <div className="text-xs font-semibold text-slate-300 font-mono mt-0.5">
                          {formatCurrency(purchase, currency)}
                        </div>
                        <div className={`text-[11px] font-bold font-mono mt-0.5 ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {asset.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg mt-3 border border-slate-800/50">
                      {asset.notes}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-400" />
                    Independent Holding (No operations)
                  </span>
                  <span>Updated {new Date(asset.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
