import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ExternalLink, Sparkles, Trophy } from 'lucide-react';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import Input from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { useTaskStore } from '../../store/useTaskStore';

const CRITERIA = [
  { key: 'completionScore', label: 'Completion', hint: 'Did they finish everything?' },
  { key: 'qualityScore', label: 'Quality', hint: 'Does it look properly done?' },
  { key: 'learningScore', label: 'Learning', hint: 'Does it show they learned it?' },
  { key: 'effortScore', label: 'Effort', hint: 'Does the effort show?' },
];

function ScorePicker({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={`h-8 w-8 rounded-md border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
            value === n
              ? 'border-accent-500 bg-accent-500 text-white'
              : 'border-line bg-surface text-mute hover:border-accent-300'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ open, onClose, onSubmit, loading }) {
  const [scores, setScores] = useState({ completionScore: 0, qualityScore: 0, learningScore: 0, effortScore: 0 });
  const [feedbackText, setFeedbackText] = useState('');
  // The store's `loading` flag is shared across every task action and only
  // flips after the request round-trips, which leaves a window where a fast
  // second click reaches the server before the button visibly disables. This
  // local flag disables it the instant the first click is handled, so a
  // double-click can no longer send two review requests for the same
  // submission (the backend also guards this — see TaskSubmissionService —
  // but a request that never goes out is better than one the server rejects).
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setScores({ completionScore: 0, qualityScore: 0, learningScore: 0, effortScore: 0 });
      setFeedbackText('');
      setSubmitting(false);
    }
  }, [open]);

  const allScored = CRITERIA.every((c) => scores[c.key] > 0);
  const busy = loading || submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // On success the parent closes this modal (reviewTarget becomes null),
      // so there's nothing left to reset here. On failure it stays open with
      // the toast already shown by the parent — this only has to make sure
      // the button becomes clickable again instead of staying disabled forever.
      await onSubmit({ ...scores, feedbackText: feedbackText.trim() || null });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Review this submission">
      <div className="space-y-5">
        {CRITERIA.map((c) => (
          <div key={c.key}>
            <p className="text-sm font-medium text-ink">{c.label}</p>
            <p className="mb-2 text-xs text-mute">{c.hint}</p>
            <ScorePicker
              value={scores[c.key]}
              onChange={(v) => setScores((prev) => ({ ...prev, [c.key]: v }))}
              disabled={busy}
            />
          </div>
        ))}
        <TextArea
          label="Feedback (optional)"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="One or two lines helps more than a score alone."
          rows={3}
          disabled={busy}
        />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            loading={busy}
            disabled={!allScored || busy}
          >
            Submit review
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const isPdf = (url) => /\.pdf($|[?#])/i.test(url);

/** An uploaded photo shows inline (click to open full size); a PDF shows as a link. */
function Attachment({ url }) {
  if (!url) return null;
  if (isPdf(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-accent-700 underline decoration-accent-300 underline-offset-4">
        Open attached PDF <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-lg border border-line">
      <img src={url} alt="Attached submission" loading="lazy" className="max-h-72 w-full bg-surface object-contain" />
    </a>
  );
}

function ReviewNote({ review }) {
  const scores = [review.completionScore, review.qualityScore, review.learningScore, review.effortScore];
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <p className="text-xs text-ink">
        <span className="font-medium">{review.reviewerName}</span>
        <span className="ml-2 font-mono text-[10px] text-mute tnum">
          {scores.join(' / ')}
        </span>
      </p>
      {review.feedbackText && <p className="mt-1 whitespace-pre-wrap text-xs text-mute">{review.feedbackText}</p>}
    </div>
  );
}

/**
 * Slots into GroupDetailPage right after the header. Any active member may
 * review any other active member's submission — there's no fixed pairing, so
 * this same component works whether the group has 2 people or 40.
 */
export default function TodaysTaskCard({ groupId }) {
  const { todaysTask, fetchTodaysTask, fetchMyStats, fetchCalendar, submitTask, reviewSubmission, loading } = useTaskStore();
  const [contentText, setContentText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchTodaysTask(groupId).catch(() => {}).finally(() => setLoaded(true));
  }, [groupId]);

  // Peers' submissions and reviews land while this is open, so it refreshes
  // itself: every 8s while the tab is visible, and immediately on return to
  // the tab. Silent, so the form and review modal never flicker to disabled.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        fetchTodaysTask(groupId, { silent: true }).catch(() => {});
      }
    };
    const timer = setInterval(refresh, 8000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [groupId]);

  if (!loaded && loading) {
    return (
      <div className="flex justify-center rounded-lg border border-line bg-surface py-10 text-accent-500">
        <Spinner />
      </div>
    );
  }

  if (!todaysTask) return null;

  const { assignment, bankCompleted, submissions } = todaysTask;

  if (!assignment) {
    return (
      <section className="rounded-lg border border-line bg-surface-2 p-6 text-center">
        {bankCompleted ? (
          <>
            <Trophy className="mx-auto h-6 w-6 text-accent-600" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-ink">You've completed every daily task in this track.</p>
          </>
        ) : (
          <p className="text-sm text-mute">No task yet — check back tomorrow.</p>
        )}
      </section>
    );
  }

  const mySubmission = submissions.find((s) => s.mine);
  const others = submissions.filter((s) => !s.mine);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentText.trim() && !linkUrl.trim() && !fileUrl) {
      toast.error('Add some text, a link, or a file first');
      return;
    }
    try {
      await submitTask(groupId, assignment.id, {
        contentText: contentText.trim() || null,
        linkUrl: linkUrl.trim() || null,
        fileUrl: fileUrl || null,
      });
      toast.success('Submitted');
      fetchTodaysTask(groupId);
      fetchMyStats().catch(() => {});
      fetchCalendar().catch(() => {});
    } catch (error) {
      toast.error(error.message || 'Could not submit that');
    }
  };

  const handleReview = async (scores) => {
    try {
      await reviewSubmission(groupId, reviewTarget.id, scores);
      toast.success('Review sent');
      setReviewTarget(null);
      fetchTodaysTask(groupId);
      fetchMyStats().catch(() => {});
    } catch (error) {
      toast.error(error.message || 'Could not submit that review');
    }
  };

  return (
    <section className="space-y-5 rounded-lg border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent-700">
            Day {assignment.dayIndex} · {assignment.points} pts{assignment.durationLabel ? ` · ${assignment.durationLabel}` : ''}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">{assignment.title}</h2>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{assignment.description}</p>

      {assignment.learnResource && (
        <div className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
          <p className="text-sm text-ink">{assignment.learnResource}</p>
        </div>
      )}

      {assignment.submissionInstructions && (
        <p className="text-xs text-mute">What to submit: {assignment.submissionInstructions}</p>
      )}

      {mySubmission ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-good/30 bg-good/5 px-4 py-3 text-sm text-good">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Submitted {new Date(mySubmission.submittedAt).toLocaleString()}
          </div>
          {mySubmission.contentText && (
            <p className="whitespace-pre-wrap text-sm text-ink">{mySubmission.contentText}</p>
          )}
          <Attachment url={mySubmission.fileUrl} />
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-mute">
              Reviews of your work{mySubmission.reviews.length > 0 ? ` (${mySubmission.reviews.length})` : ''}
            </p>
            {mySubmission.reviews.length === 0 ? (
              <p className="text-xs text-mute">No reviews yet. They appear here as soon as someone leaves one.</p>
            ) : (
              mySubmission.reviews.map((r) => <ReviewNote key={r.id} review={r} />)
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-line pt-5">
          <TextArea
            label="What did you do?"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            rows={3}
            disabled={loading}
          />
          <Input
            label="Link (GitHub, Drive, YouTube…)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            disabled={loading}
          />
          <FileUpload
            category="TASK_SUBMISSION"
            label="Attach a file (optional)"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onUploadComplete={setFileUrl}
          />
          <Button type="submit" loading={loading}>Submit</Button>
        </form>
      )}

      {others.length > 0 && (
        <div className="space-y-3 border-t border-line pt-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-mute">Everyone else's work</p>
          <ul className="space-y-3">
            {others.map((s) => (
              <li key={s.id} className="rounded-lg border border-line bg-surface-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar src={s.userPhotoUrl} name={s.userName} size="sm" />
                    <span className="truncate text-sm font-medium text-ink">{s.userName}</span>
                  </div>
                  {!s.reviewedByMe && (
                    <Button size="sm" variant="ghost" onClick={() => setReviewTarget(s)}>Review</Button>
                  )}
                  {s.reviewedByMe && (
                    <span className="shrink-0 text-xs text-good">Reviewed</span>
                  )}
                </div>
                {s.contentText && <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{s.contentText}</p>}
                <Attachment url={s.fileUrl} />
                {s.linkUrl && (
                  <a href={s.linkUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-accent-700 underline decoration-accent-300 underline-offset-4">
                    Open link <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
                {s.reviews.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {s.reviews.map((r) => (
                      <p key={r.id} className="text-xs text-mute">
                        <span className="font-medium text-ink">{r.reviewerName}</span>
                        {r.feedbackText ? `: ${r.feedbackText}` : ' left a review'}
                      </p>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReview}
        loading={loading}
      />
    </section>
  );
}
