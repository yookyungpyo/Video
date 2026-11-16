import React from "react";
import { interpolate } from "remotion";
import { Chip, curve, GLASS, Link, pop, Progress, Pulse } from "../components/Fx";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { FONT, ICE, TITLE_CY, W, WHITE, clamp, easeInOut } from "../theme";
import { SceneProps } from "./common";

// 06 The workflow (core scene) — one customer request travels through three agents:
//   request → 분석 Agent → 제안 Agent → 일정 Agent.  Each agent shows a progress ring while it works, hands a data
//   packet to the next one, and sends its result down to the proposal, where the results pile up (1/3 → 3/3).
type Pt = [number, number];
const A: Pt[] = [[0.15, 0.27], [0.5, 0.27], [0.85, 0.27]];
const LABELS = ["요구사항 분석", "제안서 초안", "일정 정리"];
const GREEN = "#8CF0B4";

const Tracker: React.FC<{ g: number; at: number[]; done: number[]; until: number }> = ({ g, at, done, until }) => {
  const a = interpolate(g, [at[0] - 1, at[0] + 6], [0, 1], clamp) * interpolate(g, [until - 6, until], [1, 0], clamp);
  if (a <= 0) return null;
  const steps = ["요청", "분석", "초안", "일정"];
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: TITLE_CY, transform: "translateY(-50%)", display: "flex", justifyContent: "center", alignItems: "center", gap: 14, opacity: a, fontFamily: FONT }}>
      {steps.map((s, i) => {
        const on = interpolate(g, [at[i] - 1, at[i] + 5], [0, 1], clamp);
        const ok = g >= done[i];
        const p = pop(g, at[i], 12, 220);
        return (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: ICE, opacity: 0.25 + 0.75 * on, fontSize: 40, fontWeight: 900 }}>›</span>}
            <div style={{ padding: "12px 26px 15px", borderRadius: 30, fontSize: 42, fontWeight: 800, letterSpacing: -1, whiteSpace: "nowrap",
              color: on > 0.5 ? (ok ? "#0B2A1A" : "#0A1020") : "rgba(255,255,255,0.55)",
              background: on > 0.5 ? (ok ? GREEN : ICE) : "rgba(255,255,255,0.08)", border: `2px solid ${on > 0.5 ? "transparent" : "rgba(255,255,255,0.25)"}`,
              boxShadow: on > 0.5 ? `0 0 26px ${ok ? "rgba(140,240,180,0.45)" : "rgba(120,200,255,0.55)"}` : "none", transform: `scale(${on > 0 ? 0.86 + 0.14 * p : 1})` }}>{s}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Scene06: React.FC<SceneProps> = ({ g }) => {
  const { from, to, voiceEnd } = SCENE_T[6];
  const c = [cue(6, 0), cue(6, 1), cue(6, 2), cue(6, 3)];
  const start = [c[1], c[2], c[3]];                      // each agent starts when it is named…
  const done = [c[2] - 8, c[3] - 8, voiceEnd - 20];      // …and is finished just before the next one starts
  const arrive = done.map((d) => d + 16);                // its result reaches the proposal
  const fin = voiceEnd + 6;                              // "제안서 완성"
  const count = arrive.filter((t) => g >= t).length;
  const end = to + 6;
  return (
    <>
      <Stage n={6} g={g} glow={`rgba(120,200,255,${0.25 + 0.35 * interpolate(g, [fin, fin + 10], [0, 1], clamp)})`} keys={[
        [from - 6, { z: 1.07, x: 0.46, y: 0.42 }],
        [c[1] + 10, { z: 1.07, x: 0.47, y: 0.44 }],       // follow the request: 분석 →
        [c[2] + 10, { z: 1.07, x: 0.5, y: 0.46 }],        // → 제안 →
        [c[3] + 10, { z: 1.07, x: 0.53, y: 0.46 }],       // → 일정
        [voiceEnd - 4, { z: 1.0, x: 0.5, y: 0.5 }],       // pull out: the whole pipeline
        [end, { z: 1.08, x: 0.5, y: 0.62 }],              // settle on the finished proposal
      ]} overlay={(p) => {
        const r = 0.115 * p.wi;
        const down: Pt[][] = [
          curve(p.P(0.14, 0.5), p.P(0.13, 0.66), p.P(0.3, 0.655)),
          [p.P(0.5, 0.47), p.P(0.5, 0.555)],
          curve(p.P(0.86, 0.5), p.P(0.87, 0.65), p.P(0.71, 0.64)),
        ];
        const [dx, dy] = p.P(0.5, 0.69);
        return (
          <>
            {/* hand-offs between the agents */}
            {[0, 1].map((i) => <Link key={`h${i}`} g={g} at={done[i]} until={end} w={p.card.w} h={p.card.h} pts={[p.P(0.285 + i * 0.35, 0.375), p.P(0.385 + i * 0.35, 0.375)]} draw={5} packets={3} every={5} travel={9} packetsAt={done[i] + 1} width={6} />)}
            {/* results flow down into the proposal */}
            {down.map((pts, i) => <Link key={`d${i}`} g={g} at={done[i] + 2} until={end} w={p.card.w} h={p.card.h} pts={pts} draw={8} packets={3} every={5} travel={12} packetsAt={done[i] + 4} width={5} />)}
            {A.map((a, i) => {
              const [x, y] = p.P(...a);
              return <Progress key={`p${i}`} g={g} at={start[i]} done={done[i]} until={end} x={x} y={y} r={r} />;
            })}
            {arrive.map((t, i) => <Pulse key={`a${i}`} g={g} at={t} until={t + 16} x={dx} y={dy} r={0.2 * p.wi} loop={16} color={GREEN} />)}
            <Pulse g={g} at={fin} until={end} x={dx} y={dy} r={0.235 * p.wi} color={GREEN} />
          </>
        );
      }} front={(p) => {
        const [rx, ry] = p.P(0.15, 0.08);
        const [ax, ay] = p.P(...A[0]);
        const fly = interpolate(g, [c[1] - 8, c[1] + 4], [0, 1], { ...clamp, easing: easeInOut });
        const rs = pop(g, c[0], 12, 200);
        const ra = interpolate(g, [c[0] - 1, c[0] + 3], [0, 1], clamp) * (1 - interpolate(g, [c[1], c[1] + 4], [0, 1], clamp));
        const [bx, by] = p.P(0.735, 0.555);
        const [sx, sy] = p.P(0.5, 0.7);
        const st = pop(g, fin, 10, 230);
        return (
          <>
            {/* the customer request drops in above the first agent, then goes into it */}
            {ra > 0 && (
              <div style={{ ...GLASS, position: "absolute", left: rx + (ax - rx) * fly + 60 * (1 - fly), top: ry + (ay - ry) * fly - (1 - rs) * 70, transform: `translate(-50%,-50%) scale(${(0.7 + 0.3 * rs) * (1 - 0.7 * fly)})`, opacity: ra,
                display: "flex", alignItems: "center", gap: 12, padding: "16px 28px 18px", borderRadius: 22, fontSize: 40, fontWeight: 800, whiteSpace: "nowrap" }}>
                <span style={{ width: 40, height: 28, borderRadius: 6, border: `3px solid ${ICE}`, position: "relative", display: "inline-block" }}>
                  <span style={{ position: "absolute", left: 5, top: -1, width: 24, height: 24, borderLeft: `3px solid ${ICE}`, borderBottom: `3px solid ${ICE}`, transform: "rotate(-45deg) scale(0.62)", transformOrigin: "50% 30%" }} />
                </span>
                고객 요청
              </div>
            )}
            {A.map((a, i) => {
              const [x, y] = p.P(a[0], 0.5);
              const cx = Math.max(128, Math.min(p.card.w - 128, x));
              return (
                <React.Fragment key={i}>
                  <Chip g={g} at={start[i]} until={done[i] + 3} x={cx} y={y} label={LABELS[i]} size={31} />
                  <Chip g={g} at={done[i]} until={end} x={cx} y={y} label={LABELS[i]} tone="done" size={31} />
                </React.Fragment>
              );
            })}
            {count > 0 && g < fin + 4 && <Chip g={g} at={arrive[count - 1]} until={fin + 4} x={bx} y={by} label={`${count}/3`} size={36} tone="done" />}
            {g >= fin - 1 && (
              <div style={{ position: "absolute", left: sx, top: sy, transform: `translate(-50%,-50%) rotate(-5deg) scale(${1.7 - 0.7 * st})`, opacity: interpolate(g, [fin - 1, fin + 3], [0, 1], clamp) * interpolate(g, [end - 6, end], [1, 0], clamp),
                padding: "14px 30px 18px", borderRadius: 22, border: `5px solid ${GREEN}`, background: "rgba(8,26,20,0.88)", color: WHITE, fontFamily: FONT, fontWeight: 900, fontSize: 54, letterSpacing: -1.5, whiteSpace: "nowrap",
                boxShadow: "0 12px 34px rgba(0,0,0,0.5), 0 0 34px rgba(140,240,180,0.45)" }}>
                제안서 <span style={{ color: GREEN }}>완성 ✓</span>
              </div>
            )}
          </>
        );
      }} />
      <Tracker g={g} at={[c[0], c[1], c[2], c[3]]} done={[c[1], done[0], done[1], done[2]]} until={to + 4} />
    </>
  );
};
