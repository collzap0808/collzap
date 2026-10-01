/**
 * Deep navy with one soft glow behind the network and a barely-there campus
 * skyline — buildings, a dome, trees — along the bottom. Everything here is
 * low contrast on purpose: it sets the place, the foreground tells the story.
 */
export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#06101F_0%,#071426_55%,#09182A_100%)]" />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(55% 55% at 72% 42%, rgba(22,139,255,0.10), transparent 70%)' }}
      />

      <svg
        className="absolute inset-x-0 bottom-0 h-[26%] w-full opacity-60"
        viewBox="0 0 1440 300"
        preserveAspectRatio="xMidYMax slice"
      >
        <g fill="#0E2139" stroke="#1D3A5E" strokeWidth="1" opacity="0.75">
          {/* rolling ground */}
          <path d="M0 250 C 240 215, 480 245, 720 228 S 1200 205, 1440 232 V300 H0Z" stroke="none" fill="#0A1A2E" />
          {/* left hall */}
          <rect x="70" y="150" width="190" height="95" />
          <path d="M60 150 L165 118 L270 150" fill="none" />
          {/* dome */}
          <rect x="300" y="170" width="110" height="68" />
          <path d="M318 170 a37 37 0 0 1 74 0" />
          {/* library */}
          <rect x="1040" y="140" width="220" height="100" />
          <rect x="1130" y="96" width="40" height="44" />
          <path d="M1124 96 L1150 74 L1176 96" fill="none" />
          {/* block */}
          <rect x="1290" y="175" width="120" height="62" />
        </g>
        {/* windows, the faintest layer */}
        <g fill="#1D3A5E" opacity="0.55">
          {[90, 118, 146, 174, 202, 230].map((x) => <rect key={`l${x}`} x={x} y="172" width="12" height="16" />)}
          {[90, 118, 146, 174, 202, 230].map((x) => <rect key={`m${x}`} x={x} y="202" width="12" height="16" />)}
          {[1060, 1090, 1120, 1180, 1210, 1240].map((x) => <rect key={`r${x}`} x={x} y="165" width="12" height="18" />)}
          {[1060, 1090, 1120, 1180, 1210, 1240].map((x) => <rect key={`s${x}`} x={x} y="198" width="12" height="18" />)}
        </g>
        {/* trees */}
        <g fill="#0C1D33" opacity="0.9">
          {[[20, 205, 26], [285, 214, 20], [440, 208, 28], [500, 222, 18], [960, 212, 24], [1010, 220, 18], [1275, 210, 22], [1420, 208, 26]].map(([cx, cy, r]) => (
            <circle key={cx} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </svg>
    </div>
  );
}
