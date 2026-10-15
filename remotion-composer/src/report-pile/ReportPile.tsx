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
const BG = "#0D1015";
const INK = "#F2F4F7";
const SUB = "#8A93A3";
const BODY = "#D5DAE1";
const HAIR = "rgba(255,255,255,0.10)";
const AMBER = "#F2B45C";
const PAPER_FRONT = "#7D8592";
const PAPER_TOP = "#B4BAC4";
const PAPER_SIDE = "#5F6672";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1290;
const MX = 100;

// ---------- Timeline ----------
// S1 one sheet 0–150 · S2 the pile grows 150–420 · S3 same content ×3 420–630
// S4 the pile is time 630–840 · S5 two companies 840–1110 · S6 conclusion 1110–1290
export const FIRST_LAND = 30;
export const GROW = [160, 390];
const TRIPLE_AT = 440;
const TIME_AT = 642;
export const DROPS_AT = 880;
export const DROP_GAP = 11;
const END_AT = 1120;

// ---------- Pile geometry (S1–S4) ----------
const DESK_Y = 1100;
const PX0 = 290;
const PW = 240;
const DEPTH = { dx: 44, dy: -26 };
const PILE_H = 580;
export const TOTAL_PAGES = 1240;
// example year of reports (pages): weekly 52×5, monthly 12×20, quarterly 4×40, meeting decks, re-writes for reporting
export const BANDS = [
  { label: "주간보고 ×52", pages: 260, hours: 130 },
  { label: "월간보고 ×12", pages: 240, hours: 120 },
  { label: "분기보고 ×4", pages: 160, hours: 80 },
  { label: "회의 자료", pages: 260, hours: 130 },
  { label: "보고용 재작성", pages: 320, hours: 160 },
];
const PAGE_PX = PILE_H / TOTAL_PAGES;
export const pagesAt = (f: number) => {
  if (f < FIRST_LAND) return 0;
  if (f < GROW[0]) return 1;
  const t = clamp01((f - GROW[0]) / (GROW[1] - GROW[0]));
  return 1 + (TOTAL_PAGES - 1) * (t * t * (3 - 2 * t));
};
export const bandStartAt = (i: number) => {
  // frame at which band i starts to grow (inverse of pagesAt, numerically)
  const before = BANDS.slice(0, i).reduce((s, b) => s + b.pages, 0);
  for (let f = GROW[0]; f <= GROW[1]; f++) if (pagesAt(f) >= before + 1) return f;
  return GROW[1];
};

// ---------- Two companies (S5) ----------
// each falling block is the same slice of time; where it lands is the company's choice
const LEFT_PLAN = ["P", "P", "G", "P", "P", "P", "P", "G", "P", "P", "P", "P"];
const RIGHT_PLAN = ["S", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G"];
const BLOCK = 40;
const PANELS = [
  { cx: 300, title: "보고서 많은 회사", plan: LEFT_PLAN },
  { cx: 780, title: "보고서 없는 회사", plan: RIGHT_PLAN },
];

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
const CAP_TOP = 1180;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 10);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP, opacity: out }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.5, color: BODY }}>
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
  { from: 34, to: 150, lines: [
    { at: 34, segs: [{ t: "보고서 한 장은 " }, { t: "가볍다.", c: INK }] },
    { at: 66, segs: [{ t: "그런데, " }, { t: "1년이면?", c: AMBER }] },
  ] },
  { from: 168, to: 416, lines: [
    { at: 168, segs: [{ t: "주간보고, 월간보고, 분기보고," }] },
    { at: 230, segs: [{ t: "그리고 " }, { t: "보고를 위한 보고", c: INK }] },
  ] },
  { from: 432, to: 626, lines: [
    { at: 432, segs: [{ t: "같은 내용이,", c: INK }] },
    { at: 462, segs: [{ t: "세 번씩 쌓인다" }] },
  ] },
  { from: TIME_AT, to: 836, lines: [
    { at: TIME_AT, segs: [{ t: "이 종이 더미는," }] },
    { at: TIME_AT + 30, segs: [{ t: "일했어야 할 " }, { t: "시간", c: AMBER }, { t: "이 쌓인 것이다" }] },
  ] },
  { from: 852, to: 1106, lines: [
    { at: 852, segs: [{ t: "같은 시간을 써도," }] },
    { at: 900, segs: [{ t: "한 회사는 " }, { t: "종이", c: INK }, { t: "를, 한 회사는 " }, { t: "성장", c: AMBER }, { t: "을 쌓는다" }] },
  ] },
];

// ---------- Pieces ----------

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color: string }> =
  ({ f, from, to, tag, text, color }) => {
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

// An isometric slab of paper: front face with page edges, top face, side face
const Slab: React.FC<{ x: number; y: number; w: number; h: number; tint?: number; topFace?: boolean; edges?: boolean }> =
  ({ x, y, w, h, tint = 0, topFace = true, edges = true }) => {
    if (h <= 0.2) return null;
    const lines: React.ReactNode[] = [];
    if (edges) for (let yy = y + 5; yy < y + h - 1; yy += 6) lines.push(<line key={yy} x1={x} y1={yy} x2={x + w} y2={yy} stroke="rgba(13,16,21,0.22)" strokeWidth={1} />);
    return (
      <g>
        <path d={`M ${x + w} ${y} L ${x + w + DEPTH.dx} ${y + DEPTH.dy} L ${x + w + DEPTH.dx} ${y + h + DEPTH.dy} L ${x + w} ${y + h} Z`} fill={PAPER_SIDE} />
        <rect x={x} y={y} width={w} height={h} fill={PAPER_FRONT} />
        {lines}
        {tint > 0 && <rect x={x} y={y} width={w} height={h} fill={AMBER} opacity={0.7 * tint} />}
        {topFace && <path d={`M ${x} ${y} L ${x + DEPTH.dx} ${y + DEPTH.dy} L ${x + w + DEPTH.dx} ${y + DEPTH.dy} L ${x + w} ${y} Z`} fill={PAPER_TOP} />}
      </g>
    );
  };

const Sheet: React.FC<{ x: number; y: number; w: number; rot: number; op?: number }> = ({ x, y, w, rot, op = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={op}>
    <path d={`M ${-w / 2} 0 L ${-w / 2 + DEPTH.dx} ${DEPTH.dy} L ${w / 2 + DEPTH.dx} ${DEPTH.dy} L ${w / 2} 0 Z`} fill="#E3E6EB" stroke="#AEB4BE" strokeWidth={1} />
    {[0.25, 0.45, 0.65].map((k, i) => (
      <line key={i} x1={-w / 2 + DEPTH.dx * k + 20} y1={DEPTH.dy * k} x2={w / 2 + DEPTH.dx * k - 30} y2={DEPTH.dy * k} stroke="#A6ACB6" strokeWidth={2} />
    ))}
  </g>
);

const Pile: React.FC<{ f: number }> = ({ f }) => {
  const out = 1 - progIO(f, 836, 26);
  if (out <= 0) return null;
  const dimCards = interpolate(f, [TRIPLE_AT - 10, TRIPLE_AT + 8, 610, 630], [1, 0.3, 0.3, 1], clamp);
  const timeTint = prog(f, TIME_AT + 10, 40);
  const pages = pagesAt(f);
  // first sheet falling in
  const fall = progIO(f, 4, FIRST_LAND - 4);
  let y = DESK_Y;
  let left = pages;
  const slabs: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  BANDS.forEach((b, i) => {
    const n = Math.max(0, Math.min(b.pages, left));
    left -= n;
    const h = n * PAGE_PX;
    const top = y - h;
    const isTop = i === BANDS.length - 1;
    const pulse = isTop ? interpolate(f, [585, 600, 630], [0, 1, 0.4], clamp) * (1 - prog(f, TIME_AT, 20)) : 0;
    slabs.push(
      <g key={i}>
        <Slab x={PX0} y={top} w={PW} h={h} tint={timeTint * 0.45} topFace={false} />
        {pulse > 0 && <rect x={PX0 - 3} y={top - 3} width={PW + 6} height={h + 6} fill="none" stroke={AMBER} strokeWidth={3} opacity={pulse} />}
        {h > 2 && <line x1={PX0} y1={top} x2={PX0 + PW} y2={top} stroke="rgba(13,16,21,0.6)" strokeWidth={2} />}
      </g>,
    );
    if (n > 0) {
      const lop = prog(f, bandStartAt(i), 14);
      const mid = top + Math.max(h, 18) / 2;
      const hoursOut = prog(f, TIME_AT + 20 + i * 6, 8);
      const hoursP = prog(f, TIME_AT + 28 + i * 6, 12);
      labels.push(
        <g key={i} opacity={lop * dimCards}>
          <line x1={PX0 + PW + DEPTH.dx + 8} y1={mid} x2={PX0 + PW + DEPTH.dx + 40} y2={mid} stroke={HAIR} strokeWidth={1.5} />
          <text x={PX0 + PW + DEPTH.dx + 52} y={mid + 9} fontSize={26} fontWeight={700} fill={BODY} opacity={1 - hoursOut}>{b.label}</text>
          <text x={PX0 + PW + DEPTH.dx + 52} y={mid + 9} fontSize={26} fontWeight={700} fill={AMBER} opacity={hoursP}>{`≈ ${b.hours}시간`}</text>
        </g>,
      );
    }
    y = top;
  });
  const topY = y;
  // a few loose sheets fluttering onto the pile while it grows
  const flutters: React.ReactNode[] = [];
  for (let k = 0; k < 9; k++) {
    const at = GROW[0] + 8 + k * 24;
    const p = clamp01((f - at) / 18);
    if (p <= 0 || p >= 1) continue;
    const yy = lerp(300, topY - 6, p * p);
    flutters.push(<Sheet key={k} x={PX0 + PW / 2 + Math.sin(k * 2.1) * 30 * (1 - p)} y={yy} w={PW * 0.9} rot={(1 - p) * (k % 2 ? 14 : -12)} op={Math.min(1, (1 - p) * 4)} />);
  }
  return (
    <g opacity={out}>
      <g opacity={dimCards}>
        {pages >= 1 && (
          <>
            {slabs}
            <path d={`M ${PX0} ${topY} L ${PX0 + DEPTH.dx} ${topY + DEPTH.dy} L ${PX0 + PW + DEPTH.dx} ${topY + DEPTH.dy} L ${PX0 + PW} ${topY} Z`} fill={PAPER_TOP} />
          </>
        )}
        {f < FIRST_LAND + 2 && f > 3 && (
          <Sheet x={PX0 + PW / 2 + (1 - fall) * 60} y={lerp(380, DESK_Y, fall * fall)} w={PW} rot={(1 - fall) * 18} />
        )}
        {flutters}
      </g>
      {labels}
    </g>
  );
};

const Counter: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, GROW[0] - 10, 16) * (1 - prog(f, 830, 14));
  if (op <= 0) return null;
  const pages = Math.round(pagesAt(f));
  const fromPages = prog(f, TIME_AT + 10, 10);
  const toTime = prog(f, TIME_AT + 18, 14);
  return (
    <div style={{ position: "absolute", right: MX, top: 350, opacity: op, textAlign: "right" }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 5, color: SUB }}>1년 보고서 <span style={{ letterSpacing: 1, fontWeight: 400 }}>· 예시</span></div>
      <div style={{ position: "relative", height: 70, marginTop: 4 }}>
        <div style={{ position: "absolute", right: 0, opacity: 1 - fromPages, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          <span style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1 }}>{pages.toLocaleString("en-US")}</span>
          <span style={{ fontSize: 30, color: SUB }}> 장</span>
        </div>
        <div style={{ position: "absolute", right: 0, opacity: toTime, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          <span style={{ fontSize: 60, fontWeight: 700, color: AMBER, letterSpacing: -1 }}>620</span>
          <span style={{ fontSize: 30, color: SUB }}> 시간</span>
        </div>
      </div>
      <div style={{ fontSize: 20, color: SUB, opacity: toTime, marginTop: 2 }}>장당 30분으로 계산</div>
    </div>
  );
};

// One report rebuilt for three readers
const SameContent: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [TRIPLE_AT - 4, TRIPLE_AT + 12, 596, 612], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const spread = progIO(f, TRIPLE_AT + 22, 32);
  const fly = progIO(f, 560, 40);
  const names = ["팀장용", "본부장용", "임원용"];
  const topBandY = DESK_Y - PILE_H;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      {[0, 1, 2].map((i) => {
        const x0 = 540 + (i - 1) * 250 * spread;
        const y0 = 640;
        const x = lerp(x0, PX0 + PW / 2, fly);
        const y = lerp(y0, topBandY + 40, fly);
        const s = lerp(1, 0.35, fly);
        const show = i === 1 ? 1 : spread;
        return (
          <div key={i} style={{
            position: "absolute", left: x - 100, top: y, width: 200, opacity: show * (1 - fly * 0.6),
            transform: `scale(${s}) rotate(${(i - 1) * 4 * spread * (1 - fly)}deg)`, transformOrigin: "50% 0%",
          }}>
            <div style={{ textAlign: "center", fontSize: 28, fontWeight: 700, color: INK, marginBottom: 14, opacity: prog(f, TRIPLE_AT + 50 + i * 10, 16) * (1 - fly) }}>{names[i]}</div>
            <div style={{ width: 200, height: 250, borderRadius: 6, background: "#E3E6EB", padding: "20px 18px", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
              <div style={{ width: [90, 120, 70][i], height: 9, borderRadius: 4, background: "#8A919C" }} />
              <div style={{ marginTop: 14, height: 34, borderRadius: 4, border: "1.5px solid #B4BAC4", background: ["transparent", "rgba(138,145,156,0.25)", "transparent"][i] }} />
              <div style={{ marginTop: 14, padding: "8px 8px 10px", borderRadius: 5, border: `1.5px dashed ${AMBER}` }}>
                {[100, 86, 94, 70].map((w, k) => (
                  <div key={k} style={{ width: `${w}%`, height: 6, borderRadius: 3, marginTop: k ? 10 : 2, background: "#C98A3A" }} />
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 990, textAlign: "center", fontSize: 26, fontWeight: 700, color: AMBER, opacity: prog(f, TRIPLE_AT + 80, 16) * (1 - fly) }}>
        내용은 같다
      </div>
    </div>
  );
};

const Companies: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, 846, 22);
  if (op <= 0) return null;
  const leftDim = interpolate(f, [END_AT, END_AT + 30], [1, 0.38], clamp);
  return (
    <g opacity={op}>
      {PANELS.map((pn, side) => {
        const pileX = pn.cx - 130;
        const barX = pn.cx + 40;
        let pileH = 0;
        let barH = 0;
        const items: React.ReactNode[] = [];
        pn.plan.forEach((kind, k) => {
          const at = DROPS_AT + k * DROP_GAP;
          const p = clamp01((f - at) / 16);
          if (p <= 0) return;
          const land = p >= 1;
          const h = kind === "S" ? 10 : BLOCK;
          const targetX = kind === "G" ? barX : pileX;
          const targetW = kind === "G" ? 80 : 130;
          const baseH = kind === "G" ? barH : pileH;
          const yLand = DESK_Y - baseH - h;
          if (!land) {
            const y = lerp(580, yLand, p * p);
            items.push(<rect key={k} x={targetX + targetW / 2 - 20} y={y} width={40} height={40} rx={8} fill="none" stroke={INK} strokeWidth={2} opacity={0.85} />);
          }
          if (kind === "G") barH += h * (land ? 1 : 0);
          else pileH += h * (land ? 1 : 0);
        });
        const grow = side === 1 ? interpolate(f, [END_AT, END_AT + 40], [0, 70], { ...clamp, easing: easeOut }) : 0;
        return (
          <g key={side} opacity={side === 0 ? leftDim : 1}>
            <line x1={pn.cx - 200} y1={DESK_Y} x2={pn.cx + 200} y2={DESK_Y} stroke={HAIR} strokeWidth={2} />
            <Slab x={pileX} y={DESK_Y - pileH} w={130} h={pileH} />
            {barH > 0 && (
              <g>
                <rect x={barX} y={DESK_Y - barH - grow} width={80} height={barH + grow} rx={4} fill="rgba(242,180,92,0.28)" stroke={AMBER} strokeWidth={2} />
                {side === 1 && f > END_AT && (
                  <rect x={barX - 10} y={DESK_Y - barH - grow - 10} width={100} height={barH + grow + 20} rx={10} fill="none" stroke={AMBER} strokeWidth={6}
                    opacity={0.25 * prog(f, END_AT, 30)} filter="url(#soft)" />
                )}
              </g>
            )}
            {items}
          </g>
        );
      })}
    </g>
  );
};

const CompanyLabels: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, 856, 20);
  if (op <= 0) return null;
  const leftDim = interpolate(f, [END_AT, END_AT + 30], [1, 0.38], clamp);
  const legend = prog(f, DROPS_AT + 40, 20);
  return (
    <>
      {PANELS.map((pn, side) => (
        <div key={side} style={{
          position: "absolute", left: pn.cx - 200, width: 400, top: 470, textAlign: "center", opacity: op * (side === 0 ? leftDim : 1),
          fontSize: 32, fontWeight: 700, color: side === 1 ? AMBER : BODY,
        }}>{pn.title}</div>
      ))}
      {PANELS.map((pn, side) => (
        <div key={`l${side}`} style={{ position: "absolute", left: pn.cx - 200, width: 400, top: DESK_Y + 16, display: "flex", justifyContent: "center", gap: 46, opacity: legend * (side === 0 ? leftDim : 1), fontSize: 22, color: SUB }}>
          <span style={{ width: 150, textAlign: "center" }}>{side === 1 ? "공유 한 장" : "보고서"}</span>
          <span style={{ width: 90, textAlign: "center", color: AMBER }}>성장</span>
        </div>
      ))}
    </>
  );
};

const Conclusion: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  const big: React.CSSProperties = { fontSize: 74, fontWeight: 700, color: INK, letterSpacing: -2, lineHeight: 1.25 };
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP + 4 }}>
      <Line f={f} at={END_AT + 6} style={big}>보고서 없는 회사가</Line>
      <Line f={f} at={END_AT + 32} style={{ ...big, color: AMBER }}>성장한다.</Line>
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

export const ReportPile: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  const deskOp = prog(f, 0, 20) * (1 - progIO(f, 836, 20));
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
      <div style={{ position: "absolute", inset: 0, transform: "translateY(40px)" }}>
        <Overline f={f} from={6} to={420} tag="ONE YEAR" text="보고서 더미" color={INK} />
        <Overline f={f} from={428} to={630} tag="SAME CONTENT" text="같은 내용, 세 번" color={AMBER} />
        <Overline f={f} from={TIME_AT - 4} to={840} tag="WHAT IT IS" text="쌓인 건 시간" color={AMBER} />
        <Overline f={f} from={848} to={1110} tag="TWO COMPANIES" text="같은 시간, 다른 결과" color={AMBER} />
        <Overline f={f} from={1118} to={TOTAL + 10} tag="CONCLUSION" text="성장하는 회사" color={AMBER} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          <line x1={140} y1={DESK_Y} x2={140 + 800 * prog(f, 0, 26)} y2={DESK_Y} stroke={HAIR} strokeWidth={2} opacity={deskOp} />
          <Pile f={f} />
          <Companies f={f} />
        </svg>
        <Counter f={f} />
        <SameContent f={f} />
        <CompanyLabels f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Conclusion f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
