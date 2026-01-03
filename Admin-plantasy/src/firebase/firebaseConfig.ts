// Firebase Configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase config
// You can find these values in your Firebase Console -> Project Settings -> General -> Your apps

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDRjFbE0VRl4tn0QDMOqAqUfSTg0BZySag",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "plantasy-bharat.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "plantasy-bharat",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "plantasy-bharat.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1024932082336",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1024932082336:web:c32155ec1bb91eb2a7cfc5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5FE430D0FP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;



// plantasy Bharat <---New--->

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyDRjFbE0VRl4tn0QDMOqAqUfSTg0BZySag",
//   authDomain: "plantasy-bharat.firebaseapp.com",
//   databaseURL: "https://plantasy-bharat-default-rtdb.firebaseio.com",
//   projectId: "plantasy-bharat",
//   storageBucket: "plantasy-bharat.firebasestorage.app",
//   messagingSenderId: "1024932082336",
//   appId: "1:1024932082336:web:c32155ec1bb91eb2a7cfc5",
//   measurementId: "G-5FE430D0FP"
// };


// plantasy Project <---Old--->

// const firebaseConfig = {
//   apiKey: ,
//   authDomain: "project-plantasy.firebaseapp.com",
//   projectId: "project-plantasy",
//   storageBucket: "project-plantasy.firebasestorage.app",
//   messagingSenderId: "228651564668",
//   appId: "1:228651564668:web:ea4f3c64c71c907a7c13f9"
// };
