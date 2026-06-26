'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTyme } from '@/app/providers';
import { googleSignIn } from '@/lib/supabase';

interface SignInButtonProps {
  /** `header` = compact nav button, `hero` = larger primary CTA. */
  variant?: 'header' | 'hero';
  className?: string;
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
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
  );
}

/**
 * "Sign in with Google" button wired to the real Supabase OAuth flow.
 * Also forwards already-signed-in visitors straight into the app, satisfying the
 * landing page's auto-redirect behavior.
 */
export default function SignInButton({ variant = 'header', className = '' }: SignInButtonProps) {
  const { user, authLoading } = useTyme();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-redirect an authenticated visitor into the workspace.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/calendar');
    }
  }, [authLoading, user, router]);

  const handleSignIn = async () => {
    setIsConnecting(true);
    try {
      await googleSignIn();
      // Redirect-based OAuth: the browser navigates away to Google.
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setIsConnecting(false);
    }
  };

  const isHero = variant === 'hero';
  const sizing = isHero
    ? 'text-base py-4 px-7 rounded-2xl gap-3 min-h-[56px]'
    : 'text-sm py-2.5 px-4 rounded-xl gap-2.5 min-h-[44px]';

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isConnecting}
      aria-label="Sign in with Google"
      className={`group inline-flex items-center justify-center bg-white font-semibold text-[#1f1f1f] border border-slate-200/80 shadow-lg cursor-pointer select-none transition duration-150 ease-out hover:bg-slate-50 active:scale-[0.97] disabled:opacity-85 disabled:cursor-wait ${sizing} ${className}`}
    >
      {isConnecting ? (
        <>
          <span className="h-4 w-4 border-2 border-slate-300 border-t-[#4285F4] rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Connecting…
          </span>
        </>
      ) : (
        <>
          <GoogleMark className={isHero ? 'h-5 w-5' : 'h-[18px] w-[18px]'} />
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
}
