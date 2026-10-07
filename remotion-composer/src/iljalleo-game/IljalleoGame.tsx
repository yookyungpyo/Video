import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";
import {
  Block, CHEST_OPEN, CLEAR_DELAY, COLS, CONTINUE_AT, LEVEL_UPS, NEON, PAUSE_AT,
  ROWS, SHIFT_FRAMES, SIM, rowAt, stackHeight,
} from "./engine";

const FONT = "Noto Sans KR";
const BG = "#070B1E";
const NAVY = "#0B1026";
const CELL = 76;
const BW = COLS * CELL;
const BH = ROWS * CELL;
const BX = (1080 - BW) / 2;
const BY = 440;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const fontCss = `
@font-face { font-family: '${FONT}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${FONT}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${FONT}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${FONT}"`, "가"),
      (document as any).fonts.load(`700 64px "${FONT}"`, "가"),
      (document as any).fonts.load(`900 64px "${FONT}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const neon = (color: string, size = 1) =>
  `0 0 ${8 * size}px ${color}, 0 0 ${22 * size}px ${color}aa, 0 0 ${44 * size}px ${color}55`;

const pop = (frame: number, fps: number, at: number, stiffness = 180, damping = 12) =>
  spring({ frame: frame - at, fps, config: { stiffness, damping, mass: 0.7 } });

// ---------- Timeline helpers ----------

const levelAt = (f: number) => {
  if (f >= 650) return { lv: "∞", speed: "x∞" };
  if (f >= 600) return { lv: "4", speed: "x5" };
  if (f >= LEVEL_UPS[1]) return { lv: "3", speed: "x3" };
  if (f >= LEVEL_UPS[0]) return { lv: "2", speed: "x2" };
  return { lv: "1", speed: "x1" };
};

const trustAt = (f: number) => {
  let v = 0;
  for (const b of SIM.blocks) v += 10 * clamp01((f - b.land) / 8);
  for (const c of SIM.clears) v += 100 * clamp01((f - c.f) / 12);
  return Math.round(v);
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const shakeAt = (f: number) => {
  let i = 0;
  for (const b of SIM.blocks) {
    if (b.land < LEVEL_UPS[0]) continue;
    const d = f - b.land;
    if (d >= 0 && d < 5) i += 4 * (1 - d / 5);
  }
  for (const at of [...LEVEL_UPS, CHEST_OPEN]) {
    const d = f - at;
    if (d >= 0 && d < 12) i += 10 * (1 - d / 12);
  }
  if (f >= 600 && f < PAUSE_AT) i += interpolate(f, [600, PAUSE_AT], [2, 13], clamp);
  i = Math.min(i, 18);
  return { x: Math.sin(f * 1.9) * i, y: Math.cos(f * 2.7) * i * 0.8 };
};

// ---------- Background ----------

const Backdrop: React.FC<{ f: number }> = ({ f }) => (
  <>
    <div style={{
      position: "absolute", inset: 0,
      background: `radial-gradient(ellipse at 50% 40%, #16204A 0%, ${BG} 70%)`,
    }} />
    {Array.from({ length: 40 }).map((_, i) => {
      const tw = 0.25 + 0.75 * Math.abs(Math.sin(f * 0.05 + i * 1.3));
      return (
        <div key={i} style={{
          position: "absolute",
          left: random(`sx${i}`) * 1080, top: random(`sy${i}`) * 1920,
          width: 3, height: 3, borderRadius: 2,
          background: i % 3 === 0 ? NEON.cyan : "#FFFFFF",
          opacity: 0.12 + 0.3 * tw * random(`so${i}`),
        }} />
      );
    })}
    {/* Retro floor grid */}
    <div style={{
      position: "absolute", left: -400, right: -400, bottom: 0, height: 520,
      transform: "perspective(500px) rotateX(62deg)", transformOrigin: "bottom",
      backgroundImage: `linear-gradient(${NEON.pink}55 2px, transparent 2px), linear-gradient(90deg, ${NEON.pink}55 2px, transparent 2px)`,
      backgroundSize: "80px 80px",
      backgroundPosition: `0 ${(f * 3) % 80}px`,
      opacity: 0.35,
      maskImage: "linear-gradient(to top, black, transparent)",
      WebkitMaskImage: "linear-gradient(to top, black, transparent)",
    }} />
  </>
);

// ---------- HUD ----------

const Panel: React.FC<{ x: number; w: number; label: string; value: string; color: string; bump?: number }> =
  ({ x, w, label, value, color, bump = 0 }) => (
    <div style={{
      position: "absolute", left: x, top: 250, width: w, height: 140,
      border: `4px solid ${color}`, borderRadius: 18,
      background: "rgba(11,16,38,0.85)",
      boxShadow: `0 0 18px ${color}66, inset 0 0 18px ${color}33`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ color, fontSize: 30, fontWeight: 700, letterSpacing: 4, opacity: 0.85 }}>{label}</div>
      <div style={{
        color: "#FFFFFF", fontSize: 58, fontWeight: 900, lineHeight: 1.1,
        textShadow: neon(color, 0.6), transform: `scale(${1 + bump * 0.18})`,
        fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
    </div>
  );

const Hud: React.FC<{ f: number }> = ({ f }) => {
  const { lv, speed } = levelAt(f);
  const trust = trustAt(f);
  const clearBump = SIM.clears.reduce((m, c) => Math.max(m, clamp01(1 - Math.abs(f - c.f - 6) / 6)), 0);
  const lvBump = [...LEVEL_UPS, 600, 650].reduce((m, at) => Math.max(m, clamp01(1 - Math.abs(f - at - 4) / 6)), 0);
  const salaryBump = clamp01(1 - Math.abs(f - CHEST_OPEN - 8) / 6);
  return (
    <>
      <Panel x={60} w={230} label={`LEVEL · ${speed}`} value={`LV ${lv}`} color={NEON.cyan} bump={lvBump} />
      <Panel x={310} w={380} label="신뢰" value={trust.toLocaleString()} color={NEON.green} bump={clearBump} />
      <Panel x={710} w={310} label="연봉" value="+0" color={NEON.pink} bump={salaryBump} />
    </>
  );
};

// ---------- Blocks ----------

const BlockView: React.FC<{ b: Block; f: number }> = ({ b, f }) => {
  if (f < b.spawn) return null;
  if (b.removedAt !== undefined && f >= b.removedAt) return null;

  let row: number;
  if (f < b.land) {
    const p = (f - b.spawn) / b.dur;
    row = ROWS + (b.hist[0].row - ROWS) * Easing.in(Easing.quad)(p);
  } else {
    row = rowAt(b, f);
    for (let i = 1; i < b.hist.length; i++) {
      const h = b.hist[i];
      const d = f - h.f;
      if (d >= 0 && d < SHIFT_FRAMES) {
        const prev = b.hist[i - 1].row;
        row = prev + (h.row - prev) * Easing.out(Easing.cubic)(d / SHIFT_FRAMES);
      }
    }
  }

  const sinceLand = f - b.land;
  const squash = sinceLand >= 0 && sinceLand < 7 ? 1 - sinceLand / 7 : 0;
  const flashing = b.flashFrom !== undefined && f >= b.flashFrom && f < b.flashFrom + CLEAR_DELAY;
  const flashOn = flashing && (f - (b.flashFrom ?? 0)) % 4 < 2;

  const isChest = b.chestOpenAt !== undefined && f < b.chestOpenAt;
  const opened = b.chestOpenAt !== undefined && f >= b.chestOpenAt;
  const color = opened ? NEON.pink : b.color;
  const label = opened ? "또 일" : b.label;
  const openPop = opened ? clamp01(1 - (f - (b.chestOpenAt ?? 0)) / 10) : 0;
  const wobble = isChest && f >= b.land ? Math.sin(f * 0.9) * 4 * clamp01((f - b.land) / 10) : 0;
  const chestGlow = isChest ? 0.6 + 0.4 * Math.sin(f * 0.4) : 0;

  return (
    <div style={{
      position: "absolute",
      left: b.col * CELL + 3, top: (ROWS - 1 - row) * CELL + 3,
      width: b.w * CELL - 6, height: CELL - 6,
      borderRadius: 12,
      background: flashOn
        ? "#FFFFFF"
        : `linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0) 55%), ${color}`,
      border: `3px solid ${flashOn ? "#FFFFFF" : "rgba(255,255,255,0.55)"}`,
      boxShadow: flashing
        ? `0 0 40px #FFFFFF, 0 0 70px ${color}`
        : `0 0 ${18 + chestGlow * 30}px ${color}${isChest ? "" : "99"}, inset 0 -7px 0 rgba(0,0,0,0.22)`,
      transform: `rotate(${wobble}deg) scale(${1 + squash * 0.07 + openPop * 0.25 + (flashing ? 0.04 : 0)}, ${1 - squash * 0.2 + openPop * 0.25})`,
      transformOrigin: "50% 100%",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      color: NAVY, fontSize: 28, fontWeight: 900, whiteSpace: "nowrap",
      fontFamily: `'${FONT}', sans-serif`,
    }}>
      {isChest && (
        <div style={{
          width: 26, height: 26, borderRadius: 13, background: NAVY,
          border: `4px solid #FFF3C4`, boxSizing: "border-box",
        }} />
      )}
      {label}
    </div>
  );
};

// ---------- Board ----------

const Board: React.FC<{ f: number }> = ({ f }) => {
  const height = stackHeight(f);
  const danger = height >= 9 && f < PAUSE_AT;
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.5);
  return (
    <div style={{
      position: "absolute", left: BX - 8, top: BY - 8, width: BW + 16, height: BH + 16,
      border: `5px solid ${danger ? "#FF3B5C" : NEON.cyan}`, borderRadius: 20,
      boxShadow: neon(danger ? "#FF3B5C" : NEON.cyan, danger ? 0.6 + pulse * 0.6 : 0.6),
      background: "rgba(8,12,32,0.9)", padding: 3,
    }}>
      <div style={{
        position: "relative", width: BW, height: BH, overflow: "hidden", borderRadius: 12,
        backgroundImage: `linear-gradient(rgba(34,211,238,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(34,211,238,0.07) 2px, transparent 2px)`,
        backgroundSize: `${CELL}px ${CELL}px`,
      }}>
        {danger && (
          <div style={{
            position: "absolute", left: 0, right: 0, top: 0, height: CELL * 3,
            background: `linear-gradient(180deg, rgba(255,59,92,${0.25 + pulse * 0.25}), transparent)`,
          }} />
        )}
        {SIM.blocks.map((b) => <BlockView key={b.id} b={b} f={f} />)}
        {SIM.clears.map((c, i) => {
          const d = f - c.f;
          if (d < 0 || d > CLEAR_DELAY + 4) return null;
          return (
            <div key={i} style={{
              position: "absolute", left: 0, right: 0,
              top: (ROWS - 1 - c.row) * CELL + CELL / 2 - 4, height: 8,
              background: "#FFFFFF",
              boxShadow: "0 0 30px #FFFFFF, 0 0 60px #22D3EE",
              transform: `scaleX(${Easing.out(Easing.cubic)(clamp01(d / 6))})`,
              opacity: 1 - clamp01((d - CLEAR_DELAY) / 4),
            }} />
          );
        })}
      </div>
    </div>
  );
};

// ---------- NEXT preview ----------

const NextBox: React.FC<{ f: number }> = ({ f }) => {
  const next = SIM.blocks.filter((b) => b.spawn > f).sort((a, b) => a.spawn - b.spawn)[0];
  return (
    <div style={{
      position: "absolute", left: 40, top: BY, width: 172, height: 190,
      border: `4px solid ${NEON.purple}`, borderRadius: 16,
      background: "rgba(11,16,38,0.85)", boxShadow: `0 0 16px ${NEON.purple}66`,
      display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 26,
    }}>
      <div style={{ color: NEON.purple, fontSize: 30, fontWeight: 900, letterSpacing: 6 }}>NEXT</div>
      {next && (
        <div style={{
          minWidth: 90, padding: "10px 14px", borderRadius: 10,
          background: `linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0) 55%), ${next.color}`,
          border: "3px solid rgba(255,255,255,0.55)", boxShadow: `0 0 14px ${next.color}`,
          color: NAVY, fontSize: 26, fontWeight: 900, textAlign: "center", whiteSpace: "nowrap",
        }}>{next.label}</div>
      )}
    </div>
  );
};

// ---------- Popups ----------

type Popup = { f: number; x: number; y: number; text: string; color: string; size: number; dur?: number };

const POPUPS: Popup[] = [
  ...SIM.clears.map((c) => ({
    f: c.f, x: 540, y: BY + (ROWS - 1 - c.row) * CELL + CELL / 2,
    text: "PERFECT!", color: NEON.yellow, size: 84,
  })),
  ...[292, 330, 372, 410, 438, 560, 610, 640].map((f, i) => ({
    f, x: 300 + random(`px${i}`) * 480, y: BY + 140 + random(`py${i}`) * 260,
    text: "+일 10개", color: NEON.pink, size: 54,
  })),
  { f: CHEST_OPEN, x: BX + 4 * CELL, y: BY + 5 * CELL, text: "칭찬 한마디 +1", color: NEON.gold, size: 66, dur: 40 },
  { f: CHEST_OPEN + 8, x: 865, y: 420, text: "연봉 +0", color: NEON.pink, size: 44, dur: 34 },
];

const Popups: React.FC<{ f: number; fps: number }> = ({ f, fps }) => (
  <>
    {POPUPS.map((p, i) => {
      const dur = p.dur ?? 26;
      const d = f - p.f;
      if (d < 0 || d > dur) return null;
      const s = pop(f, fps, p.f, 220, 11);
      return (
        <div key={i} style={{
          position: "absolute", left: p.x, top: p.y - d * 2.2,
          transform: `translate(-50%, -50%) scale(${s})`,
          color: "#FFFFFF", fontSize: p.size, fontWeight: 900, whiteSpace: "nowrap",
          textShadow: neon(p.color, 0.9), WebkitTextStroke: `2px ${p.color}`,
          opacity: 1 - clamp01((d - dur + 8) / 8),
        }}>{p.text}</div>
      );
    })}
  </>
);

// ---------- Mascot ----------

const BUBBLES = [
  { from: 120, to: 262, text: "할 만한데?" },
  { from: 300, to: 444, text: "어…?" },
  { from: 494, to: CHEST_OPEN, text: "보상이다!" },
  { from: CHEST_OPEN + 10, to: 598, text: "…또 일?" },
  { from: 620, to: PAUSE_AT, text: "살려줘" },
];

const Mascot: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const enter = pop(f, fps, 18, 160, 10);
  let jump = 0;
  for (const at of [...SIM.clears.map((c) => c.f), CHEST_OPEN]) {
    const d = f - at;
    if (d >= 0 && d < 14) jump = Math.max(jump, Math.sin((Math.PI * d) / 14) * 46);
  }
  const panic = f >= 610 && f < PAUSE_AT;
  const tilt = panic ? Math.sin(f * 1.3) * 12 : Math.sin(f * 0.12) * 4;
  const bob = Math.sin(f * 0.15) * 6;
  const bubble = BUBBLES.find((b) => f >= b.from && f < b.to);
  const bubbleS = bubble ? pop(f, fps, bubble.from, 220, 13) : 0;
  return (
    <div style={{
      position: "absolute", left: 958, top: 1180,
      transform: `translate(-50%, 0) translateY(${(1 - enter) * 200 - jump + bob}px)`,
    }}>
      {bubble && (
        <div style={{
          position: "absolute", left: "50%", bottom: 150,
          transform: `translateX(-62%) scale(${bubbleS})`, transformOrigin: "70% 100%",
          background: "#FFFFFF", color: NAVY, borderRadius: 22, padding: "10px 18px",
          fontSize: 32, fontWeight: 900, whiteSpace: "nowrap",
          boxShadow: `0 0 18px ${NEON.yellow}88`,
        }}>
          {bubble.text}
          <div style={{
            position: "absolute", left: "62%", bottom: -12, width: 0, height: 0,
            borderLeft: "12px solid transparent", borderRight: "12px solid transparent",
            borderTop: "14px solid #FFFFFF",
          }} />
        </div>
      )}
      <div style={{
        fontSize: 120, lineHeight: 1, transform: `rotate(${tilt}deg) scale(${enter})`,
        filter: `drop-shadow(0 0 18px ${NEON.yellow}88)`,
      }}>🐱</div>
      <div style={{
        marginTop: 4, textAlign: "center", color: NEON.yellow, fontSize: 26, fontWeight: 900,
        letterSpacing: 4, textShadow: neon(NEON.yellow, 0.4), opacity: enter,
      }}>P1</div>
    </div>
  );
};

// ---------- Captions ----------

type Caption = { from: number; to: number; lines: { text: string; color?: string }[][] };

const CAPTIONS: Caption[] = [
  { from: 110, to: 270, lines: [[{ text: "일 잘하면?" }]] },
  { from: 288, to: 452, lines: [[{ text: "일 잘하면" }], [{ text: "일이 더 온다", color: NEON.yellow }]] },
  { from: 466, to: 534, lines: [[{ text: "드디어 " }, { text: "보상", color: NEON.gold }, { text: "인 줄 알았는데…" }]] },
  { from: 540, to: 600, lines: [[{ text: "칭찬 한마디, 그리고 " }, { text: "또 일", color: NEON.pink }]] },
  { from: 606, to: PAUSE_AT, lines: [[{ text: "쉴 틈 없이 쌓이는 일" }]] },
];

const Captions: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const c = CAPTIONS.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const s = pop(f, fps, c.from, 200, 14);
  const out = clamp01((c.to - f) / 6);
  return (
    <div style={{
      position: "absolute", left: 40, right: 40, top: 1384, height: 190,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: out, transform: `translateY(${(1 - s) * 40}px) scale(${0.9 + s * 0.1})`,
    }}>
      {c.lines.map((line, li) => (
        <div key={li} style={{
          fontSize: c.lines.length > 1 ? 70 : 66, fontWeight: 900, lineHeight: 1.22,
          whiteSpace: "nowrap", color: "#FFFFFF",
          textShadow: "0 4px 0 #000, 0 0 24px rgba(0,0,0,0.9)",
        }}>
          {line.map((seg, si) => (
            <span key={si} style={{
              color: seg.color ?? "#FFFFFF",
              textShadow: seg.color ? `${neon(seg.color, 0.5)}, 0 4px 0 #000` : undefined,
            }}>{seg.text}</span>
          ))}
        </div>
      ))}
    </div>
  );
};

// ---------- Overlays ----------

const TitleScreen: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  if (f >= 92) return null;
  const fade = interpolate(f, [72, 92], [1, 0], clamp);
  const t1 = pop(f, fps, 4, 140, 11);
  const t2 = pop(f, fps, 14, 160, 12);
  const start = pop(f, fps, 64, 260, 10);
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(5,8,22,0.88)", opacity: fade,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        fontSize: 200, fontWeight: 900, color: NEON.yellow, lineHeight: 1,
        textShadow: neon(NEON.yellow, 1.1), transform: `scale(${t1 * (1 + (1 - fade) * 0.4)})`,
      }}>일잘러</div>
      <div style={{
        marginTop: 20, fontSize: 92, fontWeight: 900, color: NEON.cyan, letterSpacing: 26,
        textShadow: neon(NEON.cyan, 0.9), opacity: t2, transform: `translateY(${(1 - t2) * 40}px)`,
      }}>MODE</div>
      <div style={{ height: 120 }} />
      {f < 64 ? (
        <div style={{
          fontSize: 54, fontWeight: 900, color: "#FFFFFF", letterSpacing: 8,
          opacity: f > 24 && f % 20 < 12 ? 1 : 0.15,
        }}>PRESS START</div>
      ) : (
        <div style={{
          fontSize: 96, fontWeight: 900, color: NEON.pink, letterSpacing: 10,
          textShadow: neon(NEON.pink, 1), transform: `scale(${start})`,
        }}>START!</div>
      )}
    </div>
  );
};

const LevelUpFlash: React.FC<{ f: number; fps: number }> = ({ f, fps }) => (
  <>
    {LEVEL_UPS.map((at) => {
      const d = f - at;
      if (d < 0 || d > 34) return null;
      const s = pop(f, fps, at, 240, 10);
      return (
        <div key={at} style={{ position: "absolute", inset: 0 }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(circle at 50% 46%, #E8FDFF 0%, ${NEON.cyan}88 45%, transparent 80%)`,
            opacity: 0.4 * (d < 2 ? d / 2 : clamp01(1 - (d - 2) / 9)),
          }} />
          <div style={{
            position: "absolute", left: 0, right: 0, top: BY + BH / 2 - 90,
            textAlign: "center", fontSize: 130, fontWeight: 900, color: "#FFFFFF",
            WebkitTextStroke: `3px ${NEON.cyan}`, textShadow: neon(NEON.cyan, 1.2),
            transform: `scale(${s}) rotate(${-4 + d * 0.1}deg)`,
            opacity: 1 - clamp01((d - 26) / 8),
          }}>LEVEL UP!</div>
        </div>
      );
    })}
  </>
);

const ChestBurst: React.FC<{ f: number }> = ({ f }) => {
  const d = f - CHEST_OPEN;
  if (d < 0 || d > 24) return null;
  const chest = SIM.blocks.find((b) => b.chestOpenAt !== undefined)!;
  const cx = BX + (chest.col + chest.w / 2) * CELL;
  const cy = BY + (ROWS - 1 - rowAt(chest, f)) * CELL + CELL / 2;
  return (
    <div style={{ position: "absolute", left: cx, top: cy }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 30 + d * 14;
        return (
          <div key={i} style={{
            position: "absolute", left: Math.cos(a) * r - 7, top: Math.sin(a) * r - 7,
            width: 14, height: 14, borderRadius: 3, transform: `rotate(${d * 20 + i * 30}deg)`,
            background: i % 2 ? NEON.gold : "#FFFFFF", boxShadow: `0 0 12px ${NEON.gold}`,
            opacity: 1 - d / 24,
          }} />
        );
      })}
    </div>
  );
};

const PauseScreen: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  if (f < PAUSE_AT) return null;
  const dim = interpolate(f, [PAUSE_AT, PAUSE_AT + 6], [0, 0.78], clamp);
  const inPause = f < CONTINUE_AT;
  const exit = interpolate(f, [CONTINUE_AT - 8, CONTINUE_AT], [1, 0], clamp);
  const a = pop(f, fps, PAUSE_AT + 6, 220, 11);
  const b = pop(f, fps, PAUSE_AT + 20, 220, 11);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `rgba(4,6,18,${dim})` }} />
      {inPause && (
        <div style={{
          position: "absolute", inset: 0, opacity: exit,
          display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 470,
        }}>
          <div style={{
            fontSize: 56, fontWeight: 900, color: NEON.cyan, letterSpacing: 10,
            textShadow: neon(NEON.cyan, 0.7), opacity: f % 24 < 16 ? 1 : 0.3,
          }}>❚❚ PAUSED</div>
          <div style={{ height: 110 }} />
          <div style={{
            fontSize: 150, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.1,
            WebkitTextStroke: `3px ${NEON.pink}`, textShadow: neon(NEON.pink, 1),
            transform: `scale(${a})`,
          }}>다시 일?</div>
          <div style={{ height: 40 }} />
          <div style={{
            fontSize: 118, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.1,
            WebkitTextStroke: `3px ${NEON.yellow}`, textShadow: neon(NEON.yellow, 1),
            transform: `scale(${b})`,
          }}>아니면 보상?</div>
        </div>
      )}
    </>
  );
};

const CURSOR_SWITCH = [CONTINUE_AT + 30, CONTINUE_AT + 55, CONTINUE_AT + 75];

const ContinueScreen: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  if (f < CONTINUE_AT) return null;
  const t = pop(f, fps, CONTINUE_AT, 180, 12);
  const sel = CURSOR_SWITCH.filter((s) => f >= s).length % 2;
  const count = Math.max(3, 9 - Math.floor((f - CONTINUE_AT) / 15));
  const q = pop(f, fps, CONTINUE_AT + 22, 200, 12);
  const c = pop(f, fps, CONTINUE_AT + 34, 200, 12);
  const btn = (i: number, text: string, color: string) => {
    const on = sel === i;
    const pulse = on ? 1.05 + 0.03 * Math.sin(f * 0.6) : 1;
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", left: -90, fontSize: 64, color, textShadow: neon(color, 0.8),
          opacity: on ? 1 : 0, transform: `translateX(${Math.sin(f * 0.7) * 10}px)`,
        }}>▶</div>
        <div style={{
          width: 600, height: 132, borderRadius: 24,
          border: `5px solid ${color}`,
          background: on ? color : "rgba(11,16,38,0.9)",
          color: on ? NAVY : color,
          boxShadow: on ? neon(color, 1) : `0 0 14px ${color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 66, fontWeight: 900, transform: `scale(${pulse})`,
        }}>{text}</div>
      </div>
    );
  };
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 400,
      opacity: t, transform: `translateY(${(1 - t) * 60}px)`,
    }}>
      <div style={{
        fontSize: 112, fontWeight: 900, color: "#FFFFFF", letterSpacing: 6,
        WebkitTextStroke: `3px ${NEON.pink}`, textShadow: neon(NEON.pink, 1),
      }}>CONTINUE?</div>
      <div style={{
        fontSize: 120, fontWeight: 900, color: NEON.yellow, lineHeight: 1.2,
        textShadow: neon(NEON.yellow, 0.8), fontVariantNumeric: "tabular-nums",
      }}>{count}</div>
      <div style={{ height: 50 }} />
      {btn(0, "다시 일", NEON.pink)}
      <div style={{ height: 44 }} />
      {btn(1, "보상", NEON.yellow)}
      <div style={{ height: 110 }} />
      <div style={{
        fontSize: 84, fontWeight: 900, color: "#FFFFFF",
        textShadow: "0 4px 0 #000", transform: `scale(${q})`,
      }}>당신의 경우는?</div>
      <div style={{
        marginTop: 18, fontSize: 52, fontWeight: 700, color: NEON.cyan,
        textShadow: neon(NEON.cyan, 0.5), opacity: c, transform: `translateY(${(1 - c) * 20}px)`,
      }}>댓글로 알려주세요 👇</div>
    </div>
  );
};

// ---------- Root ----------

export const IljalleoGame: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shake = shakeAt(f);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${FONT}', sans-serif`,
    }}>
      <FontLoader />
      <Backdrop f={f} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        <Hud f={f} />
        <NextBox f={f} />
        <Board f={f} />
        <ChestBurst f={f} />
        <Popups f={f} fps={fps} />
        <Mascot f={f} fps={fps} />
      </div>
      <Captions f={f} fps={fps} />
      <LevelUpFlash f={f} fps={fps} />
      <TitleScreen f={f} fps={fps} />
      <PauseScreen f={f} fps={fps} />
      <ContinueScreen f={f} fps={fps} />
      {/* CRT scanlines + vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, transparent 2px, transparent 5px)",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)",
      }} />
    </div>
  );
};
