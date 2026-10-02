import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import TextArea from '../../components/ui/TextArea';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAdminStore } from '../../store/useAdminStore';
import AdminPageHeader from './AdminPageHeader';

/**
 * Drops any item whose type is exactly "monthly_project" — the one purely
 * monthly deliverable in a source plan like the attached sample — and maps
 * everything else onto our own field names. `learn_resource` and `duration`
 * are free-text labels in real task-bank JSON ("How to set up VS Code + Git
 * (10 min video)", "30-60 minutes"), not a URL or a number, so they're kept
 * as plain text rather than coerced into a structure the source data doesn't
 * actually have.
 */
function mapTasks(rawTasks) {
  const tasks = rawTasks
    .filter((t) => t.type !== 'monthly_project')
    .map((t) => ({
      dayIndex: t.day,
      title: t.title,
      learnResource: t.learn_resource || '',
      description: t.description,
      submissionInstructions: t.output_to_submit || '',
      points: t.points || 0,
      durationLabel: t.duration || '',
    }));

  if (tasks.length === 0) {
    throw new Error('every task was a monthly_project entry — nothing daily to upload');
  }
  const days = tasks.map((t) => t.dayIndex);
  if (new Set(days).size !== days.length) {
    throw new Error('two tasks share the same day number');
  }
  tasks.forEach((t) => {
    if (!t.title || !t.description) throw new Error(`day ${t.dayIndex} is missing a title or description`);
    if (!Number.isInteger(t.dayIndex) || t.dayIndex < 1) throw new Error(`day ${t.dayIndex} is not a valid day number`);
  });
  return tasks.sort((a, b) => a.dayIndex - b.dayIndex);
}

/**
 * Accepts one block ({ interest, month?, daily_tasks }) or an array of them —
 * one whole month for one interest, or a whole batch across many interests and
 * months in a single paste. Each block's `interest` is matched by name
 * (case-insensitive) against the interests that already exist; a block whose
 * interest doesn't exist yet is skipped, not fatal to the rest of the batch —
 * exactly like every other block that fails to parse for its own reason.
 */
function parseBulkTaskBankJson(raw, interests) {
  const parsed = JSON.parse(raw);
  const blocks = Array.isArray(parsed) ? parsed : [parsed];
  if (blocks.length === 0) {
    throw new Error('That JSON has no task blocks in it');
  }

  const resolved = [];
  const skipped = [];

  blocks.forEach((block, index) => {
    const interestName = typeof block.interest === 'string' ? block.interest.trim() : '';
    const label = interestName || `block ${index + 1}`;
    try {
      if (!interestName) {
        throw new Error('has no "interest" field');
      }
      const matches = interests.filter((i) => i.name.trim().toLowerCase() === interestName.toLowerCase());
      if (matches.length === 0) {
        throw new Error('no interest with that name exists — create it first, or fix the spelling');
      }
      // Interests are only unique per (name, category), not per name alone — a
      // LONG_TERM and a SHORT_TERM interest can share the exact same name. Picking
      // either one silently would risk binding the bank to a different interest
      // than the one an ACTIVE group actually uses, with no visible sign anything
      // was wrong until the group's task never shows up. Refuse instead.
      if (matches.length > 1) {
        throw new Error(
          `matches ${matches.length} interests with the same name (${matches.map((m) => m.category).join(', ')}) — `
          + 'rename one so they are unique, then re-paste'
        );
      }
      const match = matches[0];
      if (!Array.isArray(block.daily_tasks) || block.daily_tasks.length === 0) {
        throw new Error('has no "daily_tasks" array');
      }
      const tasks = mapTasks(block.daily_tasks);
      const title = block.month ? `${match.name} — ${block.month}` : match.name;
      resolved.push({ interestId: match.id, interestName: match.name, interestCategory: match.category, title, tasks });
    } catch (err) {
      skipped.push({ label, reason: err.message || 'could not be parsed' });
    }
  });

  if (resolved.length === 0 && skipped.length === 0) {
    throw new Error('Nothing recognisable in that JSON');
  }
  return { resolved, skipped };
}

export default function AdminTaskBanksPage() {
  const {
    interests, fetchInterests,
    taskBanks, fetchTaskBanks, uploadTaskBank, deactivateTaskBank, runTaskRolloverNow,
    loading,
  } = useAdminStore();

  const [browseInterestId, setBrowseInterestId] = useState('');
  const [rawJson, setRawJson] = useState('');
  const [batch, setBatch] = useState(null); // { resolved, skipped }
  const [parseError, setParseError] = useState('');
  const [uploading, setUploading] = useState(false);
  // GROUP banks feed matched groups (peer-reviewed); SOLO banks feed students who
  // haven't unlocked matching yet (reviewed on Task reviews).
  const [track, setTrack] = useState('GROUP');

  useEffect(() => {
    fetchInterests().catch(console.error);
  }, []);

  useEffect(() => {
    if (browseInterestId) fetchTaskBanks(browseInterestId).catch(console.error);
  }, [browseInterestId]);

  const handlePreview = () => {
    setParseError('');
    setBatch(null);
    try {
      setBatch(parseBulkTaskBankJson(rawJson, interests));
    } catch (err) {
      setParseError(err.message || 'Could not parse that JSON');
    }
  };

  const handleUpload = async () => {
    if (!batch || batch.resolved.length === 0) {
      toast.error('Nothing to upload — parse a batch with at least one matched interest first');
      return;
    }
    setUploading(true);
    let succeeded = 0;
    const failed = [];
    for (const entry of batch.resolved) {
      try {
        await uploadTaskBank(entry.interestId, entry.title, entry.tasks, track);
        succeeded += 1;
      } catch (err) {
        failed.push(`${entry.interestName}: ${err.message || 'failed'}`);
      }
    }
    setUploading(false);

    if (succeeded > 0) toast.success(`Uploaded ${succeeded} bank${succeeded === 1 ? '' : 's'}`);
    if (failed.length > 0) toast.error(`${failed.length} failed: ${failed.join('; ')}`);
    if (batch.skipped.length > 0) {
      toast(`Skipped ${batch.skipped.length} (no matching interest)`, { icon: '⚠️' });
    }

    setRawJson('');
    setBatch(null);
    if (browseInterestId) fetchTaskBanks(browseInterestId);
  };

  const handleDeactivate = async (bankId) => {
    try {
      await deactivateTaskBank(bankId);
      toast.success('Deactivated');
      fetchTaskBanks(browseInterestId);
    } catch (err) {
      toast.error(err.message || 'Could not deactivate that');
    }
  };

  const handleRunNow = async () => {
    try {
      const response = await runTaskRolloverNow();
      // The real count, not a fixed string — "0 eligible groups" means nothing
      // matched (wrong interest, group not ACTIVE yet, or already ticked today),
      // which looks identical to a real bug unless the count says otherwise.
      toast.success(response.message, { duration: 6000 });
    } catch (err) {
      toast.error(err.message || 'Could not run that');
    }
  };

  const banks = browseInterestId ? taskBanks : [];

  return (
    <div>
      <AdminPageHeader title="Daily Task Banks">
        <Button variant="secondary" size="sm" icon={<PlayCircle className="h-4 w-4" />} onClick={handleRunNow} loading={loading}>
          Run rollover now
        </Button>
      </AdminPageHeader>

      <p className="mb-6 border-l-2 border-line pl-4 text-xs leading-relaxed text-mute">
        Paste one interest's month, or a whole batch across many interests and months at once —
        either a single <code className="rounded bg-surface-2 px-1 py-0.5">{'{ interest, month, daily_tasks }'}</code>{' '}
        object or a JSON array of them. Each block's <code className="rounded bg-surface-2 px-1 py-0.5">interest</code>{' '}
        is matched by name against interests that already exist here; if one doesn't exist yet, that
        block is skipped rather than failing the whole batch — create the interest first, then re-paste.
        A bank is immutable once uploaded: uploading a new one for an interest just changes which bank
        new groups start on, groups already mid-sequence keep the one they started with. Each interest
        has one live group bank and one live solo bank; solo banks feed students who haven&rsquo;t unlocked
        matching yet, so write them as tasks one person can do alone.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-display text-base font-bold text-ink">Bulk upload</h2>

          <Select label="Who these tasks are for" value={track} onChange={(e) => setTrack(e.target.value)}>
            <option value="GROUP">Matched groups (peer-reviewed)</option>
            <option value="SOLO">Solo, before matching unlocks (admin-reviewed)</option>
          </Select>

          <TextArea
            label="Paste task JSON — one block or an array of blocks"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            rows={12}
            placeholder='[ { "interest": "Coding and Software Development", "month": "Month 1", "daily_tasks": [ ... ] }, { "interest": "Finance", "month": "Month 1", "daily_tasks": [ ... ] } ]'
          />
          {parseError && <p className="text-xs text-bad">{parseError}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePreview} disabled={!rawJson.trim()}>
              Parse &amp; preview
            </Button>
            <Button onClick={handleUpload} loading={uploading} disabled={!batch || batch.resolved.length === 0}>
              Upload {batch?.resolved.length ? `(${batch.resolved.length} bank${batch.resolved.length === 1 ? '' : 's'})` : ''}
            </Button>
          </div>

          {batch && (
            <div className="space-y-3">
              {batch.resolved.map((entry) => (
                <div key={entry.interestId} className="flex items-center justify-between gap-3 rounded-lg border border-good/30 bg-good/5 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-hidden="true" />
                    <span className="truncate text-sm text-ink">{entry.title}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-widest text-mute">{entry.interestCategory}</span>
                  </div>
                  <span className="shrink-0 text-xs text-mute tnum">{entry.tasks.length} days</span>
                </div>
              ))}
              {batch.skipped.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-wait/30 bg-wait/5 px-4 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-wait" aria-hidden="true" />
                  <p className="text-sm text-ink">
                    <span className="font-medium">{s.label}</span> — skipped: {s.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-base font-bold text-ink">Existing banks</h2>

          <Select
            value={browseInterestId}
            onChange={(e) => setBrowseInterestId(e.target.value)}
            className="mb-4"
          >
            <option value="">Browse an interest's banks…</option>
            {interests.map((i) => (
              <option key={i.id} value={i.id}>{i.name} ({i.category})</option>
            ))}
          </Select>

          {!browseInterestId ? (
            <p className="text-sm text-mute">Pick an interest above to see what it already has.</p>
          ) : loading && banks.length === 0 ? (
            <div className="flex justify-center py-10 text-accent-500"><Spinner /></div>
          ) : banks.length === 0 ? (
            <EmptyState title="No banks yet" description="Upload one on the left to get started." />
          ) : (
            <ul className="space-y-3">
              {banks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{b.title}</p>
                    <p className="text-xs text-mute">{b.itemCount} days · {new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={b.track === 'SOLO' ? 'primary' : 'secondary'}>{b.track === 'SOLO' ? 'Solo' : 'Group'}</Badge>
                    <Badge variant={b.active ? 'success' : 'secondary'}>{b.active ? 'Active' : 'Inactive'}</Badge>
                    {b.active && (
                      <Button size="sm" variant="ghost" onClick={() => handleDeactivate(b.id)}>Deactivate</Button>
                    )}
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
