'use client';

import { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { setLenis } from './lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Wraps the landing page in Lenis inertia smooth-scroll and bridges it to GSAP
 * ScrollTrigger so scroll-driven scenes stay perfectly in sync with the eased
 * scroll position. Disabled entirely under prefers-reduced-motion — that setting
 * exists precisely to stop this kind of motion, so we fall back to native scroll.
 */
export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;

    // Defer starting the Lenis + GSAP ticker loop until the browser is idle, so its
    // continuous main-thread work stays off the hero's critical path and doesn't tax
    // LCP/TBT on mobile data (#33). Native scroll is fully functional in the meantime;
    // Lenis only layers inertia on top. The `timeout` caps the wait so smoothing still
    // engages promptly on a busy main thread.
    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    const start = () => {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      // Expose the instance so in-page CTA anchors can drive a smooth scroll.
      setLenis(lenis);

      // Keep ScrollTrigger's notion of scroll position synced to Lenis.
      lenis.on('scroll', ScrollTrigger.update);

      tick = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    };

    const supportsIdle = typeof window.requestIdleCallback === 'function';
    const idleId = supportsIdle
      ? window.requestIdleCallback(start, { timeout: 500 })
      : window.setTimeout(start, 1);

    return () => {
      if (supportsIdle && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId as number);
      } else {
        window.clearTimeout(idleId as number);
      }
      if (tick) gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      setLenis(null);
      lenis?.destroy();
    };
  }, [reduce]);

  return <>{children}</>;
}
