/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

const googleProvider = new GoogleAuthProvider();

type FirebaseUser = User & {
  displayName?: string | null;
  photoURL?: string | null;
};

interface AuthError {
  code: string;
  message: string;
}

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser as FirebaseUser | null);
      setError(null); // Clear errors on state change
      setLoading(false);
    }, (error: any) => {
      setError({
        code: error.code || 'auth/unknown',
        message: error.message
      });
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const login = useCallback(async (email: string, password: string): Promise<UserCredential> => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: any) {
      const authError = {
        code: error.code || 'auth/unknown',
        message: getUserFriendlyError(error.code || error.message)
      };
      setError(authError);
      throw new Error(authError.message);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string): Promise<UserCredential> => {
    try {
      setLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: any) {
      const authError = {
        code: error.code || 'auth/unknown',
        message: getUserFriendlyError(error.code || error.message)
      };
      setError(authError);
      throw new Error(authError.message);
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<UserCredential> => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error: any) {
      const authError = {
        code: error.code || 'auth/popup-closed',
        message: getUserFriendlyError(error.code || error.message)
      };
      setError(authError);
      throw new Error(authError.message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
    } catch (error: any) {
      const authError = {
        code: error.code || 'auth/unknown',
        message: getUserFriendlyError(error.code || error.message)
      };
      setError(authError);
      throw new Error(authError.message);
    }
  }, []);

  return {
    user,
    loading,
    error, // Now available for UI error display
    login,
    signup,
    loginWithGoogle,
    logout,
    // Utility
    clearError: () => setError(null)
  };
};

// Convert Firebase error codes to user-friendly messages
const getUserFriendlyError = (errorCodeOrMessage: string): string => {
  const errorMap: Record<string, string> = {
    // Email/Password errors
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/email-already-in-use': 'Email already in use. Try logging in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    
    // Network errors
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed': 'Sign-in is currently disabled.',
    
    // Google OAuth
    'auth/popup-closed-by-user': 'Google login was cancelled.',
    'auth/popup-blocked': 'Popup blocked. Please allow popups for this site.',
    
    // Generic
    'auth/too-many-requests': 'Too many failed attempts. Try again later.',
    'auth/invalid-credential': 'Invalid login credentials.'
  };

  return errorMap[errorCodeOrMessage] || 'Something went wrong. Please try again.';
};
