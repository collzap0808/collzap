import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Hourglass } from 'lucide-react';
import AppNav from './AppNav';
import { useUserStore } from '../../store/useUserStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { webSocketService } from '../../services/websocket';
import { page, snappy, useReducedMotion, transition } from '../../lib/motion';

const UNREAD_POLL_MS = 30_000;

/**
 * Vertical space the floating capsule and page gutters take, published as
 * `--app-chrome` so a full-height child (the chat room) can size itself
 * without hard-coding a magic number that silently rots when the chrome
 * changes. Each value must equal the sum of the matching top and bottom
 * padding below:
 *
 *   no banner   mobile  pt-24 (6rem) + pb-28 (7rem)                     = 13rem
 *               desktop pt-24 (6rem) + pb-10 (2.5rem)                   = 8.5rem
 *   banner      mobile  pt-24 (6rem) + banner + pt-6 (1.5rem) + pb-28 (7rem)   = 14.5rem + banner
 *               desktop pt-24 (6rem) + banner + pt-6 (1.5rem) + pb-10 (2.5rem) = 10rem + banner
 *
 * The banner's own height is measured, not assumed — its message wraps on a
 * phone — and fed in through `--app-banner`.
 */
const CHROME_VAR = '[--app-chrome:13rem] md:[--app-chrome:8.5rem]';
const CHROME_VAR_BANNER =
  '[--app-chrome:calc(14.5rem_+_var(--app-banner,0px))] md:[--app-chrome:calc(10rem_+_var(--app-banner,0px))]';
const PAD = 'pt-24 pb-28 md:pt-24 md:pb-10';
// Chat on a phone: there is no top capsule there (the nav floats at the
// bottom), so the room only needs a hairline gap above and clearance for the
// bottom capsule below — every other rem is taken from the conversation.
//   mobile  pt-3 (0.75rem) + pb-20 (5rem) = 5.75rem · desktop as PAD
const CHAT_CHROME_VAR = '[--app-chrome:5.75rem] md:[--app-chrome:8.5rem]';
const CHAT_PAD = 'pt-3 pb-20 md:pt-24 md:pb-10';
// Under the banner the page only needs a gap, not the full capsule clearance —
// the banner's wrapper already took that.
const PAD_UNDER_BANNER = 'pt-6 pb-28 md:pb-10';

export default function AppShell() {
  const { profile, fetchMe } = useUserStore();
  const { fetchUnreadCount } = useNotificationStore();
  const location = useLocation();
  const reduced = useReducedMotion();

  const bannerRef = useRef(null);
  const [bannerHeight, setBannerHeight] = useState(0);

  useEffect(() => {
    if (!profile) fetchMe().catch(console.error);
  }, []);

  // Unread badge: poll on mount and every 30s, plus a live push subscription.
  useEffect(() => {
    fetchUnreadCount().catch(() => {});
    const id = setInterval(() => fetchUnreadCount().catch(() => {}), UNREAD_POLL_MS);

    // NotificationResponse arrives on the personal queue and feeds
    // addIncomingNotification. Subscribed once here, torn down on unmount;
    // logout also disconnects the socket entirely.
    webSocketService.connect();
    webSocketService.subscribeNotifications();

    return () => {
      clearInterval(id);
      webSocketService.unsubscribeNotifications();
    };
  }, []);

  const isPendingVerification = profile && profile.verificationStatus !== 'APPROVED';

  // Track the banner's rendered height so the chat room's `--app-chrome` stays
  // exact. Without this, an unverified user dropped into a chat (an admin can
  // force-match anyone) would have the composer pushed below the fold.
  useLayoutEffect(() => {
    const el = bannerRef.current;
    if (!el) {
      setBannerHeight(0);
      return;
    }
    const ro = new ResizeObserver(([entry]) => {
      const size = entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
      setBannerHeight(Math.ceil(size));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isPendingVerification]);

  // The whole /chat split view (rail + room) owns its own scroll and should
  // not fade on every navigation between threads — including the bare
  // /chat index, which is the same shell with nothing open yet.
  const isChatRoom = /^\/chat(\/[^/]+)?$/.test(location.pathname);
  // The desk is a multi-column workspace; every other route reads at prose width.
  const isWide = location.pathname === '/home';
  // Profiles are two columns under a full-width header — wider than prose, narrower than the desk.
  const isProfile = location.pathname === '/profile' || location.pathname.startsWith('/profile/');

  const tightChat = isChatRoom && !isPendingVerification;
  const chromeVar = isPendingVerification ? CHROME_VAR_BANNER : tightChat ? CHAT_CHROME_VAR : CHROME_VAR;
  const pad = isPendingVerification ? PAD_UNDER_BANNER : tightChat ? CHAT_PAD : PAD;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-paper">
      <AppNav />

      <main
        id="app-scroll"
        className={`relative flex-1 overflow-y-auto focus:outline-none ${chromeVar}`}
        style={{ '--app-banner': `${bannerHeight}px` }}
      >
        {/*
          Verification banner. It lives in the top clearance zone (pt-24), below
          the floating capsule — it used to sit above that padding, which put it
          directly under the nav. Outside the per-route motion wrapper on
          purpose: it is account state, not page content, so it should not fade
          out and back in on every navigation.
        */}
        {isPendingVerification && (
          <div className="mx-auto max-w-5xl px-5 pt-24 sm:px-8">
            <motion.div
              ref={bannerRef}
              role="status"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={transition(snappy, reduced)}
              className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-wait/25 bg-wait/[0.07] py-3 pl-5 pr-3 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* Accent rail. */}
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-wait/70" />

              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wait/15 text-wait">
                  <Hourglass className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-wait">
                    With a human
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-ink">
                    Matching stays locked until someone checks your ID.
                  </p>
                </div>
              </div>

              <Link
                to="/onboarding"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-wait/30 bg-wait/10 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-wait/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 sm:self-auto"
              >
                Check status
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        )}

        {isChatRoom ? (
          // No page fade: the message list is already scrolling. No width
          // cap at all, unlike every other route — the rail + thread + task
          // layout is meant to use the full window the way a real chat
          // client's does; a capped width here is just more dead margin on
          // a laptop screen, where every other (single-column, prose-width)
          // route still wants the cap.
          <div className={`px-3 sm:px-8 ${pad}`}>
            <Outlet />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={transition(page, reduced)}
              className={`mx-auto ${isWide ? 'max-w-7xl' : isProfile ? 'max-w-6xl' : 'max-w-5xl'} px-5 sm:px-8 ${pad}`}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
