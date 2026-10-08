import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";

const SANS = "Noto Sans KR";
const SERIF = "Noto Serif KR";
const PAPER = "#F4F0E8";
const PAPER_DEEP = "#E9E2D5";
const INK = "#15161A";
const MUTE = "#8A857C";
const THREAD = "#B8323A";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Opening holds: question readable ~2.5s before the strike, answer ~2s after.
export const TOTAL = 861;
const STRIKE_AT = 110;
const SCENE_IN = 195;
const BUTTON_AT = [243, 333, 423, 513, 603];
const CAT_AT = 719;
const TIE_AT = 753;
const ASK_AT = 785;

const PLACKET_X = 220;
const PLACKET_TOP = 400;
const BUTTON_Y = [500, 680, 860, 1040, 1220];
const TEXT_X = 380;

const SEGMENTS = [
  { text: "내가", size: 76 },
  { text: "옷을 갖춰입는 건", size: 76 },
  { text: "오늘 하루를", size: 76 },
  { text: "대충 살지 않겠다는", size: 66 },
  { text: "의미다.", size: 92 },
];

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SERIF}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-serif-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SERIF}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-serif-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SERIF}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-serif-kr-korean-900-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`700 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`900 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`400 64px "${SERIF}"`, "가"),
      (document as any).fonts.load(`700 64px "${SERIF}"`, "가"),
      (document as any).fonts.load(`900 64px "${SERIF}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const drawn = (p: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(p) });

// ---------- Paper ----------

const Paper: React.FC<{ f: number }> = ({ f }) => (
  <>
    <div style={{
      position: "absolute", inset: 0,
      background: `radial-gradient(ellipse at 50% 38%, ${PAPER} 0%, ${PAPER_DEEP} 100%)`,
    }} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "multiply" }}>
      <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={(f % 3) + 1} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paperGrain)" />
    </svg>
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(60,45,30,0.16) 100%)",
    }} />
  </>
);

// ---------- Clock ----------

const Clock: React.FC<{ f: number }> = ({ f }) => {
  const minute = 40 + BUTTON_AT.filter((b) => f >= b + 6).length;
  const colon = f % 30 < 18 ? 1 : 0.25;
  const op = interpolate(f, [6, 20], [0, 1], clamp);
  return (
    <div style={{
      position: "absolute", right: 120, top: 268, display: "flex", alignItems: "baseline", gap: 14,
      color: MUTE, fontSize: 34, fontWeight: 700, letterSpacing: 6, opacity: op,
      fontFamily: `'${SANS}', sans-serif`,
      fontVariantNumeric: "tabular-nums",
    }}>
      <span>AM</span>
      <span style={{ color: INK }}>6<span style={{ opacity: colon }}>:</span>{minute}</span>
    </div>
  );
};

// ---------- Opening: sloppy 대충 gets struck through ----------

const Opening: React.FC<{ f: number }> = ({ f }) => {
  if (f > SCENE_IN + 14) return null;
  const ease = Easing.out(Easing.cubic);
  const kicker = interpolate(f, [8, 26], [0, 1], { ...clamp, easing: ease });
  const word = interpolate(f, [14, 36], [0, 1], { ...clamp, easing: ease });
  const sub = interpolate(f, [28, 44], [0, 1], { ...clamp, easing: ease });
  const struck = f >= STRIKE_AT;
  const strike = interpolate(f, [STRIKE_AT, STRIKE_AT + 11], [0, 1], { ...clamp, easing: ease });
  const align = interpolate(f, [STRIKE_AT + 4, STRIKE_AT + 20], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const out = interpolate(f, [SCENE_IN - 4, SCENE_IN + 12], [1, 0], clamp);
  const drift = (1 - align) * Math.sin(f * 0.06) * 3;
  // Letters sit slightly out of line ("대충") until the thread pulls them straight.
  const letters = [
    { ch: "대", dy: -14, rot: -2.4 },
    { ch: "충", dy: 12, rot: 1.8 },
  ];
  return (
    <div style={{
      position: "absolute", inset: 0, opacity: out,
      transform: `scale(${1 - (1 - out) * 0.04})`, transformOrigin: "50% 48%",
    }}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 540, textAlign: "center",
        color: MUTE, fontSize: 28, fontWeight: 700, letterSpacing: 10,
        opacity: kicker, transform: `translateY(${(1 - kicker) * 10}px)`,
      }}>
        오늘 아침의 질문
        <div style={{ width: 44 * kicker, height: 3, background: THREAD, margin: "18px auto 0" }} />
      </div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 640,
        display: "flex", justifyContent: "center",
        opacity: word, transform: `translateY(${(1 - word) * 24}px)`,
      }}>
        <div style={{ position: "relative", display: "flex", gap: `${48 - 36 * align}px` }}>
          {letters.map((l) => (
            <span key={l.ch} style={{
              display: "inline-block", fontSize: 300, lineHeight: 1, fontWeight: 900,
              color: INK, opacity: 0.62 - 0.32 * align,
              transform: `translateY(${l.dy * (1 - align) + drift}px) rotate(${l.rot * (1 - align)}deg)`,
            }}>{l.ch}</span>
          ))}
          <div style={{
            position: "absolute", left: -36, right: -36, top: "50%", height: 12, borderRadius: 6,
            background: THREAD, transform: `scaleX(${strike}) rotate(-1.5deg)`,
            transformOrigin: "left center",
            boxShadow: "0 2px 0 rgba(0,0,0,0.12)",
          }} />
        </div>
      </div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 1030, textAlign: "center",
        fontSize: 46, fontWeight: 400, color: MUTE, letterSpacing: 2,
        opacity: sub * (struck ? 1 - align : 1), transform: `translateY(${(1 - sub) * 14}px)`,
      }}>오늘 하루를, 이렇게 보낼 것인가.</div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 1030, textAlign: "center",
        fontSize: 52, fontWeight: 900, color: INK, letterSpacing: 2,
        opacity: struck ? align : 0, transform: `translateY(${(1 - align) * 16}px)`,
      }}>아니다. 오늘은 다르다.</div>
    </div>
  );
};

// ---------- Shirt: collar + placket ----------

const Shirt: React.FC<{ f: number }> = ({ f }) => {
  const collar = interpolate(f, [SCENE_IN + 2, SCENE_IN + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const placket = interpolate(f, [SCENE_IN + 14, SCENE_IN + 52], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const w = 150;
  const bottom = BUTTON_Y[4] + 110;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }} fill="none">
      {/* collar wings */}
      <path d={`M${PLACKET_X - 200} ${PLACKET_TOP - 40} L${PLACKET_X - 96} ${PLACKET_TOP - 124} L${PLACKET_X - 20} ${PLACKET_TOP + 48}`}
        stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" {...drawn(collar)} />
      <path d={`M${PLACKET_X + 200} ${PLACKET_TOP - 40} L${PLACKET_X + 96} ${PLACKET_TOP - 124} L${PLACKET_X + 20} ${PLACKET_TOP + 48}`}
        stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" {...drawn(collar)} />
      <path d={`M${PLACKET_X - 96} ${PLACKET_TOP - 124} Q${PLACKET_X} ${PLACKET_TOP - 150} ${PLACKET_X + 96} ${PLACKET_TOP - 124}`}
        stroke={INK} strokeWidth={5} strokeLinecap="round" {...drawn(collar)} />
      {/* placket edges + running stitches, revealed top→down */}
      <g clipPath="url(#placketClip)">
        <line x1={PLACKET_X - w / 2} y1={PLACKET_TOP} x2={PLACKET_X - w / 2} y2={bottom} stroke={INK} strokeWidth={5} />
        <line x1={PLACKET_X + w / 2} y1={PLACKET_TOP} x2={PLACKET_X + w / 2} y2={bottom} stroke={INK} strokeWidth={5} />
        <line x1={PLACKET_X - w / 2 + 18} y1={PLACKET_TOP + 10} x2={PLACKET_X - w / 2 + 18} y2={bottom}
          stroke={INK} strokeWidth={2.5} strokeDasharray="12 10" opacity={0.55} />
        <line x1={PLACKET_X + w / 2 - 18} y1={PLACKET_TOP + 10} x2={PLACKET_X + w / 2 - 18} y2={bottom}
          stroke={INK} strokeWidth={2.5} strokeDasharray="12 10" opacity={0.55} />
      </g>
      <defs>
        <clipPath id="placketClip">
          <rect x={0} y={PLACKET_TOP - 10} width={1080} height={(bottom - PLACKET_TOP + 20) * placket} />
        </clipPath>
      </defs>
    </svg>
  );
};

// ---------- Button ----------

const Button: React.FC<{ i: number; f: number; fps: number }> = ({ i, f, fps }) => {
  const at = BUTTON_AT[i];
  if (f < at) return null;
  const snap = spring({ frame: f - at, fps, config: { stiffness: 260, damping: 9, mass: 0.6 } });
  const d = f - at;
  const ring = clamp01(d / 14);
  const stitch = (k: number) => interpolate(d, [6 + k * 5, 14 + k * 5], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const settle = clamp01(d / 30);
  const breathe = 1 + 0.012 * Math.sin((f - at) * 0.08) * settle;
  const y = BUTTON_Y[i];
  return (
    <div style={{
      position: "absolute", left: PLACKET_X - 64, top: y - 64, width: 128, height: 128,
      transform: `scale(${(1.45 - 0.45 * snap) * breathe}) rotate(${-40 * (1 - snap)}deg)`,
      opacity: Math.min(1, snap * 2),
    }}>
      <svg width={128} height={128} viewBox="0 0 128 128" fill="none" style={{ overflow: "visible" }}>
        <circle cx={64} cy={64} r={54} stroke={INK} strokeWidth={4} opacity={0.5 * (1 - ring)}
          transform={`translate(64 64) scale(${1 + ring * 0.75}) translate(-64 -64)`} />
        <ellipse cx={68} cy={72} rx={54} ry={50} fill="rgba(60,45,30,0.14)" />
        <circle cx={64} cy={64} r={54} fill="#EFE9DD" stroke={INK} strokeWidth={6} />
        <circle cx={64} cy={64} r={41} stroke={INK} strokeWidth={2.5} opacity={0.45} />
        <circle cx={52} cy={52} r={5.5} fill={INK} />
        <circle cx={76} cy={52} r={5.5} fill={INK} />
        <circle cx={52} cy={76} r={5.5} fill={INK} />
        <circle cx={76} cy={76} r={5.5} fill={INK} />
        <line x1={52} y1={52} x2={76} y2={76} stroke={THREAD} strokeWidth={7} strokeLinecap="round" {...drawn(stitch(0))} />
        <line x1={76} y1={52} x2={52} y2={76} stroke={THREAD} strokeWidth={7} strokeLinecap="round" {...drawn(stitch(1))} />
        <line x1={50} y1={50} x2={78} y2={78} stroke={THREAD} strokeWidth={3} strokeLinecap="round" opacity={0.6} {...drawn(stitch(2))} />
        <line x1={78} y1={50} x2={50} y2={78} stroke={THREAD} strokeWidth={3} strokeLinecap="round" opacity={0.6} {...drawn(stitch(3))} />
      </svg>
    </div>
  );
};

// ---------- Sentence segment ----------

const Segment: React.FC<{ i: number; f: number; fps: number }> = ({ i, f, fps }) => {
  const at = BUTTON_AT[i] + 8;
  if (f < at) return null;
  const seg = SEGMENTS[i];
  const wipe = interpolate(f - at, [0, 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rise = spring({ frame: f - at, fps, config: { stiffness: 120, damping: 16, mass: 0.8 } });
  const idx = interpolate(f - at, [-6, 6], [0, 1], clamp);
  const last = i === SEGMENTS.length - 1;
  return (
    <div style={{
      position: "absolute", left: TEXT_X, top: BUTTON_Y[i] - seg.size * 0.72,
      transform: `translateY(${(1 - rise) * 16}px)`,
    }}>
      <div style={{
        position: "absolute", left: 2, top: -30, color: THREAD, fontSize: 22, fontWeight: 700,
        fontFamily: `'${SANS}', sans-serif`,
        letterSpacing: 5, opacity: idx, fontVariantNumeric: "tabular-nums",
      }}>0{i + 1}</div>
      <div style={{
        clipPath: `inset(-20% ${(1 - wipe) * 100}% -20% 0)`,
        fontSize: seg.size, fontWeight: 900, color: INK, lineHeight: 1.2, whiteSpace: "nowrap",
        letterSpacing: last ? 2 : 0,
      }}>
        {last ? <>의미다<span style={{ color: THREAD }}>.</span></> : seg.text}
      </div>
    </div>
  );
};

// ---------- Cat with necktie ----------

const Cat: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  if (f < CAT_AT) return null;
  const enter = spring({ frame: f - CAT_AT, fps, config: { stiffness: 170, damping: 11, mass: 0.8 } });
  const tie = spring({ frame: f - TIE_AT, fps, config: { stiffness: 320, damping: 10, mass: 0.6 } });
  const tied = f >= TIE_AT;
  const swing = tied ? Math.sin((f - TIE_AT) * 0.35) * 6 * Math.exp(-(f - TIE_AT) / 30) : 0;
  const bob = Math.sin(f * 0.12) * 4;
  const knot = tied ? 1 - 0.35 * (1 - tie) : 0.65;
  return (
    <div style={{
      position: "absolute", left: 870, top: 1350,
      transform: `translate(-50%, 0) translateY(${(1 - enter) * 160 + bob}px) scale(${enter})`,
    }}>
      <div style={{ fontSize: 118, lineHeight: 1, textAlign: "center", transform: `rotate(${tied ? -swing * 0.3 : 0}deg)` }}>🐱</div>
      <svg width={120} height={130} viewBox="0 0 120 130" fill="none"
        style={{ position: "absolute", left: 0, top: 100, overflow: "visible" }}>
        <g transform={`translate(60 0) rotate(${swing}) translate(-60 0)`}>
          <path d="M60 22 L44 36 L52 96 L60 110 L68 96 L76 36 Z" fill={THREAD} opacity={0.95}
            transform={`translate(60 22) scaleY(${0.9 + 0.1 * tie}) translate(-60 -22)`} />
          <path d="M48 0 L72 0 L76 24 L44 24 Z" fill="#8E2730"
            transform={`translate(60 12) scale(${knot}) translate(-60 -12)`} />
        </g>
      </svg>
    </div>
  );
};

// ---------- Closing ask ----------

const Ask: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  if (f < ASK_AT) return null;
  const s = spring({ frame: f - ASK_AT, fps, config: { stiffness: 140, damping: 15, mass: 0.8 } });
  const line = interpolate(f - ASK_AT, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 120, top: 1452, opacity: s, transform: `translateY(${(1 - s) * 16}px)` }}>
      <div style={{ width: 520 * line, height: 4, background: THREAD, borderRadius: 2, marginBottom: 20 }} />
      <div style={{ fontSize: 38, fontWeight: 700, color: INK, letterSpacing: 1, whiteSpace: "nowrap" }}>
        당신의 <span style={{ color: THREAD }}>'갖춰입기'</span>는 무엇인가요?
      </div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 400, color: MUTE, letterSpacing: 2 }}>댓글로 알려주세요</div>
    </div>
  );
};

// ---------- Root ----------

export const GatchwoIpgi: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneIn = interpolate(f, [SCENE_IN, SCENE_IN + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const push = interpolate(f, [BUTTON_AT[0], CAT_AT], [1, 1.05], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const settle = interpolate(f, [CAT_AT, CAT_AT + 30], [1.05, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const scale = f < CAT_AT ? push : settle;
  const fadeOut = interpolate(f, [TOTAL - 14, TOTAL], [1, 0], clamp);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: PAPER, fontFamily: `'${SERIF}', serif`,
    }}>
      <FontLoader />
      <Paper f={f} />
      <Clock f={f} />
      <Opening f={f} />
      <div style={{
        position: "absolute", inset: 0, opacity: sceneIn,
        transform: `translateY(${(1 - sceneIn) * 40}px) scale(${scale})`, transformOrigin: "50% 46%",
      }}>
        <Shirt f={f} />
        {BUTTON_Y.map((_, i) => <Button key={i} i={i} f={f} fps={fps} />)}
        {SEGMENTS.map((_, i) => <Segment key={i} i={i} f={f} fps={fps} />)}
        <Cat f={f} fps={fps} />
        <Ask f={f} fps={fps} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: PAPER, opacity: 1 - fadeOut, pointerEvents: "none" }} />
    </div>
  );
};
