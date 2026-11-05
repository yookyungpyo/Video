// Core motion primitive. Every component in the engine takes MotionProps and
// resolves them through useMotion() — all values are pure functions of frame.
import type { CSSProperties } from "react";
import { spring, useCurrentFrame, useVideoConfig, type SpringConfig } from "remotion";
import { type Ease, clamp01, ease, lerp } from "./easing";

type Range = number | [number, number];

export type MotionProps = {
  /** frame (relative to the enclosing Sequence) where the entrance starts */
  startFrame?: number;
  /** entrance length in frames */
  duration?: number;
  /** extra frames added to startFrame (handy for staggers) */
  delay?: number;
  easing?: Ease;
  /** use a Remotion spring instead of an easing curve */
  spring?: boolean | Partial<SpringConfig>;
  opacity?: Range;
  scale?: Range;
  translateX?: Range;
  translateY?: Range;
  rotation?: Range; // degrees
  blur?: Range; // px — cheap motion-blur stand-in during fast moves
  /** optional exit: values are the targets the element animates to */
  exit?: {
    startFrame: number;
    duration?: number;
    easing?: Ease;
    opacity?: number;
    scale?: number;
    translateX?: number;
    translateY?: number;
    rotation?: number;
    blur?: number;
  };
};

const from = (r: Range | undefined, d: number) => (r === undefined ? d : Array.isArray(r) ? r[0] : r);
const to = (r: Range | undefined, d: number) => (r === undefined ? d : Array.isArray(r) ? r[1] : r);

export function progressAt(
  frame: number,
  fps: number,
  { startFrame = 0, delay = 0, duration = 20, easing = ease.out, spring: sp }: MotionProps,
) {
  const local = frame - startFrame - delay;
  if (sp) {
    const cfg = typeof sp === "object" ? sp : {};
    return spring({ frame: local, fps, durationInFrames: duration, config: { damping: 200, ...cfg } });
  }
  return easing(clamp01(local / duration));
}

export function resolveMotion(frame: number, fps: number, m: MotionProps) {
  const p = progressAt(frame, fps, m);
  let opacity = lerp(from(m.opacity, 0), to(m.opacity, 1), clamp01(p));
  let scale = lerp(from(m.scale, 1), to(m.scale, 1), p);
  let tx = lerp(from(m.translateX, 0), to(m.translateX, 0), p);
  let ty = lerp(from(m.translateY, 0), to(m.translateY, 0), p);
  let rot = lerp(from(m.rotation, 0), to(m.rotation, 0), p);
  let blur = lerp(from(m.blur, 0), to(m.blur, 0), clamp01(p));
  if (m.exit) {
    const e = m.exit;
    const q = (e.easing ?? ease.inOut)(clamp01((frame - e.startFrame) / (e.duration ?? 16)));
    if (q > 0) {
      opacity = lerp(opacity, e.opacity ?? opacity, q);
      scale = lerp(scale, e.scale ?? scale, q);
      tx = lerp(tx, e.translateX ?? tx, q);
      ty = lerp(ty, e.translateY ?? ty, q);
      rot = lerp(rot, e.rotation ?? rot, q);
      blur = lerp(blur, e.blur ?? blur, q);
    }
  }
  const style: CSSProperties = {
    opacity,
    transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale}) rotate(${rot}deg)`,
    filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
  };
  return { progress: p, opacity, scale, tx, ty, rot, blur, style };
}

export function useMotion(m: MotionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return resolveMotion(frame, fps, m);
}

/** Generic animated wrapper — the base all engine components build on. */
export const Motion: React.FC<
  MotionProps & { children?: React.ReactNode; style?: CSSProperties; origin?: string }
> = ({ children, style, origin = "50% 50%", ...m }) => {
  const r = useMotion(m);
  if (r.opacity <= 0.001) return null;
  return <div style={{ ...style, ...r.style, transformOrigin: origin }}>{children}</div>;
};

/** Eased 0→1 progress helper for ad-hoc values inside components. */
export function useProgress(start: number, duration: number, easing: Ease = ease.out) {
  const frame = useCurrentFrame();
  return easing(clamp01((frame - start) / duration));
}
