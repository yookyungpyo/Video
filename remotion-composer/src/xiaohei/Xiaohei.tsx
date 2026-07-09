import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";

// ---------------------------------------------------------------------------
// Xiaohei chalk shorts — hand-drawn chalk-on-black explainer with a small
// ink-cat host. Visual grammar follows the reference: strokes draw themselves
// on, diagrams accumulate, accent colors carry meaning.
// ---------------------------------------------------------------------------
export const HAND = "Gaegu";
export const BODY = "Noto Sans KR";
export const BG = "#0B0B0E";
export const CHALK = "#F2F2EC";
export const MUTED = "#9BA0A8";
export const ORANGE = "#F5A93F";
export const YELLOW = "#E8E45A";
export const PINK = "#E86BD0";
export const GREEN = "#8CE08C";
export const TEAL = "#8FE3D2";

const fontCss = `
@font-face { font-family: '${HAND}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/gaegu-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${HAND}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/gaegu-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${BODY}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
`;

export const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${HAND}"`, "가"),
      (document as any).fonts.load(`700 64px "${HAND}"`, "가"),
      (document as any).fonts.load(`700 64px "${BODY}"`, "가"),
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

// Stop-motion hand-jitter: tiny offset re-rolled every 4 frames (~7fps feel).
const useStep = (seed: number, amp = 1.6) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 4);
  return {
    x: (rand(step, seed) - 0.5) * 2 * amp,
    y: (rand(step, seed + 40) - 0.5) * 2 * amp,
    r: (rand(step, seed + 80) - 0.5) * 1.4,
  };
};

// ---------------------------------------------------------------------------
// Chalk stage — near-black with faint dust/grain and a soft vignette.
// ---------------------------------------------------------------------------
export const ChalkBG: React.FC = () => (
  <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
    <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.05, mixBlendMode: "screen" }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
    <AbsoluteFill
      style={{
        background: "radial-gradient(120% 85% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
      }}
    />
  </AbsoluteFill>
);

// Progress of a draw-on stroke starting at `start`, lasting `dur` frames.
const useDraw = (start: number, dur: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

// SVG path that draws itself on (pathLength=1 normalization trick).
type DrawProps = {
  d: string;
  start: number;
  dur?: number;
  color?: string;
  width?: number;
  fill?: string;
  fillDelay?: number;
};
export const Draw: React.FC<DrawProps> = ({ d, start, dur = 18, color = CHALK, width = 5, fill, fillDelay = 6 }) => {
  const k = useDraw(start, dur);
  const frame = useCurrentFrame();
  const fillOp = fill
    ? interpolate(frame, [start + dur + fillDelay, start + dur + fillDelay + 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  return (
    <path
      d={d}
      pathLength={1}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill ?? "none"}
      fillOpacity={fillOp}
      strokeDasharray={1}
      strokeDashoffset={1 - k}
      opacity={k > 0 ? 1 : 0}
    />
  );
};

// Hand-written text: per-character pop-in, Gaegu, with hand jitter.
export const HandText: React.FC<{
  text: string;
  start: number;
  size: number;
  color?: string;
  weight?: number;
  stagger?: number;
  font?: string;
}> = ({ text, start, size, color = CHALK, weight = 700, stagger = 1.6, font = HAND }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const j = useStep(start, 1.1);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        transform: `translate(${j.x}px, ${j.y}px) rotate(${j.r * 0.4}deg)`,
      }}
    >
      {text.split("").map((ch, i) => {
        const sp = spring({ frame: frame - start - i * stagger, fps, config: { damping: 12, stiffness: 190 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              fontFamily: font,
              fontWeight: weight,
              fontSize: size,
              color,
              opacity: sp,
              transform: `translateY(${(1 - sp) * 26}px) rotate(${(rand(i, 3) - 0.5) * 4}deg)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// Rough hand-drawn ellipse for circling things (like the reference's yellow ring).
export const Scribble: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  start: number;
  color?: string;
  width?: number;
}> = ({ cx, cy, rx, ry, start, color = YELLOW, width = 6 }) => {
  const d = `M ${cx - rx},${cy} C ${cx - rx},${cy - ry * 1.4} ${cx + rx * 0.9},${cy - ry * 1.5} ${cx + rx},${cy - ry * 0.1}
             C ${cx + rx * 1.08},${cy + ry * 1.3} ${cx - rx * 0.8},${cy + ry * 1.45} ${cx - rx * 1.06},${cy + ry * 0.25}
             C ${cx - rx * 1.1},${cy - ry * 0.6} ${cx - rx * 0.2},${cy - ry * 1.2} ${cx + rx * 0.5},${cy - ry * 1.05}`;
  return <Draw d={d} start={start} dur={16} color={color} width={width} />;
};

// ---------------------------------------------------------------------------
// The cat — Xiaohei-inspired original: round ink blob, pointy ears, big teal
// eyes. Draws itself on, then idles (breathe, blink, tail wag).
// viewBox 0 0 220 210, anchor = bottom center.
// ---------------------------------------------------------------------------
export const Cat: React.FC<{
  start: number;
  size?: number;
  flip?: boolean;
  sleeping?: boolean;
  winkAt?: number;
}> = ({ start, size = 230, flip = false, sleeping = false, winkAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const drawn = useDraw(start, 30);
  const inkOp = interpolate(frame, [start + 26, start + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // idle: subtle breathe + tail wag + blink every ~3s
  const breathe = 1 + Math.sin(t * 2.1) * 0.012;
  const wag = Math.sin(t * 2.6) * 10;
  const blinkCycle = (frame - start) % 84;
  const blink = sleeping ? 0.08 : blinkCycle >= 78 && blinkCycle < 84 ? 0.12 : 1;
  const winking = winkAt !== undefined && frame >= winkAt && frame < winkAt + 24;
  const j = useStep(start + 7, 1.2);

  return (
    <div
      style={{
        width: size,
        height: size * (210 / 220),
        transform: `translate(${j.x}px, ${j.y}px) ${flip ? "scaleX(-1)" : ""} scale(${breathe})`,
        transformOrigin: "bottom center",
      }}
    >
      <svg viewBox="0 0 220 210" width="100%" height="100%">
        {/* tail (wags around its base) */}
        <g style={{ transform: `rotate(${wag}deg)`, transformOrigin: "150px 168px" }}>
          <Draw
            d="M150,172 C196,170 208,128 178,116 C166,111 158,120 162,128"
            start={start + 18}
            dur={14}
            width={6}
          />
        </g>
        {/* body blob */}
        <Draw
          d="M76,196 C60,196 62,150 82,132 C70,120 64,96 74,72 C82,52 100,42 112,42 C126,42 142,52 150,72 C158,94 154,118 142,132 C162,150 164,196 148,196 Z"
          start={start}
          dur={26}
          width={5.5}
          fill="#070709"
        />
        {/* ears */}
        <Draw d="M84,58 C80,38 84,22 92,12 C102,24 108,34 110,44" start={start + 8} dur={10} width={5} fill="#070709" />
        <Draw d="M140,58 C144,38 140,22 132,12 C122,24 116,34 114,44" start={start + 11} dur={10} width={5} fill="#070709" />
        {/* face — appears after ink fill */}
        <g opacity={inkOp}>
          {sleeping ? (
            <>
              <path d="M86,92 Q95,100 104,92" stroke={TEAL} strokeWidth={5} fill="none" strokeLinecap="round" />
              <path d="M120,92 Q129,100 138,92" stroke={TEAL} strokeWidth={5} fill="none" strokeLinecap="round" />
            </>
          ) : (
            <g>
              <g style={{ transform: `scaleY(${blink})`, transformOrigin: "95px 92px" }}>
                <ellipse cx="95" cy="92" rx="13" ry="16" fill={TEAL} />
                <ellipse cx="97" cy="94" rx="5.5" ry="9" fill="#0A0A0C" />
                <circle cx="99" cy="87" r="3" fill="#FFFFFF" />
              </g>
              {winking ? (
                <path d="M118,92 Q129,100 140,92" stroke={TEAL} strokeWidth={5} fill="none" strokeLinecap="round" />
              ) : (
                <g style={{ transform: `scaleY(${blink})`, transformOrigin: "129px 92px" }}>
                  <ellipse cx="129" cy="92" rx="13" ry="16" fill={TEAL} />
                  <ellipse cx="127" cy="94" rx="5.5" ry="9" fill="#0A0A0C" />
                  <circle cx="125" cy="87" r="3" fill="#FFFFFF" />
                </g>
              )}
            </g>
          )}
          {/* mouth ω */}
          <path
            d="M104,112 Q108,117 112,112 Q116,117 120,112"
            stroke={CHALK}
            strokeWidth={3.4}
            fill="none"
            strokeLinecap="round"
          />
        </g>
        {/* front paws */}
        <g opacity={drawn >= 1 ? 1 : 0}>
          <path d="M92,196 q6,-10 14,0" stroke={CHALK} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M118,196 q6,-10 14,0" stroke={CHALK} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

// Speech/thought bubble with hand-drawn border.
export const Bubble: React.FC<{
  start: number;
  children: React.ReactNode;
  w?: number;
  color?: string;
}> = ({ start, children, w = 200, color = CHALK }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 160 } });
  const j = useStep(start + 3, 1.4);
  return (
    <div
      style={{
        position: "relative",
        width: w,
        padding: "14px 20px 10px",
        border: `4px solid ${color}`,
        borderRadius: "48% 52% 55% 45% / 58% 48% 52% 42%",
        color,
        textAlign: "center",
        fontFamily: HAND,
        fontWeight: 700,
        transform: `translate(${j.x}px, ${j.y}px) scale(${sp})`,
        opacity: sp,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          bottom: -16,
          left: 34,
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: `18px solid ${color}`,
          transform: "rotate(18deg)",
        }}
      />
    </div>
  );
};

// Bottom caption band (the "narration" replacement).
export const Caption: React.FC<{ text: string; start: number; accent?: string }> = ({
  text,
  start,
  accent = MUTED,
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [start, start + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 128,
        width: "100%",
        textAlign: "center",
        opacity: op,
      }}
    >
      <span
        style={{
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 42,
          color: CHALK,
          background: "rgba(10,10,14,0.72)",
          border: `2px solid ${accent}55`,
          borderRadius: 14,
          padding: "10px 26px",
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 1 — Hook: "또 새로운 용어?" + 2022→2027 timeline, Loop circled.
// ---------------------------------------------------------------------------
const YEARS = ["2022", "2023", "2024", "2025", "2026", "2027"];
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 190, width: "100%" }}>
        <HandText text="또 새로운 용어가 나왔다" start={6} size={72} color={MUTED} />
      </div>
      <div style={{ position: "absolute", top: 285, width: "100%" }}>
        <HandText text="Loop Engineering" start={30} size={112} color={ORANGE} stagger={1.9} />
      </div>

      {/* timeline diagram */}
      <div style={{ position: "absolute", top: 560, left: 0, width: 1080, height: 560 }}>
        <svg viewBox="0 0 1080 560" width="1080" height="560">
          {/* axis */}
          <Draw d="M70,220 L980,220" start={62} dur={22} width={6} />
          <Draw d="M980,220 L950,204 M980,220 L950,236" start={84} dur={8} width={6} />
          {/* ticks */}
          {YEARS.map((_, i) => (
            <Draw key={i} d={`M${130 + i * 150},208 L${130 + i * 150},232`} start={88 + i * 4} dur={6} width={5} />
          ))}
          {/* era brackets */}
          <Draw d="M105,260 L105,282 L310,282 L310,260" start={124} dur={12} color={MUTED} width={5} />
          <Draw d="M330,260 L330,282 L610,282 L610,260" start={138} dur={12} color={MUTED} width={5} />
          <Draw d="M630,260 L630,282 L830,282 L830,260" start={152} dur={12} color={MUTED} width={5} />
        </svg>
        {/* year labels */}
        {YEARS.map((y, i) => (
          <div key={y} style={{ position: "absolute", left: 130 + i * 150 - 50, top: 130, width: 100, textAlign: "center" }}>
            <HandText text={y} start={92 + i * 4} size={40} color={MUTED} stagger={0.9} />
          </div>
        ))}
        {/* era labels */}
        <div style={{ position: "absolute", left: 105, top: 300, width: 205, textAlign: "center" }}>
          <HandText text="Prompt" start={130} size={50} />
        </div>
        <div style={{ position: "absolute", left: 330, top: 300, width: 280, textAlign: "center" }}>
          <HandText text="Context" start={144} size={50} />
        </div>
        <div style={{ position: "absolute", left: 630, top: 300, width: 200, textAlign: "center" }}>
          <HandText text="Harness" start={158} size={50} />
        </div>
        <div style={{ position: "absolute", left: 800, top: 335, width: 260, textAlign: "center" }}>
          <HandText text="Loop!" start={176} size={58} color={YELLOW} />
        </div>
        <svg viewBox="0 0 1080 560" width="1080" height="560" style={{ position: "absolute", left: 0, top: 0 }}>
          <Scribble cx={912} cy={220} rx={68} ry={34} start={172} />
          <Draw d="M900,262 C890,300 900,330 918,352" start={186} dur={10} color={YELLOW} width={5} />
        </svg>
      </div>

      {/* cat, skeptical */}
      <div style={{ position: "absolute", left: 120, bottom: 260 }}>
        <Cat start={10} size={250} />
      </div>
      {frame >= 190 && (
        <div style={{ position: "absolute", left: 330, bottom: 500 }}>
          <Bubble start={190} w={170} color={YELLOW}>
            <span style={{ fontSize: 74 }}>?</span>
          </Bubble>
        </div>
      )}

      <Caption text="유행어일까, 진짜일까?" start={196} accent={YELLOW} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Harness: outer box + context + numbered task list, checks pop.
// ---------------------------------------------------------------------------
export const HarnessScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const checks = [104, 128, 152]; // frames when task 1..3 get checked
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 175, width: "100%" }}>
        <HandText text="3. Harness 엔지니어링" start={4} size={88} color={ORANGE} />
      </div>
      <div style={{ position: "absolute", top: 292, width: "100%" }}>
        <HandText text="긴 작업은 컨텍스트만으론 질식한다" start={22} size={52} color={MUTED} />
      </div>

      {/* diagram — mirrors the reference: the USER sits OUTSIDE the harness;
          the harness wraps the context window AND the task list (tasks live
          outside the context but inside the harness). */}
      <div style={{ position: "absolute", top: 430, left: 0, width: 1080, height: 760 }}>
        <svg viewBox="0 0 1080 760" width="1080" height="760">
          {/* user box — outside the harness */}
          <Draw d="M40,240 L200,236 L204,434 L44,438 Z" start={64} dur={14} color={MUTED} width={5} />
          <Draw d="M122,290 a24,24 0 1,1 0.1,0 M122,314 L122,376 M122,330 L96,354 M122,330 L148,354 M122,376 L104,412 M122,376 L140,412" start={72} dur={18} width={5} />
          {/* prompt arrow crossing INTO the harness */}
          <Draw d="M212,335 L300,335 L287,323 M300,335 L287,347" start={92} dur={10} width={5} />
          {/* harness outer box */}
          <Draw
            d="M250,80 L1030,74 L1034,560 L254,566 Z"
            start={40}
            dur={26}
            color={ORANGE}
            width={6}
          />
          {/* prompt → context inside the harness */}
          <Draw d="M452,335 L486,335 L476,326 M486,335 L476,344" start={100} dur={8} width={4.5} />
          {/* context box + net squiggle + window bar (partially filled) */}
          <Draw d="M500,240 L800,240 L800,430 L500,430 Z" start={104} dur={18} color={PINK} width={5} />
          <Draw
            d="M530,320 L560,290 L590,350 L620,285 L650,350 L680,290 L710,345 L740,300"
            start={120}
            dur={16}
            width={4.5}
          />
          <Draw d="M530,388 L770,388" start={132} dur={10} color={MUTED} width={9} />
          <Draw d="M530,388 L634,388" start={142} dur={12} color={GREEN} width={9} />
          {/* task panel divider — the list is INSIDE the harness */}
          <Draw d="M840,78 L844,562" start={60} dur={12} color={ORANGE} width={5} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Draw key={i} d={`M905,${140 + i * 88} L1005,${140 + i * 88}`} start={82 + i * 5} dur={7} color={MUTED} width={4.5} />
          ))}
          {/* checkmarks */}
          {checks.map((cf, i) => (
            <Draw
              key={`c${i}`}
              d={`M862,${136 + i * 88} l12,14 l22,-28`}
              start={cf}
              dur={8}
              color={GREEN}
              width={7}
            />
          ))}
          {/* highlight ring on current task */}
          {frame >= 96 && (
            <Scribble
              cx={890}
              cy={
                140 +
                Math.min(
                  checks.filter((c) => frame >= c + 14).length,
                  2
                ) * 88
              }
              rx={52}
              ry={30}
              start={96}
              color={ORANGE}
              width={5}
            />
          )}
          {/* "not needed yet" pointer to the unchecked tasks */}
          <Draw d="M950,505 C965,545 950,565 935,585" start={168} dur={10} color={PINK} width={4.5} />
        </svg>
        {/* labels */}
        <div style={{ position: "absolute", left: 250, top: -6, width: 300, textAlign: "left", paddingLeft: 30 }}>
          <HandText text="Harness" start={66} size={48} color={ORANGE} />
        </div>
        <div style={{ position: "absolute", left: 285, top: 268, width: 160, textAlign: "center" }}>
          <HandText text="Prompt" start={96} size={42} />
        </div>
        <div style={{ position: "absolute", left: 500, top: 158, width: 300, textAlign: "center" }}>
          <HandText text="Context" start={112} size={44} color={PINK} />
        </div>
        <div style={{ position: "absolute", left: 840, top: -6, width: 194, textAlign: "center" }}>
          <HandText text="할 일" start={72} size={44} />
        </div>
        {/* task numbers */}
        {[1, 2, 3, 4, 5].map((n, i) => (
          <div key={n} style={{ position: "absolute", left: 852, top: 96 + i * 88, width: 44, textAlign: "center" }}>
            <HandText text={`${n}.`} start={84 + i * 5} size={38} color={MUTED} stagger={0.8} />
          </div>
        ))}
        <div style={{ position: "absolute", left: 760, top: 592, width: 300, textAlign: "center" }}>
          <HandText text="아직 필요 없음!" start={172} size={38} color={PINK} />
        </div>
      </div>

      {/* cat working through the list */}
      <div style={{ position: "absolute", right: 96, bottom: 236 }}>
        <Cat start={50} size={210} flip />
      </div>

      <Caption text="밖에서 컨텍스트를 관리하고, 일을 쪼개 하나씩" start={160} accent={ORANGE} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Crossfade wrapper
// ---------------------------------------------------------------------------
export const Fade: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
// Sample: Hook (225f) + Harness (225f) = 450 frames @30fps = 15s
// ---------------------------------------------------------------------------
export const XiaoheiSample: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <FontLoader />
    <ChalkBG />
    {/* Reels safe-area group */}
    <AbsoluteFill style={{ transform: "translateY(-22px) scale(0.84)", transformOrigin: "center center" }}>
      <Sequence from={0} durationInFrames={225}>
        <Fade durationInFrames={225}>
          <HookScene />
        </Fade>
      </Sequence>
      <Sequence from={225} durationInFrames={225}>
        <Fade durationInFrames={225}>
          <HarnessScene />
        </Fade>
      </Sequence>
    </AbsoluteFill>
  </AbsoluteFill>
);
