'use client';

import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SignInButton from '../SignInButton';

gsap.registerPlugin(ScrollTrigger);

interface StatementBlockProps {
  title: string;
  body: string;
  cta?: boolean;
}

/**
 * A centered "statement" — a big headline whose words rise out of a clipping
 * mask, with the body fading up, revealed by GSAP ScrollTrigger as the block
 * scrolls into view. A soft, slowly-pulsing warm glow sits behind it so the
 * section reads as ambient rather than empty/black. Static under reduced motion.
 */
export default function StatementBlock({ title, body, cta }: StatementBlockProps) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<HTMLSpanElement[]>([]);
  wordRefs.current = [];

  const words = title.split(' ');

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      // Scrubbed to scroll position: the reveal progresses as you scroll the
      // block through the start→end range (and reverses on scroll-up), rather
      // than firing once on enter.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 82%',
          end: 'top 38%',
          scrub: 0.6,
        },
      });
      tl.from(wordRefs.current, { yPercent: 120, duration: 0.9, stagger: 0.07 });
      if (bodyRef.current) tl.from(bodyRef.current, { y: 24, opacity: 0, duration: 0.7 }, '-=0.5');
      if (ctaRef.current) tl.from(ctaRef.current, { y: 18, opacity: 0, duration: 0.6 }, '-=0.4');
    }, rootRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[64vh] items-center justify-center px-6 py-20 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9a6a42]/12 blur-[150px] motion-safe:animate-pulse [animation-duration:9s]"
      />
      <div className="relative mx-auto max-w-3xl">
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
          {words.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="mr-[0.22em] inline-block overflow-hidden pb-[0.12em] align-bottom"
            >
              <span
                ref={(el) => {
                  if (el) wordRefs.current[i] = el;
                }}
                className="inline-block [text-shadow:0_2px_40px_rgba(12,8,6,0.85)] will-change-transform"
              >
                {i < words.length - 1 ? `${word} ` : word}
              </span>
            </span>
          ))}
        </h2>
        <p
          ref={bodyRef}
          className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-[#ecd0b9]/75 [text-shadow:0_1px_24px_rgba(12,8,6,0.85)]"
        >
          {body}
        </p>
        {cta && (
          <div ref={ctaRef} className="mt-9 flex justify-center">
            <SignInButton variant="hero" />
          </div>
        )}
      </div>
    </section>
  );
}
