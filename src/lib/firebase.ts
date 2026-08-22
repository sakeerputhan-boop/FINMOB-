import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  User,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  getDocs,
  Firestore
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';
import appletConfig from '../../firebase-applet-config.json';
import { FinancialItem, Transaction, UserSettings } from '../types';

// Check if a custom valid API Key is provided via VITE_FIREBASE_API_KEY
const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isCustomKeyValid =
  typeof envApiKey === 'string' &&
  envApiKey.length > 25 &&
  !envApiKey.includes('...') &&
  !envApiKey.includes('Dummy') &&
  !envApiKey.includes('YourApiKey');

// Target Firebase Project configuration (Project: finmob-7e007)
// Uses provided environment variables if valid, otherwise falls back to active applet config
export const firebaseConfig = {
  apiKey: isCustomKeyValid ? envApiKey : (appletConfig.apiKey || "AIzaSyCOD-r0hXW59fEM9hC-MYIPUjjLUwRFIRc"),
  authDomain: (isCustomKeyValid ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : null) || appletConfig.authDomain || "finmob-7e007.firebaseapp.com",
  projectId: (isCustomKeyValid ? import.meta.env.VITE_FIREBASE_PROJECT_ID : null) || appletConfig.projectId || "finmob-7e007",
  storageBucket: (isCustomKeyValid ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : null) || appletConfig.storageBucket || "finmob-7e007.firebasestorage.app",
  messagingSenderId: (isCustomKeyValid ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : null) || appletConfig.messagingSenderId || "55757491863",
  appId: (isCustomKeyValid ? import.meta.env.VITE_FIREBASE_APP_ID : null) || appletConfig.appId || "1:55757491863:web:b5540a29e8cf33289ea3d2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId || ""
};

const customDatabaseId =
  (isCustomKeyValid ? import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID : null) ||
  appletConfig.firestoreDatabaseId ||
  undefined;

// Initialize Firebase App Singleton
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Initialize Cloud Firestore (supports named database e.g. "myfin" or standard default database)
export const db: Firestore =
  customDatabaseId && customDatabaseId !== '(default)' && customDatabaseId !== 'default'
    ? getFirestore(app, customDatabaseId)
    : getFirestore(app);

// Initialize Cloud Storage
export const storage: FirebaseStorage = getStorage(app);

// Initialize Firebase Cloud Messaging (FCM) conditionally for browser environments supporting Service Workers & Push
let messagingInstance: Messaging | null = null;
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (supported && !messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

// Export standard Auth helpers
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
};

// ==========================================
// PUSH NOTIFICATIONS & FCM TOKEN MANAGEMENT
// ==========================================
export async function requestFcmPushToken(vapidKey?: string): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    }
  } catch (error) {
    console.warn('FCM token request could not be completed:', error);
  }
  return null;
}

export function onFcmForegroundMessage(callback: (payload: any) => void) {
  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  });
}

// ==========================================
// FIRESTORE DATA PERSISTENCE & REAL-TIME SYNC
// ==========================================

// Helper to remove undefined properties before Firestore writes
function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const val = data[key];
    if (val !== undefined) {
      clean[key] = val;
    }
  });
  return clean;
}

// Real-time listener for user's financial items
export function subscribeToUserItems(
  userId: string,
  onData: (items: FinancialItem[]) => void,
  onError?: (err: Error) => void
) {
  const itemsRef = collection(db, 'users', userId, 'items');
  const q = query(itemsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FinancialItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          ...(data as any),
          id: docSnap.id,
          userId: userId,
          type: data.type,
          title: data.title || '',
          amount: typeof data.amount === 'number' ? data.amount : 0,
          country: data.country || 'UAE',
          currency: data.currency || 'AED',
          subtitle: data.subtitle || '',
          accountNumber: data.accountNumber || '',
          bankName: data.bankName || '',
          interestRate: data.interestRate,
          maturityDate: data.maturityDate || '',
          maturityAmount: data.maturityAmount,
          assetCategory: data.assetCategory,
          purityOrUnits: data.purityOrUnits || '',
          purchasePrice: data.purchasePrice,
          creditLimit: data.creditLimit,
          cashbackRewardPoints: data.cashbackRewardPoints,
          dueDate: data.dueDate || '',
          minimumDue: data.minimumDue,
          loanType: data.loanType || (data.type === 'emi_loan' ? 'emi' : undefined),
          interestCalculationType: data.interestCalculationType,
          principalAmount: data.principalAmount,
          monthlyEmi: data.monthlyEmi,
          totalMonths: data.totalMonths,
          remainingMonths: data.remainingMonths,
          emiDueDay: data.emiDueDay,
          lenderName: data.lenderName || '',
          totalInterestPayable: data.totalInterestPayable,
          totalPayableAmount: data.totalPayableAmount,
          cashLocation: data.cashLocation || '',
          isNonFinancial: data.isNonFinancial,
          reminderCategory: data.reminderCategory,
          giftDirection: data.giftDirection,
          personName: data.personName || '',
          occasion: data.occasion || '',
          giftDescription: data.giftDescription || '',
          returnGiftStatus: data.returnGiftStatus,
          iouType: data.iouType,
          iouPerson: data.iouPerson || '',
          iouStatus: data.iouStatus,
          iouDueDate: data.iouDueDate || '',
          iouSettledAmount: data.iouSettledAmount,
          notes: data.notes || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastUsedAt: data.lastUsedAt || undefined
        });
      });
      onData(items);
    },
    (err) => {
      console.warn('Firestore subscription error for items:', err);
      if (onError) onError(err);
    }
  );
}

// Add or update an item
export async function saveFinancialItem(
  userId: string,
  item: Partial<FinancialItem> & { title: string; amount: number; type: FinancialItem['type'] }
) {
  const itemId = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const itemRef = doc(db, 'users', userId, 'items', itemId);
  
  const nowIso = new Date().toISOString();
  const rawPayload = {
    ...item,
    id: itemId,
    userId,
    updatedAt: nowIso,
    createdAt: item.createdAt || nowIso,
    timestamp: serverTimestamp()
  };

  const payload = sanitizeFirestoreData(rawPayload);

  await setDoc(itemRef, payload, { merge: true });
  return itemId;
}

// Delete an item
export async function removeFinancialItem(userId: string, itemId: string) {
  const itemRef = doc(db, 'users', userId, 'items', itemId);
  await deleteDoc(itemRef);
}

// Real-time listener for user's transactions
export function subscribeToUserTransactions(
  userId: string,
  onData: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
) {
  const txRef = collection(db, 'users', userId, 'transactions');
  const q = query(txRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        txs.push({
          id: docSnap.id,
          userId: userId,
          itemId: data.itemId || '',
          itemTitle: data.itemTitle || '',
          itemType: data.itemType || 'bank_account',
          type: data.type || 'spend',
          amount: typeof data.amount === 'number' ? data.amount : 0,
          currency: data.currency || 'AED',
          country: data.country || 'UAE',
          category: data.category || 'General',
          description: data.description || '',
          date: data.date || new Date().toISOString(),
          sourceAccountId: data.sourceAccountId || '',
          sourceAccountTitle: data.sourceAccountTitle || '',
          rewardPointsUsed: data.rewardPointsUsed,
          cashbackAmount: data.cashbackAmount,
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      onData(txs);
    },
    (err) => {
      console.warn('Firestore subscription error for transactions:', err);
      if (onError) onError(err);
    }
  );
}

// Save transaction record
export async function saveTransaction(
  userId: string,
  tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string }
) {
  const txId = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const txRef = doc(db, 'users', userId, 'transactions', txId);

  const rawPayload = {
    ...tx,
    id: txId,
    userId,
    createdAt: new Date().toISOString(),
    timestamp: serverTimestamp()
  };

  const payload = sanitizeFirestoreData(rawPayload);

  await setDoc(txRef, payload, { merge: true });
  return txId;
}

// Delete transaction
export async function removeTransaction(userId: string, txId: string) {
  const txRef = doc(db, 'users', userId, 'transactions', txId);
  await deleteDoc(txRef);
}

// Settings subscription
export function subscribeToUserSettings(
  userId: string,
  onData: (settings: UserSettings) => void
) {
  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
  return onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      onData(docSnap.data() as UserSettings);
    }
  });
}

// Check if user profile has already been initialized (prevents unwanted sample data re-seeding)
export async function isUserProfileInitialized(userId: string): Promise<boolean> {
  try {
    const profileRef = doc(db, 'users', userId, 'settings', 'profile');
    const snap = await getDoc(profileRef);
    if (snap.exists() && snap.data()?.isInitialized) {
      return true;
    }
    // Also check if any items already exist
    const itemsRef = collection(db, 'users', userId, 'items');
    const itemsSnap = await getDocs(itemsRef);
    if (!itemsSnap.empty) {
      // Mark as initialized
      await setDoc(profileRef, { isInitialized: true, lastSeen: new Date().toISOString() }, { merge: true });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Could not check user initialization status:', err);
    return false;
  }
}

// Mark user profile as initialized in Firestore
export async function markUserProfileInitialized(userId: string) {
  try {
    const profileRef = doc(db, 'users', userId, 'settings', 'profile');
    await setDoc(
      profileRef,
      {
        isInitialized: true,
        initializedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not mark user as initialized:', err);
  }
}

// Seamlessly migrate guest / localStorage items and transactions into Firestore
export async function migrateLocalDataToFirestore(
  userId: string,
  localItems: FinancialItem[],
  localTxs: Transaction[]
) {
  try {
    const promises: Promise<any>[] = [];

    // Migrate local items
    if (localItems && localItems.length > 0) {
      for (const item of localItems) {
        if (item.id && !item.id.startsWith('sample_')) {
          const { id, createdAt, userId: _, ...itemRest } = item;
          promises.push(saveFinancialItem(userId, { ...itemRest, id }));
        }
      }
    }

    // Migrate local transactions
    if (localTxs && localTxs.length > 0) {
      for (const tx of localTxs) {
        if (tx.id && !tx.id.startsWith('sample_tx_')) {
          const { id, createdAt, userId: _, ...txRest } = tx;
          promises.push(saveTransaction(userId, { ...txRest, id }));
        }
      }
    }

    await Promise.allSettled(promises);
    await markUserProfileInitialized(userId);
  } catch (err) {
    console.warn('Data migration warning:', err);
  }
}

