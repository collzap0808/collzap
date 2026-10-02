import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import TextArea from '../../components/ui/TextArea';
import Modal from '../../components/ui/Modal';
import { Attachment, LinkOut, ScorePicker } from '../../components/tasks/TaskParts';
import { CRITERIA } from '../../components/tasks/reviewCriteria';
import { cn } from '../../lib/utils';
import { useAdminStore } from '../../store/useAdminStore';
import AdminPageHeader from './AdminPageHeader';

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'CHANGES_REQUESTED', label: 'Changes requested' },
  { key: 'APPROVED', label: 'Approved' },
];

const STATUS_BADGE = {
  PENDING: { variant: 'warning', label: 'Pending' },
  APPROVED: { variant: 'success', label: 'Approved' },
  CHANGES_REQUESTED: { variant: 'danger', label: 'Changes requested' },
};

const EMPTY_SCORES = { completionScore: 0, qualityScore: 0, learningScore: 0, effortScore: 0 };

/** Approve with the four scores, or send it back with feedback. */
function ReviewModal({ row, onClose, onDone }) {
  const { reviewSoloSubmission } = useAdminStore();
  const [scores, setScores] = useState(EMPTY_SCORES);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setScores(EMPTY_SCORES);
    setFeedback('');
    setBusy(false);
  }, [row?.id]);

  const allScored = CRITERIA.every((c) => scores[c.key] > 0);

  const submit = async (approve) => {
    if (!approve && !feedback.trim()) {
      toast.error('Tell the student what to change');
      return;
    }
    setBusy(true);
    try {
      await reviewSoloSubmission(row.id, approve
        ? { approve: true, ...scores, feedbackText: feedback.trim() || null }
        : { approve: false, feedbackText: feedback.trim() });
      toast.success(approve ? `Approved · +${row.taskPoints} pts` : 'Sent back for changes');
      onDone();
    } catch (error) {
      toast.error(error.message || 'Could not save that review');
      setBusy(false);
    }
  };

  return (
    <Modal open={!!row} onClose={onClose} title="Review solo task" size="lg">
      {row && (
        <div className="space-y-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent-700">
              {row.interestName} · Day {row.dayIndex} · {row.taskPoints} pts
            </p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">{row.taskTitle}</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-mute">{row.taskDescription}</p>
            {row.submissionInstructions && <p className="mt-1 text-xs text-mute">What to submit: {row.submissionInstructions}</p>}
          </div>

          <div className="rounded-lg border border-line bg-surface-2 p-4">
            <p className="text-sm font-medium text-ink">{row.userName}</p>
            {row.contentText && <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{row.contentText}</p>}
            <Attachment url={row.fileUrl} />
            <LinkOut url={row.linkUrl} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <p className="text-sm font-medium text-ink">{c.label}</p>
                <p className="mb-2 text-xs text-mute">{c.hint}</p>
                <ScorePicker value={scores[c.key]} onChange={(v) => setScores((p) => ({ ...p, [c.key]: v }))} disabled={busy} />
              </div>
            ))}
          </div>

          <TextArea
            label="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional when approving. Required when asking for changes."
            rows={3}
            disabled={busy}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => submit(false)} disabled={busy}>Request changes</Button>
            <Button onClick={() => submit(true)} loading={busy} disabled={!allScored || busy}>
              Approve · +{row.taskPoints} pts
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Solo daily tasks from students who haven't unlocked matching yet. Every
 * approval credits the task's points, and the approval that reaches the unlock
 * line opens matching for that student.
 */
export default function AdminSoloReviewsPage() {
  const { soloSubmissions, soloPendingCount, fetchSoloSubmissions, fetchSoloPendingCount, loading } = useAdminStore();
  const [tab, setTab] = useState('PENDING');
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    fetchSoloSubmissions(tab).catch(console.error);
    fetchSoloPendingCount().catch(() => {});
  }, [tab, fetchSoloSubmissions, fetchSoloPendingCount]);

  const rows = Array.isArray(soloSubmissions) ? soloSubmissions : [];

  const afterReview = () => {
    setReviewing(null);
    fetchSoloSubmissions(tab).catch(console.error);
    fetchSoloPendingCount().catch(() => {});
  };

  return (
    <div>
      <AdminPageHeader title="Task reviews" count={soloPendingCount} />
      <p className="-mt-3 mb-6 max-w-2xl text-sm text-mute">
        Solo tasks from students who haven&rsquo;t unlocked matching yet. Approving credits the task&rsquo;s points;
        peer matching opens for a student at 500 points.
      </p>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Review status">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
              tab === t.key ? 'border-accent-500 bg-accent-50 text-accent-800' : 'border-line bg-surface text-mute hover:text-ink'
            )}
          >
            {t.label}{t.key === 'PENDING' && soloPendingCount > 0 ? ` · ${soloPendingCount}` : ''}
          </button>
        ))}
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-20 text-accent-500"><Spinner size="lg" /></div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === 'PENDING' ? 'Nothing waiting' : 'Nothing here yet'}
          description={tab === 'PENDING' ? 'Every submitted solo task has been reviewed.' : 'Reviewed tasks show up here.'}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {rows.map((r) => {
            const badge = STATUS_BADGE[r.status];
            return (
              <li key={r.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{r.userName}</p>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {r.status === 'APPROVED' && <Badge variant="primary">+{r.pointsAwarded} pts</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-mute">{r.userEmail}{r.collegeName ? ` · ${r.collegeName}` : ''}</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-accent-700">
                    {r.interestName} · Day {r.dayIndex} · {r.taskPoints} pts
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{r.taskTitle}</p>
                  {r.contentText && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-mute">{r.contentText}</p>}
                  <div className="flex flex-wrap gap-x-4">
                    <LinkOut url={r.linkUrl} />
                    {r.fileUrl && (
                      <a href={r.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-accent-700 underline decoration-accent-300 underline-offset-4">
                        Open attachment
                      </a>
                    )}
                  </div>
                  {r.feedbackText && r.status !== 'PENDING' && (
                    <p className="mt-2 text-xs text-mute"><span className="font-medium text-ink">{r.reviewedBy || 'Admin'}:</span> {r.feedbackText}</p>
                  )}
                  <p className="mt-2 text-[11px] text-mute">Submitted {new Date(r.submittedAt).toLocaleString()}</p>
                </div>
                {r.status === 'PENDING' && (
                  <Button className="shrink-0" onClick={() => setReviewing(r)}>Review</Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ReviewModal row={reviewing} onClose={() => setReviewing(null)} onDone={afterReview} />
    </div>
  );
}
