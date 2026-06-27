'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarClock, Tags, FileBarChart2, FileDown, Target, ShieldCheck } from 'lucide-react';
import { productFeatures } from '@/lib/seo';

gsap.registerPlugin(ScrollTrigger);

// Map the icon name stored in seo.ts to the actual lucide component.
const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CalendarClock,
  Tags,
  FileBarChart2,
  FileDown,
  Target,
  ShieldCheck,
};

/**
 * "Everything you need to bill with confidence" — built like wero's *What this
 * means for merchants* beat: on desktop the heading column pins in place while the
 * feature cards are dealt onto the same spot one at a time, each rotating up into
 * view as the previous one tilts away, all scrubbed to the scroll position. A live
 * counter on the left tracks which card is showing.
 *
 * Every card stays in the DOM the whole time (SEO + the cards simply lay out as a
 * normal responsive grid under reduced motion, below the lg breakpoint, or with no
 * JS), so nothing here is hidden from crawlers.
 */
export default function FeatureShowcase() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const lastIdx = useRef(0);
  const [active, setActive] = useState(0);
  const n = productFeatures.length;

  useLayoutEffect(() => {
    if (reduce) return;
    const mm = gsap.matchMedia();

    // Desktop only: the pinned card-deal. Below lg the cards are a plain grid.
    mm.add('(min-width: 1024px)', () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (cards.length === 0) return;

      // Stack every card on the same spot; only the first is showing to start.
      gsap.set(cards, { position: 'absolute', inset: 0 });
      gsap.set(cards[0], { yPercent: 0, rotation: 0, scale: 1, opacity: 1 });
      gsap.set(cards.slice(1), { yPercent: 65, rotation: 7, scale: 0.94, opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: `+=${n * 80}%`,
          pin: pinRef.current,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(n - 1, Math.round(self.progress * (n - 1)));
            if (idx !== lastIdx.current) {
              lastIdx.current = idx;
              setActive(idx);
            }
          },
        },
      });

      // For each step, tilt the current card away while the next is dealt in.
      for (let i = 1; i < n; i += 1) {
        tl.to(cards[i - 1], { yPercent: -65, rotation: -7, scale: 0.94, opacity: 0, duration: 1 }, i - 1);
        tl.to(cards[i], { yPercent: 0, rotation: 0, scale: 1, opacity: 1, duration: 1 }, i - 1);
      }
    });

    return () => mm.revert();
  }, [n, reduce]);

  return (
    <section ref={sectionRef} id="features" className="relative scroll-mt-20">
      <div
        ref={pinRef}
        className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-5 py-20 sm:px-8 lg:flex-row lg:items-center lg:gap-16"
      >
        {/* ── Left: the pinned heading + live counter ── */}
        <div className="lg:w-[42%]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#5e3820]/40 bg-[#2d1b11]/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#dda67a]">
            What you get
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything you need to bill with confidence
          </h2>
          <p className="mt-4 max-w-md text-lg text-[#ecd0b9]/70">
            Purpose-built for the way freelancers and virtual assistants actually work.
          </p>

          {/* Live "01 / 06 — title" indicator, desktop only (tracks the card-deal) */}
          <div className="mt-8 hidden lg:block">
            <div className="flex items-center gap-3 font-mono text-sm text-[#dda67a]">
              <span>{String(active + 1).padStart(2, '0')}</span>
              <span className="h-px w-12 bg-[#5e3820]/60">
                <span
                  className="block h-px bg-[#dda67a] transition-[width] duration-300 ease-out"
                  style={{ width: `${((active + 1) / n) * 100}%` }}
                />
              </span>
              <span className="text-[#ecd0b9]/40">{String(n).padStart(2, '0')}</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-white">{productFeatures[active].title}</p>
          </div>
        </div>

        {/* ── Right: the cards. Grid below lg; dealt one-by-one (absolute) on lg. ── */}
        <div ref={stageRef} className="relative grid gap-4 sm:grid-cols-2 lg:block lg:h-[380px] lg:w-[58%]">
          {productFeatures.map((feature, index) => {
            const Icon = featureIcons[feature.icon] ?? CalendarClock;
            return (
              <article
                key={feature.title}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="group flex h-full flex-col rounded-2xl border border-[#3e271a] bg-[#140d0a]/80 p-6 backdrop-blur-sm transition-colors duration-150 ease-out hover:border-[#5e3820] sm:p-7 lg:justify-center lg:p-10 lg:shadow-2xl lg:shadow-[#4a2b16]/30 lg:will-change-transform"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#5e3820]/40 bg-[#2d1b11]/60 text-[#dda67a]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white lg:text-2xl">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#ecd0b9]/65 lg:mt-3 lg:max-w-md lg:text-base">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
