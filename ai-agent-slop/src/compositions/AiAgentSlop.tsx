import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../components/Captions";
import { Extra, Stage } from "../components/Stage";
import { FX } from "../config/effects";
import { MOTION, keysOf } from "../config/motion";
import { SCENE_T, VOICE_SYNCED } from "../data";
import { BG, PANEL, SANS, W, clamp, easeIn, easeInOut, easeOut, fontCss } from "../theme";

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(h);
    const fonts = (document as any).fonts;
    Promise.all([600, 700, 800, 900].map((w) => fonts.load(`${w} 40px "Pretendard"`, "가A"))).then(() => fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

/** A red stage curtain drawn in code: two halves that close over the picture window (c = 1) and open again. */
const Curtain: React.FC<{ c: number }> = ({ c }) => {
  if (c <= 0.001) return null;
  const half = (side: -1 | 1) => (
    <div style={{ position: "absolute", top: -20, height: PANEL.h + 40, width: W / 2 + 60, [side < 0 ? "left" : "right"]: -30, transform: `translateX(${side * (1 - c) * 104}%)`,
      background: "repeating-linear-gradient(90deg, #3a070b 0px, #8f1a22 26px, #b3242d 40px, #6b1118 62px, #2c0508 88px)", boxShadow: "0 0 60px 20px rgba(0,0,0,0.55)" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)" }} />
    </div>
  );
  return <div style={{ position: "absolute", left: 0, top: PANEL.y, width: W, height: PANEL.h, overflow: "hidden" }}>{half(-1)}{half(1)}</div>;
};

export const AiAgentSlop: React.FC = () => {
  const g = useCurrentFrame();
  /** 0 → 1 across the change into scene i (centred on its first frame); cuts jump from 0 to 1 */
  const into = (i: number) => {
    const m = MOTION[i];
    if (!m) return 0;
    const f = SCENE_T[m.n].from;
    return m.enter.frames ? interpolate(g, [f - m.enter.frames / 2, f + m.enter.frames / 2], [0, 1], clamp) : g >= f ? 1 : 0;
  };
  let curtain = 0;
  const scenes = MOTION.map((m, i) => {
    const t = SCENE_T[m.n];
    const next = MOTION[i + 1];
    if (g < t.from - m.enter.frames / 2 - 1 || g > t.to + (next ? next.enter.frames / 2 : 0) + 1) return null;
    const p = into(i);                       // this scene coming in
    const q = next ? into(i + 1) : 0;        // the next one coming in = this one going out
    let alpha = p > 0 ? 1 : 0;
    let extra: Extra | undefined;
    if (p < 1) {
      const swapped = p >= 0.5 ? 1 : 0;
      switch (m.enter.kind) {
        case "flash": alpha = swapped; extra = { light: 1 + 2.4 * (1 - Math.abs(2 * p - 1)) }; break;
        case "whip": alpha = 1; extra = { shiftX: W * (1 - easeInOut(p)), blur: 12 * Math.sin(Math.PI * p) }; break;
        case "curtain": alpha = swapped; curtain = p < 0.5 ? easeInOut(Math.min(1, p / 0.42)) : 1 - easeInOut(Math.max(0, (p - 0.58) / 0.42)); break;
        case "lights-out": alpha = swapped; extra = { light: interpolate(p, [0.5, 1], [0.1, 1], clamp) }; break;
        case "match": { const e = 1 - easeOut(p); alpha = interpolate(p, [0.25, 0.7], [0, 1], clamp); extra = { boost: 1 + 0.5 * e, blur: 9 * (1 - p), pivot: m.pivotIn }; break; }
        case "dip": alpha = swapped; extra = { light: interpolate(p, [0.5, 1], [0.05, 1], clamp) }; break;
      }
    } else if (q > 0 && q < 1 && next) {
      switch (next.enter.kind) {
        case "flash": extra = { light: 1 + 2.4 * (1 - Math.abs(2 * q - 1)) }; break;
        case "whip": extra = { shiftX: -W * easeInOut(q), blur: 12 * Math.sin(Math.PI * q) }; break;
        case "lights-out": extra = { light: interpolate(q, [0, 0.12, 0.24, 0.36, 0.5], [1, 0.5, 0.85, 0.3, 0.1], clamp) }; break;   // flicker, then off
        case "match": { const e = easeIn(q); extra = { boost: 1 + 0.5 * e, blur: 9 * q, pivot: m.pivotOut }; break; }
        case "dip": extra = { light: interpolate(q, [0, 0.5], [1, 0.05], clamp) }; break;
      }
    }
    return <Stage key={m.n} n={m.n} g={g} keys={keysOf(m.n)} alpha={alpha} extra={extra} fx={FX[m.n]?.(g)} />;
  });
  /** captions are gone before the change into the next scene covers the picture */
  const exitLead = (scene: number) => {
    const next = MOTION[MOTION.findIndex((m) => m.n === scene) + 1];
    return next ? Math.max(2, Math.round(next.enter.frames / 2)) : 0;
  };
  return (
    <AbsoluteFill style={{ background: BG }}>
      <FontLoader />
      {scenes}
      <Curtain c={curtain} />
      {/* the picture melts into the dark page above and below (the areas Instagram covers stay empty) */}
      <div style={{ position: "absolute", left: 0, top: PANEL.y - 1, width: W, height: 86, background: `linear-gradient(to bottom, ${BG} 0%, rgba(7,7,10,0) 100%)` }} />
      <div style={{ position: "absolute", left: 0, top: PANEL.y + PANEL.h - 85, width: W, height: 86, background: `linear-gradient(to top, ${BG} 0%, rgba(7,7,10,0) 100%)` }} />
      <Captions g={g} exitLead={exitLead} />
      {!VOICE_SYNCED && (
        <div style={{ position: "absolute", left: 90, top: 400, padding: "10px 18px", borderRadius: 10, background: "rgba(150,30,30,0.92)", color: "#fff", fontFamily: SANS, fontWeight: 700, fontSize: 30 }}>
          무음 미리보기 · 임시 타이밍 (내레이션 필요)
        </div>
      )}
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
