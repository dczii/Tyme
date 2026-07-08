'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTyme } from '@/app/providers';
import { googleSignIn } from '@/lib/supabase';
import { scrollToAnchor } from './scroll/lenis';

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
}

/**
 * Primary conversion action, repeated on every panel. For now it opens the real
 * Google OAuth flow (the dedicated signup modal arrives in Milestone 3); until then
 * this IS the "registration entry". Signed-in visitors are auto-forwarded into the
 * workspace, preserving the landing page's existing redirect behaviour.
 */
export function PrimaryCta({ size = 'lg', className = '', children }: CtaProps) {
  const { user, authLoading } = useTyme();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/calendar');
  }, [authLoading, user, router]);

  const handleClick = async () => {
    setIsConnecting(true);
    try {
      await googleSignIn();
      // Redirect-based OAuth: the browser navigates away to Google.
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setIsConnecting(false);
    }
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={isConnecting}
      className={`group inline-flex items-center justify-center bg-[#a66e46] font-semibold text-white shadow-lg shadow-[#4a2b16]/40 cursor-pointer select-none transition duration-150 ease-out hover:bg-[#8e5a34] active:scale-[0.97] disabled:cursor-wait disabled:opacity-90 ${FOCUS_RING} ${SIZES[size]} ${className}`}
    >
      {isConnecting ? (
        <>
          <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white' />
          <span className='font-mono text-xs uppercase tracking-widest'>Connecting…</span>
        </>
      ) : (
        children
      )}
    </button>
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
export function SecondaryCta({ href, size = 'lg', className = '', children }: SecondaryCtaProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
