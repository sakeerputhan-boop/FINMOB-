import { FinancialItem } from '../types';
import { requestFcmPushToken } from '../lib/firebase';

export interface DueAlertItem {
  item: FinancialItem;
  dueDays: number; // e.g. 3 (due in 3 days), 0 (due today), -2 (overdue by 2 days)
  typeLabel: string;
}

export function calculateUpcomingDueItems(items: FinancialItem[]): DueAlertItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueAlerts: DueAlertItem[] = [];

  items.forEach((item) => {
    // 1. Reminders
    if (item.type === 'reminder' && !item.isCompleted && item.dueDate) {
      const targetDate = new Date(item.dueDate);
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        dueAlerts.push({
          item,
          dueDays: diffDays,
          typeLabel: item.isNonFinancial ? 'Document / Expiry' : 'Bill Reminder'
        });
      }
    }

    // 2. Credit Cards with Due Date
    if (item.type === 'credit_card' && item.amount > 0 && item.dueDate) {
      const targetDate = new Date(item.dueDate);
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        dueAlerts.push({
          item,
          dueDays: diffDays,
          typeLabel: 'Credit Card Bill'
        });
      }
    }

    // 3. EMI Loans with due day of month
    if (item.type === 'emi_loan' && item.loanType === 'emi' && item.emiDueDay) {
      const currentDay = today.getDate();
      let diffDays = item.emiDueDay - currentDay;
      if (diffDays < -15) {
        // next month
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        diffDays = daysInMonth - currentDay + item.emiDueDay;
      }

      if (diffDays >= -2 && diffDays <= 7) {
        dueAlerts.push({
          item,
          dueDays: diffDays,
          typeLabel: 'Loan EMI Payment'
        });
      }
    }
  });

  // Sort by urgency (overdue and closest due date first)
  return dueAlerts.sort((a, b) => a.dueDays - b.dueDays);
}

export async function requestMobileNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  let granted = false;
  if (Notification.permission === 'granted') {
    granted = true;
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    granted = permission === 'granted';
  }

  if (granted) {
    // Attempt FCM registration in background
    requestFcmPushToken().catch((err) => console.log('FCM token init:', err));
  }

  return granted;
}

export function sendLocalDueNotification(alerts: DueAlertItem[]): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted' || alerts.length === 0) return;

  const topAlert = alerts[0];
  const count = alerts.length;
  const title = `⚠️ MYFIN 7-Day Alert: ${count} Upcoming Due Date${count > 1 ? 's' : ''}`;
  const dueText =
    topAlert.dueDays === 0
      ? 'DUE TODAY'
      : topAlert.dueDays < 0
      ? `OVERDUE by ${Math.abs(topAlert.dueDays)} day(s)`
      : `Due in ${topAlert.dueDays} day(s)`;

  const body = `${topAlert.item.title} (${topAlert.typeLabel}) is ${dueText}. Open MYFIN to review.`;

  try {
    new Notification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'myfin-due-reminder'
    });
  } catch (e) {
    console.warn('Native notification dispatch failed', e);
  }
}
