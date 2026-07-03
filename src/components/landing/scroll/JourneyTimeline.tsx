'use client';

import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LogIn, MousePointerClick, FileDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    icon: LogIn,
    title: 'Sign in with Google',
    description: 'One click, no passwords. Your workspace syncs instantly across devices.',
  },
  {
    icon: MousePointerClick,
    title: 'Log time on the calendar',
    description: 'Drop entries onto the weekly grid and tag them by client and project.',
  },
  {
    icon: FileDown,
    title: 'Export a branded report',
    description: 'Filter your hours, then export a polished PDF or CSV at invoice time.',
  },
];

/**
 * "How it works" as a journey, not a grid: a vertical rail fills top-to-bottom
 * as you scroll (scaleY scrub, transform-only), each numbered node lights up as
 * the line reaches it, and its step card slides in from the rail. The metaphor
 * matches the content — three steps in strict order — so the motion IS the
 * information: you literally watch the path from sign-in to invoice get drawn.
 *
 * Mobile-first: the rail sits on the left with cards stacked beside it, and the
 * scrub rides native touch scroll (no pinning). On sm+ the rail moves to the
 * center and cards alternate sides. Desktop pointers additionally get a
 * spotlight that follows the cursor inside each card. Under reduced motion or
 * no JS everything renders in its final, fully-lit state.
 */
export default function JourneyTimeline() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduce) return;
    const root = sectionRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      // Heading rises once as the section arrives.
      const head = root.querySelector('[data-jt-head]');
      if (head) {
        gsap.from(head.children, {
          y: 26,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: head, start: 'top 82%', once: true },
        });
      }

      // The rail draws itself, tied 1:1 to how far the reader has travelled.
      if (railFillRef.current) {
        gsap.fromTo(
          railFillRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: root.querySelector('[data-jt-rail]'),
              start: 'top 72%',
              end: 'bottom 55%',
              scrub: true,
            },
          },
        );
      }

      // Each step: node ignites and card slides in from the rail as the fill
      // line reaches it (scrubbed, so scrolling back "undraws" the journey).
      const steps = gsap.utils.toArray<HTMLElement>('[data-jt-step]');
      steps.forEach((step, i) => {
        const card = step.querySelector('[data-jt-card]');
        const nodeFill = step.querySelector('[data-jt-node-fill]');
        const fromLeft = i % 2 === 0;

        if (card) {
          gsap.from(card, {
            opacity: 0,
            y: 36,
            x: () =>
              window.matchMedia('(min-width: 640px)').matches ? (fromLeft ? -32 : 32) : 0,
            ease: 'none',
            scrollTrigger: { trigger: step, start: 'top 88%', end: 'top 62%', scrub: true },
          });
        }
        if (nodeFill) {
          gsap.from(nodeFill, {
            opacity: 0,
            scale: 0.4,
            ease: 'none',
            scrollTrigger: { trigger: step, start: 'top 80%', end: 'top 62%', scrub: true },
          });
        }
      });
    }, sectionRef);

    // Spotlight: a soft accent glow inside each card follows the cursor. CSS
    // vars are set straight on the element (no React re-render per frame).
    // Hover-pointer devices only; the overlay simply never shows elsewhere.
    const cleanups: Array<() => void> = [];
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      sectionRef.current
        ?.querySelectorAll<HTMLElement>('[data-jt-card]')
        .forEach((card) => {
          const onMove = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
          };
          card.addEventListener('pointermove', onMove);
          cleanups.push(() => card.removeEventListener('pointermove', onMove));
        });
    }

    return () => {
      ctx.revert();
      cleanups.forEach((fn) => fn());
    };
  }, [reduce]);

  return (
    <section
      ref={sectionRef}
      id='how-it-works'
      className='mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-28'
    >
      <div data-jt-head className='mx-auto max-w-2xl text-center'>
        <h2 className='text-3xl font-bold tracking-tight text-white sm:text-4xl'>
          From sign-in to invoice in three steps
        </h2>
      </div>

      <div data-jt-rail className='relative mt-12 sm:mt-20'>
        {/* The rail: static track + scroll-driven fill (origin-top scaleY). */}
        <div
          aria-hidden='true'
          className='absolute bottom-2 left-[21px] top-2 w-px bg-[#3e271a]/70 sm:left-1/2 sm:-translate-x-1/2'
        >
          <div
            ref={railFillRef}
            className='absolute inset-0 origin-top bg-gradient-to-b from-[#dda67a] via-[#c08654] to-[#9a6a42] will-change-transform'
          />
        </div>

        <ol className='space-y-12 sm:space-y-24'>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const left = index % 2 === 0;
            return (
              <li
                key={step.title}
                data-jt-step
                className={`relative flex ${left ? 'sm:justify-start' : 'sm:justify-end'}`}
              >
                {/* Node on the rail: number in a ring, ignited by the scrub. */}
                <span
                  aria-hidden='true'
                  className='absolute left-[21px] top-7 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-[#5e3820]/60 bg-[#140d0a] sm:left-1/2'
                >
                  <span
                    data-jt-node-fill
                    className='absolute inset-1 rounded-full bg-[#2d1b11] will-change-transform'
                  />
                  <span className='relative font-mono text-sm font-bold text-[#dda67a]'>
                    {index + 1}
                  </span>
                </span>

                <div
                  data-jt-card
                  className='group relative ml-12 w-full overflow-hidden rounded-2xl border border-[#3e271a] bg-[#140d0a]/60 p-6 transition-colors duration-200 ease-out will-change-transform hover:border-[#5e3820] sm:ml-0 sm:w-[calc(50%-3.5rem)] sm:p-7'
                >
                  {/* Cursor spotlight (desktop pointers only, see effect above). */}
                  <span
                    aria-hidden='true'
                    className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100'
                    style={{
                      background:
                        'radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(221, 166, 122, 0.13), transparent 70%)',
                    }}
                  />
                  <div className='relative'>
                    <span className='flex h-11 w-11 items-center justify-center rounded-xl border border-[#5e3820]/40 bg-[#2d1b11]/60 text-[#dda67a]'>
                      <Icon className='h-5 w-5' />
                    </span>
                    <h3 className='mt-5 text-lg font-semibold text-white'>{step.title}</h3>
                    <p className='mt-2 text-sm leading-relaxed text-[#ecd0b9]/65'>
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
