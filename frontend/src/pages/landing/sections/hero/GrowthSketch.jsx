// The hero sketch: a college, a student climbing six steps toward it (the six
// levels of the Potential tracker), classmates joined to them by dotted lines,
// and the product's real pieces floating alongside. Line-drawn isometric, one
// growth-green accent and a marigold highlight; colours are hero tokens, so the
// whole drawing flips cleanly in dark mode.

const C = {
  ink: 'rgb(var(--h-ink))',
  surface: 'rgb(var(--h-surface))',
  shade: 'rgb(var(--h-ink) / 0.07)',
  skeleton: 'rgb(var(--h-ink) / 0.13)',
  mute: 'rgb(var(--h-ink) / 0.55)',
  accent: 'rgb(var(--h-accent))',
  accentSoft: 'rgb(var(--h-accent) / 0.28)',
  onAccent: 'rgb(var(--h-on-accent))',
  hi: 'rgb(var(--h-hi))',
};

// World → screen, classic 30° isometric. x runs down-right, y down-left, z up.
const O = { x: 300, y: 200 };
const P = (x, y, z = 0) => [O.x + (x - y) * 0.866, O.y + (x + y) * 0.5 - z];
const pts = (...ps) => ps.map((p) => P(...p).join(',')).join(' ');

const stroke = { stroke: C.ink, strokeWidth: 1.3, strokeLinejoin: 'round' };

/** A solid box: top, front-left (y = max) and front-right (x = max) faces. */
function Box({ x, y, z = 0, dx, dy, dz, top = C.surface, left = C.surface, right = C.shade }) {
  const [x1, y1, z1] = [x + dx, y + dy, z + dz];
  return (
    <g {...stroke}>
      <polygon points={pts([x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1])} fill={left} />
      <polygon points={pts([x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1])} fill={right === C.shade ? C.surface : right} />
      {right === C.shade && <polygon points={pts([x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1])} fill={C.shade} stroke="none" />}
      <polygon points={pts([x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1])} fill={top} />
    </g>
  );
}

/** A window on the building's front-left face (y = const). */
function WinY({ x, y, z, w = 10, h = 14 }) {
  return <polygon points={pts([x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h])} fill="none" {...stroke} strokeWidth="1" />;
}
/** A window on the front-right face (x = const). */
function WinX({ x, y, z, w = 10, h = 14 }) {
  return <polygon points={pts([x, y, z], [x, y + w, z], [x, y + w, z + h], [x, y, z + h])} fill="none" {...stroke} strokeWidth="1" />;
}

function College() {
  return (
    <g>
      {/* Main hall */}
      <Box x={150} y={10} dx={150} dy={80} dz={78} />
      {[166, 190, 246, 270].map((x) => <WinY key={`a${x}`} x={x} y={90} z={44} />)}
      {[166, 190, 246, 270].map((x) => <WinY key={`b${x}`} x={x} y={90} z={18} />)}
      {[22, 46, 66].map((y) => <WinX key={`c${y}`} x={300} y={y} z={44} />)}
      {[22, 46, 66].map((y) => <WinX key={`d${y}`} x={300} y={y} z={18} />)}
      {/* Door with steps */}
      <polygon points={pts([216, 90, 0], [234, 90, 0], [234, 90, 26], [216, 90, 26])} fill={C.shade} {...stroke} />
      <path d={`M${P(225, 90, 26).join(' ')} L${P(225, 90, 0).join(' ')}`} {...stroke} strokeWidth="0.8" />
      {/* Roof: two slopes and the front gable */}
      <polygon points={pts([150, 10, 78], [225, 10, 104], [225, 90, 104], [150, 90, 78])} fill={C.surface} {...stroke} />
      <polygon points={pts([225, 10, 104], [300, 10, 78], [300, 90, 78], [225, 90, 104])} fill={C.shade} {...stroke} />
      <polygon points={pts([150, 90, 78], [300, 90, 78], [225, 90, 104])} fill={C.surface} {...stroke} />
      {/* Clock tower */}
      <Box x={207} y={36} z={92} dx={36} dy={30} dz={60} />
      <circle cx={P(225, 66, 132)[0]} cy={P(225, 66, 132)[1]} r="7.5" fill={C.surface} {...stroke} />
      <path d={`M${P(225, 66, 132).join(' ')} l0 -5 M${P(225, 66, 132).join(' ')} l4 2`} {...stroke} strokeWidth="1" />
      <polygon points={pts([207, 66, 152], [243, 66, 152], [225, 51, 178])} fill={C.surface} {...stroke} />
      <polygon points={pts([243, 36, 152], [243, 66, 152], [225, 51, 178])} fill={C.shade} {...stroke} />
    </g>
  );
}

// Six steps, one per level. The first three are reached (green tops); the
// student stands on the third; the flag waits on the last.
const STEPS = 6;
const REACHED = 3;
// Each higher step sits further back, so the staircase climbs away from you
// toward the college instead of hiding itself.
const step = (i) => ({ x: 20 + i * 4, y: 214 - i * 22, dx: 52, dy: 22, dz: (i + 1) * 13 });

function Steps() {
  return (
    <g>
      {/* Back to front: the tallest, furthest step first. */}
      {Array.from({ length: STEPS }, (_, k) => STEPS - 1 - k).map((i) => (
        <Box key={i} {...step(i)} top={i < REACHED ? C.accentSoft : C.surface} />
      ))}
    </g>
  );
}

function Flag() {
  const s = step(STEPS - 1);
  const [x, y] = P(s.x + s.dx / 2, s.y + s.dy / 2, s.dz);
  return (
    <g>
      <path d={`M${x} ${y} V${y - 38}`} {...stroke} />
      <path d={`M${x} ${y - 38} L${x + 22} ${y - 31} L${x} ${y - 24} Z`} fill={C.hi} {...stroke} />
    </g>
  );
}

function Student({ at }) {
  const [x, y] = at;
  return (
    <g>
      <ellipse cx={x} cy={y} rx="9" ry="4" fill={C.shade} />
      <path d={`M${x - 3} ${y} V${y - 12} M${x + 3} ${y} V${y - 12}`} {...stroke} strokeWidth="2" strokeLinecap="round" />
      <path d={`M${x - 7} ${y - 11} v-12 a7 7 0 0 1 14 0 v12 Z`} fill={C.accent} {...stroke} />
      <circle cx={x} cy={y - 31} r="5.5" fill={C.surface} {...stroke} />
      {/* backpack strap */}
      <path d={`M${x - 4} ${y - 22} L${x + 3} ${y - 13}`} stroke={C.onAccent} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

function Peer({ at }) {
  const [x, y] = at;
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill={C.surface} {...stroke} />
      <circle cx={x} cy={y - 2.5} r="3.6" fill={C.ink} />
      <path d={`M${x - 6.5} ${y + 7.5} a6.5 5.5 0 0 1 13 0`} fill={C.ink} />
    </g>
  );
}

const PLANE = 'matrix(0.866 0.5 0 1 0 0)';
function Plane({ x, y, children }) {
  return <g transform={`translate(${x} ${y}) ${PLANE}`}>{children}</g>;
}
function Floating({ delay = 0, children }) {
  return <g className="iso-float" style={{ animationDelay: `${delay}s` }}>{children}</g>;
}
function Card({ w, h, children }) {
  return (
    <>
      <rect width={w} height={h} rx="12" fill={C.surface} {...stroke} />
      {children}
    </>
  );
}
const T = (size, weight = 500, fill = C.ink) => ({ fontFamily: 'Inter, system-ui, sans-serif', fontSize: size, fontWeight: weight, fill });

export default function GrowthSketch({ className }) {
  const s2 = step(REACHED - 1);
  const studentAt = P(s2.x + s2.dx / 2, s2.y + s2.dy / 2, s2.dz);
  const peers = [P(196, 222), P(262, 196), P(330, 160)];

  return (
    <svg
      viewBox="0 0 640 560"
      className={className}
      role="img"
      aria-label="Sketch of CollZap: a student climbing six steps toward their college — three already reached — with classmates connected to them, a Potential card at Growing, today's task done for 10 points, their circle of peers, and a Verified student tag."
    >
      <g strokeLinecap="round">
        {/* Ground */}
        <g fill="none" stroke={C.ink} strokeWidth="1.1" opacity="0.5">
          <polygon points={pts([-30, 104, 0], [350, 104, 0], [350, 250, 0], [-30, 250, 0])} />
          <path d={`M${P(140, -10).join(' ')} L${P(340, -10).join(' ')} L${P(340, 104).join(' ')}`} />
        </g>

        <College />

        {/* Classmates — dotted threads to the student */}
        <g fill="none" stroke={C.accent} strokeWidth="1.5" strokeDasharray="1 5" opacity="0.9">
          {peers.map((p, i) => (
            <path key={i} d={`M${studentAt[0]} ${studentAt[1] - 18} Q ${(studentAt[0] + p[0]) / 2} ${Math.max(studentAt[1], p[1]) + 26} ${p[0]} ${p[1]}`} />
          ))}
        </g>

        <Steps />
        <Flag />
        <Student at={studentAt} />
        {peers.map((p, i) => <Peer key={i} at={p} />)}

        {/* Your potential */}
        <Floating delay={0}>
          <Plane x={36} y={42}>
            <Card w={186} h={112}>
              <text x="14" y="25" style={T(12, 600)}>Your potential</text>
              <text x="172" y="25" textAnchor="end" style={T(12, 700, C.accent)}>38%</text>
              <text x="14" y="44" style={T(9.5, 500, C.mute)}>Level 3 · Growing</text>
              <rect x="14" y="56" width="158" height="7" rx="3.5" fill={C.skeleton} />
              <rect x="14" y="56" width="60" height="7" rx="3.5" fill={C.accent} />
              {Array.from({ length: STEPS }, (_, i) => (
                <circle key={i} cx={20 + i * 29} cy="80" r="4" fill={i < REACHED ? C.accent : C.surface} stroke={C.ink} strokeWidth="1" />
              ))}
              <text x="14" y="101" style={T(8.5, 500, C.mute)}>Seed</text>
              <text x="172" y="101" textAnchor="end" style={T(8.5, 500, C.mute)}>Realized</text>
            </Card>
          </Plane>
        </Floating>

        {/* Verified student */}
        <Plane x={318} y={312}>
          <rect width="112" height="22" rx="4" fill={C.ink} />
          <path d="M11 11.5 l3.5 3.5 l6.5 -7" fill="none" stroke={C.surface} strokeWidth="1.8" />
          <text x="27" y="15.5" style={T(9.5, 700, C.surface)}>VERIFIED STUDENT</text>
        </Plane>

        {/* Your circle */}
        <Floating delay={1.4}>
          <Plane x={468} y={312}>
            <Card w={150} h={98}>
              <text x="14" y="25" style={T(12, 600)}>Your circle</text>
              <text x="14" y="40" style={T(9, 500, C.mute)}>Coding · same campus</text>
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <circle cx={26 + i * 18} cy="68" r="10" fill={C.surface} stroke={C.ink} strokeWidth="1.2" />
                  <circle cx={26 + i * 18} cy="65.5" r="3.4" fill={C.ink} />
                  <path d={`M${20 + i * 18} ${75} a6 5 0 0 1 12 0`} fill={C.ink} />
                </g>
              ))}
              <rect x="86" y="58" width="52" height="20" rx="10" fill={C.accent} />
              <text x="112" y="72" textAnchor="middle" style={T(8.5, 600, C.onAccent)}>Message</text>
            </Card>
          </Plane>
        </Floating>

        {/* Today's task */}
        <Floating delay={2.2}>
          <Plane x={70} y={322}>
            <Card w={178} h={104}>
              <text x="14" y="25" style={T(12, 600)}>Today&rsquo;s task</text>
              <text x="164" y="25" textAnchor="end" style={T(10, 700, C.ink)}>+10 pts</text>
              <rect x="14" y="38" width="17" height="17" rx="4.5" fill={C.accent} />
              <path d="M18 46.5 l3 3 l6 -6.5" fill="none" stroke={C.onAccent} strokeWidth="1.8" />
              <text x="40" y="47" style={T(11, 600)}>Learn loops</text>
              <text x="40" y="60" style={T(9, 500, C.mute)}>Reviewed by 2 peers</text>
              <rect x="14" y="74" width="80" height="16" rx="8" fill={C.hi} />
              <text x="54" y="85.5" textAnchor="middle" style={T(8.5, 700, 'rgb(19 38 31)')}>4-day streak</text>
            </Card>
          </Plane>
        </Floating>
      </g>
    </svg>
  );
}
