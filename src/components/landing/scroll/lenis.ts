// Tiny module-singleton bridge to the landing page's Lenis instance.
//
// SmoothScrollProvider owns the Lenis lifecycle but the CTA buttons live far down
// the tree and only need to *drive* a smooth anchor scroll. Rather than thread a
// context through every panel, the provider registers its instance here and the
// CTAs read it back — with a native fallback for reduced-motion / no-JS, where
// Lenis is never created.

import type Lenis from 'lenis';

let instance: Lenis | null = null;

export function setLenis(next: Lenis | null) {
  instance = next;
}

/**
 * Lock / unlock page scrolling while a modal is open (Milestone 3, #29). Stops the
 * Lenis loop when it's running and pins the body either way, so it also works under
 * reduced motion / no-JS, where Lenis is never created.
 */
export function lockScroll() {
  instance?.stop();
  if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
}

export function unlockScroll() {
  instance?.start();
  if (typeof document !== 'undefined') document.body.style.overflow = '';
}

/**
 * Smooth-scroll to an in-page anchor, routed through Lenis when it's running and
 * falling back to the platform's native smooth scroll (which honours `scroll-mt-*`)
 * otherwise. The -80px offset clears the sticky header.
 */
export function scrollToAnchor(hash: string) {
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  const el = document.getElementById(id);
  if (!el) return;

  if (instance) {
    instance.scrollTo(el, { offset: -80 });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
