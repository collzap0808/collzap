import { useEffect, useId, useRef } from 'react';
import { useReducedMotion } from '../../../../lib/motion';

/*
 * A 14-second hand-drawn loop for the hero:
 * curiosity → discovery → people → experimentation → collaboration → creation → confidence → curiosity.
 *
 * One clock drives everything. A single CSS variable, --t (seconds into the loop), is
 * written to the <svg> each frame, and every element derives its state from it in CSS
 * (opacity, stroke draw-on, position), so React never re-renders while it plays. The
 * frame the server prerenders, and the one reduced-motion users see, is t = 11.6: the
 * group around the finished project.
 */

const LOOP = 14;
const STILL = 11.6;

const NAVY = '#14284B';
const COBALT = '#1F5FD1';
const CYAN = '#2BAFBE';
const YELLOW = '#F2B33D';
const PAPER = '#FFFFFF';
const CARD = '#E7C996';
const HAND = '"Caveat", cursive';

/* ---------------------------------------------------------------- timing */

/** 0 → 1 as t runs from a to a + d. */
const inP = (a, d) => `clamp(0, calc((var(--t) - ${a}) / ${d}), 1)`;
/** 1 → 0 as t runs from b to b + e. */
const outP = (b, e) => `clamp(0, calc((${b + e} - var(--t)) / ${e}), 1)`;

/** Fade in at a (over d), optionally fade out at b (over e). */
const show = (a, d, b, e) => ({ opacity: b == null ? inP(a, d) : `min(${inP(a, d)}, ${outP(b, e)})` });

/** Draw a stroke on from a (over d); the path needs pathLength={1}. */
const draw = (a, d, b, e) => ({
  strokeDasharray: '1 1',
  strokeDashoffset: `calc(1 - ${inP(a, d)})`,
  // hidden until it starts, so round caps don't leave a dot
  opacity: b == null ? inP(a, 0.04) : `min(${inP(a, 0.04)}, ${outP(b, e)})`,
});

/** Move a group from (x0, y0, s0) to (x1, y1, s1) between a and a + d. */
const travel = ([x0, y0, s0], [x1, y1, s1], a, d) => {
  const k = inP(a, d);
  return {
    transformBox: 'view-box',
    transformOrigin: '0 0',
    transform: `translate(calc(${x0}px + ${x1 - x0}px * ${k}), calc(${y0}px + ${y1 - y0}px * ${k})) scale(calc(${s0} + ${s1 - s0} * ${k}))`,
  };
};

const ink = { fill: 'none', stroke: NAVY, strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' };

/** The table scene is drawn in its own units and enlarged by K around (TX, TY). */
const K = 1.3;
const TX = 440;
const TY = 424;
const atTable = ([x, y, s]) => [TX + (x - TX) * K, TY + (y - TY) * K, s * K];
const tableScene = `translate(${TX} ${TY}) scale(${K}) translate(${-TX} ${-TY})`;

/* ---------------------------------------------------------------- people */

/**
 * One student, drawn facing +x with feet at (0, 0), about 120 units tall standing.
 * Limbs are inked by stroking navy under the fabric colour. `front` / `back` are
 * [elbowX, elbowY, handX, handY]; `prop` sits between the body and the front arm.
 */
function Student({
  skin, shirt, pants = '#22365C', hair = 'short', hairColor = '#2A1C17',
  seated = false, back, front, prop, pack, glasses = false, frontStyle, alt,
}) {
  const oy = seated ? 16 : 0;
  const hc = -103 + oy;
  const sh = -86 + oy;
  const limb = (d, color, w = 5.5) => (
    <>
      <path d={d} stroke={NAVY} strokeWidth={w + 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
  const arm = ([ex, ey, hx, hy], sx) => (
    <g>
      {limb(`M${sx} ${sh + 2} Q${ex} ${ey} ${hx} ${hy}`, shirt)}
      <path d={`M${hx - 2.6} ${hy} c0 -2 1.4 -3 2.8 -3 c1.6 0 2.8 1.2 2.6 2.8 c-.2 1.6 -1.4 2.6 -2.8 2.5 c-1.4 -.1 -2.6 -1 -2.6 -2.3z`} fill={skin} stroke={NAVY} strokeWidth="0.9" />
    </g>
  );

  const hairPath = {
    short: `M-8 ${hc} C-9.5 ${hc - 12} 6 ${hc - 15} 9 ${hc - 4} C6 ${hc - 7} 1.5 ${hc - 8} -2 ${hc - 6} C-4 ${hc - 3} -6 ${hc - 1.5} -8 ${hc}Z`,
    long: `M-8 ${hc + 1} C-10.5 ${hc - 13} 7 ${hc - 15} 9 ${hc - 3} C5 ${hc - 7.5} 0 ${hc - 7} -3 ${hc - 5} C-4 ${hc + 4} -5 ${hc + 12} -3 ${hc + 19} C-8 ${hc + 17} -10.5 ${hc + 9} -8 ${hc + 1}Z`,
    bun: `M-8 ${hc} C-9.5 ${hc - 12} 6 ${hc - 15} 9 ${hc - 3} C5 ${hc - 8} 0 ${hc - 7.5} -3 ${hc - 6} C-5 ${hc - 3} -6.5 ${hc - 1} -8 ${hc}Z M-9 ${hc - 9} c-3 -3 -1 -8 3 -7.5 c3.5 .5 4 5 1 7 c-1.4 1 -3 1.2 -4 .5z`,
    curly: `M-8.5 ${hc + 1} q-3.5 -4 -.5 -7.5 q-.5 -5.5 5 -5.5 q3 -4 7.5 -1 q5.5 .3 5.5 5.5 q2 3 -1 5 q-2.5 -2.5 -5.5 -2 q-4 -1 -6.5 2 q-2 1.5 -4.5 3.5z`,
  }[hair];

  return (
    <g>
      {/* legs */}
      {seated ? (
        <>
          {limb('M-5 -40 L15 -41 L16 -4', pants, 7)}
          {limb('M-1 -38 L20 -38 L21 -3', pants, 7)}
          <path d="M11 -4 h8 q4 0 4.5 3.5 h-12.5z M16 -3 h8 q4 0 4.5 3.5 h-12.5z" fill={NAVY} />
        </>
      ) : (
        <>
          {limb('M-5 -56 L-5.5 -4', pants, 7)}
          {limb('M4 -56 L5.5 -4', pants, 7)}
          <path d="M-9 -4 h8 q4 0 4.5 4 h-12.5z M2 -4 h8 q4 0 4.5 4 h-12.5z" fill={NAVY} />
        </>
      )}

      {pack && (
        <path d={`M-9 ${sh - 1} Q-19 ${sh + 1} -18 ${sh + 18} Q-18 ${sh + 27} -10 ${sh + 28}Z`} fill={pack} stroke={NAVY} strokeWidth="1.1" />
      )}
      {back && arm(back, -7)}

      {/* torso, neck, head */}
      <path
        d={`M-10 ${sh - 2} Q-13.5 ${sh + 14} -11 ${sh + 32} L11 ${sh + 32} Q13.5 ${sh + 14} 10 ${sh - 2} Q0 ${sh - 6} -10 ${sh - 2}Z`}
        fill={shirt}
        stroke={NAVY}
        strokeWidth="1.2"
      />
      <path d={`M-3 ${sh - 4} L1 ${sh + 2} L4 ${sh - 4}`} fill="none" stroke={NAVY} strokeWidth="0.9" />
      {pack && <path d={`M-7 ${sh - 3} Q-5 ${sh + 8} -6 ${sh + 18}`} stroke={NAVY} strokeWidth="1.6" fill="none" />}
      <path d={`M-2.6 ${sh - 3} v-5.5 h5.4 v5.5`} fill={skin} stroke={NAVY} strokeWidth="0.9" />
      <path
        d={`M-7.5 ${hc} C-7.5 ${hc - 10} 7.5 ${hc - 11} 8 ${hc - 1} C8.5 ${hc + 7} 4 ${hc + 10.5} 0 ${hc + 10.5} C-4.5 ${hc + 10.5} -8 ${hc + 6} -7.5 ${hc}Z`}
        fill={skin}
        stroke={NAVY}
        strokeWidth="1.2"
      />
      <path d={`M-6.5 ${hc - 0.5} q-2.6 .8 -.6 4`} fill="none" stroke={NAVY} strokeWidth="0.9" />
      <path d={hairPath} fill={hairColor} stroke={NAVY} strokeWidth="0.8" />
      {/* face, turned three-quarters toward +x */}
      <path d={`M0.4 ${hc - 3.2} l2.4 -.6 M4.6 ${hc - 3.6} l2.4 .2`} stroke={NAVY} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="1.8" cy={hc - 0.6} rx="0.85" ry="1.05" fill={NAVY} />
      <ellipse cx="5.8" cy={hc - 0.8} rx="0.85" ry="1.05" fill={NAVY} />
      <path d={`M7.6 ${hc + 0.6} l1.2 2.6 l-1.5 .3`} fill="none" stroke={NAVY} strokeWidth="0.8" strokeLinecap="round" />
      <path d={`M3 ${hc + 5.4} q1.9 1.3 3.6 -.1`} fill="none" stroke={NAVY} strokeWidth="0.9" strokeLinecap="round" />
      {glasses && (
        <path d={`M-.6 ${hc - 2.2} h4.4 v3 h-4.4z M4 ${hc - 2.4} h4 v3 h-4z M3.8 ${hc - 1} h.4`} fill="none" stroke={NAVY} strokeWidth="0.75" />
      )}

      {prop}
      <g style={frontStyle}>{front && arm(front, 7)}</g>
      {alt && <g style={alt.style}>{arm(alt.front, 7)}</g>}
    </g>
  );
}

/* ---------------------------------------------------------------- props */

const HeldLaptop = () => (
  <g>
    <path d="M10 -75 L31 -78 L33 -74 L12 -71Z" fill="#C9D6EA" stroke={NAVY} strokeWidth="1" />
    <path d="M10 -75 L8 -93 L28 -96 L31 -78Z" fill="#DCE7F7" stroke={NAVY} strokeWidth="1" />
    <path d="M12 -90 l12 -2 M12.5 -86 l8 -1.2 M13 -82 l10 -1.5" stroke={COBALT} strokeWidth="1" strokeLinecap="round" />
  </g>
);

const Book = () => (
  <path d="M10 -80 q7 -4 11 0 q4 -4 11 -1 l-1 10 q-6 -2.5 -10 1 q-3.5 -3 -10 -1z M21 -80 l0 10" fill={PAPER} stroke={NAVY} strokeWidth="1" strokeLinejoin="round" />
);

const Gadget = () => (
  <g>
    <path d="M12 -78 h15 v12 h-15z" fill={CARD} stroke={NAVY} strokeWidth="1" />
    <path d="M19.5 -78 v-5 M17.5 -84 h4" stroke={NAVY} strokeWidth="1" strokeLinecap="round" />
    <path d="M15.5 -73 h2 M21.5 -73 h2" stroke={NAVY} strokeWidth="1.4" strokeLinecap="round" />
  </g>
);

/* ---------------------------------------------------------------- scene */

export default function StoryLoop({ className }) {
  const svgRef = useRef(null);
  const noiseRef = useRef(null);
  const reduced = useReducedMotion();
  const boil = `boil${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || reduced) {
      svg?.style.setProperty('--t', STILL);
      return undefined;
    }
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let t = STILL;
    let seedClock = 0;
    let seed = 1;

    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      t = (t + dt) % LOOP;
      svg.style.setProperty('--t', t.toFixed(3));
      // Line "boil": swap the wobble a few times a second, like redrawn frames.
      seedClock += dt;
      if (seedClock > 0.14) {
        seedClock = 0;
        seed = (seed % 4) + 1;
        noiseRef.current?.setAttribute('seed', seed);
      }
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(svg);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced]);

  // The camera: a touch closer while the story builds, easing out to show the finished
  // project, then back in while the line returns to the notebook.
  const camera = {
    transformBox: 'view-box',
    transformOrigin: '340px 300px',
    transform: `scale(calc(1.06 - 0.06 * ${inP(10, 1.4)} + 0.06 * ${inP(12.4, 1.6)}))`,
  };

  // Where each student stands alone, and where they end up around the table.
  const S1 = travel([292, 264, 0.8], atTable([372, 404, 0.9]), 4.8, 1.4);
  const S2 = travel([448, 230, 0.8], atTable([448, 402, 0.88]), 4.9, 1.4);
  const S3 = travel([596, 304, 0.8], atTable([508, 404, 0.9]), 5.0, 1.4);
  const S4 = travel([608, 404, 0.8], atTable([572, 420, 0.95]), 5.1, 1.3);
  const group = (a) => ({ ...show(a, 0.5, 12.6, 1.0) });

  return (
    <svg
      ref={svgRef}
      viewBox="0 112 680 328"
      className={className}
      style={{ '--t': STILL }}
      role="img"
      aria-label="Hand-drawn animation: a student sketching an idea at their desk draws a line that leads to other students on campus who code, design, research and build. They come together around a table, try things, connect their ideas and build a small app and prototype. The first student joins the group and contributes, then starts sketching a new idea."
    >
      <defs>
        <filter id={boil} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence ref={noiseRef} type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" />
          <feDisplacementMap in="SourceGraphic" scale="1.1" />
        </filter>
      </defs>

      <g style={camera}>
        <g filter={`url(#${boil})`}>
          {/* Floor */}
          <path d="M18 421 C140 419 260 422 380 420 S560 419 662 421" {...ink} strokeWidth="1.1" opacity="0.55" />

          {/* ---- 1. Curiosity: the student at their desk ---- */}
          <path d="M66 383 L106 382 M70 383 L68 334 M68 334 q-2 -4 3 -4 M72 384 L70 420 M103 383 L104 420" {...ink} />
          <g style={{ opacity: `calc(1 - ${inP(10.6, 0.6)} + ${inP(12.8, 0.6)})` }}>
            <g transform="translate(88 420)">
              <Student
                seated
                skin="#E3B48E"
                shirt="#F2B33D"
                hair="curly"
                hairColor="#1F1512"
                back={[14, -58, 28, -57]}
                front={[18, -55, 36, -56]}
              />
            </g>
          </g>
          {/* desk with notebook and laptop */}
          <path d="M28 362 L238 360 L246 373 L20 375Z" fill={PAPER} stroke={NAVY} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M36 375 L38 420 M230 373 L228 420" {...ink} />
          <path d="M112 364 L158 363 L162 370 L109 371Z" fill={PAPER} stroke={NAVY} strokeWidth="1.1" />
          <path d="M135 363.5 L135.5 370.5" stroke={NAVY} strokeWidth="0.8" />
          <path d="M176 366 L216 365 L220 369 L172 370Z" fill="#C9D6EA" stroke={NAVY} strokeWidth="1" />
          <path d="M206 365 L214 331 L220 332 L213 366Z" fill="#DCE7F7" stroke={NAVY} strokeWidth="1" />
          {/* page turn at the end of the loop */}
          <path
            d="M135 363.5 L158 363 L162 370 L135.5 370.5Z"
            fill={PAPER}
            stroke={NAVY}
            strokeWidth="1"
            style={{
              ...show(13.4, 0.15, 13.75, 0.2),
              transformBox: 'view-box',
              transformOrigin: '135px 367px',
              transform: `scaleX(calc(1 - 2 * ${inP(13.4, 0.45)}))`,
            }}
          />

          {/* the idea, rising off the page: a lightbulb sketch (also the loop's first stroke) */}
          <g style={{ opacity: outP(13.4, 0.3) }}>
            <path pathLength={1} d="M150 330 C143 324 141 312 149 305 C156 299 168 301 171 310 C173 318 168 323 164 329 L163 334 L153 334 Z" fill="none" stroke={COBALT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={draw(0, 1.1)} />
            <path pathLength={1} d="M154 338 L162 338 M155.5 342 L160.5 342 M158 308 l-3 8 h6 l-3 8" fill="none" stroke={YELLOW} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={draw(0.7, 0.6)} />
          </g>

          {/* things the student wonders about */}
          {[
            ['AI', 104, 292, 0.8],
            ['CODE', 132, 270, 1.1],
            ['DESIGN', 186, 268, 1.4],
            ['MUSIC', 40, 300, 1.7],
            ['PROJECTS', 214, 298, 2.0],
          ].map(([word, x, y, a]) => (
            <text key={word} x={x} y={y} style={{ ...show(a, 0.5, 5.0, 0.8), font: `600 15px ${HAND}`, fill: word === 'AI' || word === 'PROJECTS' ? COBALT : NAVY, letterSpacing: '0.04em' }}>
              {word}
            </text>
          ))}

          {/* ---- 2–3. Discovery and people: one line finds the others ---- */}
          <path
            pathLength={1}
            d="M166 332 C190 306 220 284 252 274 C274 268 290 268 306 264 C340 252 372 216 420 226 C450 232 470 236 498 248 C540 266 568 286 590 306 C620 334 640 360 628 386 C622 398 612 404 600 406"
            fill="none"
            stroke={COBALT}
            strokeWidth="1.5"
            strokeLinecap="round"
            style={draw(1.4, 3.2, 5.0, 1.0)}
          />

          {/* table the group gathers around (behind the students' hands, in front of their legs) */}
          <g style={show(4.9, 0.8, 12.8, 0.8)}>
            <path d="M332 424 L330 366 M512 424 L514 364" {...ink} strokeWidth="1.1" transform={tableScene} />
          </g>

          {/* S1 — coding */}
          <g style={{ ...S1, ...group(2.3) }}>
            <g>
              <Student skin="#C98E63" shirt="#2BAFBE" hair="short" back={[8, -72, 14, -73]} front={[16, -70, 30, -74]} prop={<HeldLaptop />} pack={COBALT} />
            </g>
          </g>
          {/* S2 — design (points at the screen while they try things) */}
          <g style={{ ...S2, ...group(2.9) }}>
            <g transform="scale(-1 1)">
              <Student
                skin="#F1D3B5"
                shirt={COBALT}
                hair="long"
                hairColor="#6B3E26"
                back={[6, -72, 12, -86]}
                front={[16, -72, 22, -80]}
                frontStyle={{ opacity: `calc(1 - ${inP(7.0, 0.3)} + ${inP(8.8, 0.3)})` }}
                alt={{ front: [20, -86, 34, -90], style: show(7.0, 0.3, 8.8, 0.3) }}
                prop={
                  <g>
                    <path d="M10 -95 l18 -2 l2 22 l-18 2z" fill={PAPER} stroke={NAVY} strokeWidth="1" />
                    {/* first try, scribbled out, then the second version */}
                    <path pathLength={1} d="M14 -90 l4 4 l3 -5 l4 6" fill="none" stroke={COBALT} strokeWidth="1" strokeLinecap="round" style={draw(6.6, 0.5, 7.4, 0.3)} />
                    <path pathLength={1} d="M14 -86 l10 -1 l-9 3 l9 -1" fill="none" stroke={NAVY} strokeWidth="0.8" style={draw(7.2, 0.25, 7.4, 0.3)} />
                    <path pathLength={1} d="M16 -91 l7 -.8 l1.4 13 l-7 .8z M18 -88 l3.5 -.4 M18.4 -85 l3.5 -.4" fill="none" stroke={COBALT} strokeWidth="1" strokeLinejoin="round" style={draw(7.8, 0.6, 12.6, 1)} />
                  </g>
                }
              />
            </g>
          </g>
          {/* S3 — research */}
          <g style={{ ...S3, ...group(3.5) }}>
            <g transform="scale(-1 1)">
              <Student skin="#8C5A3B" shirt={PAPER} hair="bun" hairColor="#1A1210" glasses back={[8, -72, 14, -76]} front={[16, -70, 26, -76]} prop={<Book />} />
            </g>
          </g>
          {/* S4 — projects: hands the gadget over to the table */}
          <g style={{ ...S4, ...group(4.1) }}>
            <g transform="scale(-1 1)">
              <Student
                skin="#E3B48E"
                shirt="#1E3E73"
                hair="short"
                hairColor="#3B2A20"
                back={[8, -70, 14, -74]}
                front={[16, -70, 26, -72]}
                pack={CYAN}
                prop={<g style={{ opacity: outP(7.6, 0.3) }}><Gadget /></g>}
              />
            </g>
          </g>

          {/* labels beside each student */}
          {[
            ['CODING', 232, 196, 2.6],
            ['DESIGN', 478, 156, 3.2],
            ['RESEARCH', 516, 240, 3.8],
            ['PROJECTS', 506, 384, 4.4],
          ].map(([word, x, y, a]) => (
            <text key={word} x={x} y={y} style={{ ...show(a, 0.4, 5.0, 0.6), font: `700 15px ${HAND}`, fill: COBALT, letterSpacing: '0.06em' }}>
              {word}
            </text>
          ))}

          <g transform={tableScene}>
          {/* table top, drawn over the gathered students' legs */}
          <g style={show(4.9, 0.8, 12.8, 0.8)}>
            <path d="M330 352 L516 350 L528 364 L318 366Z" fill={PAPER} stroke={NAVY} strokeWidth="1.3" strokeLinejoin="round" />
          </g>

          {/* ---- 4. Experimentation: laptop, gadget, a moved block ---- */}
          <g style={show(6.0, 0.5, 12.8, 0.8)}>
            <path d="M382 354 L436 351 L444 357 L376 360Z" fill="#C9D6EA" stroke={NAVY} strokeWidth="1" />
          </g>
          <g style={{ ...show(6.2, 0.4, 12.8, 0.8), transformBox: 'view-box', transformOrigin: '384px 354px', transform: `scaleY(${inP(6.2, 0.5)})` }}>
            <path d="M384 354 L388 320 L432 316 L432 351Z" fill="#E8F0FB" stroke={NAVY} strokeWidth="1.1" />
            <path d="M391 324 L428 321" stroke={NAVY} strokeWidth="0.8" />
          </g>
          {/* a block on screen gets moved into place */}
          <path
            d="M392 330 l14 -1 l.6 7 l-14 1z"
            fill={CYAN}
            stroke={NAVY}
            strokeWidth="0.8"
            style={{
              ...show(6.8, 0.3, 12.8, 0.8),
              transformBox: 'view-box',
              transformOrigin: '0 0',
              transform: `translate(calc(14px * ${inP(7.2, 0.6)}), calc(8px * ${inP(7.2, 0.6)}))`,
            }}
          />
          <path pathLength={1} d="M392 331 l6 -.4 M392 334 l9 -.6 M392 344 l10 -.7 M392 347 l7 -.5" fill="none" stroke={COBALT} strokeWidth="1" strokeLinecap="round" style={draw(7.0, 0.6, 12.8, 0.8)} />
          {/* the gadget, now on the table */}
          <g style={show(7.6, 0.4, 12.8, 0.8)}>
            <path d="M470 336 h20 v14 h-20z" fill={CARD} stroke={NAVY} strokeWidth="1.1" />
            <path d="M480 336 v-7 M477 328 h6" stroke={NAVY} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M474.5 342 h3 M482.5 342 h3" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M485 330.5 c0 -1.4 1.2 -2.2 2.2 -2.1 c1.2 .1 2 1 1.8 2.2 c-.1 1.1 -1 1.8 -2 1.7 c-1.1 -.1 -2 -.8 -2 -1.8z" fill={PAPER} stroke={NAVY} strokeWidth="0.8" style={{ fill: `color-mix(in srgb, ${YELLOW} calc(${inP(10.2, 0.4)} * 100%), ${PAPER})` }} />
          </g>

          {/* ---- 5. Collaboration: their lines join on the shared idea ---- */}
          {[
            ['M352 330 C368 324 378 330 388 336', 8.6],
            ['M436 318 C446 300 462 306 470 324', 8.9],
            ['M500 316 C496 324 492 328 488 334', 9.2],
            ['M546 336 C530 330 508 336 492 342', 9.5],
            ['M434 346 C446 352 458 350 470 346', 9.8],
          ].map(([d, a]) => (
            <path key={a} pathLength={1} d={d} fill="none" stroke={COBALT} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1 1" style={draw(a, 0.6, 12.2, 0.6)} />
          ))}

          {/* ---- 6. Creation: the app works ---- */}
          <g style={show(10.0, 0.6, 12.8, 0.8)}>
            <path d="M412 336 l11 -.8 l.6 7 l-11 .8z" fill={PAPER} stroke={NAVY} strokeWidth="0.8" />
            <path d="M414.5 339.5 l2 2 l4 -4.5" fill="none" stroke={COBALT} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <path pathLength={1} d="M372 372 C400 380 470 380 500 372" fill="none" stroke={YELLOW} strokeWidth="2" strokeLinecap="round" style={draw(10.3, 0.7, 12.6, 0.6)} />

          </g>

          {/* ---- 7. Confidence: the first student, now part of the group ---- */}
          <g style={show(10.8, 0.6, 12.6, 1.0)}>
            <g transform={`translate(${atTable([300, 420])[0]} 420) scale(${0.95 * K})`}>
              <Student
                skin="#E3B48E"
                shirt="#F2B33D"
                hair="curly"
                hairColor="#1F1512"
                back={[-12, -70, -9, -58]}
                front={[20, -80, 42, -84]}
              />
            </g>
          </g>

          {/* ---- Loop: the line comes back to the notebook ---- */}
          <path
            pathLength={1}
            d="M424 390 C380 404 300 400 240 382 C206 372 180 362 160 354"
            fill="none"
            stroke={COBALT}
            strokeWidth="1.5"
            strokeLinecap="round"
            style={draw(12.2, 1.2, 13.5, 0.5)}
          />
        </g>
      </g>
    </svg>
  );
}
