import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

/**
 * Firebase web configuration is public client configuration, not a service
 * account. Authorization still comes from the backend-minted custom token and
 * Firestore Rules; these values only identify the Firebase project.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBLdUUH8rXECtSpUnIIy-eRiTKsqz_OEdk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'delivery-233fb.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'delivery-233fb',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'delivery-233fb.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '958810765713',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:958810765713:web:00aadb6178c27b38540230',
} as const;

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return firebaseApp;
}
