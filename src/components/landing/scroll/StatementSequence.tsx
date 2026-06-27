'use client';

import StatementBlock from './StatementBlock';

// Sequential statements that reveal on scroll — the product story, told in
// big editorial beats. Rendered after the hero + calendar showcase.
const STATEMENTS = [
  {
    title: 'Every minute finds its thread.',
    body: 'Scattered, half-remembered work weaves into one clear, structured timeline.',
  },
  {
    title: 'Drag, drop, done.',
    body: 'Log time straight onto the weekly grid — tagged by client, project and task.',
  },
  {
    title: 'Totals you can trust.',
    body: 'Your hours tally into billable, exact reports — rounded the way you actually invoice.',
  },
  {
    title: 'Export proof in one click.',
    body: 'Branded PDF and CSV summaries your clients can rely on, every single time.',
    cta: true,
  },
];

/** The scrolling statement sequence — each beat reveals as it enters the viewport. */
export default function StatementSequence() {
  return (
    <>
      {STATEMENTS.map((s) => (
        <StatementBlock key={s.title} title={s.title} body={s.body} cta={s.cta} />
      ))}
    </>
  );
}
