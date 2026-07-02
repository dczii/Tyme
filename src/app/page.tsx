import Link from "next/link";
import { LogIn, MousePointerClick, FileDown } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import Reveal from "@/components/landing/Reveal";
import SignInButton from "@/components/landing/SignInButton";
import AppNavButton from "@/components/landing/AppNavButton";
import LogoIntroAnimation from "@/components/landing/LogoIntroAnimation";
import { IntroProvider } from "@/components/landing/IntroContext";
import AppShowcase from "@/components/landing/scroll/AppShowcase";
import FeatureShowcase from "@/components/landing/scroll/FeatureShowcase";
import FaqShowcase from "@/components/landing/scroll/FaqShowcase";
import SmoothScrollProvider from "@/components/landing/scroll/SmoothScrollProvider";

// The three "how it works" steps rendered in the how-it-works section.
const steps = [
  {
    icon: LogIn,
    title: "Sign in with Google",
    description: "One click, no passwords. Your workspace syncs instantly across devices.",
  },
  {
    icon: MousePointerClick,
    title: "Log time on the calendar",
    description: "Drop entries onto the weekly grid and tag them by client and project.",
  },
  {
    icon: FileDown,
    title: "Export a branded report",
    description: "Filter your hours, then export a polished PDF or CSV at invoice time.",
  },
];

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
                <a
                  href='#features'
                  className='transition-colors duration-150 ease hover:text-white'
                >
                  Features
                </a>
                <a
                  href='#how-it-works'
                  className='transition-colors duration-150 ease hover:text-white'
                >
                  How it works
                </a>
                <a href='#faq' className='transition-colors duration-150 ease hover:text-white'>
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

            {/* ===== Features (section 2) =====
            "Everything you need to bill with confidence", animated like wero's
            *What this means for merchants* beat: on desktop the heading pins while
            the feature cards are dealt onto one spot, one at a time, as you scroll
            (GSAP ScrollTrigger). Lays out as a plain responsive grid under reduced
            motion, below lg, or with no JS — so every card stays crawlable. */}
            <SectionComment label='FEATURES (section 2) - pinned heading + scroll-dealt feature cards (GSAP), wero-style' />
            <FeatureShowcase />

            {/* ===== How it works =====
            Three numbered steps (sign in → log time → export) that reveal with a
            left-to-right stagger. */}
            <SectionComment label='HOW IT WORKS - 3 steps: sign in, log time, export' />
            <section
              id='how-it-works'
              className='mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24'
            >
              <Reveal className='mx-auto max-w-2xl text-center'>
                <h2 className='text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                  From sign-in to invoice in three steps
                </h2>
              </Reveal>
              <ol className='mt-12 grid gap-6 md:grid-cols-3'>
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <Reveal as='li' key={step.title} delay={index * 0.08} className='relative'>
                      <div className='h-full rounded-2xl border border-[#3e271a] bg-[#140d0a]/60 p-7'>
                        <div className='flex items-center gap-3'>
                          <span className='flex h-9 w-9 items-center justify-center rounded-full border border-[#5e3820]/50 bg-[#2d1b11]/60 font-mono text-sm font-bold text-[#dda67a]'>
                            {index + 1}
                          </span>
                          <Icon className='h-5 w-5 text-[#dda67a]' />
                        </div>
                        <h3 className='mt-5 text-lg font-semibold text-white'>{step.title}</h3>
                        <p className='mt-2 text-sm leading-relaxed text-[#ecd0b9]/65'>
                          {step.description}
                        </p>
                      </div>
                    </Reveal>
                  );
                })}
              </ol>
            </section>

            {/* ===== FAQ =====
            Restyled after wero's FAQ — giant questions, one accent keyword each, a
            floating accent illustration, revealed word-by-word on scroll. Still the
            same faqItems array that feeds the FAQPage JSON-LD in layout.tsx, and the
            answers stay rendered beneath every question, so the structured data and
            on-page copy stay in sync (FAQ rich results + AI answer engines / GEO). */}
            <SectionComment label='FAQ - wero-style giant questions + accent keyword, mirrored by FAQPage JSON-LD (SEO + GEO)' />
            <FaqShowcase />

            {/* ===== Final CTA =====
            Closing conversion band with a glow accent and a repeat of the Google
            sign-in button. */}
            <SectionComment label='FINAL CTA - closing conversion band + Google sign-in' />
            <section className='mx-auto max-w-6xl px-5 pb-24 sm:px-8'>
              <Reveal>
                <div className='relative overflow-hidden rounded-3xl border border-[#3e271a] bg-[#140d0a]/80 px-6 py-14 text-center sm:px-12 sm:py-20'>
                  <div
                    aria-hidden='true'
                    className='pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#9a6a42]/15 blur-[120px]'
                  />
                  <h2 className='relative text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                    Start tracking your time today
                  </h2>
                  <p className='relative mx-auto mt-4 max-w-xl text-lg text-[#ecd0b9]/70'>
                    Join consultants, contractors, coaches, and freelancers who bill accurately
                    and never lose an hour.
                  </p>
                  <div className='relative mt-8 flex justify-center'>
                    <SignInButton variant='hero' />
                  </div>
                  <p className='relative mt-5 font-mono text-xs text-[#ecd0b9]/40'>
                    Free for independent professionals.
                  </p>
                </div>
              </Reveal>
            </section>
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
                <a
                  href='#features'
                  className='transition-colors duration-150 ease hover:text-white'
                >
                  Features
                </a>
                <a
                  href='#how-it-works'
                  className='transition-colors duration-150 ease hover:text-white'
                >
                  How it works
                </a>
                <a href='#faq' className='transition-colors duration-150 ease hover:text-white'>
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
