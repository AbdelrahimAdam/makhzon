import { auth, db, initializeFirebase, isFirebaseInitialized } from '@/firebase/config';

/**
 * Ensures Firebase is fully initialized before performing operations
 * @returns {Promise<Object>} Firebase services
 */
export async function ensureFirebaseReady() {
  try {
    console.log('⏳ Ensuring Firebase is ready...');

    // Check if Firebase is already initialized
    if (isFirebaseInitialized()) {
      console.log('✅ Firebase is already initialized');
      return { auth, db };
    }

    // If not initialized, initialize it
    console.log('🔥 Initializing Firebase...');
    const services = await initializeFirebase();
    console.log('✅ Firebase initialized successfully');
    return services;

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw new Error('Firebase is not available. Please try again.');
  }
}

/**
 * Get Firestore database with safety check
 * @returns {Promise<Object>} Firestore database instance
 */
export async function getFirestoreDb() {
  await ensureFirebaseReady();
  if (!db) {
    throw new Error('Firestore database not available');
  }
  return db;
}

/**
 * Get Firebase auth with safety check
 * @returns {Promise<Object>} Firebase auth instance
 */
export async function getFirebaseAuth() {
  await ensureFirebaseReady();
  if (!auth) {
    throw new Error('Firebase authentication not available');
  }
  return auth;
}