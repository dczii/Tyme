import React, { useState } from 'react';
import { Shield, AlertCircle, Sparkles, Info } from 'lucide-react';
import { UserProfile } from '../types';
import { googleSignIn } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  const handleOpenGoogleAuth = async () => {
    setError('');
    setIsLoading(true);

    try {
      await googleSignIn();
      // Supabase uses redirect-based OAuth — the browser will redirect to Google.
      // When the user returns, onAuthStateChange in App.tsx handles the session.
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setError(err?.message || 'Failed to authenticate via Google OAuth. Please try again.');
      setIsLoading(false);
    }
  };

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
          <span>Google Workspace</span>
        </div>

        {/* Corporate branding header */}
        <div className="mt-8 mb-8 text-center flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#a66e46] to-[#4f2f18] flex items-center justify-center text-[#fdf4ee] shadow-xl shadow-[#4a2b16]/60 mb-4 scale-102">
            <Shield className="h-7 w-7 text-[#ffdda6]" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            {mode === 'signin' ? 'Welcome to Tyme' : 'Create your Account'}
          </h1>
          <p className="text-xs text-[#ecd0b9]/70 mt-2 max-w-[280px] leading-relaxed">
            {mode === 'signin'
              ? 'Time-tracking dashboard aligned to your active enterprise workspace.'
              : 'Register now using Google OAuth to configure and sync your workspace.'}
          </p>
        </div>

        {/* Sign In Trigger block */}
        <div className="w-full space-y-4">
          
          <button
            onClick={handleOpenGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 text-[#1f1f1f] text-sm font-semibold py-4 md:py-3.5 px-5 rounded-xl border border-slate-200/80 transition shadow-lg cursor-pointer flex items-center justify-center gap-3 select-none duration-150 disabled:opacity-85 text-center min-h-[48px]"
          >
            {isLoading ? (
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

          <AnimatePresence>
            {mode === 'register' && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#2d1b11]/40 border border-[#5e3820]/30 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-[#dda67a]/90 leading-relaxed overflow-hidden"
              >
                <Info className="h-4 w-4 shrink-0 text-[#dda67a] mt-0.5" />
                <span>
                  To ensure secure single sign-on synchronization of your workspace, Tyme supports registration exclusively via Google accounts. No password setup is required.
                </span>
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

          {isLoading && !error && (
            <p className="text-[10px] text-center text-[#ecd0b9]/40 font-mono">
              Waiting for you to choose an account in the popup window...
            </p>
          )}

        </div>

        {/* Toggle Mode Link */}
        <div className="mt-6 pt-5 border-t border-[#3e271a]/30 w-full text-center">
          <p className="text-xs text-[#ecd0b9]/60">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'register' : 'signin');
                setError('');
              }}
              className="text-[#dda67a] hover:text-[#f3be94] font-semibold transition cursor-pointer hover:underline focus:outline-none"
            >
              {mode === 'signin' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="mt-8 text-center text-[10px] text-[#ecd0b9]/25 font-mono tracking-wide uppercase leading-normal max-w-[270px]">
          By continuing, you authorize secure single sign-on synchronization of your time-tracking workspace.
        </div>
      </div>
    </div>
  );
}
