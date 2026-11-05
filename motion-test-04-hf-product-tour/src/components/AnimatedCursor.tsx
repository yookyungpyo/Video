import { useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease, lerp } from "../engine/easing";
import { HF } from "../theme";

export type CursorPoint = { f: number; x: number; y: number; tap?: boolean };

type Props = {
  points: CursorPoint[];
  startFrame?: number;
  endFrame?: number;
  easing?: Ease;
  scale?: number;
  opacity?: number;
  variant?: "touch" | "pointer";
  highlightColor?: string;
};

/**
 * Pointer that glides between waypoints. "touch" renders a fingertip disc
 * (mobile), "pointer" a desktop arrow. Taps show a press + ripple.
 */
export const AnimatedCursor: React.FC<Props> = ({
  points,
  startFrame,
  endFrame,
  easing = ease.inOut,
  scale = 1,
  opacity = 1,
  variant = "touch",
  highlightColor = HF.blue,
}) => {
  const frame = useCurrentFrame();
  const s0 = startFrame ?? points[0].f;
  const o = clamp01((frame - s0) / 8) * (endFrame === undefined ? 1 : 1 - clamp01((frame - (endFrame - 8)) / 8)) * opacity;
  if (o <= 0.001) return null;
  let x = points[0].x;
  let y = points[0].y;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const t = easing(clamp01((frame - a.f) / (b.f - a.f)));
      x = lerp(a.x, b.x, t);
      y = lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * Math.min(28, Math.hypot(b.x - a.x, b.y - a.y) * 0.1);
    } else if (frame > b.f) {
      x = b.x;
      y = b.y;
    }
  }
  let press = 0;
  let ripple: { p: number; x: number; y: number } | null = null;
  for (const pt of points) {
    if (!pt.tap) continue;
    const d = frame - pt.f;
    if (d >= -4 && d <= 6) press = Math.max(press, 1 - Math.abs(d - 1) / 5);
    if (d >= 0 && d <= 20) ripple = { p: d / 20, x: pt.x, y: pt.y };
  }
  return (
    <>
      {ripple && (
        <div
          style={{
            position: "absolute",
            left: ripple.x - 30,
            top: ripple.y - 30,
            width: 60,
            height: 60,
            borderRadius: 999,
            border: `3px solid ${highlightColor}`,
            transform: `scale(${0.4 + ripple.p * 1.3})`,
            opacity: (1 - ripple.p) * o * 0.9,
            zIndex: 50,
          }}
        />
      )}
      {variant === "touch" ? (
        <div
          style={{
            position: "absolute",
            left: x - 22,
            top: y - 22,
            width: 44,
            height: 44,
            borderRadius: 999,
            background: "rgba(32,33,36,0.28)",
            border: "2px solid rgba(255,255,255,0.9)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
            transform: `scale(${scale * (1 - press * 0.22)})`,
            opacity: o,
            zIndex: 51,
          }}
        />
      ) : (
        <svg width={28} height={28} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 4, top: y - 2, opacity: o, zIndex: 51, transform: `scale(${scale * (1 - press * 0.14)})` }}>
          <path d="M4.5 2.5 L4.5 19.5 L9.2 15.2 L12.4 22 L15.3 20.7 L12.2 14 L18.6 14 Z" fill={HF.text} stroke="#fff" strokeWidth={1.4} />
        </svg>
      )}
    </>
  );
};
