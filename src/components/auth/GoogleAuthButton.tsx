'use client';

import React from 'react';

export function GoogleMark({ className }: { className?: string }) {
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

interface GoogleAuthButtonProps {
  onClick: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * The white "Google" auth button shared by LoginScreen and the landing SignupModal.
 * House convention keeps Google auth on a white pill; the label varies by context
 * ("Continue with Google", "Sign in with Google", …).
 */
export default function GoogleAuthButton({
  onClick,
  label,
  loading = false,
  disabled = false,
  className = '',
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full bg-white hover:bg-slate-50 active:bg-slate-100 text-[#1f1f1f] text-sm font-semibold py-3.5 px-5 rounded-xl border border-slate-200/80 transition shadow-lg cursor-pointer flex items-center justify-center gap-3 select-none duration-150 disabled:opacity-85 disabled:cursor-wait text-center min-h-[48px] ${className}`}
    >
      {loading ? (
        <div className="flex items-center gap-2.5">
          <div className="h-3.5 w-3.5 border-2 border-slate-300 border-t-[#4285F4] rounded-full animate-spin" />
          <span className="text-xs text-slate-500 uppercase tracking-widest font-mono font-bold">
            Connecting…
          </span>
        </div>
      ) : (
        <>
          <GoogleMark className="h-5 w-5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
