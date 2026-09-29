import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock3, MessageSquare, Search, Sparkles, Target, UserRound } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { cn } from '../../lib/utils';
import { useUserStore } from '../../store/useUserStore';
import { LEVEL, SHAPE, formatWaiting, matchReasons, ordinalYear, spotsLabel } from './matchData';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';
const card = 'rounded-lg border border-line bg-surface shadow-sm';
const primaryBtn = cn('inline-flex items-center justify-center gap-1.5 rounded-md bg-accent-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-600', focusRing);
const secondaryBtn = cn('inline-flex items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent-400 hover:bg-accent-50', focusRing);

/* ---------------------------------------------------------------- summary */

export function SummaryRow({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
      {items.map((m) => (
        <div key={m.label} className="bg-surface px-4 py-3">
          <dd className="font-display text-2xl font-extrabold leading-none tracking-tightest text-ink tnum">{m.value}</dd>
          <dt className="mt-1 text-xs text-mute">{m.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------- tabs */

export function MatchTabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" aria-label="Matches" className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={cn(
              'relative -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
              on ? 'border-accent-500 text-ink' : 'border-transparent text-mute hover:text-ink',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500'
            )}
          >
            {t.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none tnum', on ? 'bg-accent-500 text-white' : 'bg-surface-2 text-mute')}>
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- filters */

const selectCls = 'h-9 shrink-0 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25';

export function FilterBar({ filters, setFilters, interests, levels, years }) {
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const active = filters.q || filters.interest || filters.level || filters.year;
  return (
    <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      <label className="relative shrink-0">
        <span className="sr-only">Search peers</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" aria-hidden="true" />
        <input
          type="search"
          value={filters.q}
          onChange={set('q')}
          placeholder="Search peers"
          className="h-9 w-44 rounded-md border border-line bg-surface pl-8 pr-2.5 text-xs text-ink placeholder:text-mute/70 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25 sm:w-56"
        />
      </label>
      <select value={filters.interest} onChange={set('interest')} aria-label="Interest" className={selectCls}>
        <option value="">All interests</option>
        {interests.map((i) => <option key={i} value={i}>{i}</option>)}
      </select>
      <select value={filters.level} onChange={set('level')} aria-label="Skill level" className={selectCls}>
        <option value="">Any skill level</option>
        {levels.map((l) => <option key={l} value={l}>{LEVEL[l] || l}</option>)}
      </select>
      <select value={filters.year} onChange={set('year')} aria-label="Year" className={selectCls}>
        <option value="">Any year</option>
        {years.map((y) => <option key={y} value={y}>{ordinalYear(y)}</option>)}
      </select>
      {active && (
        <button
          onClick={() => setFilters({ q: '', interest: '', level: '', year: '' })}
          className={cn('shrink-0 rounded-sm px-1 text-xs font-medium text-accent-700 hover:underline', focusRing)}
        >
          Clear
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ person card */

export function PersonCard({ person, onOpen }) {
  const reasons = matchReasons(person);
  const chat = person.groups.find((g) => g.chatRoomId);
  const meta = [ordinalYear(person.yearOfStudy), LEVEL[person.level]].filter(Boolean).join(' · ');
  return (
    <li className={cn(card, 'flex flex-col p-4 transition-[border-color,box-shadow] duration-150 hover:border-accent-300 hover:shadow-md')}>
      <button onClick={onOpen} className={cn('flex items-start gap-3 rounded-md text-left', focusRing)} aria-label={`Why you match with ${person.name}`}>
        <Avatar src={person.profilePhotoUrl} name={person.name} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-bold text-ink">{person.name}</span>
            {person.isNew && <span className="shrink-0 rounded-full bg-accent-50 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700">New</span>}
          </span>
          {meta && <span className="mt-0.5 block text-xs text-mute">{meta}</span>}
        </span>
      </button>

      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Shared interests">
        {person.groups.map((g) => (
          <li key={g.id} className="max-w-full truncate rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink/85">{g.interestName}</li>
        ))}
      </ul>

      <div className="mt-3 border-t border-line pt-3">
        <p className="text-[11px] font-semibold text-mute">Why you match</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {reasons.slice(1, 4).map((r) => (
            <li key={r} className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-[11px] text-ink/85">
              <Check className="h-3 w-3 text-accent-600" strokeWidth={2.5} aria-hidden="true" /> {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 pt-0.5">
        <Link to={`/profile/${person.userId}`} className={secondaryBtn}>View profile</Link>
        {chat ? (
          <Link to={`/chat/${chat.chatRoomId}`} className={primaryBtn}>
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Message
          </Link>
        ) : (
          <button onClick={onOpen} className={primaryBtn}>Details</button>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------- group card */

export function GroupCard({ group }) {
  const others = (group.members || []).filter((m) => !m.self);
  const shape = SHAPE[group.connectionType];
  return (
    <li className={cn(card, 'flex flex-col p-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold leading-snug text-ink" title={group.interestName}>{group.interestName}</p>
          <p className="mt-0.5 text-xs text-mute">
            {shape?.long || 'Group'}{group.levelBand && <> &middot; {LEVEL[group.levelBand]}</>}
          </p>
        </div>
        <span className="shrink-0 text-[11px] text-mute">{spotsLabel(group)}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex -space-x-2">
          {others.slice(0, 4).map((m) => (
            <Avatar key={m.userId} src={m.profilePhotoUrl} name={m.name} size="sm" className="ring-2 ring-surface" />
          ))}
        </span>
        <span className="min-w-0 truncate text-xs text-ink/85">
          {others.length === 0 ? 'Just you so far' : others.slice(0, 2).map((m) => m.name.split(' ')[0]).join(', ')}
          {others.length > 2 && ` +${others.length - 2}`}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to={`/matches/${group.id}`} className={secondaryBtn}>Details</Link>
        {group.chatRoomId ? (
          <Link to={`/chat/${group.chatRoomId}`} className={primaryBtn}>
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Open chat
          </Link>
        ) : <span />}
      </div>
    </li>
  );
}

/* ----------------------------------------------------------- waiting card */

export function WaitingCard({ group }) {
  const shape = SHAPE[group.connectionType];
  const waited = formatWaiting(group.waitingSeconds);
  return (
    <li className={cn(card, 'flex items-start gap-3 p-4')}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-wait/10 text-wait">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{group.interestName}</p>
        <p className="mt-0.5 text-xs text-mute">
          {shape?.short || 'Group'}{group.levelBand && <> &middot; {LEVEL[group.levelBand]}</>}
          {group.connectionType !== 'ONE_ON_ONE' && <> &middot; {group.memberCount} of {group.maxMembers} joined</>}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-mute">
          We&rsquo;ll add you as soon as someone on campus at your level picks this.
        </p>
      </div>
      {waited && <span className="shrink-0 text-[11px] font-medium text-wait tnum">Waiting {waited}</span>}
    </li>
  );
}

/* ------------------------------------------------------- why-you-match panel */

export function WhyMatch({ person }) {
  const { peerProfile, fetchPeerProfile } = useUserStore();
  const profile = peerProfile?.id === person.userId ? peerProfile : null;

  useEffect(() => {
    fetchPeerProfile(person.userId).catch(() => {});
  }, [person.userId]);

  const reasons = matchReasons(person);
  const chat = person.groups.find((g) => g.chatRoomId);
  const skills = (profile?.interests || []).filter((i) => i.level);
  const goal = (profile?.interests || []).find((i) => i.projectType === 'SHORT_TERM');

  return (
    <div className="space-y-5 px-4 pb-5">
      <div className="flex items-center gap-3">
        <Avatar src={person.profilePhotoUrl} name={person.name} size="xl" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-ink">{person.name}</p>
          <p className="text-xs text-mute">
            {[profile?.course, ordinalYear(person.yearOfStudy)].filter(Boolean).join(' · ')}
          </p>
          {profile?.collegeName && <p className="truncate text-xs text-mute">{profile.collegeName}</p>}
        </div>
      </div>

      <section className="rounded-lg bg-accent-50/60 p-3.5">
        <h3 className="text-xs font-bold text-accent-700">Why you match</h3>
        <ul className="mt-2 space-y-1.5">
          {reasons.map((r) => (
            <li key={r} className="flex items-center gap-2 text-sm text-ink">
              <Check className="h-4 w-4 shrink-0 text-accent-600" strokeWidth={2.5} aria-hidden="true" /> {r}
            </li>
          ))}
        </ul>
      </section>

      {!profile ? (
        <div className="flex justify-center py-6 text-accent-500"><Spinner /></div>
      ) : (
        <>
          {profile.storyPrompt1 && (
            <section>
              <h3 className="text-xs font-semibold text-mute">About {person.name.split(' ')[0]}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink">{profile.storyPrompt1}</p>
            </section>
          )}
          {skills.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-mute">Skills</h3>
              <ul className="mt-1.5 space-y-1">
                {skills.map((s) => (
                  <li key={`${s.interestName}-${s.projectType}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-ink">{s.subTag || s.interestName}</span>
                    <span className="shrink-0 text-xs text-mute">{LEVEL[s.level]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {goal && (
            <section className="flex items-center gap-2 text-sm text-ink">
              <Target className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
              <span><span className="text-mute">Current goal:</span> {goal.interestName}</span>
            </section>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
        <Link to={`/profile/${person.userId}`} className={secondaryBtn}>
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> Full profile
        </Link>
        {chat && (
          <Link to={`/chat/${chat.chatRoomId}`} className={primaryBtn}>
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Message
          </Link>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- explore */

/**
 * What the rest of campus is into, as counts only. A short-term interest you
 * haven't picked can become your goal in one tap; long-term picks are locked
 * once set, so those tiles are information, not buttons.
 */
export function ExploreSection({ counts, mine, onPickShortTerm }) {
  if (!counts || counts.length === 0) return null;
  const top = counts.slice(0, 6);
  return (
    <section aria-labelledby="m-explore">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="m-explore" className="font-display text-xl font-bold tracking-tight text-ink">Explore more students</h2>
        <p className="text-xs text-mute">What students on your campus are into</p>
      </div>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((c) => {
          const isMine = mine.has(c.interestName);
          const canPick = c.category === 'SHORT_TERM' && !isMine;
          const inner = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{c.interestName}</span>
                <span className="block text-xs text-mute">
                  <span className="font-semibold text-ink tnum">{c.students}</span> student{c.students === 1 ? '' : 's'}
                  {' · '}{c.category === 'SHORT_TERM' ? 'Short-term' : 'Long-term'}
                </span>
              </span>
              {isMine ? (
                <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">You&rsquo;re in</span>
              ) : canPick ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-700">
                  Make it my goal <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              ) : null}
            </>
          );
          return (
            <li key={c.interestId}>
              {canPick ? (
                <button onClick={onPickShortTerm} className={cn(card, 'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:border-accent-300', focusRing)}>
                  {inner}
                </button>
              ) : (
                <div className={cn(card, 'flex items-center gap-3 px-4 py-3 shadow-none')}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------- empty state */

export function NoMatchesYet({ onFind, onUpdateGoal, finding, locked }) {
  return (
    <div className={cn(card, 'px-6 py-10 text-center shadow-none')}>
      <Sparkles className="mx-auto h-6 w-6 text-accent-500" strokeWidth={1.6} aria-hidden="true" />
      <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-ink">No matches yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-mute">
        {locked
          ? 'Matching unlocks once your student ID is verified.'
          : 'Tap Find peers and we’ll place you with students on your campus who share your interests and level.'}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button onClick={onFind} disabled={finding || locked} className={cn(primaryBtn, 'px-4 disabled:opacity-50')}>Find peers</button>
        <button onClick={onUpdateGoal} className={cn(secondaryBtn, 'px-4')}>Update your goal</button>
      </div>
    </div>
  );
}
