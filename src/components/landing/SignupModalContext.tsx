'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { trackSignupModalOpen } from '@/lib/analytics';

// The signup modal is interaction-gated and carries no SEO weight, so it's split
// out of the initial `/` bundle with `ssr: false` and only mounted once the visitor
// first opens it (#33). This keeps its framer-motion animation, the auth form, and
// the Google button out of first-load JS until they're actually needed.
const SignupModal = dynamic(() => import('./SignupModal'), { ssr: false });

// One shared signup-modal instance for the whole landing page. Every primary CTA
// opens this same modal (Tesla's "one order flow, repeated on every panel"), so the
// state lives in a context here rather than being duplicated per button (#27).

interface SignupModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const SignupModalContext = createContext<SignupModalContextValue | null>(null);

export function useSignupModal() {
  const ctx = useContext(SignupModalContext);
  if (!ctx) throw new Error('useSignupModal must be used within <SignupModalProvider>');
  return ctx;
}

export function SignupModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  // Once true the lazy modal chunk is mounted for good; it stays mounted after a
  // close so AnimatePresence can still play its exit transition.
  const [hasOpened, setHasOpened] = useState(false);
  // The element that opened the modal, so focus can return to it on close (#29).
  const triggerRef = useRef<HTMLElement | null>(null);

  const openModal = useCallback(() => {
    if (typeof document !== 'undefined') {
      triggerRef.current = document.activeElement as HTMLElement | null;
    }
    setHasOpened(true);
    setIsOpen(true);
    trackSignupModalOpen();
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Restore focus to the CTA that opened us on the next frame (after unmount).
    const trigger = triggerRef.current;
    if (trigger && typeof trigger.focus === 'function') {
      requestAnimationFrame(() => trigger.focus());
    }
    triggerRef.current = null;
  }, []);

  // Deep link: /?signup=1 opens the modal on load so ads and shares can land people
  // straight into registration (#26). Strip the param so a refresh/close is clean.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === '1') {
      setHasOpened(true);
      setIsOpen(true);
      trackSignupModalOpen();
      params.delete('signup');
      const query = params.toString();
      const url = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
      window.history.replaceState(null, '', url);
    }
  }, []);

  return (
    <SignupModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {/* Background is inert while the modal is open: not focusable, not read by
          assistive tech, so the dialog is the only interactive surface (#29). */}
      <div inert={isOpen}>{children}</div>
      {hasOpened && <SignupModal isOpen={isOpen} onClose={closeModal} />}
    </SignupModalContext.Provider>
  );
}
