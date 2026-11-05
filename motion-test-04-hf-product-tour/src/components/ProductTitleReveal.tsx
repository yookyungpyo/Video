import type { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease } from "../engine/easing";
import { type MotionProps, progressAt, resolveMotion } from "../engine/motion";
import { HF } from "../theme";

/**
 * Line-by-line mask reveal for Korean headlines (DOM text).
 * Each line rises out of its own overflow box; the block honours MotionProps
 * (incl. exit) and can underline with highlightColor.
 */
export const ProductTitleReveal: React.FC<
  MotionProps & {
    lines: string[];
    size?: number;
    weight?: number;
    color?: string | string[]; // per line
    lineHeight?: number;
    stagger?: number;
    tracking?: number;
    highlightColor?: string; // draws an accent bar under the block
    style?: CSSProperties;
  }
> = ({ lines, size = 80, weight = 800, color = HF.text, lineHeight = 1.22, stagger = 5, tracking = -0.035, highlightColor, style, ...m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = m.duration ?? 24;
  const block = resolveMotion(frame, fps, { opacity: 1, ...m, duration: dur });
  if (block.opacity <= 0.001) return null;
  const bar = progressAt(frame, fps, { startFrame: m.startFrame, delay: (m.delay ?? 0) + lines.length * stagger + 6, duration: 20, easing: ease.out });
  return (
    <div style={{ fontFamily: HF.font, fontSize: size, fontWeight: weight, lineHeight, letterSpacing: `${tracking}em`, ...style, ...block.style }}>
      {lines.map((ln, i) => {
        const p = progressAt(frame, fps, { startFrame: m.startFrame, delay: (m.delay ?? 0) + i * stagger, duration: dur, easing: m.easing ?? ease.out });
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
            <div style={{ transform: `translateY(${(1 - p) * 110}%)`, color: Array.isArray(color) ? color[i] ?? color[0] : color, whiteSpace: "nowrap" }}>{ln}</div>
          </div>
        );
      })}
      {highlightColor && <div style={{ marginTop: 22, height: 6, width: 96 * bar, borderRadius: 6, background: highlightColor }} />}
    </div>
  );
};

/** Mask reveal for a block of screenshot pixels (a <Slice> child). */
export const SliceMaskReveal: React.FC<MotionProps & { children: React.ReactNode; height: number }> = ({ children, height, ...m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = progressAt(frame, fps, { duration: 22, easing: ease.out, ...m });
  return <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${(1 - p) * 100}% 0)`, transform: `translateY(${(1 - p) * height * 0.35}px)` }}>{children}</div>;
};
