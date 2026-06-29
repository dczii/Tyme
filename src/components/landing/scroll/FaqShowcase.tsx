'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Timer,
  Sparkles,
  Banknote,
  Users,
  FileDown,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { faqItems } from '@/lib/seo';

gsap.registerPlugin(ScrollTrigger);

// Per-question presentation for the carousel cards: a single-word category tag and a
// small lucide icon that fits the question, plus a tint used for the card's accent
// header band. Only the tag + icon + colour are decorative — the question and answer
// text always render verbatim so the visible copy stays mirrored 1:1 by the FAQPage
// JSON-LD in layout.tsx (FAQ rich results + AI answer engines / GEO).
type FaqMeta = { tag: string; color: string; Icon: React.ComponentType<{ className?: string }> };

// Single page accent (tan) across every card — the per-card identity comes from the
// tag + icon, not from a different hue (Color Consistency Lock).
const ACCENT = '#dda67a';
const FAQ_META: FaqMeta[] = [
  { tag: 'Basics', color: ACCENT, Icon: Timer },
  { tag: 'Picks', color: ACCENT, Icon: Sparkles },
  { tag: 'Billing', color: ACCENT, Icon: Banknote },
  { tag: 'Clients', color: ACCENT, Icon: Users },
  { tag: 'Reports', color: ACCENT, Icon: FileDown },
  { tag: 'Security', color: ACCENT, Icon: ShieldCheck },
];

const FALLBACK_META: FaqMeta = { tag: 'FAQ', color: ACCENT, Icon: Sparkles };

/* ── A single Q&A card ─────────────────────────────────────────────────────────
 * Semantic <dt>/<dd> pair wrapped so the whole card is one snap target. The accent
 * header band replaces octopush's featured photo (a subtle gradient in the card's
 * tint + a small icon). No text is ever hidden behind interaction. */
const FaqCard = React.forwardRef<HTMLDivElement, { item: { question: string; answer: string }; meta: FaqMeta; index: number; total: number }>(
  function FaqCard({ item, meta, index, total }, ref) {
    const Icon = meta.Icon;
    const n = String(index + 1).padStart(2, '0');
    const t = String(total).padStart(2, '0');

    return (
      <div
        ref={ref}
        className="group relative flex w-[78vw] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#3e271a] bg-[#140d0a]/80 backdrop-blur-sm transition-[transform,border-color,box-shadow] duration-200 ease-out will-change-transform hover:-translate-y-1.5 hover:border-[#5e3820] hover:shadow-2xl hover:shadow-[#4a2b16]/30 focus-within:-translate-y-1.5 sm:w-[400px]"
      >
        {/* Reveal layer — the gallery entrance animates THIS (opacity/transform), not the
            card root, so GSAP's inline transform never clobbers the root's hover/focus
            lift. Holds the band + body; the hover accent edge stays on the root below. */}
        <div data-faq-reveal className="flex flex-1 flex-col will-change-transform">
          {/* Accent header band — stands in for octopush's featured image. The inner
              gradient layer (data-faq-band) drifts for a subtle parallax as the card
              crosses the viewport in the pinned gallery. */}
          <div
            aria-hidden="true"
            className="relative h-28 w-full overflow-hidden border-b border-[#3e271a]/70"
          >
            <span
              data-faq-band
              aria-hidden="true"
              className="absolute inset-0 will-change-transform"
              style={{
                backgroundImage: `linear-gradient(135deg, ${meta.color}33 0%, ${meta.color}10 45%, transparent 100%)`,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full blur-2xl"
              style={{ backgroundColor: `${meta.color}33` }}
            />
            <span
              className="absolute bottom-4 left-5 flex h-11 w-11 items-center justify-center rounded-xl border bg-[#0c0806]/60 backdrop-blur-sm"
              style={{ borderColor: `${meta.color}59`, color: meta.color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            {/* category tag, top-right */}
            <span
              className="absolute right-4 top-4 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
              style={{ borderColor: `${meta.color}40`, backgroundColor: `${meta.color}1a`, color: meta.color }}
            >
              {meta.tag}
            </span>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-6 sm:p-7">
            <div className="flex items-center gap-3 font-mono text-[11px] text-[#ecd0b9]/40">
              <span style={{ color: meta.color }}>{n}</span>
              <span className="h-px flex-1 bg-[#3e271a]/70" />
              <span>{t}</span>
            </div>

            {/* Question is the card title. dt is not a heading (no h2/h3 inside). */}
            <dt className="mt-4 text-balance text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
              {item.question}
            </dt>
            {/* Answer always rendered — never hidden behind interaction. */}
            <dd className="mt-3 text-sm leading-relaxed text-[#ecd0b9]/70">{item.answer}</dd>
          </div>
        </div>

        {/* Hover accent edge that brightens on hover/focus. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100 group-focus-within:scale-x-100"
          style={{ backgroundColor: meta.color }}
        />
      </div>
    );
  },
);

/**
 * The FAQ as a GSAP horizontal-scrolling gallery, modelled on
 * https://demos.gsap.com/demo/horizontal-scrolling-gallery/. On desktop (lg+) the
 * section PINS while you scroll, and vertical scroll is converted into horizontal card
 * movement: a single `x` tween (ease "none") slides the card track sideways, scrubbed
 * and snapped to the scroll position, while each card subtly fades/rises and its accent
 * band parallaxes as it crosses the viewport (driven by `containerAnimation` — the
 * gallery's signature). Each FAQ item is one card (numbered index, derived one-word
 * category tag, the question as the title, the answer as the body, an accent header
 * band in place of a photo).
 *
 * Below lg, under reduced motion, or with no JS, the same track is just a native
 * overflow-x scroll-snap carousel with prev/next buttons (no pin, no scroll hijack) —
 * so every question and answer is present, readable, and crawlable in the SSR HTML
 * (mirrored 1:1 by the FAQPage JSON-LD in layout.tsx for FAQ rich results + GEO). The
 * scroll container is focusable and arrow-key scrollable; focus is never trapped.
 */
export default function FaqShowcase() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const tentacleRef = useRef<SVGPathElement>(null);
  const scrollerRef = useRef<HTMLDListElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const total = faqItems.length;

  // ── Scroll-driven motion. ──
  // Universal beats (marquee scrub, header rise, tentacle draw) run at every size; the
  // pinned horizontal gallery is desktop-only and the scatter-in entrance is the <lg
  // fallback flair. Everything animates only opacity/transform on top of fully-visible
  // content (plus a stroke-dash on the decorative curve), so nothing is ever left
  // invisible if the animation never runs.
  useLayoutEffect(() => {
    if (reduce) return;
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
    if (cards.length === 0) return;

    // Universal, size-independent beats.
    const ctx = gsap.context(() => {
      // 0) Scroll-scrubbed horizontal marquee header (madewithgsap.com-style).
      // The track holds two identical copies; translating it -50% of its own width
      // slides copy 1 off-screen as copy 2 takes its place — seamless, tied to scroll.
      // Triggered on the marquee itself (not the section) so the long pin-spacing the
      // gallery appends below doesn't stretch this scrub.
      if (marqueeTrackRef.current) {
        gsap.to(marqueeTrackRef.current, {
          xPercent: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: marqueeRef.current,
            start: 'top bottom', // begins as the band enters the viewport
            end: 'bottom top', // finishes as it leaves the top
            scrub: 1, // smooth 1s interpolation toward the scrollbar
          },
        });
      }

      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      });

      // 1) Header copy rises in.
      if (headerRef.current) {
        tl.from(
          headerRef.current.children,
          { y: 26, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' },
          0,
        );
      }

      // 2) The stray "tentacle" curve draws itself behind the header.
      const path = tentacleRef.current;
      if (path) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
        tl.to(path, { strokeDashoffset: 0, opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.1);
      }
    }, sectionRef);

    // Responsive scenes. matchMedia tears each scene down (and reverts its sets) when
    // the breakpoint stops matching, so resizing swaps cleanly between gallery ⇄ swipe.
    const mm = gsap.matchMedia();

    // Desktop: the pinned horizontal-scrolling gallery.
    mm.add('(min-width: 1024px)', () => {
      const track = scrollerRef.current;
      if (!track) return;

      // Hand horizontal motion to GSAP: stop the native scroller from clipping/snapping
      // so the track can overflow the pinned viewport and be translated by transform.
      // matchMedia reverts these on cleanup, restoring the native swipe carousel.
      gsap.set(track, { overflow: 'visible', scrollSnapType: 'none', x: 0 });

      // How far the track must travel for its right edge to reach the viewport's.
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      // One card's worth of advance (card width + flex gap), used to snap card-to-card.
      const cardAdvance = () => {
        const first = cardRefs.current.find(Boolean);
        if (!first) return 0;
        const gap = parseFloat(getComputedStyle(track).columnGap || '24') || 24;
        return first.offsetWidth + gap;
      };

      // Master tween: vertical scroll drives horizontal x. ease "none" is REQUIRED so
      // scroll position and horizontal position stay in 1:1 sync (and so the per-card
      // containerAnimation triggers below line up).
      const scrollTween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinRef.current, // align pin start with the stage, not the padded section
          pin: pinRef.current, // pin the wrapper, never the animated track
          start: 'top top',
          end: () => '+=' + distance(),
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            // Snap to whole-card increments rather than even fractions, since several
            // cards are visible at once (even fractions wouldn't land on card edges).
            snapTo: (value) => {
              const d = distance();
              const step = cardAdvance();
              if (!d || !step) return value;
              return gsap.utils.snap(step / d, value);
            },
            duration: { min: 0.15, max: 0.35 },
            ease: 'power1.inOut',
          },
        },
      });

      // Per-card reveal, keyed to horizontal position via containerAnimation (the
      // gallery's signature). Animates the inner reveal layer + band parallax — never
      // the card root — so GSAP's inline transform can't override the hover/focus lift.
      cards.forEach((card) => {
        const layer = card.querySelector<HTMLElement>('[data-faq-reveal]');
        const band = card.querySelector<HTMLElement>('[data-faq-band]');

        if (layer) {
          gsap.from(layer, {
            opacity: 0,
            yPercent: 14,
            scale: 0.95,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTween,
              start: 'left 92%', // card's left edge at 92% of viewport width
              end: 'left 58%',
              scrub: true,
            },
          });
        }

        if (band) {
          gsap.from(band, {
            xPercent: -10, // subtle drift across the band as the card passes
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          });
        }
      });
    });

    // Below lg: the scatter-in entrance for the native swipe carousel. Cards fly in
    // from alternating off-screen sides, rotated, and settle into their row.
    mm.add('(max-width: 1023px)', () => {
      const offX = () => (typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.55;

      gsap.from(cards, {
        x: (i: number) => (i % 2 ? 1 : -1) * offX(),
        y: (i: number) => (i % 2 ? -1 : 1) * 60,
        rotateZ: (i: number) => (i % 2 ? 1 : -1) * 14,
        scale: 0.86,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'power4.out',
        transformOrigin: 'center center',
        // Hand the transform back to CSS when done so the inline transform gsap leaves
        // behind doesn't override the card's hover/focus lift.
        clearProps: 'transform,transformOrigin',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      });
    });

    return () => {
      ctx.revert();
      mm.revert();
    };
  }, [reduce]);

  // ── Track scroll position to toggle prev/next affordances. ──
  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  // ── Prev/next: advance by one card width (including the gap). ──
  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = cardRefs.current.find(Boolean);
    const step = first ? first.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' });
  }, [reduce]);

  return (
    <section ref={sectionRef} id="faq" className="relative overflow-hidden scroll-mt-20 py-20 sm:py-28">
      {/* Decorative "tentacle" curve that draws itself on entrance — echoes octopush's
          stray line behind the heading. Purely ornamental, behind all content. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-20 z-0 h-[58%] w-full opacity-[0.18] sm:top-24"
        viewBox="0 0 1400 800"
        preserveAspectRatio="none"
      >
        <path
          ref={tentacleRef}
          d="M-60 267 C350 171 350 498 700 453 C1050 377 1050 642 1460 542"
          fill="none"
          stroke="#dda67a"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* ── Scroll-scrubbed marquee band ──
          Full-bleed giant header that scrubs horizontally with scroll. Purely
          decorative (aria-hidden) — the semantic <h2> lives in the header row below,
          so screen readers and the FAQPage JSON-LD aren't handed duplicate copy. The
          track holds two identical copies for a seamless -50% translate loop. */}
      <div
        ref={marqueeRef}
        aria-hidden="true"
        className="faq-marquee relative z-[1] mb-14 w-full select-none overflow-hidden sm:mb-20"
      >
        <div ref={marqueeTrackRef} className="flex w-max items-center will-change-transform">
          {[0, 1].map((copy) => (
            <h2
              key={copy}
              className="whitespace-nowrap pr-[4vw] text-[16vw] font-extrabold uppercase leading-none tracking-tight text-white sm:text-[8vw]"
            >
              Frequently <span className="faq-marquee-outline">Asked</span> Questions{' '}
              <span className="text-[#dda67a]">•</span>{' '}
            </h2>
          ))}
        </div>
      </div>

      {/* ── Pinned gallery stage ──
          On desktop this wrapper is pinned full-viewport while the track below scrolls
          horizontally; on smaller screens it's a normal block and the track is a native
          swipe carousel. The marquee above and the tentacle behind stay outside the pin. */}
      <div ref={pinRef} className="relative z-[1] lg:flex lg:min-h-screen lg:flex-col lg:justify-center">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          {/* ── Header: eyebrow + heading + (mobile) swipe hint / controls ── */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div ref={headerRef}>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#dda67a]">FAQ</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Frequently asked questions
              </h2>
              <p className="mt-3 max-w-md text-[#ecd0b9]/60">
                Everything freelancers and virtual assistants ask before they start tracking. Scroll
                through the cards.
              </p>
            </div>

            {/* Swipe hint + prev/next for the native carousel. Hidden on lg, where the
                gallery is scroll-driven and pinned instead. */}
            <div className="flex items-center gap-4 lg:hidden">
            <span className="hidden select-none items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#ecd0b9]/40 sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              swipe
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                disabled={!canPrev}
                aria-label="Previous question"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3e271a] bg-[#140d0a]/80 text-[#dda67a] transition-colors duration-150 ease-out hover:border-[#5e3820] hover:bg-[#2d1b11]/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#3e271a] disabled:hover:bg-[#140d0a]/80"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                disabled={!canNext}
                aria-label="Next question"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3e271a] bg-[#140d0a]/80 text-[#dda67a] transition-colors duration-150 ease-out hover:border-[#5e3820] hover:bg-[#2d1b11]/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#3e271a] disabled:hover:bg-[#140d0a]/80"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── The carousel track ──
          Full-bleed overflow-x scroller with scroll-snap; the inner padding lets the
          first/last cards sit away from the viewport edges while neighbours peek.
          Focusable + arrow-key scrollable for keyboard users; never traps focus. */}
      <dl
        ref={scrollerRef}
        tabIndex={0}
        role="group"
        aria-label="Frequently asked questions carousel, scroll horizontally"
        className="faq-scroller relative z-[1] mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 pt-2 [scrollbar-width:none] focus-visible:outline-none motion-safe:scroll-smooth sm:mt-12 sm:px-8 lg:gap-6"
      >
        {faqItems.map((item, index) => (
          <FaqCard
            key={item.question}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            item={item}
            meta={FAQ_META[index] ?? FALLBACK_META}
            index={index}
            total={total}
          />
        ))}
        {/* Trailing spacer so the last card can scroll fully clear of the edge. */}
        <div aria-hidden="true" className="w-px shrink-0 sm:w-4" />
      </dl>
      </div>

      {/* Component-scoped styling: hide the native scrollbar. On lg the track is
          transform-driven by GSAP; below lg it stays natively swipe-scrollable. */}
      <style>{`
        .faq-scroller::-webkit-scrollbar { display: none; }

        /* Fade the marquee out at both edges so it dissolves instead of hard-cutting. */
        .faq-marquee {
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
        }
        /* Every other word rendered as an outline for depth, in the espresso accent. */
        .faq-marquee-outline {
          color: transparent;
          -webkit-text-stroke: 1.5px #dda67a;
        }
      `}</style>
    </section>
  );
}
