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
const BG = "#F6F4EF";
const INK = "#1B1E24";
const SUB = "#7C818A";
const BODY = "#3D424B";
const HAIR = "rgba(27,30,36,0.12)";
const LINE = "#4A505A";
const DIM = "#D5D8DD";
const AMBER = "#DE8A1E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1400;
const MX = 100;

// ---------- Timeline ----------
// S1 three circles, an empty centre 0–170 · S2 three pairs, 170 frames each 170–680
// S3 the centre: nobody leaves 680–880 · S4 reality table 880–1150 · S5 if you choose: colleagues 1150–1400
export const PAIR_AT = [170, 340, 510];
export const PAIR_LEN = 170;
export const CENTER_AT = 680;
export const TABLE_AT = 880;
export const END_AT = 1150;
export const PICK_AT = END_AT + 90; // "고른다면, 동료부터." — the colleague circle lights

// ---------- Venn geometry ----------
const R = 200;
const S = 210; // side of the triangle the centres sit on
const CX = 540;
const CY = 770;
const H3 = S / Math.sqrt(3); // centroid → centre
const CIRCLES = [
  { label: "돈", sub: "넉넉하다", x: CX - S / 2, y: CY - H3 / 2, at: 8 },
  { label: "업무강도", sub: "적당하다", x: CX + S / 2, y: CY - H3 / 2, at: 22 },
  { label: "동료", sub: "좋다", x: CX, y: CY + H3, at: 36 },
];
const labelPos = (i: number) => {
  const c = CIRCLES[i];
  const dx = c.x - CX;
  const dy = c.y - CY;
  const d = Math.hypot(dx, dy);
  return { x: c.x + (dx / d) * R * 0.52, y: c.y + (dy / d) * R * 0.52 };
};
// each case: the two circles that are good, and the one that is missing
const PAIRS = [
  { a: 0, b: 1, miss: 2, tag: "돈 + 업무강도" },
  { a: 1, b: 2, miss: 0, tag: "업무강도 + 동료" },
  { a: 0, b: 2, miss: 1, tag: "돈 + 동료" },
];
const pairOn = (f: number, k: number) =>
  prog(f, PAIR_AT[k] + 4, 18) * (1 - prog(f, PAIR_AT[k] + PAIR_LEN - 14, 14));
const CIRC = 2 * Math.PI * R;

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
const CAP_TOP = 1200;

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
  { from: 18, to: 166, lines: [
    { at: 18, segs: [{ t: "돈, 업무강도, 동료", c: INK }] },
    { at: 50, segs: [{ t: "셋 다 좋은 회사, 다녀본 적 있나요?" }] },
  ] },
  { from: PAIR_AT[0] + 8, to: PAIR_AT[0] + PAIR_LEN - 4, lines: [
    { at: PAIR_AT[0] + 10, segs: [{ t: "연봉 좋고 칼퇴인데," }] },
    { at: PAIR_AT[0] + 42, segs: [{ t: "팀장 한 명", c: INK }, { t: " 때문에 출근길이 무겁다" }] },
  ] },
  { from: PAIR_AT[1] + 8, to: PAIR_AT[1] + PAIR_LEN - 4, lines: [
    { at: PAIR_AT[1] + 10, segs: [{ t: "일도 편하고 사람도 좋은데," }] },
    { at: PAIR_AT[1] + 42, segs: [{ t: "월급날마다 " }, { t: "채용 공고", c: INK }, { t: "를 연다" }] },
  ] },
  { from: PAIR_AT[2] + 8, to: PAIR_AT[2] + PAIR_LEN - 4, lines: [
    { at: PAIR_AT[2] + 10, segs: [{ t: "연봉도 좋고 동료도 좋은데," }] },
    { at: PAIR_AT[2] + 42, segs: [{ t: "집에는 " }, { t: "잠만 자러", c: INK }, { t: " 간다" }] },
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

// circle i's outline, kept only inside every circle in `clips` and outside circle `out`
const Arc: React.FC<{ i: number; clips: number[]; out?: number; color: string; width: number }> =
  ({ i, clips, out, color, width }) => {
    const c = CIRCLES[i];
    let el: React.ReactNode = (
      <circle cx={c.x} cy={c.y} r={R} fill="none" stroke={color} strokeWidth={width}
        mask={out !== undefined ? `url(#pt-m${out})` : undefined} />
    );
    for (const j of clips) el = <g clipPath={`url(#pt-c${j})`}>{el}</g>;
    return <>{el}</>;
  };

const Venn: React.FC<{ f: number }> = ({ f }) => {
  const vis = f < END_AT ? 1 - prog(f, TABLE_AT - 16, 18) : prog(f, END_AT, 24);
  if (vis <= 0) return null;
  const pairs = PAIRS.map((_, k) => pairOn(f, k));
  const miss = [0, 1, 2].map((i) => PAIRS.reduce((s, p, k) => s + (p.miss === i ? pairs[k] : 0), 0));
  const zoom = f < TABLE_AT ? progIO(f, CENTER_AT, 44) : 0;
  const centre = prog(f, CENTER_AT + 10, 24) * (1 - prog(f, TABLE_AT - 16, 14));
  const hookQ = prog(f, 56, 16) * (1 - prog(f, PAIR_AT[0] + 4, 14));
  const breathe = 0.5 - 0.5 * Math.cos((2 * Math.PI * (f - 56)) / 48);
  const recede = prog(f, END_AT + 30, 24); // 돈·업무강도 step back
  const pick = prog(f, PICK_AT, 30);
  const strength = (i: number) =>
    (1 - 0.8 * miss[i]) * (1 - 0.35 * zoom) * (i < 2 ? 1 - 0.7 * recede : 1);

  return (
    <div style={{
      position: "absolute", inset: 0, opacity: vis,
      transform: `scale(${1 + 0.18 * zoom})`, transformOrigin: `${CX}px ${CY}px`,
    }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {CIRCLES.map((c, i) => (
            <clipPath key={`c${i}`} id={`pt-c${i}`}><circle cx={c.x} cy={c.y} r={R} /></clipPath>
          ))}
          {CIRCLES.map((c, i) => (
            <mask key={`m${i}`} id={`pt-m${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
              <rect width={1080} height={1920} fill="white" />
              <circle cx={c.x} cy={c.y} r={R} fill="black" />
            </mask>
          ))}
          <filter id="pt-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
        </defs>

        {/* chosen circle: a soft amber glow behind it */}
        {pick > 0 && (
          <g opacity={pick}>
            <circle cx={CIRCLES[2].x} cy={CIRCLES[2].y} r={R} fill="none" stroke={AMBER} strokeWidth={18}
              opacity={0.35} filter="url(#pt-blur)" />
            <circle cx={CIRCLES[2].x} cy={CIRCLES[2].y} r={R} fill={AMBER} fillOpacity={0.1} />
          </g>
        )}

        {/* the two-good-things regions */}
        {PAIRS.map((p, k) => pairs[k] > 0 && (
          <g key={k} opacity={pairs[k]}>
            <g mask={`url(#pt-m${p.miss})`}>
              <circle cx={CIRCLES[p.a].x} cy={CIRCLES[p.a].y} r={R} fill={AMBER} fillOpacity={0.26}
                clipPath={`url(#pt-c${p.b})`} />
            </g>
            <Arc i={p.a} clips={[p.b]} out={p.miss} color={AMBER} width={2.5} />
            <Arc i={p.b} clips={[p.a]} out={p.miss} color={AMBER} width={2.5} />
            <Arc i={p.miss} clips={[p.a, p.b]} color={AMBER} width={2.5} />
          </g>
        ))}

        {/* circles draw in from the top */}
        {CIRCLES.map((c, i) => {
          const d = progIO(f, c.at, 30);
          const dash = { strokeDasharray: CIRC, strokeDashoffset: CIRC * (1 - d) };
          return (
            <g key={i} transform={`rotate(${-90 + i * 30} ${c.x} ${c.y})`}>
              <circle cx={c.x} cy={c.y} r={R} fill="none" stroke={DIM} strokeWidth={2} {...dash} />
              <circle cx={c.x} cy={c.y} r={R} fill="none" stroke={LINE} strokeWidth={2.5} opacity={strength(i)} {...dash} />
              {i === 2 && pick > 0 && (
                <circle cx={c.x} cy={c.y} r={R} fill="none" stroke={AMBER} strokeWidth={3} opacity={pick} />
              )}
            </g>
          );
        })}

        {/* the empty centre: breathes in the hook, lit amber in S3 */}
        {(hookQ > 0 || centre > 0) && (
          <g>
            {centre > 0 && (
              <g clipPath="url(#pt-c2)" opacity={centre}>
                <circle cx={CIRCLES[0].x} cy={CIRCLES[0].y} r={R} fill={AMBER} fillOpacity={0.12 + 0.06 * breathe}
                  clipPath="url(#pt-c1)" />
              </g>
            )}
            {[0, 1, 2].map((i) => (
              <g key={i}>
                {hookQ > 0 && (
                  <g opacity={hookQ * (0.35 + 0.5 * breathe)}>
                    <Arc i={i} clips={[0, 1, 2].filter((j) => j !== i)} color={INK} width={2.5} />
                  </g>
                )}
                {centre > 0 && (
                  <g opacity={centre}>
                    <Arc i={i} clips={[0, 1, 2].filter((j) => j !== i)} color={AMBER} width={3} />
                  </g>
                )}
              </g>
            ))}
          </g>
        )}
      </svg>

      {/* "?" in the centre */}
      {(hookQ > 0 || centre > 0) && (
        <div style={{
          position: "absolute", left: CX, top: CY + 4, transform: "translate(-50%, -50%)",
          fontSize: 44, fontWeight: 700, lineHeight: 1,
          color: interpolateColors(centre, [0, 1], [SUB, AMBER]),
          opacity: Math.max(hookQ * (0.5 + 0.4 * breathe), centre),
        }}>?</div>
      )}

      {/* circle labels */}
      {CIRCLES.map((c, i) => {
        const lp = labelPos(i);
        const op = prog(f, c.at + 18, 18) * (1 - 0.65 * miss[i]) * (1 - 0.3 * zoom) * (i < 2 ? 1 - 0.55 * recede : 1);
        return (
          <div key={i} style={{
            position: "absolute", left: lp.x, top: lp.y, transform: "translate(-50%, -50%)",
            textAlign: "center", opacity: op,
          }}>
            <div style={{
              fontSize: 36, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: -0.5,
              color: i === 2 ? interpolateColors(pick, [0, 1], [INK, AMBER]) : INK,
            }}>{c.label}</div>
            <div style={{ fontSize: 22, color: SUB, marginTop: 2, whiteSpace: "nowrap" }}>{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- S4: reality table ----------
const ROWS = [
  { n: 3, verdict: "드물다" },
  { n: 2, verdict: "다닐 만하다" },
  { n: 1, verdict: "버티는 중" },
  { n: 0, verdict: "떠날 때" },
];
const ROW_H = 128;
const COL2 = 330;

const Table: React.FC<{ f: number }> = ({ f }) => {
  if (f < TABLE_AT || f >= END_AT) return null;
  const inP = prog(f, TABLE_AT, 16);
  const op = inP * clamp01((END_AT - f) / 12);
  const head = prog(f, TABLE_AT + 4, 20);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: 580, opacity: op, transform: `translateY(${(1 - inP) * 24}px)` }}>
      <div style={{ display: "flex", fontSize: 22, color: SUB, letterSpacing: 2, opacity: head, paddingBottom: 18 }}>
        <div style={{ width: COL2 }}>좋은 것</div>
        <div>현실</div>
      </div>
      <div style={{ height: 1, background: HAIR, transform: `scaleX(${head})`, transformOrigin: "left" }} />
      {ROWS.map((r, i) => {
        const at = TABLE_AT + 20 + i * 36;
        const p = prog(f, at, 20);
        return (
          <div key={i}>
            <div style={{ height: ROW_H, display: "flex", alignItems: "center" }}>
              <div style={{ width: COL2, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, width: 128 }}>
                  {[0, 1, 2].map((j) => {
                    const d = prog(f, at + j * 4, 14);
                    const on = j < r.n;
                    return (
                      <div key={j} style={{
                        width: 24, height: 24, borderRadius: 12, boxSizing: "border-box",
                        background: on ? AMBER : "transparent", border: on ? "none" : `2px solid ${DIM}`,
                        opacity: d, transform: `scale(${0.6 + 0.4 * d})`,
                      }} />
                    );
                  })}
                </div>
                <div style={{ opacity: p }}>
                  <Line f={f} at={at} style={{ fontSize: 34, fontWeight: 700, color: SUB, fontVariantNumeric: "tabular-nums" }}>
                    {r.n}개
                  </Line>
                </div>
              </div>
              <Line f={f} at={at + 6} style={{ fontSize: 52, fontWeight: 700, color: INK, letterSpacing: -1.5 }}>
                {r.verdict}
              </Line>
            </div>
            <div style={{ height: 1, background: HAIR, transform: `scaleX(${prog(f, at + 4, 24)})`, transformOrigin: "left" }} />
          </div>
        );
      })}
    </div>
  );
};

// ---------- S3 / S5 statements ----------
const Statements: React.FC<{ f: number }> = ({ f }) => {
  const big: React.CSSProperties = { fontSize: 56, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 };
  const lead: React.CSSProperties = { fontSize: 38, color: BODY, lineHeight: 1.5 };
  const centre = f >= CENTER_AT && f < TABLE_AT ? clamp01((TABLE_AT - 4 - f) / 12) : 0;
  return (
    <>
      {centre > 0 && (
        <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 20, opacity: centre }}>
          <Line f={f} at={CENTER_AT + 10} style={lead}>셋 다 좋은 회사는?</Line>
          <div style={{ height: 8 }} />
          <Line f={f} at={CENTER_AT + 40} style={big}>채용 공고가 안 올라온다.</Line>
          <Line f={f} at={CENTER_AT + 72} style={big}><span style={{ color: AMBER }}>아무도 안 나가니까.</span></Line>
        </div>
      )}
      {f >= END_AT && (
        <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 20 }}>
          <Line f={f} at={END_AT + 10} style={lead}>돈과 업무강도는 버틸 수 있다.</Line>
          <div style={{ height: 8 }} />
          <Line f={f} at={END_AT + 46} style={big}>사람은 버티기 어렵다.</Line>
          <Line f={f} at={PICK_AT} style={big}>고른다면, <span style={{ color: AMBER }}>동료부터.</span></Line>
        </div>
      )}
    </>
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

export const PickTwo: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SANS}', sans-serif`,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 55% at 50% 44%, #FFFFFF 0%, rgba(246,244,239,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, transform: "translateY(40px)", opacity: endFade }}>
        <Overline f={f} from={6} to={PAIR_AT[0]} tag="THREE THINGS" text="회사를 다니는 세 가지" color={INK} />
        {PAIRS.map((p, k) => (
          <Overline key={k} f={f} from={PAIR_AT[k] + 4} to={PAIR_AT[k] + PAIR_LEN - 2}
            tag={`CASE 0${k + 1}`} text={p.tag} color={AMBER} />
        ))}
        <Overline f={f} from={CENTER_AT + 4} to={TABLE_AT - 4} tag="THE CENTER" text="셋 다 좋은 회사" color={AMBER} />
        <Overline f={f} from={TABLE_AT + 4} to={END_AT - 4} tag="REALITY CHECK" text="현실 기준표" color={INK} />
        <Overline f={f} from={END_AT + 4} to={TOTAL + 10} tag="IF YOU CHOOSE" text="고른다면" color={AMBER} />
        <Venn f={f} />
        <Table f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Statements f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(120,108,88,0.14) 100%)",
      }} />
    </div>
  );
};
