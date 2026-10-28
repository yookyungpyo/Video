import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  continueRender,
  delayRender,
} from "remotion";

const SANS = "Noto Sans KR";
const WATER_TOP = "#EEF6F7";
const WATER_BOT = "#DCEBEE";
const INK = "#1B1E24";
const SUB = "#6F7D86";
const BODY = "#3A4650";
const HAIR = "rgba(27,30,36,0.12)";
const FISH = "#CBD6DE";
const FISH_EDGE = "#5E6B7D";
const REAL = "#8996A6";
const REAL_EDGE = "#3E4A5A";
const ME = "#F2B45C";
const ME_EDGE = "#C9771A";
const AMBER = "#DE8A1E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1260;
const MX = 100;

// ---------- Timeline ----------
// S1 loud voices: nine puff up, I shrink 0–246 · S2 why a pufferfish puffs 246–516
// S3 the real one doesn't puff 516–786 · S4 I swim on, they deflate 786–1026 · S5 just act 1026–1260
export const PUFF_AT = 80;
export const WHY_AT = 246;
export const REAL_AT = 516;
export const GO_AT = 786;
export const END_AT = 1026;

// ---------- School of ten (index 4 is the real one) ----------
const SCHOOL = [
  { x: 480, y: 600 }, { x: 680, y: 580 }, { x: 880, y: 640 },
  { x: 430, y: 800 }, { x: 640, y: 780 }, { x: 840, y: 830 },
  { x: 990, y: 760 },
  { x: 500, y: 1000 }, { x: 710, y: 1010 }, { x: 910, y: 990 },
];
const REAL_I = 4;
const TAGS: Record<number, string> = {
  0: "나 이거 10년 했어",
  2: "넌 아직 멀었어",
  7: "내가 제일 잘 알아",
  9: "그건 내가 다 해봤어",
};
const ME_Y = 900;
const meX = (f: number) => {
  const flinch = progIO(f, PUFF_AT + 20, 30) * (1 - progIO(f, GO_AT, 30));
  const go = progIO(f, GO_AT + 10, 230);
  return lerp(lerp(250, 180, flinch), 930, go);
};
// frame at which I pass each fish — that's when it deflates
const PASS_AT = SCHOOL.map((s) => {
  for (let f = GO_AT; f < TOTAL; f++) if (meX(f) >= s.x - 90) return f;
  return TOTAL;
});

// ---------- Fonts & text ----------

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`700 64px "${SANS}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

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

type Seg = { t: string; c?: string; w?: number };
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[] };
const CAP_TOP = 1230;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP, opacity: out }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.5, color: BODY }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.w ?? (s.c ? 700 : undefined) }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: 20, to: WHY_AT - 6, lines: [
    { at: 22, segs: [{ t: "큰소리치는 사람 앞에 서면," }] },
    { at: PUFF_AT + 50, segs: [{ t: "괜히 작아집니다.", c: INK }] },
  ] },
  { from: WHY_AT + 6, to: REAL_AT - 6, lines: [
    { at: WHY_AT + 8, segs: [{ t: "그런데 복어가 몸을 부풀리는 건," }] },
    { at: WHY_AT + 90, segs: [{ t: "겁이 날 때", c: AMBER }, { t: "입니다." }] },
  ] },
  { from: REAL_AT + 6, to: GO_AT - 6, lines: [
    { at: REAL_AT + 8, segs: [{ t: "열에 아홉은, " }, { t: "부풀린 겁니다.", c: INK }] },
    { at: REAL_AT + 100, segs: [{ t: "진짜는, " }, { t: "부풀리지 않습니다.", c: INK }] },
  ] },
  { from: GO_AT + 6, to: END_AT - 6, lines: [
    { at: GO_AT + 8, segs: [{ t: "부풀린 건, 오래가지 않습니다." }] },
    { at: GO_AT + 100, segs: [{ t: "그래서, " }, { t: "쫄 필요가 없습니다.", c: INK }] },
  ] },
];

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color: string }> =
  ({ f, from, to, tag, text, color }) => {
    if (f < from || f >= to) return null;
    const p = prog(f, from, 20) * clamp01((to - f) / 10);
    return (
      <div style={{ position: "absolute", left: MX, top: 340, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
        <div style={{ width: 36 * p, height: 2, background: color }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{tag}</span>
        <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>{text}</span>
      </div>
    );
  };

// ---------- Fish ----------
// one fish seen from the side; puff 0 = sleek, 1 = a round spiky ball
const Fish: React.FC<{ x: number; y: number; s?: number; dir?: number; puff?: number; fill?: string; edge?: string; f: number; seed?: number; op?: number; inside?: number }> =
  ({ x, y, s = 1, dir = -1, puff = 0, fill = FISH, edge = FISH_EDGE, f, seed = 0, op = 1, inside = 0 }) => {
    const rx = lerp(46, 90, puff) * s;
    const ry = lerp(26, 88, puff) * s;
    const bx = x - dir * rx * 0.96;
    const wag = Math.sin(f / 5 + seed) * 6 * s * (1 - 0.6 * puff);
    const tl = 30 * s;
    const spikes = puff > 0.02 ? Array.from({ length: 28 }, (_, k) => (k / 28) * Math.PI * 2) : [];
    const id = `fb-${seed}-${Math.round(x)}`;
    return (
      <g opacity={op}>
        {/* tail */}
        <path d={`M ${bx + dir * 4} ${y} L ${bx - dir * tl} ${y - 19 * s + wag} L ${bx - dir * tl * 0.8} ${y + wag * 0.3} L ${bx - dir * tl} ${y + 19 * s + wag} Z`}
          fill={fill} stroke={edge} strokeWidth={2.5} strokeLinejoin="round" />
        {/* dorsal fin, folds away when puffed */}
        <path d={`M ${x - dir * 4 * s} ${y - ry + 2} Q ${x - dir * 18 * s} ${y - ry - 20 * s} ${x - dir * 30 * s} ${y - ry + 6}`}
          fill={fill} stroke={edge} strokeWidth={2.5} opacity={1 - puff} />
        {spikes.map((a, k) => {
          const px = x + Math.cos(a) * rx;
          const py = y + Math.sin(a) * ry;
          const len = 13 * s * puff;
          return <line key={k} x1={px} y1={py} x2={px + Math.cos(a) * len} y2={py + Math.sin(a) * len} stroke={edge} strokeWidth={2.5} strokeLinecap="round" />;
        })}
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} stroke={edge} strokeWidth={2.5} />
        {/* cross-section: mostly water inside */}
        {inside > 0 && (
          <g opacity={inside}>
            <defs><clipPath id={id}><ellipse cx={x} cy={y} rx={rx - 10} ry={ry - 10} /></clipPath></defs>
            <ellipse cx={x} cy={y} rx={rx - 10} ry={ry - 10} fill="#E9F4F7" />
            <g clipPath={`url(#${id})`}>
              {Array.from({ length: 9 }, (_, k) => {
                const yy = y - ry + 30 + k * ((2 * ry - 60) / 8);
                const ph = f / 9 + k;
                const d = Array.from({ length: 13 }, (_, j) => {
                  const xx = x - rx + j * (2 * rx / 12);
                  return `${j ? "L" : "M"} ${xx} ${yy + Math.sin(ph + j * 0.9) * 5}`;
                }).join(" ");
                return <path key={k} d={d} fill="none" stroke="#9FC3CE" strokeWidth={3} strokeLinecap="round" />;
              })}
            </g>
          </g>
        )}
        <circle cx={x + dir * rx * 0.55} cy={y - ry * 0.22} r={4.6 * s * lerp(1, 1.35, puff)} fill="#2F3540" />
        <path d={`M ${x + dir * rx * 0.86} ${y + ry * 0.18} q ${-dir * 7 * s} ${4 * s} ${-dir * 12 * s} 0`} fill="none" stroke={edge} strokeWidth={2.2} strokeLinecap="round" />
      </g>
    );
  };

// ---------- Water ----------
const BUBBLES = Array.from({ length: 26 }, (_, i) => {
  const r = (v: number) => {
    const t = Math.sin(i * 91.7 + v * 13.1) * 43758.5453;
    return t - Math.floor(t);
  };
  return { x: 80 + r(1) * 920, y: r(2) * 1920, s: 3 + r(3) * 7, v: 0.6 + r(4) * 1.2, ph: r(5) * 6.28 };
});
const Water: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="pf-water" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={WATER_TOP} />
        <stop offset="100%" stopColor={WATER_BOT} />
      </linearGradient>
      <linearGradient id="pf-ray" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6} />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#pf-water)" />
    {[0, 1, 2].map((k) => {
      const sway = Math.sin(f / 90 + k * 2) * 30;
      const x0 = 160 + k * 330 + sway;
      return <polygon key={k} points={`${x0},0 ${x0 + 120},0 ${x0 + 300},1500 ${x0 + 80},1500`} fill="url(#pf-ray)" opacity={0.35} />;
    })}
    {BUBBLES.map((b, i) => {
      const y = 1960 - ((f * b.v + b.y) % 2000);
      return <circle key={i} cx={b.x + Math.sin(f / 30 + b.ph) * 8} cy={y} r={b.s} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.7} />;
    })}
  </svg>
);

const Scene: React.FC<{ f: number }> = ({ f }) => {
  const inset = progIO(f, WHY_AT + 4, 30) * (1 - progIO(f, REAL_AT - 30, 30));
  const realGlow = prog(f, REAL_AT + 100, 30) * (1 - prog(f, GO_AT + 40, 30));
  const shrink = progIO(f, PUFF_AT + 20, 30) * (1 - progIO(f, GO_AT, 30));
  const mx = meX(f);
  const meScale = lerp(1, 0.72, shrink);
  const glow = prog(f, END_AT + 20, 50);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="pf-glow">
          <stop offset="0%" stopColor={AMBER} stopOpacity={0.4} />
          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pf-real">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g opacity={1 - 0.85 * inset}>
        {realGlow > 0 && <circle cx={SCHOOL[REAL_I].x} cy={SCHOOL[REAL_I].y} r={110} fill="url(#pf-real)" opacity={realGlow} />}
        {SCHOOL.map((s, i) => {
          const real = i === REAL_I;
          const puff = real ? 0 : progIO(f, PUFF_AT + i * 6, 26) * (1 - progIO(f, PASS_AT[i], 30));
          const bob = Math.sin(f / 22 + i * 1.3) * 5;
          return (
            <Fish key={i} x={s.x + (real ? Math.sin(f / 40) * 10 : 0)} y={s.y + bob} s={real ? 1.05 : 0.92} puff={puff} f={f} seed={i}
              fill={real ? REAL : FISH} edge={real ? REAL_EDGE : FISH_EDGE} />
          );
        })}
        {glow > 0 && <circle cx={mx} cy={ME_Y} r={70 + 90 * glow} fill="url(#pf-glow)" opacity={glow} />}
        <Fish x={mx} y={ME_Y + Math.sin(f / 18) * 4} s={meScale} dir={1} f={f * 1.4} seed={99} fill={ME} edge={ME_EDGE} />
      </g>
      {/* cross-section of one pufferfish */}
      {inset > 0 && (
        <g opacity={inset}>
          <Fish x={560} y={800} s={2.1} dir={-1} puff={1} f={f} seed={50} inside={prog(f, WHY_AT + 60, 30)} />
        </g>
      )}
    </svg>
  );
};

// loud tags over four of the puffed fish
const Tags: React.FC<{ f: number }> = ({ f }) => {
  const off = 1 - prog(f, WHY_AT - 10, 20);
  return (
    <>
      {Object.entries(TAGS).map(([k, t], n) => {
        const i = Number(k);
        const a = prog(f, PUFF_AT + 30 + n * 14, 16) * off;
        if (a <= 0) return null;
        const s = SCHOOL[i];
        return (
          <div key={k} style={{
            position: "absolute", left: Math.min(Math.max(s.x, 200), 860), top: s.y - 112, transform: `translate(-50%, -100%) scale(${0.9 + 0.1 * a})`,
            padding: "8px 18px", borderRadius: 22, background: "rgba(255,255,255,0.95)", border: `1.5px solid ${HAIR}`,
            fontSize: 26, fontWeight: 700, color: BODY, opacity: a, whiteSpace: "nowrap",
          }}>“{t}”</div>
        );
      })}
      {(() => {
        const a = prog(f, WHY_AT + 70, 20) * (1 - prog(f, REAL_AT - 30, 20));
        return a > 0 ? (
          <div style={{
            position: "absolute", left: 560, top: 800 + 230, transform: "translateX(-50%)",
            padding: "8px 20px", borderRadius: 22, background: "#FFFFFF", fontSize: 28, fontWeight: 700, color: SUB, opacity: a,
          }}>크기의 대부분은, 물</div>
        ) : null;
      })()}
      {(() => {
        const a = prog(f, REAL_AT + 110, 20) * (1 - prog(f, GO_AT + 30, 20));
        const s = SCHOOL[REAL_I];
        return a > 0 ? (
          <div style={{
            position: "absolute", left: s.x, top: s.y + 70, transform: "translateX(-50%)",
            fontSize: 24, fontWeight: 700, letterSpacing: 4, color: REAL_EDGE, opacity: a,
          }}>REAL</div>
        ) : null;
      })()}
    </>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP + 10 }}>
      <Line f={f} at={END_AT + 20} style={{ fontSize: 76, fontWeight: 700, color: INK, letterSpacing: -2, lineHeight: 1.3 }}>
        <span style={{ color: AMBER }}>행동</span>하면 됩니다.
      </Line>
    </div>
  );
};

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.05, mixBlendMode: "soft-light", pointerEvents: "none" }}>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={(Math.floor(f / 2) % 4) + 1} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// ---------- Root ----------

export const Puffer: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: WATER_TOP, fontFamily: `'${SANS}', sans-serif`,
    }}>
      <FontLoader />
      <Water f={f} />
      <div style={{ position: "absolute", inset: 0, opacity: endFade }}>
        <Overline f={f} from={6} to={WHY_AT - 4} tag="LOUD VOICES" text="큰소리 앞에서" color={INK} />
        <Overline f={f} from={WHY_AT + 4} to={REAL_AT - 4} tag="PUFFERFISH" text="복어의 비밀" color={AMBER} />
        <Overline f={f} from={REAL_AT + 4} to={GO_AT - 4} tag="THE REAL ONE" text="진짜는" color={INK} />
        <Overline f={f} from={GO_AT + 4} to={END_AT - 4} tag="SO" text="그래서" color={INK} />
        <Overline f={f} from={END_AT + 4} to={TOTAL + 10} tag="JUST ACT" text="행동" color={AMBER} />
        <Scene f={f} />
        <Tags f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Ending f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(70,100,110,0.14) 100%)",
      }} />
    </div>
  );
};
