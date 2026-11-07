import "@fontsource/nanum-myeongjo/700.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/jetbrains-mono/400.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  ARROW_STRAIGHT, CAPTIONS, CARD, CHECK, CY, DOC, END_LINES, END_REVEAL, PHOTOS, Q_POS, SUBS, T, TANGLE, TARGET, io, lerpPts, toD,
} from "./timeline";

const W = 1080, H = 1920;
const INK = "#E4ECFF", GLOW = "#5B8CFF", TEXT = "#FFFFFF", ACCENT = "#FFD58A";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const POS: Record<string, string> = { handover: "50% 55%", thinking: "50% 30%", value: "55% 55%", listening: "45% 30%", handshake: "45% 35%" };
const k = (f: number, a: number, b: number) => io((f - a) / (b - a));

// glowing stroke helper; `p` = how much is drawn (0..1) via pathLength
const Stroke: React.FC<{ d: string; p?: number; w?: number; op?: number }> = ({ d, p = 1, w = 6, op = 1 }) =>
  p <= 0 ? null : (
    <g opacity={op}>
      <path d={d} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - p} fill="none" stroke={GLOW} strokeWidth={w + 5} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} filter="url(#soft)" />
      <path d={d} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - p} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

const Photos: React.FC<{ f: number; bg?: boolean }> = ({ f, bg }) => (
  <>
    {PHOTOS.map(([pf, key, fade], i) => {
      const next = PHOTOS[i + 1];
      if (f < pf || (next && f >= next[0] + next[2])) return null;
      const op = fade ? interpolate(f, [pf, pf + fade], [0, 1], clamp) : 1;
      return <Img key={i} src={staticFile(`proposal/${key}.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
        objectPosition: POS[key], opacity: op, transform: bg ? undefined : `scale(${1.02 + 0.03 * ((f - pf) / 300)})` }} />;
    })}
  </>
);

export const Proposal: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('700 60px "Nanum Myeongjo"', END_LINES.join("")),
      document.fonts.load('700 60px "Noto Sans KR"', CAPTIONS.flatMap((c) => c.lines).join("") + "?비용가치"),
      document.fonts.load('400 40px "Noto Sans KR"', SUBS.map((s) => s.text).join("")),
      document.fonts.load('400 24px "JetBrains Mono"', "PRINCIPLES OF PROPOSAL THE CLIENT ASKS 0123·"),
    ]).then(() => continueRender(handle));
  }, [handle]);

  const endDim = interpolate(f, [T.card, T.card + 16], [0, 1], clamp);
  const cardIn = interpolate(f, [0, 16], [0, 1], clamp);
  const mOp = 1 - endDim;

  // --- intro: document + "?" ---
  const docP = k(f, 10, 50);
  const docOp = interpolate(f, [T.split[0], T.split[0] + 10], [1, 0], clamp);
  const q1s = interpolate(f, [56, 62, 68], [0, 1.3, 1], clamp);
  // --- split: two "?" (stay until the checks replace them) ---
  const splitK = k(f, T.split[0] + 4, T.split[0] + 20);
  const qOp = interpolate(f, [T.q1[0] - 10, T.q1[0]], [1, 0], clamp) + interpolate(f, [T.end[0], T.end[0] + 8, T.end[0] + 18, T.end[0] + 26], [0, 1, 1, 0], clamp);
  // --- scale ---
  const scaleOp = interpolate(f, [T.q1[0], T.q1[0] + 8, T.q2[0] - 10, T.q2[0]], [0, 1, 1, 0], clamp);
  const scaleP = k(f, T.q1[0] + 4, T.q1[0] + 40);
  const pre = interpolate(f, [T.q1[0] + 40, T.q1[0] + 70], [0, -9], clamp);           // cost feels heavier first
  const tt = Math.max(0, f - T.tilt);
  const tiltAng = f < T.tilt ? pre : pre + (9 + 15) * (1 - Math.exp(-tt / 7) * Math.cos(tt / 3.2)); // then value wins, with a little settle
  const PV: [number, number] = [540, 1370], L = 190;
  const rad = (tiltAng * Math.PI) / 180;
  const left: [number, number] = [PV[0] - L * Math.cos(rad), PV[1] - L * Math.sin(rad)];
  const right: [number, number] = [PV[0] + L * Math.cos(rad), PV[1] + L * Math.sin(rad)];
  const pan = ([x, y]: [number, number]) => `M${x} ${y} L${x - 55} ${y + 75} M${x} ${y} L${x + 55} ${y + 75} M${x - 75} ${y + 75} Q${x} ${y + 125} ${x + 75} ${y + 75} Z`;
  const valueGlow = f >= T.tilt ? interpolate(f, [T.tilt, T.tilt + 10, T.tilt + 40], [0, 1, 0.5], clamp) : 0;
  // --- tangle -> arrow -> target ---
  const arrOp = interpolate(f, [T.q2[0], T.q2[0] + 8, T.end[0] - 10, T.end[0]], [0, 1, 1, 0], clamp);
  const tangleP = k(f, T.q2[0] + 8, T.q2[0] + 60);
  const rel = k(f, T.release[0], T.release[1]);
  const arrPts = lerpPts(TANGLE, ARROW_STRAIGHT, rel);
  const headP = k(f, T.release[1] - 6, T.release[1] + 4);
  const targetP = k(f, T.q2[0] + 4, T.q2[0] + 36);
  const hit = f >= T.release[1] + 4 ? Math.exp(-(f - T.release[1] - 4) / 10) : 0;
  // --- checks ---
  const chk = (i: number) => k(f, T.end[0] + 20 + i * 12, T.end[0] + 34 + i * 12);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0E1C" }}>
      <AbsoluteFill style={{ transform: `scale(${1.25 + 0.05 * (f / 960)})`, filter: `blur(38px) brightness(${0.42 - 0.12 * endDim}) saturate(1.1)` }}>
        <Photos f={f} bg />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,10,24,0.6) 0%, rgba(8,10,24,0.1) 22%, rgba(8,10,24,0.1) 60%, rgba(8,10,24,0.6) 100%)" }} />

      <div style={{ position: "absolute", left: CARD.x - 12, top: CARD.y - 12, width: CARD.w + 24, height: CARD.h + 24, borderRadius: CARD.r + 10,
        background: "#fff", boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 4px 14px rgba(0,0,0,0.3)",
        transform: `scale(${(0.94 + 0.06 * cardIn) * (1 - 0.04 * endDim)})`, opacity: cardIn * (1 - 0.85 * endDim) }}>
        <div style={{ position: "absolute", left: 12, top: 12, width: CARD.w, height: CARD.h, borderRadius: CARD.r, overflow: "hidden", background: "#222" }}>
          <Photos f={f} />
        </div>
      </div>

      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={3} /></filter>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={14} /></filter>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.4" /></filter>
        </defs>

        <g opacity={mOp}>
          {/* intro document + ? */}
          <Stroke d={DOC} p={docP} op={docOp} />
          {q1s > 0 && f < T.split[0] + 20 && (
            <text x={540 + (Q_POS[0][0] - 540) * splitK} y={CY + 40} textAnchor="middle" fontFamily="Noto Sans KR" fontWeight={700}
              fontSize={110 * q1s} fill={INK} filter="url(#shadow)" opacity={f < T.split[0] ? 1 : 1}>?</text>
          )}
          {/* two ? */}
          {f >= T.split[0] + 4 && qOp > 0 && Q_POS.map(([x], i) => (
            <text key={i} x={i === 0 ? x : 540 + (x - 540) * splitK} y={CY + 40} textAnchor="middle" fontFamily="Noto Sans KR" fontWeight={700}
              fontSize={110} fill={INK} filter="url(#shadow)" opacity={Math.min(1, qOp) * (i === 0 ? (f < T.split[0] + 20 ? 0 : 1) : 1)}>?</text>
          ))}

          {/* scale: cost vs value */}
          {scaleOp > 0 && (
            <g opacity={scaleOp}>
              <Stroke d={`M420 1590 H660 M540 1590 V${PV[1]}`} p={scaleP} />
              <Stroke d={`M${left[0]} ${left[1]} L${right[0]} ${right[1]}`} p={scaleP} />
              <circle cx={PV[0]} cy={PV[1]} r={9} fill={INK} opacity={scaleP} />
              <Stroke d={pan(left)} p={k(f, T.q1[0] + 24, T.q1[0] + 52)} w={4} />
              <Stroke d={pan(right)} p={k(f, T.q1[0] + 24, T.q1[0] + 52)} w={4} />
              {valueGlow > 0 && <circle cx={right[0]} cy={right[1] + 95} r={70} fill={ACCENT} opacity={0.35 * valueGlow} filter="url(#glow)" />}
              <text x={left[0]} y={left[1] + 150} textAnchor="middle" fontFamily="Noto Sans KR" fontWeight={700} fontSize={34} fill={TEXT}
                opacity={k(f, T.q1[0] + 40, T.q1[0] + 50)} filter="url(#shadow)">비용</text>
              <text x={right[0]} y={right[1] + 150} textAnchor="middle" fontFamily="Noto Sans KR" fontWeight={700} fontSize={34}
                fill={f >= T.tilt ? ACCENT : TEXT} opacity={k(f, T.q1[0] + 40, T.q1[0] + 50)} filter="url(#shadow)">가치</text>
            </g>
          )}

          {/* tangle -> arrow -> target */}
          {arrOp > 0 && (
            <g opacity={arrOp}>
              {[70, 46, 22].map((r, i) => (
                <circle key={i} cx={TARGET[0]} cy={TARGET[1]} r={r} fill="none" stroke={INK} strokeWidth={4} opacity={0.85}
                  pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - targetP} />
              ))}
              {hit > 0.02 && <circle cx={TARGET[0]} cy={TARGET[1]} r={70 + (1 - hit) * 50} fill="none" stroke={ACCENT} strokeWidth={4} opacity={hit} />}
              <Stroke d={toD(arrPts)} p={tangleP} />
              <Stroke d={`M${TARGET[0] - 46} ${CY - 26} L${TARGET[0] - 12} ${CY} L${TARGET[0] - 46} ${CY + 26}`} p={headP} />
            </g>
          )}

          {/* checks */}
          {Q_POS.map(([x, y], i) => <Stroke key={i} d={CHECK(x, y)} p={chk(i)} w={9} op={f < T.card + 16 ? 1 : 0} />)}
        </g>

        {/* top captions */}
        {CAPTIONS.map((c, i) => {
          const op = interpolate(f, [c.f0, c.f0 + 8, c.f1 - 6, c.f1], [0, 1, 1, 0], clamp);
          if (op <= 0) return null;
          const dy = interpolate(f, [c.f0, c.f0 + 12], [12, 0], clamp);
          return (
            <g key={i} opacity={op} transform={`translate(0 ${dy})`} filter="url(#shadow)">
              <text x={90} y={150} fontFamily="JetBrains Mono, Noto Sans KR" fontSize={26} letterSpacing={6} fill={TEXT} opacity={0.75}>{c.kicker}</text>
              {c.lines.map((l, j) => <text key={j} x={90} y={228 + j * 76} fontFamily="Noto Sans KR" fontWeight={700} fontSize={c.lines.length === 1 ? 76 : 62} fill={TEXT}>{l}</text>)}
            </g>
          );
        })}
        {/* subtitle under the card */}
        {SUBS.map((s, i) => {
          const op = interpolate(f, [s.f0, s.f0 + 10, s.f1 - 6, s.f1], [0, 1, 1, 0], clamp);
          return op <= 0 ? null : (
            <text key={i} x={540} y={1266} textAnchor="middle" fontFamily="Noto Sans KR" fontWeight={s.strong ? 700 : 400}
              fontSize={s.text.length > 22 ? 34 : 38} fill={s.strong ? ACCENT : TEXT} opacity={op} filter="url(#shadow)"
              transform={`translate(0 ${interpolate(f, [s.f0, s.f0 + 12], [10, 0], clamp)})`}>{s.strong ? "→ " : ""}{s.text}</text>
          );
        })}
        {/* end card */}
        {endDim > 0 && (
          <g fontFamily="Nanum Myeongjo" fontWeight={700} fill={TEXT} textAnchor="middle" filter="url(#shadow)">
            {END_LINES.map((l, j) => (
              <text key={j} x={540} y={860 + j * 100} fontSize={j === 2 ? 64 : 54} fill={j === 2 ? ACCENT : TEXT}
                opacity={interpolate(f, [END_REVEAL[j], END_REVEAL[j] + 12], [0, 1], clamp)}>{l}</text>
            ))}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
