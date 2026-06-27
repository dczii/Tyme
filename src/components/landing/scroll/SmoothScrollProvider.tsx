'use client';

import { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

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

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });

    // Keep ScrollTrigger's notion of scroll position synced to Lenis.
    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [reduce]);

  return <>{children}</>;
}
