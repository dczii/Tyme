'use client';

import React, { useState } from 'react';
import { AlertCircle, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { googleSignIn, signInWithEmail, signUpWithEmail } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import BrandLogo from './BrandLogo';

interface LoginScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Email/password form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Shown after a sign-up when Supabase requires email confirmation.
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const handleOpenGoogleAuth = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await googleSignIn();
      // Supabase uses redirect-based OAuth — the browser will redirect to Google.
      // When the user returns, onAuthStateChange in providers.tsx handles the session.
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setError(err?.message || 'Failed to authenticate via Google OAuth. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConfirmEmailSent(false);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const data = await signUpWithEmail(fullName.trim(), email.trim(), password);
        // When email confirmation is enabled, no session is returned yet.
        if (!data.session) {
          setConfirmEmailSent(true);
          setIsLoading(false);
          return;
        }
        // Otherwise onAuthStateChange fires and the app takes over.
      } else {
        await signInWithEmail(email.trim(), password);
        // onAuthStateChange fires and the app takes over.
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      setError(err?.message || 'Authentication failed. Please check your details and try again.');
      setIsLoading(false);
    }
  };

  const switchMode = (next: 'signin' | 'register') => {
    setMode(next);
    setError('');
    setConfirmEmailSent(false);
  };

  const inputClass =
    'w-full bg-[#1a110c]/70 border border-[#3e271a] focus:border-[#dda67a]/70 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-[#ecd0b9]/30 outline-none transition focus:ring-2 focus:ring-[#dda67a]/20 min-h-[48px]';

  return (
    <div id="login-container-root" className="min-h-screen w-full flex items-center justify-center bg-[#0c0806] text-slate-100 p-4 pb-safe relative overflow-hidden font-sans">
      {/* Espresso Theme Ambient Visuals */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-[#4a2b16]/30 animate-pulse duration-[6s]"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-[#9a6a42]/15 animate-pulse duration-[8s]"></div>

      {/* Glassmorphism Credentials Panel */}
      <div className="w-full max-w-[430px] bg-[#140d0a]/75 backdrop-blur-2xl border border-[#3e271a] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative z-10 flex flex-col items-center">

        {/* Workspace Flag */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-[#2d1b11]/60 border border-[#5e3820]/40 rounded-full text-[10px] font-mono text-[#dda67a] tracking-wider uppercase">
          <Sparkles className="h-3 w-3 animate-spin duration-3000" />
          <span>Tyme Workspace</span>
        </div>

        {/* Corporate branding header */}
        <div className="mt-8 mb-7 text-center flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-[#201410] border border-[#3d2416]/55 flex items-center justify-center p-2.5 shadow-xl shadow-[#4a2b16]/60 mb-4 scale-102">
            <BrandLogo size={36} showBackground={false} className="brightness-125 select-none pointer-events-none" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            {mode === 'signin' ? 'Welcome to Tyme' : 'Create your Account'}
          </h1>
          <p className="text-xs text-[#ecd0b9]/70 mt-2 max-w-[280px] leading-relaxed">
            {mode === 'signin'
              ? 'Sign in to your time-tracking workspace.'
              : 'Register with your email to set up and sync your workspace.'}
          </p>
        </div>

        <div className="w-full space-y-4">

          {/* Google OAuth */}
          <button
            onClick={handleOpenGoogleAuth}
            disabled={isGoogleLoading || isLoading}
            className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 text-[#1f1f1f] text-sm font-semibold py-3.5 px-5 rounded-xl border border-slate-200/80 transition shadow-lg cursor-pointer flex items-center justify-center gap-3 select-none duration-150 disabled:opacity-85 text-center min-h-[48px]"
          >
            {isGoogleLoading ? (
              <div className="flex items-center gap-2.5">
                <div className="h-3.5 w-3.5 border-2 border-slate-300 border-t-[#4285F4] rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-mono font-bold">Connecting...</span>
              </div>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-[#3e271a]/60"></div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#ecd0b9]/40">or continue with email</span>
            <div className="h-px flex-1 bg-[#3e271a]/60"></div>
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    required={mode === 'register'}
                    className={inputClass}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
              className={inputClass}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={8}
              className={inputClass}
            />

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-[#dda67a] hover:bg-[#e8b88c] active:bg-[#c9925f] text-[#201410] text-sm font-bold py-3.5 px-5 rounded-xl transition shadow-lg shadow-[#4a2b16]/40 cursor-pointer flex items-center justify-center gap-2.5 select-none duration-150 disabled:opacity-60 disabled:cursor-wait min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs uppercase tracking-widest font-mono">
                    {mode === 'register' ? 'Creating account…' : 'Signing in…'}
                  </span>
                </>
              ) : (
                <span>{mode === 'register' ? 'Create account' : 'Sign in'}</span>
              )}
            </button>
          </form>

          <AnimatePresence>
            {confirmEmailSent && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-emerald-950/40 border border-emerald-500/25 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-200 overflow-hidden"
              >
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
                <span>Almost there — we sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-red-950/45 border border-red-500/25 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-300 overflow-hidden"
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Toggle Mode Link */}
        <div className="mt-6 pt-5 border-t border-[#3e271a]/30 w-full text-center">
          <p className="text-xs text-[#ecd0b9]/60">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === 'signin' ? 'register' : 'signin')}
              className="text-[#dda67a] hover:text-[#f3be94] font-semibold transition cursor-pointer hover:underline focus:outline-none"
            >
              {mode === 'signin' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="mt-8 text-center text-[10px] text-[#ecd0b9]/25 font-mono tracking-wide uppercase leading-normal max-w-[270px]">
          By continuing, you agree to securely sync your time-tracking workspace.
        </div>
      </div>
    </div>
  );
}
