import React from "react";
import { interpolate } from "remotion";
import { pop } from "../components/Fx";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { FONT, ICE, TITLE_CY, W, WHITE, clamp } from "../theme";
import { SceneProps } from "./common";

// 08 The question — the picture is already a split screen (AX on the left, AO on the right of the diagonal).
// Each half lights up as it is asked about; the four lines of the question build up in the middle of the frame,
// stay for a moment after the last word, and the scene fades slowly to black.
const LEFT = "polygon(0 0, 50% 0, 30.5% 100%, 0 100%)";
const RIGHT = "polygon(50% 0, 100% 0, 100% 100%, 30.5% 100%)";

export const Scene08: React.FC<SceneProps> = ({ g }) => {
  const { from, to, voiceEnd } = SCENE_T[8];
  const c = [cue(8, 0), cue(8, 1), cue(8, 2), cue(8, 3)];
  const up = (at: number) => interpolate(g, [at - 1, at + 6], [0, 1], clamp);
  // which half is dimmed: right while AX is asked about, left while AO is, neither at the very end
  const dimR = up(c[1]) * (1 - up(c[2] + 4));
  const dimL = up(c[3]) * (1 - interpolate(g, [voiceEnd + 4, voiceEnd + 18], [0, 1], clamp));
  const lines = [
    { at: c[0], text: "당신의 조직은", size: 44, color: "rgba(255,255,255,0.85)", weight: 700 },
    { at: c[1], text: "AI를 활용하는 조직인가?", size: 58, color: WHITE, weight: 800 },
    { at: c[2], text: "아니면", size: 44, color: "rgba(255,255,255,0.85)", weight: 700 },
    { at: c[3], text: "AI로 움직이는 조직인가?", size: 66, color: ICE, weight: 900 },
  ];
  const label = (text: string, sub: string, x: number, at: number, on: number) => {
    const a = up(at);
    if (a <= 0) return null;
    return (
      <div style={{ position: "absolute", left: x, top: TITLE_CY, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * pop(g, at, 13, 200)})`, opacity: a * (0.45 + 0.55 * on), textAlign: "center", fontFamily: FONT, whiteSpace: "nowrap" }}>
        <div style={{ fontWeight: 900, fontSize: 92, letterSpacing: -3, lineHeight: 1, color: on > 0.5 ? ICE : WHITE, textShadow: `0 4px 22px rgba(0,0,0,0.6)${on > 0.5 ? ", 0 0 28px rgba(120,200,255,0.55)" : ""}` }}>{text}</div>
        <div style={{ marginTop: 6, fontWeight: 700, fontSize: 30, letterSpacing: -0.5, color: "rgba(255,255,255,0.85)", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{sub}</div>
      </div>
    );
  };
  const axOn = 1 - up(c[3]);
  const aoOn = up(c[3]);
  return (
    <>
      <Stage n={8} g={g} glow={`rgba(120,200,255,${0.5 * aoOn})`} keys={[[from - 6, { z: 1.12, x: 0.5, y: 0.45 }], [voiceEnd, { z: 1.0, x: 0.5, y: 0.5 }]]}
        overlay={(p) => (
          <>
            <div style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, clipPath: LEFT, background: "rgba(6,10,22,0.62)", opacity: dimL }} />
            <div style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, clipPath: RIGHT, background: "rgba(6,10,22,0.62)", opacity: dimR }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "52%", opacity: up(c[0]), background: "linear-gradient(180deg, rgba(6,10,22,0) 0%, rgba(6,10,22,0.86) 34%, rgba(6,10,22,0.94) 100%)" }} />
          </>
        )}
        front={(p) => (
          <div style={{ position: "absolute", left: -40, right: -40, top: p.card.h * 0.635, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: FONT, textAlign: "center" }}>
            {lines.map((l, i) => {
              const a = up(l.at);
              const s = pop(g, l.at, 15, 170);
              return (
                <div key={i} style={{ opacity: a, transform: `translateY(${(1 - s) * 20}px)`, fontSize: l.size, fontWeight: l.weight, color: l.color, letterSpacing: -1.2, lineHeight: 1.18, whiteSpace: "nowrap",
                  textShadow: i === 3 ? "0 0 26px rgba(120,200,255,0.5), 0 3px 14px rgba(0,0,0,0.7)" : "0 3px 14px rgba(0,0,0,0.7)" }}>{l.text}</div>
              );
            })}
          </div>
        )} />
      {label("AX", "AI를 활용하는 조직", W / 2 - 215, c[0] + 4, axOn)}
      {label("AO", "AI로 움직이는 조직", W / 2 + 215, c[0] + 10, aoOn)}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: interpolate(g, [to - 22, to - 2], [0, 1], clamp) }} />
    </>
  );
};
