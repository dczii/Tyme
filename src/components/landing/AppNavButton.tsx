'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTyme } from '@/app/providers';

interface AppNavButtonProps {
  /** `header` = compact nav button, `hero` = larger primary CTA. */
  variant?: 'header' | 'hero';
  className?: string;
}

/**
 * Dynamic landing-page CTA. Shows "Login" for signed-out visitors (→ /login) and
 * "Go To App" once a session exists (→ /calendar). Reuses the white-pill styling
 * shared with SignInButton.
 */
export default function AppNavButton({ variant = 'header', className = '' }: AppNavButtonProps) {
  const { user, authLoading } = useTyme();
  const router = useRouter();

  const signedIn = !authLoading && !!user;
  const label = signedIn ? 'Go To App' : 'Login';
  const destination = signedIn ? '/calendar' : '/login';

  const isHero = variant === 'hero';
  const sizing = isHero
    ? 'text-base py-4 px-7 rounded-2xl gap-3 min-h-[56px]'
    : 'text-sm py-2.5 px-4 rounded-xl gap-2.5 min-h-[44px]';

  return (
    <button
      type="button"
      onClick={() => router.push(destination)}
      aria-label={label}
      className={`group inline-flex items-center justify-center bg-white font-semibold text-[#1f1f1f] border border-slate-200/80 shadow-lg cursor-pointer select-none transition duration-150 ease-out hover:bg-slate-50 active:scale-[0.97] ${sizing} ${className}`}
    >
      <span>{label}</span>
    </button>
  );
}
