import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConnectionField from '../../components/brand/ConnectionField';
import { LogoMark } from '../../components/brand/Logo';
import { api } from '../../api/api';
import { useMatchStore } from '../../store/useMatchStore';
import { useUserStore } from '../../store/useUserStore';
import { useInterestStore } from '../../store/useInterestStore';
import { page, useReducedMotion, transition } from '../../lib/motion';
import ChatDrawer from '../chat/ChatDrawer';
import ShortTermInterestModal from '../home/ShortTermInterestModal';
import {
  ExploreSection, FilterBar, GroupCard, MatchTabs, NoMatchesYet, PersonCard, SummaryRow, WaitingCard, WhyMatch,
} from './MatchSections';
import { peopleFromCircle } from './matchData';

// Long enough that the search's own latency doesn't make the overlay flash.
const SEARCH_MIN_MS = 1400;

const OUTCOME_COPY = {
  MATCHED: { variant: 'success', label: 'Matched' },
  QUEUED: { variant: 'warning', label: 'Waiting' },
  ALREADY_MATCHED: { variant: 'secondary', label: 'Already in' },
};

const NO_FILTERS = { q: '', interest: '', level: '', year: '' };

/**
 * The search running, as the brand's own visual. Same ConnectionField the
 * auth screen uses, so this reads as one product rather than a spinner.
 */
function SearchingOverlay({ open }) {
  const reduced = useReducedMotion();

  // Portalled to body: AppShell's page wrapper is a motion.div, and a transform
  // on an ancestor would scope `position: fixed` to it instead of the viewport.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.28 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#08101F]"
          role="status"
          aria-live="polite"
        >
          <div className="absolute inset-0">
            <ConnectionField />
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(90% 70% at 50% 50%, transparent 25%, rgba(8,16,31,0.8) 100%)',
            }}
          />

          <div className="relative flex flex-col items-center px-8 text-center">
            <motion.div
              animate={reduced ? undefined : { scale: [1, 1.06, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <LogoMark className="h-14" />
            </motion.div>

            <p className="mt-8 font-display text-2xl font-bold tracking-tight text-[#E8F0FE]">
              Finding your people…
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#A8BDD8]">
              Matching on your interests, your skill level and your campus.
            </p>

            <div className="mt-8 flex items-center gap-2" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="grad-brand h-1.5 w-1.5 rounded-full"
                  animate={reduced ? undefined : { opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/**
 * Matches: the people and groups the matcher placed you with, why, and what
 * the rest of campus is into. Matching itself is automatic — Find peers places
 * you per interest — so there are no scores or connect requests here, only the
 * real reasons and the real next step (Message).
 */
export default function MatchesPage() {
  const navigate = useNavigate();
  const { circle, fetchCircle, findMatches, loading } = useMatchStore();
  const { profile, fetchMe } = useUserStore();
  const { myInterests, fetchMyInterests } = useInterestStore();
  const [activeTab, setActiveTab] = useState('PEOPLE');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [matchResults, setMatchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [openPerson, setOpenPerson] = useState(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [campus, setCampus] = useState(null);
  const searchTimer = useRef(null);
  const reduced = useReducedMotion();
  const tabletUp = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    fetchCircle().catch(console.error);
    fetchMyInterests().catch(() => {});
    if (!profile) fetchMe().catch(console.error);
    api.get('/interests/campus').then(setCampus).catch(() => setCampus([]));
  }, []);

  // The overlay is dismissed on a timer, which can outlive the page.
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const isVerified = profile?.verificationStatus === 'APPROVED';
  const connections = useMemo(() => circle?.connections || [], [circle]);
  const waiting = circle?.waiting || [];
  const people = useMemo(() => peopleFromCircle(connections), [connections]);
  const mine = useMemo(
    () => new Set((Array.isArray(myInterests) ? myInterests : []).map((i) => i.interestName || i.name)),
    [myInterests]
  );

  const filterOptions = useMemo(() => ({
    interests: [...new Set(people.flatMap((p) => p.groups.map((g) => g.interestName)))].sort(),
    levels: ['BEGINNER', 'LEARNING', 'INTERMEDIATE', 'EXPERT'].filter((l) => people.some((p) => p.level === l)),
    years: [...new Set(people.map((p) => p.yearOfStudy).filter(Boolean))].sort((a, b) => a - b),
  }), [people]);

  const q = filters.q.trim().toLowerCase();
  const shownPeople = people.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (filters.interest && !p.groups.some((g) => g.interestName === filters.interest)) return false;
    if (filters.level && p.level !== filters.level) return false;
    if (filters.year && String(p.yearOfStudy) !== filters.year) return false;
    return true;
  });

  const handleFindMatches = async () => {
    if (!isVerified) {
      toast.error('Matching unlocks once someone checks your ID.');
      return;
    }
    setSearching(true);
    const startedAt = Date.now();
    let onDone = () => {};

    try {
      const response = await findMatches();
      const results = response.results || [];
      if (results.length > 0) {
        fetchCircle().catch(console.error);
        onDone = () => setMatchResults(results);
      } else {
        onDone = () => {
          setMatchResults(results);
          toast.error('Pick an interest first, then we can find you peers.');
        };
      }
    } catch (error) {
      onDone = () => toast.error(error.message || 'Could not find peers right now');
    } finally {
      // Hold the overlay a beat so a fast search doesn't just blink.
      const wait = reduced ? 0 : Math.max(0, SEARCH_MIN_MS - (Date.now() - startedAt));
      searchTimer.current = setTimeout(() => {
        setSearching(false);
        onDone();
      }, wait);
    }
  };

  const locked = !!profile && !isVerified;
  const summary = [
    { label: 'People matched', value: people.length },
    { label: 'New this week', value: people.filter((p) => p.isNew).length },
    { label: 'Waiting', value: waiting.length },
    { label: 'Groups & pairs', value: connections.length },
  ];
  const tabs = [
    { key: 'PEOPLE', label: 'Your people', count: people.length },
    { key: 'GROUPS', label: 'Groups', count: connections.length },
    { key: 'WAITING', label: 'Waiting', count: waiting.length },
  ];
  const empty = (
    <NoMatchesYet onFind={handleFindMatches} onUpdateGoal={() => setGoalOpen(true)} finding={searching} locked={locked} />
  );

  return (
    <div className="space-y-8">
      <SearchingOverlay open={searching} />

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[32px] font-extrabold leading-tight tracking-tightest text-ink">Matches</h1>
          <p className="mt-1.5 text-[15px] font-medium text-ink/85">Find students who share your interests, goals, and campus.</p>
          <p className="mt-1 max-w-xl text-sm text-mute">
            Your matches are based on your interests, skill level, and what you&rsquo;re looking to work on.
          </p>
        </div>
        <Button
          onClick={handleFindMatches}
          loading={loading || searching}
          variant="gradient"
          icon={<UserPlus className="h-4 w-4" />}
          className="shrink-0"
        >
          Find peers
        </Button>
      </header>

      {locked && (
        <p className="rounded-lg border border-wait/30 bg-wait/[0.07] px-4 py-3 text-sm text-ink">
          Your ID is still with a reviewer. Matching unlocks once it&rsquo;s approved.{' '}
          <button
            onClick={() => navigate('/onboarding')}
            className="rounded-sm font-semibold text-accent-700 underline decoration-accent-300 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            Check status
          </button>
        </p>
      )}

      {/* What the last Find peers run did, per interest. */}
      <AnimatePresence>
        {matchResults && matchResults.length > 0 && (
          <motion.section
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transition(page, reduced)}
            className="rounded-lg border border-line bg-surface p-4"
            aria-label="Latest search"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-ink">Latest search</h2>
              <button
                onClick={() => setMatchResults(null)}
                aria-label="Dismiss"
                className="grid h-7 w-7 place-items-center rounded-md text-mute hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <ul className="divide-y divide-line">
              {matchResults.map((result, idx) => {
                const meta = OUTCOME_COPY[result.outcome] || OUTCOME_COPY.QUEUED;
                return (
                  <li key={`${result.interestId}-${idx}`} className="flex items-center justify-between gap-4 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">{result.interestName}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                      {result.message && <p className="mt-0.5 truncate text-xs text-mute">{result.message}</p>}
                    </div>
                    {result.outcome === 'MATCHED' && result.group?.chatRoomId && (
                      <Button variant="secondary" size="sm" className="shrink-0" onClick={() => navigate(`/chat/${result.group.chatRoomId}`)}>
                        Open chat
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}
      </AnimatePresence>

      <SummaryRow items={summary} />

      <section className="space-y-4" aria-label="Your matches">
        <MatchTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'PEOPLE' && (people.length === 0 ? empty : (
          <>
            <FilterBar filters={filters} setFilters={setFilters} {...filterOptions} />
            {shownPeople.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
                Nobody matches those filters.{' '}
                <button onClick={() => setFilters(NO_FILTERS)} className="rounded-sm font-semibold text-accent-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
                  Clear filters
                </button>
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shownPeople.map((p) => <PersonCard key={p.userId} person={p} onOpen={() => setOpenPerson(p)} />)}
              </ul>
            )}
          </>
        ))}

        {activeTab === 'GROUPS' && (connections.length === 0 ? empty : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((g) => <GroupCard key={g.id} group={g} />)}
          </ul>
        ))}

        {activeTab === 'WAITING' && (waiting.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
            Not waiting on anything. When an interest needs one more person, it shows up here.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {waiting.map((g) => <WaitingCard key={g.id} group={g} />)}
          </ul>
        ))}
      </section>

      <ExploreSection counts={campus} mine={mine} onPickShortTerm={() => setGoalOpen(true)} />

      <ChatDrawer
        open={!!openPerson}
        onClose={() => setOpenPerson(null)}
        side={tabletUp ? 'right' : 'bottom'}
        title="Why you match"
      >
        {openPerson && <WhyMatch person={openPerson} />}
      </ChatDrawer>

      <ShortTermInterestModal
        open={goalOpen}
        onClose={() => { setGoalOpen(false); fetchMyInterests().catch(() => {}); }}
      />
    </div>
  );
}
