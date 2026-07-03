import BrandLogo from "@/components/BrandLogo";
import LogoIntroAnimation from "@/components/landing/LogoIntroAnimation";
import { IntroProvider } from "@/components/landing/IntroContext";
import { RouteVeilProvider } from "@/components/landing/RouteVeil";
import SiteHeader, { navLinkClass } from "@/components/landing/SiteHeader";
import AmbientBackdrop from "@/components/landing/scroll/AmbientBackdrop";
import AppShowcase from "@/components/landing/scroll/AppShowcase";
import StoryBridge from "@/components/landing/scroll/StoryBridge";
import FeatureShowcase from "@/components/landing/scroll/FeatureShowcase";
import JourneyTimeline from "@/components/landing/scroll/JourneyTimeline";
import FaqShowcase from "@/components/landing/scroll/FaqShowcase";
import FinalCta from "@/components/landing/scroll/FinalCta";
import SmoothScrollProvider from "@/components/landing/scroll/SmoothScrollProvider";

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
      <RouteVeilProvider>
      <SmoothScrollProvider>
        {/* overflow-x-clip (not overflow-hidden) contains the decorative glow
        blobs without creating a scroll container — overflow-hidden here would
        silently break the sticky header. */}
        <div className='relative min-h-screen overflow-x-clip bg-[#0c0806] text-slate-200 font-sans'>
          <LogoIntroAnimation />
          {/* Ambient espresso glow with scroll parallax: the two blobs breathe
          (CSS pulse) and drift at different rates as the page scrolls, forming
          the far depth layer behind every section. */}
          <AmbientBackdrop />

          {/* ===== Header =====
          Sticky top bar: transparent over the hero, elevates (blur + border +
          shadow) once scrolled. Brand left, anchor nav middle, Login right. */}
          <SectionComment label='HEADER - sticky nav, elevates on scroll + Google sign-in (top right)' />
          <SiteHeader />

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
      </RouteVeilProvider>
    </IntroProvider>
  );
}
