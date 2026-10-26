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
const FIG = "#2F3540"; // silhouettes
const FIG_BACK = "#6A7280"; // a figure further from the camera
const FURN = "#A3A9B2"; // furniture line art
const AMBER = "#DE8A1E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });
const rad = (d: number) => (d * Math.PI) / 180;

export const TOTAL = 1380;
const MX = 100;
const FLOOR = 1120;

// ---------- Timeline ----------
// S1 an adult and a child 0–150 · S2 looking down: the child steps back 150–450
// S3 kneeling to eye level: the child comes closer 450–720
// S4 at work: standing over a desk vs pulling up a chair 720–1140 · S5 authority 1140–1380
export const LOOK_AT = 150;
export const KNEEL_AT = 450;
export const WORK_AT = 720;
export const SIT_AT = 905;
export const END_AT = 1140;

// ---------- Silhouette figures (side view, simple forward kinematics) ----------
type Dims = { thigh: number; shin: number; torso: number; neck: number; headR: number; upper: number; fore: number; wLeg: number; wTorso: number; wArm: number };
const ADULT: Dims = { thigh: 122, shin: 120, torso: 168, neck: 18, headR: 34, upper: 96, fore: 90, wLeg: 36, wTorso: 68, wArm: 28 };
const CHILD: Dims = { thigh: 72, shin: 70, torso: 98, neck: 10, headR: 27, upper: 56, fore: 52, wLeg: 24, wTorso: 46, wArm: 19 };

// angles in degrees: limbs measured from straight down (+ = toward the way the figure faces),
// torso from straight up (+ = leaning forward), head = extra forward tilt
type Pose = { torso: number; head: number; thighF: number; shinF: number; thighB: number; shinB: number; armU: number; armL: number; seat?: number };
const STAND: Pose = { torso: 0, head: 0, thighF: 0, shinF: 0, thighB: 0, shinB: 0, armU: 4, armL: 8 };
const LOOM: Pose = { torso: 24, head: 22, thighF: 0, shinF: 0, thighB: 0, shinB: 0, armU: 14, armL: 30 };
const KNEEL: Pose = { torso: 14, head: -2, thighF: 86, shinF: -10, thighB: 6, shinB: -92, armU: 30, armL: 70 };
const SEATED: Pose = { torso: 4, head: 0, thighF: 88, shinF: 2, thighB: 84, shinB: 6, armU: 50, armL: 82, seat: 122 };
const HUNCH: Pose = { torso: 24, head: 20, thighF: 88, shinF: 2, thighB: 84, shinB: 6, armU: 36, armL: 86, seat: 122 };
const OPEN: Pose = { torso: -6, head: -6, thighF: 86, shinF: 4, thighB: 80, shinB: 10, armU: 66, armL: 74, seat: 122 };
const POINT: Pose = { torso: 22, head: 16, thighF: 0, shinF: 0, thighB: 0, shinB: 0, armU: 62, armL: 70 };
const BOSS_SEATED: Pose = { torso: 2, head: 4, thighF: 88, shinF: 2, thighB: 84, shinB: 6, armU: 26, armL: 64, seat: 122 };

const hipYOf = (p: Pose, d: Dims) => {
  if (p.seat !== undefined) return FLOOR - p.seat;
  const hF = d.thigh * Math.cos(rad(p.thighF)) + d.shin * Math.cos(rad(p.shinF));
  const hB = d.thigh * Math.cos(rad(p.thighB)) + d.shin * Math.cos(rad(p.shinB));
  return FLOOR - Math.max(hF, hB);
};
const mix = (a: Pose, b: Pose, t: number): Pose => ({
  torso: lerp(a.torso, b.torso, t), head: lerp(a.head, b.head, t),
  thighF: lerp(a.thighF, b.thighF, t), shinF: lerp(a.shinF, b.shinF, t),
  thighB: lerp(a.thighB, b.thighB, t), shinB: lerp(a.shinB, b.shinB, t),
  armU: lerp(a.armU, b.armU, t), armL: lerp(a.armL, b.armL, t),
});
type Placed = { pose: Pose; hipY: number };
const blend = (a: Pose, b: Pose, t: number, d: Dims): Placed => ({ pose: mix(a, b, t), hipY: lerp(hipYOf(a, d), hipYOf(b, d), t) });
const walk = (base: Pose, phase: number, amp = 20): Pose => ({
  ...base,
  thighF: base.thighF + amp * Math.sin(phase),
  shinF: base.shinF + amp * Math.sin(phase) * 0.4 - amp * 0.4 * Math.max(0, Math.cos(phase)),
  thighB: base.thighB - amp * Math.sin(phase),
  shinB: base.shinB - amp * Math.sin(phase) * 0.4 - amp * 0.4 * Math.max(0, -Math.cos(phase)),
  armU: base.armU - amp * 0.7 * Math.sin(phase),
});

const joints = (x: number, pl: Placed, d: Dims, dir: number) => {
  const p = pl.pose;
  const hip = { x, y: pl.hipY };
  const down = (from: { x: number; y: number }, a: number, len: number) => ({ x: from.x + dir * Math.sin(rad(a)) * len, y: from.y + Math.cos(rad(a)) * len });
  const kneeF = down(hip, p.thighF, d.thigh);
  const ankleF = down(kneeF, p.shinF, d.shin);
  const kneeB = down(hip, p.thighB, d.thigh);
  const ankleB = down(kneeB, p.shinB, d.shin);
  const sh = { x: hip.x + dir * Math.sin(rad(p.torso)) * d.torso, y: hip.y - Math.cos(rad(p.torso)) * d.torso };
  const ha = p.torso + p.head;
  const head = { x: sh.x + dir * Math.sin(rad(ha)) * (d.neck + d.headR), y: sh.y - Math.cos(rad(ha)) * (d.neck + d.headR) };
  const elbow = down(sh, p.armU, d.upper);
  const wrist = down(elbow, p.armL, d.fore);
  const eye = { x: head.x + dir * d.headR * 0.5, y: head.y - d.headR * 0.05 };
  return { hip, kneeF, ankleF, kneeB, ankleB, sh, head, elbow, wrist, eye };
};

const Figure: React.FC<{ x: number; pl: Placed; d: Dims; dir: number; color?: string; op?: number }> =
  ({ x, pl, d, dir, color = FIG, op = 1 }) => {
    const j = joints(x, pl, d, dir);
    const seg = (a: { x: number; y: number }, b: { x: number; y: number }, w: number, o = 1) => (
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" opacity={o} />
    );
    const foot = (a: { x: number; y: number }, o = 1) => (
      <line x1={a.x - dir * 4} y1={a.y} x2={a.x + dir * d.wLeg * 0.9} y2={a.y} stroke={color} strokeWidth={d.wLeg * 0.7} strokeLinecap="round" opacity={o} />
    );
    return (
      <g opacity={op}>
        {seg(j.hip, j.kneeB, d.wLeg, 0.82)}
        {seg(j.kneeB, j.ankleB, d.wLeg * 0.92, 0.82)}
        {foot(j.ankleB, 0.82)}
        {seg(j.hip, j.sh, d.wTorso)}
        <circle cx={j.head.x} cy={j.head.y} r={d.headR} fill={color} />
        {seg(j.sh, { x: lerp(j.sh.x, j.head.x, 0.5), y: lerp(j.sh.y, j.head.y, 0.5) }, d.wArm * 0.9)}
        {seg(j.hip, j.kneeF, d.wLeg)}
        {seg(j.kneeF, j.ankleF, d.wLeg * 0.92)}
        {foot(j.ankleF)}
        {seg(j.sh, j.elbow, d.wArm)}
        {seg(j.elbow, j.wrist, d.wArm * 0.9)}
      </g>
    );
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
  { from: 14, to: LOOK_AT - 4, lines: [
    { at: 14, segs: [{ t: "아이에게 말을 걸 때를" }] },
    { at: 46, segs: [{ t: "떠올려 보세요.", c: INK }] },
  ] },
  { from: LOOK_AT + 12, to: KNEEL_AT - 4, lines: [
    { at: LOOK_AT + 14, segs: [{ t: "선 채로 내려다보면," }] },
    { at: LOOK_AT + 76, segs: [{ t: "아이는 한 발 ", c: INK }, { t: "물러섭니다.", c: INK }] },
  ] },
  { from: KNEEL_AT + 8, to: WORK_AT - 6, lines: [
    { at: KNEEL_AT + 10, segs: [{ t: "무릎을 굽혀 " }, { t: "눈높이", c: AMBER }, { t: "를 맞추면," }] },
    { at: KNEEL_AT + 130, segs: [{ t: "아이가 먼저 다가옵니다.", c: INK }] },
  ] },
  { from: WORK_AT + 40, to: SIT_AT - 2, lines: [
    { at: WORK_AT + 42, segs: [{ t: "자리 옆에 서서 말하면," }] },
    { at: WORK_AT + 84, segs: [{ t: "어깨가 굳고,", c: INK }] },
  ] },
  { from: SIT_AT + 6, to: END_AT - 4, lines: [
    { at: SIT_AT + 8, segs: [{ t: "의자를 끌고 와 옆에 앉으면," }] },
    { at: SIT_AT + 100, segs: [{ t: "화면을 돌려 보여줍니다.", c: INK }] },
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

// ---------- S1–S3: adult and child ----------
const ADULT_X = 330;
const childX = (f: number) => {
  const back = progIO(f, LOOK_AT + 70, 110);
  const fwd = progIO(f, KNEEL_AT + 130, 120);
  return 760 + 150 * back - 350 * fwd;
};

const Park: React.FC<{ f: number }> = ({ f }) => {
  const loom = progIO(f, LOOK_AT + 20, 40) * (1 - progIO(f, KNEEL_AT, 30));
  const kneel = progIO(f, KNEEL_AT + 30, 80);
  const adult = kneel > 0 ? blend(STAND, KNEEL, kneel, ADULT) : blend(STAND, LOOM, loom, ADULT);
  const cx = childX(f);
  // walking phase follows distance travelled, so feet never slide
  const travelled = Math.abs(cx - 760) + (f > KNEEL_AT ? 300 : 0);
  const moving = Math.abs(childX(f + 1) - cx) > 0.15;
  const shy = progIO(f, LOOK_AT + 60, 40) * (1 - progIO(f, KNEEL_AT + 110, 40));
  const childBase: Pose = { ...STAND, torso: -7 * shy, head: -6 * shy, armU: 4 + 10 * shy, armL: 8 + 30 * shy };
  const childPose = moving ? walk(childBase, travelled / 22, 18) : childBase;
  const child: Placed = { pose: childPose, hipY: hipYOf(childPose, CHILD) };

  const ja = joints(ADULT_X, adult, ADULT, 1);
  const jc = joints(cx, child, CHILD, -1);
  const sight = prog(f, LOOK_AT + 30, 24) * (1 - prog(f, WORK_AT - 30, 20));
  const level = progIO(f, KNEEL_AT + 60, 60);
  const lineColor = interpolateColors(level, [0, 1], [SUB, AMBER]);
  return (
    <g>
      {sight > 0 && (
        <g opacity={sight}>
          <line x1={ja.eye.x + 12} y1={ja.eye.y} x2={jc.eye.x - 12} y2={jc.eye.y}
            stroke={lineColor} strokeWidth={2.5} strokeDasharray={level > 0.95 ? undefined : "8 10"} strokeLinecap="round" />
          <circle cx={ja.eye.x + 12} cy={ja.eye.y} r={4} fill={lineColor} />
          <circle cx={jc.eye.x - 12} cy={jc.eye.y} r={4} fill={lineColor} />
        </g>
      )}
      <Figure x={ADULT_X} pl={adult} d={ADULT} dir={1} />
      <Figure x={cx} pl={child} d={CHILD} dir={-1} />
    </g>
  );
};

// ---------- S4–S5: at a desk ----------
const TEAM_X = 640;
const DESK = { x0: 724, x1: 1010, top: FLOOR - 196 };
const MON_X = 930;

const Chair: React.FC<{ x: number; seatY: number; op?: number }> = ({ x, seatY, op = 1 }) => (
  <g opacity={op} stroke={FURN} strokeWidth={6} strokeLinecap="round" fill="none">
    <line x1={x - 52} y1={seatY} x2={x + 40} y2={seatY} />
    <line x1={x - 52} y1={seatY} x2={x - 62} y2={seatY - 120} />
    <line x1={x - 6} y1={seatY} x2={x - 6} y2={FLOOR - 26} />
    <line x1={x - 50} y1={FLOOR - 22} x2={x + 38} y2={FLOOR - 22} />
    <circle cx={x - 48} cy={FLOOR - 10} r={8} strokeWidth={4} />
    <circle cx={x + 36} cy={FLOOR - 10} r={8} strokeWidth={4} />
  </g>
);

const Office: React.FC<{ f: number }> = ({ f }) => {
  const bossIn = prog(f, WORK_AT + 20, 24);
  const loom = progIO(f, WORK_AT + 50, 36) * (1 - progIO(f, SIT_AT - 10, 24));
  const sit = progIO(f, SIT_AT + 50, 50);
  const chairIn = progIO(f, SIT_AT + 4, 50);
  const hunch = progIO(f, WORK_AT + 80, 30) * (1 - progIO(f, SIT_AT + 90, 34));
  const open = progIO(f, SIT_AT + 100, 40);
  const turn = progIO(f, SIT_AT + 112, 44);

  const bossX = lerp(470, 440, sit);
  const boss = sit > 0 ? blend(STAND, BOSS_SEATED, sit, ADULT) : blend(STAND, POINT, loom, ADULT);
  const team = open > 0 ? blend(SEATED, OPEN, open, ADULT) : blend(SEATED, HUNCH, hunch, ADULT);
  const teamX = TEAM_X + 12 * hunch * (1 - open);
  const seatY = FLOOR - 122 + 22;
  const monW = lerp(16, 118, turn);
  const monH = 150;
  const monY = DESK.top - 34 - monH;
  return (
    <g>
      {/* desk */}
      <g stroke={FURN} strokeWidth={6} strokeLinecap="round">
        <line x1={DESK.x0} y1={DESK.top} x2={DESK.x1} y2={DESK.top} />
        <line x1={DESK.x0 + 24} y1={DESK.top} x2={DESK.x0 + 24} y2={FLOOR} />
        <line x1={DESK.x1 - 24} y1={DESK.top} x2={DESK.x1 - 24} y2={FLOOR} />
        <line x1={MON_X} y1={DESK.top} x2={MON_X} y2={DESK.top - 34} />
        <line x1={MON_X - 34} y1={DESK.top - 3} x2={MON_X + 34} y2={DESK.top - 3} />
        <line x1={DESK.x0 + 40} y1={DESK.top - 6} x2={DESK.x0 + 110} y2={DESK.top - 6} strokeWidth={8} />
      </g>
      {/* monitor: edge-on, then turned to show the screen */}
      {turn > 0 && (
        <rect x={MON_X - monW / 2 - 30} y={monY - 30} width={monW + 60} height={monH + 60} rx={30}
          fill={AMBER} opacity={0.12 * turn} />
      )}
      <rect x={MON_X - monW / 2} y={monY} width={monW} height={monH} rx={8}
        fill={interpolateColors(turn, [0, 1], ["#59606C", "#FFF6E8"])} stroke="#59606C" strokeWidth={5} />
      {turn > 0.2 && [0, 1, 2].map((k) => (
        <line key={k} x1={MON_X - monW / 2 + 18} y1={monY + 34 + k * 30} x2={MON_X - monW / 2 + 18 + (monW - 36) * [0.9, 0.6, 0.75][k]} y2={monY + 34 + k * 30}
          stroke={AMBER} strokeWidth={6} strokeLinecap="round" opacity={clamp01((turn - 0.2) / 0.5) * 0.7} />
      ))}

      {/* the boss's chair rolls in from the left */}
      {chairIn > 0 && <Chair x={lerp(160, bossX - 4, chairIn)} seatY={seatY} op={chairIn} />}
      <Figure x={bossX} pl={boss} d={ADULT} dir={1} color={FIG_BACK} op={bossIn} />
      <Chair x={teamX - 4} seatY={seatY} />
      <Figure x={teamX} pl={team} d={ADULT} dir={1} />
    </g>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < END_AT) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 10 }}>
      <Line f={f} at={END_AT + 14} style={{ fontSize: 48, color: BODY, lineHeight: 1.45, letterSpacing: -1 }}>
        권위는 <b style={{ color: INK }}>내세울수록</b> 멀어지고,
      </Line>
      <Line f={f} at={END_AT + 60} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.35 }}>
        <span style={{ color: AMBER }}>내려놓을수록</span> 가까워집니다.
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

export const EyeLevel: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  const parkOp = prog(f, 0, 20) * (1 - progIO(f, WORK_AT - 14, 24));
  const officeOp = progIO(f, WORK_AT + 4, 26);
  const warm = prog(f, END_AT + 50, 60);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SANS}', sans-serif`,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 55% at 50% 46%, #FFFFFF 0%, rgba(246,244,239,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, opacity: endFade }}>
        <Overline f={f} from={6} to={WORK_AT - 6} tag="EYE LEVEL" text="눈높이" color={INK} />
        <Overline f={f} from={WORK_AT + 10} to={END_AT - 4} tag="AT WORK" text="회사에서" color={INK} />
        <Overline f={f} from={END_AT + 4} to={TOTAL + 10} tag="AUTHORITY" text="권위" color={AMBER} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="el-warm">
              <stop offset="0%" stopColor={AMBER} stopOpacity={0.35} />
              <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
            </radialGradient>
          </defs>
          {warm > 0 && <ellipse cx={600} cy={FLOOR - 330} rx={300 + 80 * warm} ry={240 + 60 * warm} fill="url(#el-warm)" opacity={warm} />}
          <line x1={MX} y1={FLOOR + 2} x2={1080 - MX} y2={FLOOR + 2} stroke={HAIR} strokeWidth={2} />
          {parkOp > 0 && <g opacity={parkOp}><Park f={f} /></g>}
          {officeOp > 0 && <g opacity={officeOp}><Office f={f} /></g>}
        </svg>
        <Captions f={f} caps={CAPTIONS} />
        <Ending f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(120,108,88,0.14) 100%)",
      }} />
    </div>
  );
};
