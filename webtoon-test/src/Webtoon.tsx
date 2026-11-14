import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Bubble, Item } from "./components/Bubble";
import data from "./data/panels.json";
import timing from "./data/timing.json";
import { BUBBLE_FONT, FPS, GAP, INK, NARR_FONT, PANEL_W, PANEL_X, PAPER, W, WINDOW, WINDOW_CY, clamp, easeInOut, fontCss } from "./theme";

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(h);
    const fonts = ['400 40px "Jua"', '400 40px "Black Han Sans"', '700 40px "Gaegu"', '700 40px "Pretendard"'];
    Promise.all(fonts.map((f) => (document as any).fonts.load(f, "가"))).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ---- the strip: title card, the panels, end card — stacked top to bottom like a webtoon episode ----
const TITLE_H = 760, END_H = 700;
const heights = timing.items.map((it) => (it.kind === "title" ? TITLE_H : it.kind === "end" ? END_H : Math.round((PANEL_W * data.panels[(it as { index: number }).index].h) / data.panels[(it as { index: number }).index].w)));
const tops: number[] = [];
heights.reduce((y, h, i) => ((tops[i] = y), y + h + GAP), 0);
const centers = heights.map((h, i) => tops[i] + h / 2);

/** which strip y sits in the middle of the window at frame g: stop on each item (with a slow drift), ease between */
const scrollAt = (g: number) => {
  const its = timing.items;
  for (let i = 0; i < its.length; i++) {
    const it = its[i];
    if (g <= it.leave) {
      if (g >= it.arrive || i === 0) return centers[i] + interpolate(g, [it.arrive, it.leave], [-8, 8], clamp);
      const prev = its[i - 1];
      return interpolate(g, [prev.leave, it.arrive], [centers[i - 1] + 8, centers[i] - 8], { ...clamp, easing: easeInOut });
    }
  }
  return centers[centers.length - 1] + 8;
};

const dots = (c: string, size = 14) => ({ backgroundImage: `radial-gradient(${c} 22%, transparent 24%)`, backgroundSize: `${size}px ${size}px` });

const TitleCard: React.FC<{ g: number; h: number }> = ({ g, h }) => {
  const s = spring({ frame: g - 4, fps: FPS, config: { damping: 13, stiffness: 160, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: PANEL_X, width: PANEL_W, height: h, border: `6px solid ${INK}`, background: PAPER, overflow: "hidden", boxShadow: "10px 10px 0 rgba(0,0,0,0.14)" }}>
      <div style={{ position: "absolute", inset: 0, ...dots("rgba(0,0,0,0.16)"), maskImage: "linear-gradient(160deg, #000 0%, transparent 55%)", WebkitMaskImage: "linear-gradient(160deg, #000 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}>
        <span style={{ fontFamily: NARR_FONT, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: PAPER, background: INK, padding: "8px 26px 10px" }}>{data.titleCard.kicker}</span>
        <div style={{ marginTop: 44, fontFamily: BUBBLE_FONT, fontSize: 150, lineHeight: 1.12, color: INK, whiteSpace: "pre", transform: `scale(${0.8 + 0.2 * s})`, opacity: Math.min(1, s * 1.5) }}>{data.titleCard.title}</div>
        <div style={{ marginTop: 40, fontFamily: "'Gaegu', sans-serif", fontWeight: 700, fontSize: 52, color: "#444", opacity: interpolate(g, [16, 26], [0, 1], clamp) }}>{data.titleCard.sub}</div>
      </div>
    </div>
  );
};

const EndCard: React.FC<{ f: number; h: number }> = ({ f, h }) => {
  const s = spring({ frame: f - 4, fps: FPS, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: PANEL_X, width: PANEL_W, height: h, border: `6px solid ${INK}`, background: INK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, ...dots("rgba(255,255,255,0.14)"), maskImage: "linear-gradient(340deg, #000 0%, transparent 60%)", WebkitMaskImage: "linear-gradient(340deg, #000 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center" }}>
        <div style={{ fontFamily: BUBBLE_FONT, fontSize: 112, lineHeight: 1.18, color: PAPER, whiteSpace: "pre", transform: `scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 1.5) }}>{data.endCard.title}</div>
        <div style={{ marginTop: 56, fontFamily: "'Gaegu', sans-serif", fontWeight: 700, fontSize: 56, color: "#cfcfcf", opacity: interpolate(f, [22, 32], [0, 1], clamp) }}>{data.endCard.sub}</div>
      </div>
    </div>
  );
};

export const Webtoon: React.FC = () => {
  const g = useCurrentFrame();
  const total = timing.totalFrames;
  const winH = WINDOW.bottom - WINDOW.top;
  const stripY = WINDOW_CY - WINDOW.top - scrollAt(g); // strip offset inside the window
  return (
    <AbsoluteFill style={{ background: "#141519" }}>
      <FontLoader />
      {/* the reading window: everything above y 350 and below y 1590 stays empty for the Instagram UI */}
      <div style={{ position: "absolute", left: 0, top: WINDOW.top, width: W, height: winH, overflow: "hidden", background: "#F4F2EC" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, transform: `translateY(${stripY}px)` }}>
          {timing.items.map((it, i) => {
            const y = tops[i], h = heights[i];
            if (y + stripY > winH + 200 || y + h + stripY < -200) return null; // off screen
            const f = g - it.arrive;
            if (it.kind === "title") return <div key={i} style={{ position: "absolute", top: y, left: 0, width: W, height: h }}><TitleCard g={g} h={h} /></div>;
            if (it.kind === "end") return <div key={i} style={{ position: "absolute", top: y, left: 0, width: W, height: h }}><EndCard f={f} h={h} /></div>;
            const p = data.panels[(it as { index: number }).index];
            return (
              <div key={i} style={{ position: "absolute", top: y, left: PANEL_X, width: PANEL_W, height: h }}>
                <div style={{ position: "absolute", inset: 0, border: `6px solid ${INK}`, background: PAPER, overflow: "hidden", boxShadow: "10px 10px 0 rgba(0,0,0,0.14)" }}>
                  <Img src={staticFile(p.file)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", transform: `scale(${interpolate(f, [-16, p.hold], [1.05, 1.0], clamp)})` }} />
                </div>
                {(p.items as Item[]).map((b, j) => <Bubble key={j} it={b} f={f} pw={PANEL_W} ph={h} />)}
              </div>
            );
          })}
        </div>
        {/* soft paper edges at the top and bottom of the window */}
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 26, background: "linear-gradient(180deg, rgba(20,21,25,0.35), rgba(20,21,25,0))" }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: 26, background: "linear-gradient(0deg, rgba(20,21,25,0.35), rgba(20,21,25,0))" }} />
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [0, 8], [1, 0], clamp) }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [total - 14, total], [0, 1], clamp) }} />
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
