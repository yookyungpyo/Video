import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Dialogue } from "../components/Dialogue";
import { Extra, Stage } from "../components/Stage";
import { FX, UI } from "../config/game";
import { MOTION, keysOf } from "../config/motion";
import { LAST, SCENE_T, VOICE_SYNCED } from "../data";
import { BG, GOLD, NAVY, PANEL, SANS, W, clamp, easeInOut, fontCss } from "../theme";

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(h);
    const fonts = (document as any).fonts;
    Promise.all([...[700, 800, 900].map((w) => fonts.load(`${w} 40px "Pretendard"`, "가A")), fonts.load(`400 20px "Press Start 2P"`, "A0▶")]).then(() => fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

/** Pixel blocks that cover the picture diagonal by diagonal (p 0 → 0.5) and uncover it again (0.5 → 1). */
const Blocks: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0 || p >= 1) return null;
  const [cols, rows] = [9, 13];
  const [cw, ch] = [PANEL.w / cols, PANEL.h / rows];
  return (
    <div style={{ position: "absolute", left: 0, top: PANEL.y, width: W, height: PANEL.h, overflow: "hidden" }}>
      {Array.from({ length: cols * rows }, (_, k) => {
        const [i, j] = [k % cols, Math.floor(k / cols)];
        const d = ((i + j) / (cols + rows - 2)) * 0.6;
        const cover = interpolate(p * 2, [d, d + 0.4], [0, 1], clamp);
        const open = interpolate((p - 0.5) * 2, [d, d + 0.4], [0, 1], clamp);
        const s = p < 0.5 ? cover : 1 - open;
        if (s <= 0.001) return null;
        return <div key={k} style={{ position: "absolute", left: i * cw - 1, top: j * ch - 1, width: cw + 2, height: ch + 2, background: NAVY, transform: `scale(${s})`, boxShadow: s < 1 ? `inset 0 0 0 4px ${GOLD}` : undefined }} />;
      })}
    </div>
  );
};

export const OrganizationBrand: React.FC = () => {
  const g = useCurrentFrame();
  /** 0 → 1 across the change into scene i (centred on its first frame); the first scene has none */
  const into = (i: number) => {
    const m = MOTION[i];
    if (!m) return 0;
    const f = SCENE_T[m.n].from;
    return m.enter.frames ? interpolate(g, [f - m.enter.frames / 2, f + m.enter.frames / 2], [0, 1], clamp) : g >= f ? 1 : 0;
  };
  let blocks = 0;
  const scenes = MOTION.map((m, i) => {
    const t = SCENE_T[m.n];
    const next = MOTION[i + 1];
    if (g < t.from - m.enter.frames / 2 - 1 || g > t.to + (next ? next.enter.frames / 2 : 0) + 1) return null;
    const p = into(i);                       // this scene coming in
    const q = next ? into(i + 1) : 0;        // the next one coming in = this one going out
    let alpha = p > 0 ? 1 : 0;
    let extra: Extra | undefined;
    let mask: React.CSSProperties | undefined;
    if (p < 1) {
      const swapped = p >= 0.5 ? 1 : 0;
      switch (m.enter.kind) {
        case "blocks": alpha = swapped; blocks = p; break;
        case "whip": alpha = 1; extra = { shiftX: W * (1 - easeInOut(p)), blur: 12 * Math.sin(Math.PI * p) }; break;
        case "push": alpha = 1; extra = { shiftY: -PANEL.h * (1 - easeInOut(p)), blur: 7 * Math.sin(Math.PI * p) }; break;
        case "iris": { const r = easeInOut(p) * 1150; const im = `radial-gradient(circle at 50% 50%, #000 ${Math.max(0, r - 4)}px, transparent ${r}px)`; mask = { WebkitMaskImage: im, maskImage: im }; break; }
        case "flash": alpha = swapped; extra = { light: 1 + 2.6 * (1 - Math.abs(2 * p - 1)) }; break;
      }
    } else if (q > 0 && q < 1 && next) {
      switch (next.enter.kind) {
        case "whip": extra = { shiftX: -W * easeInOut(q), blur: 12 * Math.sin(Math.PI * q) }; break;
        case "push": extra = { shiftY: PANEL.h * easeInOut(q), blur: 7 * Math.sin(Math.PI * q) }; break;
        case "flash": extra = { light: 1 + 2.6 * (1 - Math.abs(2 * q - 1)) }; break;
      }
    }
    return (
      <AbsoluteFill key={m.n} style={mask}>
        <Stage n={m.n} g={g} keys={keysOf(m.n)} alpha={alpha} extra={extra} fx={FX[m.n]?.(g)} />
      </AbsoluteFill>
    );
  });
  /** last frame on which a scene's screen UI is visible: it is gone before the change into the next scene */
  const endOf = (scene: number) => {
    const next = MOTION[MOTION.findIndex((m) => m.n === scene) + 1];
    return next ? SCENE_T[scene].to - Math.max(2, Math.round(next.enter.frames / 2)) : SCENE_T[scene].to + 9999;
  };
  const now = MOTION.find((m) => g >= SCENE_T[m.n].from && g < SCENE_T[m.n].to) ?? MOTION[MOTION.length - 1];
  // the dialogue window closes a moment after the last words, so that only the question is left at the end
  const dialogueEnd = (scene: number) => (scene === LAST ? SCENE_T[LAST].voiceEnd + 14 : endOf(scene));
  return (
    <AbsoluteFill style={{ background: BG }}>
      <FontLoader />
      {scenes}
      <Blocks p={blocks} />
      {/* the picture melts into the dark page above and below */}
      <div style={{ position: "absolute", left: 0, top: PANEL.y - 1, width: W, height: 70, background: `linear-gradient(to bottom, ${BG} 0%, rgba(14,10,32,0) 100%)` }} />
      <div style={{ position: "absolute", left: 0, top: PANEL.y + PANEL.h - 69, width: W, height: 70, background: `linear-gradient(to top, ${BG} 0%, rgba(14,10,32,0) 100%)` }} />
      {g <= endOf(now.n) && UI[now.n]?.(g, endOf(now.n))}
      <Dialogue g={g} endOf={dialogueEnd} />
      <AbsoluteFill style={{ background: BG, opacity: interpolate(g, [0, 6], [1, 0], clamp) }} />
      {!VOICE_SYNCED && (
        <div style={{ position: "absolute", left: 90, top: 460, padding: "10px 18px", borderRadius: 10, background: "rgba(150,30,30,0.92)", color: "#fff", fontFamily: SANS, fontWeight: 700, fontSize: 30 }}>
          무음 미리보기 · 임시 타이밍 (내레이션 필요)
        </div>
      )}
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
