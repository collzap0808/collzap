import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { reveal, revealGroup, revealVariants, useReducedMotion } from '../../../lib/motion';
import SectionLabel from '../SectionLabel';
import Stamp from '../../../components/ui/Stamp';

// Each pair is: what exists today, and what it becomes here.
const PAIRS = [
  {
    platform: 'WhatsApp',
    from: 'Random Groups',
    to: 'Circles That Stay Active',
    limits: ['Random groups', 'No matching', 'No seriousness filtering', 'Groups become inactive'],
  },
  {
    platform: 'Instagram',
    from: 'Endless Scrolling',
    to: 'Meaningful Connections',
    limits: ['Endless scrolling', 'Entertainment focused', 'Difficult to find local like-minded students'],
  },
  {
    platform: 'LinkedIn',
    from: 'Generic Networking',
    to: 'Campus-Specific Matching',
    limits: ['Professional networking only', 'Not designed for campus communities', 'Limited student discovery'],
  },
];

const DIFFERENTIATORS = [
  'College-Specific Matching',
  'Interest-Based Circles',
  'Seriousness Assessment',
  'Daily Tasks & Streaks',
  '1-on-1, Small Groups & Societies',
  'Designed Exclusively for Students',
];

/**
 * The old app is a stamped sheet lying on top of the CollZap one. Pointing at
 * a pair peels the top sheet back from its top edge so the paper underneath
 * lifts into view.
 *
 * It peels rather than flips: both sheets stay readable at every moment, so no
 * copy is ever hidden behind a hover a touch user cannot perform.
 *
 * Platform names are text labels only — no trademarked marks.
 */
export default function WhyCollZap() {
  const reduced = useReducedMotion();

  return (
    <section id="why" className="scroll-mt-20 border-y border-line bg-surface-2 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <motion.div {...reveal(reduced)} className="max-w-2xl">
          <SectionLabel>Why CollZap?</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tightest text-ink sm:text-4xl">
            Not Another Social Network.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-mute">
            Most platforms help you consume content. CollZap helps you find the right people.
          </p>
        </motion.div>

        <motion.div {...revealGroup(reduced)} className="mt-14 grid gap-8 lg:grid-cols-3">
          {PAIRS.map((pair) => (
            <motion.div
              key={pair.platform}
              variants={reduced ? undefined : revealVariants}
              className="group relative [perspective:1200px]"
            >
              {/* The old sheet — stamped, and the one that lifts. */}
              <div className="relative z-10 origin-top rounded-lg border border-line bg-surface p-6 shadow-md transition-transform duration-300 ease-out group-hover:[transform:rotateX(-11deg)_translateY(-5px)]">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="secondary">{pair.platform}</Badge>
                  <Stamp tone="bad" rotate={-7} className="shrink-0 px-2 py-1 text-[9px]">
                    WRONG CIRCLE
                  </Stamp>
                </div>

                <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-mute">
                  {pair.from}
                </h3>
                <ul className="mt-4 space-y-2">
                  {pair.limits.map((limit) => (
                    <li key={limit} className="flex gap-2.5 text-sm leading-relaxed text-mute">
                      <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-mute/50" />
                      {limit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* The sheet underneath, tucked just past the bottom edge. */}
              <div className="grad-border relative z-0 -mt-2.5 rounded-lg">
                <div className="rounded-lg bg-surface px-6 pb-6 pt-8">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent-700">
                    CollZap
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-ink">
                    {pair.to}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.ul {...revealGroup(reduced)} className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIFFERENTIATORS.map((d) => (
            <motion.li
              key={d}
              variants={reduced ? undefined : revealVariants}
              className="flex items-start gap-3 rounded-lg border border-line bg-surface p-5 shadow-sm"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-50 text-accent-700">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium leading-snug text-ink">{d}</span>
            </motion.li>
          ))}
        </motion.ul>

        <motion.p
          {...reveal(reduced, 0.1)}
          className="mt-14 max-w-2xl font-display text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl"
        >
          We don’t help students collect followers. We help students find their circle.
        </motion.p>
      </div>
    </section>
  );
}
