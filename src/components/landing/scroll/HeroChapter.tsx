'use client';

import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import SignInButton from '../SignInButton';

interface HeroChapterProps {
  eyebrow?: string;
  title: string;
  body: string;
  /** Render + reveal the primary CTA at the end of the entrance. */
  cta?: boolean;
  /** Start the entrance once the intro splash has finished. */
  play: boolean;
}

/**
 * The hero's text, revealed with GSAP: the eyebrow and body fade up while the
 * headline rises word-by-word out of a clipping mask (editorial line-reveal),
 * then the CTA fades in. Under reduced motion everything is shown statically.
 */
export default function HeroChapter({ eyebrow, title, body, cta, play }: HeroChapterProps) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<HTMLSpanElement[]>([]);
  wordRefs.current = [];

  const words = title.split(' ');

  useLayoutEffect(() => {
    if (!play || reduce) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (eyebrowRef.current) {
        tl.from(eyebrowRef.current, { y: 18, opacity: 0, duration: 0.6 });
      }
      tl.from(
        wordRefs.current,
        { yPercent: 120, duration: 0.95, stagger: 0.08, ease: 'power4.out' },
        eyebrowRef.current ? '-=0.25' : 0
      );
      if (bodyRef.current) {
        tl.from(bodyRef.current, { y: 22, opacity: 0, duration: 0.7 }, '-=0.55');
      }
      if (ctaRef.current) {
        tl.from(ctaRef.current, { y: 18, opacity: 0, duration: 0.6 }, '-=0.4');
      }
    }, rootRef);
    return () => ctx.revert();
  }, [play, reduce]);

  return (
    <div ref={rootRef}>
      {eyebrow && (
        <span
          ref={eyebrowRef}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#5e3820]/40 bg-[#2d1b11]/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#dda67a] backdrop-blur-sm"
        >
          {eyebrow}
        </span>
      )}
      <h1 className="mx-auto max-w-2xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="mr-[0.22em] inline-block overflow-hidden pb-[0.12em] align-bottom">
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
      </h1>
      <p
        ref={bodyRef}
        className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-[#ecd0b9]/80 [text-shadow:0_1px_24px_rgba(12,8,6,0.85)]"
      >
        {body}
      </p>
      {cta && (
        <div ref={ctaRef} className="pointer-events-auto mt-9 flex justify-center">
          <SignInButton variant="hero" />
        </div>
      )}
    </div>
  );
}
