import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight, CheckCircle2, Hourglass, Lock, PenLine } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { cn } from '../../lib/utils';
import { useSoloTaskStore } from '../../store/useSoloTaskStore';
import { useTaskStore } from '../../store/useTaskStore';
import { Attachment, LinkOut, TaskBrief, TaskSubmitForm } from './TaskParts';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN');
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';

/** Points so far against the line where peer matching unlocks. */
export function UnlockProgress({ points = 0, unlockPoints = 500, className }) {
  const pct = Math.min(100, Math.round((points / Math.max(unlockPoints, 1)) * 100));
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <Lock className="h-3.5 w-3.5 text-accent-600" aria-hidden="true" />
          Peer matching unlocks at {fmt(unlockPoints)} pts
        </span>
        <span className="text-mute tnum"><span className="font-semibold text-ink">{fmt(points)}</span> / {fmt(unlockPoints)} pts</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={unlockPoints}
        aria-valuenow={points}
        aria-label={`${fmt(points)} of ${fmt(unlockPoints)} points needed to unlock matching`}
      >
        <div className="grad-brand h-full rounded-full" style={{ width: `${Math.max(pct, points > 0 ? 1.5 : 0)}%` }} />
      </div>
    </div>
  );
}

const STATUS = {
  TODO: { label: 'To do', icon: PenLine, cls: 'text-accent-700 bg-accent-50 border-accent-200' },
  PENDING: { label: 'Pending review', icon: Hourglass, cls: 'text-wait bg-wait/10 border-wait/30' },
  APPROVED: { label: 'Approved', icon: CheckCircle2, cls: 'text-good bg-good/10 border-good/30' },
  CHANGES_REQUESTED: { label: 'Changes requested', icon: PenLine, cls: 'text-bad bg-bad/10 border-bad/30' },
};

const statusOf = (task) => task.submission?.status || 'TODO';

function StatusChip({ status, points, className }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', s.cls, className)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {s.label}{status === 'APPROVED' && points ? ` · +${points}` : ''}
    </span>
  );
}

/** The opened task: brief, then the form or where the review stands. */
function SoloTaskDetail({ task, onSubmitted }) {
  const { submitSoloTask, submitting } = useSoloTaskStore();
  const status = statusOf(task);
  const sub = task.submission;

  const handleSubmit = async (payload) => {
    try {
      await submitSoloTask(task.assignmentId, payload);
      toast.success('Submitted for review');
      onSubmitted();
    } catch (error) {
      toast.error(error.message || 'Could not submit that');
    }
  };

  return (
    <div className="space-y-5">
      <TaskBrief task={task} eyebrow={task.interestName} />

      {status === 'TODO' && <TaskSubmitForm onSubmit={handleSubmit} loading={submitting} submitLabel="Submit for review" />}

      {status === 'CHANGES_REQUESTED' && (
        <>
          <div className="rounded-lg border border-bad/30 bg-bad/5 px-4 py-3">
            <p className="text-sm font-medium text-bad">Our team asked for a few changes</p>
            {sub.feedbackText && <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{sub.feedbackText}</p>}
          </div>
          <TaskSubmitForm onSubmit={handleSubmit} loading={submitting} initial={sub} submitLabel="Resubmit for review" />
        </>
      )}

      {(status === 'PENDING' || status === 'APPROVED') && (
        <div className="space-y-3 border-t border-line pt-5">
          {status === 'PENDING' ? (
            <div className="flex items-start gap-2 rounded-lg border border-wait/30 bg-wait/5 px-4 py-3 text-sm text-ink">
              <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-wait" aria-hidden="true" />
              <span>Submitted {new Date(sub.submittedAt).toLocaleString()}. Our team reviews every task; your {task.points} pts land when it&rsquo;s approved.</span>
            </div>
          ) : (
            <div className="rounded-lg border border-good/30 bg-good/5 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-good">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Approved · +{sub.pointsAwarded} pts
              </p>
              <p className="mt-1 font-mono text-[10px] text-mute tnum">
                Completion {sub.completionScore} · Quality {sub.qualityScore} · Learning {sub.learningScore} · Effort {sub.effortScore}
              </p>
              {sub.feedbackText && <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{sub.feedbackText}</p>}
            </div>
          )}
          {sub.contentText && <p className="whitespace-pre-wrap text-sm text-ink">{sub.contentText}</p>}
          <Attachment url={sub.fileUrl} />
          <LinkOut url={sub.linkUrl} />
        </div>
      )}
    </div>
  );
}

/**
 * The desk's lead card while matching is locked: today's solo task for each
 * interest, where each one's review stands, and how far there is to go.
 */
export function SoloTasksSection({ id = 'daily-tasks', verified = true }) {
  const { soloTasks, loading, fetchSoloTasks, openTaskId: openId, setOpenTaskId: setOpenId } = useSoloTaskStore();
  const { fetchMyStats, fetchCalendar } = useTaskStore();

  useEffect(() => {
    fetchSoloTasks().catch(() => {});
  }, [fetchSoloTasks]);

  const tasks = soloTasks?.tasks ?? [];
  const open = tasks.find((t) => t.assignmentId === openId);

  const refresh = () => {
    fetchSoloTasks().catch(() => {});
    fetchMyStats().catch(() => {});
    fetchCalendar().catch(() => {});
  };

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-title`} className="font-display text-lg font-bold tracking-tight text-ink">Your daily tasks</h2>
        <p className="text-xs text-mute">Reviewed by the CollZap team</p>
      </div>
      <p className="mt-1 max-w-prose text-sm text-mute">
        Finding peers at your level on campus takes a little time. Until then, do a task a day: every approved task
        earns points, and peer matching opens at {fmt(soloTasks?.unlockPoints ?? 500)} points.
      </p>

      <UnlockProgress className="mt-4" points={soloTasks?.points ?? 0} unlockPoints={soloTasks?.unlockPoints} />

      <div className="mt-5">
        {!soloTasks && loading ? (
          <div className="flex justify-center py-6 text-accent-500"><Spinner /></div>
        ) : !verified ? (
          <p className="rounded-md bg-surface-2 px-4 py-3 text-sm text-mute">Your tasks start as soon as your student ID is approved.</p>
        ) : tasks.length === 0 ? (
          <p className="rounded-md bg-surface-2 px-4 py-3 text-sm text-mute">Your first task is being prepared. Check back soon.</p>
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line">
            {tasks.map((t) => {
              const status = statusOf(t);
              return (
                <li key={t.assignmentId}>
                  <button
                    type="button"
                    onClick={() => setOpenId(t.assignmentId)}
                    className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2', focusRing)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[10px] uppercase tracking-widest text-mute">
                        {t.interestName} · Day {t.dayIndex} · {t.points} pts
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-ink sm:truncate">{t.title}</span>
                      {/* On phones the status sits under the title so the title keeps the width. */}
                      <StatusChip status={status} points={t.submission?.pointsAwarded} className="mt-1.5 sm:hidden" />
                    </span>
                    <StatusChip status={status} points={t.submission?.pointsAwarded} className="hidden sm:inline-flex" />
                    <ArrowRight className="h-4 w-4 shrink-0 text-mute" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={!!open} onClose={() => setOpenId(null)} title="Today's task" size="lg">
        {open && <SoloTaskDetail task={open} onSubmitted={refresh} />}
      </Modal>
    </section>
  );
}

/** The Matches tab while matching is locked: why, how far, and where to go. */
export function MatchingLockedPanel({ points, unlockPoints = 500, onGoToTasks, verified = true }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-6 sm:p-8" aria-labelledby="matching-locked-title">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-50 text-accent-700">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 id="matching-locked-title" className="mt-4 font-display text-2xl font-extrabold tracking-tightest text-ink">
        Peer matching unlocks at {fmt(unlockPoints)} points
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        It takes a little time for people with your interests and level to join from your campus. Meanwhile, do your
        daily tasks: our team reviews each one, approved tasks earn points, and matching opens the moment you reach
        {' '}{fmt(unlockPoints)} points.
        {!verified && ' Your tasks start as soon as your student ID is approved.'}
      </p>
      <UnlockProgress className="mt-5 max-w-xl" points={points} unlockPoints={unlockPoints} />
      {verified && (
        <Button className="mt-6" onClick={onGoToTasks} icon={<ArrowRight className="h-4 w-4" />}>
          Do today&rsquo;s task
        </Button>
      )}
    </section>
  );
}
