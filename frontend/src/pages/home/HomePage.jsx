import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Clock3, MessageSquare, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import ShortTermInterestModal from './ShortTermInterestModal';
import TaskCalendar from '../../components/tasks/TaskCalendar';
import { SoloTasksSection } from '../../components/tasks/SoloTasks';
import { soloEmptyMessage, useSoloTaskStore } from '../../store/useSoloTaskStore';
import {
  ComingSoon, ContinueSection, GoalStrip, OverviewRow, PeopleSection, ProgressCard, UpcomingEvents,
} from './DeskSections';
import { continueItems, greeting, peopleFromConnections, todayIst } from './deskData';
import { api } from '../../api/api';
import { useMatchStore } from '../../store/useMatchStore';
import { useChatStore } from '../../store/useChatStore';
import { useUserStore } from '../../store/useUserStore';
import { useInterestStore } from '../../store/useInterestStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useSessionStore } from '../../store/useSessionStore';

/**
 * The desk answers four questions in order: what's next (events), who can I
 * work with, what's waiting on me, and how am I doing. Everything shown is
 * real data — groups, chats, sessions, task stats — nothing is filler.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { circle, fetchCircle } = useMatchStore();
  const { chatList, fetchChatList } = useChatStore();
  const { profile } = useUserStore();
  const { projectTypes, myInterests, fetchProjectTypes, fetchMyInterests, selectProjectTypes } = useInterestStore();
  const { myStats, fetchMyStats } = useTaskStore();
  const { sessions, loading: sessionsLoading, fetchSessions } = useSessionStore();
  const openNextTask = useSoloTaskStore((s) => s.openNextTask);
  const soloEmptyReason = useSoloTaskStore((s) => s.soloTasks?.emptyReason);
  const [shortTermModalOpen, setShortTermModalOpen] = useState(false);
  const [addingLongTerm, setAddingLongTerm] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);
  const today = todayIst();

  useEffect(() => {
    fetchCircle().catch(console.error);
    fetchChatList().catch(console.error);
    fetchProjectTypes().catch(console.error);
    fetchMyInterests().catch(console.error);
    fetchMyStats().catch(console.error);
    fetchSessions().catch(console.error);

    // Asked for separately from the calendar card: paging that card back a
    // month must not make today's task look undone.
    api.get('/me/task-stats/calendar', { params: { month: today.slice(0, 7) } })
        .then((r) => setSubmittedToday(!!r?.days?.some((d) => d.date === today && d.submissions > 0)))
        .catch(() => {});
  }, []);

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

  const connections = useMemo(() => circle?.connections || [], [circle]);
  const waiting = circle?.waiting || [];
  const chats = Array.isArray(chatList) ? chatList : [];
  const unread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const firstName = profile?.name?.split(' ')[0];
  const streak = myStats?.currentStreakDays ?? 0;
  // New students start with matching locked and earn it through solo tasks.
  const matchingLocked = myStats?.matchingUnlocked === false;

  const featured = sessions?.featured;
  // The live session leads (if there's one left to watch), then what's scheduled.
  const events = [
    ...(featured && !featured.watched ? [featured] : []),
    ...(sessions?.upcoming ?? []),
  ].slice(0, 3);
  const upcomingCount = (sessions?.upcoming?.length ?? 0) + (featured && !featured.watched ? 1 : 0);

  const people = useMemo(() => peopleFromConnections(connections), [connections]);
  const peersOnGoal = currentShortTerm
      ? people.filter((p) => p.interests.includes(currentShortTerm.interestName)).length
      : 0;

  const todo = continueItems({
    chats, connections, waiting, featuredSession: featured, submittedToday, streak,
  });

  const overview = [
    { icon: Users, label: 'Connections', value: connections.length, to: '/matches' },
    { icon: Clock3, label: 'Pending matches', value: waiting.length, to: '/matches' },
    { icon: MessageSquare, label: 'Unread messages', value: unread, to: '/chat', alert: unread > 0 },
    { icon: CalendarDays, label: 'Upcoming events', value: upcomingCount, to: '/sessions', alert: !!featured && !featured.watched },
  ];

  return (
      <div className="space-y-8">
        {/* Welcome + the one primary action */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tightest text-ink sm:text-4xl">
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1.5 text-sm text-mute">Here&rsquo;s what&rsquo;s happening with your campus network.</p>
          </div>
          {matchingLocked ? (
              <Button
                  variant="gradient"
                  onClick={() => {
                    if (openNextTask()) return;
                    toast(soloEmptyMessage(soloEmptyReason ?? (profile?.verificationStatus === 'APPROVED' ? null : 'NOT_VERIFIED')));
                    document.getElementById('daily-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  icon={<ClipboardCheck className="h-4 w-4" />}
                  className="shrink-0"
              >
                Today&rsquo;s tasks
              </Button>
          ) : (
              <Button
                  variant="gradient"
                  onClick={() => navigate('/matches')}
                  icon={<UserPlus className="h-4 w-4" />}
                  className="shrink-0"
              >
                Find people
              </Button>
          )}
        </header>

        {/* Below desktop the rail drops under everything else, which would bury
          the tracker — so on phones and tablets it leads the page instead. */}
        {/* While matching is locked the daily-tasks card leads instead (it carries
          its own progress bar), and the tracker moves down to the rail. */}
        {!matchingLocked && (
            <div className="lg:hidden">
              <ProgressCard stats={myStats} />
            </div>
        )}

        {/* The work on the left; your own progress and month on the right, so
          the rail fills the height the lists leave instead of a bottom row. */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-8">
            {matchingLocked && <SoloTasksSection verified={profile?.verificationStatus === 'APPROVED'} />}
            <OverviewRow items={overview} />
            <UpcomingEvents events={events} loading={!sessions && sessionsLoading} />
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:gap-5">
              <PeopleSection people={people} onFind={() => navigate('/matches')} />
              <ContinueSection items={todo} />
            </div>
            <GoalStrip
                shortTerm={currentShortTerm}
                peersOnIt={peersOnGoal}
                hasLongTerm={hasLongTerm}
                onChange={() => setShortTermModalOpen(true)}
                onSetUpLongTerm={handleAddLongTerm}
                settingUp={addingLongTerm}
            />
          </div>

          <aside className="min-w-0 space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:block lg:space-y-4" aria-label="Your progress">
            <div className={matchingLocked ? undefined : 'hidden lg:block'}>
              <ProgressCard stats={myStats} />
            </div>
            <TaskCalendar className="max-w-none" />
            <ComingSoon points={myStats?.totalPoints ?? 0} hideCertification />
          </aside>
        </div>

        <ShortTermInterestModal open={shortTermModalOpen} onClose={() => setShortTermModalOpen(false)} />
      </div>
  );
}