"use client";

import { useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { CalendarDays, FileBarChart2, Settings, FileDown, TrendingUp, Clock } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import SignInButton from "../SignInButton";
import { useIntro } from "../IntroContext";

// ── Mock data for the "screenshot" — a faithful still of the Tyme weekly calendar ──
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = [23, 24, 25, 26, 27, 28, 29];
const HOURS = ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM"];

type Entry = { top: number; height: number; color: string; label: string };
const ENTRIES: Entry[][] = [
  [
    { top: 6, height: 26, color: "#dda67a", label: "Design review" },
    { top: 40, height: 20, color: "#3b82f6", label: "Standup" },
  ],
  [{ top: 18, height: 34, color: "#10b981", label: "Client work" }],
  [
    { top: 4, height: 18, color: "#ec4899", label: "Email" },
    { top: 30, height: 30, color: "#dda67a", label: "Build feature" },
  ],
  [{ top: 22, height: 40, color: "#f59e0b", label: "Deep work" }],
  [
    { top: 10, height: 22, color: "#8b5cf6", label: "Call · Acme" },
    { top: 44, height: 16, color: "#10b981", label: "Invoicing" },
  ],
  [{ top: 50, height: 14, color: "#3b82f6", label: "Admin" }],
  [],
];

const NAV = [
  { icon: CalendarDays, label: "Calendar", active: true },
  { icon: FileBarChart2, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

/**
 * The landing HERO: the product itself. A browser-framed screenshot of the Tyme
 * weekly calendar that plays a premium on-load entrance once the intro splash
 * finishes (gated on `introDone`, exactly like the old text hero): the heading
 * staggers up, the frame straightens out of a 3D tilt as it rises and fades in,
 * parallax accent cards float in from their sides, the colored time-entry blocks
 * stagger in, and the primary CTA reveals at the end. Under reduced motion (or
 * before the entrance plays) everything is shown in its final, static state, and
 * the heading + calendar grid are plain markup so they survive SSR / no-JS.
 */
export default function AppShowcase() {
  const reduce = useReducedMotion();
  const { introDone } = useIntro();
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const entryRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    // Reduced motion: render the final static state — never leave anything hidden.
    if (reduce) return;

    const heading = headingRef.current;
    const frame = frameRef.current;
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const entries = entryRefs.current.filter(Boolean) as HTMLDivElement[];

    const ctx = gsap.context(() => {
      // Prime the hidden start state up front so there's no flash of the final
      // layout before the intro splash finishes and the entrance plays.
      if (heading) gsap.set(heading.children, { y: 34, opacity: 0 });
      gsap.set(frame, { rotateX: 24, y: 90, scale: 0.92, opacity: 0, transformOrigin: "50% 0%" });
      gsap.set(cards, { opacity: 0, y: 60 });
      gsap.set(entries, { opacity: 0, scaleY: 0.55, transformOrigin: "50% 0%" });

      if (!introDone) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1) Heading copy staggers up + fades in.
      if (heading) {
        tl.to(heading.children, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 });
      }

      // 2) The frame "attaches": tilt → flat as it rises + fades in.
      tl.to(
        frame,
        { rotateX: 0, y: 0, scale: 1, opacity: 1, duration: 1, ease: "power4.out" },
        heading ? "-=0.35" : 0,
      );

      // 3) Colored time-entry blocks stagger in (grows from the top).
      if (entries.length) {
        tl.to(
          entries,
          { opacity: 1, scaleY: 1, duration: 0.5, stagger: 0.04, ease: "power2.out" },
          "-=0.55",
        );
      }

      // 4) Floating accent cards drift in from their alternating sides.
      if (cards.length) {
        cards.forEach((el, i) => {
          gsap.set(el, { x: i % 2 === 0 ? -40 : 40 });
        });
        tl.to(
          cards,
          { opacity: 1, x: 0, y: 0, duration: 0.7, stagger: 0.12, ease: "power2.out" },
          "-=0.7",
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [introDone, reduce]);

  return (
    <section
      ref={sectionRef}
      className='relative mx-auto flex min-h-[88vh] max-w-6xl scroll-mt-20 flex-col justify-center px-5 py-20 sm:px-8 sm:py-24'
    >
      <div ref={headingRef} className='mx-auto mb-12 max-w-2xl text-center sm:mb-16'>
        <h1 className='text-balance text-4xl font-bold tracking-tight text-white sm:text-6xl'>
          Every hour, exactly where you logged it
        </h1>
        <p className='mx-auto mt-4 max-w-xl text-lg text-[#ecd0b9]/70'>
          Drop entries onto the weekly grid, colour-code by project, and watch your billable total
          add up in real time.
        </p>
        <div className='pointer-events-auto mt-9 flex justify-center'>
          <SignInButton variant='hero' />
        </div>
      </div>

      {/* Glow + 3D stage. `pb`/`pt` give the tilted frame and the floating accent
          cards room to play without being clipped by the section. */}
      <div className='relative px-1 pb-10 pt-6 [perspective:1600px]'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9a6a42]/20 blur-[140px]'
        />

        {/* ── The screenshot ── */}
        <div
          ref={frameRef}
          className='relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#3e271a] bg-[#0f0a07] shadow-2xl shadow-[#4a2b16]/40 [transform-style:preserve-3d] will-change-transform'
        >
          {/* Browser chrome */}
          <div className='flex items-center gap-2 border-b border-[#3e271a]/60 bg-[#140d0a] px-4 py-3'>
            <span className='h-3 w-3 rounded-full bg-[#5e3820]/70' />
            <span className='h-3 w-3 rounded-full bg-[#5e3820]/50' />
            <span className='h-3 w-3 rounded-full bg-[#5e3820]/30' />
            <span className='ml-4 flex-1 truncate rounded-md bg-[#0c0806]/70 px-3 py-1 text-center font-mono text-[11px] text-[#ecd0b9]/40'>
              app.tyme / calendar
            </span>
          </div>

          {/* App body: sidebar + calendar */}
          <div className='flex'>
            {/* Sidebar */}
            <aside className='hidden w-44 shrink-0 flex-col border-r border-[#3e271a]/50 bg-[#0c0806] p-4 sm:flex'>
              <div className='mb-7 flex items-center gap-2'>
                <BrandLogo size={26} showBackground={false} className='brightness-125' />
                <span className='text-sm font-bold text-white'>Tyme</span>
              </div>
              <nav className='flex flex-col gap-1'>
                {NAV.map(({ icon: Icon, label, active }) => (
                  <span
                    key={label}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                      active ? "bg-[#2d1b11]/70 font-medium text-[#dda67a]" : "text-[#ecd0b9]/55"
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    {label}
                  </span>
                ))}
              </nav>
              <div className='mt-auto flex items-center gap-2 rounded-lg border border-[#3e271a]/60 p-2'>
                <span className='flex h-7 w-7 items-center justify-center rounded-full bg-[#2d1b11] text-xs font-bold text-[#dda67a]'>
                  N
                </span>
                <span className='truncate text-xs text-[#ecd0b9]/60'>Nadia C.</span>
              </div>
            </aside>

            {/* Calendar */}
            <div className='min-w-0 flex-1 p-4 sm:p-5'>
              {/* Week header */}
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <p className='font-mono text-[10px] uppercase tracking-widest text-[#ecd0b9]/40'>
                    This week
                  </p>
                  <p className='text-sm font-semibold text-white'>Jun 23-29</p>
                </div>
                <div className='rounded-lg border border-[#3e271a]/60 bg-[#140d0a] px-3 py-1.5 text-right'>
                  <p className='font-mono text-[10px] uppercase tracking-widest text-[#ecd0b9]/40'>
                    Total
                  </p>
                  <p className='text-sm font-bold text-[#dda67a]'>32h 30m</p>
                </div>
              </div>

              {/* Grid */}
              <div className='flex gap-2'>
                {/* Hour rail */}
                <div className='flex w-10 shrink-0 flex-col justify-between pb-2 pt-6 text-right'>
                  {HOURS.map((h) => (
                    <span key={h} className='font-mono text-[9px] text-[#ecd0b9]/30'>
                      {h}
                    </span>
                  ))}
                </div>
                {/* Day columns */}
                <div className='grid flex-1 grid-cols-7 gap-1.5'>
                  {DAYS.map((day, di) => (
                    <div key={day} className='flex min-w-0 flex-col'>
                      <div className='mb-1.5 text-center'>
                        <span className='block font-mono text-[9px] uppercase tracking-wider text-[#ecd0b9]/45'>
                          {day}
                        </span>
                        <span
                          className={`block text-[11px] font-semibold ${
                            di === 3 ? "text-[#dda67a]" : "text-[#ecd0b9]/70"
                          }`}
                        >
                          {DATES[di]}
                        </span>
                      </div>
                      <div
                        className={`relative h-40 rounded-lg border ${
                          di === 3
                            ? "border-[#5e3820]/60 bg-[#1a110c]/60"
                            : "border-[#3e271a]/40 bg-[#0c0806]/50"
                        }`}
                      >
                        {ENTRIES[di].map((e, ei) => (
                          <div
                            key={ei}
                            ref={(el) => {
                              // Flatten the ragged 2D entry grid into one ordered
                              // list so the entrance can stagger every block.
                              const flatIndex =
                                ENTRIES.slice(0, di).reduce((n, col) => n + col.length, 0) + ei;
                              entryRefs.current[flatIndex] = el;
                            }}
                            className='absolute inset-x-1 overflow-hidden rounded-md px-1.5 py-1 will-change-transform'
                            style={{
                              top: `${e.top}%`,
                              height: `${e.height}%`,
                              backgroundColor: e.color,
                            }}
                          >
                            <span className='block truncate text-[8px] font-semibold leading-tight text-black/70'>
                              {e.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Floating parallax accent cards ── */}
        <div
          ref={(el) => {
            cardRefs.current[0] = el;
          }}
          className='absolute -left-2 top-10 hidden rounded-2xl border border-[#3e271a] bg-[#140d0a]/90 p-3.5 shadow-xl shadow-black/40 backdrop-blur-md will-change-transform sm:flex sm:items-center sm:gap-3 lg:-left-10'
        >
          <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-[#2d1b11] text-[#dda67a]'>
            <TrendingUp className='h-4 w-4' />
          </span>
          <span>
            <span className='block font-mono text-[10px] uppercase tracking-wider text-[#ecd0b9]/45'>
              This week
            </span>
            <span className='block text-base font-bold text-white'>32.5h tracked</span>
          </span>
        </div>

        <div
          ref={(el) => {
            cardRefs.current[1] = el;
          }}
          className='absolute -right-2 top-1/3 hidden rounded-2xl border border-[#3e271a] bg-[#140d0a]/90 p-3.5 shadow-xl shadow-black/40 backdrop-blur-md will-change-transform sm:flex sm:items-center sm:gap-3 lg:-right-10'
        >
          <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-[#2d1b11] text-[#dda67a]'>
            <FileDown className='h-4 w-4' />
          </span>
          <span>
            <span className='block font-mono text-[10px] uppercase tracking-wider text-[#ecd0b9]/45'>
              One click
            </span>
            <span className='block text-base font-bold text-white'>PDF report ready</span>
          </span>
        </div>

        <div
          ref={(el) => {
            cardRefs.current[2] = el;
          }}
          className='absolute -bottom-5 left-1/4 hidden rounded-2xl border border-[#3e271a] bg-[#140d0a]/90 px-3.5 py-2.5 shadow-xl shadow-black/40 backdrop-blur-md will-change-transform sm:flex sm:items-center sm:gap-2.5'
        >
          <Clock className='h-4 w-4 text-[#dda67a]' />
          <span className='text-sm font-medium text-white'>Client call</span>
          <span className='font-mono text-xs text-[#ecd0b9]/50'>1:30</span>
        </div>
      </div>
    </section>
  );
}
