import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { AnimatedImage, placement, toScreen } from "./AnimatedImage";
import { Chips, Subtitle } from "./Subtitle";
import { incoming, outgoingScale, TransitionKind } from "./Transition";
import { LINES, SceneSpec } from "../data/storyboard";
import { FPS, W, YELLOW, clamp, easeInOut, easeOut, lerp, sinInOut } from "../theme";

type Props = { spec: SceneSpec; seqFrom: number; from: number; to: number; nextKind?: TransitionKind; captionEnd: number };

const cueStart = (line: string, cue = 0) => LINES[line].cues[cue]?.start ?? LINES[line].start;

export const Scene: React.FC<Props> = ({ spec, seqFrom, from, to, nextKind, captionEnd }) => {
  const g = useCurrentFrame() + seqFrom; // global frame
  const t = interpolate(g, [from, to], [0, 1], { ...clamp, easing: spec.ease === "out" ? easeOut : easeInOut });

  // camera: slow Ken Burns from → to (+ per-scene extras)
  let z = lerp(spec.from.z, spec.to.z, t);
  let x = lerp(spec.from.x, spec.to.x, t);
  const y = lerp(spec.from.y, spec.to.y, t);
  if (spec.pan) {
    const a = LINES[spec.pan.line].end - 6;
    const b = LINES[spec.pan.endLine].start + 18;
    x = lerp(spec.from.x, spec.to.x, interpolate(g, [a, b], [0, 1], { ...clamp, easing: sinInOut }));
  }
  if (spec.bumps) {
    LINES[spec.bumps.line].cues.forEach((c, i) => {
      z += spec.bumps!.amp * spring({ frame: g - c.start, fps: FPS, config: { damping: 22, stiffness: 160 } }) * (i === 0 ? 0.6 : 1);
    });
  }
  let dx = 0;
  if (spec.shake) {
    const s = g / FPS;
    dx = spec.shake * (Math.sin(2 * Math.PI * 1.35 * s) * 0.7 + Math.sin(2 * Math.PI * 2.6 * s + 1.1) * 0.3);
  }
  const p = placement(spec.mode, spec.size, { z, x, y }, dx);

  let filter = spec.grade.filter ?? "";
  if (spec.grade.brighten) {
    const b = interpolate(g, [from, from + 50], spec.grade.brighten, { ...clamp, easing: easeOut });
    filter += ` brightness(${b})`;
  }

  const inn = incoming(spec.transitionIn, g, from);
  const outScale = outgoingScale(nextKind, g, to);
  const scale = inn.scale * outScale;

  // highlights: each appears on its cue; earlier ones stay, dimmed
  const hl = (spec.highlights ?? []).map((h, i, all) => {
    const s0 = cueStart(h.line, h.cue) + (h.delay ?? 0);
    const next = all[i + 1] ? cueStart(all[i + 1].line, all[i + 1].cue) + (all[i + 1].delay ?? 0) : Infinity;
    const dim = Number.isFinite(next) ? interpolate(g, [next, next + 10], [1, 0.4], clamp) : 1;
    const a = interpolate(g, [s0 - 2, s0 + 8], [0, 1], clamp) * dim
      * interpolate(g, [captionEnd - 8, captionEnd], [1, 0], clamp);
    const pop = spring({ frame: g - s0, fps: FPS, config: { damping: 200, stiffness: 140 } });
    const [x0, y0] = toScreen(p, h.box[0], h.box[1]);
    const [x1, y1] = toScreen(p, h.box[2], h.box[3]);
    const pad = 10;
    // keep the outline inside the frame when a card sits at the image edge
    const L = Math.max(6, x0 - pad), R = Math.min(W - 6, x1 + pad);
    return a <= 0 ? null : (
      <div key={i} style={{
        position: "absolute", left: L, top: y0 - pad, width: R - L, height: y1 - y0 + pad * 2,
        borderRadius: h.radius ?? 22, border: `5px solid ${YELLOW}`, opacity: a,
        transform: `scale(${1.06 - 0.06 * pop})`, boxShadow: `0 0 26px rgba(255,213,74,0.55), inset 0 0 18px rgba(255,213,74,0.25)`,
      }} />
    );
  });

  return (
    <AbsoluteFill style={{ opacity: inn.opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "62% 40%" }}>
        <AnimatedImage src={spec.image} p={p} filter={filter} />
        {spec.grade.tint && (
          <AbsoluteFill style={{ background: spec.grade.tint, opacity: spec.grade.tintOpacity ?? 0.1, mixBlendMode: "soft-light" }} />
        )}
        {spec.grade.vignette && (
          <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,${spec.grade.vignette}) 100%)` }} />
        )}
        {hl}
      </AbsoluteFill>
      {spec.captions.map((c, i) => {
        const start = cueStart(c.line, c.cue);
        const nxt = spec.captions[i + 1];
        const end = nxt ? cueStart(nxt.line, nxt.cue) - 2 : captionEnd;
        return <Subtitle key={i} f={g} start={start} end={end} text={c.text} label={c.label} pos={c.pos} align={c.align} size={c.size} />;
      })}
      {spec.chips && (
        <Chips f={g} title={spec.chips.title} items={spec.chips.items} titleAt={LINES[spec.chips.line].start}
          at={LINES[spec.chips.line].cues.slice(1).map((c) => c.start)} end={captionEnd} />
      )}
    </AbsoluteFill>
  );
};
