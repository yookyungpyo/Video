import React from "react";
import { interpolate } from "remotion";
import { pop, Pulse } from "../components/Fx";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { FONT, ICE, TITLE_CY, W, WHITE, clamp, easeInOut } from "../theme";
import { SceneProps } from "./common";

// 07 The human's part — calm camera. The agents' done marks tick in while he sets the goal, a review scan runs
// over the results, and one press of "승인" is the decision. Title: 목표 · 검토 · 결정 lighting up in turn.
const GREEN = "#8CF0B4";
const STEPS = ["목표", "검토", "결정"];

export const Scene07: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[7];
  const c = [cue(7, 0), cue(7, 1), cue(7, 2), cue(7, 3)];
  const end = to + 6;
  const swap = c[3] + 2;
  const stepsA = interpolate(g, [c[0] - 1, c[0] + 6], [0, 1], clamp) * interpolate(g, [swap - 6, swap], [1, 0], clamp);
  const lastA = interpolate(g, [swap, swap + 6], [0, 1], clamp) * interpolate(g, [to - 2, to + 4], [1, 0], clamp);
  return (
    <>
      <Stage n={7} g={g} keys={[
        [from - 6, { z: 1.0, x: 0.5, y: 0.5 }],
        [c[1] + 6, { z: 1.1, x: 0.6, y: 0.4 }],
        [c[2] + 14, { z: 1.16, x: 0.66, y: 0.44 }],
        [end, { z: 1.03, x: 0.5, y: 0.48 }],
      ]} overlay={(p) => {
        const [l, t] = p.P(0.47, 0.06);
        const [r, b] = p.P(0.975, 0.63);
        const scan = interpolate(g, [c[1] + 2, c[2] - 6], [0, 1], { ...clamp, easing: easeInOut });
        const scanA = interpolate(g, [c[1], c[1] + 4], [0, 1], clamp) * interpolate(g, [c[2] - 8, c[2] - 2], [1, 0], clamp);
        return (
          <>
            {[0.18, 0.255, 0.325].map((y, i) => {
              const [x, yy] = p.P(0.528, y);
              return <Pulse key={i} g={g} at={c[0] + 8 + i * 13} until={c[1] + 6} x={x} y={yy} r={0.042 * p.wi} color={GREEN} loop={22} />;
            })}
            {scanA > 0 && (
              <div style={{ position: "absolute", left: l, top: t, width: r - l, height: b - t, opacity: scanA, overflow: "hidden", borderRadius: 26 }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: WHITE, boxShadow: `0 0 26px 8px ${ICE}` }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${scan * 100}%`, background: "linear-gradient(180deg, rgba(155,220,255,0), rgba(155,220,255,0.22))" }} />
              </div>
            )}
            {[0.57, 0.835].map((x, i) => {
              const at = c[1] + 14 + i * 12;
              const a = interpolate(g, [at - 1, at + 4], [0, 1], clamp) * interpolate(g, [c[2] + 4, c[2] + 12], [1, 0], clamp);
              if (a <= 0) return null;
              const [x0, y0] = p.P(x - 0.105, 0.365);
              const [x1, y1] = p.P(x + 0.105, 0.58);
              return <div key={`r${i}`} style={{ position: "absolute", left: x0, top: y0, width: x1 - x0, height: y1 - y0, borderRadius: 18, border: `4px solid ${ICE}`, boxShadow: `0 0 20px ${ICE}`, opacity: a }} />;
            })}
          </>
        );
      }} front={(p) => {
        const at = c[2] + 6;
        if (g < at - 1) return null;
        const [x, y] = p.P(0.72, 0.715);
        const s = pop(g, at, 11, 220);
        const press = interpolate(g, [at + 14, at + 18, at + 24], [0, 1, 0], clamp);
        const a = interpolate(g, [at - 1, at + 3], [0, 1], clamp) * interpolate(g, [end - 6, end], [1, 0], clamp);
        const ring = interpolate(g, [at + 18, at + 40], [0, 1], clamp);
        return (
          <>
            {ring > 0 && ring < 1 && <div style={{ position: "absolute", left: x - 150, top: y - 55, width: 300, height: 110, borderRadius: 55, border: `4px solid ${GREEN}`, opacity: (1 - ring) * a, transform: `scale(${1 + 0.5 * ring})` }} />}
            <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * s) * (1 - 0.08 * press)})`, opacity: a, padding: "16px 40px 20px", borderRadius: 40,
              background: g >= at + 18 ? "linear-gradient(180deg,#3FD689,#27B36B)" : "linear-gradient(180deg,#2B3B5C,#1B2742)", border: `3px solid ${g >= at + 18 ? "#B8F7D2" : "rgba(155,220,255,0.6)"}`,
              color: WHITE, fontFamily: FONT, fontWeight: 900, fontSize: 46, letterSpacing: -1, whiteSpace: "nowrap", boxShadow: "0 12px 30px rgba(0,0,0,0.5), 0 0 28px rgba(140,240,180,0.35)" }}>
              {g >= at + 18 ? "승인 ✓" : "승인"}
            </div>
          </>
        );
      }} />
      {stepsA > 0 && (
        <div style={{ position: "absolute", left: 0, width: W, top: TITLE_CY, transform: "translateY(-50%)", display: "flex", justifyContent: "center", alignItems: "center", gap: 26, opacity: stepsA, fontFamily: FONT, fontWeight: 900, fontSize: 80, letterSpacing: -2 }}>
          {STEPS.map((s, i) => {
            const on = interpolate(g, [c[i] + 4, c[i] + 10], [0, 1], clamp);
            const k = pop(g, c[i] + 4, 12, 220);
            return (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 56 }}>·</span>}
                <span style={{ color: on > 0.5 ? ICE : "rgba(255,255,255,0.3)", transform: `scale(${on > 0 ? 0.88 + 0.12 * k : 1})`, textShadow: on > 0.5 ? "0 0 26px rgba(120,200,255,0.55), 0 4px 22px rgba(0,0,0,0.6)" : "0 4px 22px rgba(0,0,0,0.6)" }}>{s}</span>
              </React.Fragment>
            );
          })}
        </div>
      )}
      {lastA > 0 && (
        <div style={{ position: "absolute", left: 0, width: W, top: TITLE_CY, transform: `translateY(-50%) translateY(${(1 - pop(g, swap, 16, 160)) * 22}px)`, textAlign: "center", opacity: lastA, fontFamily: FONT, fontWeight: 900, fontSize: 70, letterSpacing: -2, color: WHITE, whiteSpace: "nowrap", textShadow: "0 4px 22px rgba(0,0,0,0.6)" }}>
          <span style={{ color: ICE }}>일하는 방식</span>이 달라진다
        </div>
      )}
    </>
  );
};
