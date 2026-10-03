import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import CertificateFrame from '../../components/certificates/CertificateFrame';
import { certApi, savePdf } from '../../api/certificateApi';

const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Same rule the server enforces (English letters because the PDF uses built-in fonts).
const NAME_OK = /^[A-Za-z][A-Za-z .'-]{1,59}$/;

/** Route: /certificates/:ruleId  (student, inside AppShell) */
export default function CertificatePage() {
    const { ruleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [name, setName] = useState('');
    const [agree, setAgree] = useState(false);
    const [busy, setBusy] = useState(false);

    // Where to return when Back is pressed.
    // - If we navigated here from somewhere inside the app, `location.state.from`
    //   holds that path (see the Link on /certificates passing state={{ from: '/certificates' }}).
    // - Otherwise fall back to the list, which is the logical parent of a detail page.
    const backTo = location.state?.from || '/certificates';
    const backLabel = backTo.startsWith('/certificates') ? 'Back to certificates' : 'Back';

    const load = useCallback(async () => {
        setLoadError('');
        try {
            setData(await certApi.detail(ruleId));
        } catch (err) {
            setLoadError(err?.message || 'Could not load this certificate');
        }
    }, [ruleId]);

    useEffect(() => { load(); }, [load]);

    const status = data?.card?.status;
    const issued = status === 'ISSUED';
    const typed = name.trim().replace(/\s+/g, ' ');
    const nameValid = NAME_OK.test(typed);

    // Live preview: until the name is locked the server leaves {{studentName}} open.
    const html = useMemo(() => {
        if (!data?.previewHtml) return '';
        const shown = escapeHtml(typed || 'Your Name');
        return data.previewHtml.replace(/\{\{\s*studentName\s*\}\}/g, () => shown);
    }, [data, typed]);

    const download = async () => {
        setBusy(true);
        try {
            const file = await certApi.download(ruleId, issued ? undefined : typed);
            savePdf(file);
            toast.success(issued ? 'Downloaded' : 'Certificate saved to your device');
            await load(); // now shows the locked name + certificate number
        } catch (err) {
            toast.error(err.message || 'Could not create the certificate');
        } finally {
            setBusy(false);
        }
    };

    const back = (
        <button
            type="button"
            onClick={() => navigate(backTo)}
            className="mb-4 inline-flex items-center gap-1.5 rounded text-sm text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {backLabel}
        </button>
    );

    if (!data) {
        return (
            <div className="mx-auto max-w-3xl">
                {back}
                {loadError ? (
                    <EmptyState
                        icon={Lock}
                        title="Certificate unavailable"
                        description={loadError}
                        action={
                            <Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>
                                Try again
                            </Button>
                        }
                    />
                ) : (
                    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                )}
            </div>
        );
    }

    if (status === 'LOCKED') {
        return (
            <div className="mx-auto max-w-3xl">
                {back}
                <EmptyState
                    icon={Lock}
                    title={data.card.name}
                    description={`Locked. Earn ${data.card.pointsToGo.toLocaleString()} more points to unlock it.`}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl">
            <Helmet><title>{data.card.name} · Collzap</title></Helmet>
            {back}
            <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-ink">{data.card.name}</h1>

            {html ? (
                <CertificateFrame html={html} />
            ) : (
                <p className="rounded-lg border border-dashed border-line bg-ink/[0.015] px-4 py-6 text-center text-sm text-mute">
                    The preview isn&rsquo;t available right now, but you can still enter your name and download your certificate.
                </p>
            )}

            <div className="mt-6 max-w-md space-y-4 rounded-lg border border-line bg-surface p-5">
                {issued ? (
                    <>
                        <Input label="Name on certificate" value={data.holderName} disabled readOnly />
                        <p className="flex items-center gap-2 text-xs text-mute">
                            <ShieldCheck className="h-4 w-4 text-good" aria-hidden="true" />
                            Name is locked. Certificate no. <b className="font-mono text-ink">{data.card.certificateCode}</b>
                        </p>
                        <Button loading={busy} onClick={download} icon={<Download className="h-4 w-4" />}>
                            Download again
                        </Button>
                    </>
                ) : (
                    <>
                        <Input
                            label="Your full name"
                            value={name}
                            maxLength={60}
                            placeholder="e.g. Yadnesh Patil"
                            onChange={(e) => setName(e.target.value)}
                            error={typed && !nameValid ? 'Use English letters, spaces and . \' - only (2–60 characters)' : undefined}
                            hint="This is the name printed on your certificate."
                        />
                        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-accent-500"
                            />
                            <span>I checked my spelling. I understand the name <b>cannot be changed</b> after I download.</span>
                        </label>
                        <Button loading={busy} disabled={!nameValid || !agree} onClick={download} icon={<Download className="h-4 w-4" />}>
                            Download certificate
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}