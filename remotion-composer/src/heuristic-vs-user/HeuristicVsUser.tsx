import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
  continueRender,
  delayRender,
} from "remotion";

const SANS = "Noto Sans KR";
const BG = "#0D1015";
const INK = "#F2F4F7";
const SUB = "#8A93A3";
const HAIR = "rgba(255,255,255,0.10)";
const LINE = "#C9CED6";
const DIM = "#3A414D";
const HEU = "#8EA2FF";
const USR = "#F2B45C";
const PASS = "#6FD6A3";
const FAIL = "#F07A7A";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = Easing.out(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: ease });

// Scene ranges (frames @30fps). Every caption stays up 3.5–4s so it can be read.
export const TOTAL = 1470;
const S1 = [0, 215] as const;
const S2 = [215, 335] as const;
const S3 = [335, 700] as const;
const S4 = [700, 1080] as const;
const S5 = [1080, 1250] as const;
const S6 = [1250, TOTAL] as const;

const MX = 100; // editorial left margin
const DOOR = { x: 290, y: 430, w: 500, h: 470 };
const BTN = { open: { cx: 480, cy: 1020 }, close: { cx: 600, cy: 1020 }, r: 46 };

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
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

// ---------- Primitives ----------

const Scene: React.FC<{
  f: number; range: readonly [number, number]; shake?: { x: number; y: number }; children: React.ReactNode;
}> = ({ f, range: [a, b], shake, children }) => {
  if (f < a || f >= b) return null;
  const fin = a === 0 ? 1 : prog(f, a, 16);
  const fout = interpolate(f, b === TOTAL ? [b - 18, b] : [b - 10, b], [1, 0], clamp);
  return (
    <div style={{
      position: "absolute", inset: 0, opacity: Math.min(fin, fout),
      transform: `translateY(${(1 - fin) * 24}px) translate(${shake?.x ?? 0}px, ${shake?.y ?? 0}px)`,
    }}>{children}</div>
  );
};

// Masked line reveal: text rises out of its own baseline.
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

const Overline: React.FC<{ f: number; at: number; top: number; color: string; tag: string; text?: string }> =
  ({ f, at, top, color, tag, text }) => {
    const p = prog(f, at, 20);
    return (
      <div style={{ position: "absolute", left: MX, top, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
        <div style={{ width: 36 * p, height: 2, background: color }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{tag}</span>
        {text && <span style={{ fontSize: 24, fontWeight: 400, color: SUB, letterSpacing: 1 }}>{text}</span>}
      </div>
    );
  };

const SectionHead: React.FC<{ f: number; at: number; color: string; tag: string; title: string; sub: string }> =
  ({ f, at, color, tag, title, sub }) => (
    <>
      <Overline f={f} at={at} top={320} color={color} tag={tag} />
      <div style={{ position: "absolute", left: MX, top: 358 }}>
        <Line f={f} at={at + 4} style={{ fontSize: 66, fontWeight: 700, color: INK, letterSpacing: -1.5 }}>{title}</Line>
        <Line f={f} at={at + 10} style={{ fontSize: 32, fontWeight: 400, color: SUB, marginTop: 4 }}>{sub}</Line>
      </div>
    </>
  );

type Seg = { t: string; c?: string };
type Cap = { from: number; to: number; lines: Seg[][] };

const Captions: React.FC<{ f: number; caps: Cap[]; top: number; size?: number }> = ({ f, caps, top, size = 40 }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 8);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top, opacity: out }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((line, i) => (
        <Line key={i} f={f} at={c.from + i * 5} style={{ fontSize: size, fontWeight: 400, lineHeight: 1.5, color: "#D5DAE1" }}>
          {line.map((s, j) => (
            <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.c ? 700 : 400 }}>{s.t}</span>
          ))}
        </Line>
      ))}
    </div>
  );
};

const Btn: React.FC<{
  cx: number; cy: number; r: number; kind: "open" | "close";
  fill?: string; stroke?: string; icon?: string; press?: number;
}> = ({ cx, cy, r, kind, fill = "rgba(255,255,255,0.03)", stroke = LINE, icon = LINE, press = 0 }) => {
  const k = r / 70;
  const tri = kind === "open"
    ? ["-10,-17 -10,17 -31,0", "10,-17 10,17 31,0"]
    : ["-31,-17 -31,17 -10,0", "31,-17 31,17 10,0"];
  return (
    <g transform={`translate(${cx} ${cy}) scale(${1 - press * 0.06})`}>
      <circle r={r} fill={fill} stroke={stroke} strokeWidth={2} />
      <g transform={`scale(${k})`}>
        <polygon points={tri[0]} fill={icon} />
        <polygon points={tri[1]} fill={icon} />
        <line x1={0} y1={-22} x2={0} y2={22} stroke={icon} strokeWidth={3} strokeLinecap="round" />
      </g>
    </g>
  );
};

const Ripple: React.FC<{ f: number; at: number; cx: number; cy: number; r: number; color: string }> =
  ({ f, at, cx, cy, r, color }) => {
    const d = f - at;
    if (d < 0 || d > 22) return null;
    const p = d / 22;
    return (
      <>
        <circle cx={cx} cy={cy} r={r * (1 + p * 0.9)} fill="none" stroke={color} strokeWidth={2} opacity={0.8 * (1 - p)} />
        <circle cx={cx} cy={cy} r={r * (1 + p * 0.45)} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5 * (1 - p)} />
      </>
    );
  };

const Elevator: React.FC<{ c: number; light?: number }> = ({ c, light = 0 }) => {
  const { x, y, w, h } = DOOR;
  const ix = x + 22, iy = y + 66, iw = w - 44, ih = h - 66;
  const pw = (iw / 2) * c;
  return (
    <g>
      <defs>
        <linearGradient id="cabin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6E7C8" stopOpacity={0.10 + 0.22 * light} />
          <stop offset="0.6" stopColor="#F6E7C8" stopOpacity={0.02 + 0.05 * light} />
          <stop offset="1" stopColor="#F6E7C8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(255,255,255,0.025)" stroke={DIM} strokeWidth={2} />
      <line x1={x} y1={y + 52} x2={x + w} y2={y + 52} stroke={DIM} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 36} textAnchor="middle" fontSize={22} fontWeight={700} letterSpacing={6}
        fill={USR} fontFamily={`'${SANS}', sans-serif`}>▲ 1</text>
      <rect x={ix} y={iy} width={iw} height={ih} fill="#07090C" />
      <rect x={ix} y={iy} width={iw} height={ih} fill="url(#cabin)" />
      <rect x={ix} y={iy} width={pw} height={ih} fill="#171B22" stroke={DIM} strokeWidth={1.5} />
      <rect x={ix + iw - pw} y={iy} width={pw} height={ih} fill="#171B22" stroke={DIM} strokeWidth={1.5} />
      <line x1={x - 60} y1={y + h} x2={x + w + 60} y2={y + h} stroke={HAIR} strokeWidth={2} />
    </g>
  );
};

const ButtonHousing: React.FC<{ y?: number }> = ({ y = 960 }) => (
  <rect x={390} y={y} width={300} height={120} rx={60} fill="rgba(255,255,255,0.025)" stroke={HAIR} strokeWidth={1.5} />
);

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.06, mixBlendMode: "soft-light", pointerEvents: "none" }}>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={(Math.floor(f / 2) % 4) + 1} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// ---------- S1: the moment ----------

const Scene1: React.FC<{ f: number }> = ({ f }) => {
  const PRESS = 106;
  const c = f < 108
    ? interpolate(f, [55, 105], [0.28, 0.5], clamp)
    : interpolate(f, [108, 124], [0.5, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const flash = interpolate(f, [PRESS, PRESS + 4, 126, 150], [0, 1, 1, 0], clamp);
  const press = f >= PRESS && f < PRESS + 8 ? Math.sin(((f - PRESS) / 8) * Math.PI) : 0;
  const d = f - 124;
  const shake = d >= 0 && d < 12 ? { x: Math.sin(f * 2.3) * 4 * (1 - d / 12), y: Math.cos(f * 3.1) * 2.5 * (1 - d / 12) } : undefined;
  return (
    <Scene f={f} range={S1} shake={shake}>
      <Overline f={f} at={6} top={330} color={SUB} tag="CASE" text="엘리베이터 열림 · 닫힘 버튼" />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Elevator c={c} light={1 - c} />
        <ButtonHousing />
        <Btn {...BTN.open} r={BTN.r} kind="open" />
        <Btn {...BTN.close} r={BTN.r} kind="close" press={press}
          stroke={interpolateColors(flash, [0, 1], [LINE, FAIL])}
          icon={interpolateColors(flash, [0, 1], [LINE, FAIL])}
          fill={interpolateColors(flash, [0, 1], ["rgba(255,255,255,0.03)", "rgba(240,122,122,0.14)"])} />
        <Ripple f={f} at={PRESS} {...BTN.close} r={BTN.r} color={FAIL} />
      </svg>
      <div style={{ position: "absolute", left: MX, top: 1170 }}>
        <Line f={f} at={134} style={{ fontSize: 58, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
          <span style={{ color: PASS }}>열림</span> 누르려다
        </Line>
        <Line f={f} at={140} style={{ fontSize: 58, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
          <span style={{ color: FAIL }}>닫힘</span> 누른 적, 있죠?
        </Line>
      </div>
    </Scene>
  );
};

// ---------- S2: two methods ----------

const IconChecklist: React.FC<{ color: string }> = ({ color }) => (
  <svg width={72} height={72} viewBox="0 0 72 72" fill="none">
    <rect x={14} y={8} width={44} height={56} rx={6} stroke={color} strokeWidth={2.5} />
    <path d="M24 26 l4 4 l8 -8" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    <line x1={40} y1={27} x2={50} y2={27} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M24 44 l4 4 l8 -8" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    <line x1={40} y1={45} x2={50} y2={45} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

const IconUser: React.FC<{ color: string }> = ({ color }) => (
  <svg width={72} height={72} viewBox="0 0 72 72" fill="none">
    <circle cx={36} cy={24} r={11} stroke={color} strokeWidth={2.5} />
    <path d="M14 62 c2 -14 12 -20 22 -20 s20 6 22 20" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

const MethodRow: React.FC<{ f: number; at: number; top: number; n: string; color: string; icon: React.ReactNode; title: string; desc: string }> =
  ({ f, at, top, n, color, icon, title, desc }) => {
    const p = prog(f, at, 22);
    return (
      <div style={{ position: "absolute", left: MX, right: MX, top, opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
        <div style={{ height: 1.5, background: HAIR, transform: `scaleX(${p})`, transformOrigin: "left" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 36, paddingTop: 44 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: 2, width: 40 }}>{n}</div>
          {icon}
          <div>
            <div style={{ fontSize: 48, fontWeight: 700, color: INK, letterSpacing: -1 }}>{title}</div>
            <div style={{ fontSize: 32, fontWeight: 400, color: SUB, marginTop: 6 }}>{desc}</div>
          </div>
        </div>
      </div>
    );
  };

const Scene2: React.FC<{ f: number }> = ({ f }) => (
  <Scene f={f} range={S2}>
    <Overline f={f} at={219} top={410} color={SUB} tag="TWO METHODS" />
    <div style={{ position: "absolute", left: MX, top: 450 }}>
      <Line f={f} at={222} style={{ fontSize: 62, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>버튼을 미리 검증하는</Line>
      <Line f={f} at={228} style={{ fontSize: 62, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>두 가지 방법</Line>
    </div>
    <MethodRow f={f} at={242} top={720} n="01" color={HEU} icon={<IconChecklist color={HEU} />}
      title="휴리스틱 평가" desc="전문가가 원칙으로 살펴보기" />
    <MethodRow f={f} at={262} top={960} n="02" color={USR} icon={<IconUser color={USR} />}
      title="사용자 평가" desc="사람이 직접 써 보기" />
  </Scene>
);

// ---------- S3: heuristic evaluation ----------

const AUDIT = [
  { q: "한눈에 구분되는가", ok: false, r: "모양이 거의 같다" },
  { q: "급할 때도 찾기 쉬운가", ok: false, r: "크기도 색도 같다" },
  { q: "누르면 반응이 보이는가", ok: true, r: "불이 켜진다" },
];
const AUDIT_AT = [385, 445, 505];

const Brackets: React.FC<{ cx: number; cy: number; w: number; h: number; color: string; opacity: number }> =
  ({ cx, cy, w, h, color, opacity }) => {
    const L = 22, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
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

const Scene3: React.FC<{ f: number }> = ({ f }) => {
  const CY = 620;
  const eio = Easing.inOut(Easing.cubic);
  const toClose = interpolate(f, [398, 426], [0, 1], { ...clamp, easing: eio });
  const toBoth = interpolate(f, [440, 470], [0, 1], { ...clamp, easing: eio });
  const bx = 480 + 120 * toClose - 60 * toBoth;
  const bw = 132 + 196 * toBoth;
  const bh = 132 + 18 * toBoth;
  const bOp = prog(f, 358, 14);
  const failCount = AUDIT.filter((a, i) => !a.ok && f >= AUDIT_AT[i] + 22).length;
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.2);
  return (
    <Scene f={f} range={S3}>
      <SectionHead f={f} at={340} color={HEU} tag="01 — HEURISTIC EVALUATION" title="휴리스틱 평가" sub="전문가의 체크리스트" />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ButtonHousing y={CY - 60} />
        <Btn cx={480} cy={CY} r={BTN.r} kind="open" />
        <Btn cx={600} cy={CY} r={BTN.r} kind="close" />
        {failCount > 0 && (
          <rect x={372} y={CY - 78} width={336} height={156} rx={78} fill="none" stroke={FAIL}
            strokeWidth={1.5} strokeDasharray="6 8" opacity={0.35 + 0.35 * pulse} />
        )}
        <Brackets cx={bx} cy={CY} w={bw} h={bh} color={HEU} opacity={bOp} />
      </svg>
      <div style={{ position: "absolute", left: MX, right: MX, top: 730, opacity: prog(f, 372, 16) }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700, letterSpacing: 4, color: SUB, paddingBottom: 14 }}>
          <span>점검 기준</span><span>판정</span>
        </div>
        <div style={{ height: 1.5, background: HAIR }} />
        {AUDIT.map((a, i) => {
          const qp = prog(f, AUDIT_AT[i], 18);
          const rp = prog(f, AUDIT_AT[i] + 22, 16);
          const col = a.ok ? PASS : FAIL;
          return (
            <div key={i} style={{ opacity: qp }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 0", transform: `translateX(${(1 - qp) * -16}px)` }}>
                <div>
                  <div style={{ fontSize: 38, fontWeight: 700, color: INK, letterSpacing: -0.5 }}>{a.q}</div>
                  <div style={{ fontSize: 30, fontWeight: 400, color: col, marginTop: 4, opacity: rp }}>{a.r}</div>
                </div>
                <div style={{
                  fontSize: 26, fontWeight: 700, color: col, border: `1.5px solid ${col}`, borderRadius: 22,
                  padding: "6px 20px", opacity: rp, transform: `scale(${0.92 + 0.08 * rp})`,
                }}>{a.ok ? "충족" : "위반"}</div>
              </div>
              <div style={{ height: 1.5, background: HAIR, transform: `scaleX(${qp})`, transformOrigin: "left" }} />
            </div>
          );
        })}
      </div>
      <Captions f={f} top={1200} caps={[
        { from: 360, to: 470, lines: [[{ t: "전문가가 정해진 " }, { t: "원칙(휴리스틱)", c: HEU }, { t: "으로" }], [{ t: "꼼꼼히 살핀다" }]] },
        { from: 470, to: 580, lines: [[{ t: "검증된 원칙으로," }], [{ t: "빠짐없이", c: HEU }, { t: " 점검할 수 있다" }]] },
        { from: 580, to: 700, lines: [[{ t: "다만 전문가의 판단이라," }], [{ t: "실제 사용자가 겪는 문제와 " }, { t: "다를 수 있다", c: INK }]] },
      ]} />
    </Scene>
  );
};

// ---------- S4: user testing ----------

const PARTICIPANTS = [
  { ok: true, sec: 1.2 }, { ok: false, sec: 2.6 }, { ok: true, sec: 0.9 }, { ok: false, sec: 3.1 }, { ok: true, sec: 1.4 },
];
const PRESS_AT = [820, 845, 870, 895, 920];
const TRACK = { x: 200, w: 470 };

const Scene4: React.FC<{ f: number }> = ({ f }) => {
  const taskP = prog(f, 722, 20);
  const sumP = prog(f, 950, 22);
  return (
    <Scene f={f} range={S4}>
      <SectionHead f={f} at={705} color={USR} tag="02 — USER TESTING" title="사용자 평가" sub="직접 써 보게 하기" />
      <div style={{
        position: "absolute", left: MX, top: 530, display: "flex", alignItems: "baseline", gap: 22,
        opacity: taskP, transform: `translateY(${(1 - taskP) * 12}px)`,
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: USR }}>TASK</span>
        <span style={{ fontSize: 40, fontWeight: 700, color: INK, letterSpacing: -0.5 }}>“빨리 문 열어주세요!”</span>
      </div>
      <div style={{ position: "absolute", left: MX, right: MX, top: 620, opacity: prog(f, 750, 16) }}>
        <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 4, color: SUB, paddingBottom: 14 }}>
          <span style={{ width: TRACK.x - MX }}>참가자</span>
          <span style={{ width: TRACK.w + 30 }}>누르기까지</span>
          <span>누른 버튼</span>
        </div>
        <div style={{ height: 1.5, background: HAIR }} />
      </div>
      {PARTICIPANTS.map((p, i) => {
        const top = 690 + i * 70;
        const rowP = prog(f, 760 + i * 8, 16);
        const barP = interpolate(f, [PRESS_AT[i], PRESS_AT[i] + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
        const resP = prog(f, PRESS_AT[i] + 14, 14);
        const col = p.ok ? PASS : FAIL;
        const len = (p.sec / 3.5) * TRACK.w;
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top, height: 70, opacity: rowP }}>
            <div style={{ position: "absolute", left: MX, top: 16, fontSize: 28, fontWeight: 700, color: SUB, letterSpacing: 2 }}>P{i + 1}</div>
            <div style={{ position: "absolute", left: TRACK.x, top: 33, width: TRACK.w, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
            <div style={{ position: "absolute", left: TRACK.x, top: 32, width: len * barP, height: 5, background: col, opacity: 0.85, borderRadius: 3 }} />
            <div style={{
              position: "absolute", left: TRACK.x + len * barP - 7, top: 27, width: 14, height: 14, borderRadius: 7,
              background: BG, border: `2.5px solid ${col}`, opacity: barP > 0 ? 1 : 0,
            }} />
            <div style={{
              position: "absolute", left: TRACK.x + len + 22, top: 18, fontSize: 24, fontWeight: 400, color: SUB, opacity: resP,
            }}>{p.sec.toFixed(1)}초</div>
            <div style={{
              position: "absolute", right: MX, top: 14, fontSize: 30, fontWeight: 700, color: col, opacity: resP,
              transform: `translateX(${(1 - resP) * 12}px)`,
            }}>{p.ok ? "열림" : "닫힘"}</div>
            <div style={{ position: "absolute", left: MX, right: MX, bottom: 0, height: 1, background: "rgba(255,255,255,0.05)" }} />
          </div>
        );
      })}
      <div style={{
        position: "absolute", left: MX, top: 1050, display: "flex", alignItems: "baseline", gap: 6,
        opacity: sumP, transform: `translateY(${(1 - sumP) * 14}px)`,
      }}>
        <span style={{ fontSize: 40, fontWeight: 400, color: "#D5DAE1" }}>5명 중</span>
        <span style={{ fontSize: 76, fontWeight: 700, color: FAIL, letterSpacing: -2, margin: "0 6px" }}>2명</span>
        <span style={{ fontSize: 40, fontWeight: 400, color: "#D5DAE1" }}>이 닫힘을 눌렀다</span>
      </div>
      <Captions f={f} top={1200} caps={[
        { from: 735, to: 850, lines: [[{ t: "실제 사람에게 시켜보고" }], [{ t: "지켜본다", c: USR }]] },
        { from: 850, to: 965, lines: [[{ t: "실제 사용자가 " }, { t: "어디서 막히는지", c: USR }], [{ t: "직접 확인할 수 있다" }]] },
        { from: 965, to: 1080, lines: [[{ t: "다만 참여할 사용자를 모으고" }], [{ t: "진행할 " }, { t: "준비가 필요하다", c: INK }]] },
      ]} />
    </Scene>
  );
};

// ---------- S5: one-line comparison ----------

const CompareCol: React.FC<{ f: number; at: number; left: number; color: string; label: string; a: string; b: string }> =
  ({ f, at, left, color, label, a, b }) => {
    const p = prog(f, at, 22);
    return (
      <div style={{ position: "absolute", left, top: 640, width: 400, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
        <div style={{ width: 48 * p, height: 3, background: color, marginBottom: 28 }} />
        <div style={{ fontSize: 30, fontWeight: 700, color, letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 50, fontWeight: 700, color: INK, letterSpacing: -1.2, marginTop: 26, lineHeight: 1.25, whiteSpace: "pre-line" }}>{a}</div>
        <div style={{ fontSize: 32, fontWeight: 400, color: SUB, marginTop: 16 }}>{b}</div>
      </div>
    );
  };

const Scene5: React.FC<{ f: number }> = ({ f }) => (
  <Scene f={f} range={S5}>
    <Overline f={f} at={1084} top={430} color={SUB} tag="SUMMARY" />
    <div style={{ position: "absolute", left: MX, top: 470 }}>
      <Line f={f} at={1088} style={{ fontSize: 62, fontWeight: 700, color: INK, letterSpacing: -1.5 }}>한 줄 비교</Line>
    </div>
    <div style={{
      position: "absolute", left: 540, top: 640, width: 1.5, height: 330, background: HAIR,
      transform: `scaleY(${prog(f, 1100, 24)})`, transformOrigin: "top",
    }} />
    <CompareCol f={f} at={1098} left={MX} color={HEU} label="휴리스틱 평가" a={"전문가의\n눈으로"} b="원칙에 따라 체계적으로" />
    <CompareCol f={f} at={1128} left={590} color={USR} label="사용자 평가" a={"사용자의\n손으로"} b="실제 행동을 관찰" />
  </Scene>
);

// ---------- S6: resolution ----------

const Scene6: React.FC<{ f: number }> = ({ f }) => {
  const PRESS = 1316;
  const m = interpolate(f, [1265, 1295], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const c = f < 1320 ? 1 : interpolate(f, [1320, 1352], [1, 0.18], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const press = f >= PRESS && f < PRESS + 8 ? Math.sin(((f - PRESS) / 8) * Math.PI) : 0;
  const labelP = clamp01((m - 0.5) / 0.5);
  const rOpen = BTN.r + 12 * m;
  const rClose = BTN.r - 6 * m;
  const signP = prog(f, 1410, 24);
  return (
    <Scene f={f} range={S6}>
      <Overline f={f} at={1256} top={330} color={PASS} tag="AFTER" text="개선된 버튼" />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Elevator c={c} light={1 - c} />
        <ButtonHousing />
        <Btn {...BTN.open} r={rOpen} kind="open" press={press}
          fill={interpolateColors(m, [0, 1], ["rgba(255,255,255,0.03)", PASS])}
          stroke={interpolateColors(m, [0, 1], [LINE, PASS])}
          icon={interpolateColors(m, [0, 1], [LINE, BG])} />
        <Btn {...BTN.close} r={rClose} kind="close"
          stroke={interpolateColors(m, [0, 1], [LINE, DIM])}
          icon={interpolateColors(m, [0, 1], [LINE, "#5B6472"])} />
        <Ripple f={f} at={PRESS} {...BTN.open} r={rOpen} color={PASS} />
      </svg>
      <div style={{
        position: "absolute", left: BTN.open.cx, top: BTN.open.cy + 72, transform: "translateX(-50%)",
        fontSize: 28, fontWeight: 700, color: PASS, opacity: labelP, letterSpacing: 2,
      }}>열림</div>
      <div style={{
        position: "absolute", left: BTN.close.cx, top: BTN.close.cy + 72, transform: "translateX(-50%)",
        fontSize: 24, fontWeight: 400, color: SUB, opacity: labelP, letterSpacing: 2,
      }}>닫힘</div>
      <div style={{ position: "absolute", left: MX, top: 1185 }}>
        <Line f={f} at={1352} style={{ fontSize: 58, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
          <span style={{ color: HEU }}>전문가 눈</span>으로 거르고,
        </Line>
        <Line f={f} at={1360} style={{ fontSize: 58, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
          <span style={{ color: USR }}>사용자 손</span>으로 확인한다
        </Line>
      </div>
      <div style={{
        position: "absolute", left: MX, top: 1400, fontSize: 20, fontWeight: 700, letterSpacing: 6,
        color: SUB, opacity: signP,
      }}>HEURISTIC EVALUATION × USER TESTING</div>
    </Scene>
  );
};

// ---------- Root ----------

export const HeuristicVsUser: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SANS}', sans-serif`,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% 42%, #18202B 0%, rgba(13,16,21,0) 70%)",
      }} />
      {/* Scenes are laid out top-down; this offset centers them in the Reels safe band. */}
      <div style={{ position: "absolute", inset: 0, transform: "translateY(100px)" }}>
        <Scene1 f={f} />
        <Scene2 f={f} />
        <Scene3 f={f} />
        <Scene4 f={f} />
        <Scene5 f={f} />
        <Scene6 f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
