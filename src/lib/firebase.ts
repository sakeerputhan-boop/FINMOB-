import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
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
  getDoc
} from 'firebase/firestore';
import { FinancialItem, UserSettings } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCElFxZJS4zU3Jnyu58EHN0vuQbbV3gdCI",
  authDomain: "arctic-federation-mf6jr.firebaseapp.com",
  projectId: "arctic-federation-mf6jr",
  storageBucket: "arctic-federation-mf6jr.firebasestorage.app",
  messagingSenderId: "427379016519",
  appId: "1:427379016519:web:b40549674ac0513d73c262"
};

const databaseId = "ai-studio-finmob-98ae9b2b-dde8-4155-88f3-2f1f3abb803b";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
};

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
          id: docSnap.id,
          userId: userId,
          type: data.type,
          title: data.title || '',
          amount: data.amount || 0,
          subtitle: data.subtitle || '',
          accountNumber: data.accountNumber || '',
          bankName: data.bankName || '',
          interestRate: data.interestRate,
          maturityDate: data.maturityDate || '',
          assetCategory: data.assetCategory,
          purityOrUnits: data.purityOrUnits || '',
          purchasePrice: data.purchasePrice,
          creditLimit: data.creditLimit,
          dueDate: data.dueDate || '',
          notes: data.notes || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      });
      onData(items);
    },
    (err) => {
      console.warn('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Add or update an item
export async function saveFinancialItem(userId: string, item: Partial<FinancialItem> & { title: string; amount: number; type: FinancialItem['type'] }) {
  const itemId = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const itemRef = doc(db, 'users', userId, 'items', itemId);
  
  const payload = {
    ...item,
    id: itemId,
    userId,
    updatedAt: new Date().toISOString(),
    createdAt: item.createdAt || new Date().toISOString(),
    timestamp: serverTimestamp()
  };

  await setDoc(itemRef, payload, { merge: true });
  return itemId;
}

// Delete an item
export async function removeFinancialItem(userId: string, itemId: string) {
  const itemRef = doc(db, 'users', userId, 'items', itemId);
  await deleteDoc(itemRef);
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

// Save user settings
export async function saveUserSettings(userId: string, settings: Partial<UserSettings>) {
  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
  await setDoc(settingsRef, {
    ...settings,
    lastSynced: new Date().toISOString()
  }, { merge: true });
}
