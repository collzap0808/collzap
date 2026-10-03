import { useEffect, useRef, useState } from 'react';

// A4 landscape at 96 dpi — the size the templates are designed for.
const W = 1123;
const H = 794;

/**
 * Shows a certificate's HTML in a locked-down iframe (no scripts, no same-origin
 * access) and scales it to whatever width the screen gives it.
 *
 * Used by the student certificate page and the admin preview.
 * NOTE: this file must only contain this component. (The Home card lives in CertificateCards.jsx.)
 */
export default function CertificateFrame({ html }) {
    const box = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = box.current;
        if (!el) return undefined;
        const fit = () => setScale((el.clientWidth || W) / W);
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <div
            ref={box}
            className="relative w-full overflow-hidden rounded-lg border border-line bg-white shadow-sm"
            style={{ height: H * scale }}
        >
            <iframe
                title="Certificate preview"
                sandbox=""
                srcDoc={html}
                style={{
                    width: W,
                    height: H,
                    border: 0,
                    background: '#fff',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                }}
            />
        </div>
    );
}