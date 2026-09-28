import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import { useThemeStore } from './store/useThemeStore';
import LandingPage from './pages/landing/LandingPage';

// Layouts & Guards
import PublicLayout from './components/layout/PublicLayout';
import AppShell from './components/layout/AppShell';
import OnboardingLayout from './components/layout/OnboardingLayout';
import AdminLayout from './components/layout/AdminLayout';
import AuthGuard from './components/guards/AuthGuard';
import OnboardingGuard from './components/guards/OnboardingGuard';
import AdminGuard from './components/guards/AdminGuard';
import Spinner from './components/ui/Spinner';

// Pages (Lazy Loaded)
//
// LandingPage is the exception, imported eagerly at the top of this file. The
// original reason was a race — a lazy chunk left a window where only the
// noindex default Helmet existed, and Google's live render snapshotted exactly
// that window — which no longer applies now that robotsFor() below emits a
// single tag synchronously. It stays eager because it is the marketing entry
// point and ships prerendered: making it lazy would put a chunk round-trip
// between the prerendered paint and React taking over on the busiest public
// route.
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BlogIndexPage = lazy(() => import('./pages/BlogIndexPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const BringCollZapPage = lazy(() => import('./pages/BringCollZapPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));

const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));

const HomePage = lazy(() => import('./pages/home/HomePage'));
const ChatShell = lazy(() => import('./pages/chat/ChatShell'));
const ChatEmptySelection = lazy(() => import('./pages/chat/ChatEmptySelection'));
const ChatRoomPage = lazy(() => import('./pages/chat/ChatRoomPage'));
const MatchesPage = lazy(() => import('./pages/matches/MatchesPage'));
const GroupDetailPage = lazy(() => import('./pages/matches/GroupDetailPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const PeerProfilePage = lazy(() => import('./pages/profile/PeerProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const FeedbackPage = lazy(() => import('./pages/feedback/FeedbackPage'));
const SessionsPage = lazy(() => import('./pages/sessions/SessionsPage'));
const SessionDetailPage = lazy(() => import('./pages/sessions/SessionDetailPage'));
const SeriousnessTestPage = lazy(() => import('./pages/test/SeriousnessTestPage'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminVerificationsPage = lazy(() => import('./pages/admin/AdminVerificationsPage'));
const AdminMatchesPage = lazy(() => import('./pages/admin/AdminMatchesPage'));
const AdminQueuePage = lazy(() => import('./pages/admin/AdminQueuePage'));
const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const AdminFeedbackPage = lazy(() => import('./pages/admin/AdminFeedbackPage'));
const AdminCollegesPage = lazy(() => import('./pages/admin/AdminCollegesPage'));
const AdminInterestsPage = lazy(() => import('./pages/admin/AdminInterestsPage'));
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage'));
const AdminTaskBanksPage = lazy(() => import('./pages/admin/AdminTaskBanksPage'));
const AdminSessionsPage = lazy(() => import('./pages/admin/AdminSessionsPage'));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Global Suspense Fallback
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-paper text-accent-500">
    <Spinner size="lg" />
  </div>
);

// The one and only place `<meta name="robots">` is ever rendered. It used to
// be split across this file's own default and each public page's Helmet
// override, on the assumption that react-helmet-async would dedupe same-name
// meta tags and let the page-level one win. In practice both tags land in
// the DOM simultaneously (confirmed via Google Search Console's live test:
// "noindex" and "index, follow" both present), and Google's own rule for
// conflicting robots directives is to apply the most restrictive one — so
// the noindex always won, and the homepage silently failed indexing.
// Computing it once, here, from the path guarantees exactly one tag exists.
const INDEXABLE_PATHS = new Set(['/', '/about', '/faq', '/blog', '/privacy', '/terms', '/login', '/signup', '/bring-collzap']);
const NOINDEX_FOLLOW_PATHS = new Set(['/forgot-password']);

function robotsFor(pathname) {
  if (INDEXABLE_PATHS.has(pathname)) return 'index, follow';
  // Blog posts are the one indexable route family with dynamic paths.
  if (pathname.startsWith('/blog/')) return 'index, follow';
  if (NOINDEX_FOLLOW_PATHS.has(pathname)) return 'noindex, follow';
  return 'noindex, nofollow';
}

function App() {
  const location = useLocation();

  // The inline script in index.html already applied the class before paint;
  // this keeps React's copy in sync if storage changed in another tab.
  useEffect(() => {
    useThemeStore.getState().syncTheme();
  }, []);

  // React Router doesn't reset scroll position on navigation — a <Link> to a
  // new route keeps whatever scrollY the previous page was at, which is why
  // clicking a footer link (already scrolled to the bottom of a long page)
  // landed on the new page still scrolled to the bottom. Keyed on pathname
  // alone, not the full location, so an in-page hash target (HOME_SECTIONS in
  // ./landing/shared.js) is never fought over: those are plain <a> tags that
  // cause a full browser navigation whenever the pathname actually changes,
  // which the browser's own hash-scroll handles outside of React entirely,
  // and cause no pathname change at all when already on "/".
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      {/* No <title> here on purpose. React 19 hoists every <title> in the tree
          into <head> without deduping, so a generic one at this level stacks a
          second (and, with index.html's, a third) title tag onto every public
          page — Google reads the first it finds, which was not the page's own.
          Each public route sets its own title; authenticated routes fall back
          to index.html's, and they're noindex anyway. */}
      <Helmet>
        <meta name="robots" content={robotsFor(location.pathname)} />
      </Helmet>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public marketing landing. AuthGuard treats "/" as public and
              bounces signed-in users to /home (or /admin). */}
          <Route element={<AuthGuard />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          {/* Public content pages. Open to everyone signed in or out, same as
              the landing page — AuthGuard only redirects unauthenticated users
              away from routes that are neither the landing nor auth-only. */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/bring-collzap" element={<BringCollZapPage />} />

          {/* Public Routes (Login/Signup) */}
          <Route element={<AuthGuard />}>
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
            </Route>
          </Route>

          {/* Onboarding Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<OnboardingGuard />}>
              <Route element={<OnboardingLayout />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
              </Route>
            </Route>
          </Route>

          {/* Focused Assessment Route (No Sidebar) */}
          <Route element={<AuthGuard />}>
            <Route element={<OnboardingGuard />}>
              <Route path="/test" element={<SeriousnessTestPage />} />
            </Route>
          </Route>

          {/* Authenticated App Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<OnboardingGuard />}>
              <Route element={<AppShell />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/chat" element={<ChatShell />}>
                  <Route index element={<ChatEmptySelection />} />
                  <Route path=":roomId" element={<ChatRoomPage />} />
                </Route>
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/matches/:groupId" element={<GroupDetailPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<PeerProfilePage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AdminGuard />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
                <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                <Route path="/admin/matches" element={<AdminMatchesPage />} />
                <Route path="/admin/queue" element={<AdminQueuePage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
                <Route path="/admin/colleges" element={<AdminCollegesPage />} />
                <Route path="/admin/interests" element={<AdminInterestsPage />} />
                <Route path="/admin/questions" element={<AdminQuestionsPage />} />
                <Route path="/admin/task-banks" element={<AdminTaskBanksPage />} />
                <Route path="/admin/sessions" element={<AdminSessionsPage />} />
              </Route>
            </Route>
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
