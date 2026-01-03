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
  useCallback 
} from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

type Role = 'user' | 'admin' | null;

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
  photoURL?: string;
  title?: string;
  phone?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
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
      // Firebase user exists, fetch/enhance with profile data
      loadUserProfile(firebaseAuth.user);
    } else {
      // No Firebase user, clear local state
      setUser(null);
    }
    setLoading(false);
  }, [firebaseAuth.user, firebaseAuth.loading]);

  // Load user profile from Firestore (with role, etc.)
  const loadUserProfile = async (firebaseUser: any) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as Partial<User>;
        const fullUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          photoURL: firebaseUser.photoURL,
          role: profileData.role || 'user', // Default to user
          ...profileData
        };
        setUser(fullUser);
        localStorage.setItem('plantasy_user', JSON.stringify(fullUser));
      } else {
        // New user - create basic profile
        const basicUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          photoURL: firebaseUser.photoURL,
          role: 'user' // Default for new users
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), basicUser);
        setUser(basicUser);
        localStorage.setItem('plantasy_user', JSON.stringify(basicUser));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Real-time profile listener (optional, for live updates)
  const startProfileListener = useCallback((uid: string) => {
    return onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as Partial<User>;
        setUser(prev => prev ? { ...prev, ...profileData } : null);
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    await firebaseAuth.login(email, password);
  };

  const signup = async (email: string, password: string) => {
    await firebaseAuth.signup(email, password);
  };

  const loginWithGoogle = async () => {
    await firebaseAuth.loginWithGoogle();
  };

  const logout = async () => {
    await firebaseAuth.logout();
    localStorage.removeItem('plantasy_user');
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), { ...user, ...updates }, { merge: true });
      
      // Update local state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('plantasy_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Persist login on app reload (fallback)
  useEffect(() => {
    const storedUser = localStorage.getItem('plantasy_user');
    if (storedUser && !firebaseAuth.user) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('plantasy_user');
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
    updateUser
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
