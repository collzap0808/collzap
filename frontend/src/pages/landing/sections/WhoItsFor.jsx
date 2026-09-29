import { motion } from 'motion/react';
import { Code2, Dumbbell, GraduationCap, Megaphone, Palette, Rocket } from 'lucide-react';
import { LogoMark } from '../../../components/brand/Logo';
import { reveal, revealGroup, revealVariants, useReducedMotion } from '../../../lib/motion';
import SectionLabel from '../SectionLabel';
import { INTEREST_CHIPS } from '../shared';

const TYPES = [
  { icon: Rocket, name: 'Founders', line: 'Find co-founders and builders.' },
  { icon: Code2, name: 'Developers', line: 'Meet coding partners and teammates.' },
  { icon: Palette, name: 'Creators', line: 'Connect with creators and designers.' },
  { icon: GraduationCap, name: 'Learners', line: 'Join focused study circles.' },
  { icon: Dumbbell, name: 'Growth Seekers', line: 'Build habits and grow together.' },
  { icon: Megaphone, name: 'Community Builders', line: 'Lead, organize, and create impact.' },
];

// A thumb-cut in the pocket lip, so the card behind shows through the notch.
const THUMB_CUT =
  '[mask-image:radial-gradient(circle_18px_at_50%_0,transparent_97%,#000_100%)] ' +
  '[-webkit-mask-image:radial-gradient(circle_18px_at_50%_0,transparent_97%,#000_100%)]';

/**
 * Each audience is an ID sleeve with the card tucked inside — only its top
 * edge showing. Pointing at it, or tabbing to it, draws the card up out of the
 * pocket.
 *
 * The slide is a CSS transition rather than a spring on purpose: `group-hover`
 * and `group-focus-within` then drive the same movement, so it is never
 * mouse-only, and the global `prefers-reduced-motion` rule in index.css already
 * neutralises the duration.
 */
export default function WhoItsFor() {
  const reduced = useReducedMotion();

  return (
    <section id="who" className="scroll-mt-20 border-t border-line bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <motion.div {...reveal(reduced)} className="max-w-2xl">
          <SectionLabel>Who is CollZap for?</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tightest text-ink sm:text-4xl">
            Built For Students Who Want More From College.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-mute">
            Find people who share your interests, goals, and ambitions.
          </p>
        </motion.div>

        <motion.ul
          {...revealGroup(reduced)}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TYPES.map((t) => (
            <motion.li
              key={t.name}
              variants={reduced ? undefined : revealVariants}
              tabIndex={0}
              className="group relative h-52 overflow-hidden rounded-lg border border-line bg-surface-2 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-accent-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {/* The card in the sleeve. */}
              {/* `[@media(hover:none)]` is load-bearing: without it the line
                  below would exist only in a hover state a touch device can
                  never enter, and six lines of copy would be invisible on a
                  phone. Keyboard users get the same reveal via focus. */}
              <div className="absolute inset-x-4 top-4 z-0 translate-y-16 rounded-md border border-line bg-surface p-4 shadow-sm transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0 [@media(hover:none)]:translate-y-0">
                <LogoMark className="h-3.5" />
                <p className="mt-2.5 text-sm leading-relaxed text-mute">{t.line}</p>
              </div>

              {/* The pocket front, notched. */}
              <div
                className={`absolute inset-x-0 bottom-0 z-10 h-28 border-t border-line bg-surface-2 px-6 pt-5 ${THUMB_CUT}`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-50 text-accent-700">
                  <t.icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-2.5 font-display text-base font-bold tracking-tight text-ink">
                  {t.name}
                </h3>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div {...reveal(reduced, 0.08)} className="mt-12">
          <p className="font-mono text-[10px] uppercase tracking-widest text-mute">
            Interests you can pick
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {INTEREST_CHIPS.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-ink"
              >
                {chip}
              </li>
            ))}
            <li className="px-1.5 py-1.5 text-xs text-mute">and more…</li>
          </ul>
        </motion.div>

        <motion.p
          {...reveal(reduced, 0.12)}
          className="mt-14 max-w-2xl font-display text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl"
        >
          Your interests are different. Your circle should be too.
        </motion.p>
      </div>
    </section>
  );
}
