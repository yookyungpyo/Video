import "@fontsource/nanum-myeongjo/700.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/900.css";
import "@fontsource/jetbrains-mono/400.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CAPTIONS, CARD, CHART, LINE, PHOTOS, PLACES, RING, T, drawn, levelY, pointAt } from "./timeline";

const PAPER = "#F2EFE9", GRID = "#DDD8CE", INK = "#3557D6", GLOW = "#9FB4FF";
const W = 1080, H = 1920;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const POS: Record<string, string> = { store: "50% 62%", gym: "50% 62%", hotel: "45% 62%", plane: "55% 62%", peak: "25% 50%" };
const won = (n: number) => `${n.toLocaleString("en-US")}원`;

const Photo: React.FC<{ k: string; op: number }> = ({ k, op }) => {
  if (k === "quad") {
    const keys = ["store", "gym", "hotel", "plane"];
    const g = 10, w = (CARD.w - g) / 2, h = (CARD.h - g) / 2;
    return (
      <div style={{ position: "absolute", inset: 0, opacity: op, background: "#fff" }}>
        {keys.map((kk, i) => (
          <div key={kk} style={{ position: "absolute", left: (i % 2) * (w + g), top: Math.floor(i / 2) * (h + g), width: w, height: h, overflow: "hidden" }}>
            <Img src={staticFile(`positioning/${kk}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 60%" }} />
            <div style={{ position: "absolute", left: 14, bottom: 14, padding: "6px 16px", borderRadius: 999, background: "rgba(255,255,255,0.92)",
              fontFamily: "Noto Sans KR", fontWeight: 900, fontSize: 38, color: INK }}>{won(PLACES[i].price)}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <Img src={staticFile(`positioning/${k}.jpg`)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: POS[k], opacity: op }} />
  );
};

export const Positioning: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 80px "Nanum Myeongjo"', "자신을 최적의 위치에 포지셔닝하라"),
      document.fonts.load('700 60px "Noto Sans KR"', CAPTIONS.map((c) => c.text).join("")),
      document.fonts.load('900 60px "Noto Sans KR"', "0123456789,원×"),
      document.fonts.load('400 30px "Noto Sans KR"', "편의점헬스장호텔비행기"),
      document.fonts.load('400 24px "JetBrains Mono"', "SAME WATER YOU"),
    ]).then(() => continueRender(handle));
  }, [handle]);

  const len = drawn(f);
  const [hx, hy] = pointAt(len);
  const moving = Math.abs(drawn(f + 1) - len) > 0.3;
  const land = interpolate(f, [2, 8, 14], [0, 1.4, 1], clamp);
  const glowR = (moving ? 26 : 20 * (1 + 0.1 * Math.sin(f / 4))) * land;

  // card entrance + slight breathing
  const cardIn = interpolate(f, [0, 14], [0, 1], clamp);
  const cardScale = 0.94 + 0.06 * cardIn;

  // current price pill
  let price = 0, prev = 0, lockF = -1, idx = -1;
  PLACES.forEach((pl, i) => { if (f >= pl.speak) { idx = i; prev = i ? PLACES[i - 1].price : 0; price = pl.price; lockF = pl.lock; } });
  const pillShown = idx >= 0 && f < T.same[0];
  const shownPrice = idx < 0 ? 0 : Math.round(interpolate(f, [lockF - 12, lockF], [prev, price], clamp) / 100) * 100;
  const pillPop = idx < 0 ? 0 : interpolate(f, [lockF, lockF + 4, lockF + 10], [1, 1.12, 1], clamp);
  const pillOp = interpolate(f, [PLACES[0].speak, PLACES[0].speak + 8, T.same[0] - 6, T.same[0]], [0, 1, 1, 0], clamp);

  // chart
  const axis = interpolate(f, [T.teaser[0], T.teaser[0] + 30], [0, 1], clamp);
  const ringDone = f - (T.value[0] + 92);
  const endOp = interpolate(f, [T.position[0], T.position[0] + 14], [0, 1], clamp);
  const line2F = T.position[0] + 51;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="grid" width={36} height={36} patternUnits="userSpaceOnUse">
            <path d="M36 0 H0 V36" fill="none" stroke={GRID} strokeWidth={1.1} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
      </svg>

      {/* photo card */}
      <div style={{ position: "absolute", left: CARD.x - 12, top: CARD.y - 12, width: CARD.w + 24, height: CARD.h + 24, borderRadius: CARD.r + 10,
        background: "#fff", boxShadow: "0 18px 50px rgba(40,40,70,0.18), 0 3px 10px rgba(40,40,70,0.10)",
        transform: `scale(${cardScale})`, opacity: cardIn }}>
        <div style={{ position: "absolute", left: 12, top: 12, width: CARD.w, height: CARD.h, borderRadius: CARD.r, overflow: "hidden", background: "#ddd" }}>
          {PHOTOS.map(([pf, k, fade], i) => {
            const next = PHOTOS[i + 1];
            if (f < pf || (next && f >= next[0] + next[2])) return null;
            const op = fade ? interpolate(f, [pf, pf + fade], [0, 1], clamp) : 1;
            return <Photo key={i} k={k} op={op} />;
          })}
          {/* soft bottom scrim for the price pill */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, opacity: pillOp,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(10,14,30,0.45) 100%)" }} />
          {pillShown && (
            <div style={{ position: "absolute", left: 36, bottom: 36, display: "flex", alignItems: "center", gap: 18, opacity: pillOp,
              transform: `scale(${pillPop})`, transformOrigin: "left bottom" }}>
              <div style={{ padding: "8px 30px 14px", borderRadius: 999, background: "rgba(255,255,255,0.95)", fontFamily: "Noto Sans KR",
                fontWeight: 900, fontSize: 104, color: INK, letterSpacing: -2, lineHeight: 1.1 }}>{won(shownPrice)}</div>
              {idx > 0 && f >= lockF && (
                <div style={{ padding: "10px 22px", borderRadius: 999, background: INK, color: "#fff", fontFamily: "Noto Sans KR",
                  fontWeight: 900, fontSize: 52, opacity: interpolate(f, [lockF, lockF + 6], [0, 1], clamp) }}>×{price / 1000}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* overlay: chart + the one line + captions */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="blur" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation={10} /></filter>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={3} /></filter>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.35" /></filter>
        </defs>

        {/* axis + place labels */}
        <line x1={CHART.x0} y1={CHART.base} x2={CHART.x0 + 4 * CHART.seg * axis} y2={CHART.base} stroke={INK} strokeWidth={2} opacity={0.35} />
        {PLACES.map((pl, i) => {
          const a = T.teaser[0] + 6 + i * 18;
          const op = interpolate(f, [a, a + 8], [0, 1], clamp);
          const active = f >= pl.speak && f < T.same[0] ? 1 : 0;
          const cx = CHART.x0 + CHART.seg * (i + 0.5);
          const pOp = interpolate(f, [pl.lock, pl.lock + 8], [0, 1], clamp);
          return (
            <g key={pl.key}>
              <line x1={CHART.x0 + CHART.seg * (i + 1)} y1={CHART.base - 8} x2={CHART.x0 + CHART.seg * (i + 1)} y2={CHART.base + 8} stroke={INK} strokeWidth={2} opacity={0.35 * op} />
              <text x={cx} y={CHART.base + 50} textAnchor="middle" fontFamily="Noto Sans KR" fontWeight={active ? 700 : 400} fontSize={32}
                fill={INK} opacity={op * (active ? 1 : 0.6)}>{pl.name}</text>
              <text x={cx} y={levelY(pl.price) - 20} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} fill={INK} opacity={pOp * 0.85}>
                {pl.price.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}

        {/* the line */}
        <path d={LINE.d} fill="none" stroke={GLOW} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${LINE.total} ${LINE.total * 2}`} strokeDashoffset={LINE.total - len} opacity={0.45} filter="url(#soft)" />
        <path d={LINE.d} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${LINE.total} ${LINE.total * 2}`} strokeDashoffset={LINE.total - len} />

        {/* ring pulse + YOU label */}
        {ringDone >= 0 && (
          <g>
            <circle cx={RING.c[0]} cy={RING.c[1]} r={RING.r + ringDone * 2.2} fill="none" stroke="#fff" strokeWidth={4}
              opacity={Math.max(0, 0.8 - ringDone / 30)} />
            <text x={RING.c[0]} y={RING.c[1] - RING.r - 26} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} letterSpacing={8}
              fill="#fff" filter="url(#shadow)" opacity={interpolate(ringDone, [0, 10], [0, 1], clamp)}>YOU</text>
          </g>
        )}

        {/* pen tip */}
        {land > 0 && (
          <g>
            <circle cx={hx} cy={hy} r={glowR} fill={GLOW} filter="url(#blur)" opacity={0.95} />
            <circle cx={hx} cy={hy} r={8.5 * land} fill={INK} />
            <circle cx={hx - 2} cy={hy - 2} r={2.6 * land} fill="#fff" opacity={0.75} />
          </g>
        )}

        {/* captions */}
        {CAPTIONS.map((c, i) => {
          const op = interpolate(f, [c.f0, c.f0 + 7, c.f1 - 6, c.f1], [0, 1, 1, 0], clamp);
          if (op <= 0) return null;
          const dy = interpolate(f, [c.f0, c.f0 + 12], [12, 0], clamp);
          return (
            <g key={i} opacity={op} transform={`translate(0 ${dy})`}>
              <text x={90} y={215} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={8} fill={INK} opacity={0.6}>{c.kicker}</text>
              <text x={90} y={298} fontFamily="Noto Sans KR" fontWeight={700} fontSize={68} letterSpacing={1} fill={INK}>{c.text}</text>
            </g>
          );
        })}

        {/* end headline */}
        {endOp > 0 && (
          <g fontFamily="Nanum Myeongjo" fontWeight={700} fill={INK}>
            <text x={90} y={222} fontSize={58} opacity={endOp}
              transform={`translate(0 ${interpolate(f, [T.position[0], T.position[0] + 16], [14, 0], clamp)})`}>자신을 최적의 위치에</text>
            <text x={90} y={318} fontSize={86} opacity={interpolate(f, [line2F, line2F + 12], [0, 1], clamp)}
              transform={`translate(0 ${interpolate(f, [line2F, line2F + 16], [14, 0], clamp)})`}>포지셔닝하라</text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
