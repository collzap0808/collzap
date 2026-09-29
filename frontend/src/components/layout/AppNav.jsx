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
          <a
            href="https://wa.me/message/7PTO3UAO6OO2M1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Customer Care on WhatsApp"
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
              'text-mute hover:text-ink'
            )}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </a>
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
        <a
          href="https://wa.me/message/7PTO3UAO6OO2M1"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Customer Care on WhatsApp"
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            'text-mute hover:text-ink'
          )}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
        </a>
        {bell}
        {account('top')}
      </nav>
    </>
  );
}
