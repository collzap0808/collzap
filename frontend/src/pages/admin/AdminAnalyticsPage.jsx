import { useEffect, useState } from 'react';
import { api } from '../../api/api';
import { cn } from '../../lib/utils';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import AdminPageHeader from './AdminPageHeader';

const RANGES = [7, 30, 90];

const dayLabel = (iso, opts) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts);

/** Landing-page visitors per day, from Google Analytics (react-ga4 on "/"). */
export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api
      .get(`/admin/analytics/landing?days=${days}`)
      .then((res) => live && setData(res))
      .catch((err) => live && setError(err.message || 'Could not load analytics'))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [days]);

  const daily = data?.daily ?? [];
  const peak = Math.max(1, ...daily.map((d) => d.visitors));
  const rows = [...daily].reverse();

  return (
    <div>
      <AdminPageHeader title="Landing analytics">
        <div role="group" aria-label="Date range" className="flex overflow-hidden rounded border border-line">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              aria-pressed={days === r}
              className={cn(
                'px-3 py-1.5 font-mono text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500',
                days === r ? 'bg-ink text-surface' : 'bg-surface text-mute hover:text-ink'
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </AdminPageHeader>

      {loading && !data ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : error ? (
        <EmptyState title="Analytics unavailable" description={error} />
      ) : !data?.configured ? (
        <EmptyState
          title="Google Analytics is not connected"
          description="Set VITE_GA_MEASUREMENT_ID on the frontend, and GA_PROPERTY_ID and GA_CREDENTIALS_BASE64 on the backend."
        />
      ) : (
        <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60')}>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
            {[
              ['Visitors', data.visitors],
              ['New visitors', data.newVisitors],
              ['Page views', data.pageViews],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface px-4 py-5 sm:px-5 sm:py-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-mute">{label}</p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums tracking-tight text-ink">
                  {value.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-ink">Visitors per day</h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-mute">peak {peak}</p>
            </div>
            <div className="mt-4 flex h-40 items-end gap-[2px]" aria-hidden="true">
              {daily.map((d) => (
                <div
                  key={d.date}
                  title={`${dayLabel(d.date, { day: 'numeric', month: 'short' })}: ${d.visitors} visitors`}
                  className="flex-1 rounded-t-sm bg-accent-500/80 hover:bg-accent-700"
                  style={{ height: `${Math.max(d.visitors ? 3 : 1, (d.visitors / peak) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-mute">
              <span>{daily[0] && dayLabel(daily[0].date, { day: 'numeric', month: 'short' })}</span>
              <span>{daily.at(-1) && dayLabel(daily.at(-1).date, { day: 'numeric', month: 'short' })}</span>
            </div>
          </section>

          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-widest text-mute">
                  <th className="px-4 py-3 font-normal">Date</th>
                  <th className="px-4 py-3 text-right font-normal">Visitors</th>
                  <th className="px-4 py-3 text-right font-normal">New</th>
                  <th className="px-4 py-3 text-right font-normal">Page views</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.date} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">
                      {dayLabel(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-ink">{d.visitors}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-mute">{d.newVisitors}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-mute">{d.pageViews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-mute">
            Visitors in the totals are unique across the range. Google Analytics can take a few hours to show today&rsquo;s visits.
          </p>
        </div>
      )}
    </div>
  );
}
