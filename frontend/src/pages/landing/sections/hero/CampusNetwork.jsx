import { useId } from 'react';
import { BookOpen, Camera, Code2, Landmark, Lightbulb, Music, Palette, Trophy } from 'lucide-react';
import { cn } from '../../../../lib/utils';

// One coordinate space for everything: the SVG draws in it, and the HTML
// layers (avatars, labels, campus) are placed by the same numbers as a
// percentage of the box — so a label always sits on the end of its line.
const W = 800;
const H = 600;
const pos = (x, y) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

const CAMPUS = { id: 'campus', x: 470, y: 322 };

const STUDENTS = [
  { id: 'a', x: 262, y: 188, skin: '#C68B5B', hair: '#1D1714', style: 'long', shirt: '#E07AB8', bg: '#FCE7F1', compact: true },
  { id: 'b', x: 486, y: 128, skin: '#E3AD73', hair: '#221A15', style: 'short', shirt: '#2D7FE0', bg: '#DCEBFF', compact: true },
  { id: 'c', x: 716, y: 262, skin: '#F0C58F', hair: '#3A2A1F', style: 'bun', shirt: '#8C62E0', bg: '#ECE3FF' },
  { id: 'd', x: 352, y: 468, skin: '#8D5A2C', hair: '#151110', style: 'short', shirt: '#2FB58A', bg: '#DDF6EC', compact: true },
  { id: 'e', x: 642, y: 452, skin: '#B97B4E', hair: '#1A1411', style: 'long', shirt: '#E6A93A', bg: '#FFF1D6', compact: true },
];

const INTERESTS = [
  { id: 'design', label: 'Design', icon: Palette, x: 150, y: 96, tint: '#F276C8', compact: true },
  { id: 'coding', label: 'Coding', icon: Code2, x: 646, y: 70, tint: '#4FB3FF', compact: true },
  { id: 'startups', label: 'Startups', icon: Lightbulb, x: 728, y: 170, tint: '#FFC857' },
  { id: 'sports', label: 'Sports', icon: Trophy, x: 132, y: 322, tint: '#FFC857' },
  { id: 'music', label: 'Music', icon: Music, x: 742, y: 372, tint: '#4FB3FF', compact: true },
  { id: 'research', label: 'Research', icon: BookOpen, x: 214, y: 540, tint: '#8FC2F5', compact: true },
  { id: 'photo', label: 'Photography', icon: Camera, x: 590, y: 556, tint: '#8FC2F5' },
];

// Solid = the student belongs to that interest or campus; dotted = a shared
// thread between people or ideas. Read as "connected through interests".
const EDGES = [
  ['design', 'a', 'solid'], ['a', 'campus', 'solid'], ['a', 'sports', 'dot'], ['b', 'a', 'dot'],
  ['coding', 'b', 'solid'], ['b', 'campus', 'solid'], ['b', 'startups', 'dot'],
  ['startups', 'c', 'solid'], ['c', 'campus', 'solid'], ['c', 'music', 'dot'],
  ['sports', 'd', 'solid'], ['research', 'd', 'solid'], ['d', 'campus', 'solid'],
  ['e', 'campus', 'solid'], ['e', 'photo', 'solid'], ['music', 'e', 'solid'], ['d', 'e', 'dot'],
];

// A few calm travellers along student → campus lines.
const TRAVELLERS = [['a', 'campus', 7], ['e', 'campus', 9], ['c', 'campus', 11]];

const ALL = Object.fromEntries([CAMPUS, ...STUDENTS, ...INTERESTS].map((n) => [n.id, n]));

/** A soft curve between two points, bowing to one side so the web feels drawn, not plotted. */
function curve(a, b, i) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bow = (i % 2 === 0 ? 1 : -1) * 0.22;
  return `M${a.x} ${a.y} Q${mx - dy * bow} ${my + dx * bow} ${b.x} ${b.y}`;
}

/** A simple illustrated student: head, hair, shoulders. Deliberately not a portrait. */
function StudentAvatar({ s, className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill={s.bg} />
      <path d="M12 64c0-12 9-19 20-19s20 7 20 19Z" fill={s.shirt} />
      <rect x="28" y="38" width="8" height="8" rx="3" fill={s.skin} />
      {s.style === 'long' && <path d="M18 34c-2-15 5-23 14-23s16 8 14 23c-1 6-3 9-5 11H23c-2-2-4-5-5-11Z" fill={s.hair} />}
      <circle cx="32" cy="29" r="11" fill={s.skin} />
      {s.style === 'short' && <path d="M21 27c0-9 5-13 11-13s11 4 11 13c-3-4-7-6-11-6s-8 2-11 6Z" fill={s.hair} />}
      {s.style === 'long' && <path d="M21 27c1-8 6-12 11-12s10 4 11 12c-4-3-7-6-11-6s-7 3-11 6Z" fill={s.hair} />}
      {s.style === 'bun' && (
        <>
          <circle cx="32" cy="13" r="5" fill={s.hair} />
          <path d="M21 28c0-9 5-13 11-13s11 4 11 13c-3-4-7-6-11-6s-8 2-11 6Z" fill={s.hair} />
        </>
      )}
    </svg>
  );
}

/** Faint line drawing of a college building — the anchor everything connects to. */
function CampusBuilding() {
  return (
    <g fill="none" stroke="#5E8FC4" strokeWidth="1.2" strokeLinejoin="round" opacity="0.32">
      {/* clock tower */}
      <path d="M452 200 L470 176 L488 200 Z" />
      <rect x="455" y="200" width="30" height="52" />
      <circle cx="470" cy="220" r="7" />
      {/* main block and wings */}
      <rect x="400" y="252" width="140" height="70" />
      <rect x="340" y="272" width="60" height="50" />
      <rect x="540" y="272" width="60" height="50" />
      <path d="M396 252 L470 232 L544 252" />
      {/* windows */}
      {[352, 372, 552, 572].map((x) => <rect key={x} x={x} y="284" width="10" height="14" />)}
      {[414, 436, 492, 514].map((x) => <rect key={x} x={x} y="266" width="12" height="18" />)}
      {/* door and steps */}
      <path d="M462 322 V298 a8 8 0 0 1 16 0 V322" />
      <path d="M330 322 H610 M345 330 H595" />
    </g>
  );
}

/**
 * The hero's world: students on one campus, joined to it and to each other
 * through what they're into. `compact` recomposes it for narrow screens —
 * fewer people and interests, not the desktop picture shrunk.
 */
export default function CampusNetwork({ compact = false, reduced = false, className }) {
  const uid = useId().replace(/:/g, '');
  const students = compact ? STUDENTS.filter((s) => s.compact) : STUDENTS;
  const interests = compact ? INTERESTS.filter((i) => i.compact) : INTERESTS;
  const visible = new Set(['campus', ...students.map((s) => s.id), ...interests.map((i) => i.id)]);
  const edges = EDGES.filter(([a, b]) => visible.has(a) && visible.has(b));
  const pathId = (a, b) => `${uid}-${a}-${b}`;

  return (
    <div
      className={cn('relative aspect-[4/3] w-full', className)}
      role="img"
      aria-label="Students on one campus, connected to it and to each other through shared interests like design, coding, sports, music and research."
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#168BFF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#168BFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={CAMPUS.x - 10} cy={CAMPUS.y - 20} rx="300" ry="220" fill={`url(#${uid}-glow)`} />
        <CampusBuilding />

        {edges.map(([a, b, kind], i) => (
          <path
            key={`${a}-${b}`}
            id={pathId(a, b)}
            d={curve(ALL[a], ALL[b], i)}
            fill="none"
            pathLength="1"
            stroke={kind === 'solid' ? '#3FA3FF' : '#7CC4FF'}
            strokeOpacity={kind === 'solid' ? 0.55 : 0.4}
            strokeWidth={kind === 'solid' ? 1.4 : 1.6}
            strokeLinecap="round"
            strokeDasharray={kind === 'dot' ? '0.004 0.018' : undefined}
            className={kind === 'solid' ? 'cn-draw' : 'cn-fade'}
            style={{ animationDelay: `${0.15 + i * 0.07}s` }}
          />
        ))}

        {/* Resting junction dots, a couple breathing. */}
        {edges.filter((_, i) => i % 3 === 0).map(([a, b], i) => {
          const A = ALL[a];
          const B = ALL[b];
          const x = (A.x + B.x) / 2;
          const y = (A.y + B.y) / 2;
          return (
            <g key={`dot-${a}-${b}`}>
              {i % 2 === 0 && <circle cx={x} cy={y} r="4" fill="#29B6F6" className="cn-pulse" style={{ animationDelay: `${i * 0.9}s` }} />}
              <circle cx={x} cy={y} r="3" fill="#29B6F6" />
            </g>
          );
        })}

        {/* Hand-drawn arrows for the two margin notes (desktop only). */}
        {!compact && (
          <g fill="none" stroke="#9AAAC0" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="cn-fade" style={{ animationDelay: '1.4s' }}>
            <path d="M176 452 C 228 478, 276 482, 318 470" />
            <path d="M308 463 L319 470 L308 476" />
            <path d="M452 514 C 458 506, 466 500, 478 496" />
            <path d="M469 494 L479 496 L473 504" />
          </g>
        )}

        {!reduced && TRAVELLERS.filter(([a]) => visible.has(a)).map(([a, b, dur]) => (
          <circle key={`t-${a}`} r="2.6" fill="#7FE3F0">
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" rotate="auto">
              <mpath href={`#${pathId(a, b)}`} />
            </animateMotion>
          </circle>
        ))}
      </svg>

      {/* Campus anchor */}
      <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={pos(CAMPUS.x, CAMPUS.y)} aria-hidden="true">
        <span className={cn('grid place-items-center rounded-full border-2 border-[#168BFF] bg-[#0B2342] text-[#CFE6FF] shadow-[0_0_0_6px_rgba(22,139,255,0.12)]', compact ? 'h-11 w-11' : 'h-16 w-16')}>
          <Landmark className={compact ? 'h-5 w-5' : 'h-7 w-7'} strokeWidth={1.6} />
        </span>
        <span className={cn('mt-1.5 whitespace-nowrap rounded-md bg-[#168BFF] font-semibold text-white', compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm')}>
          Your Campus
        </span>
      </div>

      {/* Students */}
      {students.map((s) => (
        <div
          key={s.id}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={pos(s.x, s.y)}
          aria-hidden="true"
        >
          <StudentAvatar
            s={s}
            className={cn(
              'rounded-full ring-2 ring-white/25 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105',
              compact ? 'h-9 w-9' : 'h-14 w-14'
            )}
          />
        </div>
      ))}

      {/* Interests */}
      {interests.map((t, i) => (
        <div
          key={t.id}
          className={cn(
            'cn-float absolute flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#2A5A8F]/70 bg-[#0B1A30]/85 font-medium text-[#DCE8F8] shadow-[0_6px_18px_-10px_rgba(0,0,0,0.8)]',
            compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-[13px]'
          )}
          style={{ ...pos(t.x, t.y), animationDelay: `${i * 0.8}s` }}
          aria-hidden="true"
        >
          <t.icon className={compact ? 'h-3 w-3' : 'h-4 w-4'} style={{ color: t.tint }} strokeWidth={2} />
          {t.label}
        </div>
      ))}

      {/* Margin notes, in the brand's handwriting face — what the drawing means. */}
      {!compact && (
        <>
          <p className="cn-fade absolute -rotate-3 whitespace-nowrap font-hand text-xl leading-none text-[#A6B4C8]" style={{ ...pos(34, 420), animationDelay: '1.3s' }} aria-hidden="true">
            students from your college
          </p>
          <p className="cn-fade absolute -translate-x-1/2 rotate-2 whitespace-nowrap font-hand text-xl leading-none text-[#A6B4C8]" style={{ ...pos(412, 528), animationDelay: '1.5s' }} aria-hidden="true">
            a line = something you share
          </p>
        </>
      )}
    </div>
  );
}
