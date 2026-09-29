import { useAuthStore } from '../../store/useAuthStore';

/**
 * The landing is reachable signed in or out, so the primary call to action has
 * to change: pitching "Get started" at someone who already has an account is
 * noise. Targets mirror OnboardingGuard's own rules so the CTA never lands on
 * a route that immediately redirects.
 *
 * Every CTA on the page goes through this — never a hardcoded `/signup`.
 */
export function usePrimaryCta() {
  const { isAuthenticated, user, nextStep } = useAuthStore();

  if (!isAuthenticated) return { to: '/signup', label: 'Get started' };
  if (user?.isAdmin) return { to: '/admin', label: 'Open the console' };

  const canAccessApp = !nextStep || nextStep === 'READY' || nextStep === 'AWAITING_VERIFICATION';
  return canAccessApp
    ? { to: '/home', label: 'Go to your desk' }
    : { to: '/onboarding', label: 'Finish setting up' };
}

/**
 * The landing page's own sections, grouped under the header's "Home" dropdown
 * rather than sitting as flat top-level items — they're anchors on ONE page,
 * not destinations of their own, so they read better as "things on the
 * homepage" than as peers of Blog/About/FAQ.
 *
 * Rooted at "/" rather than bare "#who" because the header renders on /about,
 * /faq, /blog etc too, where a bare hash would resolve against the current
 * page and go nowhere. Each hash must match an `id` on a landing section.
 */
export const HOME_SECTIONS = [
  { href: '/#problem', label: 'The problem' },
  { href: '/#how', label: 'How it works' },
  { href: '/#who', label: "Who it's for" },
  { href: '/#why', label: 'Why CollZap' },
  { href: '/#momentum', label: 'After the match' },
];

/** Standalone pages, shown as their own top-level header items. */
export const NAV_PAGES = [
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/bring-collzap', label: 'Add Your College' },
];

/**
 * The interest catalogue as it appears in the product. Used as tags in two
 * places — the "who it's for" section and step 2 of how-it-works — so it lives
 * here rather than being typed twice.
 */
export const INTEREST_CHIPS = [
  'Startups',
  'Coding',
  'AI / ML',
  'Design',
  'Finance',
  'Fitness',
  'Marketing',
  'Content Creation',
];
