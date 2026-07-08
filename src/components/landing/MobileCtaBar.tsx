'use client';

import { useTyme } from '@/app/providers';
import { PrimaryCta, SecondaryCta } from './CtaButton';

/**
 * Docked mobile CTA bar (Tesla's "conversion is one thumb-tap away"). Fixed to the
 * bottom edge on <md viewports only, hidden for signed-in visitors. It overlays
 * content (position: fixed) so it never inserts into flow — zero layout shift.
 * Static in Milestone 1; scroll-aware show/hide is a Milestone 2 issue.
 *
 * z-40 sits above page content but below the intro splash (z-9999).
 */
export default function MobileCtaBar() {
  const { user, authLoading } = useTyme();

  // Signed-in visitors are being forwarded into the app — no signup prompt for them.
  if (!authLoading && user) return null;

  return (
    <div className='fixed inset-x-0 bottom-0 z-40 md:hidden'>
      <div className='border-t border-[#3e271a]/60 bg-[#0c0806]/90 backdrop-blur-xl'>
        {/* pb-safe (safe-area inset) lives on its own element so it never fights the
            base padding-bottom below it. */}
        <div className='pb-safe px-4 pt-3'>
          <div className='flex items-center gap-3 pb-3'>
            <PrimaryCta size='sm' className='flex-1'>
              Start tracking free
            </PrimaryCta>
            <SecondaryCta href='#how-it-works' size='sm' className='shrink-0 px-4'>
              How it works
            </SecondaryCta>
          </div>
        </div>
      </div>
    </div>
  );
}
