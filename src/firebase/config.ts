import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Updated Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHNx1oTFKeC88VWneyRuDvWtzcpMpPew0",
  authDomain: "adysun-hrms.firebaseapp.com",
  projectId: "adysun-hrms",
  storageBucket: "adysun-hrms.firebasestorage.app",
  messagingSenderId: "481182176506",
  appId: "1:481182176506:web:85848f6acd565f1b1e6543",
  measurementId: "G-VY9WBFGBM3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only records visits (nothing reads it), so it loads in the background instead of
// adding to the first page load. isSupported() is false outside a browser (tests) and when
// IndexedDB/cookies are blocked, where getAnalytics would throw.
void import('firebase/analytics').then(async ({ getAnalytics, isSupported }) => {
  if (await isSupported()) getAnalytics(app);
}).catch(() => {}); // optional: a blocked/failed chunk must not surface as an unhandled rejection
