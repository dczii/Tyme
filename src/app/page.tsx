import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import AppNavButton from "@/components/landing/AppNavButton";
import LogoIntroAnimation from "@/components/landing/LogoIntroAnimation";
import { IntroProvider } from "@/components/landing/IntroContext";
import AppShowcase from "@/components/landing/scroll/AppShowcase";
import StoryBridge from "@/components/landing/scroll/StoryBridge";
import FeatureShowcase from "@/components/landing/scroll/FeatureShowcase";
import JourneyTimeline from "@/components/landing/scroll/JourneyTimeline";
import FaqShowcase from "@/components/landing/scroll/FaqShowcase";
import FinalCta from "@/components/landing/scroll/FinalCta";
import SmoothScrollProvider from "@/components/landing/scroll/SmoothScrollProvider";

// Nav links get a sliding underline (origin-left scale) — a small, consistent
// "you are pointing at a destination" cue shared by header and footer.
const navLinkClass =
  "relative transition-colors duration-150 ease hover:text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-[#dda67a] after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100";

/**
 * Emits a REAL HTML comment into the rendered markup. JSX `{/* … *\/}` comments are
 * stripped at build time and never reach the browser, so this helper is what makes
 * the section labels visible in "View Source" / the page HTML. The wrapper is
 * `hidden` so it adds a comment without affecting layout.
 */
function SectionComment({ label }: { label: string }) {
  return <div hidden dangerouslySetInnerHTML={{ __html: `<!-- ===== ${label} ===== -->` }} />;
}

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <IntroProvider>
      <SmoothScrollProvider>
        <div className='relative min-h-screen overflow-hidden bg-[#0c0806] text-slate-200 font-sans'>
          <LogoIntroAnimation />
          {/* Ambient espresso-theme glow (decorative). The two blobs breathe with a
          slow, offset opacity pulse — gated behind motion-safe so reduced-motion
          users get a static backdrop. */}
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -top-48 -left-40 h-[520px] w-[520px] rounded-full bg-[#4a2b16]/30 blur-[130px] motion-safe:animate-pulse motion-safe:[animation-duration:7s]'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute top-[40%] -right-48 h-[520px] w-[520px] rounded-full bg-[#9a6a42]/15 blur-[130px] motion-safe:animate-pulse motion-safe:[animation-duration:9s]'
          />

          {/* ===== Header =====
          Sticky, blurred top bar: brand on the left, anchor nav in the middle,
          and the "Sign in with Google" action pinned top-right. */}
          <SectionComment label='HEADER - sticky nav + Google sign-in (top right)' />
          <header className='sticky top-0 z-30 border-b border-[#3e271a]/40 bg-[#0c0806]/70 backdrop-blur-xl'>
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

          <main className='relative z-10'>
            {/* ===== Hero (section 1) — calendar showcase =====
            The product itself is the hero: a browser-framed screenshot of the Tyme
            weekly calendar that plays an on-load entrance once the intro splash
            finishes — the heading staggers up, the frame straightens out of a 3D
            tilt, parallax accent cards float in, and the colored time-entry blocks
            stagger in. The heading copy and calendar grid are plain markup, so they
            stay in the initial HTML for SEO. */}
            <SectionComment label='HERO (section 1) - calendar showcase, GSAP on-load entrance + Google sign-in CTA' />
            <AppShowcase />

            {/* ===== Story bridge =====
            The narrative chapter between the promise (hero) and the proof
            (features): the section pins while a single sentence illuminates
            word-by-word, scrubbed to the reader's own scroll. Plain SSR text
            (static pull-quote) under reduced motion or no JS. */}
            <SectionComment label='STORY BRIDGE - pinned word-by-word scroll narrative (GSAP scrub)' />
            <StoryBridge />

            {/* ===== Features (section 2) =====
            "Everything you need to bill with confidence", animated like wero's
            *What this means for merchants* beat: on desktop the heading pins while
            the feature cards are dealt onto one spot, one at a time, as you scroll
            (GSAP ScrollTrigger). Lays out as a plain responsive grid under reduced
            motion, below lg, or with no JS — so every card stays crawlable. */}
            <SectionComment label='FEATURES (section 2) - pinned heading + scroll-dealt feature cards (GSAP), wero-style' />
            <FeatureShowcase />

            {/* ===== How it works =====
            The three steps as a journey: a vertical rail fills with scroll,
            nodes ignite in order, and each step card slides in from the rail
            (alternating sides on sm+, stacked beside a left rail on mobile). */}
            <SectionComment label='HOW IT WORKS - scroll-drawn journey timeline: sign in, log time, export' />
            <JourneyTimeline />

            {/* ===== FAQ =====
            Restyled after wero's FAQ — giant questions, one accent keyword each, a
            floating accent illustration, revealed word-by-word on scroll. Still the
            same faqItems array that feeds the FAQPage JSON-LD in layout.tsx, and the
            answers stay rendered beneath every question, so the structured data and
            on-page copy stay in sync (FAQ rich results + AI answer engines / GEO). */}
            <SectionComment label='FAQ - wero-style giant questions + accent keyword, mirrored by FAQPage JSON-LD (SEO + GEO)' />
            <FaqShowcase />

            {/* ===== Final CTA =====
            Closing conversion band that scales up into full presence as it
            arrives (scrubbed), with a magnetic Google sign-in button. */}
            <SectionComment label='FINAL CTA - arrival scrub + magnetic Google sign-in' />
            <FinalCta />
          </main>

          {/* ===== Footer =====
            Brand mark, anchor nav, and copyright. */}
          <SectionComment label='FOOTER - brand, anchor nav, copyright' />
          <footer className='relative z-10 border-t border-[#3e271a]/40'>
            <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8'>
              <div className='flex items-center gap-2.5'>
                <BrandLogo size={28} showBackground={false} className='brightness-125' />
                <span className='font-semibold text-white'>Tyme</span>
              </div>
              <nav className='flex items-center gap-6 text-sm text-[#ecd0b9]/55'>
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
              <p className='font-mono text-xs text-[#ecd0b9]/40'>© {year} Tyme</p>
            </div>
          </footer>
        </div>
      </SmoothScrollProvider>
    </IntroProvider>
  );
}
