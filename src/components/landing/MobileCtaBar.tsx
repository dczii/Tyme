'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTyme } from '@/app/providers';
import { PrimaryCta, SecondaryCta } from './CtaButton';

gsap.registerPlugin(ScrollTrigger);

/**
 * Docked mobile CTA bar (Tesla's "conversion is one thumb-tap away"). Fixed to the
 * bottom edge on <md viewports only, hidden for signed-in visitors. It overlays
 * content (position: fixed) so it never inserts into flow — zero layout shift, and
 * it only ever animates transform/opacity, so it never contributes to CLS.
 *
 * Scroll behaviour (Milestone 2): the bar gets out of the way while you read and
 * returns when you pause or reverse —
 *   • hidden while the hero or final-CTA panel is in view (both already show large
 *     CTAs, marked with `data-cta-hide-zone`),
 *   • slid away on a fast downward fling, brought back on any upward scroll,
 *   • under reduced motion it simply toggles visibility with no slide.
 *
 * z-40 sits above page content but below the intro splash (z-9999).
 */
export default function MobileCtaBar() {
  const { user, authLoading } = useTyme();
  const barRef = useRef<HTMLDivElement>(null);
  const signedIn = !authLoading && !!user;

  useLayoutEffect(() => {
    if (signedIn) return;
    const bar = barRef.current;
    if (!bar) return;

    const mm = gsap.matchMedia();
    mm.add(
      { isMobile: '(max-width: 767px)', motionOk: '(prefers-reduced-motion: no-preference)' },
      (ctx) => {
        const { isMobile, motionOk } = ctx.conditions as { isMobile: boolean; motionOk: boolean };
        if (!isMobile) return;

        let inZone = false; // hero / final-CTA panel on screen
        let scrolledAway = false; // hidden by a downward fling

        const apply = () => {
          const hide = inZone || scrolledAway;
          gsap.to(bar, {
            yPercent: hide ? 120 : 0,
            autoAlpha: hide ? 0 : 1,
            duration: motionOk ? 0.35 : 0, // reduced motion → instant toggle, no slide
            ease: 'power2.out',
            overwrite: true,
          });
        };

        // Hide while a "big CTA already visible" panel is on screen.
        // `zoneTriggers` is declared with `let` and seeded to `[]` first because
        // ScrollTrigger.create() fires onToggle synchronously for any zone that is
        // already on screen at load (the hero is). Referencing a `const` from that
        // callback would hit its temporal dead zone; the seeded array reads as empty
        // during creation and the true initial state is primed below (see `inZone =`).
        const zones = gsap.utils.toArray<HTMLElement>('[data-cta-hide-zone]');
        let zoneTriggers: ScrollTrigger[] = [];
        zoneTriggers = zones.map((zone) =>
          ScrollTrigger.create({
            trigger: zone,
            start: 'top 80%',
            end: 'bottom 20%',
            onToggle: () => {
              inZone = zoneTriggers.some((t) => t.isActive);
              apply();
            },
          }),
        );

        // Scroll-direction hide (motion only): a fast downward fling slides the bar
        // away; any upward scroll brings it back. Under reduced motion `scrolledAway`
        // never flips, so the bar reacts to the hide-zones alone.
        const dir = ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (self) => {
            if (!motionOk) return;
            const v = self.getVelocity();
            if (self.direction === 1 && v > 300) scrolledAway = true;
            else if (self.direction === -1) scrolledAway = false;
            else return;
            apply();
          },
        });

        // Prime the initial state (the hero is on screen at load → bar starts hidden).
        inZone = zoneTriggers.some((t) => t.isActive);
        apply();

        return () => {
          zoneTriggers.forEach((t) => t.kill());
          dir.kill();
          gsap.set(bar, { clearProps: 'all' });
        };
      },
    );

    return () => mm.revert();
  }, [signedIn]);

  // Signed-in visitors are being forwarded into the app — no signup prompt for them.
  if (signedIn) return null;

  return (
    <div ref={barRef} className='fixed inset-x-0 bottom-0 z-40 will-change-transform md:hidden'>
      <div className='border-t border-[#3e271a]/60 bg-[#0c0806]/90 backdrop-blur-xl'>
        {/* pb-safe (safe-area inset) lives on its own element so it never fights the
            base padding-bottom below it. */}
        <div className='pb-safe px-4 pt-3'>
          <div className='flex items-center gap-3 pb-3'>
            <PrimaryCta panel='mobile_bar' size='sm' className='flex-1'>
              Start tracking free
            </PrimaryCta>
            <SecondaryCta panel='mobile_bar' href='#how-it-works' size='sm' className='shrink-0 px-4'>
              How it works
            </SecondaryCta>
          </div>
        </div>
      </div>
    </div>
  );
}
