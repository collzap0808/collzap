import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Clock3, MessageSquare, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import ShortTermInterestModal from './ShortTermInterestModal';
import TaskCalendar from '../../components/tasks/TaskCalendar';
import PotentialTracker from '../../components/tasks/PotentialTracker';
import { SessionStrip } from '../../components/sessions/SessionCards';
import { useMatchStore } from '../../store/useMatchStore';
import { useChatStore } from '../../store/useChatStore';
import { useUserStore } from '../../store/useUserStore';
import { useInterestStore } from '../../store/useInterestStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useSessionStore } from '../../store/useSessionStore';
import { listItemVariants, listVariants, reduceVariants, useReducedMotion } from '../../lib/motion';

function relativeTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const secs = Math.floor((Date.now() - date) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  if (secs < 172800) return 'yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** A quiet placeholder row for an empty list — a hairline dashed panel, not a bare sentence. */
function EmptyRow(props) {
  // `{ icon: Icon }` destructured straight into an unconditional `<Icon/>`
  // return false-positives this project's no-unused-vars (confirmed in
  // isolation; EmptyState.jsx's `{Icon && <Icon/>}` doesn't trip it). A
  // local `const Icon` sidesteps it and matches the ignore pattern either way.
  const Icon = props.icon;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-line px-4 py-5">
      <Icon className="h-4 w-4 shrink-0 text-mute" strokeWidth={1.8} aria-hidden="true" />
      <p className="text-sm text-mute">{props.children}</p>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { circle, fetchCircle } = useMatchStore();
  const { chatList, fetchChatList } = useChatStore();
  const { profile } = useUserStore();
  const { projectTypes, myInterests, fetchProjectTypes, fetchMyInterests, selectProjectTypes } = useInterestStore();
  const { myStats, fetchMyStats } = useTaskStore();
  const { sessions, fetchSessions } = useSessionStore();
  const reduced = useReducedMotion();
  const [shortTermModalOpen, setShortTermModalOpen] = useState(false);
  const [addingLongTerm, setAddingLongTerm] = useState(false);

  useEffect(() => {
    fetchCircle().catch(console.error);
    fetchChatList().catch(console.error);
    fetchProjectTypes().catch(console.error);
    fetchMyInterests().catch(console.error);
    fetchMyStats().catch(console.error);
    fetchSessions().catch(console.error);
  }, []);

  const weeklySession = sessions?.featured;

  const hasLongTerm = projectTypes.has('LONG_TERM');
  const currentShortTerm = myInterests.find((i) => i.projectType === 'SHORT_TERM');

  const handleAddLongTerm = async () => {
    if (!window.confirm(
      "Set up long-term matching? This can only be done once — the interests, the assessment, " +
      "and the format you pick can't be changed afterward."
    )) {
      return;
    }
    setAddingLongTerm(true);
    try {
      await selectProjectTypes(new Set([...projectTypes, 'LONG_TERM']));
      navigate('/onboarding');
    } catch (error) {
      toast.error(error.message || 'Could not start that');
      setAddingLongTerm(false);
    }
  };

  const connections = circle?.connections || [];
  const waiting = circle?.waiting || [];
  const allChats = Array.isArray(chatList) ? chatList : [];
  const recentChats = allChats.slice(0, 3);
  const firstName = profile?.name?.split(' ')[0];

  const unread = allChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const stats = [
    { icon: Users, label: 'Connections', value: connections.length, to: '/matches' },
    { icon: Clock3, label: 'In queue', value: waiting.length, to: '/matches' },
    { icon: MessageSquare, label: 'Unread', value: unread, to: '/chat' },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tightest text-ink">
          {connections.length > 0
            ? 'You have people to work with.'
            : firstName ? `Nothing on your desk yet, ${firstName}.` : 'Nothing on your desk yet.'}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-mute">
          {connections.length > 0
            ? 'Pick up where you stopped, or go looking for one more.'
            : 'Run the matcher once and see who else is up at this hour.'}
        </p>
      </header>

      {/* Two columns: the work on the left, your own progress on the right —
          so the calendar runs alongside the content instead of forcing a tall,
          mostly empty header row. Stacks on smaller screens. */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-10">
      {/* One instrument, not three cards: a single hairline-bordered strip,
          divided rather than repeated, reading as one connected readout. */}
      <motion.div
        variants={reduceVariants(listVariants, reduced)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-lg border border-line bg-surface shadow-sm"
      >
        {stats.map((s) => (
          <motion.button
            key={s.label}
            variants={reduceVariants(listItemVariants, reduced)}
            onClick={() => navigate(s.to)}
            className="group relative p-4 text-left transition-colors duration-200 hover:bg-accent-50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset sm:p-5"
          >
            {s.label === 'Unread' && s.value > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-accent-500 sm:right-5 sm:top-5"
              />
            )}
            <s.icon
              className="h-4 w-4 text-mute transition-colors group-hover:text-accent-600"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <p className="mt-3 font-display text-2xl font-extrabold tracking-tightest text-ink tnum sm:text-3xl">
              {s.value}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mute">
              {s.label}
            </p>
          </motion.button>
        ))}
      </motion.div>

      {weeklySession && (
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-mute">This week&rsquo;s session</h2>
            <button
              onClick={() => navigate('/sessions')}
              className="rounded-sm text-xs text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              All sessions
            </button>
          </div>
          <SessionStrip session={weeklySession} />
        </section>
      )}

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* The one act */}
        <section>
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-mute">
            Start here
          </h2>

          {/* The single elevated moment on the page — everything else here is
              a plain row, so this is the one thing that reads as "the act." */}
          <div className="relative overflow-hidden rounded-lg border border-line bg-gradient-to-br from-surface to-accent-50 p-6 shadow-sm">
            <span className="grad-brand absolute inset-x-0 top-0 h-0.5" />
            <p className="font-display text-2xl font-bold leading-snug tracking-tight text-ink">
              Find peers
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              Same interest, same level band, same campus. Takes a second.
            </p>
            <Button
              onClick={() => navigate('/matches')}
              variant="gradient"
              className="mt-6 w-full"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Go to matches
            </Button>
          </div>

          {waiting.length > 0 && (
            <p className="mt-4 text-xs text-mute">
              <span className="text-ink tnum">{waiting.length}</span>{' '}
              {waiting.length === 1 ? 'interest is' : 'interests are'} still in the queue.
            </p>
          )}

          {/* Secondary setup, as rows — the same pattern "Your people" and
              "Last said" use, so the page reads as one list language plus
              one card, not a stack of look-alike boxes. */}
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {!hasLongTerm && (
              <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">Long-term matching</p>
                  <p className="mt-0.5 max-w-xs text-xs leading-relaxed text-mute">
                    Slower, deeper, with a seriousness test. Set once — can&rsquo;t be changed later.
                  </p>
                </div>
                <Button
                  onClick={handleAddLongTerm}
                  variant="secondary"
                  size="sm"
                  loading={addingLongTerm}
                  className="shrink-0"
                >
                  Set up
                </Button>
              </li>
            )}

            <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Short-term interest</p>
                <p className="mt-0.5 max-w-xs text-xs leading-relaxed text-mute">
                  {currentShortTerm
                    ? `Currently: ${currentShortTerm.interestName}. Your current chat stays put.`
                    : 'A quick, short-burst interest. Change it whenever you want.'}
                </p>
              </div>
              <Button
                onClick={() => setShortTermModalOpen(true)}
                variant="secondary"
                size="sm"
                className="shrink-0"
              >
                {currentShortTerm ? 'Change' : 'Choose'}
              </Button>
            </li>
          </ul>
        </section>

        <div className="space-y-10">
        {/* Live connections */}
        <section>
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-mute">
            Your people
          </h2>

          {connections.length === 0 ? (
            <EmptyRow icon={Users}>Nobody yet. That is normal on day one.</EmptyRow>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {connections.slice(0, 5).map((group) => (
                <li key={group.id}>
                  <button
                    onClick={() => navigate(`/matches/${group.id}`)}
                    className="group flex w-full items-baseline justify-between gap-4 py-3.5 text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {group.interestName}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
                        {group.connectionType} · {group.levelBand}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-mute tnum">
                      {group.memberCount}/{group.maxMembers}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {connections.length > 5 && (
            <button
              onClick={() => navigate('/matches')}
              className="mt-3 text-xs text-accent-700 underline decoration-accent-300 underline-offset-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              All {connections.length}
            </button>
          )}
        </section>

        {/* Last threads */}
        <section>
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-mute">
            Last said
          </h2>

          {recentChats.length === 0 ? (
            <EmptyRow icon={MessageSquare}>No threads open.</EmptyRow>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {recentChats.map((chat) => (
                <li key={chat.chatRoomId}>
                  <button
                    onClick={() => navigate(`/chat/${chat.chatRoomId}`)}
                    className="flex w-full items-start justify-between gap-3 py-3.5 text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {chat.title || chat.interestName || 'Chat'}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-mute">
                        {chat.lastMessagePreview || 'Nobody has said anything yet.'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {chat.unreadCount > 0 && (
                        <span className="grad-brand h-2 w-2 rounded-full" />
                      )}
                      <span className="text-[10px] text-mute tnum">
                        {relativeTime(chat.lastMessageAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        </div>
      </div>
      </div>

      {/* Your own progress: points and streak sit directly above the month
          they come from, so the number and the graph read as one thing. */}
      <aside className="space-y-4">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-mute">
          Your progress
        </h2>
        <PotentialTracker stats={myStats} />
        <TaskCalendar className="max-w-none" />
      </aside>
      </div>

      <ShortTermInterestModal open={shortTermModalOpen} onClose={() => setShortTermModalOpen(false)} />
    </div>
  );
}
