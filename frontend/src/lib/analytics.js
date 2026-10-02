import ReactGA from 'react-ga4';

// Google Analytics 4, for the landing page only. Nothing loads unless
// VITE_GA_MEASUREMENT_ID is set, and the gtag script is only fetched the first
// time the landing page mounts, so app pages never carry it.
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

function init() {
  if (initialized || !MEASUREMENT_ID || typeof window === 'undefined') return initialized;
  ReactGA.initialize(MEASUREMENT_ID, {
    // We send the one page view ourselves; no automatic views on later SPA navigation.
    gtagOptions: { send_page_view: false },
  });
  initialized = true;
  return true;
}

/** One page view for the landing page. The admin report counts views of "/". */
export function trackLandingView() {
  if (!init()) return;
  ReactGA.send({ hitType: 'pageview', page: '/', title: 'Landing' });
}
