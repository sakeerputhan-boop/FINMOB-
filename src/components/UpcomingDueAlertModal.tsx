import React, { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowRight,
  CreditCard,
  Building,
  FileText,
  Volume2
} from 'lucide-react';
import { DueAlertItem, requestMobileNotificationPermission } from '../utils/notifications';
import { CurrencyCode, FinancialItem } from '../types';
import { formatCurrency, getCountryByName } from '../utils/currency';

interface UpcomingDueAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts?: DueAlertItem[];
  currency: CurrencyCode;
  onOpenItemActions: (item: FinancialItem) => void;
  onOpenAllReminders?: () => void;
}

export const UpcomingDueAlertModal: React.FC<UpcomingDueAlertModalProps> = ({
  isOpen,
  onClose,
  alerts = [],
  currency,
  onOpenItemActions,
  onOpenAllReminders
}) => {
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  if (!isOpen || !alerts || alerts.length === 0) return null;

  const handleEnableMobileNotifications = async () => {
    const granted = await requestMobileNotificationPermission();
    setNotificationEnabled(granted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ring-1 ring-amber-500/30">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/70 via-slate-950 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">7-Day Due Date Alert</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {alerts.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Action required within 7 days to avoid penalties or expiry
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

        {/* Mobile Notification Status Banner */}
        {!notificationEnabled && (
          <div className="p-3 bg-amber-950/30 border-b border-amber-800/30 flex items-center justify-between gap-2 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Enable mobile phone push alerts for upcoming due dates?</span>
            </div>
            <button
              onClick={handleEnableMobileNotifications}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] shrink-0 transition"
            >
              Enable
            </button>
          </div>
        )}

        {/* Alerts List */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
          {alerts.map(({ item, dueDays, typeLabel }) => {
            const isOverdue = dueDays < 0;
            const isToday = dueDays === 0;
            const flag = item.country ? getCountryByName(item.country).flag : '';
            const itemCurr = item.currency || currency;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition flex flex-col gap-2 ${
                  isOverdue
                    ? 'bg-rose-950/30 border-rose-800/60'
                    : isToday
                    ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        item.type === 'credit_card'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : item.type === 'emi_loan'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {item.type === 'credit_card' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : item.type === 'emi_loan' ? (
                        <Building className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {typeLabel}
                        </span>
                        {flag && <span className="text-xs">{flag}</span>}
                      </div>
                      <h4 className="text-sm font-extrabold text-white leading-tight">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isOverdue
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isToday
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {isOverdue
                        ? `Overdue (${Math.abs(dueDays)}d)`
                        : isToday
                        ? 'DUE TODAY'
                        : `Due in ${dueDays} days`}
                    </span>
                  </div>
                </div>

                {/* Amount or Details */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="text-slate-400">
                    {item.dueDate ? (
                      <span>Due Date: <strong className="text-slate-200">{item.dueDate}</strong></span>
                    ) : item.emiDueDay ? (
                      <span>Monthly Day: <strong className="text-slate-200">{item.emiDueDay}th</strong></span>
                    ) : null}
                  </div>

                  {item.amount > 0 ? (
                    <div className="font-mono font-black text-sm text-white">
                      {formatCurrency(item.amount, itemCurr)}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Non-Financial Document</span>
                  )}
                </div>

                {/* Quick Action Button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenItemActions(item);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1 transition"
                  >
                    <span>{item.type === 'reminder' ? 'View Reminder' : 'Pay / Manage'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={() => {
              onClose();
              if (onOpenAllReminders) onOpenAllReminders();
            }}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All Reminders & Documents</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Dismiss Alert
          </button>
        </div>

      </div>
    </div>
  );
};
