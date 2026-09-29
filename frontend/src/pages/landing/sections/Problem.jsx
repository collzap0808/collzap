import { motion } from 'motion/react';
import { ArrowDown, Code2, Palette, Rocket, Users } from 'lucide-react';
import { lift, reveal, revealGroup, revealVariants, useReducedMotion } from '../../../lib/motion';
import SectionLabel from '../SectionLabel';

// The things students are actually looking for, in their own words.
const NEEDS = [
  'Need Project Teammates',
  'Need Startup Partners',
  'Need A Serious Study Group',
  'Looking for startup co-founder',
  'Want a serious study group',
  'Need coding partners',
  'Looking for creators & designers',
  'Want meaningful friendships',
];

// Fixed tilts rather than random ones: the board must look identical on every
// render, and hand-pinned paper is never more than a couple of degrees off.
const TILT = [-2.4, 1.6, -1.1, 2.1, -1.8, 1.2, -2.2, 1.5];

const TABS_PER_NOTE = 6;
const SCREWS = ['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'];

const CARDS = [
  {
    icon: Rocket,
    title: 'Startup Partners',
    lead: 'Hard to find ambitious builders.',
    body: 'Finding future co-founders and builders on campus is mostly luck.',
  },
  {
    icon: Code2,
    title: 'Project Teammates',
    lead: 'Talent rarely discovers talent.',
    body: 'Most talented students never discover each other.',
  },
  {
    icon: Users,
    title: 'Study Circles',
    lead: 'Most groups become inactive.',
    body: 'WhatsApp groups often become inactive and noisy. Need a study circle that actually studies.',
  },
  {
    icon: Palette,
    title: 'Creators & like-minded people',
    body: 'Shared interests rarely turn into meaningful connections.',
  },
];

/**
 * A hostel notice board where nobody has torn off a single tab.
 *
 * Every note carries the fringe of pull-tabs you see on a real campus board,
 * and every fringe is intact — which is the section's argument in one image:
 * plenty of people asking, none of them reached. That is why the tabs are
 * drawn as perforations rather than decoration; the point is that they are
 * uncut.
 *
 * It replaces a hand-drawn SVG "corridor" that did not survive contact with a
 * real screen: the perspective lines met mid-frame and read as a bowtie, the
 * doors floated free of any wall, and the lone student was a circle on a dome.
 *
 * The paper stays colour-literal in both themes — paper does not change colour
 * when the lights go off — and carries no brand accent. The gradient is saved
 * for the sections that answer this one.
 */
function NoticeBoard({ reduced }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-line bg-surface px-5 py-8 shadow-sm sm:px-10 sm:py-12"
      style={{
        backgroundImage: 'radial-gradient(rgba(125,145,175,0.16) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Board screws. */}
      {SCREWS.map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={`absolute ${pos} h-1.5 w-1.5 rounded-full bg-ink/15 ring-1 ring-ink/10`}
        />
      ))}

      <motion.ul
        {...revealGroup(reduced)}
        className="flex flex-wrap justify-center gap-5 sm:gap-6"
        aria-label="Notes students pin up looking for people, none of them answered"
      >
        {NEEDS.map((need, i) => (
          <motion.li
            key={need}
            variants={reduced ? undefined : revealVariants}
            whileHover={lift(reduced, -4)}
            style={{ rotate: `${TILT[i % TILT.length]}deg` }}
            className="relative flex h-[8.75rem] w-[10.5rem] items-center justify-center rounded-[3px] border border-black/10 bg-[#F4E2A6] px-4 pb-9 pt-7 text-center font-hand text-xl font-semibold leading-tight text-[#3A2F12] shadow-md sm:w-[11rem]"
          >
            {/* Pushpin. */}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#B8503A] shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            />

            {need}

            {/* The fringe of pull-tabs — perforated, and not one taken. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 flex h-7 border-t border-dashed border-black/25"
            >
              {Array.from({ length: TABS_PER_NOTE }).map((_, k) => (
                <span key={k} className="h-full flex-1 border-l border-black/15 first:border-l-0" />
              ))}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

/**
 * Deliberately colourless apart from the paper: no brand accent on the notes
 * or the cards. The first time the gradient really appears should be the
 * answer, not the problem.
 */
export default function Problem() {
  const reduced = useReducedMotion();

  return (
    <section id="problem" className="scroll-mt-20 border-b border-line bg-surface-2 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <motion.div {...reveal(reduced)} className="max-w-2xl">
          <SectionLabel>The problem</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tightest text-ink sm:text-4xl">
            Surrounded By Students. Still Can’t Find Your People.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-mute">
            Most college students never find people who truly share their interests and ambitions.
          </p>
          <p className="mt-4 text-base leading-relaxed text-mute">
            College campuses are full of opportunities, but most students never find the
            people who truly match their interests, ambitions, and goals.
          </p>
        </motion.div>

        <motion.div {...reveal(reduced, 0.08)} className="mt-12">
          <NoticeBoard reduced={reduced} />
        </motion.div>

        <motion.div {...revealGroup(reduced)} className="mt-14 grid gap-5 sm:grid-cols-2">
          {CARDS.map((card) => (
            <motion.article
              key={card.title}
              variants={reduced ? undefined : revealVariants}
              className="rounded-lg border border-line bg-surface p-7 shadow-sm"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink/[0.05] text-mute">
                <card.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-ink">
                {card.title}
              </h3>
              {card.lead && (
                <p className="mt-1.5 text-sm font-medium text-ink/70">{card.lead}</p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-mute">{card.body}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.p
          {...reveal(reduced, 0.1)}
          className="mt-14 max-w-2xl font-display text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl"
        >
          The problem isn’t a lack of people. It’s finding the right people.
        </motion.p>
        {/* The hand-off to How it works, which starts directly below. */}
        <motion.a
          {...reveal(reduced, 0.15)}
          href="#how"
          className="group mt-4 inline-flex max-w-2xl items-center gap-2 rounded-sm text-base leading-relaxed text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          CollZap turns that problem into a simple path to finding the right people.
          <ArrowDown className="h-4 w-4 shrink-0 text-accent-600 transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true" />
        </motion.a>
      </div>
    </section>
  );
}
