import React from "react";
import { interpolate } from "remotion";
import type { TransitionKind } from "../data/scenes";
import { W, clamp, easeInOut } from "../theme";

// How a scene comes in. cut = straight cut (comedy pacing); the others last 0.25–0.35 s.
export const T_FRAMES: Record<TransitionKind, number> = { cut: 0, fade: 10, push: 9, wipe: 9 };

export const transitionStyle = (g: number, from: number, to: number, inKind: TransitionKind, outKind: TransitionKind): React.CSSProperties => {
  const st: React.CSSProperties = {};
  const Di = T_FRAMES[inKind], Do = T_FRAMES[outKind];
  const pin = Di ? interpolate(g, [from - Di / 2, from + Di / 2], [0, 1], { ...clamp, easing: easeInOut }) : 1;
  const pout = Do ? interpolate(g, [to - Do / 2, to + Do / 2], [0, 1], { ...clamp, easing: easeInOut }) : 0;
  let tx = 0;
  if (inKind === "push") tx += (1 - pin) * W;
  if (inKind === "fade") st.opacity = pin;
  if (inKind === "wipe" && pin < 1) {
    const e = (1 - pin) * 112 - 6;
    st.WebkitMaskImage = st.maskImage = `linear-gradient(90deg, transparent ${e - 6}%, #000 ${e + 6}%)`;
  }
  if (outKind === "push") tx -= pout * W * 0.45;
  if (outKind === "push" || outKind === "wipe") st.filter = `brightness(${1 - 0.25 * pout})`;
  st.transform = `translateX(${tx}px)`;
  return st;
};
