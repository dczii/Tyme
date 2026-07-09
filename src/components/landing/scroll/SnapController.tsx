'use client';

import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Tesla snaps each scroll gesture to the next full-viewport panel. CSS scroll-snap
 * fights Lenis's smooth wheel, so this implements the settle with ScrollTrigger's
 * `snap` instead — and only where it feels assistive:
 *
 *   • desktop, fine-pointer, motion-OK users only (gsap.matchMedia gate) — touch and
 *     reduced-motion users keep native scrolling,
 *   • snaps to the top of the non-pinned conversion panels (marked `data-snap-panel`),
 *   • never fights an active pin: while the scroll position sits inside a pinned
 *     scene (Features / FAQ) the natural value is returned unchanged, so the settle
 *     hands off cleanly at each pin's start/end,
 *   • directional and short (≤0.8s) — a settle, not a hijack; the reader can always
 *     scroll straight through without being trapped.
 *
 * Renders nothing; it only owns the snap ScrollTrigger for the landing page.
 */
export default function SnapController() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference) and (pointer: fine)',
      () => {
        // Don't settle until the reader actually scrolls. ScrollTrigger's snap can fire
        // on the load-time refresh (once pin-spacing lands), which would yank the page a
        // few px off the true top the instant the intro clears — a visible lurch. We flip
        // this on the first real scroll intent (wheel/touch/keys — never a programmatic
        // scroll, so the snap tween can't re-arm itself).
        let userScrolled = false;
        const flagScroll = () => {
          userScrolled = true;
        };
        const scrollIntentEvents = ['wheel', 'touchmove', 'keydown'] as const;
        scrollIntentEvents.forEach((e) =>
          window.addEventListener(e, flagScroll, { passive: true }),
        );

        // Live px scroll offset of each snappable panel's top (recomputed on demand so
        // pin-spacing added by the pinned scenes is always reflected).
        const panelOffsets = () =>
          gsap.utils
            .toArray<HTMLElement>('[data-snap-panel]')
            .map((el) => el.getBoundingClientRect().top + window.scrollY)
            .sort((a, b) => a - b);

        // [start, end] px ranges of every pinned scene, read live from the other
        // ScrollTriggers so we never have to hard-code Features/FAQ pin lengths.
        const pinnedRanges = () =>
          ScrollTrigger.getAll()
            .filter((t) => t.pin)
            .map((t) => [t.start, t.end] as const);

        const st = ScrollTrigger.create({
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          invalidateOnRefresh: true,
          snap: {
            // `value` is the trigger's natural landing progress (0–1); since the
            // trigger spans the whole page it maps linearly to scroll pixels.
            snapTo: (value) => {
              // Before the first user scroll, never settle — hold the true load position.
              if (!userScrolled) return value;

              const max = ScrollTrigger.maxScroll(window);
              if (!max) return value;
              const curPx = value * max;

              // Inside a pinned scene → let the pin own the scroll (no snap).
              for (const [s, e] of pinnedRanges()) {
                if (curPx >= s - 4 && curPx <= e + 4) return value;
              }

              const offsets = panelOffsets();
              if (offsets.length === 0) return value;

              const dir = st?.direction ?? 0;
              let best = curPx;
              let bestDist = Infinity;

              // Directional pass: only consider panels in the travel direction so a
              // settle never yanks the reader the opposite way.
              for (const o of offsets) {
                if (dir === 1 && o < curPx - 4) continue; // going down: skip panels behind
                if (dir === -1 && o > curPx + 4) continue; // going up: skip panels ahead
                const d = Math.abs(o - curPx);
                if (d < bestDist) {
                  bestDist = d;
                  best = o;
                }
              }

              // Fallback to the plain nearest panel (e.g. past the last panel, or a
              // pinned scene sits between the reader and the next panel).
              if (!Number.isFinite(bestDist)) {
                for (const o of offsets) {
                  const d = Math.abs(o - curPx);
                  if (d < bestDist) {
                    bestDist = d;
                    best = o;
                  }
                }
              }

              return best / max;
            },
            duration: { min: 0.2, max: 0.8 },
            ease: 'power2.inOut',
            delay: 0.08,
          },
        });

        return () => {
          st.kill();
          scrollIntentEvents.forEach((e) => window.removeEventListener(e, flagScroll));
        };
      },
    );

    return () => mm.revert();
  }, []);

  return null;
}
