import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { sessionDateParts, sessionWhen, speakerLine, thumbnailUrl, watchedLabel } from './sessionFormat';

/** The video still with a play mark — a link-shaped preview, not the player itself. */
export function SessionThumb({ session, className, size = 'lg' }) {
  const src = thumbnailUrl(session.youtubeVideoId);
  return (
    <div className={cn('relative overflow-hidden bg-ink', className)}>
      {src && <img src={src} alt="" loading="lazy" className="h-full w-full object-cover opacity-90" />}
      <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" aria-hidden="true" />
      <span
        className={cn(
          'grad-brand-cta absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-white shadow-lg',
          'transition-transform duration-200 group-hover:scale-105',
          size === 'lg' ? 'h-14 w-14' : 'h-9 w-9'
        )}
        aria-hidden="true"
      >
        <Play className={cn('translate-x-px fill-current', size === 'lg' ? 'h-6 w-6' : 'h-4 w-4')} />
      </span>
      {session.watched && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Watched
        </span>
      )}
    </div>
  );
}

/** The week's session, large. Used at the top of the Sessions page. */
export function FeaturedSession({ session }) {
  return (
    <Link
      to={`/sessions/${session.id}`}
      className="group block overflow-hidden rounded-lg border border-line bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
    >
      <SessionThumb session={session} className="aspect-video w-full" />
      <div className="p-5 sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent-700">{session.interestName}</p>
        <h2 className="mt-2 font-display text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">{session.title}</h2>
        {speakerLine(session) && <p className="mt-1 text-sm text-mute">{speakerLine(session)}</p>}
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{session.durationMinutes} min</span>
          <span className="tnum">{watchedLabel(session.watchCount)}</span>
          <span className={cn('font-semibold tnum', session.watched ? 'text-teal-700' : 'text-accent-600')}>
            {session.watched ? `${session.points} pts earned` : `+${session.points} pts`}
          </span>
        </p>
      </div>
    </Link>
  );
}

/** A compact row for the desk: still on the left, the essentials on the right. */
export function SessionStrip({ session }) {
  return (
    <Link
      to={`/sessions/${session.id}`}
      className="group flex items-stretch overflow-hidden rounded-lg border border-line bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
    >
      <SessionThumb session={session} size="sm" className="aspect-video w-32 shrink-0 sm:w-44" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3">
        <p className="truncate font-mono text-[10px] uppercase tracking-widest text-accent-700">{session.interestName}</p>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{session.title}</p>
        <p className="text-xs text-mute">
          {session.durationMinutes} min &middot;{' '}
          <span className={cn('font-semibold tnum', session.watched ? 'text-teal-700' : 'text-accent-600')}>
            {session.watched ? 'Watched' : `+${session.points} pts`}
          </span>
        </p>
      </div>
    </Link>
  );
}

/** One upcoming session: a date block, then what and who. Not a link until it's live. */
export function UpcomingRow({ session }) {
  const { day, month, time } = sessionDateParts(session.scheduledAt);
  return (
    <li className="flex items-center gap-4 py-3.5">
      <span className="grid w-12 shrink-0 place-items-center rounded-md border border-line py-1.5 text-center" aria-hidden="true">
        <span className="font-display text-lg font-extrabold leading-none text-ink tnum">{day}</span>
        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-mute">{month}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{session.title}</span>
        <span className="block truncate text-xs text-mute">
          <span className="sr-only">{sessionWhen(session.scheduledAt)} &middot; </span>
          <span aria-hidden="true">{time}</span>
          {speakerLine(session) && <> &middot; {speakerLine(session)}</>}
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-accent-600 tnum">+{session.points}</span>
    </li>
  );
}

/** Earlier sessions the student can still watch. */
export function PastRow({ session }) {
  return (
    <li>
      <Link
        to={`/sessions/${session.id}`}
        className="group flex items-center gap-4 rounded-sm py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <SessionThumb session={{ ...session, watched: false }} size="sm" className="aspect-video w-24 shrink-0 rounded-md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink group-hover:text-accent-700">{session.title}</span>
          <span className="block truncate text-xs text-mute">{sessionWhen(session.scheduledAt)}</span>
        </span>
        <span className={cn('shrink-0 text-xs font-semibold tnum', session.watched ? 'text-teal-700' : 'text-accent-600')}>
          {session.watched ? 'Watched' : `+${session.points}`}
        </span>
      </Link>
    </li>
  );
}
