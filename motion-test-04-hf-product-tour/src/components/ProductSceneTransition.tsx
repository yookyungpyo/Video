import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease, lerp } from "../engine/easing";

export type ScreenTransition = "none" | "pushFromLeft" | "pushToRight" | "scaleIn" | "scaleOut" | "fade";

/**
 * In-phone page transition. Enter/exit kinds:
 *  pushFromLeft / pushToRight — horizontal navigation (Scene 02 → 03)
 *  scaleOut / scaleIn — the outgoing page recedes, the next settles in (03 → 04)
 */
export const ProductSceneTransition: React.FC<{
  children: React.ReactNode;
  width: number;
  enter?: ScreenTransition;
  enterStart?: number;
  enterDuration?: number;
  exit?: ScreenTransition;
  exitStart?: number;
  exitDuration?: number;
  easing?: Ease;
  style?: CSSProperties;
}> = ({ children, width, enter = "none", enterStart = 0, enterDuration = 24, exit = "none", exitStart = 1e9, exitDuration = 24, easing = ease.inOut, style }) => {
  const frame = useCurrentFrame();
  const pin = enter === "none" ? 1 : easing(clamp01((frame - enterStart) / enterDuration));
  const pout = exit === "none" ? 0 : easing(clamp01((frame - exitStart) / exitDuration));
  if (frame < enterStart && enter !== "none") return null;
  if (pout >= 1) return null;
  let tx = 0;
  let sc = 1;
  let op = 1;
  let blur = 0;
  if (enter === "pushFromLeft") tx += lerp(-width, 0, pin);
  if (enter === "scaleIn") { sc *= lerp(1.06, 1, pin); op *= pin; }
  if (enter === "fade") op *= pin;
  if (exit === "pushToRight") tx += lerp(0, width, pout);
  if (exit === "scaleOut") { sc *= lerp(1, 0.86, pout); op *= 1 - pout; blur = pout * 4; }
  if (exit === "fade") op *= 1 - pout;
  return (
    <AbsoluteFill style={{ transform: `translateX(${tx}px) scale(${sc})`, opacity: op, filter: blur > 0.05 ? `blur(${blur}px)` : undefined, background: "#FFFFFF", ...style }}>
      {children}
    </AbsoluteFill>
  );
};
