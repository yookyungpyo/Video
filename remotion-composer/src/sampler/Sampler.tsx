import { useEffect, useState } from "react";
import { AbsoluteFill, Img, staticFile, continueRender, delayRender } from "remotion";

// Style samples for the "부족한 성과 도미노" topic — one card per style so the
// user can feel each look before we commit. 1080x1350.

const BHS = "Black Han Sans";
const BODY = "Noto Sans KR";
const GAEGU = "Gaegu";
const JUA = "Jua";

const fontCss = `
@font-face{font-family:'${BHS}';font-weight:400;src:url('${staticFile("fonts/black-han-sans-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:400;src:url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:900;src:url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2');}
@font-face{font-family:'${GAEGU}';font-weight:700;src:url('${staticFile("fonts/gaegu-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${JUA}';font-weight:400;src:url('${staticFile("fonts/jua-korean-400-normal.woff2")}') format('woff2');}
`;

const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([
      (document as any).fonts.load(`400 100px "${BHS}"`, "부족"),
      (document as any).fonts.load(`700 100px "${GAEGU}"`, "부족"),
      (document as any).fonts.load(`900 100px "${BODY}"`, "부족"),
    ]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ─────────────────────────────────────────────────────────────────────────
// A) DARK KINETIC TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────
export const StyleKinetic: React.FC = () => (
  <AbsoluteFill style={{ background: "#0C0C11" }}>
    <Fonts />
    <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 8%, rgba(255,120,90,0.14), transparent 60%)" }} />
    <AbsoluteFill style={{ boxShadow: "inset 0 0 260px rgba(0,0,0,0.9)" }} />
    {/* kicker */}
    <div style={{ position: "absolute", top: 150, left: 90, display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ width: 64, height: 8, background: "#FF7A55", borderRadius: 4 }} />
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 8, color: "#9A93A6" }}>도미노 · 03</div>
    </div>
    {/* huge headline */}
    <div style={{ position: "absolute", top: 430, width: "100%", textAlign: "center", fontFamily: BHS, fontSize: 250, lineHeight: 0.92, color: "#FFFFFF" }}>
      하향
    </div>
    <div style={{ position: "absolute", top: 690, width: "100%", textAlign: "center", fontFamily: BHS, fontSize: 250, lineHeight: 0.92, color: "#FF7A55" }}>
      평준화
    </div>
    {/* footer line */}
    <div style={{ position: "absolute", top: 1120, left: 90, right: 90, height: 3, background: "rgba(255,255,255,0.18)" }} />
    <div style={{ position: "absolute", top: 1150, left: 90, fontFamily: BODY, fontWeight: 700, fontSize: 40, color: "#B9B2C2" }}>
      잘하던 사람이 지치면, 기준은 내려간다
    </div>
    <div style={{ position: "absolute", top: 1250, left: 90, fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: "#5C5766" }}>WWW.WYLIEAX.COM</div>
  </AbsoluteFill>
);

// ─────────────────────────────────────────────────────────────────────────
// B) DARK DOMINO EDITORIAL
// ─────────────────────────────────────────────────────────────────────────
const Tile: React.FC<{ x: number; angle: number; fallen?: boolean }> = ({ x, angle, fallen }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      bottom: 0,
      width: 96,
      height: 200,
      transformOrigin: "bottom left",
      transform: `rotate(${angle}deg)`,
      borderRadius: 14,
      boxShadow: "0 18px 30px rgba(0,0,0,0.45)",
      backgroundImage: fallen ? "linear-gradient(160deg,#4A5570,#333C52)" : "linear-gradient(160deg,#EDF1F8,#C7D0E0)",
    }}
  >
    <div style={{ position: "absolute", left: "50%", top: 46, width: 22, height: 22, marginLeft: -11, borderRadius: "50%", background: fallen ? "rgba(255,255,255,0.25)" : "#8794AD" }} />
    <div style={{ position: "absolute", left: "50%", top: 132, width: 22, height: 22, marginLeft: -11, borderRadius: "50%", background: fallen ? "rgba(255,255,255,0.25)" : "#8794AD" }} />
  </div>
);

export const StyleDomino: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(165deg,#0F1830 0%,#182741 55%,#101A30 100%)" }}>
    <Fonts />
    {/* label */}
    <div style={{ position: "absolute", top: 130, left: 90, display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 10, color: "#7FA8E0" }}>CHAIN REACTION</div>
    </div>
    <div style={{ position: "absolute", top: 178, left: 90, fontFamily: BHS, fontSize: 66, color: "#FFFFFF" }}>부족한 성과의 도미노</div>

    {/* domino row — standing → falling */}
    <div style={{ position: "absolute", left: 110, top: 430, width: 860, height: 240 }}>
      <Tile x={0} angle={0} />
      <Tile x={130} angle={-4} />
      <Tile x={262} angle={-12} />
      <Tile x={392} angle={-34} fallen />
      <Tile x={540} angle={-62} fallen />
      <Tile x={700} angle={-82} fallen />
    </div>

    {/* headline */}
    <div style={{ position: "absolute", top: 780, left: 90, fontFamily: BHS, fontSize: 116, lineHeight: 1.02, color: "#FFFFFF" }}>
      그 빈자리,
    </div>
    <div style={{ position: "absolute", top: 900, left: 90, fontFamily: BHS, fontSize: 116, lineHeight: 1.02, color: "#FF8E72" }}>
      누가 메우나?
    </div>
    <div style={{ position: "absolute", top: 1075, left: 92, fontFamily: BODY, fontWeight: 700, fontSize: 40, color: "#AEB9CE" }}>
      한 조각이 쓰러지면, 옆으로 번진다
    </div>
    <div style={{ position: "absolute", top: 1255, left: 90, fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: "#5E6C86" }}>WWW.WYLIEAX.COM</div>
  </AbsoluteFill>
);

// ─────────────────────────────────────────────────────────────────────────
// C) CINEMATIC REAL-PHOTO
// ─────────────────────────────────────────────────────────────────────────
export const StyleCinematic: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Fonts />
    <Img src={staticFile("realphoto/s2.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.62) contrast(1.08) saturate(0.9)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 45%, rgba(0,0,0,0.85) 88%)" }} />
    <AbsoluteFill style={{ boxShadow: "inset 0 0 240px rgba(0,0,0,0.7)" }} />
    {/* kicker pill */}
    <div style={{ position: "absolute", top: 150, left: 90, padding: "12px 28px", border: "2px solid rgba(255,255,255,0.6)", borderRadius: 999, fontFamily: BODY, fontWeight: 900, fontSize: 32, letterSpacing: 3, color: "#fff" }}>
      성과의 도미노
    </div>
    {/* headline low */}
    <div style={{ position: "absolute", top: 960, left: 90, fontFamily: BODY, fontWeight: 700, fontSize: 46, color: "rgba(255,255,255,0.85)" }}>대신 감당하던 사람은</div>
    <div style={{ position: "absolute", top: 1030, left: 84, fontFamily: BHS, fontSize: 150, color: "#fff", textShadow: "0 4px 30px rgba(0,0,0,0.6)" }}>결국, 곪는다</div>
    <div style={{ position: "absolute", top: 1255, left: 90, fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: "rgba(255,255,255,0.55)" }}>WWW.WYLIEAX.COM</div>
  </AbsoluteFill>
);

// ─────────────────────────────────────────────────────────────────────────
// D) FLAT COLLAGE (PAPER / ZINE)
// ─────────────────────────────────────────────────────────────────────────
export const StyleCollage: React.FC = () => (
  <AbsoluteFill style={{ background: "#F2E7D3" }}>
    <Fonts />
    {/* halftone dots */}
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(#D9B98E 2.2px, transparent 2.4px)", backgroundSize: "26px 26px", opacity: 0.4 }} />
    {/* kicker torn strip */}
    <div style={{ position: "absolute", top: 150, left: 90, transform: "rotate(-2deg)", background: "#2C2A33", color: "#F2E7D3", fontFamily: BODY, fontWeight: 900, fontSize: 34, padding: "12px 26px", boxShadow: "6px 8px 0 rgba(0,0,0,0.18)" }}>
      성과의 도미노 · 01
    </div>
    {/* washi tape */}
    <div style={{ position: "absolute", top: 470, left: 300, width: 220, height: 66, background: "rgba(120,199,163,0.72)", transform: "rotate(-8deg)", boxShadow: "0 4px 8px rgba(0,0,0,0.12)" }} />
    {/* torn paper card (coral) */}
    <div
      style={{
        position: "absolute",
        top: 500,
        left: 120,
        width: 840,
        height: 420,
        background: "#FF8E72",
        transform: "rotate(-1.5deg)",
        boxShadow: "12px 16px 0 rgba(0,0,0,0.15)",
        clipPath: "polygon(0 2%, 12% 0, 30% 3%, 55% 0, 78% 2%, 100% 0, 99% 20%, 100% 55%, 98% 82%, 100% 100%, 70% 98%, 40% 100%, 15% 98%, 0 100%, 2% 60%, 0 25%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontFamily: BHS, fontSize: 150, color: "#FFF7EF", lineHeight: 1.0, textAlign: "center" }}>결국<br />주변 몫</div>
    </div>
    {/* marker underline doodle */}
    <svg style={{ position: "absolute", top: 960, left: 150 }} width={780} height={60} viewBox="0 0 780 60">
      <path d="M8 34 C160 12 360 48 520 26 C640 12 720 34 772 24" fill="none" stroke="#4A7CC7" strokeWidth={10} strokeLinecap="round" />
    </svg>
    {/* handwritten sub */}
    <div style={{ position: "absolute", top: 1030, left: 120, width: 840, fontFamily: GAEGU, fontWeight: 700, fontSize: 62, color: "#3A3742", transform: "rotate(-0.6deg)" }}>
      부족한 성과는, 티 안 나게 옆으로 흐른다
    </div>
    <div style={{ position: "absolute", top: 1255, left: 92, fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: "#8A7A5E" }}>WWW.WYLIEAX.COM</div>
  </AbsoluteFill>
);
