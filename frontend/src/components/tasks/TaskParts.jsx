import { useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import Input from '../ui/Input';
import FileUpload from '../ui/FileUpload';

// Shared by group tasks (peer-reviewed, in chat) and solo tasks (admin-reviewed,
// on the desk) so both look and behave the same.

export function ScorePicker({ value, onChange, disabled }) {
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

const isPdf = (url) => /\.pdf($|[?#])/i.test(url);

/** An uploaded photo shows inline (click to open full size); a PDF shows as a link. */
export function Attachment({ url }) {
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

export function LinkOut({ url }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-accent-700 underline decoration-accent-300 underline-offset-4">
      Open link <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

/** Day · points · duration, title, description, resource and what to submit. */
export function TaskBrief({ task, eyebrow }) {
  return (
    <>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent-700">
          {eyebrow ? `${eyebrow} · ` : ''}Day {task.dayIndex} · {task.points} pts{task.durationLabel ? ` · ${task.durationLabel}` : ''}
        </p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">{task.title}</h2>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{task.description}</p>
      {task.learnResource && (
        <div className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
          <p className="break-words text-sm text-ink">{task.learnResource}</p>
        </div>
      )}
      {task.submissionInstructions && (
        <p className="text-xs text-mute">What to submit: {task.submissionInstructions}</p>
      )}
    </>
  );
}

/**
 * Text, link and optional image/PDF. `onSubmit` gets the trimmed payload and
 * should throw on failure (the caller shows its own toast); `initial` pre-fills
 * a resubmission after an admin asked for changes.
 */
export function TaskSubmitForm({ onSubmit, loading, initial, submitLabel = 'Submit' }) {
  const [contentText, setContentText] = useState(initial?.contentText || '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl || '');
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentText.trim() && !linkUrl.trim() && !fileUrl) {
      toast.error('Add some text, a link, or a file first');
      return;
    }
    await onSubmit({
      contentText: contentText.trim() || null,
      linkUrl: linkUrl.trim() || null,
      fileUrl: fileUrl || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-line pt-5">
      <TextArea label="What did you do?" value={contentText} onChange={(e) => setContentText(e.target.value)} rows={3} disabled={loading} />
      <Input label="Link (GitHub, Drive, YouTube…)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} disabled={loading} />
      <FileUpload
        category="TASK_SUBMISSION"
        label="Attach a file (optional)"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onUploadComplete={setFileUrl}
        existingUrl={initial?.fileUrl || ''}
      />
      <Button type="submit" loading={loading}>{submitLabel}</Button>
    </form>
  );
}
