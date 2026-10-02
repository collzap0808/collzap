import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Paperclip, PlayCircle, Trophy, UserRound, Users } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../store/useTaskStore';
import { useMatchStore } from '../../store/useMatchStore';
import { connectionGoal } from './chatFormat';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';
const SHAPE = { ONE_ON_ONE: 'One-on-one', GROUP: 'Small group', SOCIETY: 'Society' };
const titleCase = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '');
const ordinalYear = (n) => (n ? `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} year` : null);

function SectionTitle({ children }) {
  return <h3 className="font-mono text-[10px] uppercase tracking-widest text-mute">{children}</h3>;
}

function Chip({ children }) {
  return <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-ink/80">{children}</span>;
}

const STEPS = ['To do', 'Submitted', 'Reviewed'];

/** Where today's task stands for you, as three real states — no guessed "in progress". */
function TaskProgress({ step }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Task progress: ${STEPS[step]}`}>
      {STEPS.map((label, i) => {
        const done = i < step || (i === step && step > 0);
        const current = i === step;
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={cn('h-1 rounded-full', done ? 'bg-accent-500' : current ? 'bg-accent-200' : 'bg-line')} />
            <span className={cn('flex items-center gap-1 truncate text-[11px]', current ? 'font-semibold text-ink' : 'text-mute')}>
              {done && <Check className="h-3 w-3 shrink-0 text-accent-600" strokeWidth={2.5} aria-hidden="true" />}
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function TaskSummary({ groupId, onOpenTask }) {
  const { todaysTask, fetchTodaysTask } = useTaskStore();

  // Peers submit and review while the chat is open, so this stays fresh:
  // every 8s while the tab is visible, and straight away on return to it.
  useEffect(() => {
    fetchTodaysTask(groupId).catch(() => {});
    const refresh = () => {
      if (document.visibilityState === 'visible') fetchTodaysTask(groupId, { silent: true }).catch(() => {});
    };
    const timer = setInterval(refresh, 8000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [groupId]);

  if (!todaysTask) {
    return <div className="h-28 animate-pulse rounded-lg bg-surface-2/70" aria-hidden="true" />;
  }

  const { assignment, bankCompleted, submissions = [] } = todaysTask;
  if (!assignment) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-3 text-xs text-mute">
        {bankCompleted && <Trophy className="h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />}
        {bankCompleted ? 'Every task in this track is done.' : 'No task today. Check back tomorrow.'}
      </p>
    );
  }

  const mine = submissions.find((s) => s.mine);
  const step = !mine ? 0 : mine.reviews?.length > 0 ? 2 : 1;
  const toReview = submissions.filter((s) => !s.mine && !s.reviewedByMe);

  return (
    <div className="rounded-lg border border-line bg-surface p-3.5">
      <p className="text-[11px] text-mute tnum">
        Day {assignment.dayIndex} &middot; {assignment.points} pts{assignment.durationLabel ? ` · ${assignment.durationLabel}` : ''}
      </p>
      <p className="mt-1 font-display text-[15px] font-bold leading-snug text-ink">{assignment.title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">{assignment.description}</p>

      <div className="mt-3.5">
        <TaskProgress step={step} />
      </div>

      {toReview.length > 0 && (
        <p className="mt-3 rounded-md bg-teal-50 px-2.5 py-2 text-[11px] text-teal-700">
          {toReview.length === 1 ? `${toReview[0].userName} submitted.` : `${toReview.length} people submitted.`} Review for +30 pts.
        </p>
      )}

      <button
        onClick={onOpenTask}
        className={cn(
          'mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
          step === 0 ? 'bg-accent-500 text-white hover:bg-accent-600' : 'border border-line text-ink hover:border-accent-400 hover:bg-accent-50',
          focusRing
        )}
      >
        {step === 0 ? 'Open task' : toReview.length > 0 ? 'Review work' : 'View task'}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Why these people are connected and what they're working on — the chat's
 * third column. Deliberately quieter than the conversation: no card chrome of
 * its own, small type, one accent action at most.
 */
export default function Workspace({ room, onOpenTask, onShareFile }) {
  const { circle, fetchCircle } = useMatchStore();

  useEffect(() => {
    if (!circle) fetchCircle().catch(() => {});
  }, []);

  const group = circle?.connections?.find((g) => g.id === room.matchGroupId);
  const others = (room.members || []).filter((m) => !m.self);
  const oneOnOne = room.type === 'ONE_ON_ONE';
  const other = oneOnOne ? others[0] : null;

  const quick = [
    other
      ? { icon: UserRound, label: 'View profile', to: `/profile/${other.userId}` }
      : room.matchGroupId && { icon: Users, label: 'View group', to: `/matches/${room.matchGroupId}` },
    { icon: Paperclip, label: 'Share an image', onClick: onShareFile },
    { icon: PlayCircle, label: 'Mentor sessions', to: '/sessions' },
  ].filter(Boolean);

  return (
    <div className="space-y-5 px-4 py-4 xl:space-y-6">
      <section className="space-y-2.5">
        <SectionTitle>About this connection</SectionTitle>
        <p className="font-display text-base font-bold leading-snug text-ink">{room.interestName}</p>
        <div className="flex flex-wrap gap-1.5">
          {group?.levelBand && <Chip>{titleCase(group.levelBand)}</Chip>}
          {SHAPE[room.type] && <Chip>{SHAPE[room.type]}</Chip>}
          {room.projectType && <Chip>{room.projectType === 'LONG_TERM' ? 'Long-term' : 'Short-term'}</Chip>}
        </div>
        <p className="text-xs leading-relaxed text-mute">{connectionGoal(room.type)}.</p>
      </section>

      {room.matchGroupId && (
        <section className="space-y-2.5">
          <SectionTitle>Today&rsquo;s task</SectionTitle>
          <TaskSummary groupId={room.matchGroupId} onOpenTask={onOpenTask} />
        </section>
      )}

      {others.length > 0 && (
        <section className="space-y-2">
          <SectionTitle>{oneOnOne ? 'Your partner' : `Members · ${room.members.length}`}</SectionTitle>
          <ul className="space-y-1">
            {others.slice(0, 6).map((m) => (
              <li key={m.userId}>
                <Link
                  to={`/profile/${m.userId}`}
                  className={cn('group flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-surface-2/70', focusRing)}
                >
                  <Avatar src={m.profilePhotoUrl} name={m.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{m.name}</span>
                    <span className="block truncate text-[11px] text-mute">
                      {[ordinalYear(m.yearOfStudy), titleCase(m.level)].filter(Boolean).join(' · ') || 'Member'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-accent-700 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Profile</span>
                </Link>
              </li>
            ))}
          </ul>
          {others.length > 6 && room.matchGroupId && (
            <Link to={`/matches/${room.matchGroupId}`} className={cn('block rounded-sm px-1.5 text-[11px] font-medium text-accent-700 hover:underline', focusRing)}>
              All {room.members.length} members
            </Link>
          )}
        </section>
      )}

      <section className="space-y-2">
        <SectionTitle>Quick actions</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {quick.map((q) => {
            const cls = cn('inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent-400 hover:bg-accent-50', focusRing);
            const inner = <><q.icon className="h-3.5 w-3.5 text-mute" aria-hidden="true" />{q.label}</>;
            return q.to
              ? <Link key={q.label} to={q.to} className={cls}>{inner}</Link>
              : <button key={q.label} type="button" onClick={q.onClick} className={cls}>{inner}</button>;
          })}
        </div>
      </section>
    </div>
  );
}
