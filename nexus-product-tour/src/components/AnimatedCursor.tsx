import { useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease, lerp } from "../engine/easing";

export type CursorPoint = { f: number; x: number; y: number; click?: boolean };

type Props = {
  points: CursorPoint[];
  startFrame?: number; // fade-in start (defaults to first point)
  endFrame?: number; // fade-out end
  easing?: Ease;
  scale?: number;
  opacity?: number;
};

/**
 * Pointer that glides between waypoints (eased, with a slight arc) and
 * shows a press + ripple on click points. Coordinates are in the parent's space.
 */
export const AnimatedCursor: React.FC<Props> = ({
  points,
  startFrame,
  endFrame,
  easing = ease.inOut,
  scale = 1,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const s0 = startFrame ?? points[0].f;
  const fadeIn = clamp01((frame - s0) / 8);
  const fadeOut = endFrame === undefined ? 1 : 1 - clamp01((frame - (endFrame - 8)) / 8);
  const o = fadeIn * fadeOut * opacity;
  if (o <= 0.001) return null;

  let x = points[0].x;
  let y = points[0].y;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const t = easing(clamp01((frame - a.f) / (b.f - a.f)));
      const arc = Math.sin(t * Math.PI) * Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.08);
      x = lerp(a.x, b.x, t);
      y = lerp(a.y, b.y, t) - arc;
    } else if (frame > b.f) {
      x = b.x;
      y = b.y;
    }
  }
  // press feedback
  let press = 0;
  let ripple: { p: number; x: number; y: number } | null = null;
  for (const pt of points) {
    if (!pt.click) continue;
    const d = frame - pt.f;
    if (d >= -3 && d <= 5) press = Math.max(press, 1 - Math.abs(d - 1) / 4);
    if (d >= 0 && d <= 18) ripple = { p: d / 18, x: pt.x, y: pt.y };
  }
  return (
    <>
      {ripple && (
        <div
          style={{
            position: "absolute",
            left: ripple.x - 28,
            top: ripple.y - 28,
            width: 56,
            height: 56,
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.8)",
            transform: `scale(${0.3 + ripple.p * 1.1})`,
            opacity: (1 - ripple.p) * o * 0.8,
            pointerEvents: "none",
            zIndex: 999,
          }}
        />
      )}
      <svg
        width={30}
        height={30}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: x - 4,
          top: y - 2,
          opacity: o,
          transform: `scale(${scale * (1 - press * 0.14)})`,
          transformOrigin: "4px 2px",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
          zIndex: 1000,
          overflow: "visible",
        }}
      >
        <path
          d="M4.5 2.5 L4.5 19.5 L9.2 15.2 L12.4 22 L15.3 20.7 L12.2 14 L18.6 14 Z"
          fill="#FFFFFF"
          stroke="#0B0D16"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};
