// Shared motion vocabulary for the Tyme marketing + auth surfaces.
//
// One place to answer "how fast / what curve / how far" so every animation on
// the site speaks the same physical language. The scale is intentionally
// small: pick the nearest token, don't invent per-component numbers.
//
// Durations (seconds)
//   tap      0.15  instant feedback: presses, color shifts, toggles
//   ui       0.25  small state changes: veils, accordions, badges
//   enter    0.6   content entrances: rises, fades, panel arrivals
//   hero     1.0   one big landing moment per page, nothing else
//
// Distances (px)
//   nudge    16    list items, small reveals
//   rise     34    headings, cards, panels
//   drop     90    the hero frame only

export const DUR = {
  tap: 0.15,
  ui: 0.25,
  enter: 0.6,
  hero: 1,
} as const;

export const DIST = {
  nudge: 16,
  rise: 34,
  drop: 90,
} as const;

// Easing — entrances decelerate (fast start, soft landing), exits accelerate.
// Motion (framer) wants cubic-bezier arrays; GSAP wants named strings.
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];

export const GSAP_EASE = {
  out: 'power3.out',
  outBig: 'power4.out',
  outSoft: 'power2.out',
  scrub: 'none', // scroll-scrubbed tweens must stay linear: the scrollbar is the ease
} as const;

// Session flag: the cinematic logo splash plays once per browser session.
export const INTRO_SEEN_KEY = 'tyme-intro-seen';
