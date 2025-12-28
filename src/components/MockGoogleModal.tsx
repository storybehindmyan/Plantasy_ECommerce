import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

interface MockGoogleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectAccount: (account: any) => void;
}

const MOCK_ACCOUNTS = [
    {
        uid: 'google_1029384756',
        email: 'abhinav.pulavarthi@gmail.com',
        displayName: 'Abhinav Pulavarthi',
        photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocIq...=s96-c', // Mock image
        color: 'bg-blue-600'
    },
    {
        uid: 'google_5647382910',
        email: 'plant.lover@example.com',
        displayName: 'Plant Lover',
        photoURL: '',
        color: 'bg-green-600'
    }
];

export const MockGoogleModal = ({ isOpen, onClose, onSelectAccount }: MockGoogleModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Window */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center relative">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="font-medium text-gray-500">Sign in with Google</span>
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mt-2">Choose an account</h3>
                                <p className="text-sm text-gray-500">to continue to Plantasy</p>
                            </div>
                        </div>

                        {/* Account List */}
                        <div className="py-2">
                            {MOCK_ACCOUNTS.map((account) => (
                                <button
                                    key={account.uid}
                                    onClick={() => onSelectAccount(account)}
                                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                                >
                                    <div className={`w-10 h-10 rounded-full ${account.color} flex items-center justify-center text-white text-lg font-medium shadow-sm`}>
                                        {account.photoURL && account.photoURL.length > 20 ? (
                                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            account.displayName[0]
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 group-hover:text-black">{account.displayName}</p>
                                        <p className="text-sm text-gray-500">{account.email}</p>
                                    </div>
                                </button>
                            ))}

                            <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-t border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-transparent border border-gray-300 flex items-center justify-center text-gray-500">
                                    <User size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-gray-800">Use another account</p>
                                </div>
                            </button>
                        </div>

                        <div className="p-4 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-500">
                                To continue, Google will share your name, email address, and profile picture with Plantasy.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
