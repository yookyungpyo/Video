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
const REPORT_FILL = "#262D38";
const REPORT_LINE = "#5E6878";
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
// S1 hook 0–150 · S2 the week fills with reports 150–450 · S3 same content ×3 450–660
// S4 the point 660–870 · S5 one shared page 870–1110 · S6 question 1110–1260
export const DROP0 = 165;
export const DROP_GAP = 22;
const CARDS_AT = 462;
const MERGE = [885, 955];
const ASK_AT = 1120;

// ---------- Calendar geometry ----------
const X0 = 170;
const X1 = 980;
const COL = (X1 - X0) / 5;
const Y0 = 520; // 09:00
const H = 70; // px per hour
const ty = (t: number) => Y0 + (t - 9) * H;
const DAYS = ["월", "화", "수", "목", "금"];
const SEGS: [number, number][] = [[9, 12], [13, 18]]; // working hours (lunch 12–13)

type Block = { d: number; t: number; h: number; label: string };
// example week (illustrative): 18h of reporting out of 40h
export const BLOCKS: Block[] = [
  { d: 0, t: 9, h: 2, label: "주간보고 작성" },
  { d: 0, t: 13, h: 2, label: "주간회의 (보고)" },
  { d: 1, t: 9, h: 1.5, label: "보고 양식 수정" },
  { d: 1, t: 15, h: 2, label: "실적 보고 자료" },
  { d: 2, t: 10, h: 2, label: "팀장 보고" },
  { d: 2, t: 14, h: 2, label: "본부장 보고용 재작성" },
  { d: 3, t: 9, h: 2, label: "본부장 보고" },
  { d: 3, t: 15, h: 1.5, label: "임원 보고용 재작성" },
  { d: 4, t: 10, h: 1.5, label: "임원 보고 리허설" },
  { d: 4, t: 14, h: 1.5, label: "다음 주 보고 준비" },
];
const SHARE_H = 1 / 3; // 20 minutes a day on one shared page
const landAt = (i: number) => DROP0 + i * DROP_GAP;
const mergeP = (f: number, d: number) => progIO(f, MERGE[0] + d * 6, MERGE[1] - MERGE[0]);

const reportHours = (f: number) => {
  let h = 0;
  BLOCKS.forEach((b, i) => { h += b.h * prog(f, landAt(i), 14); });
  // after the merge each day keeps only its 20-minute share block
  const m = DAYS.reduce((s, _, d) => s + mergeP(f, d), 0) / 5;
  return lerp(h, 5 * SHARE_H, m);
};
const fmtHours = (h: number) => {
  const mins = Math.round(h * 60);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  if (h > 2.5) return `${Math.round(h)}h`;
  return mm ? `${hh}h ${mm}m` : `${hh}h`;
};

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
const CAP_TOP = 1236;

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
  { from: 12, to: 150, lines: [
    { at: 12, segs: [{ t: "이번 주, " }, { t: "일한 시간", c: AMBER }, { t: "과" }] },
    { at: 32, segs: [{ t: "보고한 시간", c: INK }, { t: " 중 뭐가 더 길었나요?" }] },
  ] },
  { from: 168, to: 446, lines: [
    { at: 168, segs: [{ t: "보고서를 쓰고," }] },
    { at: 214, segs: [{ t: "보고서를 고치고," }] },
    { at: 262, segs: [{ t: "보고서를 " }, { t: "보고한다", c: INK }] },
  ] },
  { from: 462, to: 655, lines: [
    { at: 462, segs: [{ t: "같은 내용을,", c: INK }] },
    { at: 492, segs: [{ t: "보는 사람마다 다시 만든다" }] },
  ] },
  { from: 672, to: 866, lines: [
    { at: 672, segs: [{ t: "보고는 일을 " }, { t: "알리는 것", c: INK }, { t: "이지," }] },
    { at: 702, segs: [{ t: "일 그 자체", c: AMBER }, { t: "가 아니다" }] },
  ] },
  { from: 880, to: 1104, lines: [
    { at: 880, segs: [{ t: "보고서를 늘리는 대신," }] },
    { at: 912, segs: [{ t: "모두가 보는 " }, { t: "한 장", c: AMBER }, { t: "을 만든다" }] },
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

const Counter: React.FC<{ f: number }> = ({ f }) => {
  const op = prog(f, DROP0 - 10, 16) * (1 - prog(f, ASK_AT - 10, 14) * 0.6);
  if (op <= 0) return null;
  const h = reportHours(f);
  const merged = DAYS.reduce((s, _, d) => s + mergeP(f, d), 0) / 5;
  const share = h / 40;
  return (
    <div style={{ position: "absolute", right: MX, top: 350, opacity: op, textAlign: "right" }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 5, color: SUB }}>보고 시간 <span style={{ letterSpacing: 1, fontWeight: 400 }}>· 예시</span></div>
      <div style={{ marginTop: 6, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        <span style={{ fontSize: 52, fontWeight: 700, color: merged > 0.5 ? AMBER : INK, letterSpacing: -1 }}>{fmtHours(h)}</span>
        <span style={{ fontSize: 28, color: SUB }}> / 40h</span>
      </div>
      <div style={{ width: 240, height: 6, borderRadius: 3, background: "rgba(242,180,92,0.35)", marginTop: 10, marginLeft: "auto", overflow: "hidden" }}>
        <div style={{ width: `${share * 100}%`, height: "100%", background: REPORT_LINE }} />
      </div>
    </div>
  );
};

const Calendar: React.FC<{ f: number }> = ({ f }) => {
  const grid = progIO(f, 0, 36);
  const work = prog(f, 40, 50);
  const dim = interpolate(f, [CARDS_AT - 12, CARDS_AT + 8, 650, 672, ASK_AT - 10, ASK_AT + 20], [1, 0.22, 0.22, 1, 1, 0.3], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: dim }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* working-time fill (what's left for real work) */}
        {DAYS.map((_, d) => SEGS.map(([a, b], k) => (
          <rect key={`${d}-${k}`} x={X0 + d * COL + 6} y={ty(a) + 3} width={COL - 12} height={(ty(b) - ty(a) - 6) * work} rx={6}
            fill="rgba(242,180,92,0.16)" stroke="rgba(242,180,92,0.55)" strokeWidth={1.5} />
        )))}
        {/* lunch band */}
        <rect x={X0} y={ty(12)} width={(X1 - X0) * grid} height={H} fill="rgba(255,255,255,0.025)" />
        {/* hour lines */}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1={X0} y1={ty(9 + i)} x2={X0 + (X1 - X0) * grid} y2={ty(9 + i)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        {/* day columns */}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1={X0 + i * COL} y1={Y0 - 50} x2={X0 + i * COL} y2={Y0 - 50 + (ty(18) - Y0 + 50) * grid} stroke={HAIR} strokeWidth={1.5} />
        ))}
        {/* report blocks: drop in, later collapse into a 20-minute shared slot */}
        {BLOCKS.map((b, i) => {
          const p = prog(f, landAt(i), 14);
          if (p <= 0) return null;
          const m = mergeP(f, b.d);
          const first = BLOCKS.findIndex((x) => x.d === b.d) === i;
          const y = lerp(ty(b.t), first ? ty(9) : ty(9), m);
          const h = lerp(b.h * H, first ? SHARE_H * H : 0, m);
          const op = p * (first ? 1 : 1 - m);
          return (
            <g key={i} opacity={op} transform={`translate(0 ${(1 - p) * -24})`}>
              <rect x={X0 + b.d * COL + 6} y={y + 3} width={COL - 12} height={Math.max(0, h - 6)} rx={6}
                fill={m > 0.5 && first ? "rgba(242,180,92,0.30)" : REPORT_FILL} stroke={m > 0.5 && first ? AMBER : REPORT_LINE} strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
      {/* labels */}
      {DAYS.map((d, i) => (
        <div key={d} style={{
          position: "absolute", left: X0 + i * COL, width: COL, top: Y0 - 44, textAlign: "center",
          fontSize: 26, fontWeight: 700, color: BODY, opacity: prog(f, 10 + i * 4, 16),
        }}>{d}</div>
      ))}
      {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((t, i) => (
        <div key={t} style={{
          position: "absolute", left: MX - 4, width: 56, top: ty(t) - 12, textAlign: "right",
          fontSize: 18, color: t === 12 ? "rgba(138,147,163,0.6)" : SUB, fontVariantNumeric: "tabular-nums", opacity: prog(f, 14 + i * 2, 14),
        }}>{t}:00</div>
      ))}
      <div style={{ position: "absolute", left: X0 + 10, top: ty(12) + 22, fontSize: 18, color: "rgba(138,147,163,0.7)", opacity: grid }}>점심</div>
      {/* legend: what the two colours mean */}
      <div style={{ position: "absolute", left: X0, top: ty(18) + 16, display: "flex", gap: 28, alignItems: "center", fontSize: 22, color: BODY, opacity: prog(f, DROP0 - 20, 18) }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "rgba(242,180,92,0.25)", border: `1.5px solid ${AMBER}` }} />실제 업무
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: REPORT_FILL, border: `1.5px solid ${REPORT_LINE}` }} />보고
        </span>
      </div>
      {BLOCKS.map((b, i) => {
        const p = prog(f, landAt(i), 14);
        const m = mergeP(f, b.d);
        if (p <= 0 || m > 0.4) return null;
        return (
          <div key={i} style={{
            position: "absolute", left: X0 + b.d * COL + 16, width: COL - 32, top: ty(b.t) + 12 + (1 - p) * -24,
            fontSize: 20, fontWeight: 700, lineHeight: 1.3, color: "#B9C1CD", opacity: p * (1 - m / 0.4), wordBreak: "keep-all",
          }}>{b.label}</div>
        );
      })}
      {DAYS.map((_, d) => {
        const m = mergeP(f, d);
        if (m < 0.6) return null;
        return (
          <div key={d} style={{
            position: "absolute", left: X0 + d * COL, width: COL, top: ty(9) + 22, textAlign: "center",
            fontSize: 17, fontWeight: 700, color: AMBER, opacity: clamp01((m - 0.6) / 0.4),
          }}>공유 20분</div>
        );
      })}
    </div>
  );
};

// One report, rebuilt for three readers — same lines, different dressing
const Card: React.FC<{ variant: number }> = ({ variant }) => (
  <div style={{ width: 230, height: 300, borderRadius: 8, background: "#161C26", border: "1.5px solid rgba(201,206,214,0.35)", padding: "22px 20px", position: "relative" }}>
    <div style={{ height: 10, width: variant === 2 ? 150 : 110, borderRadius: 5, background: variant === 1 ? "rgba(242,244,247,0.75)" : "rgba(242,244,247,0.5)" }} />
    {variant === 0 && (
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ height: 14, border: "1px solid rgba(201,206,214,0.3)" }} />)}
      </div>
    )}
    {variant === 1 && (
      <div style={{ marginTop: 16, height: 46, display: "flex", alignItems: "flex-end", gap: 8 }}>
        {[20, 32, 26, 42].map((h, i) => <div key={i} style={{ width: 22, height: h, background: "rgba(201,206,214,0.35)" }} />)}
      </div>
    )}
    {variant === 2 && (
      <div style={{ marginTop: 14, height: 48, borderRadius: 6, border: "1px solid rgba(201,206,214,0.3)", display: "flex", alignItems: "center", paddingLeft: 12 }}>
        <div style={{ width: 70, height: 16, borderRadius: 4, background: "rgba(242,244,247,0.45)" }} />
      </div>
    )}
    {/* the identical content */}
    <div style={{ position: "absolute", left: 14, right: 14, top: 128, padding: "10px 10px 12px", borderRadius: 6, border: `1.5px dashed ${AMBER}` }}>
      {[100, 86, 94, 70].map((w, i) => (
        <div key={i} style={{ width: `${w}%`, height: 7, borderRadius: 4, marginTop: i ? 12 : 2, background: "rgba(242,180,92,0.55)" }} />
      ))}
    </div>
  </div>
);

const SameContent: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, [CARDS_AT - 4, CARDS_AT + 14, 640, 660], [0, 1, 1, 0], clamp);
  if (op <= 0) return null;
  const spread = progIO(f, CARDS_AT + 20, 34);
  const names = ["팀장용", "본부장용", "임원용"];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      {[0, 1, 2].map((i) => {
        const dx = (i - 1) * 270 * spread;
        const rot = (i - 1) * 4 * spread;
        const show = i === 1 ? 1 : spread;
        const lab = prog(f, CARDS_AT + 50 + i * 10, 16);
        return (
          <div key={i} style={{
            position: "absolute", left: 540 - 115 + dx, top: 600, opacity: show,
            transform: `rotate(${rot}deg) translateY(${(1 - prog(f, CARDS_AT, 20)) * 20}px)`, zIndex: i === 1 ? 2 : 1,
          }}>
            <div style={{ position: "absolute", left: 0, width: 230, top: -54, textAlign: "center", fontSize: 28, fontWeight: 700, color: INK, opacity: lab }}>{names[i]}</div>
            <Card variant={i} />
          </div>
        );
      })}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 940, textAlign: "center", fontSize: 24, color: AMBER, fontWeight: 700,
        opacity: prog(f, CARDS_AT + 90, 18),
      }}>내용은 같다</div>
    </div>
  );
};

const Ask: React.FC<{ f: number }> = ({ f }) => {
  if (f < ASK_AT) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 690 }}>
      <Line f={f} at={ASK_AT} style={{ fontSize: 84, fontWeight: 700, color: INK, letterSpacing: -2.5, lineHeight: 1.22 }}>당신의 회사는</Line>
      <Line f={f} at={ASK_AT + 22} style={{ fontSize: 84, fontWeight: 700, color: AMBER, letterSpacing: -2.5, lineHeight: 1.22 }}>어떤가요?</Line>
      <div style={{ height: 34 }} />
      <Line f={f} at={ASK_AT + 50} style={{ fontSize: 32, color: SUB, lineHeight: 1.5 }}>댓글로 이번 주 보고 시간을 알려주세요</Line>
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

export const ReportWeek: React.FC = () => {
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
      <div style={{ position: "absolute", inset: 0, transform: "translateY(40px)" }}>
        <Overline f={f} from={6} to={450} tag="THIS WEEK" text="한 주 일정표" color={INK} />
        <Overline f={f} from={458} to={660} tag="SAME CONTENT" text="같은 내용, 다른 양식" color={AMBER} />
        <Overline f={f} from={668} to={870} tag="THE POINT" text="보고와 일" color={AMBER} />
        <Overline f={f} from={878} to={1110} tag="INSTEAD" text="모두가 보는 한 장" color={AMBER} />
        <Overline f={f} from={1118} to={TOTAL + 10} tag="YOUR TURN" text="당신의 회사" color={AMBER} />
        <Calendar f={f} />
        <Counter f={f} />
        <SameContent f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Ask f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
};
