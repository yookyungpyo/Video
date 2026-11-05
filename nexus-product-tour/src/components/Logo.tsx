import { T } from "../theme";

/** NEXUS AI mark: gradient tile with a node-linked "N" glyph. */
export const LogoMark: React.FC<{ size?: number; draw?: number }> = ({ size = 72, draw = 1 }) => {
  const len = 120;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id="nx" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={T.primary} />
          <stop offset="100%" stopColor={T.accent} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#nx)" />
      <rect x="2.5" y="2.5" width="59" height="59" rx="17.5" fill="none" stroke="rgba(255,255,255,0.35)" />
      <path
        d="M20 44 V20 L44 44 V20"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - draw)}
      />
      {[
        [20, 44],
        [20, 20],
        [44, 44],
        [44, 20],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4.2} fill="#FFFFFF" opacity={draw > i * 0.25 ? 1 : 0} />
      ))}
    </svg>
  );
};

export const Wordmark: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <span style={{ fontFamily: T.font, fontWeight: 800, fontSize: size, letterSpacing: "0.08em", color: T.text }}>
    NEXUS<span style={{ color: T.accent, marginLeft: "0.28em" }}>AI</span>
  </span>
);
