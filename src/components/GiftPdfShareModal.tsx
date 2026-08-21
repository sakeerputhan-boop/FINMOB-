import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  Printer,
  Copy,
  Check,
  Gift,
  Heart,
  Calendar,
  Filter,
  Layers,
  Sparkles,
  Download,
  Loader2
} from 'lucide-react';
import { FinancialItem, CurrencyCode } from '../types';
import { formatCurrency, getCountryByName } from '../utils/currency';
import { generateGiftsPdf } from '../utils/pdfGenerator';

interface GiftPdfShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: FinancialItem[];
  currency: CurrencyCode;
}

export const GiftPdfShareModal: React.FC<GiftPdfShareModalProps> = ({
  isOpen,
  onClose,
  items,
  currency
}) => {
  const [filterDirection, setFilterDirection] = useState<'all' | 'received' | 'given'>('all');
  const [filterOccasion, setFilterOccasion] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Extract gifts
  const allGifts = useMemo(() => {
    return items.filter((i) => i.type === 'gift');
  }, [items]);

  // Distinct occasions
  const occasions = useMemo(() => {
    const set = new Set<string>();
    allGifts.forEach((g) => {
      if (g.occasion) set.add(g.occasion);
    });
    return Array.from(set);
  }, [allGifts]);

  // Distinct countries
  const giftCountries = useMemo(() => {
    const set = new Set<string>();
    allGifts.forEach((g) => {
      if (g.country) set.add(g.country);
    });
    return Array.from(set);
  }, [allGifts]);

  // Filtered gifts list
  const filteredGifts = useMemo(() => {
    return allGifts.filter((g) => {
      const matchDir = filterDirection === 'all' || g.giftDirection === filterDirection;
      const matchOcc = filterOccasion === 'all' || g.occasion === filterOccasion;
      const matchCountry = filterCountry === 'all' || g.country === filterCountry;
      return matchDir && matchOcc && matchCountry;
    });
  }, [allGifts, filterDirection, filterOccasion, filterCountry]);

  // Stats
  const receivedGifts = filteredGifts.filter((g) => g.giftDirection === 'received');
  const givenGifts = filteredGifts.filter((g) => g.giftDirection === 'given');
  const totalReceivedAmount = receivedGifts.reduce((acc, g) => acc + (g.amount || 0), 0);
  const totalGivenAmount = givenGifts.reduce((acc, g) => acc + (g.amount || 0), 0);

  // Format WhatsApp Text
  const generateWhatsAppMessage = () => {
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    let msg = `🎁 *MYFIN - GIFTS REGISTRY REPORT*\n`;
    msg += `📅 *Date:* ${dateStr}\n`;
    if (filterOccasion !== 'all') msg += `🏷️ *Occasion:* ${filterOccasion}\n`;
    if (filterCountry !== 'all') msg += `🌍 *Country:* ${filterCountry}\n`;
    msg += `---------------------------------\n`;
    msg += `📥 *TOTAL RECEIVED:* ${receivedGifts.length} items (${formatCurrency(totalReceivedAmount, currency)})\n`;
    msg += `📤 *TOTAL GIVEN:* ${givenGifts.length} items (${formatCurrency(totalGivenAmount, currency)})\n`;
    msg += `---------------------------------\n\n`;

    if (receivedGifts.length > 0) {
      msg += `🎁 *GIFTS RECEIVED (IN):*\n`;
      receivedGifts.forEach((g, idx) => {
        const flag = g.country ? getCountryByName(g.country).flag : '';
        const amtStr = g.amount ? ` - ${formatCurrency(g.amount, g.currency || currency)}` : '';
        msg += `${idx + 1}. *${g.personName || g.title}* (${g.occasion || 'Event'})\n`;
        msg += `   • Item: ${g.giftDescription || 'Gift'}${amtStr} ${flag}\n`;
        if (g.dueDate) msg += `   • Date: ${g.dueDate}\n`;
        if (g.notes) msg += `   • Notes: ${g.notes}\n`;
      });
      msg += `\n`;
    }

    if (givenGifts.length > 0) {
      msg += `💝 *GIFTS GIVEN (OUT):*\n`;
      givenGifts.forEach((g, idx) => {
        const flag = g.country ? getCountryByName(g.country).flag : '';
        const amtStr = g.amount ? ` - ${formatCurrency(g.amount, g.currency || currency)}` : '';
        msg += `${idx + 1}. *${g.personName || g.title}* (${g.occasion || 'Event'})\n`;
        msg += `   • Item: ${g.giftDescription || 'Gift'}${amtStr} ${flag}\n`;
        if (g.dueDate) msg += `   • Date: ${g.dueDate}\n`;
        if (g.notes) msg += `   • Notes: ${g.notes}\n`;
      });
      msg += `\n`;
    }

    msg += `✨ _Generated securely via MYFIN Global_`;
    return msg;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Download PDF file directly using jsPDF
  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      const doc = generateGiftsPdf({
        items,
        currency,
        filterDirection,
        filterOccasion,
        filterCountry
      });

      const fileName = `MYFIN_Gifts_Registry_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate Gift PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    try {
      handleDownloadPdf();
    } catch {
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Gifts Registry PDF Report & WhatsApp Share</h2>
              <p className="text-xs text-slate-400">
                Independent gift records for weddings, festivals & occasions
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

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Direction Filter */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterDirection('all')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filterDirection === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({allGifts.length})
              </button>
              <button
                onClick={() => setFilterDirection('received')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  filterDirection === 'received' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Received ({allGifts.filter((g) => g.giftDirection === 'received').length})</span>
              </button>
              <button
                onClick={() => setFilterDirection('given')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  filterDirection === 'given' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Given ({allGifts.filter((g) => g.giftDirection === 'given').length})</span>
              </button>
            </div>

            {/* Occasion & Country dropdowns */}
            <div className="flex items-center gap-2 text-xs">
              {occasions.length > 0 && (
                <select
                  value={filterOccasion}
                  onChange={(e) => setFilterOccasion(e.target.value)}
                  className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1.5 outline-none font-medium"
                >
                  <option value="all">All Occasions</option>
                  {occasions.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              )}

              {giftCountries.length > 0 && (
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1.5 outline-none font-medium"
                >
                  <option value="all">All Countries</option>
                  {giftCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Actions: Download PDF, Print, Copy & WhatsApp */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition"
                title="Download Official PDF Document"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : pdfSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{pdfSuccess ? 'Downloaded!' : 'Download PDF'}</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition"
                title="Print or Save PDF"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Print</span>
              </button>

              <button
                onClick={handleCopyWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </button>
            </div>

          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Items</span>
              <div className="text-base font-black text-white font-mono mt-0.5">{filteredGifts.length} Records</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/30">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Received (Count / Value)</span>
              <div className="text-base font-black text-emerald-300 font-mono mt-0.5">
                {receivedGifts.length} • {formatCurrency(totalReceivedAmount, currency)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/30">
              <span className="text-[10px] uppercase font-bold text-purple-400">Given (Count / Value)</span>
              <div className="text-base font-black text-purple-300 font-mono mt-0.5">
                {givenGifts.length} • {formatCurrency(totalGivenAmount, currency)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-800/30">
              <span className="text-[10px] uppercase font-bold text-indigo-400">Net Valuation Balance</span>
              <div className="text-base font-black text-indigo-300 font-mono mt-0.5">
                {formatCurrency(totalReceivedAmount - totalGivenAmount, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Printable PDF Report View */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-950">
          
          <div className="printable-report bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 max-w-3xl mx-auto">
            
            {/* Report Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-white tracking-tight">MYFIN GIFTS REGISTRY</h1>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Official Record
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400">Scope:</span>
                <p className="font-bold text-slate-200">
                  {filterOccasion !== 'all' ? filterOccasion : 'All Occasions'} • {filterCountry !== 'all' ? filterCountry : 'Global'}
                </p>
              </div>
            </div>

            {/* Statement Table */}
            {filteredGifts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No gift records match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Person / Family</th>
                      <th className="py-2 px-2">Occasion</th>
                      <th className="py-2 px-2">Item Description</th>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredGifts.map((g) => {
                      const isReceived = g.giftDirection === 'received';
                      const itemCurr = g.currency || currency;
                      const flag = g.country ? getCountryByName(g.country).flag : '';

                      return (
                        <tr key={g.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-2">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                isReceived
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                              }`}
                            >
                              {isReceived ? '📥 Received' : '📤 Given'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-white">
                            {g.personName || g.title}
                          </td>
                          <td className="py-2.5 px-2 text-slate-300">
                            {g.occasion || 'Event'}
                          </td>
                          <td className="py-2.5 px-2 text-slate-300">
                            <div>{g.giftDescription || g.subtitle || '—'}</div>
                            {g.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{g.notes}</div>}
                          </td>
                          <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                            {g.dueDate || (g.createdAt ? g.createdAt.split('T')[0] : '—')}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-200">
                            {g.amount ? (
                              <span>
                                {flag} {formatCurrency(g.amount, itemCurr)}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">Sentimental</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>Total Records: <strong className="text-white">{filteredGifts.length}</strong></div>
              <div className="flex items-center gap-4">
                <span>Received: <strong className="text-emerald-400">{formatCurrency(totalReceivedAmount, currency)}</strong></span>
                <span>Given: <strong className="text-purple-400">{formatCurrency(totalGivenAmount, currency)}</strong></span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report, .printable-report * {
            visibility: visible;
          }
          .printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            border: none !important;
            padding: 20px !important;
          }
          .printable-report table {
            color: black !important;
          }
          .printable-report th {
            color: #333 !important;
            border-bottom: 2px solid #ccc !important;
          }
          .printable-report td {
            color: #111 !important;
            border-bottom: 1px solid #eee !important;
          }
        }
      `}</style>
    </div>
  );
};
