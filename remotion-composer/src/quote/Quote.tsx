import { useEffect, useState } from "react";
import { AbsoluteFill, Img, staticFile, continueRender, delayRender } from "remotion";

// Cinematic "quote reel" style — full-bleed moody real photo, film grain +
// vignette, a single elegant Korean serif line centered. Ref: viral IG quote reels.
const SERIF = "Noto Serif KR";
const SANS = "Noto Sans KR";

const fontCss = `
@font-face{font-family:'${SERIF}';font-weight:500;src:url('${staticFile("fonts/noto-serif-kr-korean-500-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SERIF}';font-weight:600;src:url('${staticFile("fonts/noto-serif-kr-korean-600-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SERIF}';font-weight:700;src:url('${staticFile("fonts/noto-serif-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:400;src:url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2');}
`;

const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([
      (document as any).fonts.load(`600 80px "${SERIF}"`, "성과묵묵"),
      (document as any).fonts.load(`400 40px "${SANS}"`, "성과"),
    ]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const Grain: React.FC = () => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.09, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

const QuoteCard: React.FC<{
  photo: string;
  lines: string[];
  top: number; // vertical anchor for the quote (px, 1920 tall)
  size?: number;
  tint?: string;
}> = ({ photo, lines, top, size = 78, tint = "rgba(10,14,26,0.30)" }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Fonts />
    <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.66) contrast(1.1) saturate(0.82)" }} />
    {/* cool cinematic tint */}
    <AbsoluteFill style={{ background: tint }} />
    {/* legibility scrims top + bottom */}
    <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 26%, transparent 62%, rgba(0,0,0,0.8) 100%)" }} />
    {/* vignette */}
    <AbsoluteFill style={{ boxShadow: "inset 0 0 320px rgba(0,0,0,0.72)" }} />
    <Grain />
    {/* quote */}
    <div style={{ position: "absolute", top, width: "100%", padding: "0 96px", textAlign: "center" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontFamily: SERIF, fontWeight: 600, fontSize: size, lineHeight: 1.42, color: "#F4F1EC", textShadow: "0 2px 20px rgba(0,0,0,0.6)", letterSpacing: -0.5 }}>
          {l}
        </div>
      ))}
    </div>
    {/* handle */}
    <div style={{ position: "absolute", bottom: 120, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 400, fontSize: 34, letterSpacing: 6, color: "rgba(255,255,255,0.6)" }}>@wylieax</div>
  </AbsoluteFill>
);

// Sample 1 — overloaded desk
export const QuoteA: React.FC = () => (
  <QuoteCard photo="realphoto/s1.jpg" lines={["부족한 성과는", "결국 누군가의 몫이 된다"]} top={560} size={80} />
);

// Sample 2 — tired person
export const QuoteB: React.FC = () => (
  <QuoteCard photo="realphoto/s2.jpg" lines={["묵묵히 메우는 사람이", "가장 먼저 지친다"]} top={520} size={80} tint="rgba(12,16,30,0.34)" />
);
