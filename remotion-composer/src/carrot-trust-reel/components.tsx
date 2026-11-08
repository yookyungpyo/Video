import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { continueRender, delayRender, Img, interpolate, staticFile } from "remotion";
import { LISTING_TEXT } from "./data";
import { FONT, H, INK, ORANGE, SAFE, SAFE_W, SANS, SRC_H, SRC_W, SUB, W, WHITE, clamp, prog } from "./theme";

// ---------- fonts (local woff2 in public/fonts) ----------
const css = `
@font-face { font-family: '${SANS}'; font-weight: 400; src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 900; src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
`;
export const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("carrot-fonts"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([400, 700, 900].map((w) => (document as any).fonts.load(`${w} 40px "${SANS}"`, "가")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

// ---------- camera: image covers the frame; zoom z, focus (fx, fy) in source coords ----------
// `pin` = where on screen the focus point sits ("stay" keeps it where it is at z=1, so a slow
// 100→105% push never drifts the subject; "center" frames a detail).
export const camera = (z: number, fx: number, fy: number, pin: "stay" | "center" = "stay") => {
  const base = Math.max(W / SRC_W, H / SRC_H);
  const wi = SRC_W * base * Math.max(1, z);
  const hi = SRC_H * base * Math.max(1, z);
  const tx = pin === "center" ? W / 2 : fx * SRC_W * base;
  const ty = pin === "center" ? H / 2 : fy * SRC_H * base;
  const ox = Math.min(0, Math.max(W - wi, tx - fx * wi));
  const oy = Math.min(0, Math.max(H - hi, ty - fy * hi));
  return { wi, hi, ox, oy, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};
export type Cam = ReturnType<typeof camera>;

export const Photo: React.FC<{ src: string; cam: Cam; style?: React.CSSProperties }> = ({ src, cam, style }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left: cam.ox, top: cam.oy, width: cam.wi, height: cam.hi, ...style }} />
);

// thin orange ring around a point of interest
export const Ring: React.FC<{ cam: Cam; x: number; y: number; r: number; a: number }> = ({ cam, x, y, r, a }) => {
  if (a <= 0) return null;
  const [px, py] = cam.P(x, y);
  const R = r * cam.wi;
  return (
    <div style={{
      position: "absolute", left: px - R, top: py - R, width: R * 2, height: R * 2, borderRadius: "50%",
      border: `4px solid ${ORANGE}`, opacity: a, transform: `scale(${0.92 + 0.08 * a})`,
      boxShadow: "0 0 18px rgba(255,138,61,0.45)",
    }} />
  );
};

export const TopShade: React.FC<{ a?: number }> = ({ a = 1 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 640, opacity: a,
    background: "linear-gradient(180deg, rgba(10,12,18,0.55) 0%, rgba(10,12,18,0.28) 45%, rgba(10,12,18,0) 100%)" }} />
);
export const BottomShade: React.FC<{ a?: number }> = ({ a = 1 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 760, opacity: a,
    background: "linear-gradient(0deg, rgba(10,12,18,0.6) 0%, rgba(10,12,18,0.3) 45%, rgba(10,12,18,0) 100%)" }} />
);

// "{word}" → orange emphasis
export const Rich: React.FC<{ text: string; pop?: number }> = ({ text, pop = 1 }) => (
  <>
    {text.split(/(\{[^}]+\})/).map((p, i) =>
      p.startsWith("{") ? (
        <span key={i} style={{ color: ORANGE, display: "inline-block", transform: `scale(${1 + 0.05 * Math.sin(Math.PI * Math.min(1, pop))})` }}>{p.slice(1, -1)}</span>
      ) : <span key={i}>{p}</span>,
    )}
  </>
);

// ---------- subtitles (max 2 lines, white, top or bottom of the safe area) ----------
export const Subtitle: React.FC<{ f: number; text: string; start: number; show: number; pos: "top" | "bottom" }> = ({ f, text, start, show, pos }) => {
  const a = interpolate(f, [start - 2, start + 5], [0, 1], clamp) * interpolate(f, [show - 6, show], [1, 0], clamp);
  if (a <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: SAFE.left, width: SAFE_W, ...(pos === "top" ? { top: SAFE.top + 10 } : { bottom: H - SAFE.bottom }),
      opacity: a, transform: `translateY(${(1 - a) * 8}px)`, fontFamily: FONT, fontSize: 54, fontWeight: 700, lineHeight: 1.36,
      color: WHITE, whiteSpace: "pre", textShadow: "0 2px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)", letterSpacing: -0.5,
    }}><Rich text={text} pop={(f - start) / 12} /></div>
  );
};

// ---------- thought caption (a buyer's inner thought — not a chat message) ----------
export const Thought: React.FC<{ f: number; text: string; start: number; show: number; label: string; align?: "left" | "right" }> =
  ({ f, text, start, show, label, align = "left" }) => {
    const a = prog(f, start - 4, 10) * interpolate(f, [show - 8, show], [1, 0], clamp);
    if (a <= 0) return null;
    return (
      <div style={{ position: "absolute", top: SAFE.top + 10, ...(align === "left" ? { left: SAFE.left } : { right: W - SAFE.right }), opacity: a,
        transform: `translateY(${(1 - a) * 10}px)`, fontFamily: FONT }}>
        <div style={{ background: "rgba(255,255,255,0.93)", borderRadius: 34, padding: "20px 32px 24px", boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: ORANGE, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: INK, lineHeight: 1.32, whiteSpace: "pre", letterSpacing: -0.5 }}>{text}</div>
        </div>
        {/* thought dots (not a chat tail) */}
        <div style={{ position: "absolute", [align === "left" ? "right" : "left"]: 70, bottom: -26, width: 22, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.9)" }} />
        <div style={{ position: "absolute", [align === "left" ? "right" : "left"]: 50, bottom: -52, width: 13, height: 13, borderRadius: 7, background: "rgba(255,255,255,0.85)" }} />
      </div>
    );
  };

// ---------- re-created used-market listing card (generic, not a copy of any app screen) ----------
export const ListingCard: React.FC<{ src: string; crop: [number, number]; w: number; small?: boolean; priceGlow?: number; children?: React.ReactNode }> =
  ({ src, crop, w, small, priceGlow = 0, children }) => {
    const k = w / SRC_W;
    const ih = SRC_H * k;
    const ph = (crop[1] - crop[0]) * ih;
    const fs = small ? 0.55 : 1;
    return (
      <div style={{ width: w, background: WHITE, borderRadius: 34 * fs, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", fontFamily: FONT }}>
        <div style={{ position: "relative", width: w, height: ph, overflow: "hidden", background: "#ddd" }}>
          <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: -crop[0] * ih, width: w, height: ih }} />
          {children}
        </div>
        <div style={{ padding: `${26 * fs}px ${32 * fs}px ${30 * fs}px` }}>
          <div style={{ fontSize: 40 * fs, fontWeight: 700, color: INK, letterSpacing: -0.5, whiteSpace: "nowrap" }}>{LISTING_TEXT.title}</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 14 * fs }}>
            <div style={{ position: "relative", fontSize: 50 * fs, fontWeight: 900, color: INK }}>
              {LISTING_TEXT.price}
              {priceGlow > 0 && <div style={{ position: "absolute", left: -6, right: -6, bottom: 2, height: 10 * fs + 4, borderRadius: 6, background: ORANGE, opacity: 0.35 * priceGlow, zIndex: -1 }} />}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 * fs }}>
              <Heart size={40 * fs} color={SUB} strokeWidth={2} />
              <div style={{ background: ORANGE, color: WHITE, fontSize: 30 * fs, fontWeight: 700, padding: `${12 * fs}px ${28 * fs}px`, borderRadius: 999 }}>채팅하기</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
