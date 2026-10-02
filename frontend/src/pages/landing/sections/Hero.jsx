import { motion } from 'motion/react';
import TicketButton from '../../../components/ui/TicketButton';
import { reveal, useReducedMotion } from '../../../lib/motion';
import { usePrimaryCta } from '../shared';
import CampusHubSketch from './hero/CampusHubSketch';

// Hero-only palette (Ice & Amber), fixed tokens on `.hero-sky` — never follows the app theme.
const ink = 'text-[rgb(var(--h-ink))]';
const mute = 'text-[rgb(var(--h-mute))]';

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

  return (
    <section className="hero-sky relative flex min-h-[100svh] flex-col overflow-hidden border-b border-[rgb(var(--h-line))] bg-[linear-gradient(180deg,#D3E6FA_0%,rgb(var(--h-bg))_48%,#EAF3FD_100%)] pt-20 sm:pt-24">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-8">
        <div className="grid flex-1 items-center gap-6 py-4 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-2">
          <div className="relative lg:pr-2">
            <motion.p
              {...reveal(reduced)}
              className="inline-block -rotate-1 font-hand text-[19px] leading-none text-[rgb(var(--h-accent-strong))] opacity-80"
            >
              For students who want more from college
            </motion.p>

            {/* One conversation, not three slogans: the first thought leads, the next two
                follow a step quieter and closer together, ending on the blue "grow" note. */}
            <motion.h1
              {...reveal(reduced, 0.05)}
              className={`mt-4 max-w-[480px] font-display font-bold tracking-[-0.03em] ${ink} [text-wrap:pretty]`}
            >
              <span className="block text-[34px] leading-[1.1] sm:text-[42px] lg:text-[38px] xl:text-[42px]">
                Want to find{' '}
                <span className="relative inline-block">
                  people
                  <svg
                    className="absolute -bottom-[0.12em] left-[-2%] h-[0.26em] w-[104%] overflow-visible"
                    viewBox="0 0 220 26"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 16 C 50 9, 118 7, 214 11 M36 22 C 80 17, 140 16, 190 19"
                      fill="none"
                      stroke="rgb(var(--h-hi))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </span>{' '}
                who share your interests?
              </span>
              <span className="mt-4 block text-[20px] font-semibold leading-[1.3] tracking-[-0.02em] opacity-85 sm:text-[26px] lg:text-[24px] xl:text-[26px]">
                Want to build something <span className="font-bold">meaningful</span>?
              </span>
              <span className="mt-1 block text-[20px] font-semibold leading-[1.3] tracking-[-0.02em] text-[rgb(var(--h-accent-strong))] sm:text-[26px] lg:text-[24px] xl:text-[26px]">
                Ready to take your <span className="font-bold">passion</span> further?
              </span>
            </motion.h1>

            <motion.p
              {...reveal(reduced, 0.1)}
              className={`mt-6 max-w-[470px] text-[16.5px] leading-[1.65] ${mute}`}
            >
              CollZap helps you discover students from your own campus who share your interests, goals and
              curiosity — so you can make friends, try new things, build projects and grow together.
            </motion.p>

            {/* Button and link sit side by side, the arrow pointing back at the button. Only
                on the narrowest phones does the link drop underneath, arrow leading into it. */}
            <motion.div
              {...reveal(reduced, 0.15)}
              className="mt-8 flex flex-col items-start gap-3 min-[385px]:flex-row min-[385px]:items-center min-[385px]:gap-4 sm:gap-6"
            >
              <TicketButton to={cta.to} size="lg" tone="hero">
                Let’s Begin
              </TicketButton>
              <a
                href="#how"
                className={`group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm font-hand text-[19px] leading-none ${ink} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--h-accent))] sm:text-xl`}
              >
                <PenArrow className="h-4 w-7 shrink-0 transition-transform group-hover:translate-x-0.5 min-[385px]:-scale-x-100 min-[385px]:group-hover:-translate-x-0.5 sm:h-5 sm:w-8" />
                take the first step
              </a>
            </motion.div>
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
            <span key={s} className={`hidden sm:inline ${i === STORY.length - 1 ? 'text-[rgb(var(--h-accent-strong))]' : ''}`}>
              {s}
            </span>
          ))}
          {/* Phones show only this line; tablets only the four words; desktop both. */}
          <span className={`font-hand text-lg font-normal tracking-normal sm:hidden lg:ml-auto lg:inline ${mute}`}>
            who you meet shapes what you experience
          </span>
        </p>
      </div>
    </section>
  );
}
