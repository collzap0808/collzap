import { ClipboardCheck, Flame, MessageSquareText, PlayCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Badge from '../ui/Badge';
import { LEVELS, MAX_POINTS, levelIndexFor, potentialPct } from '../../lib/levels';

function relativeTime(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const days = Math.floor(secs / 86400);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

const KINDS = {
  TASK: { icon: ClipboardCheck, label: 'Task', tone: 'bg-accent-50 text-accent-700' },
  REVIEW: { icon: MessageSquareText, label: 'Review', tone: 'bg-teal-50 text-teal-700' },
  SESSION: { icon: PlayCircle, label: 'Session', tone: 'bg-wait/10 text-wait' },
};

const fmt = (n) => n.toLocaleString('en-IN');

export default function PotentialTracker({ stats, className }) {
  const points = stats?.totalPoints ?? 0;
  const streak = stats?.currentStreakDays ?? 0;
  const pct = potentialPct(points);
  const idx = levelIndexFor(points);
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1];

  const mini = [
    { label: 'Tasks done', value: stats?.tasksDone ?? 0 },
    { label: 'Reviews given', value: stats?.reviewsGiven ?? 0 },
    { label: 'Sessions', value: stats?.sessionsWatched ?? 0 },
    { label: 'Best streak', value: stats?.longestStreakDays ?? 0 },
  ];
  const activity = stats?.recentActivity ?? [];

  return (
    <section className={cn('rounded-lg border border-line bg-surface p-5', className)} aria-label="Reach your potential">
      {/* Level + percentage */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-mute">Reach your potential</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold leading-tight tracking-tightest text-ink">{level.name}</p>
          <p className="mt-0.5 text-xs text-mute">{level.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-4xl font-extrabold leading-none tracking-tightest text-accent-600 tnum">{pct}%</p>
          <p className="mt-1.5 text-[11px] text-mute tnum">{fmt(points)} / {fmt(MAX_POINTS)} pts</p>
        </div>
      </div>

      {/* Bar + level dots */}
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct}% of your potential, level ${level.name}`}
      >
        <div className="grad-brand h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${Math.max(pct, points > 0 ? 1.5 : 0)}%` }} />
      </div>
      <ol className="mt-3 grid grid-cols-6 gap-1" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <li key={l.name} className="flex flex-col items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', i <= idx ? 'bg-accent-500' : 'bg-line')} />
            <span className={cn('text-[10px] leading-none', i === idx ? 'font-semibold text-accent-700' : 'text-mute')}>{l.name}</span>
          </li>
        ))}
      </ol>

      {/* Mini stats */}
      <dl className="mt-5 grid grid-cols-2 gap-2">
        {mini.map((m) => (
          <div key={m.label} className="rounded-md border border-line px-3 py-2.5 text-center">
            <dd className="font-display text-xl font-extrabold tracking-tightest text-ink tnum">{m.value}</dd>
            <dt className="mt-0.5 text-[11px] text-mute">{m.label}</dt>
          </div>
        ))}
      </dl>

      {/* Streak */}
      <div
        className={cn(
          'mt-3 flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm',
          streak > 0 ? 'border-wait/50 bg-wait/5 text-ink' : 'border-line text-mute'
        )}
      >
        <Flame className={cn('h-4 w-4 shrink-0', streak > 0 ? 'text-wait' : 'text-mute')} aria-hidden="true" />
        {streak > 0 ? (
          <span>
            <span className="font-display text-lg font-extrabold text-wait tnum">{streak}</span> day streak, keep it going
          </span>
        ) : (
          <span>Submit today&rsquo;s task to start a streak</span>
        )}
      </div>

      {/* Next milestone */}
      <div className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-mute">
        {next ? (
          <>
            <p>
              <span className="font-semibold text-ink tnum">{fmt(next.floor - points)}</span> more points to reach{' '}
              <span className="font-semibold text-ink">{next.name}</span>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              Unlocks {next.unlock.toLowerCase()} <Badge variant="default">Coming soon</Badge>
            </p>
          </>
        ) : (
          <p>You&rsquo;ve reached every level.</p>
        )}
      </div>

      {/* Recent activity */}
      <div className="mt-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-mute">Recent activity</p>
        {activity.length === 0 ? (
          <p className="mt-2 text-xs text-mute">Submit today&rsquo;s task to start your progress.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {activity.map((a, i) => {
              const kind = KINDS[a.kind] ?? KINDS.TASK;
              const Icon = kind.icon;
              return (
                <li key={`${a.kind}-${a.at}-${i}`} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-md',
                      kind.tone
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{a.title}</span>
                    <span className="block text-[11px] text-mute">
                      {kind.label} &middot; {relativeTime(a.at)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-accent-600 tnum">+{a.points}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
