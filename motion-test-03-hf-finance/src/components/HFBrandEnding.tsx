import { Img, staticFile, useCurrentFrame } from "remotion";
import { clamp01, ease } from "../engine/easing";
import { REGIONS, SRC, SRC_W } from "../screens";
import { HF } from "../theme";

/** HF logo cropped from the original main-screen header (source pixels). */
export const HFLogo: React.FC<{ height?: number }> = ({ height = 80 }) => {
  const L = REGIONS.main.logo;
  const k = height / L.h;
  return (
    <div style={{ position: "relative", width: L.w * k, height, overflow: "hidden" }}>
      <Img src={staticFile(SRC.main)} style={{ position: "absolute", left: -L.x * k, top: -L.y * k, width: SRC_W * k, maxWidth: "none" }} />
    </div>
  );
};

/** HFBrandEnding — 2D brand lock-up over the three product phones. */
export const HFBrandEnding: React.FC<{ startFrame: number; labelsAt: number; labelX: number[]; labelY: number }> = ({ startFrame, labelsAt, labelX, labelY }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;
  const a = (d: number, len = 36) => ease.out(clamp01((frame - startFrame - d) / len));
  const line = (p: number) => ({ opacity: p, transform: `translateY(${(1 - p) * 26}px)` });
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: HF.font }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 46, display: "flex", justifyContent: "center", ...line(a(0)), transform: `scale(${0.86 + 0.14 * a(0)})` }}>
        <HFLogo height={84} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 146, textAlign: "center", overflow: "hidden" }}>
        <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: "-0.035em", color: HF.text, transform: `translateY(${(1 - a(12, 44)) * 110}%)` }}>내 삶에 맞는 주택금융</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 232, textAlign: "center", fontSize: 26, fontWeight: 500, letterSpacing: "0.1em", color: HF.text2, ...line(a(30)) }}>
        한국주택금융공사
      </div>
      {["보금자리론", "HF전세ON", "주택연금"].map((l, i) => {
        const p = ease.out(clamp01((frame - labelsAt - i * 6) / 30));
        return (
          <div key={l} style={{ position: "absolute", left: labelX[i] - 150, width: 300, top: labelY, textAlign: "center", fontSize: 24, fontWeight: 700, color: HF.text, ...line(p) }}>
            {l}
          </div>
        );
      })}
    </div>
  );
};
