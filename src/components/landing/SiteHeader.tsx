'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import AppNavButton from './AppNavButton';

// Nav links get a sliding underline (origin-left scale) — a small, consistent
// "you are pointing at a destination" cue shared by header and footer.
export const navLinkClass =
  'relative transition-colors duration-150 ease hover:text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-[#dda67a] after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100';

/**
 * Sticky landing header that starts transparent over the hero and "elevates"
 * (backdrop blur, hairline border, soft shadow) once the page is scrolled.
 * The elevation is a state cue, not decoration: at the top the header stays
 * out of the hero's way; once content is moving beneath it, the surface
 * separates so the nav stays legible over anything that scrolls past.
 *
 * Scroll position is read with an IntersectionObserver on a sentinel (no
 * scroll listeners), and the change itself is a 300ms color/shadow fade —
 * no movement, so it needs no reduced-motion gate.
 */
export default function SiteHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Zero-size scroll sentinel: on-screen at the top of the page, gone the
          moment the user scrolls past the first ~40px. */}
      <div ref={sentinelRef} aria-hidden='true' className='absolute top-0 h-10 w-px' />
      <header
        className={`sticky top-0 z-30 border-b transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
          scrolled
            ? 'border-[#3e271a]/40 bg-[#0c0806]/70 shadow-lg shadow-black/25 backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className='mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8'>
          <Link href='/' className='flex items-center gap-2.5' aria-label='Tyme home'>
            <span data-header-logo className='flex'>
              <BrandLogo size={34} showBackground={false} className='brightness-125' />
            </span>
            <span className='text-lg font-bold tracking-tight text-white'>Tyme</span>
          </Link>
          <nav className='hidden items-center gap-8 text-sm text-[#ecd0b9]/70 md:flex'>
            <a href='#features' className={navLinkClass}>
              Features
            </a>
            <a href='#how-it-works' className={navLinkClass}>
              How it works
            </a>
            <a href='#faq' className={navLinkClass}>
              FAQ
            </a>
          </nav>
          {/* Login / Go To App — top right */}
          <AppNavButton variant='header' />
        </div>
      </header>
    </>
  );
}
