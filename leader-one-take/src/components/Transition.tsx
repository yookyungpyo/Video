import React from "react";
import { AbsoluteFill } from "remotion";
import { CamMod } from "../camera/solve";
import { cameraMods, horizontal, seamAt, sign, whipOffsets } from "../camera/transition";
import { TransitionSpec } from "../config/types";
import { H, W } from "../config/video";

type View = (mod: CamMod) => React.ReactNode;
const SMEAR = 7;
/** Clip to the part of the frame the seam has already passed (`behind`, where the incoming picture is) or to the rest. */
const clip = (s: TransitionSpec, seam: number, behind: boolean) => {
  const L = horizontal(s) ? W : H;
  const at = Math.max(0, Math.min(L, seam));
  const [lo, hi] = (sign(s) > 0) === behind ? [0, at] : [at, L];
  return horizontal(s) ? `inset(0px ${L - hi}px 0px ${lo}px)` : `inset(${lo}px 0px ${L - hi}px 0px)`;
};

/**
 * A scene change. `a` is the outgoing picture, `b` the incoming one; both receive the camera change the
 * transition asks for. p runs 0 → 1 over the 12 overlap frames.
 *
 *   occluder  a dark, out-of-focus foreground shape crosses the lens; the cut happens behind it (hidden cut)
 *   glass     the frame of a glass wall crosses the lens; the next room is behind the glass (masking wipe)
 *   whip      both pictures travel in the same direction as one strip, with motion blur along that direction
 *   push      the push-in of `a` carries straight through into `b` (zoom-through match cut)
 */
export const Transition: React.FC<{ spec: TransitionSpec; p: number; a: View; b: View }> = ({ spec, p, a, b }) => {
  const mods = cameraMods(spec, p);
  const hz = horizontal(spec);

  if (spec.kind === "whip") {
    const o = whipOffsets(spec, p);
    const shift = (d: number) => (hz ? `translateX(${d}px)` : `translateY(${d}px)`);
    const strip = (
      <>
        <AbsoluteFill style={{ transform: shift(o.a), overflow: "hidden" }}>{a(mods.a)}</AbsoluteFill>
        <AbsoluteFill style={{ transform: shift(o.b), overflow: "hidden" }}>{b(mods.b)}</AbsoluteFill>
      </>
    );
    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {/* sharp copy underneath: a blur fades to transparent at the frame edge, and this keeps the edge from going dark */}
        <AbsoluteFill>{strip}</AbsoluteFill>
        {/* Motion blur along the travel axis only: the strip is squashed along that axis, blurred evenly, and
            stretched back — an even blur of r px becomes r × SMEAR px along the axis. */}
        {o.blur > 0.5 && (
          <AbsoluteFill style={{ transform: hz ? `scaleX(${SMEAR})` : `scaleY(${SMEAR})` }}>
            <AbsoluteFill style={{ filter: `blur(${(o.blur / SMEAR).toFixed(2)}px)` }}>
              <AbsoluteFill style={{ transform: hz ? `scaleX(${1 / SMEAR})` : `scaleY(${1 / SMEAR})` }}>{strip}</AbsoluteFill>
            </AbsoluteFill>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    );
  }

  if (spec.kind === "push") {
    // a keeps pushing in and dissolves over 4 frames in the middle while b arrives from the same push
    const blurA = 18 * p;
    const blurB = 16 * (1 - p);
    const mix = Math.min(1, Math.max(0, (p - 0.33) / 0.34));
    const grow = (blur: number) => `scale(${1 + (6 * blur) / W})`; // pushes the blur's transparent rim out of frame
    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <AbsoluteFill style={{ filter: `blur(${blurB}px)`, transform: grow(blurB) }}>{b(mods.b)}</AbsoluteFill>
        <AbsoluteFill style={{ filter: `blur(${blurA}px)`, transform: grow(blurA), opacity: 1 - mix }}>{a(mods.a)}</AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const isGlass = spec.kind === "glass";
  const barW = isGlass ? 26 : 780;
  const seam = seamAt(spec, p, barW / 2 + (isGlass ? 30 : 90));
  const along = (pos: number, size: number): React.CSSProperties => (hz ? { left: pos, top: -60, width: size, height: H + 120 } : { top: pos, left: -60, height: size, width: W + 120 });
  const dirDeg = hz ? 90 : 180;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ clipPath: clip(spec, seam, false) }}>{a(mods.a)}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: clip(spec, seam, true) }}>
        {b(mods.b)}
        {isGlass && (
          // reflection on the pane the camera is passing: strongest right behind the frame, gone 300 px later
          <div style={{ position: "absolute", ...along(sign(spec) > 0 ? seam - 320 : seam, 320), opacity: 0.9 * Math.sin(Math.PI * p),
            background: `linear-gradient(${sign(spec) > 0 ? dirDeg : dirDeg + 180}deg, rgba(200,225,255,0) 0%, rgba(200,225,255,0.10) 55%, rgba(235,245,255,0.30) 100%)` }} />
        )}
      </AbsoluteFill>
      {isGlass ? (
        <div style={{ position: "absolute", ...along(seam - barW / 2, barW), filter: "blur(1.5px)",
          background: `linear-gradient(${dirDeg}deg, rgba(190,210,235,0.75) 0%, #10151d 14%, #0a0d12 78%, rgba(150,170,200,0.6) 100%)`, boxShadow: "0 0 26px rgba(0,0,0,0.45)" }} />
      ) : (
        // the foreground shape is far out of focus, so it is only a soft dark mass, slightly tilted like a shoulder
        <div style={{ position: "absolute", ...along(seam - barW / 2, barW), filter: "blur(26px)", transform: hz ? "skewX(-7deg)" : "skewY(-3deg)",
          background: `linear-gradient(${dirDeg}deg, transparent 0%, ${spec.color ?? "#0b0d14"} 26%, ${spec.color ?? "#0b0d14"} 74%, transparent 100%)` }} />
      )}
    </AbsoluteFill>
  );
};
