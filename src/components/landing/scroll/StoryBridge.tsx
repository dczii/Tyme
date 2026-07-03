'use client';

import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// The narrative beat, split per word so the reveal can be scrubbed word-by-word.
// `accent` marks the emotional pivot of the sentence (the question every invoice
// asks), rendered in the page accent so the story lands even at a skim.
type Word = { text: string; accent?: boolean };

const w = (text: string, accent?: boolean): Word[] =>
  text.split(' ').map((t) => ({ text: t, accent }));

const SENTENCE: Word[] = [
  ...w('You did the work. Three clients, a dozen tasks, one long week.'),
  ...w('Now the invoice asks:'),
  ...w('where did the hours go?', true),
  ...w('Tyme keeps the answer, hour by hour, on a calendar you can bill from.'),
];

/**
 * The narrative bridge between the hero (the promise) and the features (the
 * proof). The section pins for a bit over one viewport of scroll while the
 * sentence illuminates word-by-word, tied 1:1 to the scrollbar — the reader's
 * own scrolling sets the reading pace, which is what makes it storytelling
 * rather than an autoplaying banner. Works identically on mobile because the
 * scrub listens to native touch scroll.
 *
 * The full sentence is plain SSR markup at full opacity; the dimmed start state
 * is only applied when the scrub actually takes over. Under reduced motion or
 * with no JS the section is simply a static, readable pull-quote.
 */
export default function StoryBridge() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>('[data-sb-word]');
      if (words.length === 0) return;

      gsap.set(words, { opacity: 0.13 });
      gsap.to(words, {
        opacity: 1,
        duration: 1,
        stagger: 0.18,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.4,
          anticipatePin: 1,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={sectionRef} className='relative flex min-h-[100dvh] items-center'>
      <div className='mx-auto w-full max-w-4xl px-5 sm:px-8'>
        <p className='text-balance text-3xl font-bold leading-snug tracking-tight text-white sm:text-5xl sm:leading-snug lg:text-6xl lg:leading-snug'>
          {SENTENCE.map((word, i) => (
            <span
              key={i}
              data-sb-word
              className={word.accent ? 'text-[#dda67a]' : undefined}
            >
              {word.text}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
