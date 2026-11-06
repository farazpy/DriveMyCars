import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Info,
  Loader2,
  ShieldCheck,
  Car
} from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../firebase.ts';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (firebaseUser: any) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onGoogleSignIn,
}) => {
  const { settings } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'signin') {
        const user = await signInWithEmail(email.trim(), password);
        await onSuccess(user);
        onClose();
      } else {
        const user = await signUpWithEmail(email.trim(), password, name.trim());
        await onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password credentials');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else {
        setError(err.message || 'Authentication failed. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Google login interrupted or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs transition-colors duration-300">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-neutral-900 dark:text-white transition-colors">
        
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Logo & Welcome */}
          <div className="text-center space-y-2 pt-2">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.brand_name}
                className="h-10 max-w-[200px] object-contain mx-auto"
              />
            ) : (
              <div className="inline-flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-2xs">
                  <Car className="w-4 h-4" />
                </div>
                <span className="font-black text-xl tracking-tight text-neutral-900 dark:text-white">
                  {settings.brand_name}
                </span>
              </div>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {settings.brand_tagline || "India's Premium Peer-to-Peer Self-Drive Network"}
            </p>

            {/* Unified Role Badge */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>Unified Login · Customer · Host · Admin</span>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
              One login for all roles. Your dashboard access is automatically determined by your database profile.
            </p>
          </div>

          {/* Custom Switch Tab */}
          <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-2xl border border-neutral-200/60 dark:border-neutral-850">
            <button
              onClick={() => {
                setActiveTab('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 rounded-xl flex items-center space-x-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'signup' && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name as per DL"
                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pune.driver@domain.com"
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{activeTab === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="flex-shrink mx-3 text-neutral-400 dark:text-neutral-500 text-[10px] font-bold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-950 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors shadow-2xs cursor-pointer flex items-center justify-center space-x-2.5"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.68-5.17 3.68-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.32 21.36 7.39 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.32 2.64 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
