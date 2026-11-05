import { useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease } from "../engine/easing";
import { T } from "../theme";

type Pt = { x: number; y: number };

type Props = {
  from: Pt;
  to: Pt;
  /** frames: line draws during [startFrame+delay, +duration] */
  startFrame?: number;
  delay?: number;
  duration?: number;
  easing?: Ease;
  /** data pulse travels during [pulseStart, pulseEnd] */
  pulseStart?: number;
  pulseEnd?: number;
  /** curve bend (0 = straight) */
  bend?: number;
  color?: string;
  opacity?: number;
};

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

/**
 * SVG cubic connector that draws itself (dash offset) and carries a glowing
 * data packet. Geometry is computed analytically — no DOM measuring.
 */
export const AnimatedConnector: React.FC<Props> = ({
  from,
  to,
  startFrame = 0,
  delay = 0,
  duration = 18,
  easing = ease.inOut,
  pulseStart,
  pulseEnd,
  bend = 0,
  color = T.primary,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const draw = easing(clamp01((frame - startFrame - delay) / duration));
  if (draw <= 0) return null;
  const dx = (to.x - from.x) * 0.45;
  const c1 = { x: from.x + dx, y: from.y + bend };
  const c2 = { x: to.x - dx, y: to.y - bend };
  const d = `M${from.x},${from.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`;
  let len = 0;
  let prev = from;
  for (let i = 1; i <= 32; i++) {
    const p = bez(from, c1, c2, to, i / 32);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  const minX = Math.min(from.x, to.x) - 40;
  const minY = Math.min(from.y, to.y, c1.y, c2.y) - 40;
  const w = Math.abs(to.x - from.x) + 80;
  const h = Math.abs(Math.max(from.y, to.y, c1.y, c2.y) - minY) + 40;

  let pulse: Pt | null = null;
  let trail = 0;
  if (pulseStart !== undefined && pulseEnd !== undefined && frame >= pulseStart && frame <= pulseEnd + 6) {
    const t = ease.inOut(clamp01((frame - pulseStart) / (pulseEnd - pulseStart)));
    pulse = bez(from, c1, c2, to, t);
    trail = t;
  }
  const passed = pulseEnd !== undefined && frame > pulseEnd;
  const gid = `g${Math.round(from.x)}_${Math.round(to.x)}`;
  return (
    <svg
      style={{ position: "absolute", left: minX, top: minY, overflow: "visible", opacity }}
      width={w}
      height={h}
      viewBox={`${minX} ${minY} ${w} ${h}`}
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={T.primary} />
          <stop offset="100%" stopColor={T.accent} />
        </linearGradient>
      </defs>
      {/* base track */}
      <path d={d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={2} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      {/* energised segment behind the pulse */}
      <path
        d={d}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - (passed ? 1 : trail))}
        opacity={0.95}
      />
      {pulse && (
        <>
          <circle cx={pulse.x} cy={pulse.y} r={16} fill={color} opacity={0.18} />
          <circle cx={pulse.x} cy={pulse.y} r={7} fill="#FFFFFF" />
          <circle cx={pulse.x} cy={pulse.y} r={11} fill="none" stroke={T.accent} strokeWidth={2} opacity={0.8} />
        </>
      )}
    </svg>
  );
};
