// The game layer of every scene. Two kinds of graphics, both drawn in code and kept apart from the pictures:
//   FX[n]  belongs to a place in the picture (quest marker on the flag, path nodes, compass needle, focus,
//          light). It is drawn inside the picture window and moves with the camera.
//   UI[n]  stands on the screen (stat panel, skill list, HUD, banners, the two big questions).
// Cue points are the narration's own (src/data/timing.json); scripts/build_audio.py places the effects on the same ones.
import React from "react";
import { interpolate } from "remotion";
import { Fx, Placement, Safe } from "../components/Stage";
import { BOX } from "../components/Dialogue";
import { Glow, Ping, PixelBox, Px, Sparkles } from "../components/Pixel";
import { SCENE_T, cue } from "../data";
import { DIM, GOLD, GOLD_LIGHT, INK, SANS, W, WHITE, clamp, easeBack, easeInOut, easeOut, outline, ramp } from "../theme";
import { PARTY, focusAt } from "./motion";

const pop = (g: number, at: number, d = 8) => ({ opacity: interpolate(g, [at, at + 4], [0, 1], clamp), scale: interpolate(g, [at, at + d], [0.6, 1], { ...clamp, easing: easeBack }) });
const fade = (g: number, a: number, z: number, i = 6, o = 7) => interpolate(g, [a, a + i], [0, 1], clamp) * interpolate(g, [z - o, z], [1, 0], clamp);
const ko = (size: number, color = WHITE, weight = 800): React.CSSProperties => ({ fontFamily: SANS, fontWeight: weight, fontSize: size, lineHeight: 1.22, letterSpacing: -0.025 * size, color, whiteSpace: "pre" });

// ───────────────────────────────────────────── in the picture ─────────────────────────────────────────────
const PATH: [number, number][] = [[0.5, 0.97], [0.56, 0.7], [0.66, 0.53], [0.74, 0.44], [0.69, 0.37], [0.73, 0.31], [0.78, 0.25]];
const CARDS: [number, number, number, number][] = [[0.03, 0.2, 0.32, 0.5], [0.35, 0.18, 0.67, 0.5], [0.69, 0.2, 0.98, 0.5]];
/** frames at which the three skills of scene 07 are switched on */
export const skillAt = (i: number) => cue(7, i) + 3;
const NEEDLE_REST = 31;   // degrees from north: where the needle in the picture points

export const FX: Record<number, (g: number) => Fx> = {
  // 01 — "pause": while the question stands, the picture is held, dimmed and scan-lined
  1: (g) => {
    const k = interpolate(g, [42, 48, cue(1, 1) - 6, cue(1, 1)], [0, 1, 1, 0], clamp);
    return { filter: `saturate(${(1 - 0.5 * k).toFixed(3)}) brightness(${(1 - 0.36 * k).toFixed(3)})`,
      overlay: () => <div style={{ position: "absolute", inset: 0, opacity: 0.3 * k, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 8px)" }} /> };
  },
  2: () => ({ patch: { cx: 0.5, cy: 0.6, rx: 0.3, ry: 0.48, k: 0.25 } }),
  // 03 — the value being handed over glows gold
  3: (g) => {
    const k = ramp(g, cue(3, 1, 0.25), cue(3, 1, 0.25) + 16, easeOut);
    return { patch: { cx: 0.93, cy: 0.62, rx: 0.2, ry: 0.42, kx: 0.4 }, overlay: (p: Placement) => {
      const [x, y] = p.P(0.52, 0.72);
      return <Safe><Glow x={x} y={y} r={0.3 * p.wi} a={k * (0.5 + 0.14 * Math.sin(g * 0.2))} /><Sparkles g={g} x={x} y={y - 20} spread={[0.2 * p.wi, 0.08 * p.hi]} count={16} seed={3} strength={k} rise={140} /></Safe>;
    } };
  },
  // 04 — the goal: the flag pulses and gets a quest marker
  4: (g) => {
    const on = cue(4, 2);
    const k = ramp(g, on, on + 10, easeOut);
    return { overlay: (p: Placement) => {
      const [x, y] = p.P(0.715, 0.165);
      const m = pop(g, on + 4);
      return (
        <Safe>
          <Glow x={x} y={y} r={0.26 * p.wi} a={k * (0.42 + 0.2 * Math.sin((g - on) * 0.22))} />
          {[0, 1, 2].map((j) => <Ping key={j} x={x} y={y + 30} t={(((g - on - j * 14) % 42) + 42) % 42 / 42 * (g >= on + j * 14 ? 1 : 0)} size={0.2 * p.wi} />)}
          <PixelBox style={{ left: x - 0.14 * p.wi - 250 + 5 * Math.sin(g * 0.3), top: y - 6, height: 66, opacity: m.opacity, transform: `scale(${m.scale})`, transformOrigin: "right center" }} inner={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", whiteSpace: "nowrap" }} fill="solid">
            <Px size={22}>GOAL</Px><Px size={20} color={GOLD_LIGHT}>▶</Px>
          </PixelBox>
        </Safe>
      );
    } };
  },
  // 05 — the path lights up node by node, towards the flag
  5: (g) => {
    const a = interpolate(g, [cue(5, 0) + 8, cue(5, 1, 0.75)], [0, PATH.length], clamp);
    const all = ramp(g, cue(5, 1, 0.75), cue(5, 1, 0.75) + 12);
    return { overlay: (p: Placement) => (
      <Safe>
        {PATH.map(([px, py], i) => {
          if (a < i) return null;
          const [x, y] = p.P(px, py);
          const t = Math.min(1, (a - i) * 1.6);
          const s = (26 - i * 2) * (0.6 + 0.4 * easeBack(t)) * (p.wi / 1080);
          return (
            <React.Fragment key={i}>
              <Glow x={x} y={y} r={70 - i * 5} a={0.6 * t} />
              <Ping x={x} y={y} t={(a - i) * 0.9} size={60 - i * 4} />
              <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, background: GOLD_LIGHT, border: `4px solid ${INK}`, boxSizing: "border-box", transform: "rotate(45deg)", boxShadow: `0 0 16px ${GOLD}` }} />
            </React.Fragment>
          );
        })}
        {(() => { const [x, y] = p.P(0.8, 0.165); return <Glow x={x} y={y} r={0.2 * p.wi} a={all * (0.5 + 0.2 * Math.sin(g * 0.25))} />; })()}
      </Safe>
    ) };
  },
  // 06 — focus moves from the map to the compass; a needle spins, slows and locks; then the way is shown
  6: (g) => {
    const s0 = cue(6, 1) - 6, lock = cue(6, 2) + 4;
    const toCompass = ramp(g, cue(6, 1) - 12, cue(6, 1) + 6, easeInOut);
    const back = ramp(g, lock + 10, lock + 26, easeInOut);
    const u = ramp(g, s0, lock, easeOut);
    const angle = NEEDLE_REST + 1080 * (1 - u) + (g >= lock ? 7 * Math.exp(-(g - lock) / 5) * Math.sin((g - lock) * 0.9) : 0);
    const cover = fade(g, s0 - 4, lock + 24, 6, 10);
    return { bgBlur: 3.6 * toCompass * (1 - back), patch: { cx: 0.78, cy: 0.76, rx: 0.27, ry: 0.2, blur: 4.5 * (1 - toCompass) },
      overlay: (p: Placement) => {
        const [x, y] = p.P(0.79, 0.765);
        const R = 0.118 * p.wi;
        return (
          <Safe>
            <div style={{ position: "absolute", left: x - R * 0.78, top: y - R * 0.78, width: R * 1.56, height: R * 1.56, borderRadius: "50%", background: "#EEE4C6", opacity: cover, boxShadow: "inset 0 0 0 5px #B99A4E" }} />
            <svg width={R * 2} height={R * 2} viewBox="-100 -100 200 200" style={{ position: "absolute", left: x - R, top: y - R, opacity: cover, transform: `rotate(${angle}deg)` }}>
              <polygon points="0,-74 13,0 -13,0" fill="#E0482F" stroke={INK} strokeWidth={5} strokeLinejoin="miter" />
              <polygon points="0,74 13,0 -13,0" fill="#4A6FD0" stroke={INK} strokeWidth={5} strokeLinejoin="miter" />
              <rect x={-9} y={-9} width={18} height={18} fill={GOLD} stroke={INK} strokeWidth={4} />
            </svg>
            <Ping x={x} y={y} t={(g - lock) / 16} size={R * 1.5} />
            <Glow x={x} y={y} r={R * 1.9} a={0.55 * fade(g, lock, lock + 30, 4, 20)} />
            {[0, 1, 2, 3].map((j) => {
              const [ax, ay] = p.P(0.6 + j * 0.095, 0.215 - j * 0.022);   // in the sky above his arm, pointing the way he points
              const t = pop(g, lock + 16 + j * 4, 7);
              const lit = 0.4 + 0.6 * Math.max(0, Math.sin((g - lock) * 0.3 - j * 0.9));
              const S = 92 * (p.wi / 1123);
              return (
                <svg key={j} width={S} height={S} viewBox="0 0 12 12" shapeRendering="crispEdges" style={{ position: "absolute", left: ax - S / 2, top: ay - S / 2, opacity: t.opacity * lit, transform: `rotate(-14deg) scale(${t.scale})`, filter: `drop-shadow(0 0 10px ${GOLD})` }}>
                  <polygon points="2,1 5,1 10,6 5,11 2,11 7,6" fill={GOLD_LIGHT} stroke={INK} strokeWidth={1} strokeLinejoin="miter" />
                </svg>
              );
            })}
          </Safe>
        );
      } };
  },
  // 07 — three skills: each card is dark until its sentence, then it lights up
  7: (g) => ({ overlay: (p: Placement) => (
    <Safe>
      {CARDS.map(([x0, y0, x1, y1], i) => {
        const [ax, ay] = p.P(x0, y0), [bx, by] = p.P(x1, y1);
        const on = skillAt(i);
        const k = ramp(g, on, on + 6);
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: ax - 6, top: ay - 6, width: bx - ax + 12, height: by - ay + 12, background: "rgba(14,10,32,0.7)", opacity: 1 - k }} />
            <Glow x={(ax + bx) / 2} y={(ay + by) / 2} r={(bx - ax) * 1.1} a={k * (0.28 + 0.14 * Math.sin((g - on) * 0.22 + i)) + 0.7 * fade(g, on, on + 14, 2, 12)} />
            <Ping x={(ax + bx) / 2} y={(ay + by) / 2} t={(g - on) / 18} size={(bx - ax) * 0.85} />
            <Sparkles g={g} x={(ax + bx) / 2} y={ay + 20} spread={[(bx - ax) / 2, 30]} count={7} seed={20 + i * 9} strength={k} rise={110} />
          </React.Fragment>
        );
      })}
    </Safe>
  ) }),
  // 08 — the party cursor: corner brackets on the face the camera is on; at the end on everyone
  8: (g) => ({ overlay: (p: Placement) => (
    <Safe>
      {PARTY.map((m, i) => {
        const all = g >= focusAt(PARTY.length) + 6;
        const mine = g >= focusAt(i) && g < focusAt(i + 1);
        if (!mine && !all) return null;
        const at = all ? focusAt(PARTY.length) + 6 + i * 2 : focusAt(i);
        const t = pop(g, at, 7);
        const [ax, ay] = p.P(m.box[0], m.box[1]), [bx, by] = p.P(m.box[2], m.box[3]);
        const grow = (1 - t.scale) * 40 + 4 * Math.sin(g * 0.35);
        const L = 34, T = 7;
        const corner = (left: boolean, top: boolean): React.CSSProperties => ({ position: "absolute", width: L, height: L, [left ? "left" : "right"]: 0, [top ? "top" : "bottom"]: 0,
          [`border${top ? "Top" : "Bottom"}`]: `${T}px solid ${GOLD}`, [`border${left ? "Left" : "Right"}`]: `${T}px solid ${GOLD}`, filter: `drop-shadow(0 0 0 ${INK}) drop-shadow(3px 3px 0 ${INK})` } as React.CSSProperties);
        return (
          <div key={i} style={{ position: "absolute", left: ax - grow, top: ay - grow, width: bx - ax + 2 * grow, height: by - ay + 2 * grow, opacity: t.opacity * (all ? 0.9 : 1) }}>
            <div style={corner(true, true)} /><div style={corner(false, true)} /><div style={corner(true, false)} /><div style={corner(false, false)} />
          </div>
        );
      })}
    </Safe>
  ) }),
  // 09 — the flag at the summit glows brighter as the party climbs
  9: (g) => {
    const { from } = SCENE_T[9];
    const k = ramp(g, from, cue(9, 3) + 8);
    return { overlay: (p: Placement) => {
      const [x, y] = p.P(0.78, 0.13);
      return <Safe><Glow x={x} y={y + 40} r={0.3 * p.wi} a={(0.2 + 0.4 * k) * (0.85 + 0.15 * Math.sin(g * 0.24))} /><Sparkles g={g} x={x} y={y + 80} spread={[0.16 * p.wi, 0.07 * p.hi]} count={14} seed={41} strength={0.3 + 0.7 * k} rise={120} /></Safe>;
    } };
  },
  // 10 — sunrise: drifting gold dust and a faint lens flare from the sun
  10: (g) => {
    const { from } = SCENE_T[10];
    const k = ramp(g, from, from + 30);
    return { overlay: (p: Placement) => {
      const [x, y] = p.P(0.52, 0.215);
      const [cx, cy] = [p.wi / 2 + p.ox, p.hi * 0.55 + p.oy];
      return (
        <Safe>
          <Glow x={x} y={y} r={0.42 * p.wi} a={k * (0.3 + 0.05 * Math.sin(g * 0.11))} color="255,226,160" />
          <div style={{ position: "absolute", left: x - 0.7 * p.wi, top: y - 5, width: 1.4 * p.wi, height: 10, mixBlendMode: "screen", opacity: 0.4 * k, background: "linear-gradient(90deg, rgba(255,226,160,0) 0%, rgba(255,236,190,0.9) 50%, rgba(255,226,160,0) 100%)", filter: "blur(3px)" }} />
          {[0.35, 0.62, 0.95, 1.3].map((f, i) => { const r = [26, 46, 20, 64][i]; return <div key={i} style={{ position: "absolute", left: x + (cx - x) * f * 1.6 - r, top: y + (cy - y) * f * 1.6 - r, width: 2 * r, height: 2 * r, borderRadius: "50%", mixBlendMode: "screen", opacity: k * [0.22, 0.14, 0.2, 0.1][i], background: "radial-gradient(circle, rgba(255,220,150,0.1) 40%, rgba(255,200,120,0.9) 70%, rgba(255,200,120,0) 75%)" }} />; })}
          <Sparkles g={g} x={p.wi / 2 + p.ox} y={p.hi * 0.6 + p.oy} spread={[p.wi * 0.5, p.hi * 0.3]} count={30} seed={77} strength={0.8 * k} rise={70} color="255,224,150" />
        </Safe>
      );
    } };
  },
};

// ─────────────────────────────────────────────── on the screen ──────────────────────────────────────────────
const STATS = ["같은 태도", "같은 언어", "같은 기준"];
const SKILLS: [string, string, string][] = [["목표점", "VISION", "비전"], ["방향성", "STRATEGY", "전략"], ["내비게이션", "LEADERSHIP", "리더십"]];

/** a row of pixel segments that fills up */
const Bar: React.FC<{ value: number; segments: number; w: number; h: number }> = ({ value, segments, w, h }) => (
  <div style={{ display: "flex", gap: 4, width: w, height: h }}>
    {Array.from({ length: segments }, (_, i) => <div key={i} style={{ flex: 1, background: value * segments > i ? (value * segments > i + 0.5 ? GOLD : GOLD_LIGHT) : "rgba(255,255,255,0.14)", boxShadow: value * segments > i ? `0 0 8px ${GOLD}` : undefined }} />)}
  </div>
);
/** two centred lines in a window at the dialogue position — the scene's key sentence */
const Banner: React.FC<{ g: number; at: number; end: number; children: React.ReactNode }> = ({ g, at, end, children }) => {
  const t = pop(g, at, 9);
  return (
    <PixelBox style={{ left: BOX.x, top: BOX.y - 10, width: BOX.w, height: BOX.h + 10, opacity: t.opacity * interpolate(g, [end - 7, end], [1, 0], clamp), transform: `scale(${t.scale})` }}
      inner={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>{children}</PixelBox>
  );
};

export const UI: Record<number, (g: number, end: number) => React.ReactNode> = {
  // 01 — NEW QUEST, and the question itself, large, on the paused picture
  1: (g) => {
    const out = cue(1, 1) - 2;
    const l1 = pop(g, cue(1, 0)), l2 = pop(g, cue(1, 0, 0.42));
    const off = interpolate(g, [out - 7, out], [1, 0], clamp);
    return (
      <>
        <PixelBox style={{ left: 90, top: 376, height: 62, opacity: fade(g, 6, out, 5, 7) }} inner={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }} fill="solid">
          <Px size={20}>NEW QUEST</Px>{Math.floor(g / 8) % 2 === 0 && <Px size={18} color={GOLD_LIGHT}>▶</Px>}
        </PixelBox>
        <div style={{ position: "absolute", left: 0, width: SAFE_W, top: 800, display: "flex", flexDirection: "column", alignItems: "center", opacity: off }}>
          <div style={{ ...ko(76), textShadow: outline(5), opacity: l1.opacity, transform: `scale(${l1.scale})` }}>당신의 조직에는</div>
          <div style={{ ...ko(96, WHITE, 900), textShadow: outline(6), opacity: l2.opacity, transform: `scale(${l2.scale})` }}><span style={{ color: GOLD }}>브랜드</span>가 있는가?</div>
        </div>
      </>
    );
  },
  // 02 — the three "sames" as a stat panel: each bar fills when it is spoken
  2: (g, end) => {
    const a = cue(2, 1) - 6;
    return (
      <PixelBox style={{ left: 90, top: 376, width: 730, height: 208, opacity: fade(g, a, end) }} inner={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: "0 26px" }}>
        {STATS.map((s, i) => {
          const on = cue(2, i + 1);
          const t = pop(g, on, 7);
          const v = ramp(g, on + 2, on + 16, easeOut);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, height: 50, opacity: 0.28 + 0.72 * t.opacity }}>
              <span style={{ ...ko(42, g >= on ? GOLD : DIM), width: 196, transform: `scale(${g >= on ? t.scale : 1})`, transformOrigin: "left center" }}>{s}</span>
              <Bar value={v} segments={10} w={290} h={26} />
              <Px size={18} color={v >= 1 ? GOLD_LIGHT : "rgba(255,255,255,0.25)"}>MAX</Px>
            </div>
          );
        })}
      </PixelBox>
    );
  },
  // 03 — achievement toast
  3: (g, end) => {
    const a = cue(3, 1, 0.5);
    const t = pop(g, a, 9);
    return (
      <PixelBox style={{ left: 90, top: 376, height: 92, opacity: t.opacity * interpolate(g, [end - 7, end], [1, 0], clamp), transform: `translateY(${(1 - t.scale) * -60}px)` }} inner={{ display: "flex", alignItems: "center", gap: 18, padding: "0 24px" }}>
        <Px size={30}>★</Px>
        <span style={ko(46)}><span style={{ color: GOLD }}>일관된</span> 고객 경험</span>
      </PixelBox>
    );
  },
  // 07 — skill list: what each of the three things is
  7: (g, end) => (
    <>
      <PixelBox style={{ left: BOX.x, top: 1318, width: BOX.w, height: 262, opacity: fade(g, skillAt(0) - 6, end) }} inner={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, padding: "0 30px" }}>
        {SKILLS.map(([what, en, kr], i) => {
          const on = skillAt(i);
          const t = pop(g, on, 8);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", height: 66, opacity: g >= on ? t.opacity : 0.22, transform: `scale(${g >= on ? t.scale : 1})`, transformOrigin: "left center" }}>
              <span style={{ ...ko(38, g >= on ? WHITE : DIM, 700), width: 216 }}>{what}</span>
              <Px size={18} color={g >= on ? GOLD_LIGHT : DIM} style={{ width: 44 }}>▶</Px>
              <Px size={22} color={g >= on ? GOLD : DIM} style={{ width: 268 }}>{en}</Px>
              <span style={ko(46, g >= on ? GOLD : DIM, 900)}>{kr}</span>
            </div>
          );
        })}
      </PixelBox>
      {(() => { const a = cue(7, 2, 0.55); const t = pop(g, a, 9); return (
        <PixelBox style={{ left: 90, top: 376, height: 62, opacity: t.opacity * interpolate(g, [end - 7, end], [1, 0], clamp), transform: `scale(${t.scale})`, transformOrigin: "left center" }} inner={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }} fill="solid">
          <Px size={20} color={Math.floor(g / 6) % 2 ? GOLD : GOLD_LIGHT}>3 SKILLS UNLOCKED</Px>
        </PixelBox>
      ); })()}
    </>
  ),
  // 08 — party HUD while the cursor goes round; then the key sentence
  8: (g, end) => {
    const { from } = SCENE_T[8];
    let i = 0;
    PARTY.forEach((_, k) => { if (g >= focusAt(k)) i = k; });
    const all = g >= focusAt(PARTY.length) + 6;
    return (
      <>
        <PixelBox style={{ left: 90, top: 376, height: 62, opacity: fade(g, from + 6, end) }} inner={{ display: "flex", alignItems: "center", gap: 16, padding: "0 16px" }} fill="solid">
          <Px size={20} color={WHITE}>PARTY</Px>
          <Px size={20}>{all ? `${PARTY.length}/${PARTY.length}` : `${i + 1}/${PARTY.length}`}</Px>
          <Px size={18} color={GOLD_LIGHT} style={{ minWidth: 190 }}>{all ? "ALL SET!" : PARTY[i].role}</Px>
        </PixelBox>
        <Banner g={g} at={cue(8, 3)} end={end}>
          <span style={ko(46)}>서로 다른 역할,</span>
          <span style={ko(62, GOLD, 900)}>하나의 가치</span>
        </Banner>
      </>
    );
  },
  // 09 — quest progress fills to 100 %; then the key sentence
  9: (g, end) => {
    const { from } = SCENE_T[9];
    const v = interpolate(g, [from + 12, cue(9, 3) + 8], [0, 1], { ...clamp, easing: easeInOut });
    const done = v >= 1;
    return (
      <>
        <PixelBox style={{ left: 90, top: 376, width: 640, height: 66, opacity: fade(g, from + 8, end) }} inner={{ display: "flex", alignItems: "center", gap: 16, padding: "0 16px" }} fill="solid">
          <Px size={18} color={WHITE}>QUEST</Px>
          <Bar value={v} segments={14} w={300} h={24} />
          <Px size={18} color={done && Math.floor(g / 5) % 2 ? GOLD_LIGHT : GOLD}>{done ? "CLEAR!" : `${String(Math.round(v * 100)).padStart(3, " ")}%`}</Px>
        </PixelBox>
        <Banner g={g} at={cue(9, 3)} end={end}>
          <span style={ko(50)}>브랜드는 <span style={{ color: GOLD }}>행동</span>으로</span>
          <span style={ko(60, GOLD, 900)}>증명된다.</span>
        </Banner>
      </>
    );
  },
  // 10 — the last question, large, over the landscape; it stays to the end
  10: (g) => {
    const l1 = pop(g, cue(10, 0)), l2 = pop(g, cue(10, 1));
    return (
      <div style={{ position: "absolute", left: 0, width: SAFE_W, top: 672, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ ...ko(74), textShadow: outline(5), opacity: l1.opacity, transform: `scale(${l1.scale})` }}>당신의 조직은</div>
        <div style={{ ...ko(92, WHITE, 900), textShadow: outline(6), opacity: l2.opacity, transform: `scale(${l2.scale})` }}>하나의 <span style={{ color: GOLD }}>브랜드</span>인가?</div>
      </div>
    );
  },
};
/** width that centred text is centred in: the frame minus the button column on the right */
const SAFE_W = W - 60;
