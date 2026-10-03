import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Lock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import EmptyState from '../../components/ui/EmptyState';
import { certApi } from '../../api/certificateApi';
import { cn } from '../../lib/utils';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';

/**
 * Route: /certificates
 * Lists every certificate rule available to the student, grouped by status.
 * Each row links to /certificates/:ruleId where the name is entered and the
 * PDF is generated.
 *
 * Performance notes
 * -----------------
 * - `moduleCache` keeps the last fetched payload for the lifetime of the SPA
 *   tab. Returning to this page after viewing a certificate shows content
 *   instantly instead of a spinner, then silently refreshes if stale.
 * - `FRESH_MS` avoids pointless refetches when the user is bouncing between
 *   the list and a detail page.
 * - `prefetchDetail()` warms the lazy `CertificatePage` chunk + the detail
 *   API on hover/focus, so the click feels instant.
 * - `CardRow` is memoized so typing/hover in one row can't re-render the rest.
 */

const FRESH_MS = 60_000;

// Module-level cache: survives route unmount/remount within the same tab.
let moduleCache = { data: null, at: 0, key: null };

// Prefetch guard: only warm each ruleId once per session.
const prefetched = new Set();

// Kick off the lazy detail chunk download; safe to call repeatedly — Vite
// dedupes the import promise internally, and the browser caches the file.
let detailChunkPromise = null;
function prefetchDetailChunk() {
    if (!detailChunkPromise) {
        detailChunkPromise = import('./CertificatePage').catch(() => {});
    }
    return detailChunkPromise;
}

// Warm the detail API for one ruleId so the /certificates/:ruleId page has
// its data already in-flight by the time the user lands on it.
function prefetchDetail(ruleId) {
    if (!ruleId || prefetched.has(ruleId)) return;
    prefetched.add(ruleId);
    prefetchDetailChunk();
    // Fire-and-forget; CertificatePage will hit the same endpoint and get a
    // fast cached response from the browser / SW / API layer.
    certApi.detail(ruleId).catch(() => {
        // On failure, allow a retry next time.
        prefetched.delete(ruleId);
    });
}

export default function CertificatesPage() {
    const [cards, setCards] = useState(() => {
        // Hydrate synchronously from cache so first paint has real content.
        return moduleCache.data ? moduleCache.data : null;
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const now = Date.now();
        const cacheFresh =
            moduleCache.data && now - moduleCache.at < FRESH_MS && moduleCache.key === 'myCards';

        // If we already rendered from a fresh cache, do nothing.
        if (cacheFresh) return;

        let alive = true;
        // If we have stale cached data, refresh silently — don't show a spinner.
        const silent = Boolean(moduleCache.data);

        certApi
            .myCards()
            .then((data) => {
                const next = data || [];
                moduleCache = { data: next, at: Date.now(), key: 'myCards' };
                if (alive) {
                    setCards(next);
                    setError('');
                }
            })
            .catch((err) => {
                // If we already have cached content, swallow the background error so
                // the user keeps seeing the list. Only surface the error on a cold,
                // cache-less load.
                if (!silent && alive) {
                    setError(err?.message || 'Could not load your certificates');
                }
            });

        return () => {
            alive = false;
        };
    }, []);

    // Split by status once per `cards` change, not on every render pass.
    const { issued, ready, locked } = useMemo(() => {
        const list = cards || [];
        return {
            issued: list.filter((c) => c.status === 'ISSUED'),
            ready: list.filter((c) => c.status === 'READY'),
            locked: list.filter((c) => c.status === 'LOCKED'),
        };
    }, [cards]);

    if (error) {
        return (
            <div className="mx-auto max-w-3xl">
                <EmptyState icon={Award} title="Certificates unavailable" description={error} />
            </div>
        );
    }

    if (!cards) {
        // Skeleton sized to match real rows, so nothing jumps when data lands.
        return (
            <div className="mx-auto max-w-3xl">
                <Helmet><title>Certificates · Collzap</title></Helmet>
                <header className="mb-6">
                    <div className="h-8 w-44 animate-pulse rounded-md bg-surface-2" />
                    <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-surface-2" />
                </header>
                <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
                            <span className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-surface-2" />
                            <span className="min-w-0 flex-1 space-y-2">
                <span className="block h-4 w-40 animate-pulse rounded bg-surface-2" />
                <span className="block h-3 w-56 animate-pulse rounded bg-surface-2" />
              </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Helmet>
                <title>Certificates · Collzap</title>
            </Helmet>

            <header className="mb-6">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Certificates</h1>
                <p className="mt-1 text-sm text-mute">
                    Earn points, unlock certificates, and download them with your name on them.
                </p>
            </header>

            {cards.length === 0 ? (
                <EmptyState
                    icon={Award}
                    title="No certificates yet"
                    description="Once you cross a level, its certificate shows up here."
                />
            ) : (
                <div className="space-y-8">
                    {issued.length > 0 && (
                        <Group title="Earned">
                            {issued.map((c) => (
                                <CardRow key={c.ruleId} card={c} />
                            ))}
                        </Group>
                    )}
                    {ready.length > 0 && (
                        <Group title="Ready to claim">
                            {ready.map((c) => (
                                <CardRow key={c.ruleId} card={c} />
                            ))}
                        </Group>
                    )}
                    {locked.length > 0 && (
                        <Group title="Locked">
                            {locked.map((c) => (
                                <CardRow key={c.ruleId} card={c} />
                            ))}
                        </Group>
                    )}
                </div>
            )}
        </div>
    );
}

function Group({ title, children }) {
    return (
        <section>
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-mute">{title}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                {children}
            </ul>
        </section>
    );
}

// Memoized: a row only re-renders when its own `card` reference changes.
const CardRow = memo(function CardRow({ card }) {
    const isLocked = card.status === 'LOCKED';
    const isIssued = card.status === 'ISSUED';

    const inner = (
        <span className="flex min-w-0 flex-1 items-center gap-3">
      <span
          className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-md',
              isIssued ? 'bg-accent-50 text-accent-700' : 'bg-surface-2 text-mute'
          )}
          aria-hidden="true"
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <Award className="h-4 w-4" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{card.name}</span>
        <span className="mt-0.5 block truncate text-xs text-mute">
          {isIssued
              ? `Issued · ${card.certificateCode ?? ''}`
              : isLocked
                  ? `Earn ${card.pointsToGo?.toLocaleString('en-IN') ?? '—'} more points to unlock`
                  : 'Ready to claim'}
        </span>
      </span>
    </span>
    );

    if (isLocked) {
        return <li className="flex items-center gap-3 px-4 py-3.5 opacity-60">{inner}</li>;
    }

    const onWarm = () => prefetchDetail(card.ruleId);

    return (
        <li>
            <Link
                to={`/certificates/${card.ruleId}`}
                state={{ from: '/certificates' }}
                onMouseEnter={onWarm}
                onFocus={onWarm}
                onTouchStart={onWarm}
                className={cn(
                    'group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/60',
                    focusRing,
                    'focus-visible:ring-inset'
                )}
            >
                {inner}
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-700 group-hover:underline group-hover:underline-offset-4">
          {isIssued ? 'View' : 'Claim'}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
            </Link>
        </li>
    );
});