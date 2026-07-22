'use client';

// Proof band — Tesla panels sell with numbers, not adjectives. Every tile is a
// verifiable product fact (no invented user counts or ratings). The final values
// are the SSR truth (rendered directly as text), so the band is fully readable with
// no JS and under reduced motion. On top of that, when motion is allowed: each tile
// rises/fades in with a short stagger (Reveal), and the leading numeral counts up
// once as the band scrolls into view.

import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import Reveal from './Reveal';

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: '1-click', label: 'Google sign-in' },
  { value: '2', label: 'Export formats · PDF + CSV' },
  { value: '$0', label: 'Free forever' },
  { value: '7-day', label: 'Week view' },
];

/**
 * A single stat numeral. Renders its final string directly (so it's the SSR / no-JS /
 * reduced-motion truth), and — only when motion is allowed — counts the leading
 * integer up from zero once, the first time it scrolls into view. The reduced-motion
 * guard returns BEFORE any write to the numeral, so the displayed value is never
 * altered for those users.
 */
function StatNumber({ value }: { value: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;

    // Split a value like "7-day" into prefix "", number "7", suffix "-day".
    const match = value.match(/^(\D*)(\d[\d,]*)(.*)$/);
    if (!match) return;
    const [, prefix, digits, suffix] = match;
    const target = parseInt(digits.replace(/,/g, ''), 10);
    if (!target) return; // nothing to animate (e.g. "$0")

    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        observer.disconnect();
        const counter = { n: 0 };
        gsap.to(counter, {
          n: target,
          duration: 0.8,
          ease: 'power1.out',
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(counter.n)}${suffix}`;
          },
        });
      },
      { rootMargin: '-12% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduce, value]);

  return <span ref={ref}>{value}</span>;
}

export default function StatsBand() {
  return (
    <div className='mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4'>
      {STATS.map((stat, index) => (
        <Reveal key={stat.label} delay={index * 0.06}>
          <div className='rounded-2xl border border-[#3e271a]/55 bg-[#130d0a]/35 p-6 text-center backdrop-blur-xl sm:p-7'>
            <p className='font-mono text-3xl font-bold tracking-tight text-[#dda67a] sm:text-4xl'>
              <StatNumber value={stat.value} />
            </p>
            <p className='mt-2 font-mono text-xs uppercase tracking-wider text-[#ecd0b9]/70'>
              {stat.label}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
