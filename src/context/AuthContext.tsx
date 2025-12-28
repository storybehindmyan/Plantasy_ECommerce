import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { MockGoogleModal } from '../components/MockGoogleModal';

type Role = 'user' | 'admin' | null;

export interface User {
    uid: string;
    email: string;
    role: Role;
    name: string;
    photoURL?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string) => void;
    loginWithGoogle: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

    // Persist Login
    useEffect(() => {
        const storedUser = localStorage.getItem('plantasy_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (email: string) => {
        // Fallback for email login (mock)
        const newUser: User = {
            uid: 'email_' + Date.now(),
            email,
            role: email.includes('admin') ? 'admin' : 'user',
            name: email.split('@')[0],
            photoURL: ''
        };
        setUser(newUser);
        localStorage.setItem('plantasy_user', JSON.stringify(newUser));
    };

    const loginWithGoogle = () => {
        setIsGoogleModalOpen(true);
    };

    const handleGoogleAccountSelect = (account: any) => {
        const newUser: User = {
            uid: account.uid,
            email: account.email,
            role: 'admin', // Grant admin by default for demo
            name: account.displayName,
            photoURL: account.photoURL
        };
        setUser(newUser);
        localStorage.setItem('plantasy_user', JSON.stringify(newUser));
        setIsGoogleModalOpen(false);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('plantasy_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            loginWithGoogle,
            logout
        }}>
            {children}
            <MockGoogleModal
                isOpen={isGoogleModalOpen}
                onClose={() => setIsGoogleModalOpen(false)}
                onSelectAccount={handleGoogleAccountSelect}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
