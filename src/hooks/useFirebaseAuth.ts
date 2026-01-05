// src/hooks/useFirebaseAuth.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

const provider = new GoogleAuthProvider();

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  // handle auth state + redirect result once on mount
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        setLoading(true);
        // process redirect result (if returning from provider)
        await getRedirectResult(auth);
      } catch (err) {
        console.error("getRedirectResult error:", err);
        setError(err);
      } finally {
        // subscribe to auth state
        unsub = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        });
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    setError(null);
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    setError(null);
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    setError(null);
    await signOut(auth);
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    loginWithGoogle,
    logout,
  };
};
