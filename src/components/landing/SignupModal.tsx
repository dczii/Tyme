'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, Loader2, MailCheck } from 'lucide-react';
import BrandLogo from '../BrandLogo';
import { useAuthForm } from '../auth/useAuthForm';
import GoogleAuthButton from '../auth/GoogleAuthButton';
import { AuthBanner } from '../auth/AuthBanners';
import { lockScroll, unlockScroll } from './scroll/lenis';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Below `md` the modal is a full-width bottom sheet; at and above it, a centered
// dialog. Tracked in state so Framer can pick the matching enter/exit motion.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
}

/**
 * Landing-page registration modal (#26). A presentation layer over the existing
 * Supabase auth flows — Google OAuth plus email/password — reusing the shared
 * useAuthForm hook so its validation never drifts from LoginScreen. Opens as a
 * centered dialog on desktop and a bottom sheet on phones (#29).
 */
export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = 'signup-modal-heading';
  const descId = 'signup-modal-desc';

  const {
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
  } = useAuthForm('register', { trackSignupFunnel: true });

  // Lock background scroll, trap focus, and wire Esc while the modal is open (#29).
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();

    const panel = panelRef.current;
    // Sensible initial focus: the dialog itself, so a screen reader announces the
    // dialog rather than dropping the user straight into a text field.
    panel?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockScroll();
    };
  }, [isOpen, onClose]);

  const inputClass =
    'w-full bg-[#1a110c]/70 border border-[#3e271a] focus:border-[#dda67a]/70 rounded-xl px-4 py-3 text-base text-slate-100 placeholder:text-[#ecd0b9]/30 outline-none transition focus:ring-2 focus:ring-[#dda67a]/20 min-h-[48px]';
  const fieldErrorClass = 'mt-1.5 pl-1 text-xs text-red-300/90';

  // Motion: bottom-sheet slide on phones, dialog pop on desktop. Under reduced
  // motion both collapse to a plain fade (honouring the OS setting).
  const panelVariants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : isMobile
      ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
      : { initial: { opacity: 0, scale: 0.96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.98, y: 8 } };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-end justify-center sm:items-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop — click to dismiss */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={descId}
            tabIndex={-1}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={reduce ? { duration: 0.15 } : { type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-[430px] bg-[#140d0a]/95 backdrop-blur-2xl border border-[#3e271a] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl outline-none max-h-[92vh] overflow-y-auto pb-safe"
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#3e271a] bg-[#2d1b11]/50 text-[#ecd0b9]/70 transition hover:bg-[#2d1b11] hover:text-white cursor-pointer min-h-[44px] min-w-[44px]"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Grab handle (mobile sheet affordance) */}
            <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#3e271a] sm:hidden" />

            {confirmEmailSent ? (
              /* Persistent check-inbox state — the modal never closes silently on a
                 confirmation-required sign-up (#28). */
              <div className="flex flex-col items-center text-center py-4">
                <div className="h-14 w-14 rounded-2xl bg-[#201410] border border-[#3d2416]/55 flex items-center justify-center mb-5">
                  <MailCheck className="h-7 w-7 text-[#dda67a]" />
                </div>
                <h2 id={headingId} className="text-xl font-bold tracking-tight text-white">
                  Check your inbox
                </h2>
                <p id={descId} className="mt-3 text-sm leading-relaxed text-[#ecd0b9]/75 max-w-[320px]">
                  We sent a confirmation link to <strong className="text-white">{email}</strong>. Click
                  it to activate your account, then sign in.
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-flex items-center justify-center bg-[#dda67a] hover:bg-[#e8b88c] active:bg-[#c9925f] text-[#201410] text-sm font-bold py-3 px-6 rounded-xl transition cursor-pointer min-h-[48px]"
                >
                  Go to sign in
                </Link>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-2xl bg-[#201410] border border-[#3d2416]/55 flex items-center justify-center p-2 shadow-xl shadow-[#4a2b16]/60 mb-4">
                    <BrandLogo size={30} showBackground={false} className="brightness-125 select-none pointer-events-none" />
                  </div>
                  <h2 id={headingId} className="text-xl font-bold tracking-tight text-white">
                    Start tracking free
                  </h2>
                  <p id={descId} className="mt-2 text-xs text-[#ecd0b9]/70 max-w-[280px] leading-relaxed">
                    Create your Tyme workspace — free for freelancers and virtual assistants.
                  </p>
                </div>

                <div className="space-y-4">
                  <GoogleAuthButton
                    onClick={handleGoogle}
                    loading={isGoogleLoading}
                    disabled={isLoading}
                    label="Continue with Google"
                  />

                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-[#3e271a]/60" />
                    <span className="text-[10px] uppercase tracking-widest font-mono text-[#ecd0b9]/40">
                      or with email
                    </span>
                    <div className="h-px flex-1 bg-[#3e271a]/60" />
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-3" noValidate>
                    <div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full name"
                        autoComplete="name"
                        aria-label="Full name"
                        aria-invalid={!!fieldErrors.fullName}
                        className={inputClass}
                      />
                      {fieldErrors.fullName && <p className={fieldErrorClass}>{fieldErrors.fullName}</p>}
                    </div>

                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        autoComplete="email"
                        aria-label="Email address"
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
                        placeholder="Password (8+ characters)"
                        autoComplete="new-password"
                        aria-label="Password"
                        aria-invalid={!!fieldErrors.password}
                        className={inputClass}
                      />
                      {fieldErrors.password && <p className={fieldErrorClass}>{fieldErrors.password}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || isGoogleLoading}
                      className="w-full bg-[#a66e46] hover:bg-[#8e5a34] active:bg-[#7c4d2b] text-white text-sm font-bold py-3.5 px-5 rounded-xl transition shadow-lg shadow-[#4a2b16]/40 cursor-pointer flex items-center justify-center gap-2.5 select-none duration-150 disabled:opacity-60 disabled:cursor-wait min-h-[48px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs uppercase tracking-widest font-mono">Creating account…</span>
                        </>
                      ) : (
                        <span>Create account</span>
                      )}
                    </button>
                  </form>

                  <AuthBanner show={!!error} tone="error">
                    {error}
                  </AuthBanner>
                </div>

                <div className="mt-6 pt-5 border-t border-[#3e271a]/30 text-center">
                  <p className="text-xs text-[#ecd0b9]/60">
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className="text-[#dda67a] hover:text-[#f3be94] font-semibold transition cursor-pointer hover:underline"
                    >
                      Log in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
