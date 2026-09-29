import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { snappy, transition, useReducedMotion } from '../../lib/motion';

const PANEL = {
  left: 'inset-y-0 left-0 w-[min(22rem,88vw)] border-r',
  right: 'inset-y-0 right-0 w-[min(24rem,92vw)] border-l',
  bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t',
};

const OFFSET = {
  left: { x: '-100%' },
  right: { x: '100%' },
  bottom: { y: '100%' },
};

/**
 * The chat's secondary panes below desktop width: the thread list slides in
 * from the left, the workspace from the right on tablets and up from the bottom
 * on phones. Escape and the scrim both close it; focus moves into the panel.
 */
export default function ChatDrawer({ open, onClose, side = 'left', title, children }) {
  const reduced = useReducedMotion();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40">
          <motion.div
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : OFFSET[side]}
            animate={reduced ? { opacity: 1 } : { x: 0, y: 0 }}
            exit={reduced ? { opacity: 0 } : OFFSET[side]}
            transition={transition(snappy, reduced)}
            className={cn('absolute flex flex-col border-line bg-surface shadow-lg focus:outline-none', PANEL[side])}
          >
            {side === 'bottom' && <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line" aria-hidden="true" />}
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-3">
              <h2 className="font-display text-base font-bold tracking-tight text-ink">{title}</h2>
              <button
                onClick={onClose}
                aria-label={`Close ${title}`}
                className="grid h-8 w-8 place-items-center rounded-md text-mute transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
