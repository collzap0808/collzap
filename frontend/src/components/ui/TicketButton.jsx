import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// Real cut-outs, not painted circles: whatever sits behind the button shows
// through the notches, so it works on any background.
const NOTCH = 5;
const cut = (side) => {
  const x = side === 'right' ? '100%' : '0';
  const m = `radial-gradient(circle ${NOTCH}px at ${x} 0, transparent 98%, #000 100%) top / 100% 51% no-repeat, radial-gradient(circle ${NOTCH}px at ${x} 100%, transparent 98%, #000 100%) bottom / 100% 51% no-repeat`;
  return { WebkitMask: m, mask: m };
};

// Two tones. `brand` follows the site's blue/white and the app theme (navbar,
// mobile bar); `hero` is the fixed navy-and-amber ticket that lives only in the
// hero's own palette and never changes with the theme.
const TONES = {
  brand: {
    body: 'bg-accent-500 text-white group-hover:bg-accent-600',
    dash: 'bg-[repeating-linear-gradient(to_bottom,rgb(255_255_255/0.4)_0_3px,transparent_3px_6px)]',
    stub: 'bg-accent-100 text-accent-700',
    ring: 'focus-visible:ring-accent-500 focus-visible:ring-offset-paper',
  },
  // The brand ticket with its light-theme colours pinned — for the navbar
  // while it floats over the (always light) hero.
  brandLight: {
    body: 'bg-[#0B63C9] text-white group-hover:bg-[#0A56AF]',
    dash: 'bg-[repeating-linear-gradient(to_bottom,rgb(255_255_255/0.4)_0_3px,transparent_3px_6px)]',
    stub: 'bg-[#DCEAFD] text-[#0B4FA3]',
    ring: 'focus-visible:ring-[#0B63C9] focus-visible:ring-offset-[#DEECFB]',
  },
  hero: {
    body: 'bg-[#0A1F44] text-[#F0F6FD] group-hover:bg-[#12305F]',
    dash: 'bg-[repeating-linear-gradient(to_bottom,rgb(240_246_253/0.35)_0_3px,transparent_3px_6px)]',
    stub: 'bg-[#FFB547] text-[#0A1F44]',
    ring: 'focus-visible:ring-[#FFB547] focus-visible:ring-offset-[#DEECFB]',
  },
};

/**
 * CollZap's own call-to-action: a ticket, not a pill. A body with the label, a
 * perforated tear line, and a stub carrying the arrow — the stub tilts on hover
 * like it's about to be torn off. Use it for the one primary action on a
 * surface (nav desk link, hero start), nowhere else.
 */
export default function TicketButton({ to, children, size = 'md', tone = 'brand', className, ...props }) {
  const big = size === 'lg';
  const t = TONES[tone] || TONES.brand;
  return (
    <Link
      to={to}
      className={cn(
        'group relative inline-flex select-none items-stretch rounded-[10px] font-semibold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        t.ring,
        className
      )}
      {...props}
    >
      <span
        style={cut('right')}
        className={cn(
          'relative flex flex-1 items-center justify-center rounded-l-[10px] transition-colors duration-200',
          t.body,
          big ? 'py-3.5 pl-5 pr-4 text-[15px]' : 'py-2 pl-3.5 pr-3 text-sm'
        )}
      >
        {children}
        {/* Perforation: a column of short dashes along the tear line. */}
        <span aria-hidden="true" className={cn('absolute inset-y-2 right-0 w-0.5', t.dash)} />
      </span>
      <span
        style={cut('left')}
        className={cn(
          'flex origin-left items-center justify-center rounded-r-[10px] transition-transform duration-300 ease-out group-hover:rotate-[5deg]',
          t.stub,
          big ? 'px-3.5' : 'px-2.5'
        )}
      >
        <ArrowUpRight className={big ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </Link>
  );
}
