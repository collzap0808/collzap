import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import Logo from '../../../components/brand/Logo';
import Button from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePrimaryCta } from '../shared';

/**
 * Grouped by what the link actually is, not the flat single-row list this
 * used to be. `href` is an in-page anchor on the landing page (rooted at "/"
 * since this footer also renders on every content page); `to` is a route.
 */
const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { href: '/#who', label: "Who it's for" },
      { href: '/#why', label: 'Why CollZap' },
      { href: '/#how', label: 'How it works' },
      { href: '/#momentum', label: 'After the match' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/blog', label: 'Blog' },
      { to: '/faq', label: 'FAQ' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms & Conditions' },
    ],
  },
];

function FooterLink({ item }) {
  const className = 'rounded text-sm text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';
  return item.to ? (
    <Link to={item.to} className={className}>
      {item.label}
    </Link>
  ) : (
    <a href={item.href} className={className}>
      {item.label}
    </a>
  );
}

export default function Footer() {
  const { isAuthenticated } = useAuthStore();
  const cta = usePrimaryCta();

  return (
    <footer className="border-t border-line bg-paper px-6 pb-28 pt-16 sm:px-8 md:pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <Logo className="h-7" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">
              India&rsquo;s first campus peer-matching platform &mdash; find serious, verified peers
              inside your own college.
            </p>
            <a
              href="mailto:nitishkumar@collzap.com"
              className="mt-5 inline-flex items-center gap-2 rounded text-sm text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              nitishkumar@collzap.com
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="font-mono text-[10px] uppercase tracking-widest text-mute/80">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((item) => (
                  <li key={item.to || item.href}>
                    <FooterLink item={item} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-mute">
            <span className="tnum">&copy; {new Date().getFullYear()} CollZap.</span> All rights
            reserved.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/message/7PTO3UAO6OO2M1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Customer Care on WhatsApp"
              className="rounded p-2 text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
            </a>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="rounded px-2 py-2 text-sm font-medium text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                Log in
              </Link>
            )}
            <Link to={cta.to}>
              <Button size="sm" variant="gradient" icon={<ArrowRight className="h-4 w-4" />}>
                {cta.label}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
