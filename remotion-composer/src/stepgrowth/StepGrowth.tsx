import "@fontsource/nanum-myeongjo/700.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import {
  CAM, CAPTIONS, GHOST, ICONS, MAIN, S, SHAKES, T, TAGLINE, TITLE,
  X_END, X_J1, X_J2, Y1, Y2, Y3, ghostLen, iconLen, mainLen,
} from "./geometry";

const PAPER = "#F2EFE9", GRID = "#D9D4CA", INK = "#3557D6", GLOW = "#9FB4FF";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
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

export const StepGrowth: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 130px "Nanum Myeongjo"', "성장은 계단이다"),
      document.fonts.load('400 36px "Noto Sans KR"', "우리가 기대하는 성장 평평한 지금이"),
      document.fonts.load('500 36px "Noto Sans KR"', "될 것 같은데 안 된다"),
    ]).then(() => continueRender(handle));
  }, [handle]);

  let { cx, cy, z } = camera(f);
  // jump shake: vertical bounce after each jump lands
  let shake = 0;
  for (const s of SHAKES) { const t = f - s; if (t >= 0 && t < 24) shake += 16 * Math.exp(-t / 5) * Math.sin(t * 1.6); }
  cy -= shake / z;

  const len = mainLen(f);
  const [hx, hy] = MAIN.at(len);
  const gl = ghostLen(f);
  const [gx, gy] = GHOST.at(gl);

  const land = interpolate(f, [T.pop - 4, T.pop + 3, T.pop + 9], [0, 1.4, 1], clamp);
  const drawing = Math.abs(mainLen(f + 1) - len) > 0.3;
  // anticipation before each jump: glow swells while the pen waits
  const wait = (a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp) * (f < b ? 1 : 0);
  const antic = Math.max(wait(T.plateau1[1], T.jump1[0]), wait(T.plateau2[1], T.jump2[0]));
  let burst = 0;
  for (const s of SHAKES) { const t = f - s; if (t >= 0) burst += Math.exp(-t / 8); }
  const glowR = (drawing ? 26 : 22 * (1 + 0.1 * Math.sin(f / 4))) * land + antic * 18 + burst * 60;

  const ghostOp = interpolate(f, [0, 90, 110, T.zoomOut[0], T.zoomOut[1]], [0.85, 0.85, 0.28, 0.28, 0.7], clamp);
  const sceneOp = interpolate(f, T.endFade, [1, 0.13], clamp);
  const titleOp = interpolate(f, [T.title[0], T.title[0] + 12], [0, 1], clamp);
  const titleY = interpolate(f, [T.title[0], T.title[0] + 18], [18, 0], clamp);
  const ul = ease((f - T.title[0] - 6) / (T.title[1] - T.title[0]));
  const typed = Math.max(0, Math.min(TAGLINE.length, Math.floor((f - T.tag0) / T.tagStep) + 1));

  // stair corner markers on zoom-out
  const corners: [number, number][] = [[X_J1, Y2], [X_J2, Y3], [X_END, Y3]];

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <pattern id="grid" width={36} height={36} patternUnits="userSpaceOnUse">
            <path d="M36 0 H0 V36" fill="none" stroke={GRID} strokeWidth={1.1} />
          </pattern>
          <filter id="blur" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation={10} /></filter>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={3} /></filter>
          <mask id="ghostMask" maskUnits="userSpaceOnUse" x={-500} y={-500} width={3000} height={2000}>
            <path d={GHOST.d} stroke="#fff" strokeWidth={12} fill="none" strokeDasharray={`${GHOST.total} ${GHOST.total * 2}`} strokeDashoffset={GHOST.total - gl} />
          </mask>
          <radialGradient id="vig" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#3b3326" stopOpacity={0.07} />
          </radialGradient>
        </defs>

        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          <rect x={-1500} y={-1500} width={5000} height={4000} fill="url(#grid)" />
          <g opacity={sceneOp}>
            {/* expectation ramp */}
            <g opacity={ghostOp} mask="url(#ghostMask)">
              <path d={GHOST.d} stroke={INK} strokeWidth={3.5} fill="none" strokeDasharray="16 14" strokeLinecap="round" />
            </g>
            {f >= T.ghost[0] && f <= T.ghost[1] + 6 && (
              <circle cx={gx} cy={gy} r={9} fill={GLOW} opacity={0.8 * interpolate(f, [T.ghost[1], T.ghost[1] + 6], [1, 0], clamp)} />
            )}

            {/* icons */}
            {ICONS.map((ic, i) => {
              const l = iconLen(i, f);
              return l <= 0 ? null : (
                <path key={i} d={ic.poly.d} fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={`${ic.poly.total} ${ic.poly.total * 2}`} strokeDashoffset={ic.poly.total - l} opacity={0.75} />
              );
            })}

            {/* the staircase line */}
            <path d={MAIN.d} fill="none" stroke={GLOW} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={`${MAIN.total} ${MAIN.total * 2}`} strokeDashoffset={MAIN.total - len} opacity={0.35} filter="url(#soft)" />
            <path d={MAIN.d} fill="none" stroke={INK} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={`${MAIN.total} ${MAIN.total * 2}`} strokeDashoffset={MAIN.total - len} />

            {/* corner ticks on zoom-out */}
            {corners.map(([x, y], i) => {
              const s = interpolate(f, [T.zoomOut[0] + 14 + i * 8, T.zoomOut[0] + 22 + i * 8], [0, 1], clamp);
              return s <= 0 ? null : <circle key={i} cx={x} cy={y} r={10 * s} fill="none" stroke={INK} strokeWidth={3} opacity={0.8} />;
            })}

            {/* pen tip */}
            {land > 0 && (
              <g>
                <circle cx={hx} cy={hy} r={glowR} fill={GLOW} filter="url(#blur)" opacity={0.95} />
                <circle cx={hx} cy={hy} r={8 * land} fill={INK} />
                <circle cx={hx - 2} cy={hy - 2} r={2.5 * land} fill="#fff" opacity={0.7} />
              </g>
            )}
          </g>
        </g>

        {/* captions (screen space) */}
        {CAPTIONS.map((c, i) => {
          const op = interpolate(f, [c.f0, c.f0 + 8, c.f1 - 8, c.f1], [0, 1, 1, 0], clamp);
          if (op <= 0) return null;
          const dy = interpolate(f, [c.f0, c.f0 + 12], [10, 0], clamp);
          return (
            <g key={i} opacity={op} transform={`translate(0 ${dy})`}>
              <text x={130} y={118} fontFamily="Noto Sans KR" fontWeight={400} fontSize={20} letterSpacing={6} fill={INK} opacity={0.6}>
                {String(i + 1).padStart(2, "0")} / 06
              </text>
              <text x={130} y={170} fontFamily="Noto Sans KR" fontWeight={500} fontSize={44} letterSpacing={3} fill={INK}>{c.text}</text>
            </g>
          );
        })}

        {/* end card */}
        {f >= T.title[0] && (
          <g>
            <text x={960} y={520 + titleY} textAnchor="middle" fontFamily="Nanum Myeongjo" fontWeight={700} fontSize={132} fill={INK} opacity={titleOp}>
              {TITLE}
            </text>
            <line x1={960 - 360 * ul} y1={590} x2={960 + 360 * ul} y2={590} stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <text x={960} y={672} textAnchor="middle" fontFamily="Noto Sans KR" fontWeight={400} fontSize={34} letterSpacing={5} fill={INK} opacity={0.9}>
              {TAGLINE.slice(0, typed)}
              <tspan opacity={f < T.cap && Math.floor(f / 8) % 2 === 0 ? 1 : 0}>▍</tspan>
            </text>
          </g>
        )}
        <rect width={1920} height={1080} fill="url(#vig)" />
      </svg>
    </AbsoluteFill>
  );
};
