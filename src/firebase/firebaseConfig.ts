// Firebase Configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase config
// You can find these values in your Firebase Console -> Project Settings -> General -> Your apps

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA8JjEja1z--LMfhndMrEj0Ytf2ZmDZ4xs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "project-plantasy.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-plantasy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "project-plantasy.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "228651564668",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:228651564668:web:ea4f3c64c71c907a7c13f9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;


// const firebaseConfig = {
//   apiKey: ,
//   authDomain: "project-plantasy.firebaseapp.com",
//   projectId: "project-plantasy",
//   storageBucket: "project-plantasy.firebasestorage.app",
//   messagingSenderId: "228651564668",
//   appId: "1:228651564668:web:ea4f3c64c71c907a7c13f9"
// };
