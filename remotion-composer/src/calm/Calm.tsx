import "@fontsource/nanum-myeongjo/700.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/jetbrains-mono/400.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  CAPTIONS, CARD, CY, END_LINES, EYES, KNOT, MINI, MINI_LABELS, P, PHOTOS, REASONS, SMILE, STRAIGHT, V, WAVE,
  io, lerpPts, toD,
} from "./timeline";

const W = 1080, H = 1920;
const INK = "#E4ECFF", GLOW = "#5B8CFF", TEXT = "#FFFFFF";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const POS: Record<string, string> = { sunrise: "62% 40%", think: "50% 28%", breathe: "50% 30%", smile: "50% 34%", coffee: "50% 40%" };
const k = (f: number, a: number, b: number) => io((f - a) / (b - a));

// which motif is on screen, how much of it is drawn, and how visible
const motif = (f: number): { pts: P[]; frac: number; op: number } => {
  if (f < V.c1.num) {
    return { pts: STRAIGHT, frac: k(f, 8, 40), op: interpolate(f, [V.c1.num - 8, V.c1.num], [1, 0], clamp) };
  }
  if (f < V.c2.num) {
    return { pts: WAVE, frac: interpolate(f, [V.c1.title[0], V.c1.reason[1]], [0, 1], clamp), op: 1 };
  }
  if (f < V.c3.num) {
    // calm wave -> straight -> tie a knot -> let it go
    if (f < V.c2.title[0]) return { pts: lerpPts(WAVE, STRAIGHT, k(f, V.c2.num, V.c2.num + 14)), frac: 1, op: 1 };
    if (f < V.c2.release[0]) return { pts: lerpPts(STRAIGHT, KNOT, k(f, V.c2.title[0], V.c2.title[1])), frac: 1, op: 1 };
    return { pts: lerpPts(KNOT, STRAIGHT, k(f, V.c2.release[0], V.c2.release[1])), frac: 1, op: 1 };
  }
  if (f < V.end[0] - 4) {
    return { pts: lerpPts(STRAIGHT, SMILE, k(f, V.c3.title[0], V.c3.title[0] + 45)), frac: 1, op: 1 };
  }
  return { pts: SMILE, frac: 1, op: interpolate(f, [V.end[0] - 4, V.end[0] + 6], [1, 0], clamp) };
};

export const Calm: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 60px "Nanum Myeongjo"', END_LINES.join("")),
      document.fonts.load('700 60px "Noto Sans KR"', CAPTIONS.flatMap((c) => c.lines).join("") + END_LINES.join("")),
      document.fonts.load('400 40px "Noto Sans KR"', REASONS.map((r) => r.text).join("") + MINI_LABELS.join("") + "침묵용서미소결론"),
      document.fonts.load('400 24px "JetBrains Mono"', "THREE RESPONSES 0123·"),
    ]).then(() => continueRender(handle));
  }, [handle]);

  const m = motif(f);
  const nDraw = Math.max(2, Math.round(m.pts.length * m.frac));
  const shown = m.frac > 0 ? m.pts.slice(0, nDraw) : [];
  const head = shown.length ? shown[shown.length - 1] : null;
  const endDim = interpolate(f, [V.card, V.card + 16], [0, 1], clamp);
  const silent = f >= V.c1.silence[0] && f < V.c1.silence[1] + 6;
  const tipOp = (silent ? 0.25 : 1) * m.op * (1 - endDim);
  const cardIn = interpolate(f, [0, 16], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0E1C" }}>
      {/* background: current photo, big, blurred, dimmed */}
      <AbsoluteFill style={{ transform: `scale(${1.25 + 0.05 * (f / 1200)})`, filter: `blur(38px) brightness(${0.42 - 0.12 * endDim}) saturate(1.1)` }}>
        {PHOTOS.map(([pf, key, fade], i) => {
          const next = PHOTOS[i + 1];
          if (f < pf || (next && f >= next[0] + next[2])) return null;
          const op = fade ? interpolate(f, [pf, pf + fade], [0, 1], clamp) : 1;
          return <Img key={i} src={staticFile(`calm/${key}.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: POS[key], opacity: op }} />;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,10,24,0.6) 0%, rgba(8,10,24,0.1) 22%, rgba(8,10,24,0.1) 60%, rgba(8,10,24,0.6) 100%)" }} />

      {/* photo card */}
      <div style={{ position: "absolute", left: CARD.x - 12, top: CARD.y - 12, width: CARD.w + 24, height: CARD.h + 24, borderRadius: CARD.r + 10,
        background: "#fff", boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 4px 14px rgba(0,0,0,0.3)",
        transform: `scale(${(0.94 + 0.06 * cardIn) * (1 - 0.04 * endDim)})`, opacity: cardIn * (1 - 0.85 * endDim) }}>
        <div style={{ position: "absolute", left: 12, top: 12, width: CARD.w, height: CARD.h, borderRadius: CARD.r, overflow: "hidden", background: "#222" }}>
          {PHOTOS.map(([pf, key, fade], i) => {
            const next = PHOTOS[i + 1];
            if (f < pf || (next && f >= next[0] + next[2])) return null;
            const op = fade ? interpolate(f, [pf, pf + fade], [0, 1], clamp) : 1;
            return <Img key={i} src={staticFile(`calm/${key}.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: POS[key], opacity: op,
              transform: `scale(${1.02 + 0.03 * ((f - pf) / 300)})` }} />;
          })}
        </div>
      </div>

      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="blur" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation={10} /></filter>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={3} /></filter>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.4" /></filter>
        </defs>

        {/* motif line */}
        {shown.length > 1 && (
          <g opacity={m.op * (1 - endDim)}>
            <path d={toD(shown)} fill="none" stroke={GLOW} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} filter="url(#soft)" />
            <path d={toD(shown)} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {/* intro dots: three responses */}
        {[390, 540, 690].map((x, i) => {
          const a = 44 + i * 10;
          const s = interpolate(f, [a, a + 5, a + 10], [0, 1.4, 1], clamp) * interpolate(f, [V.c1.num - 8, V.c1.num], [1, 0], clamp);
          return s > 0 ? <circle key={i} cx={x} cy={CY} r={14 * s} fill={INK} filter="url(#shadow)" /> : null;
        })}
        {/* smile eyes */}
        {EYES.map(([x, y], i) => {
          const a = V.c3.title[1] - 4 + i * 6;
          const s = interpolate(f, [a, a + 5, a + 10], [0, 1.4, 1], clamp) * interpolate(f, [V.end[0] - 4, V.end[0] + 6], [1, 0], clamp);
          return s > 0 ? <circle key={i} cx={x} cy={y} r={13 * s} fill={INK} /> : null;
        })}
        {/* conclusion mini symbols */}
        {MINI.map((pts, i) => {
          const a = V.end[i];
          const frac = k(f, a, a + 22);
          if (frac <= 0) return null;
          const sh = pts.slice(0, Math.max(2, Math.round(pts.length * frac)));
          const lab = interpolate(f, [a + 6, a + 16], [0, 1], clamp);
          return (
            <g key={i} opacity={1 - endDim}>
              <path d={toD(sh)} fill="none" stroke={GLOW} strokeWidth={10} strokeLinecap="round" opacity={0.45} filter="url(#soft)" />
              <path d={toD(sh)} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              <text x={pts[60][0]} y={CY + 80} textAnchor="middle" fontFamily="Noto Sans KR" fontSize={30} fill={TEXT} opacity={lab} filter="url(#shadow)">{MINI_LABELS[i]}</text>
            </g>
          );
        })}
        {/* pen tip */}
        {head && tipOp > 0.01 && (
          <g opacity={tipOp}>
            <circle cx={head[0]} cy={head[1]} r={24} fill={GLOW} filter="url(#blur)" opacity={0.95} />
            <circle cx={head[0]} cy={head[1]} r={8.5} fill={INK} />
          </g>
        )}

        {/* top captions */}
        {CAPTIONS.map((c, i) => {
          const op = interpolate(f, [c.f0, c.f0 + 8, c.f1 - 6, c.f1], [0, 1, 1, 0], clamp);
          if (op <= 0) return null;
          const dy = interpolate(f, [c.f0, c.f0 + 12], [12, 0], clamp);
          return (
            <g key={i} opacity={op} transform={`translate(0 ${dy})`} filter="url(#shadow)">
              <text x={90} y={150} fontFamily="JetBrains Mono, Noto Sans KR" fontSize={26} letterSpacing={6} fill={TEXT} opacity={0.75}>{c.kicker}</text>
              {c.lines.map((l, j) => (
                <text key={j} x={90} y={228 + j * 76} fontFamily="Noto Sans KR" fontWeight={700} fontSize={64} fill={TEXT}>{l}</text>
              ))}
            </g>
          );
        })}
        {/* conclusion lines at the top, one per spoken phrase */}
        {f >= V.end[0] && f < V.card + 4 && END_LINES.map((l, j) => {
          const a = V.end[j];
          const op = interpolate(f, [a, a + 10], [0, 1], clamp) * interpolate(f, [V.card - 6, V.card + 4], [1, 0], clamp);
          return (
            <text key={j} x={90} y={176 + j * 70} fontFamily="Noto Sans KR" fontWeight={700} fontSize={50} fill={TEXT} opacity={op} filter="url(#shadow)"
              transform={`translate(0 ${interpolate(f, [a, a + 12], [10, 0], clamp)})`}>{l}</text>
          );
        })}
        {/* reason line under the card */}
        {REASONS.map((r, i) => {
          const op = interpolate(f, [r.f0, r.f0 + 10, r.f1 - 6, r.f1], [0, 1, 1, 0], clamp);
          return op <= 0 ? null : (
            <text key={i} x={540} y={1268} textAnchor="middle" fontFamily="Noto Sans KR" fontSize={i === 2 ? 34 : 38} fill={TEXT} opacity={op * 0.95} filter="url(#shadow)">{r.text}</text>
          );
        })}

        {/* end card */}
        {endDim > 0 && (
          <g fontFamily="Nanum Myeongjo" fontWeight={700} fill={TEXT} textAnchor="middle" filter="url(#shadow)">
            {END_LINES.map((l, j) => (
              <text key={j} x={540} y={860 + j * 100} fontSize={58} opacity={interpolate(f, [V.card + 4 + j * 6, V.card + 16 + j * 6], [0, 1], clamp)}>{l}</text>
            ))}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
