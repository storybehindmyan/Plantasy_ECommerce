/* eslint-disable react-refresh/only-export-components */
 
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
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  validatePassword: (password: string) => string | null;
  error: any | null;
  hasPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Password: min 8 chars, 1 upper, 1 lower, 1 number, 1 special
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const firebaseAuth = useFirebaseAuth();

  // Helper: validate password against rules
  const validatePassword = (password: string): string | null => {
    if (!PASSWORD_REGEX.test(password)) {
      return (
        "Password must be at least 8 characters, " +
        "include uppercase, lowercase, a number, and a special character."
      );
    }
    return null;
  };

  // Sync Firebase Auth state with custom User state
  useEffect(() => {
    if (firebaseAuth.loading) return;

    if (firebaseAuth.user) {
      void loadUserProfile(firebaseAuth.user);
    } else {
      setUser(null);
      localStorage.removeItem("plantasy_user");
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

  const signup = async (
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const validationError = validatePassword(password);
    if (validationError) {
      throw new Error(validationError);
    }

    await firebaseAuth.signup(email, password);
  };

  const loginWithGoogle = async () => {
    await firebaseAuth.loginWithGoogle();
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
      await setDoc(userRef, { ...user, ...updates }, { merge: true });

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("plantasy_user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  // ✅ hasPermission function
  const hasPermission = (permissions: string[]): boolean => {
    if (!user) return false;

    const userRole = (user as any).role || "";
    return permissions.includes(userRole);
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
  }, [firebaseAuth.user]);

  // ✅ Create value object with all properties
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading: loading || firebaseAuth.loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUser,
    validatePassword,
    error: firebaseAuth.error,
    hasPermission, // ✅ Add the function here
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
