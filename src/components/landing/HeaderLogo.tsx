'use client';

import BrandLogo from '@/components/BrandLogo';
import { useIntro } from './IntroContext';

/**
 * The brand logo that lives in the landing header. It doubles as the landing slot
 * that [LogoIntroAnimation](./LogoIntroAnimation.tsx) flies the intro splash logo
 * into (`data-header-logo` is the measurement target).
 *
 * The slot is held empty (opacity 0, but still laid out so the fly target measures
 * correctly) until `introDone` fires, then fades in — timed to hand off from the
 * flying logo as it lands. This stops the flying splash logo from overlapping a
 * second, already-visible header logo while the backdrop uncovers the header.
 *
 * `introDone` is `false` on both the server and the first client render (so there is
 * no hydration mismatch), and it is set by the intro in every path — full fly,
 * reduced motion, and the missing-slot fallback — so the logo always ends up visible.
 */
export default function HeaderLogo() {
  const { introDone } = useIntro();

  return (
    <span
      data-header-logo
      className={`flex transition-opacity duration-200 ease-out ${introDone ? 'opacity-100' : 'opacity-0'}`}
    >
      <BrandLogo size={34} showBackground={false} className='brightness-125' />
    </span>
  );
}
