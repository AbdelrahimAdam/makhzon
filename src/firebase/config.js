// src/firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration (NEW PROJECT)
export const firebaseConfig = {
  apiKey: "AIzaSyC5MwMHnbPtntQf4pmux-RKuX3BI-Lpye4",
  authDomain: "saas-inventory-a3fb8.firebaseapp.com",
  projectId: "saas-inventory-a3fb8",
  storageBucket: "saas-inventory-a3fb8.firebasestorage.app",
  messagingSenderId: "567877590572",
  appId: "1:567877590572:web:091691096444daacb7fb89",
  measurementId: "G-NQVGW088SZ"
};

// Firebase services
let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;

let isInitialized = false;
let initializationPromise = null;
let initializationError = null;

/**
 * Simple Firebase initialization WITHOUT offline persistence
 */
export async function initializeFirebase() {

  if (isInitialized) {
    console.log('✅ Firebase already initialized');
    return { app, auth, db, storage, analytics };
  }

  if (initializationPromise) {
    console.log('⏳ Firebase initialization in progress...');
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {

      console.log('🔥 Initializing Firebase...');

      // Initialize Firebase app
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase app initialized');

      // Initialize services
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);

      // Initialize analytics only in browser
      if (typeof window !== "undefined") {
        try {
          analytics = getAnalytics(app);
          console.log("📊 Firebase Analytics initialized");
        } catch (e) {
          console.warn("Analytics not supported:", e.message);
        }
      }

      // Set default language (Arabic)
      auth.languageCode = 'ar';

      console.log('✅ Firebase services initialized');

      // IMPORTANT: Offline persistence is DISABLED
      console.log('⚠️ Offline persistence disabled to prevent IndexedDB errors');

      isInitialized = true;
      initializationError = null;

      console.log('🎉 Firebase fully initialized and ready');

      return { app, auth, db, storage, analytics };

    } catch (error) {

      console.error('❌ Firebase initialization failed:', error);
      initializationError = error;
      isInitialized = false;
      throw error;

    } finally {
      initializationPromise = null;
    }

  })();

  return initializationPromise;
}

/**
 * Clear IndexedDB cache
 */
export async function clearCorruptedIndexedDB() {

  if (typeof window === 'undefined' || !window.indexedDB) return;

  try {

    console.log('🧹 Clearing IndexedDB cache...');

    const dbNames = [
      'firestore/[DEFAULT]/saas-inventory-a3fb8/main',
      'firestore/[DEFAULT]/saas-inventory-a3fb8',
      'firestore',
      'firestore-v9'
    ];

    for (const dbName of dbNames) {

      try {

        const deleteReq = window.indexedDB.deleteDatabase(dbName);

        await new Promise((resolve, reject) => {
          deleteReq.onsuccess = resolve;
          deleteReq.onerror = reject;
          deleteReq.onblocked = () => resolve();
        });

        console.log(`🧹 Cleared IndexedDB database: ${dbName}`);

      } catch (e) {}

    }

    try {

      const keys = Object.keys(localStorage);

      for (const key of keys) {
        if (key.includes('firestore') || key.includes('firebase')) {
          localStorage.removeItem(key);
        }
      }

      console.log('🧹 Cleared Firebase-related localStorage items');

    } catch (e) {}

  } catch (error) {

    console.warn('⚠️ Error clearing IndexedDB:', error.message);

  }
}

/**
 * Emergency reset
 */
export async function emergencyReset() {

  console.log('🚨 Performing emergency reset...');

  await clearCorruptedIndexedDB();

  app = null;
  auth = null;
  db = null;
  storage = null;
  analytics = null;

  isInitialized = false;
  initializationPromise = null;
  initializationError = null;

  console.log('✅ Emergency reset complete');
}

/**
 * Initialize with retry
 */
export async function initializeWithRetry(maxRetries = 3) {

  for (let attempt = 1; attempt <= maxRetries; attempt++) {

    try {

      console.log(`🔄 Initialization attempt ${attempt}/${maxRetries}`);
      return await initializeFirebase();

    } catch (error) {

      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) throw error;

      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));

    }

  }

}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized() {
  return isInitialized;
}

/**
 * Get Firebase services
 */
export function getFirebaseServices() {

  if (!isInitialized) {
    console.warn('⚠️ Firebase not initialized. Call initializeFirebase() first.');
    return null;
  }

  return { app, auth, db, storage, analytics };
}

/**
 * Get initialization error if any
 */
export function getInitializationError() {
  return initializationError;
}

/**
 * Check persistence (always false)
 */
export function isPersistenceEnabled() {
  return false;
}

/**
 * Reset Firebase
 */
export function resetFirebase() {

  app = null;
  auth = null;
  db = null;
  storage = null;
  analytics = null;

  isInitialized = false;
  initializationPromise = null;
  initializationError = null;

  console.log('🧹 Firebase reset');

}

/**
 * Auto initialize in production
 */
try {

  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {

    initializeWithRetry(2).catch(error => {
      console.warn('⚠️ Auto-initialization failed:', error.message);
    });

  }

} catch (error) {

  console.warn('⚠️ Auto-initialization setup failed:', error.message);

}

// Export services
export { app, auth, db, storage, analytics };

// Export status
export const isFirebaseReady = isInitialized;

// Auth helpers
export {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

// Firestore helpers
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';

// Default export
export default {

  app,
  auth,
  db,
  storage,
  analytics,

  initializeFirebase,
  initializeWithRetry,
  isFirebaseInitialized,
  getFirebaseServices,
  resetFirebase,
  emergencyReset,
  getInitializationError,
  clearCorruptedIndexedDB,

  isFirebaseReady,
  isPersistenceEnabled,

  firebaseConfig

};