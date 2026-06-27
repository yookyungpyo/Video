import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
  Easing,
} from "remotion";

// ---------------------------------------------------------------------------
// Kinetic typography — same message, words as the protagonist on a dark stage.
// ---------------------------------------------------------------------------
const FONT = "Noto Sans KR";
const BG = "#0C0D11";
const WHITE = "#F3F5FB";
const MUTED = "#7E879B";
const RED = "#FF5A4D";
const GREEN = "#34D69E";
const BLUE = "#5B93F4";

const MASCOT = staticFile("brand/mascot.png");

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

const rand = (i: number, salt: number): number => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Dark animated background — drifting accent glows + faint star particles.
// ---------------------------------------------------------------------------
const DarkBG: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const TAU = Math.PI * 2;
  const glows = [
    { r: 720, bx: 0.22, by: 0.28, ax: 90, ay: 70, sx: 0.05, sy: 0.04, ph: 0 },
    { r: 820, bx: 0.8, by: 0.7, ax: 80, ay: 110, sx: 0.04, sy: 0.05, ph: 2.2 },
  ];
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {glows.map((g, i) => {
        const x = g.bx * width + Math.sin(t * TAU * g.sx + g.ph) * g.ax;
        const y = g.by * height + Math.cos(t * TAU * g.sy + g.ph) * g.ay;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - g.r / 2,
              top: y - g.r / 2,
              width: g.r,
              height: g.r,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
              filter: "blur(50px)",
            }}
          />
        );
      })}
      {Array.from({ length: 22 }).map((_, i) => {
        const px = rand(i, 1) * width;
        const speed = 10 + rand(i, 2) * 26;
        const size = 2 + rand(i, 3) * 5;
        const span = height + 120;
        const startY = rand(i, 4) * span;
        const y = (((startY - t * speed) % span) + span) % span;
        const op = 0.12 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 2));
        return (
          <div
            key={`s${i}`}
            style={{
              position: "absolute",
              left: px,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: WHITE,
              opacity: op,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// KLine — a line of text that pops in character-by-character. Accepts colored
// segments so part of a line can be accented.
// ---------------------------------------------------------------------------
type Seg = { text: string; color: string };
const KLine: React.FC<{
  segments: Seg[];
  startFrame: number;
  size: number;
  weight?: number;
  stagger?: number;
}> = ({ segments, startFrame, size, weight = 900, stagger = 1.3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let idx = 0;
  return (
    <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
      {segments.map((seg, si) =>
        seg.text.split("").map((ch, ci) => {
          const i = idx++;
          const sp = spring({
            frame: frame - startFrame - i * stagger,
            fps,
            config: { damping: 13, stiffness: 170 },
          });
          return (
            <span
              key={`${si}-${ci}`}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                transform: `translateY(${(1 - sp) * 46}px) scale(${0.7 + 0.3 * sp})`,
                opacity: sp,
                fontFamily: FONT,
                fontWeight: weight,
                fontSize: size,
                color: seg.color,
                letterSpacing: -1,
              }}
            >
              {ch}
            </span>
          );
        })
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FlyWord — a word that flies from an offset to a target offset (from screen
// center), with optional rotation/jitter and a vanish (fall-away) factor.
// ---------------------------------------------------------------------------
const FlyWord: React.FC<{
  text: string;
  delay: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  rot: number;
  color: string;
  size: number;
  weight?: number;
  jitter?: number;
  vanish?: number;
}> = ({
  text,
  delay,
  fromX,
  fromY,
  toX,
  toY,
  rot,
  color,
  size,
  weight = 800,
  jitter = 0,
  vanish = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 95, mass: 1 } });
  const x = interpolate(s, [0, 1], [fromX, toX]);
  const y = interpolate(s, [0, 1], [fromY, toY]) + vanish * 240;
  const jx = jitter ? Math.sin((frame - delay) / 4 + rot) * jitter : 0;
  const jy = jitter ? Math.cos((frame - delay) / 5 + rot) * jitter : 0;
  const op = interpolate(s, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }) * (1 - vanish);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${x + jx}px, ${y + jy}px) rotate(${rot}deg) scale(${0.6 + 0.4 * s})`,
        color,
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        whiteSpace: "nowrap",
        opacity: op,
      }}
    >
      {text}
    </div>
  );
};

const OPINIONS = ["내 생각이 맞아", "아니, 이건 아니지", "왜 안 들어?", "난 반대야", "내 방식대로"];

// ---------------------------------------------------------------------------
// Scene 1 — Hook
// ---------------------------------------------------------------------------
const HookScene: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <KLine segments={[{ text: "우리는", color: MUTED }]} startFrame={4} size={64} weight={700} />
      <KLine segments={[{ text: "같은 곳을", color: WHITE }]} startFrame={20} size={104} />
      <KLine
        segments={[
          { text: "보고 ", color: WHITE },
          { text: "있을까?", color: BLUE },
        ]}
        startFrame={40}
        size={104}
      />
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Scene 2 — Different directions → collapse (words scatter & shatter)
// ---------------------------------------------------------------------------
const ChaosScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const collapse = interpolate(frame, [118, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  // pre-collapse shake
  const shakeW = frame > 95 && frame < 122 ? (122 - frame) / 27 : 0;
  const sx = Math.sin(frame * 2.3) * 12 * shakeW;
  const sy = Math.cos(frame * 2.7) * 12 * shakeW;

  const slam = spring({ frame: frame - 122, fps, config: { damping: 9, stiffness: 150, mass: 1.2 } });
  const slamScale = frame >= 122 ? interpolate(slam, [0, 1], [3.4, 1]) : 0;
  const slamOp = interpolate(frame, [122, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashOp = interpolate(frame, [120, 126, 138], [0, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const heading = spring({ frame: frame - 2, fps, config: { damping: 18, stiffness: 120 } });

  return (
    <AbsoluteFill>
      {/* heading */}
      <div
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 76,
          color: WHITE,
          opacity: heading * (1 - collapse * 0.6),
          transform: `translateY(${(1 - heading) * 24}px)`,
        }}
      >
        방향이 <span style={{ color: RED }}>다르면?</span>
      </div>

      {/* scattering opinion words */}
      <div style={{ position: "absolute", left: sx, top: sy + 80, width: "100%", height: "100%" }}>
        {OPINIONS.map((w, i) => {
          const ang = (i / OPINIONS.length) * Math.PI * 2;
          const toX = Math.cos(ang) * 250 + (rand(i, 7) - 0.5) * 60;
          const toY = Math.sin(ang) * 200 + (rand(i, 8) - 0.5) * 60;
          const fromX = Math.cos(ang) * 900;
          const fromY = Math.sin(ang) * 900;
          const rot = (rand(i, 9) - 0.5) * 50;
          const col = [WHITE, MUTED, "#C9CEDB", WHITE, MUTED][i];
          return (
            <FlyWord
              key={i}
              text={w}
              delay={18 + i * 9}
              fromX={fromX}
              fromY={fromY}
              toX={toX}
              toY={toY}
              rot={rot}
              color={col}
              size={50}
              weight={700}
              jitter={4}
              vanish={collapse}
            />
          );
        })}
      </div>

      {/* red flash */}
      <AbsoluteFill style={{ background: RED, opacity: flashOp }} />

      {/* 붕괴 slam */}
      {frame >= 122 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 230,
              color: RED,
              opacity: slamOp,
              transform: `scale(${slamScale}) rotate(-3deg)`,
              letterSpacing: -4,
              textShadow: "0 12px 40px rgba(255,90,77,0.45)",
            }}
          >
            붕괴
          </div>
        </AbsoluteFill>
      )}

      {/* subtitle */}
      <div
        style={{
          position: "absolute",
          bottom: 360,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 46,
          color: WHITE,
          opacity: interpolate(frame, [150, 168], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        방향이 어긋난 조직은 무너진다
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Same direction → progress (words align into a forward stream)
// ---------------------------------------------------------------------------
const AlignScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const heading = spring({ frame: frame - 2, fps, config: { damping: 18, stiffness: 120 } });
  // after alignment, the stack lifts up and fades, punchline resolves
  const lift = interpolate(frame, [108, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 76,
          color: WHITE,
          opacity: heading,
          transform: `translateY(${(1 - heading) * 24}px)`,
        }}
      >
        방향이 <span style={{ color: GREEN }}>같으면?</span>
      </div>

      {/* opinions slide up into an aligned, evenly-spaced column */}
      <div style={{ position: "absolute", left: 0, top: -60 - lift * 130, width: "100%", height: "100%" }}>
        {OPINIONS.map((w, i) => {
          const toY = (i - 2) * 96;
          return (
            <FlyWord
              key={i}
              text={w}
              delay={20 + i * 8}
              fromX={0}
              fromY={360}
              toX={0}
              toY={toY}
              rot={0}
              color={i % 2 === 0 ? WHITE : GREEN}
              size={52}
              weight={700}
              vanish={lift}
            />
          );
        })}
      </div>

      {/* forward chevrons hint (▲) rising */}
      <div
        style={{
          position: "absolute",
          bottom: 470,
          width: "100%",
          textAlign: "center",
          color: GREEN,
          fontSize: 60,
          opacity: lift * 0.8,
          transform: `translateY(${(1 - lift) * 40}px)`,
        }}
      >
        ▲
      </div>

      {/* punchline */}
      <div
        style={{
          position: "absolute",
          bottom: 320,
          width: "100%",
          textAlign: "center",
          opacity: lift,
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: MUTED }}>다른 의견은 추진력이 되어</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 86, color: GREEN, marginTop: 10 }}>
          더 멀리 나아간다
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Thesis
// ---------------------------------------------------------------------------
const ThesisScene: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <KLine
        segments={[
          { text: "방향", color: BLUE },
          { text: "은 하나로", color: WHITE },
        ]}
        startFrame={6}
        size={100}
      />
      <KLine
        segments={[
          { text: "의견", color: GREEN },
          { text: "은 다양하게", color: WHITE },
        ]}
        startFrame={28}
        size={100}
      />
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Scene 5 — Outro (brand mascot honors the card-news rule)
// ---------------------------------------------------------------------------
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 30, fps, config: { damping: 13, stiffness: 130 } });
  const floatY = Math.sin((frame / fps) * Math.PI) * 10;
  const mw = 300;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 120 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <KLine segments={[{ text: "같은 곳을 볼 때,", color: WHITE }]} startFrame={4} size={66} weight={700} />
          <KLine
            segments={[
              { text: "다름", color: GREEN },
              { text: "은 ", color: WHITE },
              { text: "힘", color: BLUE },
              { text: "이 된다", color: WHITE },
            ]}
            startFrame={22}
            size={92}
          />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 70 }}>
        <div
          style={{
            width: mw,
            height: (mw * 2400) / 1350,
            transform: `translateY(${floatY}px) scale(${pop})`,
            filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.5))",
          }}
        >
          <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Transition wrapper
// ---------------------------------------------------------------------------
const Fade: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
// Main — accents shift with the narrative; one continuous dark stage.
// ---------------------------------------------------------------------------
export const Kinetic: React.FC = () => {
  const frame = useCurrentFrame();
  // accent color for the background glow, by phase
  const accent =
    frame < 105 ? BLUE : frame < 315 ? RED : frame < 495 ? GREEN : frame < 615 ? BLUE : GREEN;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <FontLoader />
      <DarkBG accent={accent} />
      <Sequence from={0} durationInFrames={105}>
        <Fade durationInFrames={105}>
          <HookScene />
        </Fade>
      </Sequence>
      <Sequence from={105} durationInFrames={210}>
        <Fade durationInFrames={210}>
          <ChaosScene />
        </Fade>
      </Sequence>
      <Sequence from={315} durationInFrames={180}>
        <Fade durationInFrames={180}>
          <AlignScene />
        </Fade>
      </Sequence>
      <Sequence from={495} durationInFrames={120}>
        <Fade durationInFrames={120}>
          <ThesisScene />
        </Fade>
      </Sequence>
      <Sequence from={615} durationInFrames={105}>
        <Fade durationInFrames={105}>
          <OutroScene />
        </Fade>
      </Sequence>
    </AbsoluteFill>
  );
};
