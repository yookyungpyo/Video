import "@fontsource/nanum-myeongjo/700.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import {
  BEATS, BeatName, CAPTION_TEXT, FOCUS, GHOST, ICON_POLYS, MAIN, TAGLINE, TAGLINE_LINES, TITLE,
  X_END, X_J1, X_J2, Y2, Y3, timeline,
} from "./geometry";

const PALETTES = {
  paper: { PAPER: "#F2EFE9", GRID: "#D9D4CA", INK: "#3557D6", GLOW: "#9FB4FF", TEXT: "#3557D6" },
  photo: { PAPER: "#111", GRID: "rgba(255,255,255,0.07)", INK: "#E4ECFF", GLOW: "#5B8CFF", TEXT: "#FFFFFF" },
};
export type StepGrowthProps = {
  variant?: "paper" | "photo";
  layout?: "landscape" | "portrait";
  beat?: BeatName;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

export const StepGrowth: React.FC<StepGrowthProps> = ({ variant = "paper", layout = "landscape", beat = "short" }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const { PAPER, GRID, INK, GLOW, TEXT } = PALETTES[variant];
  const photo = variant === "photo";
  const portrait = layout === "portrait";
  const tl = useMemo(() => timeline(BEATS[beat]), [beat]);
  const b = tl.b;
  const focus = FOCUS[layout];

  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 130px "Nanum Myeongjo"', TITLE),
      document.fonts.load('400 36px "Noto Sans KR"', TAGLINE + CAPTION_TEXT.join("")),
      document.fonts.load('500 36px "Noto Sans KR"', CAPTION_TEXT.join("")),
    ]).then(() => continueRender(handle));
  }, [handle]);

  // camera
  let cx = 0, cy = 0, z = 1;
  {
    const cam = b.cam;
    let done = false;
    for (let i = 0; i < cam.length - 1 && !done; i++) {
      const [fa, na] = cam[i], [fb, nb] = cam[i + 1];
      if (f <= fb) {
        const t = ease((f - fa) / (fb - fa));
        const A = focus[na], B = focus[nb];
        cx = A.c[0] + (B.c[0] - A.c[0]) * t; cy = A.c[1] + (B.c[1] - A.c[1]) * t; z = A.z + (B.z - A.z) * t;
        done = true;
      }
    }
    if (!done) { const L = focus[cam[cam.length - 1][1]]; cx = L.c[0]; cy = L.c[1]; z = L.z; }
  }
  let shake = 0;
  for (const s of tl.shakes) { const t = f - s; if (t >= 0 && t < 24) shake += 16 * Math.exp(-t / 5) * Math.sin(t * 1.6); }
  cy -= shake / z;
  // screen anchor: portrait keeps the line in the lower-middle, under the face
  const ax = W / 2, ay = portrait ? H * 0.58 : H / 2;

  const len = tl.mainLen(f);
  const [hx, hy] = MAIN.at(len);
  const gl = tl.ghostLen(f);
  const [gx, gy] = GHOST.at(gl);

  const land = interpolate(f, [b.pop - 3, b.pop + 3, b.pop + 9], [0, 1.4, 1], clamp);
  const drawing = Math.abs(tl.mainLen(f + 1) - len) > 0.3;
  const wait = (a: number, c: number) => interpolate(f, [a, c], [0, 1], clamp) * (f < c ? 1 : 0);
  const antic = Math.max(wait(b.plateau1[1], b.jump1[0]), wait(b.plateau2[1], b.jump2[0]));
  let burst = 0;
  for (const s of tl.shakes) { const t = f - s; if (t >= 0) burst += Math.exp(-t / 8); }
  const glowR = (drawing ? 26 : 22 * (1 + 0.1 * Math.sin(f / 4))) * land + antic * 18 + burst * 60;

  const ghostOp = interpolate(f, [0, b.ghost[1] + 12, b.ghost[1] + 32, b.zoomOut[0], b.zoomOut[1]], [0.85, 0.85, 0.28, 0.28, 0.7], clamp);
  const endDim = interpolate(f, b.endFade, [0, 1], clamp);
  const sceneOp = 1 - endDim * (photo ? 0.8 : 0.87);
  const titleOp = interpolate(f, [b.title[0], b.title[0] + 12], [0, 1], clamp);
  const titleY = interpolate(f, [b.title[0], b.title[0] + 18], [18, 0], clamp);
  const ul = ease((f - b.title[0] - 6) / (b.title[1] - b.title[0]));
  const typed = Math.max(0, Math.min(TAGLINE.length, Math.floor((f - b.tag0) / b.tagStep) + 1));
  const corners: [number, number][] = [[X_J1, Y2], [X_J2, Y3], [X_END, Y3]];

  // caption geometry
  const capX = portrait ? 90 : 130, capY = portrait ? 330 : 170, capSize = portrait ? 62 : 44;
  const titleSize = portrait ? 118 : 132, titleCY = portrait ? H * 0.46 : 520;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      {photo && (
        <AbsoluteFill style={{ transform: `scale(${1.04 + 0.06 * (f / b.duration)})`, filter: `blur(${endDim * 6}px)` }}>
          {b.photos.map(([pf, src, fade], i) => {
            const next = b.photos[i + 1];
            if (f < pf || (next && f >= next[0] + next[2])) return null;
            const op = fade ? interpolate(f, [pf, pf + fade], [0, 1], clamp) : 1;
            return (
              <Img key={i} src={staticFile(`stepgrowth-photo/${src}.jpg`)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                  objectPosition: portrait ? "44% 50%" : "50% 50%", opacity: op,
                  filter: `brightness(${0.62 - 0.3 * endDim}) saturate(0.55) contrast(1.08)` }} />
            );
          })}
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,14,30,0.6) 0%, rgba(10,14,30,0.12) 32%, rgba(10,14,30,0.2) 70%, rgba(10,14,30,0.55) 100%)" }} />
        </AbsoluteFill>
      )}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
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

        <g transform={`translate(${ax} ${ay}) scale(${z}) translate(${-cx} ${-cy})`}>
          <rect x={-2500} y={-2500} width={7000} height={6000} fill="url(#grid)" />
          <g opacity={sceneOp}>
            <g opacity={ghostOp} mask="url(#ghostMask)">
              <path d={GHOST.d} stroke={INK} strokeWidth={3.5} fill="none" strokeDasharray="16 14" strokeLinecap="round" />
            </g>
            {f >= b.ghost[0] && f <= b.ghost[1] + 6 && (
              <circle cx={gx} cy={gy} r={9} fill={GLOW} opacity={0.8 * interpolate(f, [b.ghost[1], b.ghost[1] + 6], [1, 0], clamp)} />
            )}
            {ICON_POLYS.map((poly, i) => {
              const l = tl.iconLen(i, f);
              return l <= 0 ? null : (
                <path key={i} d={poly.d} fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={`${poly.total} ${poly.total * 2}`} strokeDashoffset={poly.total - l} opacity={0.75} />
              );
            })}
            <path d={MAIN.d} fill="none" stroke={GLOW} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={`${MAIN.total} ${MAIN.total * 2}`} strokeDashoffset={MAIN.total - len} opacity={0.35} filter="url(#soft)" />
            <path d={MAIN.d} fill="none" stroke={INK} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={`${MAIN.total} ${MAIN.total * 2}`} strokeDashoffset={MAIN.total - len} />
            {corners.map(([x, y], i) => {
              const s = interpolate(f, [b.zoomOut[0] + 14 + i * 8, b.zoomOut[0] + 22 + i * 8], [0, 1], clamp);
              return s <= 0 ? null : <circle key={i} cx={x} cy={y} r={10 * s / Math.min(1, z)} fill="none" stroke={INK} strokeWidth={3 / Math.min(1, z)} opacity={0.8} />;
            })}
            {land > 0 && (
              <g>
                <circle cx={hx} cy={hy} r={glowR} fill={GLOW} filter="url(#blur)" opacity={0.95} />
                <circle cx={hx} cy={hy} r={8 * land} fill={INK} />
                <circle cx={hx - 2} cy={hy - 2} r={2.5 * land} fill="#fff" opacity={0.7} />
              </g>
            )}
          </g>
        </g>

        {b.captions.map(([c0, c1], i) => {
          const op = interpolate(f, [c0, c0 + 8, c1 - 8, c1], [0, 1, 1, 0], clamp);
          if (op <= 0) return null;
          const dy = interpolate(f, [c0, c0 + 12], [10, 0], clamp);
          return (
            <g key={i} opacity={op} transform={`translate(0 ${dy})`} style={photo ? { filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))" } : undefined}>
              <text x={capX} y={capY - capSize * 1.15} fontFamily="Noto Sans KR" fontWeight={400} fontSize={capSize * 0.45} letterSpacing={6} fill={TEXT} opacity={0.6}>
                {String(i + 1).padStart(2, "0")} / 06
              </text>
              <text x={capX} y={capY} fontFamily="Noto Sans KR" fontWeight={500} fontSize={capSize} letterSpacing={3} fill={TEXT}>{CAPTION_TEXT[i]}</text>
            </g>
          );
        })}

        {f >= b.title[0] && (
          <g style={photo ? { filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.5))" } : undefined}>
            <text x={W / 2} y={titleCY + titleY} textAnchor="middle" fontFamily="Nanum Myeongjo" fontWeight={700} fontSize={titleSize} fill={TEXT} opacity={titleOp}>
              {TITLE}
            </text>
            <line x1={W / 2 - (portrait ? 400 : 360) * ul} y1={titleCY + 70} x2={W / 2 + (portrait ? 400 : 360) * ul} y2={titleCY + 70} stroke={TEXT} strokeWidth={4} strokeLinecap="round" />
            {portrait ? (
              (() => {
                const n0 = TAGLINE_LINES[0].length + 1;
                const l0 = TAGLINE_LINES[0].slice(0, Math.min(typed, TAGLINE_LINES[0].length));
                const l1 = TAGLINE_LINES[1].slice(0, Math.max(0, typed - n0));
                const cur = f < b.cap && Math.floor(f / 8) % 2 === 0 ? "▍" : "";
                return (
                  <g fontFamily="Noto Sans KR" fontWeight={400} fontSize={48} letterSpacing={4} fill={TEXT} opacity={0.92} textAnchor="middle">
                    <text x={W / 2} y={titleCY + 170}>{l0}{typed < n0 ? cur : ""}</text>
                    <text x={W / 2} y={titleCY + 245}>{l1}{typed >= n0 ? cur : ""}</text>
                  </g>
                );
              })()
            ) : (
              <text x={W / 2} y={titleCY + 152} textAnchor="middle" fontFamily="Noto Sans KR" fontWeight={400} fontSize={34} letterSpacing={5} fill={TEXT} opacity={0.9}>
                {TAGLINE.slice(0, typed)}
                <tspan opacity={f < b.cap && Math.floor(f / 8) % 2 === 0 ? 1 : 0}>▍</tspan>
              </text>
            )}
          </g>
        )}
        {photo && burst > 0.02 && <rect width={W} height={H} fill="#fff" opacity={Math.min(0.45, burst * 0.45)} />}
        {!photo && <rect width={W} height={H} fill="url(#vig)" />}
      </svg>
    </AbsoluteFill>
  );
};
