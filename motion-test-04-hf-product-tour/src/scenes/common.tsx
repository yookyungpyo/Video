import type { CSSProperties } from "react";
import { Motion } from "../engine/motion";
import { HF } from "../theme";
import { BEZEL, toScreen } from "../components/HFMobileScreen";
import type { Rect } from "../screens";

export const PANEL_X = 150;

/** Phone-local centre of a source region (for camera focus). */
export const focusOf = (r: Rect) => {
  const s = toScreen(r);
  return { fx: s.x + s.w / 2 + BEZEL, fy: s.y + s.h / 2 + BEZEL };
};

export const Kicker: React.FC<{ n: string; text: string; startFrame: number; exitAt: number; top: number }> = ({ n, text, startFrame, exitAt, top }) => (
  <Motion
    startFrame={startFrame}
    duration={18}
    translateY={[14, 0]}
    exit={{ startFrame: exitAt, duration: 12, opacity: 0, translateY: -14 }}
    style={{ position: "absolute", left: PANEL_X, top, display: "flex", alignItems: "center", gap: 14, fontFamily: HF.font }}
  >
    <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", background: HF.blue, borderRadius: 999, padding: "5px 12px", letterSpacing: "0.04em" }}>{n}</span>
    <span style={{ fontSize: 22, fontWeight: 700, color: HF.blue }}>{text}</span>
  </Motion>
);

export const Footnote: React.FC<{ startFrame: number; exitAt: number }> = ({ startFrame, exitAt }) => (
  <Motion
    startFrame={startFrame}
    duration={16}
    exit={{ startFrame: exitAt, duration: 10, opacity: 0 }}
    style={{ position: "absolute", left: PANEL_X, top: 1012, fontFamily: HF.font, fontSize: 17, color: HF.text3 }}
  >
    ※ 화면 속 상품 조건은 앱 화면 기준 예시이며, 실제 조건은 상품별 안내를 확인하세요.
  </Motion>
);

export const Pill: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <span style={{ display: "inline-block", fontFamily: HF.font, fontSize: 20, fontWeight: 600, color: HF.text2, background: HF.bg2, borderRadius: 999, padding: "8px 18px", ...style }}>
    {children}
  </span>
);
