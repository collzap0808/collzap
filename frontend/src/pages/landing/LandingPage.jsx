import { Helmet } from 'react-helmet-async';
import { useLenis } from '../../lib/useLenis';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import Problem from './sections/Problem';
import HowItWorks from './sections/HowItWorks';
import WhoItsFor from './sections/WhoItsFor';
import WhyCollZap from './sections/WhyCollZap';
import Circles from './sections/Circles';
import DailyMomentum from './sections/DailyMomentum';
import Trust from './sections/Trust';
import Footer from './sections/Footer';
import StickyCta from './sections/StickyCta';

const SITE = 'https://collzap.com';

/**
 * A linked entity graph, not a pile of loose nodes: the @id references are what
 * let Google resolve "CollZap the organisation", "collzap.com the site" and
 * "CollZap the application" as one entity rather than three coincidences.
 *
 * `sameAs` is the load-bearing field for the brand query. An unrelated
 * @collzap Instagram account and a similarly-named product (Collabzap) already
 * rank for the name; sameAs is how you tell Google which profiles are actually
 * yours. THESE URLS MUST BE REAL AND MUST LINK BACK to collzap.com — a sameAs
 * pointing at a profile that doesn't exist, or that never links here, does
 * nothing. Remove any entry you haven't actually created yet.
 */
const SITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'CollZap',
      url: `${SITE}/`,
      logo: `${SITE}/logo-512.png`,
      description:
        'Campus peer-matching platform connecting verified college students in India with project teammates, startup co-founders and serious study partners inside their own college.',
      foundingDate: '2026',
      areaServed: 'IN',
      sameAs: [
        'https://www.instagram.com/collzap_india/',
        'https://x.com/collzapapp',
        'https://www.linkedin.com/company/collzap/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      name: 'CollZap',
      url: `${SITE}/`,
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#app`,
      name: 'CollZap',
      url: `${SITE}/`,
      applicationCategory: 'SocialNetworkingApplication',
      operatingSystem: 'Web',
      publisher: { '@id': `${SITE}/#organization` },
      description:
        'Find verified students at your own college who share your interests and are serious about the same things — for projects, startups, study groups and societies.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    },
  ],
};

/**
 * The public marketing landing at `/`. Reachable signed in or out —
 * `AuthGuard` exempts this route deliberately — so every call to action runs
 * through `usePrimaryCta()` in ./shared rather than hardcoding `/signup`.
 *
 * Each section owns its own file and its own content array. Adding a section
 * means adding a file here and an anchor to `HOME_SECTIONS` in ./shared,
 * nothing else.
 */
export default function LandingPage() {
  useLenis(true);

  /*
   * `overflow-x-hidden` below is deliberate, not a patch over a broken layout.
   * The page uses rotated decoration — the stamps, and the sticky notes — and a
   * CSS transform still contributes to the *scrollable overflow area* even
   * though it contributes nothing to layout. Without it, a rotated element
   * hanging a few pixels past the right edge gives the whole document a
   * horizontal scrollbar, which on a phone shows as a strip of bare page
   * beside every section.
   *
   * Safe here: the element has `min-h-screen`, not a fixed height, so it never
   * becomes its own scroll container, and neither `Nav` nor `StickyCta` is
   * affected — `position: fixed` ignores an ancestor's overflow unless that
   * ancestor has a transform, and this one has none.
   */
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Helmet>
        <title>Collzap - Where ambition meets action to reach potential</title>
        <meta
          name="description"
          content="CollZap helps students discover like-minded peers for friendships, projects, startups, learning, and growth inside their campus. Verified students only."
        />
        {/* robots meta is owned solely by App.jsx — see its comment for why */}
        <link rel="canonical" href="https://collzap.com/" />
        <script type="application/ld+json">{JSON.stringify(SITE_SCHEMA)}</script>
      </Helmet>

      <Nav overHero />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <WhoItsFor />
        <WhyCollZap />
        <Circles />
        <DailyMomentum />
        <Trust />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
