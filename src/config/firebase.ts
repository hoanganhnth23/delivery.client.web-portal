/**
 * Firebase Configuration
 * Cấu hình Firebase cho real-time chat
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLdUUH8rXECtSpUnIIy-eRiTKsqz_OEdk",
  authDomain: "delivery-233fb.firebaseapp.com",
  databaseURL: "https://delivery-233fb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "delivery-233fb",
  storageBucket: "delivery-233fb.firebasestorage.app",
  messagingSenderId: "958810765713",
  appId: "1:958810765713:web:00aadb6178c27b38540230",
  measurementId: "G-P4KGCK65LV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (chỉ chạy trên browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
