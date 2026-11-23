import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../components/Captions";
import { BrushWipe, brushOpenMask, inkSpreadMask } from "../components/Ink";
import { Extra, Stage } from "../components/Stage";
import { MOTION, keysOf } from "../config/motion";
import { SCENE_T, TIMING, VOICE_SYNCED } from "../data";
import { H, INK, PANEL, SANS, W, clamp, easeIn, easeOut, easeSine, fontCss } from "../theme";

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(h);
    const fonts = (document as any).fonts;
    Promise.all([...[700, 800].map((w) => fonts.load(`${w} 40px "Pretendard"`, "가")), fonts.load(`700 40px "Noto Serif KR"`, "가")])
      .then(() => fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

export const LeadershipBalance: React.FC = () => {
  const g = useCurrentFrame();
  const total = TIMING.totalFrames;
  /** 0 → 1 across the change into scene i (centred on its first frame) */
  const into = (i: number) => {
    const m = MOTION[i];
    if (!m || !m.enter.frames) return i === 0 ? 1 : g >= SCENE_T[m?.n]?.from ? 1 : 0;
    const f = SCENE_T[m.n].from;
    return interpolate(g, [f - m.enter.frames / 2, f + m.enter.frames / 2], [0, 1], clamp);
  };
  let brush = 0, paper = 0;
  const scenes = MOTION.map((m, i) => {
    const t = SCENE_T[m.n];
    const next = MOTION[i + 1];
    if (g < t.from - m.enter.frames / 2 - 1 || g > t.to + (next ? next.enter.frames / 2 : 0) + 1) return null;
    const p = into(i);                       // this scene coming in
    const q = next ? into(i + 1) : 0;        // the next one coming in = this one going out
    let alpha = 1;
    let mask: React.CSSProperties | undefined;
    let extra: Extra | undefined;
    if (p < 1) {
      if (m.enter.kind === "ink") { mask = inkSpreadMask(p); alpha = Math.min(1, p * 4); }
      if (m.enter.kind === "paper") { alpha = easeSine(p); paper = Math.sin(Math.PI * p); }
      if (m.enter.kind === "brush") { mask = brushOpenMask(p); brush = p; }
      if (m.enter.kind === "scale") { const e = 1 - easeOut(p); alpha = easeSine(p); extra = { spin: 9 * e, boost: 1 + 0.26 * e, pivot: m.pivotIn }; }
      if (m.enter.kind === "bridge") { const e = 1 - easeOut(p); alpha = interpolate(p, [0.25, 0.7], [0, 1], clamp); extra = { boost: 1 + 0.5 * e, blur: 9 * (1 - p), pivot: m.pivotIn }; }
    } else if (q > 0 && next) {
      if (next.enter.kind === "scale") { const e = easeIn(q); extra = { spin: -9 * e, boost: 1 + 0.3 * e, pivot: m.pivotOut }; }
      if (next.enter.kind === "bridge") { const e = easeIn(q); extra = { boost: 1 + 0.5 * e, blur: 9 * q, pivot: m.pivotOut }; }
    }
    return (
      <AbsoluteFill key={m.n} style={mask}>
        <Stage n={m.n} g={g} keys={keysOf(m.n)} alpha={alpha} extra={extra} depth={m.depth} rotateAt={m.rotateAt} />
      </AbsoluteFill>
    );
  });
  /** captions fade out as the change into the next scene begins and are gone just before the scene boundary */
  const exitLead = (scene: number) => (MOTION[MOTION.findIndex((m) => m.n === scene) + 1] ? 2 : 0);
  const wash = staticFile("textures/wash.png");
  return (
    <AbsoluteFill style={{ background: INK }}>
      <FontLoader />
      {scenes}
      <BrushWipe p={brush} />
      {/* black ink closes the picture above and below with an irregular wet edge (the areas Instagram covers stay empty) */}
      <Img src={wash} style={{ position: "absolute", left: 0, top: PANEL.y - 108, width: W, height: 220 }} />
      <Img src={wash} style={{ position: "absolute", left: 0, top: PANEL.y + PANEL.h - 112, width: W, height: 220, transform: "scale(-1, -1)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: PANEL.y - 100, background: INK }} />
      <div style={{ position: "absolute", left: 0, top: PANEL.y + PANEL.h + 100, width: W, height: H - PANEL.y - PANEL.h - 100, background: INK }} />
      {/* paper grain over everything; it comes up for a moment in the paper dissolves */}
      <Img src={staticFile("textures/grain.jpg")} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, mixBlendMode: "overlay", opacity: 0.42 + 0.5 * paper }} />
      <Captions g={g} exitLead={exitLead} />
      {/* in from black; after the last words everything holds, then fades to black */}
      <AbsoluteFill style={{ background: INK, opacity: interpolate(g, [0, 8], [1, 0], clamp) }} />
      <AbsoluteFill style={{ background: INK, opacity: interpolate(g, [total - 20, total - 1], [0, 1], { ...clamp, easing: easeSine }) }} />
      {!VOICE_SYNCED && (
        <div style={{ position: "absolute", left: 90, top: 400, padding: "10px 18px", borderRadius: 10, background: "rgba(150,30,30,0.92)", color: "#fff", fontFamily: SANS, fontWeight: 700, fontSize: 30 }}>
          무음 미리보기 · 임시 타이밍 (내레이션 필요)
        </div>
      )}
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
