import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  random,
  staticFile,
  useCurrentFrame,
  continueRender,
  delayRender,
} from "remotion";

const SANS = "Noto Sans KR";
const DISPLAY = "Anton";
const BG = "#0D1015";
const INK = "#F2F4F7";
const SUB = "#8A93A3";
const BODY = "#D5DAE1";
const HAIR = "rgba(255,255,255,0.10)";
const AMBER = "#F2B45C";
const BAR = "#4A5260";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });

export const TOTAL = 1200;
const MX = 100;

// ---------- Timeline ----------
// S1 shouting phrase 0–170 · S2 highlighting 170–400 · S3 search 400–550
// S4 everyday 550–760 · S5 subtract 760–1030 · S6 calm phrase 1030–1200
const WORD_AT = [10, 20, 30, 40, 52];
const SWEEP_AT = Array.from({ length: 8 }, (_, i) => 200 + i * 24);
const SWEEP_DUR = 12;
const WIPE_AT = Array.from({ length: 8 }, (_, i) => 800 + (7 - i) * 8); // bottom line clears first
const KEY = 3;
const KEY_AT = 890;
const LOCK_AT = 905;
const SEARCH = { from: 405, to: 548, step: 16, order: [1, 5, 2, 6, 0, 4, 7, 2, 5] };

const PAGE = { x0: 140, y0: 450, x1: 940, y1: 1120 };
const LINE_Y = (i: number) => 570 + i * 66;

// Deterministic "words" for each text line
const LINES: number[][] = Array.from({ length: 8 }, (_, i) => {
  const words: number[] = [];
  const max = i === 7 ? 420 : 680 + random(`lw${i}`) * 60;
  let x = 0;
  let k = 0;
  while (x < max) {
    const w = 40 + random(`w${i}-${k}`) * 120;
    words.push(Math.min(w, max - x));
    x += w + 18;
    k++;
  }
  return words;
});

// Highlight amount for line i at frame f (0..1), and whether a pen is moving on it
const sweepIn = (i: number, f: number) => interpolate(f, [SWEEP_AT[i], SWEEP_AT[i] + SWEEP_DUR], [0, 1], { ...clamp, easing: easeInOut });
const wipeOut = (i: number, f: number) => interpolate(f, [WIPE_AT[i], WIPE_AT[i] + 12], [0, 1], { ...clamp, easing: easeInOut });
const keyIn = (f: number) => interpolate(f, [KEY_AT, KEY_AT + 14], [0, 1], { ...clamp, easing: easeInOut });
const highlightAt = (i: number, f: number) => {
  const h = sweepIn(i, f) * (1 - wipeOut(i, f));
  return i === KEY ? Math.max(h, keyIn(f)) : h;
};
const countAt = (f: number) => Array.from({ length: 8 }, (_, i) => highlightAt(i, f)).filter((h) => h > 0.5).length;

// ---------- Fonts ----------

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${DISPLAY}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/anton-latin-400-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`700 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`400 64px "${DISPLAY}"`, "A"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ---------- Text primitives ----------

const Line: React.FC<{ f: number; at: number; style?: React.CSSProperties; children: React.ReactNode }> =
  ({ f, at, style, children }) => {
    const p = prog(f, at, 20);
    return (
      <div style={{ overflow: "hidden", paddingBottom: "0.12em" }}>
        <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: 0.3 + 0.7 * p, whiteSpace: "nowrap", ...style }}>
          {children}
        </div>
      </div>
    );
  };

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color?: string }> =
  ({ f, from, to, tag, text, color = AMBER }) => {
    if (f < from || f >= to) return null;
    const p = prog(f, from, 20) * clamp01((to - f) / 10);
    return (
      <div style={{ position: "absolute", left: MX, top: 360, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
        <div style={{ width: 36 * p, height: 2, background: color }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{tag}</span>
        <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>{text}</span>
      </div>
    );
  };

type Seg = { t: string; c?: string };
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[]; big?: boolean };

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 1250, opacity: out }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.5, color: BODY }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.c ? 700 : undefined }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: 66, to: 168, lines: [
    { at: 66, segs: [{ t: "모든 것이 소리치면," }] },
    { at: 76, segs: [{ t: "아무것도 " }, { t: "눈에 띄지 않는다.", c: INK }] },
  ] },
  { from: 195, to: 300, lines: [{ at: 195, segs: [{ t: "중요해 보여서 하나씩 칠하다 보면," }] }] },
  { from: 300, to: 398, lines: [{ at: 300, segs: [{ t: "결국 " }, { t: "전부", c: AMBER }, { t: " 칠해져 있다" }] }] },
  { from: 410, to: 548, lines: [
    { at: 410, segs: [{ t: "그럼, 가장 중요한 문장은" }] },
    { at: 418, segs: [{ t: "어디였을까?", c: INK }] },
  ] },
  { from: 620, to: 758, lines: [
    { at: 620, segs: [{ t: "강조가 늘수록," }] },
    { at: 660, segs: [{ t: "강조는 " }, { t: "힘을 잃는다", c: INK }] },
  ] },
  { from: 790, to: 895, lines: [{ at: 790, segs: [{ t: "하나만 남기면," }] }] },
  { from: 895, to: 1028, lines: [{ at: 895, segs: [{ t: "그 하나", c: AMBER }, { t: "가 보인다" }] }] },
  { from: 1080, to: TOTAL + 10, lines: [{ at: 1080, segs: [{ t: "덜 강조할수록, " }, { t: "더 잘 보인다.", c: INK }] }] },
];

// ---------- S1: the shouting phrase ----------

const LOUD = ["WHEN", "EVERYTHING", "SHOUTS,", "NOTHING", "STANDS OUT."];

const Shouting: React.FC<{ f: number }> = ({ f }) => {
  if (f >= 172) return null;
  const out = interpolate(f, [158, 170], [1, 0], clamp);
  let shake = 0;
  for (const at of WORD_AT) {
    const d = f - at;
    if (d >= 0 && d < 7) shake = Math.max(shake, 7 * (1 - d / 7));
  }
  return (
    <div style={{
      position: "absolute", left: 80, top: 300, opacity: out,
      transform: `translate(${Math.sin(f * 2.3) * shake}px, ${Math.cos(f * 3.1) * shake * 0.6}px)`,
    }}>
      {LOUD.map((w, k) => {
        const d = f - WORD_AT[k];
        if (d < 0) return <div key={k} style={{ height: 172 }} />;
        const s = interpolate(d, [0, 7], [1.32, 1], { ...clamp, easing: easeOut });
        const o = clamp01(d / 3);
        const tremble = 1 + 0.007 * Math.sin(f * 0.33 + k * 1.7);
        return (
          <div key={k} style={{
            fontFamily: `'${DISPLAY}', sans-serif`, fontSize: 182, lineHeight: 0.945, color: INK,
            transform: `scale(${s * tremble})`, transformOrigin: "0% 60%", opacity: o, whiteSpace: "nowrap",
          }}>{w}</div>
        );
      })}
    </div>
  );
};

// ---------- S2/S3/S5: the textbook page ----------

const pageOpacity = (f: number) =>
  Math.min(
    interpolate(f, [170, 188, 545, 560], [0, 1, 1, 0], clamp) + interpolate(f, [755, 775, 1020, 1036], [0, 1, 1, 0], clamp),
    1,
  );

const Page: React.FC<{ f: number }> = ({ f }) => {
  const op = pageOpacity(f);
  if (op <= 0) return null;
  const keyFocus = interpolate(f, [KEY_AT + 6, KEY_AT + 26], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={PAGE.y1 - PAGE.y0} rx={8}
          fill="rgba(255,255,255,0.025)" stroke={HAIR} strokeWidth={1.5} />
        <rect x={180} y={488} width={250} height={20} rx={10} fill="#6B7383" />
        <rect x={446} y={492} width={110} height={12} rx={6} fill="#4A5260" />
        <line x1={180} y1={530} x2={900} y2={530} stroke={HAIR} strokeWidth={1.5} />
        {LINES.map((words, i) => {
          const y = LINE_Y(i);
          const h = highlightAt(i, f);
          const width = words.reduce((s, w) => s + w + 18, -18);
          const active = (f >= SWEEP_AT[i] && f < SWEEP_AT[i] + SWEEP_DUR) || (i === KEY && f >= KEY_AT && f < KEY_AT + 14);
          const penX = 180 + width * h;
          const isKey = i === KEY;
          const barColor = isKey
            ? interpolateColors(keyFocus, [0, 1], [BAR, "#DCE1E8"])
            : interpolateColors(keyFocus, [0, 1], [BAR, "#323843"]);
          const hiOpacity = isKey ? 0.34 + 0.16 * keyFocus : 0.34;
          let x = 180;
          return (
            <g key={i}>
              {h > 0 && (
                <rect x={170} y={y - 21} width={(width + 20) * h} height={42} rx={5}
                  fill={AMBER} opacity={hiOpacity} />
              )}
              {words.map((w, k) => {
                const el = <rect key={k} x={x} y={y - 6} width={w} height={12} rx={6} fill={barColor} />;
                x += w + 18;
                return el;
              })}
              {active && (
                <g transform={`translate(${penX} ${y}) rotate(-14)`}>
                  <rect x={-8} y={-30} width={22} height={52} rx={5} fill={AMBER} />
                  <rect x={-8} y={-30} width={22} height={14} rx={4} fill="#FFF1D6" opacity={0.5} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const Brackets: React.FC<{ cx: number; cy: number; w: number; h: number; color: string; opacity: number }> =
  ({ cx, cy, w, h, color, opacity }) => {
    const L = 24, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    const s = { stroke: color, strokeWidth: 3, fill: "none", strokeLinecap: "round" as const };
    return (
      <g opacity={opacity}>
        <polyline points={`${x0},${y0 + L} ${x0},${y0} ${x0 + L},${y0}`} {...s} />
        <polyline points={`${x1 - L},${y0} ${x1},${y0} ${x1},${y0 + L}`} {...s} />
        <polyline points={`${x0},${y1 - L} ${x0},${y1} ${x0 + L},${y1}`} {...s} />
        <polyline points={`${x1 - L},${y1} ${x1},${y1} ${x1},${y1 - L}`} {...s} />
      </g>
    );
  };

const Search: React.FC<{ f: number }> = ({ f }) => {
  // S3: wander from line to line without ever settling
  if (f >= SEARCH.from && f < SEARCH.to + 12) {
    const step = Math.floor((f - SEARCH.from) / SEARCH.step);
    const t = easeInOut(clamp01(((f - SEARCH.from) % SEARCH.step) / (SEARCH.step * 0.8)));
    const a = SEARCH.order[Math.min(step, SEARCH.order.length - 1)];
    const b = SEARCH.order[Math.min(step + 1, SEARCH.order.length - 1)];
    const cy = LINE_Y(a) + (LINE_Y(b) - LINE_Y(a)) * t;
    const op = prog(f, SEARCH.from, 10) * interpolate(f, [SEARCH.to, SEARCH.to + 12], [1, 0], clamp);
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Brackets cx={540} cy={cy} w={780} h={64} color={INK} opacity={op * 0.85} />
      </svg>
    );
  }
  // S5: lock onto the one highlighted line immediately
  if (f >= LOCK_AT && f < 1036) {
    const p = prog(f, LOCK_AT, 14);
    const op = p * interpolate(f, [1018, 1034], [1, 0], clamp);
    const s = 1.08 - 0.08 * p;
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Brackets cx={540} cy={LINE_Y(KEY)} w={780 * s} h={64 * s} color={AMBER} opacity={op} />
      </svg>
    );
  }
  return null;
};

const Metric: React.FC<{ f: number }> = ({ f }) => {
  const op = pageOpacity(f) * prog(f, 196, 16);
  if (op <= 0) return null;
  const n = countAt(f);
  return (
    <div style={{ position: "absolute", left: MX + 40, top: 1150, display: "flex", alignItems: "baseline", gap: 14, opacity: op }}>
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: SUB }}>강조</span>
      <span style={{ fontSize: 46, fontWeight: 700, color: n === 1 ? AMBER : INK, fontVariantNumeric: "tabular-nums" }}>{n}</span>
      <span style={{ fontSize: 26, fontWeight: 400, color: SUB }}>/ 8줄</span>
    </div>
  );
};

// ---------- S4: everyday ----------

const EVERYDAY = [
  { tag: "[긴급]", text: "모든 메일 제목에" },
  { tag: "굵게", text: "문서의 모든 글자를" },
  { tag: "“이건 꼭”", text: "모든 말 앞에" },
];
const ROW_AT = [590, 615, 640];

const Everyday: React.FC<{ f: number }> = ({ f }) => {
  if (f < 556 || f >= 762) return null;
  const out = interpolate(f, [745, 760], [1, 0], clamp);
  const sync = 0.8 + 0.2 * Math.sin(f * 0.22);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 560, opacity: out }}>
      {EVERYDAY.map((r, i) => {
        const p = prog(f, ROW_AT[i], 20);
        return (
          <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
            <div style={{ height: 1.5, background: HAIR, transform: `scaleX(${p})`, transformOrigin: "left" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 36, padding: "46px 0" }}>
              <div style={{
                width: 190, textAlign: "center", fontSize: 32, fontWeight: 700, color: AMBER,
                border: `1.5px solid ${AMBER}`, borderRadius: 30, padding: "8px 0", opacity: sync,
              }}>{r.tag}</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: INK, letterSpacing: -1 }}>{r.text}</div>
            </div>
          </div>
        );
      })}
      <div style={{ height: 1.5, background: HAIR, transform: `scaleX(${prog(f, ROW_AT[2], 20)})`, transformOrigin: "left" }} />
    </div>
  );
};

// ---------- S6: the calm phrase ----------

const Calm: React.FC<{ f: number }> = ({ f }) => {
  if (f < 1030) return null;
  const glow = prog(f, 1062, 40);
  return (
    <div style={{ position: "absolute", left: MX, top: 560 }}>
      <Line f={f} at={1034} style={{ fontSize: 40, fontWeight: 400, color: SUB, letterSpacing: 4 }}>WHEN EVERYTHING SHOUTS,</Line>
      <Line f={f} at={1042} style={{ fontSize: 40, fontWeight: 400, color: SUB, letterSpacing: 4, marginTop: 8 }}>NOTHING</Line>
      <div style={{ marginTop: 34 }}>
        <Line f={f} at={1056} style={{
          fontSize: 132, fontWeight: 700, color: AMBER, letterSpacing: -3, lineHeight: 1.1,
          textShadow: `0 0 ${40 * glow}px rgba(242,180,92,${0.35 * glow})`,
        }}>STANDS OUT.</Line>
      </div>
    </div>
  );
};

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.06, mixBlendMode: "soft-light", pointerEvents: "none" }}>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={(Math.floor(f / 2) % 4) + 1} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// ---------- Root ----------

export const EverythingShouts: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SANS}', sans-serif`, opacity: endFade,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 55% at 50% 44%, #18202B 0%, rgba(13,16,21,0) 70%)",
      }} />
      <Shouting f={f} />
      <Overline f={f} from={174} to={552} tag="CASE" text="시험 전날 교과서" />
      <Overline f={f} from={558} to={760} tag="EVERYDAY" text="일상에서도" />
      <Overline f={f} from={764} to={1032} tag="SUBTRACT" text="덜어내기" />
      <Page f={f} />
      <Search f={f} />
      <Metric f={f} />
      <Everyday f={f} />
      <Calm f={f} />
      <Captions f={f} caps={CAPTIONS} />
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
