'use client';

import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The two espresso glow blobs behind the whole landing page, given depth:
 * they drift vertically at different rates as the page scrolls (scrubbed
 * yPercent, one with the scroll, one against it). Because they move slower
 * than the content, they read as a far background layer — parallax used to
 * build depth for everything in front of it, not as an effect of its own.
 * The slow opacity "breathing" stays on the compositor via CSS animate-pulse.
 *
 * Purely decorative (aria-hidden, pointer-events-none); static under reduced
 * motion or no JS.
 */
export default function AmbientBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      const scrub = (target: string, yPercent: number) =>
        gsap.to(target, {
          yPercent,
          ease: 'none',
          scrollTrigger: {
            start: 0,
            end: () => ScrollTrigger.maxScroll(window),
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        });
      scrub('[data-blob-a]', 26); // drifts down with the scroll (nearer)
      scrub('[data-blob-b]', -18); // drifts up against it (farther)
    }, rootRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={rootRef} aria-hidden='true' className='pointer-events-none absolute inset-0'>
      <div
        data-blob-a
        className='absolute -left-40 -top-48 h-[520px] w-[520px] rounded-full bg-[#4a2b16]/30 blur-[130px] will-change-transform motion-safe:animate-pulse motion-safe:[animation-duration:7s]'
      />
      <div
        data-blob-b
        className='absolute -right-48 top-[40%] h-[520px] w-[520px] rounded-full bg-[#9a6a42]/15 blur-[130px] will-change-transform motion-safe:animate-pulse motion-safe:[animation-duration:9s]'
      />
    </div>
  );
}
