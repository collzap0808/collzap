import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Award, Download, RefreshCw, Search, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import ClaimsTable from '../../components/certificates/ClaimsTable';
import { certApi } from '../../api/certificateApi';
import { fetchAllClaims, saveClaimsCsv } from '../../lib/certificateClaims';
import AdminPageHeader from './AdminPageHeader';

const PAGE_SIZE = 15;
const ALL = 'ALL';

const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name', label: 'Name A to Z' },
    { value: 'downloads', label: 'Most downloads' },
];

const sorters = {
    newest: (a, b) => new Date(b.issuedAt) - new Date(a.issuedAt),
    oldest: (a, b) => new Date(a.issuedAt) - new Date(b.issuedAt),
    name: (a, b) => (a.holderName || '').localeCompare(b.holderName || ''),
    downloads: (a, b) => b.downloadCount - a.downloadCount || new Date(b.issuedAt) - new Date(a.issuedAt),
};

const percent = (part, whole) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);

/**
 * Admin → Certificate claims.
 * Every student who claimed a certificate: name, email, college, unique number,
 * points, dates and download count. Pick one certificate or all of them, search,
 * sort, and export the result as CSV. Open it from the Certification page with
 * ?rule=<certificateId> to land on one certificate.
 */
export default function AdminCertificateClaimsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const scope = searchParams.get('rule') || ALL;

    const [rules, setRules] = useState(null);
    const [rows, setRows] = useState([]);
    const [truncated, setTruncated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(0);
    const [tick, setTick] = useState(0); // bump to reload
    const reqId = useRef(0);

    // 1) the certificates (and their counts)
    useEffect(() => {
        certApi.admin.list()
            .then(setRules)
            .catch((err) => {
                setRules([]);
                toast.error(err.message || 'Could not load certificates');
            });
    }, [tick]);

    // 2) every claim for the chosen scope
    const loadClaims = useCallback(async (list, chosen) => {
        const id = ++reqId.current;
        setLoading(true);
        try {
            const targets = chosen === ALL ? list : list.filter((r) => r.id === chosen);
            const results = await Promise.all(targets.map(fetchAllClaims));
            if (id !== reqId.current) return; // a newer request replaced this one
            setRows(results.flatMap((r) => r.rows));
            setTruncated(results.some((r) => r.truncated));
        } catch (err) {
            if (id !== reqId.current) return;
            setRows([]);
            toast.error(err.message || 'Could not load the student list');
        } finally {
            if (id === reqId.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (rules === null) return;
        loadClaims(rules, scope);
    }, [rules, scope, loadClaims]);

    const chooseScope = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value === ALL) next.delete('rule');
        else next.set('rule', value);
        setSearchParams(next, { replace: true });
        setPage(0);
    };

    // ---- numbers for the cards (from the rule counts, so they are exact) ----
    const scoped = (rules || []).filter((r) => scope === ALL || r.id === scope);
    const unlocked = scoped.reduce((t, r) => t + r.unlockedCount, 0);
    const claimed = scoped.reduce((t, r) => t + r.claimedCount, 0);
    const downloads = scoped.reduce((t, r) => t + r.totalDownloads, 0);

    // ---- search + sort + page (all on the loaded rows) ----
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q
            ? rows.filter((r) => [r.holderName, r.holderEmail, r.collegeName, r.certificateCode, r.ruleName]
                .some((v) => v?.toLowerCase().includes(q)))
            : rows;
        return [...list].sort(sorters[sort]);
    }, [rows, search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

    const scopeName = scope === ALL ? 'All certificates' : scoped[0]?.name || 'Certificate';

    const exportCsv = () => {
        if (filtered.length === 0) {
            toast.error('Nothing to export');
            return;
        }
        const slug = scopeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'certificates';
        saveClaimsCsv(filtered, `claims-${slug}.csv`);
        toast.success(`Exported ${filtered.length} student${filtered.length === 1 ? '' : 's'}`);
    };

    if (rules === null) {
        return <div className="flex justify-center py-24 text-accent-500"><Spinner size="lg" /></div>;
    }

    return (
        <div>
            <AdminPageHeader title="Certificate claims" count={claimed}>

                <Button size="sm" onClick={exportCsv} disabled={loading || filtered.length === 0}
                        icon={<Download className="h-4 w-4" />}>
                    Export CSV
                </Button>
            </AdminPageHeader>

            {rules.length === 0 ? (
                <EmptyState
                    icon={Award}
                    title="No certificates yet"
                    description="Create a certificate first. Students who claim it will be listed here."
                    action={<Link to="/admin/certificates"><Button variant="secondary" size="sm">Go to Certification</Button></Link>}
                />
            ) : (
                <>
                    {/* ---------- counts ---------- */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            ['Unlocked', unlocked, 'students with enough points'],
                            ['Claimed', claimed, 'students who downloaded'],
                            ['Downloads', downloads, 'PDFs downloaded in total'],
                            ['Claim rate', `${percent(claimed, unlocked)}%`, 'of unlocked students claimed'],
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

                    {/* ---------- filters ---------- */}
                    <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_12rem]">
                        <Input
                            aria-label="Search students"
                            placeholder="Search by name, email, college or certificate number"
                            icon={<Search className="h-4 w-4" aria-hidden="true" />}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        />
                        <Select
                            aria-label="Certificate"
                            value={scope}
                            onChange={(e) => chooseScope(e.target.value)}
                            options={[{ value: ALL, label: 'All certificates' }, ...rules.map((r) => ({ value: r.id, label: r.name }))]}
                        />
                        <Select
                            aria-label="Sort by"
                            value={sort}
                            onChange={(e) => { setSort(e.target.value); setPage(0); }}
                            options={SORTS}
                        />
                    </div>

                    <p className="mb-3 flex items-center gap-2 text-xs text-mute">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        Showing <span className="font-semibold text-ink tnum">{filtered.length}</span> of{' '}
                        <span className="font-semibold text-ink tnum">{rows.length}</span> students · {scopeName}
                    </p>

                    {truncated && (
                        <p className="mb-3 rounded border border-wait/30 bg-wait/10 px-3 py-2 text-xs text-wait">
                            This list is very long, so only the first 5,000 claims per certificate are loaded.
                        </p>
                    )}

                    {/* ---------- list ---------- */}
                    {loading ? (
                        <div className="flex justify-center py-16 text-accent-500"><Spinner size="lg" /></div>
                    ) : (
                        <div className="rounded-lg border border-line bg-surface">
                            <ClaimsTable
                                rows={pageRows}
                                showCertificate={scope === ALL}
                                emptyText={search.trim() ? `No student matches "${search.trim()}".` : 'Nobody has claimed this yet.'}
                            />
                            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
