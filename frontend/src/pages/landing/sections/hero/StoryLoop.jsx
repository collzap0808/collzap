import { useEffect, useId, useRef } from 'react';
import { useReducedMotion } from '../../../../lib/motion';

/*
 * An 18-second hand-drawn loop for the hero, telling CollZap's promise in order:
 * your campus is full of people you haven't met → you join, verified to your college →
 * the students who share your interests stand out → they become your circle → you try
 * things and build together → you grow → a company hires you. Then it all loosens back
 * into the crowd and the loop begins again.
 *
 * One clock drives everything. A single CSS variable, --t (seconds into the loop), is
 * written to the <svg> each frame and every element derives its state from it in CSS,
 * so React never re-renders while it plays. The prerendered frame, and the one
 * reduced-motion users see, is t = STILL: the circle building together.
 */

const LOOP = 18;
const STILL = 10.9;

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

/**
 * Move a group from (x0, y0, s0) to (x1, y1, s1) between a and a + d, and back again
 * between b and b + e.
 */
const travel = ([x0, y0, s0], [x1, y1, s1], a, d, b, e) => {
  const k = `calc(${inP(a, d)} - ${inP(b, e)})`;
  return {
    transformBox: 'view-box',
    transformOrigin: '0 0',
    transform: `translate(calc(${x0}px + ${x1 - x0}px * ${k}), calc(${y0}px + ${y1 - y0}px * ${k})) scale(calc(${s0} + ${s1 - s0} * ${k}))`,
  };
};

const ink = { fill: 'none', stroke: NAVY, strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' };

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

const Phone = ({ screen }) => (
  <g>
    <path d="M14 -98 l8 -1 l1.4 14 l-8 1z" fill={NAVY} />
    <path d="M15.4 -96.6 l5.6 -.7 l1 11 l-5.6 .7z" fill="#DCE7F7" />
    {screen}
  </g>
);

const HeldLaptop = () => (
  <g>
    <path d="M10 -75 L31 -78 L33 -74 L12 -71Z" fill="#C9D6EA" stroke={NAVY} strokeWidth="1" />
    <path d="M10 -75 L8 -93 L28 -96 L31 -78Z" fill="#DCE7F7" stroke={NAVY} strokeWidth="1" />
    <path d="M12 -90 l12 -2 M12.5 -86 l8 -1.2 M13 -82 l10 -1.5" stroke={COBALT} strokeWidth="1" strokeLinecap="round" />
  </g>
);

const Sketchpad = () => (
  <g>
    <path d="M10 -95 l18 -2 l2 22 l-18 2z" fill={PAPER} stroke={NAVY} strokeWidth="1" />
    <path d="M15 -90 l7 -.8 l1.4 13 l-7 .8z M17 -87 l3.5 -.4 M17.4 -84 l3.5 -.4" fill="none" stroke={COBALT} strokeWidth="0.9" strokeLinejoin="round" />
  </g>
);

const Book = () => (
  <path d="M10 -80 q7 -4 11 0 q4 -4 11 -1 l-1 10 q-6 -2.5 -10 1 q-3.5 -3 -10 -1z M21 -80 l0 10" fill={PAPER} stroke={NAVY} strokeWidth="1" strokeLinejoin="round" />
);

/** The same student, faded to pencil: someone on campus you haven't met yet. */
const GHOST = { skin: '#F3F6FA', shirt: '#E6ECF4', pants: '#D5DEEA', hairColor: '#C9D3E0' };
const ARMS_DOWN = { back: [-12, -70, -11, -56], front: [12, -70, 12, -56] };

/** A small hand-drawn interest tag. */
function Tag({ x, y, children, style, strong }) {
  const w = children.length * 7 + 14;
  const l = x - w / 2;
  const r = x + w / 2;
  return (
    <g style={style}>
      <path
        d={`M${l + 3} ${y - 10} L${r - 2} ${y - 10.6} Q${r + 1.5} ${y - 10} ${r + 1} ${y - 4} L${r} ${y + 2} Q${r - 1} ${y + 5.6} ${r - 4} ${y + 5.4} L${l + 2} ${y + 6} Q${l - 1.4} ${y + 5.6} ${l - 1} ${y + 1} L${l} ${y - 6} Q${l} ${y - 9.6} ${l + 3} ${y - 10}Z`}
        fill={strong ? COBALT : PAPER}
        stroke={strong ? COBALT : NAVY}
        strokeWidth="1"
      />
      <text x={x} y={y + 1.5} textAnchor="middle" style={{ font: `700 14px ${HAND}`, fill: strong ? PAPER : NAVY, letterSpacing: '0.02em' }}>
        {children}
      </text>
    </g>
  );
}

/* ---------------------------------------------------------------- scene */

// People on campus the student hasn't met: they stay in pencil.
/** Office clothes for the hiring scene: a white shirt, a tie and lapels over the jacket. */
const Suit = () => (
  <g>
    <path d="M-4 -91 L0.5 -80 L5 -91Z" fill={PAPER} stroke={NAVY} strokeWidth="0.7" />
    <path d="M0.5 -88 l-1.8 2.4 l1.8 11 l1.8 -11z" fill={COBALT} stroke={NAVY} strokeWidth="0.6" />
    <path d="M-4 -91 L-1 -78 M5 -91 L2.5 -78" stroke={NAVY} strokeWidth="0.9" fill="none" />
  </g>
);

const CROWD = [
  { at: [112, 346, 0.66], dir: 1, look: { hair: 'short' } },
  { at: [236, 342, 0.64], dir: -1, look: { hair: 'bun' } },
  { at: [478, 344, 0.65], dir: 1, look: { hair: 'curly' } },
  { at: [606, 346, 0.66], dir: -1, look: { hair: 'long' } },
  { at: [70, 392, 0.8], dir: 1, look: { hair: 'short' } },
  { at: [640, 394, 0.8], dir: -1, look: { hair: 'bun' } },
];

// The three who share the student's interests: where they stand, their tag, and their
// spot once the circle forms.
const MATCHES = [
  {
    tag: 'coding', tagAt: [176, 268], from: [176, 390, 0.82], to: [318, 372, 0.84], dir: 1, glow: 4.2,
    look: { skin: '#C98E63', shirt: CYAN, hair: 'short', pack: COBALT, back: [8, -72, 14, -73], front: [16, -70, 30, -74], prop: <HeldLaptop /> },
  },
  {
    tag: 'design', tagAt: [470, 262], from: [452, 388, 0.82], to: [386, 372, 0.84], dir: -1, glow: 4.6,
    look: { skin: '#F1D3B5', shirt: COBALT, hair: 'long', hairColor: '#6B3E26', back: [6, -72, 12, -86], front: [16, -72, 22, -80], prop: <Sketchpad /> },
  },
  {
    tag: 'startups', tagAt: [556, 272], from: [556, 392, 0.82], to: [446, 392, 0.92], dir: -1, glow: 5.0,
    look: { skin: '#8C5A3B', shirt: PAPER, hair: 'bun', hairColor: '#1A1210', glasses: true, back: [8, -72, 14, -76], front: [16, -70, 26, -76], prop: <Book /> },
  },
];

const CAPTIONS = [
  ['your campus is full of people you haven’t met', 0.2, 3.4],
  ['CollZap finds the ones who share your interests', 3.8, 6.4],
  ['they become your circle', 6.8, 8.8],
  ['you try things and build together', 9.2, 11.3],
  ['who you meet shapes what you experience', 11.7, 13.4],
  ['what you build together gets you hired', 13.9, 16.8],
];

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

  // The circle forms at 6.4–7.8 and loosens back into the crowd at 12.8–13.9.
  const gather = (from, to) => travel(from, to, 6.4, 1.4, 12.8, 1.1);
  const scene = (a) => show(a, 0.5, 12.6, 0.6);
  // The phone is in hand except while they build.
  const phoneOut = { opacity: `calc(1 - ${inP(8.6, 0.3)} + ${inP(12.6, 0.3)})` };

  return (
    <svg
      ref={svgRef}
      viewBox="0 70 680 352"
      className={className}
      style={{ '--t': STILL }}
      role="img"
      aria-label="Hand-drawn animation of CollZap: a campus full of students you haven't met. One student joins CollZap, verified to their college, and the students who share their interests in coding, design and startups stand out from the crowd. They gather into a circle, tick off a daily task and build a project together around a table while a small plant grows. Who you meet shapes what you experience: finally the student, now in a suit, shakes hands with a recruiter from a hiring company."
    >
      <defs>
        <filter id={boil} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence ref={noiseRef} type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" />
          <feDisplacementMap in="SourceGraphic" scale="1.1" />
        </filter>
      </defs>

      {/* One handwritten line at a time says what is happening. */}
      {CAPTIONS.map(([line, a, b]) => (
        <text key={line} x="340" y="100" textAnchor="middle" style={{ ...show(a, 0.4, b, 0.4), font: `600 22px ${HAND}`, fill: NAVY }}>
          {line}
        </text>
      ))}

      <g filter={`url(#${boil})`}>
        {/* Campus in the background: library, clock tower, a teaching block, trees */}
        <g {...ink} strokeWidth="1" opacity="0.32">
          <path d="M40 300 V214 h120 v86 M34 214 l66 -28 l66 28z M58 222 v70 M80 222 v70 M120 222 v70 M142 222 v70 M90 300 v-30 h20 v30" />
          <path d="M290 300 V150 h44 v150 M284 150 l28 -26 l28 26 M302 172 c0 -6 4 -10 10 -10 c6 0 10 4 10 10 c0 6 -4 10 -10 10 c-6 0 -10 -4 -10 -10z M312 166 v6 l4 3" />
          <path d="M380 300 V196 h170 v104 M396 212 h22 v18 h-22z M436 212 h22 v18 h-22z M476 212 h22 v18 h-22z M516 212 h22 v18 h-22z M396 246 h22 v18 h-22z M436 246 h22 v18 h-22z M476 246 h22 v18 h-22z M516 246 h22 v18 h-22z" />
          <path d="M600 300 v-36 c-18 2 -24 -22 -8 -30 c-2 -18 24 -22 28 -6 c16 2 14 30 -6 32 c-4 4 -10 4 -14 4 M200 300 v-26 c-14 0 -18 -18 -6 -24 c0 -14 20 -16 22 -4 c12 2 10 24 -6 26" />
        </g>
        <path d="M14 396 C140 393 260 397 380 395 S560 394 666 396" {...ink} strokeWidth="1.1" opacity="0.55" />

        {CROWD.map(({ at: [x, y, k], dir, look }, i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${dir * k} ${k})`} opacity="0.5">
            <Student {...look} {...GHOST} {...ARMS_DOWN} />
          </g>
        ))}

        {/* The table their circle builds around: legs behind people, top in front */}
        <g style={scene(7.6)}>
          <path d="M292 396 L290 348 M418 396 L420 346" {...ink} />
        </g>

        {/* The people who share the student's interests: pencil, then colour, then they gather */}
        {MATCHES.map(({ from, to, dir, look, glow }) => (
          <g key={glow} style={gather(from, to)}>
            <g transform={`scale(${dir} 1)`}>
              <g opacity="0.5">
                <Student {...look} {...GHOST} {...ARMS_DOWN} prop={null} pack={look.pack && GHOST.pants} />
              </g>
              <g style={show(glow, 0.5, 12.8, 0.8)}>
                <Student {...look} />
              </g>
            </g>
          </g>
        ))}

        {/* The student: joins, is verified, finds their people, then builds with them */}
        <g style={gather([332, 394, 0.92], [258, 396, 0.94])}>
          <g style={{ opacity: `calc(1 - ${inP(13.9, 0.4)} + ${inP(17.1, 0.5)})` }}>
          <Student
            skin="#E3B48E"
            shirt={YELLOW}
            hair="curly"
            hairColor="#1F1512"
            pack={COBALT}
            back={[-12, -70, -9, -58]}
            front={[14, -76, 18, -86]}
            frontStyle={phoneOut}
            alt={{ front: [22, -82, 42, -84], style: show(8.6, 0.3, 12.6, 0.3) }}
            prop={
              <g style={phoneOut}>
                <Phone
                  screen={
                    <path pathLength={1} d="M16.8 -91.5 l1.6 1.8 l3 -3.6" fill="none" stroke={COBALT} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" style={draw(1.6, 0.4, 6.4, 0.4)} />
                  }
                />
              </g>
            }
          />
          </g>
        </g>

        {/* ---- Hired: the student, now in a suit, shakes hands with a company ---- */}
        {/* a few pen strokes around them while they change */}
        {[
          ['M300 300 c-8 10 -8 30 0 44', 13.8],
          ['M364 300 c8 10 8 30 0 44', 13.9],
          ['M318 282 c8 -6 20 -6 28 0', 14.0],
        ].map(([d, a]) => (
          <path key={a} pathLength={1} d={d} fill="none" stroke={COBALT} strokeWidth="1.3" strokeLinecap="round" style={draw(a, 0.3, 14.4, 0.3)} />
        ))}
        <g style={show(13.9, 0.4, 16.9, 0.5)}>
          <g transform="translate(332 394) scale(0.92)">
            <Student
              skin="#E3B48E"
              shirt="#22365C"
              pants="#22365C"
              hair="curly"
              hairColor="#1F1512"
              back={[-12, -70, -11, -56]}
              front={[12, -70, 12, -56]}
              frontStyle={{ opacity: `calc(1 - ${inP(14.8, 0.3)} + ${inP(16.3, 0.3)})` }}
              alt={{ front: [22, -78, 40, -72], style: show(14.8, 0.3, 16.3, 0.3) }}
              prop={<Suit />}
            />
          </g>
        </g>
        {/* the company: a recruiter and their hiring sign */}
        <g style={show(14.2, 0.5, 16.8, 0.5)}>
          <path d="M470 394 L482 342 L494 394 M476 368 h12" {...ink} />
          <path d="M458 338 l50 -3 l2 30 l-50 3z" fill={PAPER} stroke={NAVY} strokeWidth="1.1" />
          <path d="M466 346 h10 v12 h-10z M469 349 h1.5 M472.5 349 h1.5 M469 353 h1.5 M472.5 353 h1.5" fill="none" stroke={COBALT} strokeWidth="0.9" />
          <text x="480" y="352" style={{ font: `700 10px ${HAND}`, fill: NAVY }} transform="rotate(-3 480 352)">we&rsquo;re</text>
          <text x="480" y="362" style={{ font: `700 10px ${HAND}`, fill: COBALT }} transform="rotate(-3 480 362)">hiring</text>
          <g transform="translate(410 394) scale(-0.92 0.92)">
            <Student
              skin="#C98E63"
              shirt="#3A4B6B"
              pants="#22365C"
              hair="short"
              hairColor="#7A7F8A"
              glasses
              back={[-12, -70, -11, -56]}
              front={[12, -70, 12, -56]}
              frontStyle={{ opacity: `calc(1 - ${inP(14.8, 0.3)} + ${inP(16.3, 0.3)})` }}
              alt={{ front: [22, -78, 40, -72], style: show(14.8, 0.3, 16.3, 0.3) }}
              prop={<Suit />}
            />
          </g>
        </g>
        <Tag x={372} y={266} strong style={show(15.2, 0.4, 16.8, 0.5)}>✓ you&rsquo;re hired!</Tag>
        <path pathLength={1} d="M356 314 c4 -3 7 -3 10 0 M374 314 c3 -3 6 -3 9 0" fill="none" stroke={YELLOW} strokeWidth="1.4" strokeLinecap="round" style={draw(15.0, 0.3, 16.8, 0.5)} />

        {/* Verified: same campus */}
        <Tag x={334} y={232} strong style={show(1.8, 0.4, 3.5, 0.4)}>✓ verified · same campus</Tag>

        {/* Interests: the student's tags, and the same tags on the people who share them */}
        {[
          ['coding', 284, 266, 3.8],
          ['design', 344, 250, 4.0],
          ['startups', 384, 284, 4.2],
        ].map(([word, x, y, a]) => (
          <Tag key={word} x={x} y={y} style={show(a, 0.3, 6.2, 0.4)}>{word}</Tag>
        ))}
        {MATCHES.map(({ tag, tagAt: [x, y], glow }) => (
          <Tag key={tag} x={x} y={y} strong style={show(glow, 0.3, 6.2, 0.4)}>{tag}</Tag>
        ))}
        {[
          ['M258 268 C236 260 214 260 202 264', 4.2],
          ['M370 246 C400 238 424 246 440 256', 4.6],
          ['M422 284 C462 296 504 292 522 280', 5.0],
        ].map(([d, a]) => (
          <path key={a} pathLength={1} d={d} fill="none" stroke={COBALT} strokeWidth="1.3" strokeLinecap="round" style={draw(a, 0.5, 6.0, 0.5)} />
        ))}

        {/* Your circle: one ring drawn around them */}
        <path
          pathLength={1}
          d="M212 330 C206 268 278 222 352 222 C428 222 496 262 498 320 C500 384 430 414 352 414 C276 414 214 388 214 336 C214 322 220 310 228 302"
          fill="none"
          stroke={COBALT}
          strokeWidth="1.6"
          strokeLinecap="round"
          style={draw(7.2, 1.0, 12.4, 0.6)}
        />
        <text x="500" y="244" style={{ ...show(8.0, 0.4, 12.4, 0.6), font: `700 18px ${HAND}`, fill: COBALT }}>your circle</text>

        {/* The table top, and what they make on it */}
        <path d="M292 340 L418 338 L428 350 L282 352Z" fill={PAPER} stroke={NAVY} strokeWidth="1.3" strokeLinejoin="round" style={scene(7.6)} />
        <g style={scene(8.2)}>
          {/* laptop */}
          <path d="M326 342 L374 340 L380 345 L320 347Z" fill="#C9D6EA" stroke={NAVY} strokeWidth="1" />
          <path d="M328 341 L331 310 L373 307 L373 339Z" fill="#E8F0FB" stroke={NAVY} strokeWidth="1.1" />
          {/* today's task card */}
          <path d="M294 339 l24 -2 l-1.2 -28 l-24 2z" fill="#FFF4CF" stroke={NAVY} strokeWidth="1" />
          <text x="296" y="318" transform="rotate(-5 296 318)" style={{ font: `700 9px ${HAND}`, fill: NAVY }}>today</text>
          {/* plant pot */}
          <path d="M396 338 l14 -.4 l-2 -10 h-10z" fill={CARD} stroke={NAVY} strokeWidth="1" />
        </g>
        {/* the build on screen, piece by piece */}
        {[
          ['M335 315 l18 -1.4', 8.8],
          ['M335 321 l30 -2.2', 9.3],
          ['M335 327 l22 -1.6', 9.8],
        ].map(([d, a]) => (
          <path key={a} pathLength={1} d={d} fill="none" stroke={COBALT} strokeWidth="1.6" strokeLinecap="round" style={draw(a, 0.4, 12.6, 0.6)} />
        ))}
        <path pathLength={1} d="M358 332 l3 3 l6 -7" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={draw(10.4, 0.4, 12.6, 0.6)} />
        {/* the day's task gets ticked off */}
        {[
          ['M298 326 l2 2 l4 -5', 9.0],
          ['M298.6 333 l2 2 l4 -5', 9.7],
        ].map(([d, a]) => (
          <path key={a} pathLength={1} d={d} fill="none" stroke={COBALT} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={draw(a, 0.3, 12.6, 0.6)} />
        ))}
        {/* growth: a sprout that becomes a flower */}
        <path pathLength={1} d="M403 328 C402 318 405 310 403 298" fill="none" stroke="#2E8B57" strokeWidth="1.6" strokeLinecap="round" style={draw(9.2, 1.4, 12.6, 0.6)} />
        <path d="M403 316 c-6 -1 -9 -6 -9 -9 c5 0 9 3 9 9z" fill="#5DB37E" stroke={NAVY} strokeWidth="0.8" style={show(9.9, 0.4, 12.6, 0.6)} />
        <path d="M403.5 309 c6 -1 9 -6 9 -9 c-5 0 -9 3 -9 9z" fill="#5DB37E" stroke={NAVY} strokeWidth="0.8" style={show(10.4, 0.4, 12.6, 0.6)} />
        <path
          d="M403 298 c-3 -6 -1 -9 0 -10 c1 1 3 4 0 10z M403 298 c5 -4 9 -3 10 -2 c-1 1 -4 3 -10 2z M403 298 c4 4 4 8 3 9 c-1 0 -3 -3 -3 -9z M403 298 c-4 4 -8 4 -9 3 c0 -1 3 -3 9 -3z M403 298 c-6 -2 -8 -5 -8 -7 c2 0 5 2 8 7z"
          fill={YELLOW}
          stroke={NAVY}
          strokeWidth="0.7"
          style={show(11.0, 0.5, 12.6, 0.6)}
        />
      </g>
    </svg>
  );
}
