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
// Design tokens (derived from the mascot palette)
// ---------------------------------------------------------------------------
const FONT = "Noto Sans KR";
const INK = "#222633";
const INK_SOFT = "#5B6376";
const BLUE = "#3E78C8";
const BLUE_DEEP = "#2A5BA0";
const BLUE_SOFT = "#A9C7E0";
const RED = "#E1544A";
const GREEN = "#1FA06A";
const CARD = "#FFFFFF";

const MASCOT = staticFile("brand/mascot.png");

// ---------------------------------------------------------------------------
// Font loading — inject @font-face for the local Korean woff2 files and block
// rendering until the glyphs are ready so no frame flashes a fallback font.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------
const Mascot: React.FC<{ width: number; floatAmp?: number; flip?: boolean }> = ({
  width,
  floatAmp = 14,
  flip = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 130, mass: 0.9 } });
  const floatY = Math.sin((frame / fps) * 2 * Math.PI * 0.5) * floatAmp;
  const height = (width * 2400) / 1350;
  return (
    <div
      style={{
        width,
        height,
        transform: `translateY(${floatY}px) scale(${pop}) ${flip ? "scaleX(-1)" : ""}`,
        filter: "drop-shadow(0 24px 36px rgba(40,60,90,0.20))",
      }}
    >
      <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

// Arrow drawn pointing UP by default (angle 0 = up). angle in degrees, clockwise.
const Arrow: React.FC<{
  x: number;
  y: number;
  angle: number;
  length: number;
  color: string;
  thickness?: number;
  opacity?: number;
}> = ({ x, y, angle, length, color, thickness = 18, opacity = 1 }) => {
  const head = thickness * 2.2;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        transformOrigin: "center center",
      }}
    >
      <svg
        width={head * 2}
        height={length}
        viewBox={`0 0 ${head * 2} ${length}`}
        style={{ overflow: "visible" }}
      >
        <line
          x1={head}
          y1={length}
          x2={head}
          y2={head}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        <polygon
          points={`${head},0 ${head * 2},${head * 1.1} ${0},${head * 1.1}`}
          fill={color}
        />
      </svg>
    </div>
  );
};

const Bubble: React.FC<{
  x: number;
  y: number;
  text: string;
  opacity?: number;
  scale?: number;
}> = ({ x, y, text, opacity = 1, scale = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      background: CARD,
      color: INK,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 34,
      padding: "16px 26px",
      borderRadius: 24,
      border: `3px solid ${BLUE_SOFT}`,
      boxShadow: "0 10px 24px rgba(40,60,90,0.14)",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

const Background: React.FC<{ tint?: string }> = ({ tint = "#EAF1FA" }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 80% at 50% 18%, #FFFFFF 0%, ${tint} 60%, ${tint} 100%)`,
    }}
  />
);

// Small kicker pill
const Kicker: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <div
    style={{
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 30,
      letterSpacing: 2,
      color: "#FFFFFF",
      background: color,
      padding: "12px 28px",
      borderRadius: 999,
      boxShadow: `0 10px 22px ${color}44`,
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// Scene 1 — Title
// ---------------------------------------------------------------------------
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t1 = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 110 } });
  const t2 = spring({ frame: frame - 20, fps, config: { damping: 18, stiffness: 110 } });
  return (
    <AbsoluteFill>
      <Background tint="#E7F0FB" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 150 }}>
        <div style={{ opacity: t1, transform: `translateY(${(1 - t1) * 30}px)` }}>
          <Kicker text="ORGANIZATION" color={BLUE} />
        </div>
        <div
          style={{
            marginTop: 34,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 96,
            lineHeight: 1.22,
            color: INK,
            opacity: t2,
            transform: `translateY(${(1 - t2) * 36}px)`,
          }}
        >
          조직의 <span style={{ color: BLUE }}>방향</span>은<br />
          하나여야 한다
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 60 }}>
        <Mascot width={620} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Problem: different directions + different opinions = collapse
// ---------------------------------------------------------------------------
const chaosAngles = [-52, 28, 158, -126, 96];
const opinions = ["내 생각은…", "이게 맞아요", "아니, 이쪽!"];

const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 120 } });

  // collapse kicks in around frame 120 within the scene
  const collapse = interpolate(frame, [120, 175], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const shake = collapse > 0 && collapse < 1 ? Math.sin(frame * 1.6) * 6 * (1 - collapse) : 0;
  const cx = 540;
  const cy = 760;

  return (
    <AbsoluteFill>
      <Background tint="#FBEDEC" />
      {/* heading */}
      <div
        style={{
          position: "absolute",
          top: 110,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 70,
          color: INK,
          opacity: head,
          transform: `translateY(${(1 - head) * 24}px)`,
        }}
      >
        방향이 <span style={{ color: RED }}>다르면?</span>
      </div>

      {/* arrows cluster (scatter on collapse) */}
      <div style={{ position: "absolute", left: shake, top: 0, width: "100%", height: "100%" }}>
        {chaosAngles.map((a, i) => {
          const appear = spring({ frame: frame - 18 - i * 6, fps, config: { damping: 16, stiffness: 130 } });
          const driftX = Math.sin((a * Math.PI) / 180) * collapse * 360;
          const driftY = -Math.cos((a * Math.PI) / 180) * collapse * 360;
          return (
            <Arrow
              key={i}
              x={cx + driftX}
              y={cy + driftY}
              angle={a}
              length={210}
              thickness={20}
              color={interpolateColor(collapse, BLUE, RED)}
              opacity={appear * (1 - collapse * 0.85)}
            />
          );
        })}
      </div>

      {/* opinion bubbles */}
      {opinions.map((txt, i) => {
        const appear = spring({ frame: frame - 40 - i * 10, fps, config: { damping: 16, stiffness: 130 } });
        const pos = [
          { x: 250, y: 560 },
          { x: 830, y: 640 },
          { x: 360, y: 980 },
        ][i];
        return (
          <Bubble
            key={i}
            x={pos.x}
            y={pos.y}
            text={txt}
            opacity={appear * (1 - collapse)}
            scale={appear}
          />
        );
      })}

      {/* mascot reacting (small, worried tint via red glow) */}
      <div style={{ position: "absolute", right: 40, bottom: 470, opacity: head }}>
        <Mascot width={300} floatAmp={8} />
      </div>

      {/* punchline */}
      <div
        style={{
          position: "absolute",
          bottom: 150,
          width: "100%",
          textAlign: "center",
          opacity: collapse,
          transform: `scale(${0.8 + collapse * 0.2})`,
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: INK_SOFT }}>
          다른 의견이 더해지면
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 86, color: RED, marginTop: 8 }}>
          조직은 붕괴된다
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Solution: same direction + different opinions = progress
// ---------------------------------------------------------------------------
const fanAngles = [-14, -7, 0, 7, 14];

const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 120 } });
  const advance = interpolate(frame, [110, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const cx = 540;
  const cy = 820;

  return (
    <AbsoluteFill>
      <Background tint="#E6F5EE" />
      <div
        style={{
          position: "absolute",
          top: 110,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 70,
          color: INK,
          opacity: head,
          transform: `translateY(${(1 - head) * 24}px)`,
        }}
      >
        방향이 <span style={{ color: GREEN }}>같으면?</span>
      </div>

      {/* aligned arrows advancing upward together */}
      {fanAngles.map((a, i) => {
        const appear = spring({ frame: frame - 18 - i * 6, fps, config: { damping: 16, stiffness: 130 } });
        const lift = advance * 150;
        const spread = (i - 2) * 150;
        return (
          <Arrow
            key={i}
            x={cx + spread}
            y={cy - lift}
            angle={a}
            length={230}
            thickness={20}
            color={i % 2 === 0 ? BLUE : GREEN}
            opacity={appear}
          />
        );
      })}

      {/* opinions now feed forward */}
      {opinions.map((txt, i) => {
        const appear = spring({ frame: frame - 44 - i * 10, fps, config: { damping: 16, stiffness: 130 } });
        const pos = [
          { x: 260, y: 640 },
          { x: 820, y: 700 },
          { x: 540, y: 1080 },
        ][i];
        return (
          <Bubble key={i} x={pos.x} y={pos.y - advance * 30} text={txt} opacity={appear} scale={appear} />
        );
      })}

      <div style={{ position: "absolute", right: 50, bottom: 470, opacity: head }}>
        <Mascot width={300} floatAmp={8} />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 150,
          width: "100%",
          textAlign: "center",
          opacity: advance,
          transform: `translateY(${(1 - advance) * 20}px)`,
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: INK_SOFT }}>
          다른 의견이 더해지면
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 80, color: GREEN, marginTop: 8 }}>
          더 멀리 나아간다
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Outro
// ---------------------------------------------------------------------------
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t1 = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 110 } });
  const t2 = spring({ frame: frame - 22, fps, config: { damping: 18, stiffness: 110 } });
  return (
    <AbsoluteFill>
      <Background tint="#E7F0FB" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 84,
            lineHeight: 1.3,
            color: INK,
            opacity: t1,
            transform: `translateY(${(1 - t1) * 28}px)`,
          }}
        >
          <span style={{ color: BLUE }}>방향</span>은 하나로,
          <br />
          <span style={{ color: GREEN }}>의견</span>은 다양하게
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 40,
            color: INK_SOFT,
            opacity: t2,
          }}
        >
          같은 곳을 바라볼 때, 다름은 힘이 된다
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 80 }}>
        <Mascot width={520} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// helper: blend two hex colors
// ---------------------------------------------------------------------------
function interpolateColor(t: number, a: string, b: string): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// ---------------------------------------------------------------------------
// Scene transition wrapper (fade in/out at edges)
// ---------------------------------------------------------------------------
const Fade: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const CardNews: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#EAF1FA" }}>
      <FontLoader />
      <Sequence from={0} durationInFrames={120}>
        <Fade durationInFrames={120}>
          <TitleScene />
        </Fade>
      </Sequence>
      <Sequence from={120} durationInFrames={250}>
        <Fade durationInFrames={250}>
          <ProblemScene />
        </Fade>
      </Sequence>
      <Sequence from={370} durationInFrames={230}>
        <Fade durationInFrames={230}>
          <SolutionScene />
        </Fade>
      </Sequence>
      <Sequence from={600} durationInFrames={120}>
        <Fade durationInFrames={120}>
          <OutroScene />
        </Fade>
      </Sequence>
    </AbsoluteFill>
  );
};
