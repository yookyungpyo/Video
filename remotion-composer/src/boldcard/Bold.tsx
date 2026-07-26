import { useEffect, useState } from "react";
import { AbsoluteFill, Img, staticFile, continueRender, delayRender } from "remotion";

// Bold card-news layout (like the reference): light page, framed rough-sketch
// illustration on top, neon-green tag chip, heavy gothic headline, subtitle,
// page indicator + SWIPE chip. Illustration = Imagen rough marker sketch.
const BHS = "Black Han Sans";
const SANS = "Noto Sans KR";
const INK = "#1B1B1E";
const SUB = "#6A6A70";
const GREEN = "#CBF54A";
const PAGE = "#F3F2EF";

const fontCss = `
@font-face{font-family:'${BHS}';font-weight:400;src:url('${staticFile("fonts/black-han-sans-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:900;src:url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2');}
`;
const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([(document as any).fonts.load(`400 90px "${BHS}"`, "천재부엌"), (document as any).fonts.load(`900 40px "${SANS}"`, "AI")]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const Card: React.FC<{ img: string; tag: string; head: string[]; sub: string; page: string }> = ({ img, tag, head, sub, page }) => (
  <AbsoluteFill style={{ background: PAGE }}>
    <Fonts />
    {/* illustration frame */}
    <div style={{ position: "absolute", left: 56, top: 52, width: 968, height: 656, background: "#FFFFFF", borderRadius: 30, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #ECEAE4" }}>
      <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    {/* tag chip */}
    <div style={{ position: "absolute", left: 60, top: 762, background: GREEN, color: INK, fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 1, padding: "12px 26px", borderRadius: 12 }}>{tag}</div>
    {/* headline */}
    <div style={{ position: "absolute", left: 56, top: 866, width: 980, fontFamily: BHS, fontSize: 104, lineHeight: 1.16, color: INK, letterSpacing: -1 }}>
      {head.map((l, i) => <div key={i}>{l}</div>)}
    </div>
    {/* subtitle */}
    <div style={{ position: "absolute", left: 62, top: 1116, width: 950, fontFamily: SANS, fontWeight: 700, fontSize: 44, color: SUB }}>{sub}</div>
    {/* footer */}
    <div style={{ position: "absolute", left: 64, bottom: 62, fontFamily: SANS, fontWeight: 900, fontSize: 42, color: "#A7A49C" }}>{page}</div>
    <div style={{ position: "absolute", right: 56, bottom: 50, background: GREEN, color: INK, fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 2, padding: "16px 30px", borderRadius: 14 }}>SWIPE →</div>
  </AbsoluteFill>
);

export const Bold1: React.FC = () => (
  <Card img="boldcard/ill1.jpg" tag="AI 인사이트" head={["천재에게 맡겨도", "우리 부엌은 모른다"]} sub="그래서 '차려주는 법'이 중요합니다" page="1 / 8" />
);
