import { useId } from 'react';

// The hero sketch, drawn like an architect's isometric: a campus on a survey
// grid, a paved walk to the college door, and five students on milestone
// blocks — each engraved with a level — holding hands as they climb. Shaded
// faces are hatched, not tinted. All colours are hero tokens, so it flips with
// dark mode.

const C = {
  ink: 'rgb(var(--h-ink))',
  surface: 'rgb(var(--h-surface))',
  shade: 'rgb(var(--h-ink) / 0.06)',
  grid: 'rgb(var(--h-ink) / 0.09)',
  skeleton: 'rgb(var(--h-ink) / 0.13)',
  mute: 'rgb(var(--h-ink) / 0.55)',
  accent: 'rgb(var(--h-accent))',
  accentSoft: 'rgb(var(--h-accent) / 0.26)',
  foliage: 'rgb(var(--h-leaf) / 0.28)',
  onAccent: 'rgb(var(--h-on-accent))',
  hi: 'rgb(var(--h-hi))',
  skin: 'rgb(var(--h-surface))',
};

const O = { x: 300, y: 222 };
const P = (x, y, z = 0) => [O.x + (x - y) * 0.866, O.y + (x + y) * 0.5 - z];
const pts = (...ps) => ps.map((p) => P(...p).join(',')).join(' ');
const L = { stroke: C.ink, strokeWidth: 1.15, strokeLinejoin: 'round', strokeLinecap: 'round' };
// Text lying on a face where x runs along and z runs up (a y = const face).
const onFaceY = (x, y, z) => `translate(${P(x, y, z).join(' ')}) matrix(0.866 0.5 0 1 0 0)`;

function Box({ x, y, z = 0, dx, dy, dz, top = C.surface, hatch }) {
  const [x1, y1, z1] = [x + dx, y + dy, z + dz];
  const right = pts([x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]);
  return (
    <g {...L}>
      <polygon points={pts([x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1])} fill={C.surface} />
      <polygon points={right} fill={C.surface} />
      {hatch && <polygon points={right} fill={`url(#${hatch})`} stroke="none" />}
      <polygon points={pts([x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1])} fill={top} />
    </g>
  );
}

/* ------------------------------------------------------------- campus kit */

function Tree({ x, y, s = 1 }) {
  const [bx, by] = P(x, y);
  return (
    <g transform={`translate(${bx} ${by}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="13" ry="5" fill={C.shade} />
      <path d="M0 0 V-16" {...L} strokeWidth="2" />
      <circle cx="-6" cy="-22" r="9" fill={C.foliage} {...L} />
      <circle cx="6" cy="-24" r="9.5" fill={C.foliage} {...L} />
      <circle cx="0" cy="-33" r="10" fill={C.foliage} {...L} />
      <path d="M-3 -30 q3 -3 6 0 M2 -22 q3 -2 5 1" fill="none" {...L} strokeWidth="0.8" opacity="0.6" />
    </g>
  );
}

function Lamp({ x, y }) {
  const [bx, by] = P(x, y);
  return (
    <g>
      <ellipse cx={bx} cy={by} rx="4" ry="1.6" fill={C.shade} />
      <path d={`M${bx} ${by} V${by - 40}`} {...L} strokeWidth="1.4" />
      <path d={`M${bx - 4} ${by - 40} h8 l-2 -6 h-4 Z`} fill={C.hi} {...L} strokeWidth="1" />
    </g>
  );
}

function College({ hatch }) {
  const fx = (x, z, w = 10, h = 14) => (
    <g key={`f${x}-${z}`}>
      <polygon points={pts([x, -70, z], [x + w, -70, z], [x + w, -70, z + h], [x, -70, z + h])} fill={C.surface} {...L} strokeWidth="0.9" />
      <path d={`M${P(x + w / 2, -70, z).join(' ')} L${P(x + w / 2, -70, z + h).join(' ')} M${P(x, -70, z + h / 2).join(' ')} L${P(x + w, -70, z + h / 2).join(' ')}`} {...L} strokeWidth="0.6" />
    </g>
  );
  const sx = (y, z, w = 10, h = 14) => (
    <g key={`s${y}-${z}`}>
      <polygon points={pts([270, y, z], [270, y + w, z], [270, y + w, z + h], [270, y, z + h])} fill={C.surface} {...L} strokeWidth="0.9" />
      <path d={`M${P(270, y + w / 2, z).join(' ')} L${P(270, y + w / 2, z + h).join(' ')}`} {...L} strokeWidth="0.6" />
    </g>
  );
  const clock = P(205, -85, 128);
  return (
    <g>
      {/* Hall */}
      <Box x={140} y={-130} dx={130} dy={60} dz={70} hatch={hatch} />
      {/* Cornice band */}
      <Box x={138} y={-132} z={70} dx={134} dy={64} dz={4} hatch={hatch} />
      {[150, 168, 236, 254].flatMap((x) => [fx(x, 40), fx(x, 14)])}
      {[-122, -104, -86].flatMap((y) => [sx(y, 40), sx(y, 14)])}
      {/* Roof */}
      <polygon points={pts([138, -132, 74], [205, -132, 98], [205, -68, 98], [138, -68, 74])} fill={C.surface} {...L} />
      <polygon points={pts([205, -132, 98], [272, -132, 74], [272, -68, 74], [205, -68, 98])} fill={`url(#${hatch})`} {...L} />
      <polygon points={pts([138, -68, 74], [272, -68, 74], [205, -68, 98])} fill={C.surface} {...L} />
      <circle cx={P(205, -68, 84)[0]} cy={P(205, -68, 84)[1]} r="4" fill="none" {...L} strokeWidth="0.9" />
      {/* Portico: steps, columns, pediment */}
      {[0, 1, 2].map((i) => (
        <Box key={`st${i}`} x={182 - i * 4} y={-70 + i * 0} z={0} dx={46 + i * 8} dy={8 + (2 - i) * 0 + i * 5} dz={(3 - i) * 3} />
      ))}
      <Box x={184} y={-66} z={9} dx={42} dy={10} dz={2} />
      {[187, 199, 211, 223].map((x) => (
        <Box key={`c${x}`} x={x} y={-61} z={11} dx={3} dy={3} dz={40} />
      ))}
      <Box x={182} y={-68} z={51} dx={46} dy={12} dz={4} hatch={hatch} />
      <polygon points={pts([182, -56, 55], [228, -56, 55], [205, -56, 68])} fill={C.surface} {...L} />
      <polygon points={pts([200, -70, 9], [210, -70, 9], [210, -70, 34], [200, -70, 34])} fill={C.shade} {...L} />
      {/* Tower */}
      <Box x={190} y={-104} z={92} dx={30} dy={30} dz={46} hatch={hatch} />
      <circle cx={clock[0]} cy={clock[1]} r="6.5" fill={C.surface} {...L} />
      <path d={`M${clock[0]} ${clock[1]} l0 -4.5 M${clock[0]} ${clock[1]} l3.5 1.5`} {...L} strokeWidth="0.9" />
      <Box x={188} y={-106} z={138} dx={34} dy={34} dz={3} hatch={hatch} />
      <polygon points={pts([188, -72, 141], [222, -72, 141], [205, -89, 172])} fill={C.surface} {...L} />
      <polygon points={pts([222, -106, 141], [222, -72, 141], [205, -89, 172])} fill={`url(#${hatch})`} {...L} />
      <path d={`M${P(205, -89, 172).join(' ')} l0 -10`} {...L} />
    </g>
  );
}

/* ----------------------------------------------------- students & blocks */

const LEVELS = ['Seed', 'Sprout', 'Growing', 'Thriving', 'Peak'];
const COUNT = LEVELS.length;
const REACHED = 3;
const block = (i) => ({ x: i * 30, y: 196 - i * 46, dx: 36, dy: 36, dz: 12 + i * 14 });

const PEOPLE = [
  { shirt: C.accent, hair: 'short', pack: true },
  { shirt: C.hi, hair: 'long' },
  { shirt: C.surface, hair: 'bun', pack: true },
  { shirt: C.accentSoft, hair: 'short' },
  { shirt: C.hi, hair: 'long' },
];

function Person({ at, p }) {
  const [x, y] = at;
  const hair = {
    short: `M${x - 4.6} ${y - 50} a4.6 4.6 0 0 1 9.2 0 q-2 -1.5 -4.6 -1.5 t-4.6 1.5 Z`,
    long: `M${x - 5} ${y - 49} a5 5 0 0 1 10 0 v6 q-1 1 -2 0 v-5 h-6 v5 q-1 1 -2 0 Z`,
    bun: `M${x - 4.6} ${y - 50} a4.6 4.6 0 0 1 9.2 0 Z M${x + 2} ${y - 56} a2.6 2.6 0 1 1 0.1 0`,
  }[p.hair];
  return (
    <g>
      <ellipse cx={x} cy={y} rx="9" ry="3.5" fill={C.shade} />
      {/* legs and shoes */}
      <path d={`M${x - 2.6} ${y - 1} L${x - 2.2} ${y - 20} M${x + 2.6} ${y - 1} L${x + 2.2} ${y - 20}`} stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M${x - 4.8} ${y} h4 M${x + 0.8} ${y} h4`} stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" />
      {p.pack && <rect x={x - 9} y={y - 38} width="5" height="13" rx="2" fill={C.surface} {...L} />}
      {/* torso */}
      <path d={`M${x - 6.5} ${y - 19} L${x - 7} ${y - 36} Q${x} ${y - 40} ${x + 7} ${y - 36} L${x + 6.5} ${y - 19} Z`} fill={p.shirt} {...L} />
      <path d={`M${x - 1.6} ${y - 39} v3 h3.2 v-3`} fill={C.skin} {...L} strokeWidth="0.9" />
      {/* head */}
      <circle cx={x} cy={y - 45} r="4.8" fill={C.skin} {...L} />
      <path d={hair} fill={C.ink} />
    </g>
  );
}

/** An arm in two segments, bending at the elbow toward a hand point. */
function arm(from, to, bendDown = 1) {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2 + 6 * bendDown;
  return `M${from[0]} ${from[1]} L${mx} ${my} L${to[0]} ${to[1]}`;
}

/* --------------------------------------------------------------- the card */

const PLANE = 'matrix(0.866 0.5 0 1 0 0)';
const font = (w, s, fill = C.ink) => ({ font: `${w} ${s}px Inter, system-ui, sans-serif`, fill });

export default function TogetherSketch({ className }) {
  const hatch = `h${useId().replace(/:/g, '')}`;

  const feet = Array.from({ length: COUNT }, (_, i) => {
    const b = block(i);
    return P(b.x + b.dx / 2, b.y + b.dy / 2, b.dz + 3);
  });
  const shoulderL = ([x, y]) => [x - 6.5, y - 35];
  const shoulderR = ([x, y]) => [x + 6.5, y - 35];
  const hands = feet.slice(0, -1).map((f, i) => {
    const a = shoulderR(f);
    const b = shoulderL(feet[i + 1]);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 9];
  });
  const top = feet[COUNT - 1];
  const raised = [top[0] + 13, top[1] - 62];

  return (
    <svg
      viewBox="0 0 680 560"
      className={className}
      role="img"
      aria-label="Isometric sketch of a college campus: five students on milestone blocks labelled Seed to Peak, holding hands as they climb toward the college, with trees, a lamp post, a bench and a walkway — plus cards for their circle, their potential and a Friday mentor session, and a Verified student tag."
    >
      <defs>
        <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <path d="M0 0 V4" stroke="rgb(var(--h-ink) / 0.22)" strokeWidth="0.8" />
        </pattern>
      </defs>

      {/* Survey grid */}
      <g stroke={C.grid} strokeWidth="1">
        {Array.from({ length: 11 }, (_, i) => -80 + i * 40).map((x) => (
          <path key={`gx${x}`} d={`M${P(x, -170).join(' ')} L${P(x, 270).join(' ')}`} />
        ))}
        {Array.from({ length: 12 }, (_, i) => -170 + i * 40).map((y) => (
          <path key={`gy${y}`} d={`M${P(-80, y).join(' ')} L${P(320, y).join(' ')}`} />
        ))}
      </g>
      <polygon points={pts([-80, -170], [320, -170], [320, 270], [-80, 270])} fill="none" {...L} opacity="0.35" />

      {/* Paved walk to the door */}
      <polygon points={pts([196, -52], [214, -52], [214, 60], [196, 60])} fill={C.surface} {...L} opacity="0.9" />
      <g {...L} strokeWidth="0.7" opacity="0.5">
        {Array.from({ length: 9 }, (_, i) => -40 + i * 12).map((y) => (
          <path key={`pv${y}`} d={`M${P(196, y).join(' ')} L${P(214, y).join(' ')}`} />
        ))}
      </g>

      <Tree x={70} y={-150} s={1.1} />
      <Tree x={110} y={-170} s={0.9} />
      <College hatch={hatch} />
      <Lamp x={186} y={40} />
      <Lamp x={226} y={-10} />

      {/* Milestone blocks, back to front, engraved with their level */}
      {Array.from({ length: COUNT }, (_, k) => COUNT - 1 - k).map((i) => {
        const b = block(i);
        return (
          <g key={i}>
            <Box {...b} hatch={hatch} />
            <Box x={b.x + 3} y={b.y + 3} z={b.dz} dx={b.dx - 6} dy={b.dy - 6} dz={3} top={i < REACHED ? C.accentSoft : C.surface} />
            <text transform={onFaceY(b.x + 4, b.y + b.dy, b.dz - 11)} style={font(600, 7, C.mute)}>
              {String(i + 1).padStart(2, '0')} · {LEVELS[i].toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Arms behind the bodies */}
      <g fill="none" stroke={C.ink} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        {feet.map((f, i) => (
          <g key={i}>
            <path d={arm(shoulderL(f), i === 0 ? [f[0] - 10, f[1] - 17] : hands[i - 1])} />
            <path d={arm(shoulderR(f), i === COUNT - 1 ? raised : hands[i], i === COUNT - 1 ? -0.4 : 1)} />
          </g>
        ))}
      </g>
      {feet.map((f, i) => <Person key={i} at={f} p={PEOPLE[i]} />)}
      {hands.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill={C.skin} {...L} />
      ))}
      {/* Flag in the raised hand */}
      <path d={`M${raised[0]} ${raised[1] + 4} V${raised[1] - 26}`} {...L} strokeWidth="1.4" />
      <path d={`M${raised[0]} ${raised[1] - 26} q11 -3 22 3 q-11 3 -22 11 Z`} fill={C.hi} {...L} />

      <Tree x={-30} y={250} s={1.15} />

      {/* Your circle */}
      <g className="iso-float">
        <g transform={`translate(14 20) ${PLANE}`}>
          <rect width="200" height="116" rx="12" fill={C.surface} {...L} />
          <text x="14" y="24" style={font(600, 12)}>Your circle</text>
          <text x="186" y="24" textAnchor="end" style={font(500, 9, C.mute)}>same campus</text>
          <path d="M14 34 H186" {...L} strokeWidth="0.7" opacity="0.3" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <circle cx={24 + i * 17} cy="54" r="9" fill={i % 2 ? C.accentSoft : C.surface} stroke={C.ink} strokeWidth="1" />
              <circle cx={24 + i * 17} cy="51.5" r="3" fill={C.ink} />
              <path d={`M${19 + i * 17} 60.5 a5 4 0 0 1 10 0`} fill={C.ink} />
            </g>
          ))}
          <text x="114" y="51" style={font(600, 9)}>Coding</text>
          <text x="114" y="62" style={font(500, 8, C.mute)}>1-on-1 + group</text>
          <rect x="14" y="76" width="172" height="5" rx="2.5" fill={C.skeleton} />
          <rect x="14" y="76" width="104" height="5" rx="2.5" fill={C.accent} />
          <text x="14" y="98" style={font(500, 8.5, C.mute)}>Circle streak · 4 days</text>
          <rect x="132" y="88" width="54" height="16" rx="8" fill={C.accent} />
          <text x="159" y="99" textAnchor="middle" style={font(600, 8, C.onAccent)}>Message</text>
        </g>
      </g>

      {/* Friday session chip */}
      <g className="iso-float" style={{ animationDelay: '0.9s' }}>
        <g transform={`translate(586 156) ${PLANE}`}>
          <rect width="84" height="36" rx="8" fill={C.surface} {...L} />
          <circle cx="16" cy="18" r="8" fill={C.accent} />
          <path d="M14 14 l6 4 l-6 4 Z" fill={C.onAccent} />
          <text x="30" y="16" style={font(600, 8.5)}>Friday session</text>
          <text x="30" y="27" style={font(700, 7.5, C.accent)}>LIVE · +30 pts</text>
        </g>
      </g>

      {/* Your potential */}
      <g className="iso-float" style={{ animationDelay: '1.8s' }}>
        <g transform={`translate(468 338) ${PLANE}`}>
          <rect width="170" height="104" rx="12" fill={C.surface} {...L} />
          <text x="14" y="24" style={font(600, 12)}>Your potential</text>
          <text x="156" y="24" textAnchor="end" style={font(700, 12, C.accent)}>38%</text>
          <text x="14" y="40" style={font(500, 9, C.mute)}>Level 3 · Growing</text>
          <rect x="14" y="50" width="142" height="6" rx="3" fill={C.skeleton} />
          <rect x="14" y="50" width="54" height="6" rx="3" fill={C.accent} />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <path d={`M${20 + i * 26} 70 v14`} stroke={C.ink} strokeWidth="0.7" opacity="0.3" />
              <circle cx={20 + i * 26} cy="77" r="3.6" fill={i < 3 ? C.accent : C.surface} stroke={C.ink} strokeWidth="1" />
            </g>
          ))}
          <text x="14" y="98" style={font(500, 7.5, C.mute)}>Seed</text>
          <text x="156" y="98" textAnchor="end" style={font(500, 7.5, C.mute)}>Realized</text>
        </g>
      </g>

      {/* Verified student */}
      <g transform={`translate(22 392) ${PLANE}`}>
        <rect width="128" height="22" rx="4" fill={C.ink} />
        <path d="M11 11.5 l3.5 3.5 l6.5 -7" fill="none" stroke={C.surface} strokeWidth="1.8" strokeLinecap="round" />
        <text x="27" y="15.5" style={font(700, 9.5, C.surface)}>VERIFIED STUDENT</text>
      </g>
    </svg>
  );
}
