import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, Landmark, User, Users } from 'lucide-react';
import { reveal, revealGroup, revealVariants, useReducedMotion } from '../../../lib/motion';
import { cn } from '../../../lib/utils';
import SectionLabel from '../SectionLabel';

/**
 * The three circle types — the product's three connection shapes and nothing
 * else: ONE_ON_ONE (exactly 2), SHORT_GROUP (up to 4), SOCIETY (open-ended).
 */
const CIRCLES = [
  {
    key: 'pair',
    icon: User,
    name: '1-on-1 Partner',
    scale: '2 students',
    body: 'Work closely with one matched peer through a private collaboration.',
    bestFor: ['Focused learning', 'Project collaboration', 'Accountability'],
    visual: 'pair',
    visualLabel: 'You ↔ Peer',
    cta: 'Explore 1-on-1',
    start: 'a 1-on-1 Partner',
  },
  {
    key: 'group',
    icon: Users,
    name: 'Small Group',
    scale: 'Up to 4 students',
    body: 'Learn, build, or solve problems together with a small group of peers.',
    bestFor: ['Projects', 'Study groups', 'Hackathons'],
    visual: 'group',
    visualLabel: 'You + 3 peers',
    cta: 'Explore groups',
    start: 'a Small Group',
  },
  {
    key: 'society',
    icon: Landmark,
    name: 'Society',
    scale: 'Larger community',
    body: 'Join a larger student community around an interest, activity, or shared goal.',
    bestFor: ['Clubs & societies', 'Events', 'Networking', 'Community activities'],
    visual: 'society',
    visualLabel: 'You + many students',
    cta: 'Explore societies',
    start: 'a Society',
  },
];

const COMPARE = [
  { name: '1-on-1', note: 'Deep collaboration' },
  { name: 'Small Group', note: 'Build together' },
  { name: 'Society', note: 'Join a community' },
];

/** "You" is solid; everyone else is an outline — scale reads without colour alone. */
function Dot({ you, small }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full',
        small ? 'h-3 w-3' : 'h-5 w-5',
        you ? 'bg-accent-500 ring-2 ring-accent-500/25' : 'border-[1.5px] border-accent-400/70 bg-surface'
      )}
    />
  );
}

function ScaleVisual({ kind }) {
  if (kind === 'pair') {
    return (
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <Dot you />
        <span className="h-px w-6 bg-accent-400/70" />
        <Dot />
      </span>
    );
  }
  if (kind === 'group') {
    return (
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <Dot you />
        <Dot />
        <Dot />
        <Dot />
      </span>
    );
  }
  // A loose cluster — more than you could count at a glance, on purpose.
  return (
    <span className="grid grid-cols-8 gap-1" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => <Dot key={i} you={i === 0} small />)}
    </span>
  );
}

export default function Circles() {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(null);
  const chosen = CIRCLES.find((c) => c.key === selected);

  return (
    <section id="circles" className="scroll-mt-20 border-t border-line bg-surface-2 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <motion.div {...reveal(reduced)} className="max-w-2xl">
          <SectionLabel>Choose your circle type</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tightest text-ink sm:text-4xl">
            Choose Your Circle.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mute">
            Choose how you want to connect, collaborate, and grow with students on your campus.
          </p>
        </motion.div>

        {/* A single-choice group: pick one to see how you'd start. */}
        <motion.div
          {...revealGroup(reduced)}
          role="radiogroup"
          aria-label="Circle type"
          className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5"
        >
          {CIRCLES.map((c, i) => {
            const on = selected === c.key;
            return (
              <motion.button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSelected(on ? null : c.key)}
                variants={reduced ? undefined : revealVariants}
                className={cn(
                  'group relative flex h-full flex-col rounded-xl border p-6 text-left shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2',
                  on
                    ? 'border-accent-500 bg-accent-50/60 shadow-md'
                    : 'border-line bg-surface hover:-translate-y-0.5 hover:border-accent-300 hover:bg-accent-50/30 hover:shadow-md'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn('grid h-10 w-10 place-items-center rounded-lg', on ? 'bg-accent-500 text-white' : 'bg-accent-50 text-accent-700')}>
                    <c.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="flex items-center gap-2">
                    {on && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" /> Selected
                      </span>
                    )}
                    <span className="font-mono text-xs text-mute tnum" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  </span>
                </div>

                <h3 className="mt-5 font-display text-[22px] font-bold leading-tight tracking-tight text-ink">{c.name}</h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-accent-700">{c.scale}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-mute">{c.body}</p>

                <div className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-surface-2/60 px-3 py-2.5">
                  <ScaleVisual kind={c.visual} />
                  <span className="text-xs font-medium text-ink/85">{c.visualLabel}</span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-ink">Best for</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {c.bestFor.map((b) => (
                      <li key={b} className="rounded-full border border-line px-2.5 py-0.5 text-[13px] text-ink/85">{b}</li>
                    ))}
                  </ul>
                </div>

                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-accent-700">
                  {c.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div {...reveal(reduced, 0.05)} className="mt-6 flex flex-col gap-4 rounded-xl border border-line bg-surface px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
            <p className="text-sm font-semibold text-ink">Not sure which one?</p>
            <ul className="flex flex-col gap-1 text-sm text-mute sm:flex-row sm:flex-wrap sm:gap-x-5">
              {COMPARE.map((c) => (
                <li key={c.name}>
                  <span className="font-medium text-ink">{c.name}</span> <span aria-hidden="true">→</span>
                  <span className="sr-only">:</span> {c.note}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to="/signup"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:self-auto"
          >
            {chosen ? `Start with ${chosen.start}` : 'Get started'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.div {...reveal(reduced, 0.1)} className="mt-14 max-w-2xl">
          <p className="font-display text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">
            Start with the circle that fits you. Keep learning, building, and growing together.
          </p>
          <p className="mt-2 text-sm text-mute">
            Your circle stays active through conversations, activities, and shared progress.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
