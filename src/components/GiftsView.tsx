import React, { useState, useMemo } from 'react';
import {
  Gift,
  Heart,
  Plus,
  Share2,
  Search,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  RotateCcw,
  Tag,
  User,
  MapPin,
  FileText,
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Coins
} from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency, getCountryByName } from '../utils/currency';

interface GiftsViewProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  selectedCountry: string;
  onAddGift: (direction: 'received' | 'given' | 'borrow' | 'lend') => void;
  onEditGift: (gift: FinancialItem) => void;
  onDeleteGift: (gift: FinancialItem) => void;
  onOpenPdfShare: () => void;
  onToggleIouStatus?: (item: FinancialItem) => void;
}

export const GiftsView: React.FC<GiftsViewProps> = ({
  items = [],
  currency,
  selectedCountry,
  onAddGift,
  onEditGift,
  onDeleteGift,
  onOpenPdfShare,
  onToggleIouStatus
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'gifts' | 'borrow' | 'lend'>('all');
  const [filterOccasion, setFilterOccasion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract gifts and IOU items matching country
  const giftAndIouItems = useMemo(() => {
    return items.filter(
      (i) =>
        (i.type === 'gift' || i.type === 'iou') &&
        (selectedCountry === 'ALL' || !i.country || i.country.toLowerCase() === selectedCountry.toLowerCase())
    );
  }, [items, selectedCountry]);

  // Occasions list for gifts
  const occasions = useMemo(() => {
    const set = new Set<string>();
    giftAndIouItems.forEach((g) => {
      if (g.occasion) set.add(g.occasion);
    });
    return Array.from(set);
  }, [giftAndIouItems]);

  // Aggregates
  const giftItems = giftAndIouItems.filter((i) => i.type === 'gift');
  const totalReceived = giftItems.filter((g) => g.giftDirection === 'received');
  const totalGiven = giftItems.filter((g) => g.giftDirection === 'given');
  const totalReceivedVal = totalReceived.reduce((acc, g) => acc + (g.amount || 0), 0);
  const totalGivenVal = totalGiven.reduce((acc, g) => acc + (g.amount || 0), 0);

  const iouItems = giftAndIouItems.filter((i) => i.type === 'iou');
  const borrowItems = iouItems.filter((i) => i.iouType === 'borrow');
  const lendItems = iouItems.filter((i) => i.iouType === 'lend');

  const totalBorrowed = borrowItems.reduce((acc, i) => acc + (i.amount - (i.settledAmount || 0)), 0);
  const totalLent = lendItems.reduce((acc, i) => acc + (i.amount - (i.settledAmount || 0)), 0);

  // Filtered list based on active tab and search
  const filteredList = useMemo(() => {
    return giftAndIouItems.filter((item) => {
      // Tab filter
      let matchTab = true;
      if (activeTab === 'gifts') matchTab = item.type === 'gift';
      else if (activeTab === 'borrow') matchTab = item.type === 'iou' && item.iouType === 'borrow';
      else if (activeTab === 'lend') matchTab = item.type === 'iou' && item.iouType === 'lend';

      // Occasion filter (only for gifts)
      const matchOcc = filterOccasion === 'all' || !item.occasion || item.occasion === filterOccasion;

      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.personName && item.personName.toLowerCase().includes(q)) ||
        (item.person && item.person.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.giftDescription && item.giftDescription.toLowerCase().includes(q)) ||
        (item.occasion && item.occasion.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      return matchTab && matchOcc && matchSearch;
    });
  }, [giftAndIouItems, activeTab, filterOccasion, searchQuery]);

  return (
    <div className="space-y-4">
      
      {/* Top Banner Card */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-purple-400">Registry & Peer Lending</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {giftAndIouItems.length} Total Record(s)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-0.5">Gift & IOU Manager</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track wedding & festival gifts alongside personal Borrow & Lend (IOU) records with settlement statuses.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 self-start lg:self-auto">
            <button
              onClick={onOpenPdfShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition shadow-sm"
              title="Export Statement / WhatsApp Share"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>PDF / WhatsApp</span>
            </button>

            <button
              onClick={() => onAddGift('borrow')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/50 font-extrabold text-xs shadow-md transition"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Borrow (I Owe)</span>
            </button>

            <button
              onClick={() => onAddGift('lend')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 font-extrabold text-xs shadow-md transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Lend (They Owe)</span>
            </button>

            <button
              onClick={() => onAddGift('received')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>+ Gift</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-purple-900/40 text-xs">
          
          {/* Gifts Received */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1">
              <Gift className="w-3 h-3" />
              Gifts Received
            </span>
            <div className="text-base font-black text-purple-300 font-mono mt-0.5">
              {formatCurrency(totalReceivedVal, currency)}
            </div>
            <span className="text-[10px] text-slate-500">{totalReceived.length} items recorded</span>
          </div>

          {/* Gifts Given */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-pink-400 flex items-center gap-1">
              <Heart className="w-3 h-3" />
              Gifts Given
            </span>
            <div className="text-base font-black text-pink-300 font-mono mt-0.5">
              {formatCurrency(totalGivenVal, currency)}
            </div>
            <span className="text-[10px] text-slate-500">{totalGiven.length} items recorded</span>
          </div>

          {/* Borrowed (I Owe) */}
          <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-800/30">
            <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3" />
              Borrowed (I Owe)
            </span>
            <div className="text-base font-black text-rose-300 font-mono mt-0.5">
              {formatCurrency(totalBorrowed, currency)}
            </div>
            <span className="text-[10px] text-rose-400/80">{borrowItems.length} active loan(s)</span>
          </div>

          {/* Lent (They Owe Me) */}
          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-800/30">
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Lent (They Owe Me)
            </span>
            <div className="text-base font-black text-emerald-300 font-mono mt-0.5">
              {formatCurrency(totalLent, currency)}
            </div>
            <span className="text-[10px] text-emerald-400/80">{lendItems.length} active lending(s)</span>
          </div>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
        
        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              activeTab === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Records ({giftAndIouItems.length})
          </button>

          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'gifts' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>🎁 Gifts ({giftItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('borrow')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'borrow' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>📥 Borrow ({borrowItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('lend')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'lend' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>📤 Lend ({lendItems.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          {occasions.length > 0 && activeTab === 'gifts' && (
            <select
              value={filterOccasion}
              onChange={(e) => setFilterOccasion(e.target.value)}
              className="bg-slate-950 text-slate-300 border border-slate-800 text-xs rounded-xl px-2.5 py-2 outline-none font-medium"
            >
              <option value="all">All Occasions</option>
              {occasions.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search person, description, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

      </div>

      {/* Content Grid */}
      {filteredList.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <HandCoins className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No Gift or IOU Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Record wedding & festival gifts or keep track of peer borrowing and lending.
          </p>
          <div className="flex items-center justify-center flex-wrap gap-2">
            <button
              onClick={() => onAddGift('borrow')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold transition shadow-md"
            >
              + Borrow (I Owe)
            </button>
            <button
              onClick={() => onAddGift('lend')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition shadow-md"
            >
              + Lend (They Owe)
            </button>
            <button
              onClick={() => onAddGift('received')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold transition shadow-md"
            >
              + Gift Received
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map((item) => {
            const isIou = item.type === 'iou';
            const isBorrow = isIou && item.iouType === 'borrow';
            const isLend = isIou && item.iouType === 'lend';
            const isReceived = !isIou && item.giftDirection === 'received';
            const itemCurr = item.currency || currency;
            const flag = item.country ? getCountryByName(item.country).flag : '';

            // IOU remaining balance
            const remainingBalance = isIou ? (item.amount || 0) - (item.settledAmount || 0) : 0;
            const isSettled = isIou && (item.iouStatus === 'settled' || remainingBalance <= 0);

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  
                  {/* Card Header: Type Tag, Person Name, Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-2xl border ${
                          isBorrow
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : isLend
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isReceived
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                        }`}
                      >
                        {isBorrow ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : isLend ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : isReceived ? (
                          <Gift className="w-5 h-5" />
                        ) : (
                          <Heart className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                              isBorrow
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : isLend
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : isReceived
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                            }`}
                          >
                            {isBorrow
                              ? '📥 Borrowed (I Owe)'
                              : isLend
                              ? '📤 Lent (They Owe Me)'
                              : isReceived
                              ? '🎁 Gift Received'
                              : '💝 Gift Given'}
                          </span>

                          {isIou && (
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                isSettled
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {isSettled ? '✅ Settled' : '⏳ Pending'}
                            </span>
                          )}

                          {!isIou && item.occasion && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {item.occasion}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-black text-white mt-1">
                          {item.personName || item.person || item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditGift(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGift(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content & Valuation */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          {isIou ? 'Loan Total' : 'Gift Description'}
                        </div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">
                          {isIou
                            ? formatCurrency(item.amount, itemCurr)
                            : item.giftDescription || item.subtitle || '—'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          {isIou ? 'Remaining Due' : 'Valuation / Cash'}
                        </div>
                        <div className={`text-base font-black font-mono mt-0.5 ${
                          isBorrow ? 'text-rose-400' : isLend ? 'text-emerald-400' : 'text-white'
                        }`}>
                          {isIou ? (
                            <span>{formatCurrency(remainingBalance, itemCurr)}</span>
                          ) : item.amount ? (
                            <span>{flag} {formatCurrency(item.amount, itemCurr)}</span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Sentimental</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* IOU Repaid progress */}
                    {isIou && item.settledAmount && item.settledAmount > 0 && (
                      <div className="pt-1.5 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
                        <span>Already Repaid:</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {formatCurrency(item.settledAmount, itemCurr)}
                        </span>
                      </div>
                    )}

                    {/* Date and Country */}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{item.dueDate || (item.createdAt ? item.createdAt.split('T')[0] : '—')}</span>
                        {item.country && <span>• {item.country}</span>}
                      </div>

                      {/* Return Gift Status for received gifts */}
                      {!isIou && isReceived && item.returnGiftStatus && item.returnGiftStatus !== 'not_applicable' && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                            item.returnGiftStatus === 'returned'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20 animate-pulse'
                          }`}
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>{item.returnGiftStatus === 'returned' ? 'Returned' : 'Need to Return'}</span>
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/50">
                        "{item.notes}"
                      </p>
                    )}

                  </div>

                </div>

                {/* Bottom Card Footer */}
                <div className="pt-2 mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40">
                  <span>Record ID: #{item.id.slice(-6)}</span>
                  <span>{isIou ? 'Personal IOU' : 'Gift Record'}</span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
