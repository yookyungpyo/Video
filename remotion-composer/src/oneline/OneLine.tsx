import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import {
  CAM, CHART_BASE_Y, EVENTS, PATH_D, TAGLINE, TAG_F0, TAG_STEP, TICKS_X, TOTAL, UL,
  BULB_GLOBE, drawnLength, pointAt,
} from "./geometry";

const PAPER = "#F2EFE9", GRID = "#D9D4CA", INK = "#3557D6", GLOW = "#9FB4FF";
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

const camera = (f: number) => {
  for (let i = 0; i < CAM.length - 1; i++) {
    const a = CAM[i], b = CAM[i + 1];
    if (f <= b.f) {
      const t = ease((f - a.f) / (b.f - a.f));
      return { cx: a.c[0] + (b.c[0] - a.c[0]) * t, cy: a.c[1] + (b.c[1] - a.c[1]) * t, z: a.z + (b.z - a.z) * t };
    }
  }
  const l = CAM[CAM.length - 1];
  return { cx: l.c[0], cy: l.c[1], z: l.z };
};

export const OneLine: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('italic 200px "Instrument Serif"'),
      document.fonts.load('30px "JetBrains Mono"'),
    ]).then(() => continueRender(handle));
  }, [handle]);

  const { cx, cy, z } = camera(f);
  const len = drawnLength(f);
  const [hx, hy] = pointAt(len);

  // pen tip: lands at frame ~10 with an overshoot pop
  const land = interpolate(f, [4, 10, 16], [0, 1.35, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const moving = Math.abs(drawnLength(f + 1) - len) > 0.5;
  const pulse = 1 + 0.12 * Math.sin(f / 4);
  const glowR = (moving ? 30 : 24 * pulse) * land;

  // chart axis + ticks
  const axisOp = interpolate(f, [150, 165, 330, 345], [0, 0.45, 0.45, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // ding flash around bulb globe
  const dingT = f - EVENTS.ding;
  const ding = dingT >= 0 ? Math.exp(-dingT / 9) : 0;

  // end card
  const revealW = Math.max(0, hx - UL.start[0]);
  const typed = Math.max(0, Math.min(TAGLINE.length, Math.floor((f - TAG_F0) / TAG_STEP) + 1));
  const cursorOn = f >= TAG_F0 - 6 && Math.floor(f / 8) % 2 === 0;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <pattern id="grid" width={36} height={36} patternUnits="userSpaceOnUse">
            <path d="M36 0 H0 V36" fill="none" stroke={GRID} strokeWidth={1.2} />
          </pattern>
          <filter id="blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <radialGradient id="flash">
            <stop offset="0%" stopColor={GLOW} stopOpacity={0.55} />
            <stop offset="100%" stopColor={GLOW} stopOpacity={0} />
          </radialGradient>
          <clipPath id="reveal">
            <rect x={UL.start[0] - 40} y={300} width={revealW + 40} height={420} />
          </clipPath>
          <radialGradient id="vig" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#3b3326" stopOpacity={0.07} />
          </radialGradient>
        </defs>

        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          <rect x={-2000} y={-2000} width={14000} height={5000} fill="url(#grid)" />

          {/* chart axis */}
          <g opacity={axisOp}>
            <line x1={2200} y1={CHART_BASE_Y} x2={3900} y2={CHART_BASE_Y} stroke={INK} strokeWidth={2} />
          </g>
          {TICKS_X.map((x, i) => {
            const s = interpolate(f, [EVENTS.ticks[i], EVENTS.ticks[i] + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return s <= 0 ? null : <line key={i} x1={x} y1={CHART_BASE_Y} x2={x} y2={CHART_BASE_Y + 22 * s} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.8} />;
          })}

          {/* bulb flash */}
          {ding > 0.01 && (
            <circle cx={BULB_GLOBE.c[0]} cy={BULB_GLOBE.c[1]} r={BULB_GLOBE.r * (1.4 + 0.5 * (1 - ding))} fill="url(#flash)" opacity={ding} />
          )}

          {/* the one line: soft halo + crisp ink */}
          <path d={PATH_D} fill="none" stroke={GLOW} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={TOTAL} strokeDashoffset={TOTAL - len} opacity={0.35} filter="url(#soft)" />
          <path d={PATH_D} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={TOTAL} strokeDashoffset={TOTAL - len} />

          {/* end card */}
          <g clipPath="url(#reveal)">
            <text x={9000} y={600} textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize={230} fill={INK}>
              one line
            </text>
          </g>
          <text x={9000} y={800} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} letterSpacing={14} fill={INK} opacity={0.9}>
            {TAGLINE.slice(0, typed)}
            <tspan opacity={cursorOn && typed < TAGLINE.length + 1 ? 1 : 0}>▍</tspan>
          </text>

          {/* pen tip */}
          {land > 0 && (
            <g>
              <circle cx={hx} cy={hy} r={glowR} fill={GLOW} filter="url(#blur)" opacity={0.95} />
              <circle cx={hx} cy={hy} r={8 * land} fill={INK} />
              <circle cx={hx - 2} cy={hy - 2} r={2.5 * land} fill="#fff" opacity={0.7} />
            </g>
          )}
        </g>
        <rect width={1920} height={1080} fill="url(#vig)" />
      </svg>
    </AbsoluteFill>
  );
};
