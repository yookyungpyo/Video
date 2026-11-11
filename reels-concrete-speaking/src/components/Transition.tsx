import { interpolate } from "remotion";
import { W, clamp, easeInOut } from "../theme";

// Scene changes: 0.2–0.4 s (6–12 frames). push = the new shot pushes the old one out; wipe = soft-edged reveal; fade = crossfade.
export type TransitionKind = "none" | "push" | "wipe" | "fade";
export const T_FRAMES: Record<TransitionKind, number> = { none: 0, push: 10, wipe: 10, fade: 9 };

/** Style for a scene given the transition that brings it in and the one that takes it out. */
export const transitionStyle = (g: number, from: number, to: number, inKind: TransitionKind, outKind: TransitionKind): React.CSSProperties => {
  const st: React.CSSProperties = {};
  const Di = T_FRAMES[inKind];
  const Do = T_FRAMES[outKind];
  const pin = Di ? interpolate(g, [from - Di / 2, from + Di / 2], [0, 1], { ...clamp, easing: easeInOut }) : 1;
  const pout = Do ? interpolate(g, [to - Do / 2, to + Do / 2], [0, 1], { ...clamp, easing: easeInOut }) : 0;
  let tx = 0;
  let opacity = 1;
  if (inKind === "push") tx += (1 - pin) * W;
  if (inKind === "fade") opacity *= pin;
  if (inKind === "wipe" && pin < 1) {
    const e = (1 - pin) * 112 - 6; // % from the right, with a 6% feather
    st.WebkitMaskImage = st.maskImage = `linear-gradient(90deg, transparent ${e - 6}%, #000 ${e + 6}%)`;
  }
  if (outKind === "push") tx -= pout * W * 0.45; // the old shot slides out slower than the new one comes in (depth)
  if (outKind === "push" || outKind === "wipe") st.filter = `brightness(${1 - 0.25 * pout})`;
  st.transform = `translateX(${tx}px)`;
  st.opacity = opacity;
  return st;
};
