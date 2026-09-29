import { motion } from 'motion/react';
import {
  BadgeCheck, Briefcase, Building2, CreditCard, Flame, Landmark, Layers, Mail, Receipt, Sparkles, Target,
  TrendingUp, User, Users,
} from 'lucide-react';
import {
  reveal,
  revealGroup,
  revealVariants,
  useReducedMotion,
  viewportOnce,
} from '../../../lib/motion';
import SectionLabel from '../SectionLabel';
import Stamp from '../../../components/ui/Stamp';
import { INTEREST_CHIPS } from '../shared';
import { LEVELS as POTENTIAL_LEVELS } from '../../../lib/levels';

// The three levels shown on the landing. The in-app assessment is finer
// grained; this page deliberately shows only these three.
const LEVELS = [
  { name: 'Beginner', note: 'Connect with beginners' },
  { name: 'Intermediate', note: 'Connect with intermediate students' },
  { name: 'Advanced', note: 'Connect with advanced peers' },
];

// The three ways onboarding accepts proof of being a student — the same
// options (and hints) the upload step itself shows.
const VERIFY_OPTIONS = [
  { icon: Mail, label: 'College email', hint: 'Instant, with a one-time code' },
  { icon: CreditCard, label: 'Student ID card', hint: 'Name and year visible' },
  { icon: Receipt, label: 'Fee slip', hint: 'This term or last' },
];

const CIRCLE_TYPES = [
  { icon: User, label: '1-on-1 Partner' },
  { icon: Users, label: 'Small Group' },
  { icon: Building2, label: 'Community' },
  { icon: Landmark, label: 'Society' },
];

const MATCH_FACTORS = ['Same college', 'Shared interests', 'Similar level', 'Connection type'];

// Illustrative numbers, the same way the streak row and the email field are
// illustrative: they show the shape of the record, not anyone's real data.
const POTENTIAL_ROWS = [
  { label: 'Tasks completed', value: '12' },
  { label: 'Sessions', value: '6' },
  { label: 'Peer reviews', value: '8' },
  { label: 'Current streak', value: '4 days' },
];

const STEPS = [
  {
    icon: BadgeCheck,
    title: 'Verify Your College',
    lead: 'Connect only with students from your campus.',
    detail: 'Verify with your college email, student ID card, or fee slip so every connection is someone from your campus.',
    extra: 'verify',
  },
  {
    icon: Target,
    title: 'Choose Your Interests',
    lead: 'Select areas where you genuinely want to grow.',
    extra: 'chips',
  },
  {
    icon: Layers,
    title: 'Take A Seriousness Test',
    lead: 'Get matched with students at a similar commitment level.',
    detail: 'A short assessment helps us understand your current level and commitment.',
    extra: 'levels',
  },
  {
    icon: Users,
    title: 'Choose Your Circle',
    lead: 'Choose how you want to connect.',
    detail: 'Pick the kind of collaboration you want, from one steady partner to a whole society.',
    extra: 'circles',
  },
  {
    icon: Sparkles,
    title: 'Get Matched',
    lead: 'Meet students who share your interests and goals.',
    detail: 'Our matching system connects you with students who share similar interests, goals, and seriousness levels.',
    extra: 'match',
  },
  {
    icon: Flame,
    title: 'Stay Active, Every Day',
    lead: 'A new task lands in your chat each day — submit it, earn points, build a streak.',
    detail: 'Your circle reviews each other’s work on completion, quality, learning and effort, so you keep learning, collaborating and contributing long after the first hello.',
    extra: 'streak',
  },
  {
    icon: TrendingUp,
    title: 'Track Your Potential',
    lead: 'Your progress becomes a record of how you learn, build, and collaborate.',
    detail: 'CollZap tracks meaningful activity over time — including tasks completed, sessions, peer feedback, consistency, and collaboration.',
    extra: 'potential',
  },
  {
    icon: Briefcase,
    title: 'Unlock Placement Opportunities',
    lead: 'Keep building, and your record starts opening doors.',
    detail: 'Reach the Peak level and join the CollZap placement pool, where a verified record of tasks, reviews and consistency speaks for you alongside your CV.',
    extra: 'placement',
    soon: true,
  },
];

function StepExtra({ kind }) {
  if (kind === 'verify') {
    return (
      <div className="mt-4">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {VERIFY_OPTIONS.map((o, i) => (
            <li key={o.label} className="flex items-start gap-2.5 rounded border border-line bg-surface-2 px-3 py-2.5">
              <o.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-700" strokeWidth={1.8} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-ink">
                  {o.label}
                  {i > 0 && <span className="sr-only"> (alternative)</span>}
                </span>
                <span className="block text-[11px] text-mute">{o.hint}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-mute">Documents are checked by a real person and never shown to other students.</p>
      </div>
    );
  }

  if (kind === 'chips') {
    return (
      <ul className="mt-4 flex flex-wrap gap-2">
        {INTEREST_CHIPS.map((chip) => (
          <li key={chip} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-ink">
            {chip}
          </li>
        ))}
        <li className="px-1 py-1 text-xs text-mute">and more…</li>
      </ul>
    );
  }

  if (kind === 'levels') {
    return (
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {LEVELS.map((lvl, i) => (
          <li key={lvl.name} className="rounded border border-line bg-surface-2 px-3.5 py-2.5">
            <span className="flex items-center gap-2">
              {/* Rising bars: a level, not a grade. */}
              <span className="flex items-end gap-0.5" aria-hidden="true">
                {[0, 1, 2].map((b) => (
                  <span key={b} className={`w-1 rounded-sm ${b <= i ? 'bg-accent-500' : 'bg-line'}`} style={{ height: `${6 + b * 3}px` }} />
                ))}
              </span>
              <span className="font-display text-sm font-bold tracking-tight text-ink">{lvl.name}</span>
            </span>
            <span className="mt-0.5 block text-xs text-mute">{lvl.note}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (kind === 'circles') {
    return (
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CIRCLE_TYPES.map((c) => (
          <li key={c.label} className="flex items-center gap-2 rounded border border-line bg-surface-2 px-3 py-2.5">
            <c.icon className="h-4 w-4 shrink-0 text-accent-700" strokeWidth={1.8} aria-hidden="true" />
            <span className="text-xs font-semibold text-ink">{c.label}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (kind === 'match') {
    return (
      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded border border-line bg-surface-2 px-4 py-3 text-xs">
        {MATCH_FACTORS.map((f, i) => (
          <span key={f} className="inline-flex items-center gap-2">
            {i > 0 && <span className="font-mono text-accent-600" aria-hidden="true">+</span>}
            <span className="font-medium text-ink">{f}</span>
          </span>
        ))}
      </p>
    );
  }

  if (kind === 'streak') {
    return (
      <div className="mt-4 flex items-center gap-5 rounded border border-line bg-surface-2 px-4 py-3 text-sm text-ink">
        <span className="inline-flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-wait" aria-hidden="true" />
          <span><span className="font-semibold tnum">4</span>-day streak</span>
        </span>
        <span><span className="font-semibold tnum">65</span> pts total</span>
      </div>
    );
  }

  if (kind === 'potential') {
    return (
      <div className="mt-4 overflow-hidden rounded border border-line bg-surface-2">
        <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <dl className="divide-y divide-line px-4 py-1.5">
            {POTENTIAL_ROWS.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                <dt className="text-mute">{r.label}</dt>
                <dd className="font-semibold text-ink tnum">{r.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col justify-center gap-2.5 border-t border-line px-4 py-3.5 sm:border-l sm:border-t-0">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold text-ink">Growth</span>
              <span className="text-mute">built week by week</span>
            </div>
            {/* Upward, uneven steps — progress that comes from showing up, not a smooth promise. */}
            <div className="flex h-12 items-end gap-1" aria-hidden="true">
              {[18, 26, 24, 38, 46, 44, 60, 72, 70, 86].map((h, i) => (
                <span key={i} className="flex-1 rounded-sm bg-accent-500" style={{ height: `${h}%`, opacity: 0.35 + i * 0.065 }} />
              ))}
            </div>
          </div>
        </div>
        <p className="border-t border-line px-4 py-2.5 text-xs font-medium text-ink/85">
          Your potential is built through what you consistently do.
        </p>
      </div>
    );
  }

  if (kind === 'placement') {
    const peak = POTENTIAL_LEVELS.findIndex((l) => l.name === 'Peak');
    return (
      <div className="mt-4 rounded border border-line bg-surface-2 px-4 pb-3 pt-4">
        {/* The same six levels the in-app tracker uses, rising; Peak is where the pool opens. */}
        <ol className="grid grid-cols-6 items-end gap-1.5" aria-label="Levels of potential">
          {POTENTIAL_LEVELS.map((l, i) => {
            const isPeak = i === peak;
            const past = i >= peak;
            return (
              <li key={l.name} className="flex flex-col items-center gap-1.5">
                {isPeak && (
                  <span className="mb-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-accent-50 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700">
                    <Briefcase className="h-3 w-3" aria-hidden="true" /> <span className="hidden sm:inline">Placement pool</span><span className="sm:hidden">Pool</span>
                  </span>
                )}
                <span
                  className={`w-full rounded-sm ${past ? 'bg-accent-500' : 'bg-line'}`}
                  style={{ height: `${10 + i * 7}px`, opacity: past ? 1 : 0.9 }}
                  aria-hidden="true"
                />
                <span className={`text-[10px] leading-none ${isPeak ? 'font-semibold text-ink' : 'text-mute'}`}>{l.name}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 border-t border-line pt-2.5 text-xs text-ink/85">
          Seed → Sprout → Growing → Thriving → <span className="font-semibold">Peak</span>: your placement pool entry.
        </p>
      </div>
    );
  }

  return null;
}

// The cord's colour runs navy → blue → cyan across the whole journey, so each
// segment takes its slice of that ramp rather than repeating a full gradient.
const RAMP = [[11, 61, 145], [30, 136, 229], [0, 188, 212]];
function rampAt(t) {
  const seg = t <= 0.5 ? 0 : 1;
  const local = seg === 0 ? t / 0.5 : (t - 0.5) / 0.5;
  const [a, b] = [RAMP[seg], RAMP[seg + 1]];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * local)).join(',')})`;
}

export default function HowItWorks() {
  const reduced = useReducedMotion();
  const last = STEPS.length - 1;

  return (
    <section id="how" className="scroll-mt-20 bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <motion.div {...reveal(reduced)} className="max-w-2xl">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tightest text-ink sm:text-4xl">
            Find The Right People In 8 Simple Steps.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mute">
            CollZap helps students discover meaningful circles inside their own college.
          </p>
        </motion.div>

        <motion.ol {...revealGroup(reduced)} className="mt-12 max-w-3xl">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              variants={reduced ? undefined : revealVariants}
              className="relative flex gap-4 pb-9 last:pb-0 sm:gap-7"
            >
              {/* One segment per step, from this medallion down to the next —
                  so the line always meets every step and stops at the last,
                  however tall any step's content grows. */}
              {i < last && (
                <motion.span
                  aria-hidden="true"
                  className="absolute bottom-0 left-[21px] top-11 w-0.5 origin-top rounded-full"
                  style={{ background: `linear-gradient(${rampAt(i / last)}, ${rampAt((i + 1) / last)})`, opacity: 0.7 }}
                  initial={reduced ? false : { scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              )}

              {/* Medallion, clipped to the cord. */}
              <span className="relative z-10 shrink-0">
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-[-5px] h-2.5 w-4 -translate-x-1/2 rounded-sm border border-line bg-surface-2"
                />
                <span
                  className={`relative grid h-11 w-11 place-items-center rounded-lg border bg-surface shadow-sm ${
                    i === last ? 'border-accent-300 text-accent-600' : 'border-line text-accent-700'
                  }`}
                >
                  <step.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mute tnum">
                  Step {String(i + 1).padStart(2, '0')}
                  {step.soon && (
                    <span className="rounded-full border border-wait/40 bg-wait/10 px-1.5 py-px font-sans text-[10px] font-semibold normal-case tracking-normal text-wait">
                      Coming soon
                    </span>
                  )}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink/80">{step.lead}</p>
                {step.detail && <p className="mt-1.5 text-sm leading-relaxed text-mute">{step.detail}</p>}
                <StepExtra kind={step.extra} />
              </div>
            </motion.li>
          ))}
        </motion.ol>

        <motion.div {...reveal(reduced, 0.1)} className="mt-14">
          <Stamp
            tone="accent"
            rotate={-2.5}
            className="max-w-full whitespace-normal px-5 py-3 text-sm leading-relaxed tracking-[0.1em] sm:text-base"
          >
            Right College. Right Interests. Right People.
          </Stamp>
          <p className="mt-4 text-sm text-mute">Start with the right circle. Keep building with it.</p>
        </motion.div>
      </div>
    </section>
  );
}
