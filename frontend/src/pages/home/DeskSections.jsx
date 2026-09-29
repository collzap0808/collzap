import { Link } from 'react-router-dom';
import {
  ArrowRight, Award, BadgeCheck, Briefcase, CalendarDays, Check, ClipboardCheck, Clock3, Flame, Hourglass,
  Lock, MessageSquare, PlayCircle, Target, Trophy, Users,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { cn } from '../../lib/utils';
import { LEVELS, MAX_POINTS, levelIndexFor, potentialPct } from '../../lib/levels';
import { sessionDateParts, speakerLine } from '../../components/sessions/sessionFormat';
import { ordinalYear, titleCase } from './deskData';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';
const fmt = (n) => n.toLocaleString('en-IN');

/** Primary sections get a real heading; the "all" link sits on the same line. */
export function SectionHeader({ id, title, linkTo, linkLabel, className }) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-4', className)}>
      <h2 id={id} className="font-display text-lg font-bold tracking-tight text-ink">{title}</h2>
      {linkTo && (
        <Link to={linkTo} className={cn('inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-medium text-mute transition-colors hover:text-accent-700', focusRing)}>
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** Heading for the smaller rail cards. */
function CardTitle({ children, aside }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-sm font-bold tracking-tight text-ink">{children}</h2>
      {aside}
    </div>
  );
}

/* ------------------------------------------------------------ overview row */

export function OverviewRow({ items }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((m) => (
        <li key={m.label}>
          <Link
            to={m.to}
            className={cn(
              'group flex items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 transition-colors duration-150 hover:border-accent-300',
              focusRing
            )}
          >
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-md', m.alert ? 'bg-accent-50 text-accent-700' : 'bg-surface-2 text-mute')}>
              <m.icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-extrabold leading-none tracking-tightest text-ink tnum">{m.value}</span>
              <span className="mt-1 block truncate text-xs text-mute">{m.label}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------- upcoming events */

function DateBlock({ iso, live, large }) {
  const { day, month } = sessionDateParts(iso);
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-md text-center',
        large ? 'w-16 py-2.5' : 'w-12 py-1.5',
        live ? 'grad-brand-cta text-white' : 'border border-line text-ink'
      )}
      aria-hidden="true"
    >
      <span className={cn('font-display font-extrabold leading-none tnum', large ? 'text-2xl' : 'text-lg')}>{day}</span>
      <span className={cn('mt-1 font-mono text-[9px] uppercase tracking-widest', live ? 'text-white/85' : 'text-mute')}>{month}</span>
    </span>
  );
}

function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" /> Live now
    </span>
  );
}

function eventAction(s) {
  if (s.status !== 'AVAILABLE') return 'View';
  return s.started ? 'Resume' : 'Watch';
}

/** One event on its own gets the full row, laid out sideways, instead of a third of an empty grid. */
function WideEventCard({ session }) {
  const live = session.status === 'AVAILABLE';
  const { time } = sessionDateParts(session.scheduledAt);
  return (
    <Link
      to={`/sessions/${session.id}`}
      className={cn(
        'group flex flex-col gap-4 rounded-lg border bg-surface p-4 transition-[border-color,box-shadow] duration-150 hover:shadow-md sm:flex-row sm:items-center sm:gap-5 sm:p-5',
        live ? 'border-accent-300' : 'border-line hover:border-accent-300',
        focusRing
      )}
    >
      <div className="flex items-center gap-4 sm:contents">
        <DateBlock iso={session.scheduledAt} live={live} large />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-mono text-[10px] uppercase tracking-widest text-mute">{session.interestName} &middot; Mentor session</span>
            {live && <LivePill />}
          </div>
          <p className="mt-1 font-display text-lg font-bold leading-snug text-ink">{session.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-mute">
            {speakerLine(session) && <span>{speakerLine(session)}</span>}
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{live ? `${session.durationMinutes} min` : time}</span>
            <span className="font-semibold text-accent-600 tnum">+{session.points} pts</span>
          </p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-line px-3.5 py-2 text-xs font-semibold text-ink transition-colors group-hover:border-accent-400 group-hover:bg-accent-50">
        {eventAction(session)} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function EventCard({ session }) {
  const live = session.status === 'AVAILABLE';
  const { time } = sessionDateParts(session.scheduledAt);
  return (
    <Link
      to={`/sessions/${session.id}`}
      className={cn(
        'group flex h-full w-[16.5rem] shrink-0 snap-start flex-col rounded-lg border bg-surface p-4 transition-[border-color,box-shadow] duration-150 hover:shadow-md sm:w-auto',
        live ? 'border-accent-300' : 'border-line hover:border-accent-300',
        focusRing
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <DateBlock iso={session.scheduledAt} live={live} />
        {live ? <LivePill /> : <span className="text-xs font-semibold text-accent-600 tnum">+{session.points} pts</span>}
      </div>
      <p className="mt-3 truncate font-mono text-[10px] uppercase tracking-widest text-mute">{session.interestName}</p>
      <p className="mt-1 line-clamp-2 font-display text-base font-bold leading-snug text-ink">{session.title}</p>
      {speakerLine(session) && <p className="mt-1 truncate text-xs text-mute">{speakerLine(session)}</p>}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-mute">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {live ? `${session.durationMinutes} min` : time}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-700">
          {eventAction(session)}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function UpcomingEvents({ events, loading }) {
  return (
    <section aria-labelledby="desk-events">
      <SectionHeader id="desk-events" title="Upcoming events" linkTo="/sessions" linkLabel="All sessions" />
      {events.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-line px-4 py-4">
          <CalendarDays className="h-4 w-4 shrink-0 text-mute" strokeWidth={1.8} aria-hidden="true" />
          <p className="text-sm text-mute">
            {loading ? 'Checking what’s coming up…' : 'Nothing scheduled for your interests yet. New mentor sessions go up on Fridays.'}
          </p>
        </div>
      ) : events.length === 1 ? (
        <WideEventCard session={events[0]} />
      ) : (
        // Swipeable on phones; the grid is sized to however many events exist,
        // so two never sit in a three-column row with a hole at the end.
        <ul className={cn(
          '-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0',
          events.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'
        )}>
          {events.map((s) => <li key={s.id} className="flex sm:block"><EventCard session={s} /></li>)}
        </ul>
      )}
    </section>
  );
}

/* ----------------------------------------------------------------- people */

function PersonRow({ person }) {
  const meta = [ordinalYear(person.yearOfStudy), titleCase(person.level)].filter(Boolean).join(' · ');
  const [first, ...rest] = person.interests;
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <Link to={`/profile/${person.userId}`} className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-sm', focusRing)}>
        <Avatar name={person.name} src={person.profilePhotoUrl} size="md" />
        <span className="min-w-0">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-sm font-semibold text-ink">{person.name}</span>
            {meta && <span className="hidden shrink-0 text-xs text-mute sm:inline">{meta}</span>}
          </span>
          <span className="mt-0.5 block truncate text-xs text-mute">
            {person.connectionType === 'ONE_ON_ONE' ? 'One-on-one' : 'Group'} &middot; {first}
            {rest.length > 0 && ` +${rest.length}`}
          </span>
        </span>
      </Link>
      {person.chatRoomId && (
        <Link
          to={`/chat/${person.chatRoomId}`}
          aria-label={`Message ${person.name}`}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent-400 hover:bg-accent-50',
            focusRing
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Message</span>
        </Link>
      )}
    </li>
  );
}

export function PeopleSection({ people, onFind }) {
  return (
    <section aria-labelledby="desk-people" className="min-w-0">
      <SectionHeader id="desk-people" title="People you can work with" linkTo="/matches" linkLabel="All matches" />
      {people.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line px-4 py-4">
          <p className="flex items-center gap-3 text-sm text-mute">
            <Users className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            Nobody yet. That&rsquo;s normal on day one.
          </p>
          <button onClick={onFind} className={cn('rounded-sm text-xs font-semibold text-accent-700 hover:underline hover:underline-offset-4', focusRing)}>
            Run the matcher
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {people.slice(0, 5).map((p) => <PersonRow key={p.userId} person={p} />)}
        </ul>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- continue */

const KIND_ICON = {
  chat: { icon: MessageSquare, tone: 'bg-accent-50 text-accent-700' },
  task: { icon: ClipboardCheck, tone: 'bg-wait/10 text-wait' },
  session: { icon: PlayCircle, tone: 'bg-teal-50 text-teal-700' },
  waiting: { icon: Hourglass, tone: 'bg-surface-2 text-mute' },
};

export function ContinueSection({ items }) {
  return (
    <section aria-labelledby="desk-continue" className="min-w-0">
      <SectionHeader id="desk-continue" title="Continue where you left off" />
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-line px-4 py-4">
          <Check className="h-4 w-4 shrink-0 text-teal-600" strokeWidth={2} aria-hidden="true" />
          <p className="text-sm text-mute">You&rsquo;re all caught up. Nothing is waiting on you.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {items.map((item) => {
            const { icon: Icon, tone } = KIND_ICON[item.kind];
            return (
              <li key={item.key}>
                <Link to={item.to} className={cn('group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/60', focusRing, 'focus-visible:ring-inset')}>
                  <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-md', tone)}>
                    <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                    <span className="block truncate text-xs text-mute">{item.detail}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-accent-700 group-hover:underline group-hover:underline-offset-4">{item.action}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------------- goal strip */

/** The short-term goal, as one slim row — context, not a section. */
export function GoalStrip({ shortTerm, peersOnIt, hasLongTerm, onChange, onSetUpLongTerm, settingUp }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3.5 sm:flex-row sm:items-center">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent-50 text-accent-700" aria-hidden="true">
        <Target className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">
          <span className="text-mute">Your current goal: </span>
          <span className="font-semibold">{shortTerm ? shortTerm.interestName : 'not set yet'}</span>
        </p>
        <p className="mt-0.5 text-xs text-mute">
          {shortTerm
            ? peersOnIt > 0
              ? `${peersOnIt} ${peersOnIt === 1 ? 'person' : 'people'} in your circle ${peersOnIt === 1 ? 'is' : 'are'} on this too.`
              : 'A quick, short-burst interest. Change it whenever you want.'
            : 'Pick something to work on and we’ll match you on it.'}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
        {!hasLongTerm && (
          <button
            onClick={onSetUpLongTerm}
            disabled={settingUp}
            className={cn('rounded-sm text-xs font-medium text-mute hover:text-ink disabled:opacity-50', focusRing)}
          >
            Set up long-term matching
          </button>
        )}
        <button
          onClick={onChange}
          className={cn('rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent-400 hover:bg-accent-50', focusRing)}
        >
          {shortTerm ? 'Change interest' : 'Choose one'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- rail: progress */

export function ProgressCard({ stats }) {
  const points = stats?.totalPoints ?? 0;
  const streak = stats?.currentStreakDays ?? 0;
  const pct = potentialPct(points);
  const idx = levelIndexFor(points);
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1];
  return (
    <section className="rounded-lg border border-line bg-surface p-4" aria-label="Your progress">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold leading-tight tracking-tightest text-ink">{level.name}</h2>
          <p className="mt-0.5 text-xs text-mute">{level.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-3xl font-extrabold leading-none tracking-tightest text-accent-600 tnum">{pct}%</p>
          <p className="mt-1 text-[11px] text-mute tnum">{fmt(points)} / {fmt(MAX_POINTS)}</p>
        </div>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct}% of your potential, level ${level.name}`}
      >
        <div className="grad-brand h-full rounded-full" style={{ width: `${Math.max(pct, points > 0 ? 1.5 : 0)}%` }} />
      </div>
      <ol className="mt-2.5 grid grid-cols-6 gap-1" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <li key={l.name} className="flex flex-col items-center gap-1">
            <span className={cn('h-1.5 w-1.5 rounded-full', i <= idx ? 'bg-accent-500' : 'bg-line')} />
            <span className={cn('text-[9px] leading-none', i === idx ? 'font-semibold text-accent-700' : 'text-mute')}>{l.name}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs">
        <span className={cn('inline-flex items-center gap-1.5', streak > 0 ? 'text-ink' : 'text-mute')}>
          <Flame className={cn('h-3.5 w-3.5', streak > 0 ? 'text-wait' : 'text-mute')} aria-hidden="true" />
          {streak > 0 ? <><span className="font-semibold text-wait tnum">{streak}</span>-day streak</> : 'No streak yet'}
        </span>
        {next && (
          <span className="text-mute">
            <span className="font-semibold text-ink tnum">{fmt(next.floor - points)}</span> to {next.name}
          </span>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------- rail: coming soon */

const FEATURE_ICON = {
  Sprout: BadgeCheck,
  Growing: Award,
  Thriving: Trophy,
  Peak: Briefcase,
  Realized: BadgeCheck,
};

/**
 * What the higher levels will unlock. None of it is built yet, so each one is
 * plainly marked "Soon" — shown as something to grow toward, not a promise
 * with a date on it. Sprout's mentorship unlock is left out: sessions are
 * already open to everyone.
 */
export function ComingSoon({ points }) {
  const upcoming = LEVELS.filter((l) => l.feature && l.name !== 'Sprout');
  return (
    <section className="rounded-lg border border-line bg-surface p-4" aria-labelledby="desk-soon">
      <CardTitle aside={<span className="text-[11px] text-mute">Unlocked by levels</span>}>
        <span id="desk-soon">Coming soon</span>
      </CardTitle>
      <ul className="mt-3 space-y-2.5">
        {upcoming.map((l) => {
          const Icon = FEATURE_ICON[l.name] || Award;
          const reached = points >= l.floor;
          return (
            <li key={l.name} className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-2 text-mute">
                <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{l.feature}</span>
                <span className="block text-[11px] text-mute tnum">
                  {reached ? `Level ${l.name} reached` : `At ${l.name} · ${fmt(l.floor)} pts`}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mute">
                <Lock className="h-2.5 w-2.5" aria-hidden="true" /> Soon
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
