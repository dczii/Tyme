'use client';

import { useIntro } from '../IntroContext';
import HeroChapter from './HeroChapter';

// Opening hero copy.
const HERO = {
  eyebrow: 'Tyme · Time tracking for freelancers',
  title: 'Your hours, accounted for.',
  body: 'Every billable minute, captured on a visual weekly calendar you can actually trust.',
};

/**
 * The landing hero. No WebGL — the backdrop is the slow, warm "pulsing" espresso
 * glow (the original ambient treatment). The hero text reveals with GSAP once the
 * intro splash finishes. The product (calendar) showcase and the scrolling
 * statement sequence are rendered as their own sections after this in page.tsx.
 */
export default function ScrollExperience() {
  const { introDone } = useIntro();

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 text-center">
      {/* Pulsing warm glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9a6a42]/18 blur-[150px] motion-safe:animate-pulse [animation-duration:7s]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-1/4 h-[280px] w-[280px] rounded-full bg-[#4a2b16]/30 blur-[120px] motion-safe:animate-pulse [animation-duration:9s]"
      />

      <div className="relative mx-auto max-w-2xl">
        <HeroChapter eyebrow={HERO.eyebrow} title={HERO.title} body={HERO.body} cta play={introDone} />
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[#ecd0b9]/40 motion-safe:animate-bounce [animation-duration:2.4s]"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-[#dda67a]/60 to-transparent" />
      </div>
    </section>
  );
}
