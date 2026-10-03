import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, SearchX } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Logo from '../../components/brand/Logo';
import Spinner from '../../components/ui/Spinner';
import { certApi } from '../../api/certificateApi';

/** Public route: /verify-certificate/:code — the QR code on a certificate opens this. */
export default function VerifyCertificatePage() {
    const { code } = useParams();
    const [v, setV] = useState(null);

    useEffect(() => {
        certApi.verify(code).then(setV).catch(() => setV({ valid: false, code }));
    }, [code]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-10">
            <Helmet><title>Verify certificate · Collzap</title></Helmet>
            <Link to="/" aria-label="Collzap home" className="mb-8"><Logo className="h-7" /></Link>

            <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 text-center">
                {!v ? (
                    <div className="flex justify-center py-6"><Spinner size="lg" /></div>
                ) : v.valid ? (
                    <>
                        <BadgeCheck className="mx-auto h-10 w-10 text-good" strokeWidth={1.5} aria-hidden="true" />
                        <h1 className="mt-3 font-display text-lg font-bold text-ink">Valid Collzap certificate</h1>
                        <p className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink">{v.holderName}</p>
                        <p className="mt-1 text-sm text-mute">
                            {v.certificateName}{v.level ? ` · ${v.level}` : ''}
                        </p>
                        {v.collegeName && <p className="text-sm text-mute">{v.collegeName}</p>}
                        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-left text-xs">
                            <div><dt className="font-mono uppercase tracking-widest text-mute">Points</dt><dd className="mt-0.5 text-ink">{v.points?.toLocaleString()}</dd></div>
                            <div><dt className="font-mono uppercase tracking-widest text-mute">Issued</dt><dd className="mt-0.5 text-ink">{v.issuedDate}</dd></div>
                            <div className="col-span-2"><dt className="font-mono uppercase tracking-widest text-mute">Certificate no.</dt><dd className="mt-0.5 font-mono text-ink">{v.code}</dd></div>
                        </dl>
                    </>
                ) : (
                    <>
                        <SearchX className="mx-auto h-10 w-10 text-bad" strokeWidth={1.5} aria-hidden="true" />
                        <h1 className="mt-3 font-display text-lg font-bold text-ink">Certificate not found</h1>
                        <p className="mt-2 text-sm text-mute">
                            No certificate has the number <span className="font-mono text-ink">{v.code}</span>.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
