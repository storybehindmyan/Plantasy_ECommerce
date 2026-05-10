/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

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
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  validatePassword: (password: string) => string | null;
  error: any | null;
  hasPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/;

const googleProvider = new GoogleAuthProvider();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  // Single, direct onAuthStateChanged subscription — no hook layering
  useEffect(() => {
    // Explicitly set LOCAL persistence so session survives page reloads
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const profileData = userDoc.data() as Partial<User>;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
          photoURL: firebaseUser.photoURL ?? undefined,
          role: profileData.role || "user",
          ...profileData,
        });
      } else {
        const basicUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
          photoURL: firebaseUser.photoURL ?? undefined,
          role: "user",
        };
        await setDoc(userRef, basicUser);
        setUser(basicUser);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
      // Firestore fetch failed — keep user authenticated with basic Firebase info
      // so a network/permissions error does NOT log the user out
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
        photoURL: firebaseUser.photoURL ?? undefined,
        role: "user",
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (!PASSWORD_REGEX.test(password)) {
      return (
        "Password must be at least 8 characters, " +
        "include uppercase, lowercase, a number, and a special character."
      );
    }
    return null;
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const signup = async (email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) throw new Error("Passwords do not match.");
    const validationError = validatePassword(password);
    if (validationError) throw new Error(validationError);
    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { ...user, ...updates }, { merge: true });
      setUser({ ...user, ...updates });
    } catch (err) {
      console.error("Error updating user:", err);
      throw err;
    }
  };

  const hasPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.includes((user as any).role || "");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUser,
    validatePassword,
    error,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
