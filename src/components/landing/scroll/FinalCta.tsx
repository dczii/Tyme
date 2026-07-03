'use client';

import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SignInButton from '../SignInButton';
import MagneticButton from '../MagneticButton';

gsap.registerPlugin(ScrollTrigger);

/**
 * Closing conversion band. It scales up from slightly receded to full presence
 * as it enters (scrubbed, transform/opacity only) — an "arrival" that marks the
 * end of the story and hands focus to the one remaining action. The sign-in
 * button is magnetic on desktop pointers so the final CTA is also the most
 * physically responsive element on the page. Static under reduced motion/no JS.
 */
export default function FinalCta() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      if (!bandRef.current) return;
      gsap.from(bandRef.current, {
        opacity: 0.35,
        scale: 0.94,
        y: 44,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 92%',
          end: 'top 55%',
          scrub: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={sectionRef} className='mx-auto max-w-6xl px-5 pb-24 sm:px-8'>
      <div
        ref={bandRef}
        className='relative overflow-hidden rounded-3xl border border-[#3e271a] bg-[#140d0a]/80 px-6 py-14 text-center will-change-transform sm:px-12 sm:py-20'
      >
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#9a6a42]/15 blur-[120px]'
        />
        <h2 className='relative text-3xl font-bold tracking-tight text-white sm:text-4xl'>
          Start tracking your time today
        </h2>
        <p className='relative mx-auto mt-4 max-w-xl text-lg text-[#ecd0b9]/70'>
          Join freelancers and virtual assistants who bill accurately and never lose an hour.
        </p>
        <div className='relative mt-8 flex justify-center'>
          <MagneticButton>
            <SignInButton variant='hero' />
          </MagneticButton>
        </div>
        <p className='relative mt-5 font-mono text-xs text-[#ecd0b9]/40'>
          Free for freelancers and virtual assistants.
        </p>
      </div>
    </section>
  );
}
