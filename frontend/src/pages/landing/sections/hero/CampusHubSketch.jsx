import { useId } from 'react';

// One open campus quad. Four different buildings (library, academic block,
// student center, innovation hub) frame a central lawn with gaps between them;
// the story happens on the lawn: 01 a student walks across the quad toward
// people, 02 two students with shared interests at an outdoor table, 03 a few
// students building something by the innovation hub. The buildings are the
// context, the students are the story, and the Your Circle card is CollZap.

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
const S = 1.1;
const O = { x: 304, y: 160 };
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
function Standing({ at, shirt = WHITE, hair, pack, arms = 'down', facing = 1, walk = false }) {
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
      <path
        d={walk
          ? `M${x - 4.5} ${y} L${x - 1.2} ${y - 13} M${x + 4} ${y - 0.6} L${x + 1.2} ${y - 13}`
          : `M${x - 2} ${y} L${x - 1.7} ${y - 13} M${x + 2} ${y} L${x + 1.7} ${y - 13}`}
        stroke={NAVY}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {pack && <rect x={x + 3 * -facing - (facing > 0 ? 3 : 0)} y={sh + 2} width="4" height="10" rx="1.5" fill={TINT} {...line(0.8)} />}
      <path d={`M${x - 4.6} ${y - 12} L${x - 5} ${sh} Q${x} ${sh - 3} ${x + 5} ${sh} L${x + 4.6} ${y - 12} Z`} fill={shirt} {...line(0.9)} />
      <path d={armPath} fill="none" stroke={NAVY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {arms === 'read' && <path d={`M${x - 4} ${y - 23} l4 1.4 l4 -1.4 v5 l-4 1.4 l-4 -1.4 Z`} fill={WHITE} stroke={NAVY} strokeWidth="0.8" strokeLinejoin="round" />}
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

/**
 * One wing of the campus quad. Window bands run along the two faces that face
 * the viewer; `floors` sets how many bands. `door` puts glass doors (with a
 * canopy) on the front face at that x.
 */
function Wing({ x, y, dx, dy, dz, floors = 2, hatch, door, w = 1.1 }) {
  const [x1, y1] = [x + dx, y + dy];
  const levels = Array.from({ length: floors }, (_, i) => 6 + i * ((dz - 8) / floors));
  const bandH = Math.min(7, (dz - 8) / floors - 3);
  return (
    <g>
      <Box x={x} y={y} dx={dx} dy={dy} dz={dz} hatch={hatch} w={w} />
      {/* front face (y = y1) */}
      {levels.map((z) => (
        <polygon key={`f${z}`} points={pts([x + 4, y1, z], [x1 - 4, y1, z], [x1 - 4, y1, z + bandH], [x + 4, y1, z + bandH])} fill={TINT} stroke={NAVY} strokeWidth="0.6" />
      ))}
      {Array.from({ length: Math.max(0, Math.floor((dx - 8) / 12)) }, (_, i) => x + 4 + (i + 1) * 12).map((mx) => (
        <path key={`fm${mx}`} d={`M${P(mx, y1, levels[0]).join(' ')} L${P(mx, y1, levels[levels.length - 1] + bandH).join(' ')}`} stroke={NAVY} strokeWidth="0.45" opacity="0.4" />
      ))}
      {/* right face (x = x1) */}
      {levels.map((z) => (
        <polygon key={`r${z}`} points={pts([x1, y + 4, z], [x1, y1 - 4, z], [x1, y1 - 4, z + bandH], [x1, y + 4, z + bandH])} fill="none" stroke={NAVY} strokeWidth="0.55" opacity="0.55" />
      ))}
      {door != null && (
        <g>
          <polygon points={pts([door - 9, y1, 0], [door + 9, y1, 0], [door + 9, y1, 13], [door - 9, y1, 13])} fill={SCREEN} {...line(0.9)} />
          <path d={`M${P(door, y1, 0).join(' ')} L${P(door, y1, 13).join(' ')}`} stroke={NAVY} strokeWidth="0.6" />
          <Box x={door - 13} y={y1} z={14} dx={26} dy={8} dz={1.6} w={0.9} />
        </g>
      )}
    </g>
  );
}

/** Small spaced-caps sign, set on a building's roof like a nameplate. */
function Sign({ at, children }) {
  const [x, y] = P(...at);
  return (
    <text x={x} y={y} textAnchor="middle" style={{ font: '700 8.5px Inter, system-ui, sans-serif', letterSpacing: '0.12em', fill: NAVY, opacity: 0.8 }}>
      {children}
    </text>
  );
}

/** A low campus bench along a path. */
function Bench({ x, y, alongX = true }) {
  const [dx, dy] = alongX ? [16, 5] : [5, 16];
  return (
    <g>
      <Box x={x} y={y} z={5} dx={dx} dy={dy} dz={1.6} w={0.8} />
      {[[x + 1, y + dy - 1], [x + dx - 1, y + dy - 1]].map(([lx, ly], i) => (
        <path key={i} d={`M${P(lx, ly, 5).join(' ')} L${P(lx, ly, 0).join(' ')}`} {...line(0.9)} />
      ))}
    </g>
  );
}

const column = (x, y, h, k) => (
  <path key={k} d={`M${P(x, y, 0).join(' ')} L${P(x, y, h).join(' ')}`} stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" />
);

/**
 * Library, entrance on its right face (x = x + dx) toward the courtyard: two
 * floors of tall windows, a columned porch with steps, and an open-book emblem.
 */
function Library({ x, y, dx, dy, dz, w = 0.95 }) {
  const x1 = x + dx;
  const mid = y + dy / 2;
  const windows = [];
  for (let wy = y + 5; wy + 5 <= y + dy - 5; wy += 8) {
    if (Math.abs(wy + 2.5 - mid) < 10) continue; // leave the porch bay clear
    windows.push(wy);
  }
  const [bx, by] = P(x1, mid, dz - 7);
  return (
    <g>
      <Box x={x} y={y} dx={dx} dy={dy} dz={dz} w={w} />
      <path d={`M${P(x1, y, dz / 2).join(' ')} L${P(x1, y + dy, dz / 2).join(' ')}`} stroke={NAVY} strokeWidth="0.6" opacity="0.5" />
      {windows.flatMap((wy) => [4, dz / 2 + 3].map((z) => (
        <polygon key={`${wy}-${z}`} points={pts([x1, wy, z], [x1, wy + 5, z], [x1, wy + 5, z + dz / 2 - 8], [x1, wy, z + dz / 2 - 8])} fill={TINT} stroke={NAVY} strokeWidth="0.55" />
      )))}
      {/* porch: glass doors, steps, columns, flat roof */}
      <polygon points={pts([x1, mid - 6, 0], [x1, mid + 6, 0], [x1, mid + 6, 13], [x1, mid - 6, 13])} fill={SCREEN} {...line(0.9)} />
      <Box x={x1} y={mid - 12} dx={9} dy={24} dz={1.6} w={0.8} />
      {[mid - 10, mid - 3.5, mid + 3.5, mid + 10].map((cy, i) => column(x1 + 8, cy, 16, `c${i}`))}
      <Box x={x1} y={mid - 12} z={16} dx={10} dy={24} dz={2.4} w={0.9} />
      {/* open book emblem above the porch */}
      <path d={`M${bx - 6} ${by} l6 2.2 l6 -2.2 v6 l-6 2.2 l-6 -2.2 Z M${bx} ${by + 2.2} v6`} fill={WHITE} stroke={BLUE} strokeWidth="0.9" strokeLinejoin="round" />
      {/* roof parapet */}
      <Box x={x + 4} y={y + 4} z={dz} dx={dx - 8} dy={dy - 8} dz={2} w={0.7} />
    </g>
  );
}

/**
 * Academic block, the largest and most traditional: three floors of windows,
 * a columned entrance with a portico and steps on its front face (y = y + dy).
 */
function AcademicBlock({ x, y, dx, dy, dz, door, hatch }) {
  const y1 = y + dy;
  return (
    <g>
      <Wing x={x} y={y} dx={dx} dy={dy} dz={dz} floors={3} hatch={hatch} w={0.95} />
      {/* entrance bay */}
      <polygon points={pts([door - 14, y1, 0], [door + 14, y1, 0], [door + 14, y1, 22], [door - 14, y1, 22])} fill={WHITE} stroke="none" />
      <polygon points={pts([door - 8, y1, 0], [door + 8, y1, 0], [door + 8, y1, 15], [door - 8, y1, 15])} fill={SCREEN} {...line(0.9)} />
      <path d={`M${P(door, y1, 0).join(' ')} L${P(door, y1, 15).join(' ')}`} stroke={NAVY} strokeWidth="0.6" />
      <Box x={door - 18} y={y1} dx={36} dy={12} dz={1.6} w={0.8} />
      <Box x={door - 16} y={y1} z={1.6} dx={32} dy={7} dz={1.4} w={0.8} />
      {[door - 13, door - 4.5, door + 4.5, door + 13].map((cx, i) => column(cx, y1 + 9, 22, `a${i}`))}
      <Box x={door - 17} y={y1} z={22} dx={34} dy={11} dz={3} w={0.9} />
      {/* roof: parapet and a rooftop unit */}
      <Box x={x + 3} y={y + 3} z={dz} dx={dx - 6} dy={dy - 6} dz={2} w={0.7} />
      <Box x={x + 14} y={y + 8} z={dz + 2} dx={20} dy={14} dz={6} w={0.7} />
    </g>
  );
}

/**
 * Student center, the social building: a wide glass ground floor toward the
 * courtyard (x = x + dx), a smaller upper floor set back, and a terrace canopy.
 */
function StudentCenter({ x, y, dx, dy, w = 1 }) {
  const x1 = x + dx;
  return (
    <g>
      <Box x={x} y={y} dx={dx} dy={dy} dz={15} w={w} />
      <polygon points={pts([x1, y + 4, 1.5], [x1, y + dy - 4, 1.5], [x1, y + dy - 4, 12], [x1, y + 4, 12])} fill={SCREEN} stroke={NAVY} strokeWidth="0.7" />
      {Array.from({ length: Math.floor((dy - 8) / 8) }, (_, i) => y + 4 + (i + 1) * 8).map((my) => (
        <path key={my} d={`M${P(x1, my, 1.5).join(' ')} L${P(x1, my, 12).join(' ')}`} stroke={NAVY} strokeWidth="0.5" opacity="0.5" />
      ))}
      <Box x={x} y={y + 4} z={15} dx={dx - 14} dy={dy - 8} dz={13} w={w} />
      <polygon points={pts([x1 - 14, y + 9, 18], [x1 - 14, y + dy - 9, 18], [x1 - 14, y + dy - 9, 25], [x1 - 14, y + 9, 25])} fill={TINT} stroke={NAVY} strokeWidth="0.6" />
      {/* terrace canopy over the entrance */}
      {[[x1 + 10, y + dy / 2 - 12], [x1 + 10, y + dy / 2 + 12]].map(([px, py], i) => column(px, py, 14, `s${i}`))}
      <Box x={x1} y={y + dy / 2 - 14} z={14} dx={12} dy={28} dz={1.8} w={0.9} />
    </g>
  );
}

/**
 * Innovation hub: a three-level modern university building. Glass front
 * (y = y + dy) divided by structural columns, a framed doorway with a canopy,
 * vertical window strips on the side and a thin roof overhang.
 */
function InnovationHub({ x, y, dx, dy, dz, w = 1 }) {
  const [x1, y1] = [x + dx, y + dy];
  const floors = [0, dz / 3, (2 * dz) / 3];
  const cols = Array.from({ length: Math.floor(dx / 9) + 1 }, (_, i) => x + (i * dx) / Math.floor(dx / 9));
  const door = x + dx / 2;
  return (
    <g>
      <Box x={x} y={y} dx={dx} dy={dy} dz={dz} w={w} />
      {/* glass curtain wall on the front */}
      <polygon points={pts([x + 2, y1, 1], [x1 - 2, y1, 1], [x1 - 2, y1, dz - 3], [x + 2, y1, dz - 3])} fill={SCREEN} stroke={NAVY} strokeWidth="0.7" />
      {floors.slice(1).map((z) => (
        <path key={`fl${z}`} d={`M${P(x + 2, y1, z).join(' ')} L${P(x1 - 2, y1, z).join(' ')}`} stroke={NAVY} strokeWidth="1" />
      ))}
      {cols.map((cx, i) => (
        <path key={`col${i}`} d={`M${P(cx, y1, 0).join(' ')} L${P(cx, y1, dz - 3).join(' ')}`} stroke={NAVY} strokeWidth={i === 0 || i === cols.length - 1 ? 1.4 : 0.6} />
      ))}
      {/* framed doorway and canopy */}
      <polygon points={pts([door - 6, y1, 0], [door + 6, y1, 0], [door + 6, y1, 11], [door - 6, y1, 11])} fill={WHITE} {...line(1)} />
      <path d={`M${P(door, y1, 0).join(' ')} L${P(door, y1, 11).join(' ')}`} stroke={NAVY} strokeWidth="0.7" />
      <Box x={door - 10} y={y1} z={12} dx={20} dy={7} dz={1.6} w={0.9} />
      {/* side: tall window strips */}
      {Array.from({ length: Math.floor((dy - 8) / 9) }, (_, i) => y + 6 + i * 9).map((wy) => (
        <polygon key={`sw${wy}`} points={pts([x1, wy, 4], [x1, wy + 4, 4], [x1, wy + 4, dz - 6], [x1, wy, dz - 6])} fill={TINT} stroke={NAVY} strokeWidth="0.55" />
      ))}
      {/* roof overhang and a small rooftop pavilion */}
      <Box x={x - 2} y={y - 2} z={dz} dx={dx + 4} dy={dy + 6} dz={2.2} w={0.9} />
      <Box x={x + 8} y={y + 8} z={dz + 2.2} dx={dx / 2} dy={dy / 3} dz={7} w={0.8} />
    </g>
  );
}

/** Above the discovering student: a small bubble of people found on campus. */
function DiscoverBubble({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-17 -10 h34 a4 4 0 0 1 4 4 v8 a4 4 0 0 1 -4 4 h-13 l-4 4 l-4 -4 h-13 a4 4 0 0 1 -4 -4 v-8 a4 4 0 0 1 4 -4 Z" fill={WHITE} stroke={BLUE} strokeWidth="1" />
      {[-10, 0, 10].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="-4.5" r="2.4" fill={i === 1 ? BLUE : TINT} stroke={NAVY} strokeWidth="0.6" />
          <path d={`M${cx - 3.4} 1.6 a3.4 2.6 0 0 1 6.8 0`} fill={i === 1 ? BLUE : NAVY} />
        </g>
      ))}
    </g>
  );
}

/** A story callout set around the edge of the picture: step, heading, one short line. */
function Callout({ from, to, step, title, body, anchor = 'start' }) {
  const [fx, fy] = from;
  const [tx, ty] = to;
  const x = tx + (anchor === 'start' ? 6 : -6);
  return (
    <g>
      <circle cx={fx} cy={fy} r="2.2" fill={BLUE} />
      <path d={`M${fx} ${fy} L${tx} ${ty}`} stroke={BLUE} strokeWidth="0.8" opacity="0.6" />
      <text x={x} y={ty + 4} textAnchor={anchor} style={{ font: '700 12.5px Inter, system-ui, sans-serif', letterSpacing: '0.01em' }}>
        <tspan fill={SOFT}>{step} </tspan>
        <tspan fill={BLUE}>{title}</tspan>
      </text>
      <text x={x} y={ty + 21} textAnchor={anchor} style={{ font: '500 11px Inter, system-ui, sans-serif', fill: NAVY }}>{body}</text>
    </g>
  );
}

/* ------------------------------------------------------------------- panel */

const CIRCLE = [
  { name: 'Aisha', tags: 'Design · Projects', hair: 'long' },
  { name: 'Rahul', tags: 'Coding · Startups', hair: 'short' },
  { name: 'Sara', tags: 'Research · Design', hair: 'bun' },
];

/** "These are people CollZap found for you" — names and interests, nothing else. */
function YourCircle({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="2" y="3" width="172" height="112" rx="10" fill={SHADOW} />
      <rect width="172" height="112" rx="10" fill={WHITE} stroke={NAVY} strokeWidth="1" />
      <text x="14" y="21" style={{ font: '700 8.5px Inter, system-ui, sans-serif', letterSpacing: '0.14em', fill: NAVY }}>YOUR CIRCLE</text>
      <rect x="96" y="11" width="64" height="14" rx="7" fill={TINT} />
      <circle cx="104" cy="18" r="2.2" fill={CYAN} />
      <text x="109" y="21" style={{ font: '600 7px Inter, system-ui, sans-serif', letterSpacing: '0.04em', fill: NAVY }}>same campus</text>
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

  // Library and student center on the left, academic block at the back, the
  // innovation hub on the right; the commons (paving with a lawn) runs
  // x -10…196, y -24…150 and stays open. Story callouts sit outside the picture.
  const lawn = [[58, 30], [122, 30], [136, 44], [136, 102], [122, 116], [58, 116], [44, 102], [44, 44]];
  const tiles = [];
  for (let i = -10; i <= 196; i += 18) tiles.push([[i, -24], [i, 150]]);
  for (let j = -24; j <= 150; j += 18) tiles.push([[-10, j], [196, j]]);
  return (
    <svg
      viewBox="0 24 680 458"
      className={className}
      role="img"
      aria-label="Isometric sketch of a college campus: a library, an academic block, a student center and an innovation hub around an open central commons. In the middle of the courtyard a student with a backpack looks at their phone, discovering people from the same campus; two students at an outdoor table work on a laptop together; a student points at the club and event board outside the student center; and by the innovation hub one student explains a project to another. A Your Circle card lists students from the same campus: Aisha, Rahul and Sara."
    >
      <defs>
        <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <path d="M0 0 V4" stroke={SOFT} strokeWidth="0.7" opacity="0.7" />
        </pattern>
        <pattern id={`${hatch}-grass`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <path d="M0 0 V6" stroke={SOFT} strokeWidth="0.6" opacity="0.4" />
        </pattern>
      </defs>

      {/* Campus ground */}
      <polygon points={pts([-96, -96], [262, -96], [262, 172], [-96, 172])} fill={IVORY} opacity="0.6" />

      {/* Back: the academic block, with a small tree beside it */}
      <AcademicBlock x={10} y={-80} dx={130} dy={38} dz={46} door={76} hatch={hatch} />

      {/* Left back: the library, with a tree beside it */}
      <Tree at={[-90, 64]} s={0.75} />
      <Library x={-78} y={-26} dx={40} dy={74} dz={38} />

      {/* The commons: paving, with a lawn in the middle */}
      <polygon points={pts([-10, -24], [196, -24], [196, 150], [-10, 150])} fill={WHITE} stroke={NAVY} strokeWidth="0.6" opacity="0.8" />
      <g stroke={NAVY} strokeWidth="0.4" opacity="0.12">
        {tiles.map(([p, q], i) => <path key={i} d={`M${P(...p).join(' ')} L${P(...q).join(' ')}`} />)}
      </g>
      <polygon points={pts(...lawn)} fill={WHITE} stroke={NAVY} strokeWidth="0.7" />
      <polygon points={pts(...lawn)} fill={`url(#${hatch}-grass)`} stroke="none" />
      <Bench x={70} y={124} />
      <Bench x={16} y={20} alongX={false} />

      {/* Left front: the student center, with a tree beside it */}
      <StudentCenter x={-78} y={76} dx={44} dy={68} />
      <Tree at={[-58, 160]} s={0.7} />

      {/* 01 Discover people: a student walking across the courtyard, phone in hand,
          toward the students at the table; the bubble shows people found nearby */}
      <Standing at={[44, 22]} hair="short" shirt={BLUE} pack walk arms="phone" />
      <DiscoverBubble x={P(44, 22)[0] + 2} y={P(44, 22)[1] - 58} />

      {/* 02 Find your circle: two students at an outdoor table, one pointing at the laptop */}
      <Table x={142} y={54} dx={36} dy={20} />
      <Laptop x={150} y={58} z={16} />
      <polygon points={pts([164, 60, 16.2], [174, 60, 16.2], [174, 68, 16.2], [164, 68, 16.2])} fill={WHITE} stroke={NAVY} strokeWidth="0.7" />
      <path d={`M${P(166, 63, 16.4).join(' ')} L${P(172, 65, 16.4).join(' ')}`} stroke={BLUE} strokeWidth="1" strokeLinecap="round" />
      <Cup at={[145, 58, 16]} />
      <Seated at={[152, 84]} hair="long" shirt={TINT} reach={[155, 58, 21]} />
      <Seated at={[170, 84]} hair="short" reach={[168, 66, 16]} />

      {/* 03 Try things: a student pointing at the club and event board outside the student center */}
      <NoticeBoard x={-6} y={106} />
      <Standing at={[2, 122]} hair="long" arms="talk" facing={1} shirt={TINT} pack />

      {/* Right: the innovation hub; 04 Build together at its entrance */}
      <InnovationHub x={206} y={34} dx={52} dy={62} dz={42} />
      <Box x={252} y={104} dx={3} dy={22} dz={26} w={1} />
      <polygon points={pts([252, 107, 10], [252, 123, 10], [252, 123, 23], [252, 107, 23])} fill={SCREEN} stroke={NAVY} strokeWidth="0.7" />
      <path d={`M${P(252, 110, 13).join(' ')} L${P(252, 114, 18).join(' ')} L${P(252, 118, 15).join(' ')} L${P(252, 121, 21).join(' ')}`} fill="none" stroke={BLUE} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <Table x={216} y={106} dx={24} dy={14} />
      <Laptop x={218} y={108} z={16} />
      <Box x={230} y={109} z={16} dx={6} dy={5} dz={5} w={0.8} />
      <polygon points={pts([230, 115, 16.2], [237, 115, 16.2], [237, 119, 16.2], [230, 119, 16.2])} fill={TINT} stroke={NAVY} strokeWidth="0.6" />
      <Seated at={[222, 130]} hair="short" shirt={TINT} reach={[222, 113, 16]} />
      <Standing at={[244, 128]} hair="bun" arms="talk" facing={1} shirt={WHITE} pack />

      {/* Building names: nameplates on the roofs; the innovation hub's sits outside with a leader */}
      <Sign at={[76, -62, 48]}>ACADEMIC BLOCK</Sign>
      <Sign at={[-58, 12, 40]}>LIBRARY</Sign>
      <Sign at={[-62, 110, 28]}>STUDENT CENTER</Sign>
      <Note from={P(258, 70, 30)} dx={48} dy={-2} lines="INNOVATION HUB" />
      <Note from={P(110, -78, 48)} dx={30} dy={-26} lines="YOUR CAMPUS" color={BLUE} />

      {/* Story callouts, outside the picture */}
      <Callout from={[P(44, 22)[0] + 2, P(44, 22)[1] - 74]} to={[330, 33]} anchor="end" step="01" title="DISCOVER PEOPLE" body="People from your campus" />
      <Callout from={P(160, 64, 26)} to={[496, 212]} step="02" title="FIND YOUR CIRCLE" body="Shared interests · shared goals" />
      <Callout from={P(4, 106, 24)} to={[184, 300]} anchor="end" step="03" title="TRY THINGS" body="Clubs · events · hackathons" />
      <Callout from={P(244, 128, 40)} to={[500, 382]} step="04" title="BUILD TOGETHER" body="Projects · startups · learning" />

      <YourCircle x={196} y={354} scale={1.0} />
    </svg>
  );
}
