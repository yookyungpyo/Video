import { interpolate } from "remotion";
import { H, W, clamp, easeIn, easeOut } from "../theme";

// Scene changes, comic style. A change is centred on the scene boundary; how strong it is follows the story:
//   slide-left / slide-right / slide-up   the next panel slides in and pushes the old one off the page
//   speed       the same, faster, with speed lines across the page
//   dim         the panel sinks into the dark and the next one comes up out of it (the low point)
//   flash       a burst of light; the next panel is simply there (the idea)
//   dissolve    a soft cross-fade (the ending)
export type Kind = "none" | "slide-left" | "slide-right" | "slide-up" | "speed" | "dim" | "flash" | "dissolve";
export const DUR: Record<Kind, number> = { none: 0, "slide-left": 12, "slide-right": 13, "slide-up": 14, speed: 9, dim: 22, flash: 8, dissolve: 18 };

/** Where the panel is and how visible the panel and its background are. */
export type PanelState = { x: number; y: number; rot: number; scale: number; alpha: number; bg: number };

const dir = (k: Kind): [number, number] => (k === "slide-up" ? [0, 1] : k === "slide-right" ? [-1, 0] : [1, 0]);
const sliding = (k: Kind) => k === "slide-left" || k === "slide-right" || k === "slide-up" || k === "speed";

export const progress = (g: number, at: number, kind: Kind) => (DUR[kind] ? interpolate(g, [at - DUR[kind] / 2, at + DUR[kind] / 2], [0, 1], clamp) : g >= at ? 1 : 0);

export const panelState = (g: number, from: number, to: number, inKind: Kind, outKind: Kind): PanelState => {
  const st: PanelState = { x: 0, y: 0, rot: 0, scale: 1, alpha: 1, bg: 1 };
  const pin = progress(g, from, inKind);
  const pout = progress(g, to, outKind);
  if (sliding(inKind)) {
    const e = 1 - easeOut(pin);
    const [dx, dy] = dir(inKind);
    st.x += dx * e * (W + 120);
    st.y += dy * e * (H * 0.75);
    st.rot += dx * e * 5;
    st.bg = pin;
  } else if (inKind === "dim") {
    st.alpha = st.bg = interpolate(pin, [0.5, 1], [0, 1], clamp);
  } else if (inKind === "flash") {
    st.alpha = st.bg = pin >= 0.5 ? 1 : 0;
    st.scale *= 1 + 0.05 * (1 - easeOut(interpolate(pin, [0.5, 1], [0, 1], clamp)));
  } else if (inKind === "dissolve") {
    st.alpha = st.bg = pin;
  }
  if (sliding(outKind)) {
    const e = easeIn(pout);
    const [dx, dy] = dir(outKind);
    st.x -= dx * e * (W + 120);
    st.y -= dy * e * (H * 0.75);
    st.rot -= dx * e * 5;
  } else if (outKind === "dim") {
    st.alpha *= 1 - interpolate(pout, [0, 0.5], [0, 1], clamp);
  }
  return st;
};
