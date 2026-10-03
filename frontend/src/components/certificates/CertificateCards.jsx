import { Link } from 'react-router-dom';
import { Award, BadgeCheck, Download, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

const fmt = (n) => Number(n).toLocaleString('en-IN');

/**
 * "Certificates" card for the Home rail. Same look as the "Coming soon" card
 * under it (icon tile, title, small grey line, pill on the right), but live:
 *   LOCKED   -> "N pts to go"      + Locked pill
 *   UNLOCKED -> "Ready to claim"   + Get pill (accent)
 *   ISSUED   -> "No. CZ-XXXX"      + Download pill
 * `cards` comes from HomePage (GET /api/certificates). Renders nothing when empty.
 */
export default function CertificateCards({ cards }) {
    if (!cards || cards.length === 0) return null;

    return (
        <section className="rounded-lg border border-line bg-surface p-4" aria-labelledby="desk-certs">
            <div className="flex items-baseline justify-between gap-3">
                <h2 id="desk-certs" className="font-display text-sm font-bold tracking-tight text-ink">Certificates</h2>
                <span className="text-[11px] text-mute">Unlocked by points</span>
            </div>

            <ul className="mt-3 space-y-2.5">
                {cards.map((c) => {
                    const locked = c.status === 'LOCKED';
                    const issued = c.status === 'ISSUED';
                    const Icon = issued ? BadgeCheck : Award;
                    // Locked rows are plain text; open rows are real links to the certificate page.
                    const RowTag = locked ? 'div' : Link;

                    return (
                        <li key={c.ruleId}>
                            <RowTag
                                {...(locked ? {} : { to: `/certificates/${c.ruleId}` })}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-sm text-left',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                                    locked ? 'cursor-default' : 'group cursor-pointer'
                                )}
                            >
                                <span className={cn(
                                    'grid h-8 w-8 shrink-0 place-items-center rounded-md',
                                    locked ? 'bg-surface-2 text-mute' : 'bg-accent-50 text-accent-700'
                                )}>
                                    <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
                                    <span className="block truncate text-[11px] text-mute tnum">
                                        {locked && `${fmt(c.pointsToGo)} pts to go · ${fmt(c.pointsRequired)} needed`}
                                        {c.status === 'UNLOCKED' && 'Unlocked · ready to claim'}
                                        {issued && `No. ${c.certificateCode}`}
                                    </span>
                                </span>

                                {locked ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mute">
                                        <Lock className="h-2.5 w-2.5" aria-hidden="true" /> Locked
                                    </span>
                                ) : (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-700 transition-colors group-hover:bg-accent-100">
                                        {issued
                                            ? <><Download className="h-2.5 w-2.5" aria-hidden="true" /> Download</>
                                            : <><Award className="h-2.5 w-2.5" aria-hidden="true" /> Get</>}
                                    </span>
                                )}
                            </RowTag>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}