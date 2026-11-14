import React from "react";
import { interpolate, spring } from "remotion";
import type { SceneData } from "../data/scenes";
import { FONT, FPS, WHITE, YELLOW, clamp } from "../theme";
import { CARD, Placement } from "./CameraMotion";

// Small motion graphics drawn on top of the picture (card-local px). They explain the joke; they never
// move or warp the characters. Items fixed to the card corner use plain px; items tied to something in the
// picture use p.P(x, y).
type G = { scene: SceneData; g: number; p: Placement };

const pop = (g: number, at0: number, damping = 14) => spring({ frame: g - at0, fps: FPS, config: { damping, stiffness: 190, mass: 0.6 } });
const chip: React.CSSProperties = { fontFamily: FONT, fontWeight: 800, letterSpacing: -0.4, borderRadius: 16, boxShadow: "0 8px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" };

/** 02 — extra work piling up, one chip per "이것도" */
const TaskPile: React.FC<G> = ({ scene, g }) => {
  const l = scene.dialogue[1];
  const span = l.end - l.start;
  const items = ["+ 보고서", "+ 회의 자료", "+ 분석 정리"];
  const fade = interpolate(g, [scene.to - 5, scene.to], [1, 0], clamp);
  return (
    <>
      {items.map((t, i) => {
        const a0 = Math.round(l.start + span * [0.42, 0.62, 0.82][i]);
        if (g < a0) return null;
        const s = pop(g, a0);
        return (
          <div key={t} style={{ ...chip, position: "absolute", left: 36, top: 36 + i * 86, fontSize: 38, padding: "12px 24px 14px", background: "rgba(255,255,255,0.95)", color: "#17181d",
            opacity: fade, transform: `translateY(${(1 - s) * -40}px) rotate(${(i - 1) * -2}deg) scale(${0.8 + 0.2 * s})`, transformOrigin: "0 50%" }}>{t}</div>
        );
      })}
    </>
  );
};

/** 03 — it is simply six o'clock */
const ClockOut: React.FC<G> = ({ scene, g }) => {
  const a0 = scene.dialogue[1].start;
  if (g < a0) return null;
  const s = pop(g, a0, 18);
  return (
    <div style={{ ...chip, position: "absolute", left: 36, top: 36, display: "flex", alignItems: "center", gap: 14, fontSize: 40, padding: "12px 24px 14px",
      background: "rgba(14,15,20,0.8)", color: WHITE, opacity: interpolate(g, [scene.to - 5, scene.to], [1, 0], clamp), transform: `scale(${0.85 + 0.15 * s})`, transformOrigin: "0 0" }}>
      <svg width={40} height={40} viewBox="0 0 40 40"><circle cx={20} cy={20} r={17} fill="none" stroke={YELLOW} strokeWidth={4} /><path d="M20 9 V20 H9" fill="none" stroke={YELLOW} strokeWidth={4} strokeLinecap="round" transform="rotate(180 20 20)" /></svg>
      18:00 <span style={{ color: YELLOW }}>퇴근</span>
    </div>
  );
};

/** 04 — a loading ring around the head and three dots that arrive one by one */
const Thinking: React.FC<G> = ({ scene, g, p }) => {
  const a0 = scene.dialogue[1].end + 2;
  if (g < a0) return null;
  const a = interpolate(g, [a0, a0 + 8], [0, 1], clamp) * interpolate(g, [scene.to - 5, scene.to], [1, 0], clamp);
  const [hx, hy] = p.P(0.745, 0.31);
  const r = 0.235 * p.wi;
  const [bx, by] = p.P(0.5, 0.115);
  const cyc = (g - a0) % 36;
  return (
    <>
      <svg width={r * 2 + 20} height={r * 2 + 20} style={{ position: "absolute", left: hx - r - 10, top: hy - r - 10, opacity: a, overflow: "visible" }}>
        <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={7} />
        <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke={YELLOW} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={`${r * 1.5} ${r * 2 * Math.PI}`} transform={`rotate(${(g - a0) * 9} ${r + 10} ${r + 10})`} />
      </svg>
      <div style={{ position: "absolute", left: bx, top: by, transform: "translate(-50%, -50%)", opacity: a, display: "flex", gap: 16, padding: "22px 30px", borderRadius: 40, background: "rgba(255,255,255,0.96)", boxShadow: "0 10px 26px rgba(0,0,0,0.35)" }}>
        {[0, 1, 2].map((i) => {
          const on = interpolate(cyc, [i * 8, i * 8 + 4], [0, 1], clamp);
          return <div key={i} style={{ width: 24, height: 24, borderRadius: 12, background: "#17181d", opacity: 0.18 + 0.82 * on, transform: `scale(${0.7 + 0.3 * on})` }} />;
        })}
      </div>
    </>
  );
};

/** 05 — certainty 100 %, evidence 0 % */
const Confidence: React.FC<G> = ({ scene, g }) => {
  const l0 = scene.dialogue[0], l1 = scene.dialogue[1];
  if (g < l0.start + 6) return null;
  const fill = interpolate(g, [l0.start + 6, l0.end], [0, 1], clamp);
  const row2 = interpolate(g, [l1.start, l1.start + 5], [0, 1], clamp);
  const a = interpolate(g, [l0.start + 6, l0.start + 12], [0, 1], clamp) * interpolate(g, [scene.to - 5, scene.to], [1, 0], clamp);
  const Row: React.FC<{ label: string; v: number; color: string; o?: number }> = ({ label, v, color, o = 1 }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: o }}>
      <div style={{ width: 76, fontSize: 32, fontWeight: 800, color: WHITE }}>{label}</div>
      <div style={{ width: 210, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", borderRadius: 11, background: color }} />
      </div>
      <div style={{ width: 96, fontSize: 32, fontWeight: 800, color, textAlign: "right" }}>{Math.round(v * 100)}%</div>
    </div>
  );
  return (
    <div style={{ ...chip, position: "absolute", left: 30, top: 30, padding: "16px 22px 18px", background: "rgba(14,15,20,0.82)", opacity: a, display: "flex", flexDirection: "column", gap: 10 }}>
      <Row label="확신" v={fill} color={YELLOW} />
      <Row label="근거" v={0} color="#9AA0AD" o={row2} />
    </div>
  );
};

/** 06 — twelve AI subscriptions pop in along the top, then freeze */
const TILE_COLORS = ["#6C8CFF", "#19C39C", "#FF7A59", "#A56BFF", "#FFB020", "#2BB4F6", "#F05C8E", "#37C871", "#8E9BFF", "#FF9248", "#22C1C3", "#C27BFF"];
const GLYPHS = ["✦", "◎", "△", "◆", "✺", "⬡", "◐", "✧", "▣", "❖", "◍", "✶"];
const Subscriptions: React.FC<G> = ({ scene, g }) => {
  const a0 = scene.dialogue[0].start + 4;
  const stop = scene.dialogue[2].end; // after this nothing moves
  const fade = interpolate(g, [scene.to - 5, scene.to], [1, 0], clamp);
  const shown = TILE_COLORS.filter((_, i) => g >= a0 + i * 4).length;
  return (
    <>
      {TILE_COLORS.map((c, i) => {
        const t0 = a0 + i * 4;
        if (g < t0) return null;
        const s = pop(Math.min(g, stop), t0, 12);
        const bob = g < stop ? 3 * Math.sin((g + i * 7) / 9) : 3 * Math.sin((stop + i * 7) / 9);
        return (
          <div key={i} style={{ position: "absolute", left: 22 + i * 80, top: 22 + bob, width: 70, height: 70, borderRadius: 18, background: c, color: WHITE, fontSize: 38,
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(0,0,0,0.35)", opacity: fade, transform: `scale(${s})` }}>{GLYPHS[i]}</div>
        );
      })}
      {shown > 0 && (
        <div style={{ ...chip, position: "absolute", right: 24, top: 108, fontSize: 34, padding: "9px 20px 11px", background: "rgba(14,15,20,0.82)", color: WHITE, opacity: fade }}>
          구독 중 <span style={{ color: YELLOW }}>{shown}개</span>
        </div>
      )}
    </>
  );
};

/** 07 — AI draft → own edit → finished: the bar gets longer each step */
const Improve: React.FC<G> = ({ scene, g }) => {
  const l = scene.dialogue[1];
  const span = l.end - l.start;
  const rows = [{ label: "AI 초안", v: 0.45, c: "#9AA0AD" }, { label: "내 수정", v: 0.78, c: WHITE }, { label: "완성", v: 1, c: YELLOW }];
  const a0 = l.start + 4;
  if (g < a0) return null;
  const a = interpolate(g, [a0, a0 + 8], [0, 1], clamp) * interpolate(g, [scene.to - 5, scene.to], [1, 0], clamp);
  return (
    <div style={{ ...chip, position: "absolute", left: 30, top: 30, padding: "16px 22px 18px", background: "rgba(14,15,20,0.82)", opacity: a, display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => {
        const t0 = Math.round(l.start + span * [0.1, 0.5, 0.85][i]);
        const k = interpolate(g, [t0, t0 + 14], [0, 1], clamp);
        return (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 14, opacity: interpolate(g, [t0 - 2, t0 + 4], [0.25, 1], clamp) }}>
            <div style={{ width: 118, fontSize: 30, fontWeight: 800, color: r.c }}>{r.label}</div>
            <div style={{ width: 200, height: 20, borderRadius: 10, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
              <div style={{ width: `${r.v * k * 100}%`, height: "100%", borderRadius: 10, background: r.c }} />
            </div>
            <div style={{ width: 34, fontSize: 30, fontWeight: 900, color: YELLOW, opacity: i === 2 ? k : 0 }}>✓</div>
          </div>
        );
      })}
    </div>
  );
};

/** 08 — the AI gets to work: progress ring on the robot + its task list ticking off */
const RobotWork: React.FC<G> = ({ scene, g, p }) => {
  const a0 = scene.dialogue[2].end;
  if (g < a0) return null;
  const a = interpolate(g, [a0, a0 + 8], [0, 1], clamp) * interpolate(g, [scene.to - 5, scene.to], [1, 0], clamp);
  const [rx, ry] = p.P(0.27, 0.44);
  const r = 0.2 * p.wi;
  const tasks = ["자료 조사", "3안 비교"];
  return (
    <>
      <svg width={r * 2 + 20} height={r * 2 + 20} style={{ position: "absolute", left: rx - r - 10, top: ry - r - 10, opacity: a, overflow: "visible" }}>
        <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={7} />
        <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke="#6CC8FF" strokeWidth={7} strokeLinecap="round"
          strokeDasharray={`${r * 1.4} ${r * 2 * Math.PI}`} transform={`rotate(${(g - a0) * 10} ${r + 10} ${r + 10})`} />
      </svg>
      <div style={{ ...chip, position: "absolute", left: 30, top: 30, padding: "14px 22px 16px", background: "rgba(14,15,20,0.82)", opacity: a, display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.map((t, i) => {
          const k = interpolate(g, [a0 + 4 + i * 16, a0 + 22 + i * 16], [0, 1], clamp);
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 132, fontSize: 30, fontWeight: 800, color: WHITE }}>{t}</div>
              <div style={{ width: 170, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                <div style={{ width: `${k * 100}%`, height: "100%", borderRadius: 9, background: "#6CC8FF" }} />
              </div>
              <div style={{ width: 30, fontSize: 28, fontWeight: 900, color: "#6CC8FF", opacity: k >= 1 ? 1 : 0 }}>✓</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

/** 09 — after the speech: the room. Everything dims except the employees' faces. */
const Awkward: React.FC<G> = ({ scene, g, p }) => {
  const a0 = scene.dialogue[2].end + 14;
  const a = interpolate(g, [a0, a0 + 10], [0, 1], clamp) * interpolate(g, [scene.to - 5, scene.to], [1, 0], clamp);
  if (a <= 0) return null;
  const holes: [number, number, number, number][] = [[0.0, 0.4, 0.31, 0.7], [0.67, 0.4, 1.0, 0.7]];
  return (
    <svg width={CARD.w} height={CARD.h} style={{ position: "absolute", left: 0, top: 0, opacity: a }}>
      <defs>
        <mask id="awk">
          <rect width={CARD.w} height={CARD.h} fill="#fff" />
          {holes.map(([x0, y0, x1, y1], i) => {
            const [ax, ay] = p.P(x0, y0);
            const [bx, by] = p.P(x1, y1);
            return <rect key={i} x={ax} y={ay} width={bx - ax} height={by - ay} rx={28} fill="#000" />;
          })}
        </mask>
      </defs>
      <rect width={CARD.w} height={CARD.h} fill="rgba(10,11,16,0.6)" mask="url(#awk)" />
      {holes.map(([x0, y0, x1, y1], i) => {
        const [ax, ay] = p.P(x0, y0);
        const [bx, by] = p.P(x1, y1);
        return <rect key={i} x={ax} y={ay} width={bx - ax} height={by - ay} rx={28} fill="none" stroke={YELLOW} strokeWidth={4} opacity={0.9} />;
      })}
    </svg>
  );
};

export const SceneGraphic: React.FC<G> = (props) => {
  switch (props.scene.graphic) {
    case "taskPile": return <TaskPile {...props} />;
    case "clockOut": return <ClockOut {...props} />;
    case "thinking": return <Thinking {...props} />;
    case "confidence": return <Confidence {...props} />;
    case "subscriptions": return <Subscriptions {...props} />;
    case "improve": return <Improve {...props} />;
    case "robotWork": return <RobotWork {...props} />;
    case "awkward": return <Awkward {...props} />;
    default: return null;
  }
};
