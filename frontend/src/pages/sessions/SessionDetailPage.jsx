import { useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Clock3, PlayCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import YouTubeSessionPlayer from '../../components/sessions/YouTubeSessionPlayer';
import { UpcomingRow } from '../../components/sessions/SessionCards';
import { sessionWhen, speakerLine, watchedLabel } from '../../components/sessions/sessionFormat';
import { useSessionStore } from '../../store/useSessionStore';
import { useTaskStore } from '../../store/useTaskStore';

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const { current, sessions, loading, error, fetchSession, fetchSessions, startSession, completeSession } = useSessionStore();
  const { fetchMyStats } = useTaskStore();

  useEffect(() => {
    fetchSession(sessionId).catch(console.error);
    if (!sessions) fetchSessions().catch(console.error);
  }, [sessionId]);

  // A 409 means another tab already started it — the timer is running either way.
  const handleStart = useCallback(() => {
    startSession(sessionId).catch(() => {});
  }, [sessionId, startSession]);

  const handleComplete = useCallback(async () => {
    const result = await completeSession(sessionId);
    if (result.pointsAwarded > 0) {
      toast.success(`+${result.pointsAwarded} points`);
      fetchMyStats().catch(console.error);
      fetchSessions().catch(console.error);
    }
    return result;
  }, [sessionId, completeSession, fetchMyStats, fetchSessions]);

  const session = current?.id === sessionId ? current : null;
  const upcoming = (sessions?.upcoming ?? []).filter((s) => s.id !== sessionId).slice(0, 4);
  const live = session?.status === 'AVAILABLE';

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        to="/sessions"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All sessions
      </Link>

      {!session && loading ? (
        <div className="flex justify-center py-16 text-accent-500"><Spinner /></div>
      ) : !session ? (
        <EmptyState
          icon={PlayCircle}
          title="Session not found"
          description={error || 'It may have been removed, or it isn’t for one of your interests.'}
        />
      ) : (
        <>
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-700">{session.interestName}</span>
              {session.watched ? (
                <Badge variant="success">Watched</Badge>
              ) : live ? (
                <Badge variant="primary">Live now</Badge>
              ) : (
                <Badge variant="warning">Upcoming</Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tightest text-ink sm:text-4xl">
              {session.title}
            </h1>
            {speakerLine(session) && <p className="mt-2 text-sm text-mute">{speakerLine(session)}</p>}
          </header>

          {live && session.youtubeVideoId ? (
            <YouTubeSessionPlayer
              key={session.id}
              sessionId={session.id}
              videoId={session.youtubeVideoId}
              title={session.title}
              points={session.points}
              watched={session.watched}
              onStart={handleStart}
              onComplete={handleComplete}
            />
          ) : (
            <div className="grid aspect-video place-items-center rounded-lg border border-dashed border-line bg-surface-2 p-6 text-center">
              <div>
                <CalendarClock className="mx-auto h-6 w-6 text-mute" strokeWidth={1.6} aria-hidden="true" />
                <p className="mt-3 font-display text-lg font-bold text-ink">Starts {sessionWhen(session.scheduledAt)}</p>
                <p className="mt-1 text-sm text-mute">The video appears here once it goes live.</p>
              </div>
            </div>
          )}

          <dl className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {[
              { icon: Clock3, label: 'Duration', value: `${session.durationMinutes} min` },
              { icon: Users, label: 'Watched by', value: session.watchCount, title: watchedLabel(session.watchCount) },
              { icon: PlayCircle, label: 'Points', value: `+${session.points}` },
            ].map((m) => (
              <div key={m.label} className="p-4" title={m.title}>
                <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-mute">
                  <m.icon className="h-3.5 w-3.5" aria-hidden="true" /> {m.label}
                </dt>
                <dd className="mt-1.5 font-display text-xl font-extrabold tracking-tightest text-ink tnum">{m.value}</dd>
              </div>
            ))}
          </dl>

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-mute">Upcoming sessions</h2>
              <ul className="divide-y divide-line border-y border-line">
                {upcoming.map((s) => <UpcomingRow key={s.id} session={s} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
