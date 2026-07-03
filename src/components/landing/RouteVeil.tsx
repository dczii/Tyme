'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DUR, EASE_IN_OUT } from '@/lib/motion';

interface VeilContextValue {
  navigateWithVeil: (href: string) => void;
}

const VeilContext = createContext<VeilContextValue | null>(null);

/**
 * Cross-route hand-off: a brand-dark veil fades over the page (~250ms), THEN
 * navigation happens, and the destination plays its own entrance. Without it,
 * a route change is a hard cut that discards all the continuity the scroll
 * choreography built up; with it, leaving feels like part of the same scene.
 * Deliberately fast: a transition may bridge a cut, never make the user wait.
 *
 * Under reduced motion the veil is skipped and navigation is instant.
 */
export function RouteVeilProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [target, setTarget] = useState<string | null>(null);

  const navigateWithVeil = useCallback(
    (href: string) => {
      if (reduce) {
        router.push(href);
        return;
      }
      router.prefetch(href);
      setTarget(href);
    },
    [reduce, router],
  );

  return (
    <VeilContext.Provider value={{ navigateWithVeil }}>
      {children}
      <AnimatePresence>
        {target && (
          <motion.div
            aria-hidden='true'
            className='fixed inset-0 z-[9990] bg-[#0c0806]'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR.ui, ease: EASE_IN_OUT }}
            onAnimationComplete={() => router.push(target)}
          />
        )}
      </AnimatePresence>
    </VeilContext.Provider>
  );
}

/**
 * Returns a navigate function that uses the veil when a provider is mounted
 * and falls back to a plain router.push everywhere else, so shared components
 * (like AppNavButton) work on any route.
 */
export function useVeilNavigate() {
  const ctx = useContext(VeilContext);
  const router = useRouter();
  return useCallback(
    (href: string) => {
      if (ctx) ctx.navigateWithVeil(href);
      else router.push(href);
    },
    [ctx, router],
  );
}
