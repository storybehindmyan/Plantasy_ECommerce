/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface LoginProps {
  initialView?: 'signup-options' | 'login';
}

const Login = ({ initialView = 'login' }: LoginProps) => {
  const [view, setView] = useState<'signup-options' | 'email-signup' | 'login'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, signup, loginWithGoogle, user, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync initial view with route
  useEffect(() => {
    if (location.pathname === '/signup') {
      setView('signup-options');
    } else if (location.pathname === '/login') {
      setView('login');
    }
  }, [location.pathname]);

  // Redirect to /shop if user logged in
  useEffect(() => {
    if (user) {
      navigate('/shop', { replace: true });
    }
  }, [user, navigate]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please enter email and password.');
      return;
    }

    try {
      if (view === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      // navigate handled by useEffect on user
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed.');
    }
  };

  const handleGoogleClick = async () => {
    setLocalError(null);
    try {
      await loginWithGoogle();
      // navigate handled by useEffect on user
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in failed.');
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  const FacebookIcon = () => (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );

  const combinedError = localError || error || null;
  const isSubmitting = loading;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1a1a1a] to-black opacity-80" />

      {/* Close Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-50 pointer-events-auto"
      >
        <X size={32} strokeWidth={1} />
      </button>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-[400px] flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-serif text-white mb-4 tracking-wide">
          {view === 'login' ? 'Log In' : 'Sign Up'}
        </h1>

        <p className="text-white/60 text-sm mb-12">
          {view === 'login' ? (
            <>
              New to this site?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-[#c16e41] hover:underline"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already a member?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#c16e41] hover:underline"
              >
                Log In
              </button>
            </>
          )}
        </p>

        {/* Error Message */}
        {combinedError && (
          <div className="w-full mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/40 px-4 py-3 rounded-sm">
            {combinedError}
          </div>
        )}

        {/* Signup Options View */}
        {view === 'signup-options' && (
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={handleGoogleClick}
              disabled={isSubmitting}
              className="w-full bg-white text-black py-3 px-4 rounded-sm flex items-center justify-center gap-3 font-medium hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <GoogleIcon />
              <span>{isSubmitting ? 'Please wait...' : 'Sign up with Google'}</span>
            </button>

            {/* Facebook still mock/no-op – you can remove or implement later */}
            <button
              type="button"
              onClick={() => setLocalError('Facebook auth not implemented yet.')}
              className="w-full bg-[#4267B2] text-white py-3 px-4 rounded-sm flex items-center justify-center gap-3 font-medium hover:bg-[#365899] transition-colors"
            >
              <FacebookIcon />
              <span>Sign up with Facebook</span>
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20"></span>
              </div>
              <span className="relative bg-black px-4 text-xs text-white/40 uppercase tracking-widest">
                or
              </span>
            </div>

            <button
              onClick={() => setView('email-signup')}
              className="w-full bg-transparent border border-white/30 text-white py-3 px-4 rounded-sm font-medium hover:border-white transition-colors"
            >
              Sign up with email
            </button>

            <div className="mt-6 flex items-start gap-3">
              <div className="mt-1 min-w-[16px]">
                <input
                  type="checkbox"
                  id="public-profile"
                  className="accent-[#c16e41] w-4 h-4 cursor-pointer"
                />
              </div>
              <label
                htmlFor="public-profile"
                className="text-xs text-white/50 leading-relaxed cursor-pointer select-none"
              >
                Sign up to this site with a public profile.{' '}
                <span className="underline hover:text-white">Read more</span>
              </label>
            </div>
          </div>
        )}

        {/* Login / Email Signup View */}
        {(view === 'login' || view === 'email-signup') && (
          <form onSubmit={handleAuthSubmit} className="w-full space-y-6">
            {/* Social login (only for login view) */}
            {view === 'login' && (
              <div className="w-full flex flex-col gap-4 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isSubmitting}
                  className="w-full bg-white text-black py-3 px-4 rounded-sm flex items-center justify-center gap-3 font-medium hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <GoogleIcon />
                  <span>{isSubmitting ? 'Please wait...' : 'Log in with Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLocalError('Facebook auth not implemented yet.')}
                  className="w-full bg-[#4267B2] text-white py-3 px-4 rounded-sm flex items-center justify-center gap-3 font-medium hover:bg-[#365899] transition-colors"
                >
                  <FacebookIcon />
                  <span>Log in with Facebook</span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20"></span>
                  </div>
                  <span className="relative bg-black px-4 text-xs text-white/40 uppercase tracking-widest">
                    or
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/30 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/30 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#c16e41] text-white py-4 font-bold tracking-widest hover:bg-[#a0502a] disabled:opacity-60 disabled:cursor-not-allowed transition duration-300 mt-8 rounded-sm"
            >
              {isSubmitting
                ? 'Please wait...'
                : view === 'login'
                ? 'Log In'
                : 'Sign Up'}
            </button>

            {view === 'email-signup' && (
              <button
                type="button"
                onClick={() => setView('signup-options')}
                className="w-full text-white/40 text-sm hover:text-white transition-colors"
              >
                Back to options
              </button>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
