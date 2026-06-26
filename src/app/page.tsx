import React from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Tags,
  FileBarChart2,
  FileDown,
  Target,
  ShieldCheck,
  LogIn,
  MousePointerClick,
  ArrowRight,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import Reveal from '@/components/landing/Reveal';
import SignInButton from '@/components/landing/SignInButton';
import LogoIntroAnimation from '@/components/landing/LogoIntroAnimation';
import { IntroProvider } from '@/components/landing/IntroContext';
import CalendarPreview from '@/components/landing/CalendarPreview';
import HeroVideoBackground from '@/components/landing/HeroVideoBackground';
import { productFeatures, faqItems } from '@/lib/seo';

// Map the icon name stored in seo.ts to the actual lucide component.
const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CalendarClock,
  Tags,
  FileBarChart2,
  FileDown,
  Target,
  ShieldCheck,
};

// The three "how it works" steps rendered in the how-it-works section.
const steps = [
  {
    icon: LogIn,
    title: 'Sign in with Google',
    description: 'One click, no passwords. Your workspace syncs instantly across devices.',
  },
  {
    icon: MousePointerClick,
    title: 'Log time on the calendar',
    description: 'Drop entries onto the weekly grid and tag them by client and project.',
  },
  {
    icon: FileDown,
    title: 'Export a branded report',
    description: 'Filter your hours, then export a polished PDF or CSV at invoice time.',
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
    <div className="relative min-h-screen overflow-hidden bg-[#0c0806] text-slate-200 font-sans">
      <LogoIntroAnimation />
      {/* Ambient espresso-theme glow (decorative). The two blobs breathe with a
          slow, offset opacity pulse — gated behind motion-safe so reduced-motion
          users get a static backdrop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -left-40 h-[520px] w-[520px] rounded-full bg-[#4a2b16]/30 blur-[130px] motion-safe:animate-pulse motion-safe:[animation-duration:7s]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[40%] -right-48 h-[520px] w-[520px] rounded-full bg-[#9a6a42]/15 blur-[130px] motion-safe:animate-pulse motion-safe:[animation-duration:9s]"
      />

      {/* ===== Header =====
          Sticky, blurred top bar: brand on the left, anchor nav in the middle,
          and the "Sign in with Google" action pinned top-right. */}
      <SectionComment label="HEADER — sticky nav + Google sign-in (top right)" />
      <header className="sticky top-0 z-30 border-b border-[#3e271a]/40 bg-[#0c0806]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Tyme home">
            <span data-header-logo className="flex">
              <BrandLogo size={34} showBackground={false} className="brightness-125" />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">Tyme</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[#ecd0b9]/70 md:flex">
            <a href="#features" className="transition-colors duration-150 ease hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors duration-150 ease hover:text-white">
              How it works
            </a>
            <a href="#faq" className="transition-colors duration-150 ease hover:text-white">
              FAQ
            </a>
          </nav>
          {/* Sign in with Google — top right */}
          <SignInButton variant="header" />
        </div>
      </header>

      <main className="relative z-10">
        {/* ===== Hero (section 1) =====
            Full-bleed looping video background (HeroVideoBackground) sits behind a
            constrained content column. The headline, sub-copy and CTAs reveal in a
            staggered ease-out cascade via <Reveal delay>, above the infinitely
            animating calendar preview. */}
        <SectionComment label="HERO (section 1) — video bg + headline, CTAs, looping calendar preview" />
        <section className="relative isolate overflow-hidden px-5 pt-16 pb-12 sm:px-8 sm:pt-24 sm:pb-16">
          {/* Looping ambient video backdrop — falls back to the espresso gradient
              until a clip is supplied, and is skipped entirely for reduced motion. */}
          <HeroVideoBackground />

          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#5e3820]/40 bg-[#2d1b11]/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#dda67a]">
                  Free • Built for freelancers &amp; virtual assistants
                </span>
              </Reveal>
              <Reveal delay={0.07}>
                <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
                  Track every billable hour on a{' '}
                  <span className="text-[#dda67a]">visual weekly calendar</span>.
                </h1>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[#ecd0b9]/75">
                  Tyme lets you log time by dropping entries onto a weekly grid, filter reports by
                  project, tag and date, and export branded PDF summaries your clients can trust.
                </p>
              </Reveal>
              <Reveal delay={0.21}>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <SignInButton variant="hero" />
                  <a
                    href="#features"
                    className="group inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-[#3e271a] bg-[#140d0a]/60 px-7 text-base font-semibold text-[#ecd0b9] transition duration-150 ease-out hover:border-[#5e3820] hover:bg-[#1a110c] active:scale-[0.97]"
                  >
                    Explore features
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                  </a>
                </div>
              </Reveal>
              <Reveal delay={0.28}>
                <p className="mt-5 font-mono text-xs text-[#ecd0b9]/40">
                  No credit card. No passwords — just your Google account.
                </p>
              </Reveal>
            </div>

            {/* App preview: animated weekly-calendar mock whose time-entry blocks
                pulse in an infinite, staggered wave (see CalendarPreview). */}
            <Reveal delay={0.18} className="mt-14 sm:mt-20">
              <CalendarPreview />
            </Reveal>
          </div>
        </section>

        {/* ===== Features (section 2) =====
            Cards reveal in a per-row stagger; each card lifts on hover and its
            icon scales up — all transform/opacity only, so it stays GPU-cheap. */}
        <SectionComment label="FEATURES (section 2) — feature cards with hover + reveal animation" />
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to bill with confidence
            </h2>
            <p className="mt-4 text-lg text-[#ecd0b9]/70">
              Purpose-built for the way freelancers and virtual assistants actually work.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productFeatures.map((feature, index) => {
              const Icon = featureIcons[feature.icon] ?? CalendarClock;
              return (
                <Reveal key={feature.title} delay={(index % 3) * 0.06}>
                  <article className="group h-full rounded-2xl border border-[#3e271a] bg-[#140d0a]/60 p-6 transition duration-150 ease-out hover:-translate-y-1 hover:border-[#5e3820] hover:bg-[#1a110c]/80 hover:duration-200">
                    {/* Icon springs up slightly when its card is hovered */}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#5e3820]/40 bg-[#2d1b11]/60 text-[#dda67a] transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#ecd0b9]/65">
                      {feature.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ===== How it works =====
            Three numbered steps (sign in → log time → export) that reveal with a
            left-to-right stagger. */}
        <SectionComment label="HOW IT WORKS — 3 steps: sign in, log time, export" />
        <section
          id="how-it-works"
          className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24"
        >
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From sign-in to invoice in three steps
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal as="li" key={step.title} delay={index * 0.08} className="relative">
                  <div className="h-full rounded-2xl border border-[#3e271a] bg-[#140d0a]/60 p-7">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5e3820]/50 bg-[#2d1b11]/60 font-mono text-sm font-bold text-[#dda67a]">
                        {index + 1}
                      </span>
                      <Icon className="h-5 w-5 text-[#dda67a]" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#ecd0b9]/65">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </section>

        {/* ===== FAQ =====
            Visible Q&A list rendered from the same faqItems array that feeds the
            FAQPage JSON-LD in layout.tsx, so the structured data and on-page copy
            stay in sync (required for FAQ rich results + AI answer engines / GEO). */}
        <SectionComment label="FAQ — visible Q&A mirrored by FAQPage JSON-LD (SEO + GEO)" />
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
          <Reveal className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Frequently asked questions
            </h2>
          </Reveal>
          <dl className="mt-10 space-y-4">
            {faqItems.map((item, index) => (
              <Reveal key={item.question} delay={(index % 3) * 0.05}>
                <div className="rounded-2xl border border-[#3e271a] bg-[#140d0a]/60 p-6">
                  <dt className="text-base font-semibold text-white">{item.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[#ecd0b9]/70">{item.answer}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </section>

        {/* ===== Final CTA =====
            Closing conversion band with a glow accent and a repeat of the Google
            sign-in button. */}
        <SectionComment label="FINAL CTA — closing conversion band + Google sign-in" />
        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-[#3e271a] bg-[#140d0a]/80 px-6 py-14 text-center sm:px-12 sm:py-20">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#9a6a42]/15 blur-[120px]"
              />
              <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Start tracking your time today
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-lg text-[#ecd0b9]/70">
                Join freelancers and virtual assistants who bill accurately and never lose an hour.
              </p>
              <div className="relative mt-8 flex justify-center">
                <SignInButton variant="hero" />
              </div>
              <p className="relative mt-5 font-mono text-xs text-[#ecd0b9]/40">
                Free for freelancers and virtual assistants.
              </p>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ===== Footer =====
            Brand mark, anchor nav, and copyright. */}
      <SectionComment label="FOOTER — brand, anchor nav, copyright" />
      <footer className="relative z-10 border-t border-[#3e271a]/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={28} showBackground={false} className="brightness-125" />
            <span className="font-semibold text-white">Tyme</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-[#ecd0b9]/55">
            <a href="#features" className="transition-colors duration-150 ease hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors duration-150 ease hover:text-white">
              How it works
            </a>
            <a href="#faq" className="transition-colors duration-150 ease hover:text-white">
              FAQ
            </a>
          </nav>
          <p className="font-mono text-xs text-[#ecd0b9]/40">© {year} Tyme</p>
        </div>
      </footer>
    </div>
    </IntroProvider>
  );
}
