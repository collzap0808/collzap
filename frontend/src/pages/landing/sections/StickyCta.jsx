import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import TicketButton from '../../../components/ui/TicketButton';
import { snappy, transition, useReducedMotion } from '../../../lib/motion';
import { usePrimaryCta } from '../shared';

/**
 * Mobile-only bottom bar. The page has no closing CTA band, so on a phone —
 * where the header CTA scrolls away and the footer is a long way down — this
 * keeps signing up one tap away. Appears once the hero is behind you.
 */
export default function StickyCta() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotion();
  const cta = usePrimaryCta();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={transition(snappy, reduced)}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/90 px-4 py-3 backdrop-blur-lg md:hidden"
        >
          <div className="flex items-center gap-3">
            <Link to="/login" className="shrink-0 rounded px-2 py-2 text-sm font-medium text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
              Log in
            </Link>
            <TicketButton to={cta.to} size="lg" className="flex-1">{cta.label}</TicketButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
