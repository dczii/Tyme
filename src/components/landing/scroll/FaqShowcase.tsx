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

const FAQ_META: FaqMeta[] = [
  { tag: 'Basics', color: '#dda67a', Icon: Timer },
  { tag: 'Picks', color: '#8fb3e0', Icon: Sparkles },
  { tag: 'Billing', color: '#c8a0e8', Icon: Banknote },
  { tag: 'Clients', color: '#8fd0b0', Icon: Users },
  { tag: 'Reports', color: '#e8a87c', Icon: FileDown },
  { tag: 'Security', color: '#e0a0c0', Icon: ShieldCheck },
];

const FALLBACK_META: FaqMeta = { tag: 'FAQ', color: '#dda67a', Icon: Sparkles };

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
        {/* Accent header band — stands in for octopush's featured image. */}
        <div
          aria-hidden="true"
          className="relative h-28 w-full overflow-hidden border-b border-[#3e271a]/70"
          style={{
            backgroundImage: `linear-gradient(135deg, ${meta.color}33 0%, ${meta.color}10 45%, transparent 100%)`,
          }}
        >
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
 * The FAQ as a horizontal drag/swipe card carousel — modelled on octopush's "Latest
 * Insights" beat but recoloured to Tyme's dark espresso theme. Each FAQ item is one
 * card (numbered index, derived one-word category tag, the question as the title, the
 * answer as the body, an accent header band in place of a photo). The track is an
 * overflow-x scroller with CSS scroll-snap; you scroll it by dragging/swiping
 * (pointer events translate scrollLeft), with adjacent cards peeking at the edges and
 * optional prev/next buttons. Vertical page scroll is never hijacked and the page is
 * never pinned — this is an independent swipe carousel.
 *
 * Accessibility / SSR: GSAP entrance is gated behind useReducedMotion and only runs on
 * an opacity/transform layer that is fully visible by default, so with no JS, reduced
 * motion, or before hydration the section is a readable native-scroll list of cards
 * with every question and answer present in the SSR HTML. The scroll container is
 * focusable and arrow-key scrollable; focus is never trapped.
 */
export default function FaqShowcase() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDListElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const total = faqItems.length;

  // ── Entrance reveal: cards fan up + fade in once the section enters view. ──
  // Animates only opacity/translate on top of fully-visible content, so nothing is
  // ever left invisible if the animation never runs.
  useLayoutEffect(() => {
    if (reduce) return;
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(cards, {
        y: 36,
        opacity: 0,
        rotateZ: 1.2,
        transformOrigin: 'bottom center',
        duration: 0.7,
        stagger: 0.09,
        ease: 'power3.out',
        // Hand the transform back to CSS when done, so the inline transform gsap
        // leaves behind doesn't override the card's hover/focus lift.
        clearProps: 'transform,transformOrigin',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
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

  // ── Pointer drag-to-scroll (mouse + pen). Touch keeps native momentum scrolling. ──
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let down = false;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let pointerId = -1;

    const onPointerDown = (e: PointerEvent) => {
      // Native touch scrolling is smoother than emulating it — only hijack mouse/pen.
      if (e.pointerType === 'touch') return;
      down = true;
      dragging = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      pointerId = e.pointerId;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        el.setPointerCapture?.(pointerId);
        el.classList.add('faq-grabbing');
      }
      if (dragging) {
        e.preventDefault();
        el.scrollLeft = startScroll - dx;
      }
    };

    const endDrag = () => {
      if (!down) return;
      down = false;
      if (dragging) {
        dragging = false;
        try {
          el.releasePointerCapture?.(pointerId);
        } catch {
          /* capture may already be gone */
        }
        el.classList.remove('faq-grabbing');
        // Suppress the click that would otherwise fire after a real drag.
        const swallow = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        el.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0);
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('pointerleave', endDrag);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endDrag);
      el.removeEventListener('pointercancel', endDrag);
      el.removeEventListener('pointerleave', endDrag);
    };
  }, []);

  // ── Prev/next: advance by one card width (including the gap). ──
  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = cardRefs.current.find(Boolean);
    const step = first ? first.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' });
  }, [reduce]);

  return (
    <section ref={sectionRef} id="faq" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* ── Header: eyebrow + heading + (desktop) swipe hint / controls ── */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#dda67a]">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 max-w-md text-[#ecd0b9]/60">
              Everything freelancers and virtual assistants ask before they start tracking — swipe
              through the cards.
            </p>
          </div>

          {/* Swipe hint + prev/next, mirroring octopush's "‹ swipe ›". */}
          <div className="flex items-center gap-4">
            <span className="hidden select-none items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#ecd0b9]/40 sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              drag · swipe
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
        aria-label="Frequently asked questions carousel — scroll horizontally"
        className="faq-scroller mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 pt-2 [scrollbar-width:none] focus-visible:outline-none motion-safe:scroll-smooth sm:mt-12 sm:px-8 lg:gap-6"
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

      {/* Component-scoped styling: hide the native scrollbar and switch the cursor
          while dragging. The track stays natively scrollable underneath. */}
      <style>{`
        .faq-scroller::-webkit-scrollbar { display: none; }
        .faq-scroller { cursor: grab; }
        .faq-scroller.faq-grabbing { cursor: grabbing; scroll-snap-type: none; }
        .faq-scroller.faq-grabbing * { user-select: none; }
      `}</style>
    </section>
  );
}
