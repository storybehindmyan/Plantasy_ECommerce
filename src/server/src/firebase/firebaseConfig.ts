import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDRjFbE0VRl4tn0QDMOqAqUfSTg0BZySag",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "plantasy-bharat.firebaseapp.com",
  databaseURL: "https://plantasy-bharat-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "plantasy-bharat",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "plantasy-bharat.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1024932082336",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1024932082336:web:5c599f1c1ae8653aa7cfc5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HKM8DQD5SC"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

