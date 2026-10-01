import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import TicketButton from '../../../components/ui/TicketButton';
import { reveal, useReducedMotion } from '../../../lib/motion';
import { usePrimaryCta } from '../shared';
import CampusHubSketch from './hero/CampusHubSketch';

// Hero-only palette (Ice & Amber), fixed tokens on `.hero-sky` — never follows the app theme.
const ink = 'text-[rgb(var(--h-ink))]';
const mute = 'text-[rgb(var(--h-mute))]';

const TRUST = ['Verified students', 'Same-campus connections', 'Safe & focused community'];

// The CollZap experience in four plain sentences — an editorial line, not a progress bar.
const STORY = ['Find people.', 'Try things.', 'Build together.', 'Grow.'];

/** A small hand-drawn arrow, for the margin notes. */
function PenArrow({ className }) {
  return (
    <svg viewBox="0 0 50 30" className={className} fill="none" aria-hidden="true">
      <path d="M4 4 C 14 18, 28 24, 44 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M36 14 L45 20 L36 25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();
  const cta = usePrimaryCta();
  const isGuest = cta.to === '/signup';

  return (
    <section className="hero-sky relative flex min-h-[100svh] flex-col overflow-hidden border-b border-[rgb(var(--h-line))] bg-[linear-gradient(180deg,#D3E6FA_0%,rgb(var(--h-bg))_48%,#EAF3FD_100%)] pt-20 sm:pt-24">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-8">
        <div className="grid flex-1 items-center gap-6 py-4 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-2">
          <div className="relative lg:pr-2">
            <motion.p {...reveal(reduced)} className={`inline-block -rotate-2 font-hand text-[22px] leading-none ${mute}`}>
              for students who want more from college
            </motion.p>

            <motion.h1
              {...reveal(reduced, 0.05)}
              className={`mt-4 font-display text-[40px] font-semibold leading-[1.04] tracking-[-0.04em] ${ink} sm:text-[50px] xl:text-[54px]`}
            >
              Find your{' '}
              <span className="relative inline-block">
                people.
                <svg
                  className="absolute -bottom-[0.14em] left-[-2%] h-[0.3em] w-[104%] overflow-visible"
                  viewBox="0 0 220 26"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 16 C 50 9, 118 7, 214 11 M36 22 C 80 17, 140 16, 190 19"
                    fill="none"
                    stroke="rgb(var(--h-hi))"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </span>
              <br />
              <span className="font-medium italic text-[rgb(var(--h-accent-strong))]">Grow through college.</span>
            </motion.h1>

            <motion.p {...reveal(reduced, 0.1)} className={`mt-6 max-w-[430px] text-[17px] leading-relaxed ${mute}`}>
              CollZap helps verified students discover like-minded people from their own campus for friendships,
              projects, learning and growth.
            </motion.p>

            <motion.div {...reveal(reduced, 0.15)} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <TicketButton to={cta.to} size="lg" tone="hero">
                Find my circle
              </TicketButton>
              <a
                href="#how"
                className={`group flex items-center gap-1 rounded-sm font-hand text-xl leading-none ${ink} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--h-accent))]`}
              >
                <PenArrow className="h-5 w-8 -scale-x-100 transition-transform group-hover:-translate-x-0.5" />
                see how it works
              </a>
            </motion.div>

            <motion.ul {...reveal(reduced, 0.2)} className={`mt-6 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] ${mute}`}>
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[rgb(var(--h-accent))]" strokeWidth={2.6} aria-hidden="true" />
                  {t}
                </li>
              ))}
            </motion.ul>
            {isGuest && (
              <motion.p {...reveal(reduced, 0.22)} className={`mt-2 text-xs ${mute} opacity-80`}>
                Any email works to start. You&rsquo;ll verify your college next.
              </motion.p>
            )}
          </div>

          {/* The illustration gets the room: wider than its column, bleeding toward the edge on large screens. */}
          <motion.div
            {...reveal(reduced, 0.12)}
            className="-mx-4 w-[calc(100%+2rem)] max-w-[720px] sm:mx-auto sm:w-full lg:-mr-8 lg:ml-0 lg:w-[110%] lg:max-w-none xl:-mr-12 xl:w-[113%] min-[1400px]:-mr-32 min-[1400px]:w-[126%] 2xl:-mr-40"
          >
            <CampusHubSketch className="h-auto w-full" />
          </motion.div>
        </div>

        {/* The experience, said plainly */}
        {/* Plain, not scroll-revealed: it sits in the bottom band of the first
            screen, where an in-view trigger would never fire until you scroll. */}
        <p
          className={`flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-[rgb(var(--h-line))] py-5 font-display text-lg font-semibold tracking-[-0.02em] sm:text-xl ${ink}`}
        >
          {STORY.map((s, i) => (
            <span key={s} className={i === STORY.length - 1 ? 'text-[rgb(var(--h-accent-strong))]' : undefined}>
              {s}
            </span>
          ))}
          <span className={`ml-auto hidden font-hand text-lg font-normal tracking-normal lg:inline ${mute}`}>
            who you meet shapes what you experience
          </span>
        </p>
      </div>
    </section>
  );
}
