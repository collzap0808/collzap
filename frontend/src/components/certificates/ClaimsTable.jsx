import { formatDate, formatDateTime } from '../../lib/certificateClaims';

const th = 'px-4 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-mute whitespace-nowrap';
const td = 'px-4 py-3 text-sm text-ink whitespace-nowrap';

/**
 * The students-who-claimed table, shared by the Certification page (one certificate,
 * server-paged) and the Certificate claims page (all certificates, searchable).
 */
export default function ClaimsTable({ rows, showCertificate = false, emptyText = 'Nobody has claimed this yet.' }) {
    const cols = showCertificate ? 8 : 7;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
                <thead>
                <tr>
                    <th className={th}>Number</th>
                    <th className={th}>Student</th>
                    <th className={th}>College</th>
                    {showCertificate && <th className={th}>Certificate</th>}
                    <th className={th}>Points</th>
                    <th className={th}>Issued</th>
                    <th className={th}>Downloads</th>
                    <th className={th}>Last download</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-line">
                {rows.length === 0 && (
                    <tr><td colSpan={cols} className="px-4 py-10 text-center text-sm text-mute">{emptyText}</td></tr>
                )}
                {rows.map((i) => (
                    <tr key={i.id}>
                        <td className={`${td} font-mono text-xs`}>{i.certificateCode}</td>
                        <td className={td}>
                            <p className="font-medium">{i.holderName}</p>
                            <p className="text-xs text-mute">{i.holderEmail || '—'}</p>
                        </td>
                        <td className={td}>{i.collegeName || '—'}</td>
                        {showCertificate && <td className={td}>{i.ruleName}</td>}
                        <td className={`${td} tnum`}>{i.points?.toLocaleString('en-IN')}</td>
                        <td className={td}>{formatDate(i.issuedAt)}</td>
                        <td className={`${td} tnum`}>{i.downloadCount}</td>
                        <td className={`${td} text-xs text-mute`}>{formatDateTime(i.lastDownloadedAt)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
