import { Check } from 'lucide-react';
import { PrimaryCta, SecondaryCta } from './CtaButton';
import Reveal from './Reveal';

// Answers the cost objection before the FAQ has to: one price line, three honest
// inclusions, and the same dual CTA pair as the hero. No fabricated urgency or
// scarcity — the price story is simply "free". The copy is plain SSR markup (fully
// visible with no JS / under reduced motion); when motion is allowed the rows rise
// and fade in with a short stagger (Reveal), matching the proof band's rhythm.

const INCLUDED = [
  'Unlimited projects, tags, and time entries',
  'Filterable reports with branded PDF + CSV export',
  'Real-time sync and secure Google sign-in',
];

// One shared stagger step (≤0.08s) so every row enters just behind the one above it.
const STEP = 0.06;

export default function PricingPanel() {
  return (
    <div className='mx-auto w-full max-w-xl'>
      <div className='relative overflow-hidden rounded-3xl border border-[#3e271a] bg-[#140d0a]/70 px-6 py-10 text-center backdrop-blur-xl sm:px-10 sm:py-12'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#9a6a42]/15 blur-[110px]'
        />
        <Reveal>
          <p className='relative font-mono text-xs uppercase tracking-widest text-[#dda67a]'>
            A free Clockify alternative
          </p>
          <p className='relative mt-4 text-5xl font-bold tracking-tight text-white sm:text-6xl'>
            ₱0
          </p>
          <p className='relative mt-2 text-lg font-semibold text-[#ecd0b9]/85'>Free forever</p>
          <p className='relative mx-auto mt-3 max-w-sm text-sm text-[#ecd0b9]/70'>
            The full time tracking app for freelancers and virtual assistants — no credit card, no
            trial clock.
          </p>
        </Reveal>

        <ul className='relative mx-auto mt-8 flex max-w-sm flex-col gap-3 text-left'>
          {INCLUDED.map((item, index) => (
            <Reveal as='li' key={item} delay={STEP * (index + 1)} className='flex items-start gap-3'>
              <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2d1b11] text-[#dda67a]'>
                <Check className='h-3 w-3' />
              </span>
              <span className='text-sm text-[#ecd0b9]/85'>{item}</span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={STEP * (INCLUDED.length + 1)}>
          <div className='relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <PrimaryCta className='w-full sm:w-auto'>Start tracking free</PrimaryCta>
            <SecondaryCta href='#features' className='w-full sm:w-auto'>
              See the features
            </SecondaryCta>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
