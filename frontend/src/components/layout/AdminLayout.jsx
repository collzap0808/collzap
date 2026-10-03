import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Logo from '../brand/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { snappy, transition, useReducedMotion } from '../../lib/motion';
import { useAuthStore } from '../../store/useAuthStore';

const navigation = [
  { name: 'Overview', href: '/admin' },
  { name: 'Analytics', href: '/admin/analytics' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Verifications', href: '/admin/verifications' },
  { name: 'Task reviews', href: '/admin/task-reviews' },
  { name: 'Applications', href: '/admin/applications' },
  { name: 'Matches', href: '/admin/matches' },
  { name: 'Queue', href: '/admin/queue' },
  { name: 'Reports', href: '/admin/reports' },
  { name: 'Feedback', href: '/admin/feedback' },
  { name: 'Colleges', href: '/admin/colleges' },
  { name: 'Interests', href: '/admin/interests' },
  { name: 'Questions', href: '/admin/questions' },
  { name: 'Task Banks', href: '/admin/task-banks' },
  { name: 'Sessions', href: '/admin/sessions' },
  { name: 'Certification', href: '/admin/certificates' },
  { name: 'Certificate claims', href: '/admin/certificate-claims' },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { logout, user } = useAuthStore();

  // A tap on a nav link changes the route; the drawer has to follow it out.
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  // Elements rather than components: a component declared inside render gets a
  // fresh identity every pass and would remount its subtree each time.
  const navLinks = (
      <nav className="flex-1 px-3" aria-label="Admin">
        <ul>
          {navigation.map((item) => {
            const isActive = item.href === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.href);
            return (
                <li key={item.name}>
                  <Link
                      to={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                          // Taller rows on a phone: these are thumb targets, not mouse targets.
                          'relative block rounded px-3 py-2.5 text-sm transition-colors md:py-2',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                          isActive
                              ? 'bg-ink/[0.05] font-semibold text-ink'
                              : 'text-mute hover:bg-ink/[0.03] hover:text-ink'
                      )}
                  >
                    {isActive && (
                        <span className="grad-brand absolute left-0 top-2 bottom-2 w-0.5 rounded-full" />
                    )}
                    {item.name}
                  </Link>
                </li>
            );
          })}
        </ul>
      </nav>
  );

  /**
   * Operator identity and the way out. Shared by the desktop rail and the
   * mobile drawer — before, it existed only in the rail, so on a phone there
   * was no way to sign out at all.
   */
  const sessionFooter = (
      <div className="mt-6 shrink-0 border-t border-line px-5 pt-4">
        {/* Admin JWTs are not refreshable; the interceptor logs out on 401. */}
        <p className="font-mono text-[9px] uppercase leading-relaxed tracking-widest text-mute">
          Operator session · 2 hours
        </p>
        {user?.name && (
            <p className="mt-1.5 truncate text-xs text-ink">{user.name}</p>
        )}
        <button
            onClick={handleLogout}
            className="mt-2 rounded-sm text-xs text-mute underline decoration-line underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          Sign out
        </button>
      </div>
  );

  return (
      <div className="flex h-[100dvh] overflow-hidden bg-paper">
        {/* ---------- mobile drawer ---------- */}
        <AnimatePresence>
          {mobileOpen && (
              <div className="relative z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition({ duration: 0.2 }, reduced)}
                    className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
                <motion.div
                    initial={reduced ? { opacity: 0 } : { x: '-100%' }}
                    animate={reduced ? { opacity: 1 } : { x: 0 }}
                    exit={reduced ? { opacity: 0 } : { x: '-100%' }}
                    transition={transition(snappy, reduced)}
                    className="fixed inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-line bg-paper pt-5 pb-4"
                >
                  <div className="flex shrink-0 items-center justify-between px-5">
                    <Logo className="h-6" />
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setMobileOpen(false)}
                        className="-mr-1 rounded p-1.5 text-mute hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Only the link list scrolls, so the footer stays reachable. */}
                  <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
                    {navLinks}
                  </div>

                  {sessionFooter}
                </motion.div>
              </div>
          )}
        </AnimatePresence>

        {/* ---------- desktop rail ---------- */}
        <div className="hidden border-r border-line bg-paper md:fixed md:inset-y-0 md:flex md:w-52 md:flex-col">
          <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
            <div className="flex items-center justify-between px-5">
              <Logo className="h-6" />
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-mute">Ops</span>
                <ThemeToggle className="-mr-1 h-7 w-7" />
              </div>
            </div>
            <div className="mt-7 flex flex-1 flex-col">
              {navLinks}
            </div>

            {sessionFooter}
          </div>
        </div>

        {/*
        `min-w-0` is load-bearing. A flex item defaults to `min-width: auto`,
        which floors it at its content's min-content width — so a wide admin
        table stretched this column past the viewport, the root's
        `overflow-hidden` clipped the excess, and the table's own
        `overflow-x-auto` never got a chance to scroll. Columns and row
        actions on the right simply could not be reached on a phone.
      */}
        <div className="flex min-w-0 flex-1 flex-col md:pl-52">
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-line bg-paper/90 px-3 py-2 backdrop-blur-md md:hidden">
            <button
                type="button"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
                className="-ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-mute hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* The rail carries the logo and theme toggle on desktop; on a phone
              this bar is the only chrome there is, so it carries them instead. */}
            <Link
                to="/admin"
                aria-label="Admin overview"
                className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Logo className="h-5" />
            </Link>

            <div className="flex shrink-0 items-center gap-1">
              {/* Decoration only — the narrowest phones need the width more. */}
              <span className="hidden font-mono text-[9px] uppercase tracking-widest text-mute sm:inline">
              Ops
            </span>
              <ThemeToggle className="h-9 w-9" />
            </div>
          </div>

          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
  );
}