'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTyme } from '@/app/providers';
import { useSignupModal } from './SignupModalContext';
import { scrollToAnchor } from './scroll/lenis';
import { trackCtaClick, type CtaPanel } from '@/lib/analytics';

// One CTA vocabulary shared by the hero, pricing panel, final CTA band, and the
// mobile bar so every panel carries the identical primary action (Tesla's "same
// two CTAs on every panel" rule). `lg` is the panel size, `sm` the compact bar.
type CtaSize = 'lg' | 'sm';

const SIZES: Record<CtaSize, string> = {
  lg: 'text-base py-4 px-7 rounded-2xl gap-2.5 min-h-[56px]',
  sm: 'text-sm py-2.5 px-5 rounded-xl gap-2 min-h-[44px]',
};

// Shared visible focus ring — copper accent, offset against the espresso bg.
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dda67a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0806]';

interface CtaProps {
  size?: CtaSize;
  className?: string;
  children: React.ReactNode;
  /** Which panel this CTA lives on — tags the `cta_click` funnel event (#32). */
  panel?: CtaPanel;
}

/**
 * Primary conversion action, repeated on every panel and pointed at the single
 * shared SignupModal (Tesla's "one order flow on every panel"). It renders as a real
 * `<a href="/login">` so crawlers and no-JS visitors get a working registration
 * entry, then progressively enhances into the modal on click. Signed-in visitors get
 * "Go to app" → `/calendar` and never see the modal (#27).
 */
export function PrimaryCta({ size = 'lg', className = '', children, panel }: CtaProps) {
  const { user, authLoading } = useTyme();
  const { openModal } = useSignupModal();
  const router = useRouter();

  const signedIn = !authLoading && !!user;
  const href = signedIn ? '/calendar' : '/login';
  const label = signedIn ? 'Go to app' : children;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Modifier-clicks / middle-clicks keep native link behaviour (open in new tab).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    // Record the primary-CTA click for the funnel before acting (once per real,
    // same-tab click — modifier/new-tab clicks bailed above).
    if (panel) trackCtaClick(panel, 'primary');
    if (authLoading) return; // wait for auth to resolve — no wrong action mid-load
    if (signedIn) router.push('/calendar');
    else openModal();
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      aria-busy={authLoading || undefined}
      className={`group inline-flex items-center justify-center bg-[#a66e46] font-semibold text-white shadow-lg shadow-[#4a2b16]/40 cursor-pointer select-none transition duration-150 ease-out hover:bg-[#8e5a34] active:scale-[0.97] ${FOCUS_RING} ${SIZES[size]} ${className}`}
    >
      {/* No wrong-label flash: hide the label until auth resolves, keeping the
          button's footprint so nothing shifts (neutral state per #27). */}
      <span className={authLoading ? 'opacity-0' : ''}>{label}</span>
    </a>
  );
}

interface SecondaryCtaProps extends CtaProps {
  /** In-page anchor target, e.g. `#how-it-works`. */
  href: string;
}

/**
 * Quiet secondary CTA. Rendered as a real `<a href>` so it works with no JS and
 * lands in the SSR HTML; on click it intercepts same-page anchors and routes the
 * scroll through Lenis (native smooth-scroll fallback lives in scrollToAnchor).
 */
export function SecondaryCta({ href, size = 'lg', className = '', children, panel }: SecondaryCtaProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (panel) trackCtaClick(panel, 'secondary');
    if (href.startsWith('#')) {
      e.preventDefault();
      scrollToAnchor(href);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`group inline-flex items-center justify-center border border-[#5e3820]/70 bg-[#140d0a]/40 font-semibold text-[#ecd0b9] cursor-pointer select-none transition duration-150 ease-out hover:border-[#5e3820] hover:bg-[#1a110c]/70 hover:text-white active:scale-[0.97] ${FOCUS_RING} ${SIZES[size]} ${className}`}
    >
      {children}
    </a>
  );
}
