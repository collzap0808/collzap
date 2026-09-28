import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { sessionWhen } from '../../components/sessions/sessionFormat';
import { useAdminStore } from '../../store/useAdminStore';
import AdminPageHeader from './AdminPageHeader';

const pad = (n) => String(n).padStart(2, '0');

// <input type="datetime-local"> speaks local wall-clock time with no zone.
function toLocalInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The coming Friday at 7 PM — the default slot, since that's the rhythm. */
function nextFridayEvening() {
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  const ahead = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (ahead === 0 && d < new Date() ? 7 : ahead));
  return toLocalInput(d);
}

const emptyForm = () => ({
  interestId: '',
  title: '',
  speakerName: '',
  speakerRole: '',
  youtubeUrl: '',
  scheduledAt: nextFridayEvening(),
  durationMinutes: '45',
  points: '30',
});

export default function AdminSessionsPage() {
  const { interests, fetchInterests, sessions, fetchSessions, saveSession, deleteSession, loading } = useAdminStore();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchInterests().catch(console.error);
    fetchSessions().catch(console.error);
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const startEdit = (s) => {
    setEditingId(s.id);
    setFieldErrors({});
    setForm({
      interestId: s.interestId,
      title: s.title,
      speakerName: s.speakerName || '',
      speakerRole: s.speakerRole || '',
      youtubeUrl: s.youtubeVideoId ? `https://www.youtube.com/watch?v=${s.youtubeVideoId}` : '',
      scheduledAt: toLocalInput(new Date(s.scheduledAt)),
      durationMinutes: String(s.durationMinutes),
      points: String(s.points),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setEditingId(null);
    setFieldErrors({});
    setForm(emptyForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.interestId) {
      setFieldErrors({ interestId: 'Pick the interest this session is for' });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      await saveSession(editingId, {
        interestId: form.interestId,
        title: form.title,
        speakerName: form.speakerName,
        speakerRole: form.speakerRole,
        youtubeUrl: form.youtubeUrl,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        points: Number(form.points),
      });
      toast.success(editingId ? 'Session updated' : 'Session added');
      reset();
      fetchSessions().catch(console.error);
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      toast.error(err.message || 'Could not save that session');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete "${s.title}"? Points students already earned from it are kept.`)) return;
    try {
      await deleteSession(s.id);
      toast.success('Session deleted');
      if (editingId === s.id) reset();
      fetchSessions().catch(console.error);
    } catch (err) {
      toast.error(err.message || 'Could not delete that');
    }
  };

  const shown = useMemo(
    () => (filter ? sessions.filter((s) => s.interestId === filter) : sessions),
    [sessions, filter]
  );

  return (
    <div>
      <AdminPageHeader title="Mentoring Sessions" count={sessions.length} />

      <p className="mb-6 border-l-2 border-line pl-4 text-xs leading-relaxed text-mute">
        Each session goes to students who picked its interest. Leave the YouTube link empty to list it as
        upcoming; add the link later and, once its time has passed, it goes live and students can watch it
        for points. Points unlock after about 80% of the video is actually watched.
      </p>

      <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
        <form onSubmit={handleSubmit} className="space-y-4 self-start rounded-lg border border-line bg-surface p-5" noValidate>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-ink">{editingId ? 'Edit session' : 'Add a session'}</h2>
            {editingId && <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>}
          </div>

          <Select label="Interest" value={form.interestId} onChange={set('interestId')} error={fieldErrors.interestId}>
            <option value="">Choose an interest…</option>
            {interests.map((i) => (
              <option key={i.id} value={i.id}>{i.name} ({i.category})</option>
            ))}
          </Select>
          <Input label="Title" value={form.title} onChange={set('title')} error={fieldErrors.title} maxLength={200} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Speaker" value={form.speakerName} onChange={set('speakerName')} error={fieldErrors.speakerName} maxLength={120} />
            <Input label="Speaker role" value={form.speakerRole} onChange={set('speakerRole')} error={fieldErrors.speakerRole} maxLength={160} />
          </div>
          <Input
            label="YouTube link (optional)"
            value={form.youtubeUrl}
            onChange={set('youtubeUrl')}
            error={fieldErrors.youtubeUrl}
            hint="Empty = upcoming. Any youtube.com or youtu.be link works."
          />
          <Input
            label="Date & time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={set('scheduledAt')}
            error={fieldErrors.scheduledAt}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Length (min)" type="number" min={1} max={600} value={form.durationMinutes} onChange={set('durationMinutes')} error={fieldErrors.durationMinutes} />
            <Input label="Points" type="number" min={0} max={1000} value={form.points} onChange={set('points')} error={fieldErrors.points} />
          </div>

          <Button type="submit" loading={saving} className="w-full">
            {editingId ? 'Save changes' : 'Add session'}
          </Button>
        </form>

        <div className="rounded-lg border border-line bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-ink">Schedule</h2>
            <div className="w-full sm:w-64">
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by interest">
                <option value="">All interests</option>
                {interests.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </Select>
            </div>
          </div>

          {loading && sessions.length === 0 ? (
            <div className="flex justify-center py-10 text-accent-500"><Spinner /></div>
          ) : shown.length === 0 ? (
            <EmptyState title="No sessions yet" description="Add one on the left. It shows up here straight away." />
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                      <Badge variant={s.status === 'AVAILABLE' ? 'success' : 'warning'}>
                        {s.status === 'AVAILABLE' ? 'Live' : s.youtubeVideoId ? 'Scheduled' : 'No video yet'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-mute">
                      {s.interestName} &middot; {sessionWhen(s.scheduledAt)} &middot; {s.durationMinutes} min &middot; +{s.points}
                    </p>
                    <p className="text-xs text-mute tnum">{s.watchCount} watched</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(s)} aria-label={`Edit ${s.title}`}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(s)} aria-label={`Delete ${s.title}`}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
