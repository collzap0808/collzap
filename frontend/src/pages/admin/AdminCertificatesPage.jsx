import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Award, Eye, Pencil, Trash2, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import CertificateFrame from '../../components/certificates/CertificateFrame';
import { certApi } from '../../api/certificateApi';
import AdminPageHeader from './AdminPageHeader';

const EMPTY = { id: null, name: '', pointsRequired: '', level: '', active: true, file: null };

const th = 'px-4 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-mute whitespace-nowrap';
const td = 'px-4 py-3 text-sm text-ink whitespace-nowrap';

const percent = (part, whole) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);

/**
 * Admin → Certification.
 * Add templates and unlock points, and see the counts (unlocked / claimed / downloads).
 * The list of students who claimed lives on its own page: /admin/certificate-claims.
 */
export default function AdminCertificatesPage() {
    const [rules, setRules] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(null); // { title, html }
    const fileRef = useRef(null);

    const load = useCallback(async () => {
        try {
            setRules(await certApi.admin.list());
        } catch (err) {
            setRules([]);
            toast.error(err.message || 'Could not load certificates');
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const reset = () => {
        setForm(EMPTY);
        if (fileRef.current) fileRef.current.value = '';
    };

    const save = async (e) => {
        e.preventDefault();
        if (!form.id && !form.file) {
            toast.error('Choose the certificate .html file');
            return;
        }
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('pointsRequired', String(form.pointsRequired));
        fd.append('level', form.level.trim());
        fd.append('active', String(form.active));
        if (form.file) fd.append('template', form.file);

        setSaving(true);
        try {
            if (form.id) await certApi.admin.update(form.id, fd);
            else await certApi.admin.create(fd);
            toast.success(form.id ? 'Certificate updated' : 'Certificate created');
            reset();
            await load();
        } catch (err) {
            toast.error(err.message || 'Could not save the certificate');
        } finally {
            setSaving(false);
        }
    };

    const edit = (r) => {
        setForm({ id: r.id, name: r.name, pointsRequired: String(r.pointsRequired), level: r.level || '', active: r.active, file: null });
        if (fileRef.current) fileRef.current.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const remove = async (r) => {
        if (!window.confirm(`Delete "${r.name}"?`)) return;
        try {
            await certApi.admin.remove(r.id);
            toast.success('Certificate deleted');
            if (form.id === r.id) reset();
            load();
        } catch (err) {
            toast.error(err.message || 'Could not delete that');
        }
    };

    const openPreview = async (r) => {
        try {
            const p = await certApi.admin.preview(r.id);
            setPreview({ title: r.name, html: p.html });
        } catch (err) {
            toast.error(err.message || 'Could not build the preview');
        }
    };

    const totals = (rules || []).reduce(
        (t, r) => ({ unlocked: t.unlocked + r.unlockedCount, claimed: t.claimed + r.claimedCount, downloads: t.downloads + r.totalDownloads }),
        { unlocked: 0, claimed: 0, downloads: 0 }
    );

    return (
        <div>
            <AdminPageHeader title="Certification" count={rules?.length ?? 0}>
                <Link to="/admin/certificate-claims">
                    <Button variant="secondary" size="sm" icon={<Users className="h-4 w-4" />}>Claimed students</Button>
                </Link>
            </AdminPageHeader>

            <p className="mb-6 border-l-2 border-line pl-4 text-xs leading-relaxed text-mute">
                Upload an HTML certificate and set the points a student needs. Students who reach the points see it on
                their Home page, type their name <b>once</b>, and download a PDF with a unique number and a QR code.
                The name can never be changed after the first download.
            </p>

            {/* ---------- headline numbers ---------- */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    ['Unlocked', totals.unlocked, 'students with enough points'],
                    ['Claimed', totals.claimed, 'students who downloaded'],
                    ['Downloads', totals.downloads, 'PDFs downloaded in total'],
                    ['Claim rate', `${percent(totals.claimed, totals.unlocked)}%`, 'of unlocked students claimed'],
                ].map(([label, value, sub]) => (
                    <div key={label} className="rounded-lg border border-line bg-surface p-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-mute">{label}</p>
                        <p className="mt-1 font-display text-2xl font-bold text-ink tnum">
                            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
                        </p>
                        <p className="mt-0.5 hidden text-[11px] text-mute sm:block">{sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
                {/* ---------- add / edit ---------- */}
                <form onSubmit={save} className="space-y-4 self-start rounded-lg border border-line bg-surface p-5" noValidate>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-display text-base font-bold text-ink">{form.id ? 'Edit certificate' : 'Add a certificate'}</h2>
                        {form.id && <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>}
                    </div>

                    <Input label="Name" value={form.name} onChange={set('name')} maxLength={120} placeholder="Certificate of Achievement" required />

                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Points to unlock" type="number" min={1} value={form.pointsRequired} onChange={set('pointsRequired')} placeholder="4001" required />
                        <Input label="Level on certificate" value={form.level} onChange={set('level')} maxLength={60} placeholder="Growing" />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink">
                            Certificate template (.html){form.id && <span className="font-normal text-mute"> — leave empty to keep the current one</span>}
                        </label>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".html,.htm,text/html"
                            onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
                            className="block w-full rounded border border-line bg-surface text-sm text-mute file:mr-3 file:cursor-pointer file:border-0 file:bg-ink/[0.06] file:px-3 file:py-2.5 file:text-sm file:font-medium file:text-ink"
                        />
                        <p className="mt-2 text-[11px] leading-relaxed text-mute">
                            Placeholders: <code className="font-mono">{'{{studentName}} {{collegeName}} {{certificateCode}} {{level}} {{points}} {{issuedDate}} {{certificateName}}'}</code>.
                            QR code: <code className="font-mono">{'<img src="{{qrCode}}">'}</code>. Use inline CSS and <code className="font-mono">data:</code> images only —
                            scripts and outside links are removed.{' '}
                            <a href="/certificate-template-sample.html" download className="text-accent-700 underline underline-offset-2">Download a sample template</a>.
                        </p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                        <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-accent-500" />
                        Live — students can see it
                    </label>

                    <Button type="submit" loading={saving} icon={<Award className="h-4 w-4" />}>
                        {form.id ? 'Save changes' : 'Create certificate'}
                    </Button>
                </form>

                {/* ---------- certificates + counts ---------- */}
                <div className="min-w-0">
                    {rules === null ? (
                        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                    ) : rules.length === 0 ? (
                        <EmptyState icon={Award} title="No certificates yet" description="Add your first one with the form." />
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                            <table className="min-w-full divide-y divide-line">
                                <thead>
                                <tr>
                                    <th className={th}>Certificate</th><th className={th}>Points</th><th className={th}>Unlocked</th>
                                    <th className={th}>Claimed</th><th className={th}>Downloads</th><th className={th} />
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                {rules.map((r) => (
                                    <tr key={r.id}>
                                        <td className={td}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{r.name}</span>
                                                <Badge variant={r.active ? 'success' : 'default'}>{r.active ? 'Live' : 'Off'}</Badge>
                                            </div>
                                            {r.level && <p className="mt-0.5 text-xs text-mute">{r.level}</p>}
                                        </td>
                                        <td className={`${td} tnum`}>{r.pointsRequired.toLocaleString('en-IN')}</td>
                                        <td className={`${td} tnum`}>{r.unlockedCount}</td>
                                        <td className={`${td} tnum`}>
                                            {r.claimedCount}
                                            <span className="ml-1.5 text-[11px] text-mute">({percent(r.claimedCount, r.unlockedCount)}%)</span>
                                        </td>
                                        <td className={`${td} tnum`}>{r.totalDownloads}</td>
                                        <td className={`${td} text-right`}>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openPreview(r)} aria-label={`Preview ${r.name}`} icon={<Eye className="h-4 w-4" />} />
                                                <Link to={`/admin/certificate-claims?rule=${r.id}`} aria-label={`Students who claimed ${r.name}`}>
                                                    <Button variant="ghost" size="sm" tabIndex={-1} icon={<Users className="h-4 w-4" />} />
                                                </Link>
                                                <Button variant="ghost" size="sm" onClick={() => edit(r)} aria-label={`Edit ${r.name}`} icon={<Pencil className="h-4 w-4" />} />
                                                <Button variant="ghost" size="sm" onClick={() => remove(r)} aria-label={`Delete ${r.name}`} icon={<Trash2 className="h-4 w-4 text-bad" />} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ? `Preview: ${preview.title}` : ''} size="xl">
                {preview && <CertificateFrame html={preview.html} />}
            </Modal>
        </div>
    );
}