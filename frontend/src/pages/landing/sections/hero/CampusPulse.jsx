import { Activity, BookOpen, Code2, Lightbulb, Music, Palette, Trophy } from 'lucide-react';

// Accent tints are the only place the secondary palette appears, one per
// interest, at small size — the strip stays blue/cyan overall.
const PULSE = [
  { label: 'Design', icon: Palette, tint: '#4FB3FF', y: 26 },
  { label: 'Startups', icon: Lightbulb, tint: '#A56BFF', y: 18 },
  { label: 'Coding', icon: Code2, tint: '#43D9A3', y: 26 },
  { label: 'Sports', icon: Trophy, tint: '#FFC857', y: 16 },
  { label: 'Music', icon: Music, tint: '#F276C8', y: 26 },
  { label: 'Research', icon: BookOpen, tint: '#8FC2F5', y: 20 },
];

const xAt = (i) => ((i + 0.5) / PULSE.length) * 1000;

/** A smooth line through every interest's node, like a quiet activity trace. */
function tracePath() {
  const pts = PULSE.map((p, i) => [xAt(i), p.y]);
  let d = `M0 22 C ${pts[0][0] / 2} 22, ${pts[0][0] / 2} ${pts[0][1]}, ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  const [xl, yl] = pts[pts.length - 1];
  d += ` C ${(xl + 1000) / 2} ${yl}, ${(xl + 1000) / 2} 22, 1000 22`;
  return d;
}

/** The hero's closing band: the campus is busy with different things. */
export default function CampusPulse() {
  return (
    <div className="relative flex flex-col gap-4 border-t border-white/[0.07] pt-6 md:flex-row md:items-center md:gap-8">
      <p className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#93A1B5]">
        <Activity className="h-4 w-4 text-[#5FAEFF]" aria-hidden="true" />
        Campus pulse
      </p>

      <div className="-mx-6 min-w-0 overflow-x-auto px-6 pb-1 [scrollbar-width:none] md:mx-0 md:flex-1 md:px-0">
        <div className="relative min-w-[560px] md:min-w-0">
          <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-10 w-full" aria-hidden="true">
            <defs>
              <linearGradient id="cz-pulse" x1="0" x2="1">
                <stop offset="0%" stopColor="#168BFF" stopOpacity="0.15" />
                <stop offset="30%" stopColor="#168BFF" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#00C6D7" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#00C6D7" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path d={tracePath()} fill="none" stroke="url(#cz-pulse)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>

          <ul className="relative grid h-[74px] grid-cols-6" aria-label="Interests active on campus">
            {PULSE.map((p) => (
              <li key={p.label} className="relative flex flex-col items-center">
                <span
                  className="absolute h-3 w-3 -translate-y-1/2 rounded-full border-2 bg-[#071426]"
                  style={{ top: `${(p.y / 40) * 40}px`, borderColor: p.tint, boxShadow: `0 0 0 4px ${p.tint}22` }}
                  aria-hidden="true"
                />
                <span className="absolute top-12 flex items-center gap-1.5 whitespace-nowrap text-sm text-[#BAC4D2]">
                  <p.icon className="h-4 w-4" style={{ color: p.tint }} aria-hidden="true" />
                  {p.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
