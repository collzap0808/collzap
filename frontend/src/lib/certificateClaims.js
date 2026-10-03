import { certApi } from '../api/certificateApi';

const PAGE = 100;       // the server never returns more than 100 rows per request
const MAX_PAGES = 50;   // safety stop: 5,000 claims per certificate

/**
 * Loads EVERY claim of one certificate (page after page) so the admin can search,
 * sort and export across the whole list instead of one page at a time.
 * Resolves to { rows, total, truncated }.
 */
export async function fetchAllClaims(rule) {
    const rows = [];
    let total = 0;
    let page = 0;
    do {
        const d = await certApi.admin.issues(rule.id, page, PAGE);
        total = d.total;
        if (!d.items.length) break;
        rows.push(...d.items.map((i) => ({ ...i, ruleId: rule.id, ruleName: rule.name })));
        page += 1;
    } while (rows.length < total && page < MAX_PAGES);
    return { rows, total, truncated: rows.length < total };
}

export const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (iso) =>
    iso
        ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

// A cell that starts with = + - @ can run as a formula when the CSV is opened in Excel.
const csvCell = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
};

/** Downloads the given claim rows as a .csv file. */
export function saveClaimsCsv(rows, filename = 'certificate-claims.csv') {
    const head = ['Certificate number', 'Student name', 'Email', 'College', 'Certificate', 'Points', 'Issued on', 'Downloads', 'Last download'];
    const lines = [head, ...rows.map((r) => [
        r.certificateCode, r.holderName, r.holderEmail, r.collegeName, r.ruleName, r.points,
        r.issuedAt ? new Date(r.issuedAt).toISOString() : '', r.downloadCount,
        r.lastDownloadedAt ? new Date(r.lastDownloadedAt).toISOString() : '',
    ])];
    const csv = `\uFEFF${lines.map((l) => l.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}
