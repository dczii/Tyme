'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import BrandLogo from './BrandLogo';
import { useAuthForm } from './auth/useAuthForm';
import { readAuthReturnState, type AuthReturnState } from './auth/authReturnState';
import GoogleAuthButton from './auth/GoogleAuthButton';
import { AuthBanner } from './auth/AuthBanners';

interface LoginScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function LoginScreen({ onLoginSuccess: _onLoginSuccess }: LoginScreenProps) {
  const {
    mode,
    switchMode,
    error,
    fieldErrors,
    isLoading,
    isGoogleLoading,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmEmailSent,
    handleGoogle,
    handleEmailSubmit,
  } = useAuthForm('signin');

  // Greet email-confirmation / cancelled-OAuth returns with a clear next step
  // rather than a bare form (#28). Read once on mount, client-side only.
  const [returnState, setReturnState] = useState<AuthReturnState | null>(null);
  useEffect(() => {
    setReturnState(readAuthReturnState());
  }, []);

  const inputClass =
    'w-full bg-[#1a110c]/70 border border-[#3e271a] focus:border-[#dda67a]/70 rounded-xl px-4 py-3 text-base text-slate-100 placeholder:text-[#ecd0b9]/30 outline-none transition focus:ring-2 focus:ring-[#dda67a]/20 min-h-[48px]';
  const fieldErrorClass = 'mt-1.5 pl-1 text-xs text-red-300/90';

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

          {/* Off-page return banner (email confirmed / cancelled Google consent) */}
          <AuthBanner show={!!returnState} tone={returnState?.kind === 'error' ? 'error' : 'success'}>
            {returnState?.message}
          </AuthBanner>

          {/* Google OAuth */}
          <GoogleAuthButton
            onClick={handleGoogle}
            loading={isGoogleLoading}
            disabled={isLoading}
            label={mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
          />

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-[#3e271a]/60"></div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#ecd0b9]/40">or continue with email</span>
            <div className="h-px flex-1 bg-[#3e271a]/60"></div>
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3" noValidate>
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
                    aria-invalid={!!fieldErrors.fullName}
                    className={inputClass}
                  />
                  {fieldErrors.fullName && <p className={fieldErrorClass}>{fieldErrors.fullName}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                className={inputClass}
              />
              {fieldErrors.email && <p className={fieldErrorClass}>{fieldErrors.email}</p>}
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                aria-invalid={!!fieldErrors.password}
                className={inputClass}
              />
              {fieldErrors.password && <p className={fieldErrorClass}>{fieldErrors.password}</p>}
            </div>

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

          <AuthBanner show={confirmEmailSent} tone="success">
            Almost there — we sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </AuthBanner>

          <AuthBanner show={!!error} tone="error">
            {error}
          </AuthBanner>

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
