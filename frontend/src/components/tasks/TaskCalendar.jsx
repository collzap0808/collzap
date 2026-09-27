import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../store/useTaskStore';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// "Today" is decided in IST, the same zone the backend buckets submissions in,
// so a late-night submission and the highlighted square always agree.
function istToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  return parts; // "YYYY-MM-DD"
}

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/**
 * One month of daily task submissions, one square per day. Only a submission
 * fills a day — the same rule the streak uses — so the graph and the streak
 * number on the desk never contradict each other.
 */
export default function TaskCalendar({ className }) {
  const { calendar, fetchCalendar } = useTaskStore();
  const today = istToday();
  const currentMonth = today.slice(0, 7);
  const [month, setMonth] = useState(currentMonth);

  useEffect(() => {
    fetchCalendar(month).catch(() => {});
  }, [month]);

  const counts = new Map(
    (calendar?.month === month ? calendar.days : []).map((d) => [d.date, d.submissions])
  );

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  // Monday-first: getUTCDay() is 0 for Sunday, so shift it to the end.
  const leadingBlanks = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;

  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = `${month}-${String(day).padStart(2, '0')}`;
    return { day, date, submissions: counts.get(date) || 0 };
  });

  const elapsed = cells.filter((c) => c.date <= today).length;
  const doneDays = cells.filter((c) => c.submissions > 0).length;
  const isCurrent = month === currentMonth;

  return (
    <section className={cn('w-full max-w-sm rounded-lg border border-line bg-surface p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">{monthLabel(month)}</h2>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mute tnum">
            {doneDays} of {elapsed} {elapsed === 1 ? 'day' : 'days'} done
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth((cur) => shiftMonth(cur, -1))}
            aria-label="Previous month"
            className="grid h-8 w-8 place-items-center rounded text-mute transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setMonth((cur) => shiftMonth(cur, 1))}
            disabled={isCurrent}
            aria-label="Next month"
            className="grid h-8 w-8 place-items-center rounded text-mute transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="sr-only">
        Daily task submitted on {doneDays} of {elapsed} days in {monthLabel(month)}.
      </p>

      <div className="mt-3 grid grid-cols-7 gap-1.5" aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-center font-mono text-[9px] uppercase text-mute">{d}</span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => <span key={`b${i}`} />)}
        {cells.map((c) => {
          const future = c.date > today;
          const isToday = c.date === today;
          const done = c.submissions > 0;
          return (
            <span
              key={c.date}
              title={`${c.day} ${monthLabel(month)}: ${done ? 'task submitted' : future ? 'upcoming' : 'not submitted'}`}
              className={cn(
                'grid aspect-square place-items-center rounded-sm border text-[9px] tnum',
                done && c.submissions > 1 && 'border-teal-600 bg-teal-600 text-white',
                done && c.submissions === 1 && 'border-teal-500 bg-teal-500 text-white',
                !done && !future && 'border-line bg-surface-2 text-mute',
                future && 'border-transparent bg-ink/[0.02] text-mute/50',
                isToday && !done && 'border-accent-500 text-ink'
              )}
            >
              {c.day}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-mute">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal-500" /> Submitted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-line bg-surface-2" /> Missed
        </span>
      </div>
    </section>
  );
}
