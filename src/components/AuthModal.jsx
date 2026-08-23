import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  HeartCrack,
  CheckCircle2
} from 'lucide-react';
import { loginUser, signupUser } from '../utils/auth';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!isLogin && !name) {
      setError('Please enter your name.');
      return;
    }

    let user;
    if (isLogin) {
      user = loginUser({ email, password });
    } else {
      user = signupUser({ name, email, password });
    }

    onAuthSuccess(user);
    onClose();
  };

  const handleGoogleLogin = () => {
    const user = loginUser({ email: 'google.user@gmail.com', password: 'google_oauth_session' });
    onAuthSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#180436] border border-purple-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-0.5 shadow-lg shadow-rose-500/30 mx-auto flex items-center justify-center mb-3">
            <div className="w-full h-full bg-[#180433] rounded-[14px] flex items-center justify-center">
              <HeartCrack className="w-6 h-6 text-rose-400" />
            </div>
          </div>

          <h3 className="text-xl font-black font-['Outfit'] text-white">
            {isLogin ? 'Log in to I HATE PDF' : 'Create Free Account'}
          </h3>
          <p className="text-xs text-purple-300 mt-1">
            Log in to save and access your files in the 7-Day Vault
          </p>
        </div>

        {/* Feature Highlight Pill */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-purple-900/50 border border-purple-500/30 text-xs text-purple-200 mb-6">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>7-Day Cloud File Vault enabled on your account</span>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 rounded-2xl bg-purple-950/80 border border-purple-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              isLogin ? 'bg-amber-400 text-purple-950 shadow-md' : 'text-purple-300 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              !isLogin ? 'bg-amber-400 text-purple-950 shadow-md' : 'text-purple-300 hover:text-white'
            }`}
          >
            Sign Up (Free)
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Your Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-purple-400 absolute left-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-purple-600/40 text-white text-xs placeholder-purple-400/60 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-purple-600/40 text-white text-xs placeholder-purple-400/60 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-purple-400 absolute left-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-purple-600/40 text-white text-xs placeholder-purple-400/60 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-purple-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-400/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>{isLogin ? 'Log In & Open Vault' : 'Create Free Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-purple-800"></div></div>
          <span className="relative px-3 bg-[#180436] text-[10px] text-purple-400 uppercase tracking-wider font-bold">Or continue with</span>
        </div>

        {/* 1-Click Demo Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Quick Guest 1-Click Login</span>
        </button>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-purple-800/60 flex items-center justify-center gap-2 text-[10px] text-purple-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Free • No Credit Card Required</span>
        </div>

      </div>
    </div>
  );
}
