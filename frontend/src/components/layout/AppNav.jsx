import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell, LayoutGrid, MessageSquare, PlayCircle, User, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { snappy, transition, useReducedMotion } from '../../lib/motion';
import { LogoMark } from '../brand/Logo';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { useNotificationStore } from '../../store/useNotificationStore';

/**
 * The app's navigation, as a single floating capsule rather than a bar that
 * frames the page: top-centre on desktop, bottom-centre on mobile where the
 * thumb is.
 *
 * Two details carry it. The active item sits inside a gradient pill that
 * *slides* between items via a shared `layoutId` — the same technique used by
 * Tabs and the onboarding stepper, so the motion matches the rest of the app.
 * And on mobile only the active item shows its label, expanding on a spring,
 * which keeps the capsule small without ever leaving you unsure where you are.
 *
 * Five primary destinations only. Everything else lives behind the avatar.
 */

// The `note` was the old sidebar's sub-line. It has nowhere to sit in a
// capsule, so it survives as the hover tooltip.
const NAV = [
  { name: 'Desk', href: '/home', icon: LayoutGrid, note: 'where you left off' },
  { name: 'Matches', href: '/matches', icon: Users, note: 'people, queued and found' },
  { name: 'Chat', href: '/chat', icon: MessageSquare, note: 'open threads' },
  { name: 'Sessions', href: '/sessions', icon: PlayCircle, note: 'mentor talks for your interests' },
  { name: 'Profile', href: '/profile', icon: User, note: 'what others see' },
];

// `/home` and `/profile` prefix other routes (/profile/:id), so they match exactly.
const EXACT = new Set(['/home', '/profile']);

function isActivePath(pathname, href) {
  return EXACT.has(href) ? pathname === href : pathname.startsWith(href);
}

const CAPSULE = 'rounded-full border border-line bg-surface/80 backdrop-blur-xl';

export default function AppNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  const { logout } = useAuthStore();
  const { profile } = useUserStore();
  const { unreadCount } = useNotificationStore();

  // The scroll container is AppShell's <main>, not the window.
  useEffect(() => {
    const el = document.getElementById('app-scroll');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    // logout() also disconnects the socket, dropping the notification queue.
    await logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { label: 'Your profile', onClick: () => navigate('/profile') },
    { label: 'Give feedback', onClick: () => navigate('/feedback') },
    { label: 'Settings', onClick: () => navigate('/settings') },
    // The way back out to the marketing page from inside the app.
    { label: 'Home page', onClick: () => navigate('/') },
    { label: 'Sign out', onClick: handleLogout, danger: true },
  ];

  const notificationsActive = location.pathname.startsWith('/notifications');

  const bell = (
    <Link
      to="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      aria-current={notificationsActive ? 'page' : undefined}
      className={cn(
        'relative grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
        notificationsActive ? 'text-accent-700' : 'text-mute hover:text-ink'
      )}
    >
      <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="grad-brand absolute right-1.5 top-1.5 block h-2 w-2 rounded-full ring-2 ring-surface" />
      )}
    </Link>
  );

  // `placement` differs by capsule: the desktop one hangs from the top of the
  // screen, the mobile one sits at the bottom, where a downward menu would
  // fall off-screen.
  const account = (placement) => (
    <Dropdown
      align="right"
      placement={placement}
      label="Account menu"
      trigger={
        <span className="block rounded-full">
          <Avatar name={profile?.name} src={profile?.profilePhotoUrl} size="sm" className="rounded-full" />
        </span>
      }
      items={menuItems}
    />
  );

  return (
    <>
      {/* ---------- desktop: floating at the top ---------- */}
      <nav
        aria-label="Main"
        className={cn(
          'fixed left-1/2 top-4 z-30 hidden -translate-x-1/2 items-center gap-1 py-1.5 pl-3 pr-1.5',
          'transition-shadow duration-300 md:flex',
          CAPSULE,
          scrolled ? 'shadow-lg' : 'shadow-soft'
        )}
      >
        <Link
          to="/home"
          aria-label="CollZap home"
          className="mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <LogoMark className="h-5" />
        </Link>

        <span aria-hidden="true" className="mr-1 h-5 w-px shrink-0 bg-line" />

        <ul className="flex items-center gap-0.5">
          {NAV.map((item) => {
            const active = isActivePath(location.pathname, item.href);
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  title={item.note || undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative block rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                    active ? 'text-white' : 'text-mute hover:text-ink'
                  )}
                >
                  {active && (
                    // Slides between items instead of blinking. The CTA ramp,
                    // not the full gradient: white label text needs 4.5:1.
                    <motion.span
                      layoutId="nav-active"
                      transition={transition(snappy, reduced)}
                      className="grad-brand-cta absolute inset-0 -z-10 rounded-full"
                    />
                  )}
                  <span className="relative">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line" />

        <div className="flex items-center gap-0.5">
          <ThemeToggle className="h-9 w-9 rounded-full" />
          {bell}
          {account('bottom')}
        </div>
      </nav>

      {/* ---------- mobile: floating at the bottom ---------- */}
      <nav
        aria-label="Main"
        className={cn(
          'fixed bottom-4 left-1/2 z-30 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2',
          'items-center gap-0 p-1 shadow-lg md:hidden',
          CAPSULE
        )}
      >
        {NAV.map((item) => {
          const active = isActivePath(location.pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-10 min-w-0 items-center gap-1.5 rounded-full px-2.5 transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                active ? 'text-white' : 'text-mute'
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-mobile"
                  transition={transition(snappy, reduced)}
                  className="grad-brand-cta absolute inset-0 -z-10 rounded-full"
                />
              )}
              <Icon className="relative h-[18px] w-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />
              {/* Only the active item spends space on a label. */}
              {active && (
                <motion.span
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  transition={transition(snappy, reduced)}
                  className="relative overflow-hidden whitespace-nowrap text-sm font-semibold"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}

        <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-line" />
        {bell}
        {account('top')}
      </nav>
    </>
  );
}
