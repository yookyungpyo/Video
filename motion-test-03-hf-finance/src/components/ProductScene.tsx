import { useCurrentFrame } from "remotion";
import { clamp01, ease } from "../engine/easing";
import { HF } from "../theme";

export const PANEL_X = 130;

/**
 * ProductScene — the 2D type layer of a scene: numbered kicker, masked
 * headline and any extra overlay (counters, benefit rows, footnote).
 */
export const ProductScene: React.FC<{
  from: number;
  to: number;
  n: string;
  kicker: string;
  lines: string[];
  titleAt: number;
  exitAt: number;
  top?: number;
  size?: number;
  children?: React.ReactNode;
  footnote?: boolean;
}> = ({ from, to, n, kicker, lines, titleAt, exitAt, top = 250, size = 84, children, footnote = true }) => {
  const frame = useCurrentFrame();
  if (frame < from - 10 || frame > to + 30) return null;
  const out = ease.in(clamp01((frame - exitAt) / 24));
  const k = ease.out(clamp01((frame - titleAt + 10) / 30));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-out * 18}px)`, fontFamily: HF.font }}>
      <div style={{ position: "absolute", left: PANEL_X, top, display: "flex", alignItems: "center", gap: 14, opacity: k, transform: `translateY(${(1 - k) * 12}px)` }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", background: HF.blue, borderRadius: 999, padding: "5px 12px", letterSpacing: "0.04em" }}>{n}</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: HF.blue }}>{kicker}</span>
      </div>
      <div style={{ position: "absolute", left: PANEL_X - 4, top: top + 50, fontSize: size, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.035em", color: HF.text }}>
        {lines.map((l, i) => {
          const p = ease.out(clamp01((frame - titleAt - i * 8) / 40));
          return (
            <div key={i} style={{ overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
              <div style={{ transform: `translateY(${(1 - p) * 110}%)`, whiteSpace: "nowrap", color: i === lines.length - 1 ? HF.blue : HF.text }}>{l}</div>
            </div>
          );
        })}
      </div>
      {children}
      {footnote && (
        <div style={{ position: "absolute", left: PANEL_X, top: 1018, fontSize: 16, color: HF.text3, opacity: ease.out(clamp01((frame - titleAt - 20) / 30)) }}>
          ※ 화면 속 상품 정보는 앱 화면 기준 참조값이며, 실제 조건은 상품별 안내를 확인하세요.
        </div>
      )}
    </div>
  );
};

/** One benefit line, highlighted when active. */
export const BenefitRow: React.FC<{ label: string; value: string; at: number; exitAt: number; y: number; active?: number }> = ({ label, value, at, exitAt, y, active = 0 }) => {
  const frame = useCurrentFrame();
  const p = ease.out(clamp01((frame - at) / 30)) * (1 - ease.in(clamp01((frame - exitAt) / 24)));
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_X,
        top: y,
        width: 700,
        opacity: p,
        transform: `translateX(${(1 - p) * -30}px)`,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 22px",
        borderRadius: 18,
        background: `rgba(234,241,251,${0.5 + 0.5 * active})`,
        boxShadow: `0 0 0 ${2 * active}px ${HF.blue}`,
        fontFamily: HF.font,
      }}
    >
      <span style={{ fontSize: 19, color: HF.text2, width: 92 }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 800, color: HF.text, letterSpacing: "-0.02em" }}>{value}</span>
    </div>
  );
};
