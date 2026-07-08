'use client';

import { useState } from 'react';
import { googleSignIn, signInWithEmail, signUpWithEmail } from '@/lib/supabase';

// Shared auth-form logic for every surface that signs a user in or registers one:
// the full-page LoginScreen and the landing-page SignupModal. Keeping the state
// machine, validation, and the Supabase calls here means both surfaces stay in
// lockstep — there is no second copy of the validation to drift out of sync.

export type AuthMode = 'signin' | 'register';

export interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

// Deliberately permissive: catch the obvious "no @", "no dot" typos without
// rejecting valid-but-unusual addresses. The server is the real authority.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthFields(
  mode: AuthMode,
  values: { fullName: string; email: string; password: string },
): FieldErrors {
  const errors: FieldErrors = {};
  if (mode === 'register' && !values.fullName.trim()) errors.fullName = 'Enter your name.';
  if (!values.email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.password) errors.password = 'Enter a password.';
  else if (values.password.length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}

export function useAuthForm(initialMode: AuthMode) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Email/password form state.
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Shown after a sign-up when Supabase requires email confirmation (data.session null).
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await googleSignIn();
      // Redirect-based OAuth — the browser navigates away to Google. On return,
      // onAuthStateChange in providers.tsx picks up the session.
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      console.error('Google Sign-in error:', err);
      setError(message || 'Failed to authenticate via Google OAuth. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConfirmEmailSent(false);

    const errs = validateAuthFields(mode, { fullName, email, password });
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      if (mode === 'register') {
        const data = await signUpWithEmail(fullName.trim(), email.trim(), password);
        // With email confirmation enabled, no session is returned yet — the user
        // must click the link in their inbox first.
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      console.error('Email auth error:', err);
      setError(message || 'Authentication failed. Please check your details and try again.');
      setIsLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setFieldErrors({});
    setConfirmEmailSent(false);
  };

  return {
    mode,
    setMode,
    switchMode,
    error,
    setError,
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
  };
}
