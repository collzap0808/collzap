// A line-drawn, isometric sketch of CollZap: a phone standing on the floor
// with the real pieces of the product floating off its screen — the people
// you're matched with, your circle's chat, today's task, your streak, and the
// verified tag that makes any of it safe. Ink on paper, one blue accent; it
// inverts cleanly in dark mode because every colour is a theme token.

const INK = 'rgb(var(--c-ink))';
const SURFACE = 'rgb(var(--c-surface))';
const SKELETON = 'rgb(var(--c-ink) / 0.13)';
const MUTED = 'rgb(var(--c-ink) / 0.55)';
const ACCENT = 'rgb(var(--c-accent-500))';

// A vertical plane seen from the front-left: x runs down-right, y straight down.
const PLANE = 'matrix(0.866 0.5 0 1 0 0)';
// The floor.
const FLOOR = 'matrix(0.866 0.5 -0.866 0.5 0 0)';

function Plane({ x, y, children }) {
  return <g transform={`translate(${x} ${y}) ${PLANE}`}>{children}</g>;
}

/** A floating card: drifts a few pixels, on its own clock, and rests when motion is off. */
function Floating({ delay = 0, children }) {
  return (
    <g className="iso-float" style={{ animationDelay: `${delay}s` }}>
      {children}
    </g>
  );
}

function Card({ w, h, children }) {
  return (
    <>
      <rect width={w} height={h} rx="12" fill={SURFACE} stroke={INK} strokeWidth="1.3" />
      {children}
    </>
  );
}

function Avatar({ cx, cy }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="10" fill={SURFACE} stroke={INK} strokeWidth="1.2" />
      <circle cx={cx} cy={cy - 2.5} r="3.4" fill={INK} />
      <path d={`M${cx - 6} ${cy + 7} a6 5 0 0 1 12 0`} fill={INK} />
    </g>
  );
}

const text = (size, weight = 500, fill = INK) => ({
  fontFamily: 'Inter, system-ui, sans-serif', fontSize: size, fontWeight: weight, fill,
});

export default function CampusSketch({ className }) {
  return (
    <svg
      viewBox="0 0 600 540"
      className={className}
      role="img"
      aria-label="Sketch of the CollZap app: your matched people with a Message button, your circle's chat, today's task checked off for 10 points, a four-day streak, and a Verified student tag."
    >
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* Floor lines */}
        <g transform={`translate(330 452) ${FLOOR}`} fill="none" stroke={INK} strokeWidth="1.1" opacity="0.55">
          <path d="M-190 -60 L150 -60 L150 120" />
          <path d="M-150 -20 L110 -20" />
          <path d="M60 -60 L60 -150" />
        </g>
        <path d="M110 250 V420" stroke={INK} strokeWidth="1.1" opacity="0.45" />
        <path d="M520 330 V470" stroke={INK} strokeWidth="1.1" opacity="0.45" />

        {/* Phone */}
        <Plane x={290} y={14}>
          <rect width="170" height="350" rx="30" fill={SURFACE} stroke={INK} strokeWidth="1.4" />
          <rect x="9" y="9" width="152" height="332" rx="23" fill="none" stroke={INK} strokeWidth="0.9" opacity="0.6" />
          <rect x="60" y="22" width="50" height="11" rx="5.5" fill={SKELETON} />
          <path d="M171 90 V130" stroke={INK} strokeWidth="2" />
          <rect x="24" y="250" width="110" height="7" rx="3.5" fill={SKELETON} />
          <rect x="24" y="266" width="80" height="7" rx="3.5" fill={SKELETON} />
          <rect x="24" y="296" width="122" height="24" rx="8" fill="none" stroke={INK} strokeWidth="0.9" opacity="0.6" />
        </Plane>

        {/* Circle chat, lifting off the screen */}
        <Floating delay={0}>
          <Plane x={262} y={88}>
            <Card w={172} h={132}>
              <text x="14" y="25" style={text(12, 600)}>Circle chat</text>
              <g transform="translate(128 16)">
                <circle cx="5" cy="4" r="3" fill={INK} />
                <path d="M0 13 a5 4 0 0 1 10 0" fill={INK} />
              </g>
              <text x="158" y="26" textAnchor="end" style={text(10, 600)}>4</text>
              <rect x="14" y="40" width="94" height="24" rx="9" fill="none" stroke={INK} strokeWidth="1.1" />
              <rect x="24" y="48" width="58" height="4" rx="2" fill={SKELETON} />
              <rect x="24" y="55" width="36" height="4" rx="2" fill={SKELETON} />
              <rect x="62" y="72" width="96" height="26" rx="9" fill={ACCENT} />
              <rect x="74" y="80" width="54" height="4" rx="2" fill={SURFACE} opacity="0.9" />
              <rect x="74" y="88" width="34" height="4" rx="2" fill={SURFACE} opacity="0.9" />
              <rect x="14" y="106" width="64" height="18" rx="9" fill="none" stroke={INK} strokeWidth="1.1" />
              <rect x="24" y="113" width="36" height="4" rx="2" fill={SKELETON} />
            </Card>
          </Plane>
        </Floating>

        {/* Your people */}
        <Floating delay={1.6}>
          <Plane x={64} y={54}>
            <Card w={180} h={126}>
              <text x="14" y="25" style={text(12, 600)}>Your people</text>
              <text x="166" y="25" textAnchor="end" style={text(9.5, 500, MUTED)}>same campus</text>
              <Avatar cx={28} cy={51} />
              <text x="46" y="48" style={text(11, 600)}>Rithik</text>
              <text x="46" y="61" style={text(9, 500, MUTED)}>Coding · 2nd year</text>
              <rect x="118" y="41" width="50" height="19" rx="9.5" fill={ACCENT} />
              <text x="143" y="54" textAnchor="middle" style={text(8.5, 600, SURFACE)}>Message</text>
              <path d="M14 72 H166" stroke={INK} strokeWidth="0.8" opacity="0.25" />
              <Avatar cx={28} cy={96} />
              <text x="46" y="93" style={text(11, 600)}>Aanya</text>
              <text x="46" y="106" style={text(9, 500, MUTED)}>Design · 3rd year</text>
              <rect x="118" y="86" width="50" height="19" rx="9.5" fill="none" stroke={INK} strokeWidth="1.1" />
              <text x="143" y="99" textAnchor="middle" style={text(8.5, 600)}>Message</text>
            </Card>
          </Plane>
        </Floating>

        {/* Verified tag */}
        <Plane x={40} y={174}>
          <rect width="86" height="22" rx="4" fill={INK} />
          <path d="M11 11.5 l3.5 3.5 l6.5 -7" fill="none" stroke={SURFACE} strokeWidth="1.8" />
          <text x="27" y="15.5" style={text(10, 700, SURFACE)}>VERIFIED</text>
        </Plane>

        {/* Streak */}
        <Floating delay={0.9}>
          <Plane x={402} y={246}>
            <Card w={156} h={108}>
              <text x="14" y="25" style={text(12, 600)}>4-day streak</text>
              <text x="142" y="25" textAnchor="end" style={text(9.5, 500, MUTED)}>65 pts</text>
              {[14, 22, 18, 30, 26, 38, 46].map((h, i) => (
                <rect key={i} x={18 + i * 18} y={92 - h} width="8" height={h} rx="2" fill={i === 6 ? ACCENT : INK} />
              ))}
              <path d="M14 94 H142" stroke={INK} strokeWidth="0.8" opacity="0.35" />
            </Card>
          </Plane>
        </Floating>

        {/* Today's task */}
        <Floating delay={2.4}>
          <Plane x={184} y={296}>
            <Card w={176} h={114}>
              <text x="14" y="25" style={text(12, 600)}>Today&rsquo;s task</text>
              <text x="162" y="25" textAnchor="end" style={text(9.5, 700, ACCENT)}>+10 pts</text>
              <rect x="14" y="38" width="17" height="17" rx="4.5" fill={ACCENT} />
              <path d="M18 46.5 l3 3 l6 -6.5" fill="none" stroke={SURFACE} strokeWidth="1.8" />
              <text x="40" y="47" style={text(11, 600)}>Learn loops</text>
              <text x="40" y="60" style={text(9, 500, MUTED)}>Day 6 · reviewed by 2 peers</text>
              <rect x="14" y="76" width="124" height="6" rx="3" fill={SKELETON} />
              <rect x="14" y="89" width="88" height="6" rx="3" fill={SKELETON} />
            </Card>
          </Plane>
        </Floating>
      </g>
    </svg>
  );
}
