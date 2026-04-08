// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Mengambil konfigurasi dari file .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi Firebase
// Pengecekan getApps().length penting di Next.js agar Firebase tidak 
// diinisialisasi ulang setiap kali halaman di-refresh (menghindari error)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Ekspor layanan yang akan kita gunakan
export const auth = getAuth(app);
export const db = getFirestore(app);