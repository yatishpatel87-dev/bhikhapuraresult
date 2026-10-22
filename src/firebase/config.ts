import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Firestore must be initialized with the specific databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Firebase Authentication
export const auth = getAuth(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Export public config (safe placeholders, no sensitive keys)
export const publicFirebaseConfig = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
  appId: firebaseConfig.appId,
  storageBucket: firebaseConfig.storageBucket,
};

// Validate Connection to Firestore on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration: client is offline.");
      return false;
    }
    // Expected to fail with permission-denied for test doc due to rules, which confirms connectivity!
    return true;
  }
}

// Initial test trigger
testConnection().catch((err) => console.log('Firebase connection test init:', err?.message || err));
