import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease, lerp } from "../engine/easing";

export type TransitionKind = "none" | "fade" | "zoomIn" | "zoomOut" | "push" | "slideLeft" | "slideUp" | "mask";

type Props = {
  children: React.ReactNode;
  /** local frames of the enclosing Sequence */
  enter?: TransitionKind;
  enterDuration?: number;
  exit?: TransitionKind;
  exitStart?: number; // absolute frame (same clock as startFrame)
  exitDuration?: number;
  easing?: Ease;
  /** apply a light blur while moving (motion-blur stand-in) */
  motionBlur?: boolean;
  style?: CSSProperties;
  /** frame the entrance starts (defaults to 0 = start of enclosing Sequence) */
  startFrame?: number;
};

function look(kind: TransitionKind, p: number, dir: 1 | -1, blur: boolean) {
  // p: 0 = fully off, 1 = fully on
  const q = 1 - p;
  const b = blur ? q * 10 : 0;
  switch (kind) {
    case "fade":
      return { opacity: p };
    case "zoomIn": // comes from smaller (in) / leaves by growing (out)
      return { opacity: p, transform: `scale(${dir > 0 ? lerp(0.86, 1, p) : lerp(1.18, 1, p)})`, filter: b ? `blur(${b}px)` : undefined };
    case "zoomOut":
      return { opacity: p, transform: `scale(${dir > 0 ? lerp(1.14, 1, p) : lerp(0.82, 1, p)})`, filter: b ? `blur(${b}px)` : undefined };
    case "push":
      return { opacity: p, transform: `translateY(${dir * q * 120}px) scale(${lerp(0.96, 1, p)})`, filter: b ? `blur(${b * 0.6}px)` : undefined };
    case "slideLeft":
      return { opacity: p, transform: `translateX(${dir * q * 260}px)`, filter: b ? `blur(${b * 0.5}px)` : undefined };
    case "slideUp":
      return { opacity: p, transform: `translateY(${dir * q * 80}px)` };
    case "mask": {
      const r = lerp(0, 150, p);
      return {
        clipPath: `circle(${r}% at 50% 50%)`,
        WebkitClipPath: `circle(${r}% at 50% 50%)`,
      } as CSSProperties;
    }
    default:
      return {};
  }
}

/** Wraps a scene with an entrance and an exit treatment (all frame-driven). */
export const SceneTransition: React.FC<Props> = ({
  children,
  enter = "fade",
  enterDuration = 16,
  exit = "none",
  exitStart,
  exitDuration = 16,
  easing = ease.inOut,
  motionBlur = false,
  style,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame() - startFrame;
  const pin = enter === "none" ? 1 : easing(clamp01(frame / enterDuration));
  const pout = exit === "none" || exitStart === undefined ? 1 : 1 - easing(clamp01((frame + startFrame - exitStart) / exitDuration));
  const a = look(enter, pin, 1, motionBlur) as CSSProperties;
  const b = look(exit, pout, -1, motionBlur) as CSSProperties;
  const opacity = Number(a.opacity ?? 1) * Number(b.opacity ?? 1);
  if (opacity <= 0.001) return null;
  const transform = [a.transform, b.transform].filter(Boolean).join(" ") || undefined;
  const filter = [a.filter, b.filter].filter(Boolean).join(" ") || undefined;
  return (
    <AbsoluteFill
      style={{
        ...style,
        opacity,
        transform,
        filter,
        clipPath: a.clipPath ?? b.clipPath,
        WebkitClipPath: (a as any).WebkitClipPath ?? (b as any).WebkitClipPath,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
