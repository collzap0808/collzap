import { useId } from 'react';

// One story along one walk, numbered to match the hero line: 01 a new student
// discovers people (their phone matches them), 02 finds their circle at a
// shared table, 03 tries things (the notice board), 04 builds together and
// shows the work. Every object serves that sequence. Fixed palette (the hero
// never follows the app theme); mostly line and white.

const NAVY = '#17345A';
const SOFT = '#7EA8D8';
const BLUE = '#168BFF';
const CYAN = '#18C6D0';
const WHITE = '#FFFFFF';
const IVORY = '#FAFAF7';
const TINT = '#E7F0FA';
const SCREEN = '#D3E6FB';
const SHADOW = 'rgba(23, 52, 90, 0.07)';

// World scale: the scene is drawn in world units and projected at S, and the
// figures (drawn in px) are scaled by the same S so they stay in proportion.
const S = 1.4;
const O = { x: 232, y: 150 };
const P = (x, y, z = 0) => [O.x + (x - y) * 0.866 * S, O.y + ((x + y) * 0.5 - z) * S];
const around = (x, y) => `translate(${x} ${y}) scale(${S}) translate(${-x} ${-y})`;
const pts = (...ps) => ps.map((p) => P(...p).map((n) => n.toFixed(1)).join(',')).join(' ');
const line = (w = 1.1) => ({ stroke: NAVY, strokeWidth: w, strokeLinejoin: 'round', strokeLinecap: 'round' });

function Box({ x, y, z = 0, dx, dy, dz, top = WHITE, front = WHITE, hatch, w = 1.1 }) {
  const [x1, y1, z1] = [x + dx, y + dy, z + dz];
  const right = pts([x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]);
  return (
    <g {...line(w)}>
      <polygon points={pts([x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1])} fill={front} />
      <polygon points={right} fill={WHITE} />
      {hatch && <polygon points={right} fill={`url(#${hatch})`} stroke="none" />}
      <polygon points={pts([x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1])} fill={top} />
    </g>
  );
}

/* ------------------------------------------------------------------ people */

function Head({ x, y, hair = 'short' }) {
  return (
    <g>
      <circle cx={x} cy={y} r="3.5" fill={WHITE} {...line(0.9)} />
      {hair === 'short' && <path d={`M${x - 3.5} ${y - 0.4} a3.5 3.5 0 0 1 7 0 q-1.6 -1 -3.5 -1 t-3.5 1 Z`} fill={NAVY} />}
      {hair === 'long' && <path d={`M${x - 3.8} ${y + 3} V${y - 0.4} a3.8 3.8 0 0 1 7.6 0 V${y + 3} q-0.8 0.6 -1.4 0 V${y} h-4.8 v3 q-0.6 0.6 -1.4 0 Z`} fill={NAVY} />}
      {hair === 'bun' && <path d={`M${x - 3.5} ${y - 0.4} a3.5 3.5 0 0 1 7 0 Z M${x + 1.6} ${y - 4.6} a1.9 1.9 0 1 1 0.1 0`} fill={NAVY} />}
    </g>
  );
}

/** Standing figure; `arms` picks a pose. Feet at world (x, y). */
function Standing({ at, shirt = WHITE, hair, pack, arms = 'down', facing = 1 }) {
  const [x, y] = P(...at);
  const sh = y - 25;
  const armPath = {
    down: `M${x - 5} ${sh + 1} L${x - 6} ${y - 13} M${x + 5} ${sh + 1} L${x + 6} ${y - 13}`,
    hold: `M${x - 5} ${sh + 1} L${x - 3} ${y - 15} L${x + 3 * facing} ${y - 18} M${x + 5} ${sh + 1} L${x + 6} ${y - 15} L${x + 4 * facing} ${y - 18}`,
    talk: `M${x - 5 * facing} ${sh + 1} L${x - 6 * facing} ${y - 13} M${x + 5 * facing} ${sh + 1} L${x + 9 * facing} ${y - 19} L${x + 12 * facing} ${y - 23}`,
    read: `M${x - 5} ${sh + 1} L${x - 4} ${y - 16} L${x} ${y - 20} M${x + 5} ${sh + 1} L${x + 4} ${y - 16} L${x} ${y - 20}`,
    // Both hands up to a phone — looking for people on CollZap.
    phone: `M${x - 5} ${sh + 1} L${x - 4} ${y - 15} L${x + 1} ${y - 19} M${x + 5} ${sh + 1} L${x + 5.5} ${y - 15} L${x + 3} ${y - 19}`,
  }[arms];
  return (
    <g transform={around(x, y)}>
      <ellipse cx={x} cy={y} rx="7" ry="2.6" fill={SHADOW} />
      <path d={`M${x - 2} ${y} L${x - 1.7} ${y - 13} M${x + 2} ${y} L${x + 1.7} ${y - 13}`} stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />
      {pack && <rect x={x + 3 * -facing - (facing > 0 ? 3 : 0)} y={sh + 2} width="4" height="10" rx="1.5" fill={TINT} {...line(0.8)} />}
      <path d={`M${x - 4.6} ${y - 12} L${x - 5} ${sh} Q${x} ${sh - 3} ${x + 5} ${sh} L${x + 4.6} ${y - 12} Z`} fill={shirt} {...line(0.9)} />
      <path d={armPath} fill="none" stroke={NAVY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {arms === 'phone' && (
        <g>
          <rect x={x - 1.2} y={y - 24} width="5.4" height="8" rx="1" fill={WHITE} stroke={NAVY} strokeWidth="0.7" />
          <rect x={x - 0.3} y={y - 22.8} width="3.6" height="5" rx="0.5" fill={BLUE} />
        </g>
      )}
      <Head x={x} y={sh - 6.5} hair={hair} />
    </g>
  );
}

/**
 * Seated figure on a stool, seen from behind-left, facing the table toward −y.
 * Hands reach to `reach` (a world point on the table top).
 */
function Seated({ at, seat = 9, shirt = WHITE, hair, reach, stool = true }) {
  const [wx, wy] = at;
  const hip = P(wx, wy, seat);
  const knee = P(wx, wy - 7, seat);
  const foot = P(wx, wy - 7, 0);
  const sh = [hip[0], hip[1] - 14 * S];
  const hand = reach ? P(...reach) : [sh[0] + 6, sh[1] + 6];
  return (
    <g>
      {stool && <Box x={wx - 3.5} y={wy - 3} dx={7} dy={6} dz={seat - 1} w={0.9} />}
      <path d={`M${hip[0]} ${hip[1]} L${knee[0]} ${knee[1]} L${foot[0]} ${foot[1]}`} fill="none" stroke={NAVY} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${hip[0] - 4.4 * S} ${hip[1]} L${sh[0] - 4.8 * S} ${sh[1] + 1} Q${sh[0]} ${sh[1] - 2.4 * S} ${sh[0] + 4.8 * S} ${sh[1] + 1} L${hip[0] + 4.4 * S} ${hip[1]} Z`} fill={shirt} {...line(0.9)} />
      <path d={`M${sh[0] + 3 * S} ${sh[1] + 2} L${(sh[0] + hand[0]) / 2 + 1} ${(sh[1] + hand[1]) / 2 + 4} L${hand[0]} ${hand[1]}`} fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <g transform={around(sh[0], sh[1] - 6 * S)}>
        <Head x={sh[0]} y={sh[1] - 6 * S} hair={hair} />
      </g>
    </g>
  );
}

function Laptop({ x, y, z }) {
  return (
    <g>
      <polygon points={pts([x, y, z], [x + 10, y, z], [x + 10, y + 7, z], [x, y + 7, z])} fill={WHITE} {...line(0.9)} />
      <polygon points={pts([x, y, z], [x + 10, y, z], [x + 10, y, z + 7], [x, y, z + 7])} fill={SCREEN} {...line(0.9)} />
    </g>
  );
}

function Table({ x, y, dx, dy, h = 14 }) {
  const legs = [[x + 2, y + dy - 2], [x + dx - 2, y + dy - 2], [x + dx - 2, y + 2]];
  return (
    <g>
      {legs.map(([lx, ly], i) => (
        <path key={i} d={`M${P(lx, ly, h).join(' ')} L${P(lx, ly, 0).join(' ')}`} {...line(1)} />
      ))}
      <Box x={x} y={y} z={h} dx={dx} dy={dy} dz={2} />
    </g>
  );
}

function Tree({ at, s = 1 }) {
  const [x, y] = P(...at);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * S})`}>
      <ellipse cx="0" cy="0" rx="11" ry="4" fill={SHADOW} />
      <path d="M0 0 V-14" {...line(1.6)} />
      <circle cx="0" cy="-24" r="11" fill={WHITE} {...line(1)} />
      <path d="M-6 -27 a7 7 0 0 1 9 -4" fill="none" stroke={SOFT} strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

/** A campus lamp post beside the walk. */
function Lamp({ at }) {
  const [x, y] = P(...at);
  const top = y - 30 * S;
  return (
    <g>
      <ellipse cx={x} cy={y} rx="4" ry="1.6" fill={SHADOW} />
      <path d={`M${x} ${y} V${top}`} {...line(1.2)} />
      <path d={`M${x - 4} ${top} h8 l-1.6 -5 h-4.8 Z`} fill={WHITE} {...line(0.9)} />
    </g>
  );
}

/** A takeaway cup on a table top. */
function Cup({ at }) {
  const [x, y] = P(...at);
  return (
    <g>
      <path d={`M${x - 2.6} ${y - 7} L${x - 2} ${y} H${x + 2} L${x + 2.6} ${y - 7} Z`} fill={WHITE} {...line(0.8)} />
      <ellipse cx={x} cy={y - 7} rx="2.6" ry="1" fill={WHITE} {...line(0.8)} />
    </g>
  );
}

/** A campus notice board with pinned cards: clubs, events, a hackathon. */
function NoticeBoard({ x, y }) {
  const card = (x0, x1, z0, z1, fill) => (
    <g>
      <polygon points={pts([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1])} fill={fill} stroke={NAVY} strokeWidth="0.6" />
      <circle cx={P((x0 + x1) / 2, y, z1 - 0.8)[0]} cy={P((x0 + x1) / 2, y, z1 - 0.8)[1]} r="0.9" fill={NAVY} />
    </g>
  );
  return (
    <g>
      <ellipse cx={P(x + 9, y)[0]} cy={P(x + 9, y)[1]} rx="14" ry="3" fill={SHADOW} />
      {[x + 1.5, x + 16.5].map((px) => (
        <path key={px} d={`M${P(px, y, 0).join(' ')} L${P(px, y, 8).join(' ')}`} {...line(1.2)} />
      ))}
      <polygon points={pts([x, y, 7], [x + 18, y, 7], [x + 18, y, 24], [x, y, 24])} fill={IVORY} {...line(1)} />
      {card(x + 1.5, x + 8, 16, 22.5, TINT)}
      {card(x + 9.5, x + 16.5, 17, 22.5, WHITE)}
      {card(x + 2.5, x + 10, 9, 14.5, SCREEN)}
      {card(x + 11, x + 16.5, 9.5, 15, WHITE)}
      <path d={`M${P(x + 3, y, 12).join(' ')} L${P(x + 8.5, y, 12).join(' ')}`} stroke={BLUE} strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

/** The phone finding people: a dashed arc from the new student to the pair at the table. */
function MatchArc({ from, to }) {
  const c = [(from[0] + to[0]) / 2 - 6, Math.max(from[1], to[1]) - 18];
  const mid = [(from[0] + 2 * c[0] + to[0]) / 4, (from[1] + 2 * c[1] + to[1]) / 4];
  return (
    <g>
      <path d={`M${from.join(' ')} Q${c.join(' ')} ${to.join(' ')}`} fill="none" stroke={BLUE} strokeWidth="1" strokeDasharray="3 4" strokeLinecap="round" opacity="0.8" />
      <circle cx={to[0]} cy={to[1]} r="2" fill={BLUE} />
      <g transform={`translate(${mid[0]} ${mid[1]})`}>
        <rect x="-34" y="-10" width="68" height="20" rx="10" fill={WHITE} stroke={BLUE} strokeWidth="1" />
        <circle cx="-22" cy="0" r="4.5" fill={CYAN} />
        <path d="M-24.2 0 l1.6 1.6 l3.2 -3.2" fill="none" stroke={WHITE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="-13" y="3.5" textLength="38" lengthAdjust="spacingAndGlyphs" style={{ font: '700 10px Inter, system-ui, sans-serif', fill: BLUE }}>MATCH</text>
      </g>
    </g>
  );
}

/** A small speech bubble with a lightbulb: an idea taking shape at the table. */
function Bubble({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-11 -9 h22 a3 3 0 0 1 3 3 v9 a3 3 0 0 1 -3 3 h-8 l-4 4 l-1 -4 h-9 a3 3 0 0 1 -3 -3 v-9 a3 3 0 0 1 3 -3 Z" fill={WHITE} {...line(0.9)} />
      <circle cx="0" cy="-2.5" r="3.4" fill="#FFE2A8" stroke={NAVY} strokeWidth="0.8" />
      <path d="M-1.4 1.6 h2.8 M-1 3.2 h2" stroke={NAVY} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}

/** Small editorial annotation: a dot, a leader, one or more spaced-caps lines. */
function Note({ from, dx, dy, lines, anchor = 'start', color = NAVY, step, under }) {
  const [fx, fy] = from;
  const [tx, ty] = [fx + dx, fy + dy];
  const ls = Array.isArray(lines) ? lines : [lines];
  return (
    <g>
      <circle cx={fx} cy={fy} r="2" fill={color} />
      <path d={`M${fx} ${fy} L${tx} ${ty}`} stroke={color} strokeWidth="0.7" opacity="0.5" />
      {ls.map((l, i) => (
        <text
          key={l}
          x={under ? tx : tx + (anchor === 'start' ? 4 : -4)}
          y={ty + (under ? 15 : 4) + i * 14.5}
          textAnchor={anchor}
          style={{
            font: `${i === 0 ? 700 : 600} ${i === 0 ? 12 : 9.6}px Inter, system-ui, sans-serif`,
            letterSpacing: '0.08em',
            fill: i === 0 ? color : '#4E6A8E',
          }}
        >
          {i === 0 && step && <tspan fill={SOFT}>{step}{'  '}</tspan>}
          {l}
        </text>
      ))}
    </g>
  );
}

/** A real paved walk: a smooth path through world points, with edges and a centre line. */
function Walkway({ through }) {
  // Catmull-Rom through the points, sampled in world space, then projected.
  const ext = [through[0], ...through, through[through.length - 1]];
  const out = [];
  for (let i = 1; i < ext.length - 2; i += 1) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    for (let k = 0; k < 10; k += 1) {
      const t = k / 10;
      const t2 = t * t;
      const t3 = t2 * t;
      const xy = [0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t
        + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
        + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3));
      out.push(P(xy[0], xy[1]).map((n) => n.toFixed(1)).join(' '));
    }
  }
  out.push(P(...through[through.length - 1]).map((n) => n.toFixed(1)).join(' '));
  const d = `M${out.join(' L')}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={NAVY} strokeOpacity="0.26" strokeWidth="17" />
      <path d={d} stroke={IVORY} strokeWidth="15.4" />
      <path d={d} stroke={SOFT} strokeWidth="1.1" strokeDasharray="4 5" />
    </g>
  );
}

/* ------------------------------------------------------------------ campus */

function University({ hatch }) {
  const bands = [12, 24, 36];
  return (
    <g>
      {/* Tall block behind */}
      <Box x={200} y={-100} dx={50} dy={50} dz={78} hatch={hatch} />
      {[16, 30, 44, 58].map((z) => (
        <path key={`t${z}`} d={`M${P(200, -50, z).join(' ')} L${P(250, -50, z).join(' ')}`} stroke={SOFT} strokeWidth="0.8" />
      ))}
      {[212, 225, 238].map((x) => (
        <path key={`tv${x}`} d={`M${P(x, -50, 8).join(' ')} L${P(x, -50, 70).join(' ')}`} stroke={SOFT} strokeWidth="0.6" opacity="0.8" />
      ))}
      {/* Tower window frames on the right face */}
      {[-92, -76, -60].flatMap((y) => [52, 66].map((z) => (
        <polygon key={`tw${y}-${z}`} points={pts([250, y, z], [250, y + 9, z], [250, y + 9, z + 9], [250, y, z + 9])} fill="none" stroke={NAVY} strokeWidth="0.55" opacity="0.5" />
      )))}
      {/* Long low block with glass bands */}
      <Box x={110} y={-70} dx={140} dy={50} dz={44} hatch={hatch} />
      {bands.map((z) => (
        <polygon
          key={`b${z}`}
          points={pts([116, -20, z - 7], [244, -20, z - 7], [244, -20, z], [116, -20, z])}
          fill={TINT}
          stroke={NAVY}
          strokeWidth="0.7"
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => 116 + i * 16).map((x) => (
        <path key={`m${x}`} d={`M${P(x, -20, 5).join(' ')} L${P(x, -20, 36).join(' ')}`} stroke={NAVY} strokeWidth="0.5" opacity="0.45" />
      ))}
      {[-62, -46, -30].map((y) => (
        <polygon key={`s${y}`} points={pts([250, y, 8], [250, y + 10, 8], [250, y + 10, 36], [250, y, 36])} fill="none" stroke={NAVY} strokeWidth="0.6" opacity="0.5" />
      ))}
      {/* Roof edge and rooftop unit */}
      <polygon points={pts([110, -70, 44], [250, -70, 44], [250, -20, 44], [110, -20, 44])} fill={IVORY} {...line(1.1)} />
      <Box x={130} y={-60} z={44} dx={22} dy={16} dz={6} w={0.8} />
      {/* Entrance: steps, framed glass doors, canopy */}
      <Box x={146} y={-20} dx={30} dy={8} dz={1.6} w={0.8} />
      <Box x={150} y={-20} z={1.6} dx={22} dy={4} dz={1.4} w={0.8} />
      <polygon points={pts([150, -20, 3], [172, -20, 3], [172, -20, 17], [150, -20, 17])} fill="none" {...line(1)} />
      <polygon points={pts([152, -20, 0], [170, -20, 0], [170, -20, 16], [152, -20, 16])} fill={SCREEN} {...line(0.9)} />
      <path d={`M${P(161, -20, 0).join(' ')} L${P(161, -20, 16).join(' ')}`} stroke={NAVY} strokeWidth="0.6" />
      <Box x={144} y={-20} z={18} dx={34} dy={12} dz={2} w={0.9} />
      {[[146, -9], [176, -9]].map(([px, py], i) => (
        <path key={`p${i}`} d={`M${P(px, py, 18).join(' ')} L${P(px, py, 0).join(' ')}`} {...line(0.9)} />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------- panel */

const CIRCLE = [
  { name: 'Aisha', tags: 'Design · Projects', hair: 'long' },
  { name: 'Rahul', tags: 'Coding · Projects', hair: 'short' },
  { name: 'Sara', tags: 'Research · Design', hair: 'bun' },
];

/** "These are people CollZap found for you" — names and interests, nothing else. */
function YourCircle({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="2" y="3" width="172" height="112" rx="10" fill={SHADOW} />
      <rect width="172" height="112" rx="10" fill={WHITE} stroke={NAVY} strokeWidth="1" />
      <text x="14" y="21" style={{ font: '700 8.5px Inter, system-ui, sans-serif', letterSpacing: '0.14em', fill: NAVY }}>YOUR CIRCLE</text>
      <path d="M14 29 H158" stroke={NAVY} strokeWidth="0.6" opacity="0.2" />
      {CIRCLE.map((p, i) => {
        const cy = 46 + i * 24;
        return (
          <g key={p.name}>
            <circle cx="25" cy={cy} r="9" fill={TINT} stroke={NAVY} strokeWidth="0.9" />
            <Head x={25} y={cy - 1.8} hair={p.hair} />
            <path d={`M19.5 ${cy + 6.5} a5.5 4 0 0 1 11 0`} fill={NAVY} />
            <circle cx="32" cy={cy + 6} r="2.2" fill={CYAN} stroke={WHITE} strokeWidth="1" />
            <text x="42" y={cy - 1} style={{ font: '600 9.5px Inter, system-ui, sans-serif', fill: NAVY }}>{p.name}</text>
            <text x="42" y={cy + 9} style={{ font: '500 8px Inter, system-ui, sans-serif', fill: '#5A7396' }}>{p.tags}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ----------------------------------------------------------------- the art */

export default function CampusHubSketch({ className }) {
  const hatch = `hub${useId().replace(/:/g, '')}`;

  return (
    <svg
      viewBox="0 62 680 370"
      className={className}
      role="img"
      aria-label="Isometric sketch of a student's story on campus: a new student uses their phone to discover people and gets matched with two students who share their interests in coding and design, passes a notice board of clubs, events and hackathons, and near the college a student presents a project they built together — with a Your Circle panel listing Aisha, Rahul and Sara."
    >
      <defs>
        <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <path d="M0 0 V4" stroke={SOFT} strokeWidth="0.7" opacity="0.7" />
        </pattern>
      </defs>

      {/* Courtyard */}
      <polygon points={pts([104, -20], [256, -20], [256, 44], [104, 44])} fill={IVORY} stroke={NAVY} strokeWidth="0.7" opacity="0.5" />

      {/* The one walk: new student → people → the campus door */}
      <Walkway through={[[-34, 150], [10, 118], [70, 74], [128, 44], [163, -6]]} />

      <Tree at={[60, -84]} s={0.95} />
      <Lamp at={[56, 74]} />
      <Lamp at={[112, 78]} />

      <University hatch={hatch} />

      {/* CONNECT — two students, one table */}
      <Table x={36} y={-4} dx={40} dy={22} />
      <Laptop x={42} y={1} z={16} />
      <polygon points={pts([60, 4, 16.2], [72, 4, 16.2], [72, 13, 16.2], [60, 13, 16.2])} fill={WHITE} stroke={NAVY} strokeWidth="0.7" />
      <path d={`M${P(62, 7, 16.4).join(' ')} L${P(69, 9, 16.4).join(' ')}`} stroke={BLUE} strokeWidth="1" strokeLinecap="round" />
      <Cup at={[40, 6, 16]} />
      <Cup at={[73, -1, 16]} />
      <Seated at={[46, 28]} hair="long" shirt={TINT} reach={[48, 10, 16]} />
      <Seated at={[66, 28]} hair="short" reach={[64, 12, 16]} />
      <Bubble x={P(46, 28, 36)[0] - 2} y={P(46, 28, 36)[1] - 22} />

      {/* GROW — showing what you built, by the campus */}
      <Box x={232} y={-2} dx={3} dy={26} dz={30} />
      <polygon points={pts([232, 2, 12], [232, 20, 12], [232, 20, 26], [232, 2, 26])} fill={SCREEN} stroke={NAVY} strokeWidth="0.7" />
      <path d={`M${P(232, 6, 15).join(' ')} L${P(232, 10, 20).join(' ')} L${P(232, 15, 17).join(' ')} L${P(232, 18, 23).join(' ')}`} fill="none" stroke={BLUE} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${P(232, 4, 24).join(' ')} L${P(232, 18, 24).join(' ')}`} stroke={NAVY} strokeWidth="0.7" opacity="0.6" />
      <Standing at={[220, 22]} hair="bun" arms="talk" facing={1} shirt={WHITE} pack />

      {/* DISCOVER — the new student, the only one in blue */}
      <Standing at={[-8, 126]} hair="short" shirt={BLUE} pack arms="phone" />
      <MatchArc from={[P(-8, 126)[0] + 8, P(-8, 126)[1] - 33]} to={P(42, 30, 22)} />

      {/* TRY THINGS — clubs, events and hackathons pinned by the walk */}
      <NoticeBoard x={26} y={152} />

      {/* Words, kept to a minimum */}
      <Note from={P(225, -75, 78)} dx={-30} dy={-30} lines="YOUR CAMPUS" anchor="end" color={BLUE} />
      <Note from={P(-8, 126, 42)} dx={4} dy={-44} lines="DISCOVER PEOPLE" color={BLUE} step="01" />
      <Note from={P(56, 8, 26)} dx={-40} dy={-84} lines={['FIND YOUR CIRCLE', 'SHARED INTERESTS · SHARED GOALS']} anchor="end" color={BLUE} step="02" />
      <Note from={P(47, 4, 22)} dx={20} dy={-36} lines="CODING" />
      <Note from={P(68, 8, 17)} dx={22} dy={-26} lines="DESIGN" />
      <Note from={P(233, 12, 28)} dx={-48} dy={44} lines="PROJECTS" anchor="end" />
      <Note from={P(220, 22, 40)} dx={32} dy={94} lines={['BUILD TOGETHER', 'LEARN · CREATE · GROW']} color={BLUE} step="04" />
      <Note from={P(28, 152, 6)} dx={-72} dy={12} under lines={['TRY THINGS', 'CLUBS · EVENTS', 'HACKATHONS']} color={BLUE} step="03" />

      <YourCircle x={134} y={292} scale={1.18} />
    </svg>
  );
}
