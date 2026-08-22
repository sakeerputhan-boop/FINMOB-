import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  MessageSquare,
  Download,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Share2,
  Sparkles,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { FinancialItem, Transaction, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/currency';
import { generateFinancialPdf } from '../utils/pdfGenerator';
import { exportItemsToCsv, exportFullBackupCsv } from '../utils/csvExport';

interface WhatsAppPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: FinancialItem[];
  transactions?: Transaction[];
  currency: CurrencyCode;
}

export const WhatsAppPdfModal: React.FC<WhatsAppPdfModalProps> = ({
  isOpen,
  onClose,
  items,
  transactions = [],
  currency
}) => {
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  if (!isOpen) return null;

  // Categorize entries (Excluding reminders from export)
  const bankItems = items.filter((i) => i.type === 'bank_account');
  const cashItems = items.filter((i) => i.type === 'cash_entry');
  const fdItems = items.filter((i) => i.type === 'fixed_deposit');
  const assetItems = items.filter((i) => i.type === 'asset');
  const cardItems = items.filter((i) => i.type === 'credit_card');
  const loanItems = items.filter((i) => i.type === 'emi_loan');

  const grossAssets = [...bankItems, ...cashItems, ...fdItems, ...assetItems].reduce((acc, i) => acc + i.amount, 0);
  const totalLiabilities = [...cardItems, ...loanItems].reduce((acc, i) => acc + i.amount, 0);
  const netWorth = grossAssets - totalLiabilities;

  // Text report generator (Without reminders)
  const generateReportText = () => {
    let report = `📊 *MYFIN FINANCIAL & WEALTH STATEMENT*\n`;
    report += `📅 Date: ${new Date().toLocaleDateString()}\n`;
    if (password) {
      report += `🔒 *PDF Password*: ${password}\n`;
    }
    report += `------------------------------------\n`;
    report += `💰 *NET WORTH: ${formatCurrency(netWorth, currency)}*\n`;
    report += `📈 Gross Assets: ${formatCurrency(grossAssets, currency)}\n`;
    report += `📉 Liabilities: ${formatCurrency(totalLiabilities, currency)}\n\n`;

    if (bankItems.length > 0 || cashItems.length > 0) {
      report += `🏦 *DAILY OPERATING ACCOUNTS*\n`;
      bankItems.forEach(b => {
        report += `• Bank: ${b.title} (${b.country || 'UAE'}) - ${formatCurrency(b.amount, b.currency || currency)}\n`;
      });
      cashItems.forEach(c => {
        report += `• Cash: ${c.title} (${c.country || 'UAE'}) - ${formatCurrency(c.amount, c.currency || currency)}\n`;
      });
      report += `\n`;
    }

    if (fdItems.length > 0) {
      report += `🔒 *FIXED DEPOSITS*\n`;
      fdItems.forEach(f => {
        report += `• FD: ${f.title} - ${formatCurrency(f.amount, f.currency || currency)} (${f.interestRate || 0}% p.a.)\n`;
      });
      report += `\n`;
    }

    if (assetItems.length > 0) {
      report += `✨ *GOLD & ASSETS*\n`;
      assetItems.forEach(a => {
        report += `• Asset: ${a.title} (${a.purityOrUnits || 'Holdings'}) - ${formatCurrency(a.amount, a.currency || currency)}\n`;
      });
      report += `\n`;
    }

    if (cardItems.length > 0 || loanItems.length > 0) {
      report += `💳 *LIABILITIES & DEBTS*\n`;
      cardItems.forEach(card => {
        report += `• Credit Card: ${card.title} - ${formatCurrency(card.amount, card.currency || currency)}\n`;
      });
      loanItems.forEach(loan => {
        report += `• ${loan.loanType === 'emi' ? 'EMI Loan' : 'Loan'}: ${loan.title} - ${formatCurrency(loan.amount, loan.currency || currency)}\n`;
      });
      report += `\n`;
    }

    report += `------------------------------------\n`;
    report += `Generated securely via MYFIN Real-time Multi-Country Wealth Tracker.`;
    return report;
  };

  const reportText = generateReportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const doc = generateFinancialPdf({ items, currency, password });
        const fileName = password
          ? `MYFIN_Protected_Statement_${new Date().toISOString().slice(0, 10)}.pdf`
          : `MYFIN_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
      } catch (err) {
        console.error('PDF Generation Error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleWhatsAppShare = async () => {
    setIsGenerating(true);

    try {
      const doc = generateFinancialPdf({ items, currency, password });
      const pdfBlob = doc.output('blob');
      const fileName = password ? 'MYFIN_Protected_Statement.pdf' : 'MYFIN_Statement.pdf';
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Check if Web Share API with files is supported (Mobile / PWA / Chrome)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'MYFIN Financial Statement',
          text: `MYFIN Financial Statement (${password ? 'Password Protected: ' + password : 'Full Portfolio'})`
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback: Download PDF & open WhatsApp message share
        doc.save(fileName);
        const shareMsg = password
          ? `📄 *MYFIN Encrypted Financial Statement*\n\n🔒 *Document Password*: \`${password}\`\n\nTotal Net Worth: *${formatCurrency(netWorth, currency)}*\n\nI have attached the encrypted PDF statement to this chat.`
          : reportText;

        const encoded = encodeURIComponent(shareMsg);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
      }
    } catch (err) {
      console.error('WhatsApp Share Error:', err);
      // Direct Web Fallback
      const encoded = encodeURIComponent(reportText);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-lg">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  WhatsApp PDF Statement & Sharing
                </h2>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Financial Records
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate encrypted password-protected PDF containing bank accounts, cash, FDs, assets, loans & credit cards.
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

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Included Entries Summary Pills */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
              <span>Included Records in Statement</span>
              <span className="text-emerald-400">Net Worth: {formatCurrency(netWorth, currency)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                🏦 Bank ({bankItems.length})
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                💵 Cash ({cashItems.length})
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                🔒 FDs ({fdItems.length})
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                ✨ Assets ({assetItems.length})
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                💳 Cards ({cardItems.length})
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600">
                🏦 Loans ({loanItems.length})
              </span>
            </div>
          </div>

          {/* Password Protection Control Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wide">
                    PDF Password Protection
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Set a custom password required to open and view the PDF statement.
                  </p>
                </div>
              </div>
              {password && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Password Active
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password to protect PDF (e.g., 1234, DOB, or secret word)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-20 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {password && (
                  <button
                    type="button"
                    onClick={() => setPassword('')}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-400 px-1.5 py-1"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-white transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-indigo-300/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>When recipient opens this PDF file in WhatsApp, Adobe Reader, or Web, they must enter this password to view details.</span>
            </p>
          </div>

          {/* Statement Text Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Text Statement Preview (WhatsApp Formatted)
              </label>
              <button
                onClick={handleCopy}
                className="text-[11px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={6}
              value={reportText}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px] leading-relaxed focus:outline-none select-all"
            />
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            
            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-white/20" />
              <span>{isGenerating ? 'Generating...' : 'WhatsApp Share'}</span>
            </button>

            {/* Download Password-Protected PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{password ? 'Protected PDF' : 'Download PDF'}</span>
            </button>

            {/* Direct CSV Backup Download */}
            <button
              onClick={() => {
                exportFullBackupCsv(items, transactions, currency);
                setCsvDownloaded(true);
                setTimeout(() => setCsvDownloaded(false), 3000);
              }}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs border border-slate-700 shadow-md transition cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Download CSV</span>
            </button>

          </div>

          {csvDownloaded && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Full CSV Backup downloaded to your device!</span>
            </div>
          )}

          {shareSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
              ✅ PDF Shared Successfully via WhatsApp!
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
