/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

type Role = "user" | "admin" | null;

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
  photoURL?: string;
  title?: string;
  phone?: string;
  bio?: string;
  address?: string;
}

interface AuthContextType {
  [x: string]: any;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  error: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const firebaseAuth = useFirebaseAuth();

  // Sync Firebase Auth state with custom User state
  useEffect(() => {
    if (firebaseAuth.loading) return;

    if (firebaseAuth.user) {
      void loadUserProfile(firebaseAuth.user);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [firebaseAuth.user, firebaseAuth.loading]);

  const loadUserProfile = async (firebaseUser: any) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const profileData = userDoc.data() as Partial<User>;
        const fullUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name:
            firebaseUser.displayName ||
            firebaseUser.email!.split("@")[0],
          photoURL: firebaseUser.photoURL,
          role: profileData.role || "user",
          ...profileData,
        };
        setUser(fullUser);
        localStorage.setItem("plantasy_user", JSON.stringify(fullUser));
      } else {
        const basicUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name:
            firebaseUser.displayName ||
            firebaseUser.email!.split("@")[0],
          photoURL: firebaseUser.photoURL,
          role: "user",
        };
        await setDoc(userRef, basicUser);
        setUser(basicUser);
        localStorage.setItem("plantasy_user", JSON.stringify(basicUser));
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const login = async (email: string, password: string) => {
    await firebaseAuth.login(email, password);
  };

  const signup = async (email: string, password: string) => {
    await firebaseAuth.signup(email, password);
  };

  const loginWithGoogle = async () => {
    await firebaseAuth.loginWithGoogle(); // now uses signInWithRedirect in the hook
  };

  const logout = async () => {
    await firebaseAuth.logout();
    localStorage.removeItem("plantasy_user");
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        { ...user, ...updates },
        { merge: true }
      );

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("plantasy_user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  // Persist login on app reload (fallback)
  useEffect(() => {
    const storedUser = localStorage.getItem("plantasy_user");
    if (storedUser && !firebaseAuth.user) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
      } catch {
        localStorage.removeItem("plantasy_user");
      }
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading: loading || firebaseAuth.loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUser,
    error: firebaseAuth.error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
