import { useEffect } from 'react';
import { CalendarClock, PlayCircle } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { FeaturedSession, PastRow, UpcomingRow } from '../../components/sessions/SessionCards';
import { useSessionStore } from '../../store/useSessionStore';

export default function SessionsPage() {
  const { sessions, loading, error, fetchSessions } = useSessionStore();

  useEffect(() => {
    fetchSessions().catch(console.error);
  }, []);

  const featured = sessions?.featured;
  const upcoming = sessions?.upcoming ?? [];
  const earlier = (sessions?.available ?? []).filter((s) => s.id !== featured?.id);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tightest text-ink">Sessions</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-mute">
          A mentor talk every Friday for each of your interests. Watch it through to earn its points.
        </p>
      </header>

      {!sessions && loading ? (
        <div className="flex justify-center py-16 text-accent-500"><Spinner /></div>
      ) : !sessions && error ? (
        <EmptyState icon={PlayCircle} title="Sessions didn’t load" description={error} actionLabel="Try again" onAction={() => fetchSessions().catch(console.error)} />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-mute">This week&rsquo;s session</h2>
            {featured ? (
              <FeaturedSession session={featured} />
            ) : (
              <EmptyState
                icon={PlayCircle}
                title="No session for your interests yet"
                description={upcoming.length > 0 ? 'The next one is already scheduled.' : 'New talks go up on Fridays. Check back then.'}
              />
            )}

            {earlier.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-mute">Earlier sessions</h2>
                <ul className="divide-y divide-line border-y border-line">
                  {earlier.map((s) => <PastRow key={s.id} session={s} />)}
                </ul>
              </div>
            )}
          </section>

          <aside className="min-w-0">
            <h2 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-mute">Upcoming sessions</h2>
            {upcoming.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-line px-4 py-5">
                <CalendarClock className="h-4 w-4 shrink-0 text-mute" strokeWidth={1.8} aria-hidden="true" />
                <p className="text-sm text-mute">Nothing scheduled yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {upcoming.map((s) => <UpcomingRow key={s.id} session={s} />)}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
