// Proof band — Tesla panels sell with numbers, not adjectives. Every tile is a
// verifiable product fact (no invented user counts or ratings). Server component
// on purpose: it's static markup, fully SSR-rendered and crawlable. The entrance
// animation is a Milestone 2 concern, so nothing is hidden here.

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: '1-click', label: 'Google sign-in' },
  { value: '2', label: 'Export formats · PDF + CSV' },
  { value: '₱0', label: 'Free forever' },
  { value: '7-day', label: 'Week view' },
];

export default function StatsBand() {
  return (
    <div className='mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4'>
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className='rounded-2xl border border-[#3e271a]/55 bg-[#130d0a]/35 p-6 text-center backdrop-blur-xl sm:p-7'
        >
          <p className='font-mono text-3xl font-bold tracking-tight text-[#dda67a] sm:text-4xl'>
            {stat.value}
          </p>
          <p className='mt-2 font-mono text-xs uppercase tracking-wider text-[#ecd0b9]/70'>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
