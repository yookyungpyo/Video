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
const SNOW = "#EEF1F5";
const INK = "#1B1E24";
const SUB = "#7C818A";
const BODY = "#3D424B";
const HAIR = "rgba(27,30,36,0.12)";
const SLATE = "#5E6B7D";
const PRINT = "rgba(92,112,140,0.42)";
const PACK = "rgba(150,166,188,0.30)";
const AMBER = "#DE8A1E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1350;
const MX = 100;

// ---------- Timeline ----------
// S1 untouched snow 0–150 · S2 boss: the team breaks the snow, the boss walks behind 150–540
// S3 snow covers it all, leader: one trail in front, the team steps in it 540–930
// S4 what remains, side by side 930–1140 · S5 the leader steps first 1140–1350
export const BOSS_AT = 150;
export const RESET_AT = 540;
export const LEAD_AT = 600;
export const SIDE_AT = 930;
export const END_AT = 1140;

// ---------- Field ----------
const TOP_Y = 470;
const BOT_Y = 1130;
const rnd = (i: number) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

type Step = { x: number; y: number; rot: number; at: number; side: number };

// team breaking fresh snow: five wavering trails, slow and uneven
const TEAM_X = [330, 435, 540, 645, 750];
const TEAM_TRAILS: Step[][] = TEAM_X.map((bx, k) => {
  const out: Step[] = [];
  let y = BOT_Y;
  let at = BOSS_AT + 10 + k * 9;
  for (let i = 0; y > TOP_Y; i++) {
    const side = i % 2 ? 1 : -1;
    const sway = Math.sin(i * 0.7 + k * 1.3) * 16 + (rnd(k * 50 + i) - 0.5) * 10;
    out.push({ x: bx + sway + side * 11, y, rot: side * 6 + (rnd(k * 70 + i) - 0.5) * 26, at, side });
    y -= 40 + rnd(k * 90 + i) * 10;
    at += 12 + rnd(k * 30 + i) * 5;
  }
  return out;
});
// the boss: clean prints along the middle trail the team already packed, far behind
const BOSS_TRAIL: Step[] = TEAM_TRAILS[2].map((s, i) => ({ ...s, x: s.x - s.side * 3, rot: s.side * 4, at: BOSS_AT + 80 + i * 17 }));

// leader: one gentle line, deep fresh prints; the team steps exactly into them
const LEADER_TRAIL: Step[] = (() => {
  const out: Step[] = [];
  let y = BOT_Y;
  for (let i = 0; y > TOP_Y; i++) {
    const side = i % 2 ? 1 : -1;
    out.push({ x: 540 + Math.sin(i * 0.33) * 30 + side * 11, y, rot: side * 6 + Math.sin(i * 0.33) * 8, at: LEAD_AT + 20 + i * 14, side });
    y -= 44;
  }
  return out;
})();
const FOLLOWERS = 5;
// follower k reaches leader print i — quick, but never past the leader
const followAt = (k: number, i: number) =>
  Math.max(LEADER_TRAIL[i].at + 16 + k * 8, LEAD_AT + 60 + k * 14 + i * 9);

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
const CAP_TOP = 1220;

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
  { from: 14, to: BOSS_AT - 4, lines: [
    { at: 14, segs: [{ t: "눈 쌓인 길은," }] },
    { at: 46, segs: [{ t: "누군가 " }, { t: "먼저 밟아야", c: INK }, { t: " 길이 됩니다." }] },
  ] },
  { from: BOSS_AT + 60, to: BOSS_AT + 220, lines: [
    { at: BOSS_AT + 62, segs: [{ t: "보스는 맨 뒤에서 말합니다." }] },
    { at: BOSS_AT + 96, segs: [{ t: "“빨리 가.”", c: INK }] },
  ] },
  { from: BOSS_AT + 226, to: RESET_AT - 4, lines: [
    { at: BOSS_AT + 228, segs: [{ t: "길은 팀이 내고," }] },
    { at: BOSS_AT + 262, segs: [{ t: "보스는 " }, { t: "다져진 길", c: INK }, { t: "을 걷습니다." }] },
  ] },
  { from: LEAD_AT, to: LEAD_AT + 162, lines: [
    { at: LEAD_AT + 2, segs: [{ t: "리더는 " }, { t: "맨 앞에서", c: AMBER }] },
    { at: LEAD_AT + 36, segs: [{ t: "먼저 밟습니다." }] },
  ] },
  { from: LEAD_AT + 168, to: SIDE_AT - 4, lines: [
    { at: LEAD_AT + 170, segs: [{ t: "팀은 그 발자국을" }] },
    { at: LEAD_AT + 204, segs: [{ t: "따라 걷습니다." }] },
  ] },
  { from: SIDE_AT + 16, to: END_AT - 4, lines: [
    { at: SIDE_AT + 18, segs: [{ t: "보스 뒤엔 " }, { t: "지친 발자국", c: INK }, { t: "이," }] },
    { at: SIDE_AT + 70, segs: [{ t: "리더 뒤엔 " }, { t: "길", c: AMBER }, { t: "이 남습니다." }] },
  ] },
];

// ---------- Pieces ----------

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

// one shoe print seen from above: sole + heel
const Print: React.FC<{ s: Step; op: number; fill?: string; stroke?: string; sw?: number; scale?: number }> =
  ({ s, op, fill = PRINT, stroke, sw = 2, scale = 1 }) => (
    <g transform={`translate(${s.x} ${s.y}) rotate(${s.rot}) scale(${scale})`} opacity={op}>
      <ellipse cx={0} cy={-7} rx={9} ry={13} fill={fill} stroke={stroke} strokeWidth={sw} />
      <ellipse cx={0} cy={13} rx={7} ry={7.5} fill={fill} stroke={stroke} strokeWidth={sw} />
    </g>
  );

const Tag: React.FC<{ x: number; y: number; text: string; color: string; op: number }> = ({ x, y, text, color, op }) =>
  op > 0 ? (
    <text x={x + 26} y={y + 6} fontSize={20} fontWeight={700} letterSpacing={4} fill={color} opacity={op}
      stroke={SNOW} strokeWidth={6} paintOrder="stroke" fontFamily={`'${SANS}', sans-serif`}>{text}</text>
  ) : null;

const tipOf = (trail: Step[], f: number) => {
  let last = -1;
  for (let i = 0; i < trail.length; i++) if (trail[i].at <= f) last = i;
  return last;
};

// boss field at local frame f
const BossField: React.FC<{ f: number; fade?: number; tags?: boolean }> = ({ f, fade = 1, tags = true }) => {
  const bossTip = tipOf(BOSS_TRAIL, f);
  const teamTop = TEAM_TRAILS.reduce((m, t) => {
    const i = tipOf(t, f);
    return i >= 0 ? Math.min(m, t[i].y) : m;
  }, BOT_Y);
  return (
    <g opacity={fade}>
      {TEAM_TRAILS.map((t, k) => (
        <g key={k}>
          {/* drag marks: feet that sank and dragged through deep snow */}
          {t.map((s, i) => {
            if (i === 0 || s.at > f) return null;
            const p = t[i - 1];
            const d = prog(f, s.at - 4, 8);
            return (
              <line key={`d${i}`} x1={p.x} y1={p.y - 18} x2={p.x + (s.x - p.x) * 0.6 * d} y2={p.y - 18 + (s.y + 22 - p.y + 18) * 0.6 * d}
                stroke={PRINT} strokeWidth={5} strokeLinecap="round" opacity={0.35} />
            );
          })}
          {t.map((s, i) => (s.at <= f ? <Print key={i} s={s} op={prog(f, s.at, 6)} scale={1.12} /> : null))}
        </g>
      ))}
      {BOSS_TRAIL.map((s, i) => (s.at <= f ? <Print key={i} s={s} op={prog(f, s.at, 6)} fill="rgba(238,241,245,0.9)" stroke={SLATE} sw={1.8} scale={0.94} /> : null))}
      {tags && teamTop < BOT_Y && <Tag x={TEAM_X[4] + 30} y={teamTop} text="TEAM" color={SUB} op={prog(f, BOSS_AT + 40, 20)} />}
      {bossTip >= 0 && (
        <>
          <Tag x={BOSS_TRAIL[bossTip].x} y={BOSS_TRAIL[bossTip].y} text="BOSS" color={SLATE} op={prog(f, BOSS_TRAIL[0].at, 20)} />
        </>
      )}
    </g>
  );
};

// leader field at local frame f
const LeaderField: React.FC<{ f: number; glow?: number }> = ({ f, glow = 0 }) => {
  const passed = (i: number) => {
    let c = 0;
    for (let k = 0; k < FOLLOWERS; k++) if (followAt(k, i) <= f) c++;
    return c;
  };
  const leadTip = tipOf(LEADER_TRAIL, f);
  let teamTip = -1;
  for (let i = 0; i < LEADER_TRAIL.length; i++) if (followAt(0, i) <= f) teamTip = i;
  return (
    <g>
      {/* the packed path: every passing foot widens and firms it */}
      {LEADER_TRAIL.map((s, i) => {
        if (i === 0) return null;
        const c = Math.min(passed(i - 1), passed(i));
        if (c === 0) return null;
        const p = LEADER_TRAIL[i - 1];
        return (
          <line key={`p${i}`} x1={p.x - p.side * 11} y1={p.y} x2={s.x - s.side * 11} y2={s.y}
            stroke={PACK} strokeWidth={22 + 10 * c} strokeLinecap="round" opacity={c / FOLLOWERS} />
        );
      })}
      {LEADER_TRAIL.map((s, i) => {
        if (s.at > f) return null;
        const c = passed(i);
        return (
          <g key={i}>
            <Print s={s} op={prog(f, s.at, 6)} fill={c > 0 ? "rgba(92,112,140,0.5)" : PRINT} scale={1.12} />
            <Print s={s} op={prog(f, s.at, 6) * (1 - 0.5 * (c / FOLLOWERS))} fill="none" stroke={AMBER} sw={2} scale={1.12} />
          </g>
        );
      })}
      {glow > 0 && leadTip >= 0 && (
        <circle cx={LEADER_TRAIL[leadTip].x} cy={LEADER_TRAIL[leadTip].y} r={50 + 110 * glow} fill="url(#sp-glow)" opacity={glow} />
      )}
      {leadTip >= 0 && (
        <Tag x={LEADER_TRAIL[leadTip].x + 10} y={LEADER_TRAIL[leadTip].y} text="LEADER" color={AMBER} op={prog(f, LEAD_AT + 20, 20)} />
      )}
      {teamTip >= 0 && teamTip < leadTip && (
        <Tag x={LEADER_TRAIL[teamTip].x + 10} y={LEADER_TRAIL[teamTip].y} text="TEAM" color={SUB} op={prog(f, followAt(0, 0), 20) * (teamTip < leadTip - 1 ? 1 : 0.0)} />
      )}
    </g>
  );
};

// falling snow, heavier while it buries the boss's field
const FLAKES = Array.from({ length: 90 }, (_, i) => ({
  x: rnd(i + 300) * 1080, y: rnd(i + 600) * 1920, r: 2 + rnd(i + 900) * 3.5, v: 1.2 + rnd(i + 1200) * 1.6, ph: rnd(i + 1500) * 6.28,
}));
const Snowfall: React.FC<{ f: number }> = ({ f }) => {
  const heavy = prog(f, RESET_AT - 10, 30) * (1 - prog(f, LEAD_AT + 10, 40));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {FLAKES.map((k, i) => {
        if (i >= 50 && heavy <= 0) return null;
        const op = i < 50 ? 0.9 : heavy;
        const y = ((k.y + f * k.v * (1 + heavy)) % 2000) - 40;
        const x = k.x + Math.sin(f / 50 + k.ph) * 14;
        return (
          <g key={i} opacity={op}>
            <circle cx={x + 1} cy={y + 1.5} r={k.r} fill="rgba(110,125,150,0.18)" />
            <circle cx={x} cy={y} r={k.r} fill="#FFFFFF" />
          </g>
        );
      })}
    </svg>
  );
};

const Field: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="sp-glow">
        <stop offset="0%" stopColor={AMBER} stopOpacity={0.45} />
        <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
      </radialGradient>
    </defs>
    {children}
  </svg>
);

// S4 panel: crop the walking area of a field and shrink it
const CROP = { x: 220, y: 420, w: 640, h: 760 };
const PANEL_S = 0.62;
const Panel: React.FC<{ left: number; top: number; label: string; color: string; op: number; children: React.ReactNode }> =
  ({ left, top, label, color, op, children }) => (
    <div style={{ position: "absolute", left, top, opacity: op }}>
      <div style={{ fontSize: 30, fontWeight: 700, color, marginBottom: 16 }}>{label}</div>
      <div style={{
        width: CROP.w * PANEL_S, height: CROP.h * PANEL_S, overflow: "hidden", position: "relative",
        borderRadius: 18, background: "#F5F7FA", boxShadow: "0 1px 0 rgba(27,30,36,0.06), 0 10px 30px rgba(60,75,100,0.08)",
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0",
          transform: `scale(${PANEL_S}) translate(${-CROP.x}px, ${-CROP.y}px)` }}>
          {children}
        </div>
      </div>
    </div>
  );

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10 }}>
      <Line f={f} at={END_AT + 16} style={{ fontSize: 44, color: BODY, lineHeight: 1.5 }}>리더는,</Line>
      <div style={{ height: 6 }} />
      <Line f={f} at={END_AT + 52} style={{ fontSize: 66, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
        길을 <span style={{ color: AMBER }}>먼저</span> 밟습니다.
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

export const SnowPath: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  const buried = 1 - prog(f, RESET_AT, 50); // fresh snow fills the boss's prints
  const fullOut = 1 - progIO(f, SIDE_AT, 26); // full-screen field gives way to the panels
  const fullBack = progIO(f, END_AT - 10, 30);
  const panels = progIO(f, SIDE_AT + 10, 26) * (1 - progIO(f, END_AT - 20, 24));
  const glow = prog(f, END_AT + 40, 50);
  const fullOp = f < SIDE_AT ? 1 : f < END_AT - 10 ? fullOut : fullBack;
  const panelTop = 470;
  const pw = CROP.w * PANEL_S;
  const gap = (1080 - 2 * MX - 2 * pw);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: SNOW, fontFamily: `'${SANS}', sans-serif`,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 85% 60% at 50% 46%, #FBFCFD 0%, rgba(238,241,245,0) 72%)",
      }} />
      <div style={{ position: "absolute", inset: 0, opacity: endFade }}>
        <Overline f={f} from={6} to={BOSS_AT - 4} tag="SNOW FIELD" text="아무도 밟지 않은 길" color={INK} />
        <Overline f={f} from={BOSS_AT + 4} to={RESET_AT - 4} tag="BOSS" text="보스의 눈길" color={SLATE} />
        <Overline f={f} from={LEAD_AT - 10} to={SIDE_AT - 4} tag="LEADER" text="리더의 눈길" color={AMBER} />
        <Overline f={f} from={SIDE_AT + 4} to={END_AT - 4} tag="WHAT REMAINS" text="남는 것" color={INK} />
        <Overline f={f} from={END_AT + 4} to={TOTAL + 10} tag="LEADER" text="길을 먼저 밟는 사람" color={AMBER} />

        {fullOp > 0 && (
          <div style={{ position: "absolute", inset: 0, opacity: fullOp }}>
            <Field>
              {f < LEAD_AT && <BossField f={f} fade={buried} />}
              {f >= LEAD_AT - 10 && <LeaderField f={f} glow={f >= END_AT ? glow : 0} />}
            </Field>
          </div>
        )}
        {panels > 0 && (
          <>
            <Panel left={MX} top={panelTop} label="보스" color={SLATE} op={panels}>
              <Field><BossField f={RESET_AT - 1} tags={false} /></Field>
            </Panel>
            <Panel left={MX + pw + gap} top={panelTop} label="리더" color={AMBER} op={panels}>
              <Field><LeaderField f={SIDE_AT} /></Field>
            </Panel>
          </>
        )}
        <Captions f={f} caps={CAPTIONS} />
        <Ending f={f} />
      </div>
      <Snowfall f={f} />
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(90,105,130,0.12) 100%)",
      }} />
    </div>
  );
};
