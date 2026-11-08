import { useEffect, useState } from "react";
import { continueRender, delayRender, interpolate, staticFile } from "remotion";
import type { LucideIcon } from "lucide-react";
import { TRENDS, Trend } from "./data";
import {
  FONT, H, HAIR, IVORY, IVORY_2, NAVY, ORANGE, ORANGE_2, PAPER, SANS, SUB, SUBTITLE_TOP, W,
  clamp, clamp01, clayShadow, prog, tileRect,
} from "./theme";
import { ALL_CUES } from "./timing";

// ---------- fonts (local woff2 in public/fonts) ----------
const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 900; src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
`;
export const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("as-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([400, 700, 900].map((w) => (document as any).fonts.load(`${w} 40px "${SANS}"`, "가A")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ---------- background: ivory with slow drifting warm blobs (depth / parallax) ----------
export const Background: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30;
  const blob = (x: number, y: number, r: number, c: string, sp: number, ph: number) => (
    <div style={{
      position: "absolute", left: x + Math.sin(t * sp + ph) * 40 - r, top: y + Math.cos(t * sp * 0.8 + ph) * 30 - r,
      width: r * 2, height: r * 2, borderRadius: "50%", background: c, filter: "blur(70px)", opacity: 0.55,
    }} />
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${IVORY_2} 0%, ${IVORY} 100%)`, overflow: "hidden" }}>
      {blob(160, 520, 260, "#FFD9BE", 0.12, 0)}
      {blob(940, 1080, 300, "#FFE7CF", 0.1, 2)}
      {blob(520, 1620, 280, "#F9DCCB", 0.09, 4)}
      {blob(900, 300, 200, "#FFE9D9", 0.14, 1)}
    </div>
  );
};

// ---------- clay primitives ----------
export const ClayTile: React.FC<{
  x: number; y: number; size?: number; Icon?: LucideIcon; bg?: string; fg?: string; label?: string;
  op?: number; scale?: number; rot?: number; gray?: number; children?: React.ReactNode;
}> = ({ x, y, size = 120, Icon, bg = PAPER, fg = NAVY, label, op = 1, scale = 1, rot = 0, gray = 0, children }) =>
  op > 0 ? (
    <div style={{
      position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: op,
      transform: `scale(${scale})`, filter: gray > 0 ? `grayscale(${gray}) opacity(${1 - gray * 0.45})` : undefined,
    }}>
      <div style={{
        width: "100%", height: "100%", borderRadius: size * 0.28, background: bg, boxShadow: clayShadow,
        display: "flex", alignItems: "center", justifyContent: "center", transform: rot ? `rotate(${rot}deg)` : undefined,
      }}>
        {Icon && <Icon size={size * 0.48} color={fg} strokeWidth={2.2} />}
        {children}
      </div>
      {label && <div style={{ position: "absolute", left: -40, right: -40, top: size + 10, textAlign: "center", fontSize: 24, fontWeight: 700, color: NAVY, whiteSpace: "nowrap" }}>{label}</div>}
    </div>
  ) : null;

export const Chip: React.FC<{ x: number; y: number; text: string; Icon?: LucideIcon; op?: number; scale?: number; bg?: string; fg?: string; fs?: number }> =
  ({ x, y, text, Icon, op = 1, scale = 1, bg = PAPER, fg = NAVY, fs = 26 }) =>
    op > 0 ? (
      <div style={{
        position: "absolute", left: x, top: y, opacity: op, transform: `translate(-50%, -50%) scale(${scale})`,
        display: "flex", alignItems: "center", gap: 10, padding: `${fs * 0.42}px ${fs * 0.8}px`, borderRadius: 999,
        background: bg, color: fg, fontSize: fs, fontWeight: 700, whiteSpace: "nowrap", boxShadow: clayShadow,
      }}>
        {Icon && <Icon size={fs * 1.1} color={fg} strokeWidth={2.4} />}
        {text}
      </div>
    ) : null;

export const Bar: React.FC<{ x: number; y: number; w: number; h?: number; p: number; color?: string; track?: string }> =
  ({ x, y, w, h = 18, p, color = ORANGE, track = "rgba(20,33,61,0.08)" }) => (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: h, background: track, overflow: "hidden" }}>
      <div style={{ width: `${clamp01(p) * 100}%`, height: "100%", borderRadius: h, background: `linear-gradient(90deg, ${ORANGE_2}, ${color})` }} />
    </div>
  );

// protagonist face cropped from a poster, as a round clay avatar
export const Avatar: React.FC<{ trend: Trend; x: number; y: number; d?: number; op?: number; scale?: number; ring?: string }> =
  ({ trend, x, y, d = 170, op = 1, scale = 1, ring = PAPER }) => {
    if (op <= 0) return null;
    const [fx, fy, fr] = trend.face;
    const imgW = d / (2 * fr);
    const imgH = (imgW * 1672) / 941;
    return (
      <div style={{
        position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: "50%", opacity: op,
        transform: `scale(${scale})`, border: `6px solid ${ring}`, boxShadow: clayShadow, overflow: "hidden",
        backgroundImage: `url(${staticFile(trend.image)})`, backgroundSize: `${imgW}px ${imgH}px`,
        backgroundPosition: `${-(fx * imgW - d / 2)}px ${-(fy * imgH - d / 2)}px`, backgroundColor: PAPER,
      }} />
    );
  };

// ---------- subtitles (bottom of the safe area, max 2 lines) ----------
export const Subtitles: React.FC<{ f: number }> = ({ f }) => {
  const c = ALL_CUES.find((x) => f >= x.start - 2 && f < x.show);
  if (!c) return null;
  const a = interpolate(f, [c.start - 2, c.start + 4], [0, 1], clamp) * interpolate(f, [c.show - 5, c.show], [1, 0], clamp);
  return (
    <div style={{
      position: "absolute", left: 90, right: 90, top: SUBTITLE_TOP, textAlign: "center", opacity: a,
      transform: `translateY(${(1 - a) * 8}px)`, fontFamily: FONT, fontSize: 44, fontWeight: 700, lineHeight: 1.36,
      color: NAVY, whiteSpace: "pre-line", letterSpacing: -0.5,
    }}>{c.text}</div>
  );
};

// ---------- A L P H A S H E E P tracker ----------
export const Tracker: React.FC<{ f: number; appearAt: number; current: number; doneUpTo: number; hideAt: number }> =
  ({ f, appearAt, current, doneUpTo, hideAt }) => {
    const out = 1 - prog(f, hideAt, 14);
    if (f < appearAt || out <= 0) return null;
    return (
      <>
        {TRENDS.map((t, i) => {
          const r = tileRect(i);
          const a = prog(f, appearAt + i * 3, 12);
          const on = i === current;
          const done = i <= doneUpTo && !on;
          return (
            <div key={i} style={{
              position: "absolute", left: r.x, top: r.y + (1 - a) * -24, width: r.w, height: r.h, borderRadius: r.r,
              opacity: a * out, transform: `scale(${on ? 1.1 : 1})`,
              background: on ? `linear-gradient(160deg, ${ORANGE_2}, ${ORANGE})` : done ? NAVY : PAPER,
              boxShadow: clayShadow, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT, fontSize: 34, fontWeight: 900, color: on || done ? "#FFFFFF" : "rgba(20,33,61,0.28)",
            }}>{t.letter}</div>
          );
        })}
      </>
    );
  };

export const SceneLabel: React.FC<{ f: number; text: string; from: number; to: number }> = ({ f, text, from, to }) => {
  const a = prog(f, from, 14) * (1 - prog(f, to - 10, 10));
  if (a <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 352, textAlign: "center", opacity: a, fontFamily: FONT,
      fontSize: 22, fontWeight: 700, letterSpacing: 6, color: SUB }}>{text}</div>
  );
};

export const Frame: React.FC<{ x: number; y: number; w: number; h: number; r: number; op?: number; children: React.ReactNode; shadow?: boolean }> =
  ({ x, y, w, h, r, op = 1, children, shadow = true }) => (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h, borderRadius: r, overflow: "hidden", opacity: op,
      boxShadow: shadow ? "0 30px 60px rgba(120,70,30,0.18), 0 6px 16px rgba(120,70,30,0.10)" : undefined, background: PAPER,
      border: `1px solid ${HAIR}`,
    }}>{children}</div>
  );

export { H, W };
