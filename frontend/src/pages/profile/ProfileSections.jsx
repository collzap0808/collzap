import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Building2, CalendarDays, ClipboardCheck, ExternalLink, Flame, GraduationCap,
  Lightbulb, Link2, Lock, Mail, MapPin, PlayCircle, ShieldCheck, Target, Trophy,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { cn } from '../../lib/utils';
import { LEVEL, ordinalYear } from './profileData';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';
const card = 'rounded-lg border border-line bg-surface';

function SectionHeading({ children, aside }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-base font-bold tracking-tight text-ink">{children}</h2>
      {aside}
    </div>
  );
}

/* ------------------------------------------------------------------ header */

export function ProfileHeader({ profile, interests, verified, stats, actions, avatarSlot, children }) {
  const line = [profile.course, profile.collegeName].filter(Boolean).join(' · ');
  const meta = [ordinalYear(profile.yearOfStudy), profile.city].filter(Boolean);
  const tags = [...new Set(interests.map((i) => i.name))];

  return (
    <header className={cn(card, 'overflow-hidden')}>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
        <div className="flex items-start gap-4 sm:contents">
          <div className="shrink-0">
            {avatarSlot || <Avatar src={profile.profilePhotoUrl} name={profile.name} size="2xl" className="max-sm:h-20 max-sm:w-20" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tightest text-ink sm:text-[32px]">
                {profile.name}
              </h1>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-good/30 bg-good/10 px-2 py-0.5 text-[11px] font-semibold text-good">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified student
                </span>
              )}
            </div>
            {line && <p className="mt-1 text-sm font-medium text-ink/85">{line}</p>}
            {meta.length > 0 && (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-mute">
                {meta.map((m) => <span key={m} className="capitalize">{m}</span>)}
              </p>
            )}

            {profile.storyPrompt1 && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">{profile.storyPrompt1}</p>
            )}

            {tags.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Interests">
                {tags.map((t) => (
                  <li key={t} className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">{t}</li>
                ))}
              </ul>
            )}

            {stats && (stats.totalPoints > 0 || stats.currentStreakDays > 0) && (
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <Trophy className="h-4 w-4 text-accent-600" aria-hidden="true" />
                  <span className="font-semibold tnum">{stats.totalPoints.toLocaleString('en-IN')}</span>
                  <span className="text-mute">points</span>
                </span>
                {stats.currentStreakDays > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-ink">
                    <Flame className="h-4 w-4 text-wait" aria-hidden="true" />
                    <span className="font-semibold tnum">{stats.currentStreakDays}-day</span>
                    <span className="text-mute">streak</span>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** A thin strip under the header — never its own card. */
export function CompletionMeter({ pct, missing, onComplete }) {
  if (pct >= 100) return null;
  return (
    <div className="flex flex-col gap-2 border-t border-line bg-surface-2/40 px-5 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
      <p className="shrink-0 text-xs text-ink">
        Profile <span className="font-semibold tnum">{pct}%</span> complete
      </p>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Profile completion">
        <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="truncate text-xs text-mute sm:max-w-[16rem]">Add your {missing.slice(0, 2).join(' and ')}</p>
      <button onClick={onComplete} className={cn('inline-flex shrink-0 items-center gap-1 self-start rounded-sm text-xs font-semibold text-accent-700 hover:underline hover:underline-offset-4 sm:self-auto', focusRing)}>
        Complete profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------ looking to work on */

export function LookingToWorkOn({ interests, nowText, name }) {
  const longTerm = interests.filter((i) => i.projectType === 'LONG_TERM');
  const shortTerm = interests.filter((i) => i.projectType === 'SHORT_TERM');
  const rows = [...longTerm, ...shortTerm];
  return (
    <section className={cn(card, 'p-5')} aria-labelledby="p-looking">
      <SectionHeading><span id="p-looking">Looking to work on</span></SectionHeading>
      {rows.length === 0 ? (
        <p className="text-sm text-mute">{name ? `${name} hasn’t picked interests yet.` : 'No interests picked yet.'}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((i) => (
            <li key={`${i.name}-${i.projectType}`} className="flex items-start gap-3 rounded-md bg-surface-2/60 px-3 py-2.5">
              <span className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md', i.projectType === 'LONG_TERM' ? 'bg-accent-50 text-accent-700' : 'bg-teal-50 text-teal-700')}>
                {i.projectType === 'LONG_TERM' ? <GraduationCap className="h-4 w-4" aria-hidden="true" /> : <Target className="h-4 w-4" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{i.name}</span>
                <span className="block text-xs text-mute">
                  {i.projectType === 'LONG_TERM' ? 'Long-term partner' : 'Short-term, right now'}
                  {i.subTag && <> &middot; {i.subTag}</>}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {nowText && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <Lightbulb className="h-3.5 w-3.5 text-wait" aria-hidden="true" /> Working on right now
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/90">{nowText}</p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ current goal */

export function CurrentGoal({ goal, owner, onChange }) {
  return (
    <section className="flex items-start gap-3 rounded-lg border border-dashed border-line px-4 py-3.5" aria-labelledby="p-goal">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal-50 text-teal-700">
        <Target className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="p-goal" className="text-xs font-medium text-mute">Current goal</h2>
        <p className="mt-0.5 text-sm font-semibold text-ink">{goal ? goal.name : 'No short-term goal set'}</p>
        <p className="mt-0.5 text-xs text-mute">
          {goal
            ? owner ? 'Matched with peers working on the same thing this month.' : 'Their short-term focus this month.'
            : owner ? 'Pick one to get matched on something quick.' : 'Nothing short-term right now.'}
        </p>
      </div>
      {owner && (
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Link to="/matches" className={cn('inline-flex items-center gap-1 rounded-md bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-600', focusRing)}>
            Find people
          </Link>
          {onChange && (
            <button onClick={onChange} className={cn('rounded-sm text-[11px] font-medium text-mute hover:text-ink', focusRing)}>
              {goal ? 'Change' : 'Choose one'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ skills */

function LevelMeter({ rank }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={cn('h-2.5 w-1.5 rounded-[2px]', n <= rank ? 'bg-accent-500' : 'bg-line')} />
      ))}
    </span>
  );
}

/** Skill = the focus inside an interest, rated by the one-time assessment. */
export function SkillsCard({ interests }) {
  const skills = interests.filter((i) => i.level && LEVEL[i.level]);
  if (skills.length === 0) return null;
  return (
    <section className={cn(card, 'p-5')} aria-labelledby="p-skills">
      <SectionHeading aside={<span className="text-[11px] text-mute">From the skill assessment</span>}>
        <span id="p-skills">Skills</span>
      </SectionHeading>
      <ul className="divide-y divide-line">
        {skills.map((s) => {
          const lvl = LEVEL[s.level];
          return (
            <li key={`${s.name}-${s.projectType}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{s.subTag || s.name}</span>
                {s.subTag && <span className="block truncate text-[11px] text-mute">{s.name}</span>}
              </span>
              <LevelMeter rank={lvl.rank} />
              <span className="w-20 shrink-0 text-right text-xs font-medium text-ink/80">{lvl.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------- about */

export function AboutCard({ profile, owner }) {
  const rows = [
    { icon: BookOpen, label: 'Course', value: profile.course },
    { icon: CalendarDays, label: 'Year', value: ordinalYear(profile.yearOfStudy) },
    { icon: Building2, label: 'College', value: profile.collegeName, wide: true },
    { icon: MapPin, label: 'Location', value: profile.city },
  ].filter((r) => r.value);

  return (
    <section className={cn(card, 'p-5')} aria-labelledby="p-about">
      <SectionHeading><span id="p-about">About</span></SectionHeading>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
        {rows.map((r) => (
          <div key={r.label} className={cn('min-w-0', r.wide && 'col-span-2')}>
            <dt className="flex items-center gap-1.5 text-[11px] text-mute">
              <r.icon className="h-3.5 w-3.5" aria-hidden="true" /> {r.label}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-medium capitalize text-ink">{r.value}</dd>
          </div>
        ))}
        {profile.proofOfWorkUrl && (
          <div className="col-span-2 min-w-0">
            <dt className="flex items-center gap-1.5 text-[11px] text-mute"><Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Portfolio</dt>
            <dd className="mt-0.5">
              <a href={profile.proofOfWorkUrl} target="_blank" rel="noreferrer" className={cn('inline-flex max-w-full items-center gap-1 truncate rounded-sm text-sm font-medium text-accent-700 hover:underline hover:underline-offset-4', focusRing)}>
                <span className="truncate">{profile.proofOfWorkUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
            </dd>
          </div>
        )}
        {owner && profile.email && (
          <div className="col-span-2 min-w-0 border-t border-line pt-3">
            <dt className="flex items-center gap-1.5 text-[11px] text-mute">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email
              <span className="inline-flex items-center gap-0.5 text-mute/80"><Lock className="h-3 w-3" aria-hidden="true" /> only you</span>
            </dt>
            <dd className="mt-0.5 truncate text-sm text-ink/85">{profile.email}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

/** The third prompt, as a small aside rather than a questionnaire field. */
export function FunFact({ text }) {
  if (!text) return null;
  return (
    <section className="rounded-lg bg-surface-2/60 px-5 py-4" aria-labelledby="p-fact">
      <h2 id="p-fact" className="text-xs font-semibold text-mute">Something people find out late</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink">{text}</p>
    </section>
  );
}

/* ---------------------------------------------------------------- activity */

export function ActivityCard({ stats }) {
  if (!stats) return null;
  const items = [
    { icon: Trophy, label: 'Points', value: stats.totalPoints ?? 0, tone: 'text-accent-600' },
    { icon: Flame, label: 'Day streak', value: stats.currentStreakDays ?? 0, tone: 'text-wait' },
    { icon: ClipboardCheck, label: 'Tasks done', value: stats.tasksDone ?? 0, tone: 'text-mute' },
    { icon: PlayCircle, label: 'Sessions', value: stats.sessionsWatched ?? 0, tone: 'text-mute' },
  ];
  return (
    <section className={cn(card, 'p-5')} aria-labelledby="p-activity">
      <SectionHeading
        aside={(
          <Link to="/home" className={cn('inline-flex items-center gap-1 rounded-sm text-xs font-medium text-mute hover:text-accent-700', focusRing)}>
            View activity <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      >
        <span id="p-activity">Activity</span>
      </SectionHeading>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="min-w-0">
            <dd className="flex items-center gap-1.5 font-display text-xl font-extrabold tracking-tightest text-ink tnum">
              <m.icon className={cn('h-4 w-4 shrink-0', m.tone)} aria-hidden="true" />
              {m.value.toLocaleString('en-IN')}
            </dd>
            <dt className="mt-0.5 text-[11px] text-mute">{m.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
