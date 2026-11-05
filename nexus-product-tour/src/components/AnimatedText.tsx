import type { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease } from "../engine/easing";
import { type MotionProps, progressAt, resolveMotion } from "../engine/motion";
import { T } from "../theme";

type Props = MotionProps & {
  text: string;
  /** "word" mask reveal per word, "line" per line ("\n" separated), "char" per letter */
  split?: "word" | "line" | "char";
  stagger?: number; // frames between pieces
  size?: number;
  weight?: number;
  color?: string;
  gradient?: string;
  tracking?: number; // em
  lineHeight?: number;
  align?: CSSProperties["textAlign"];
  style?: CSSProperties;
};

/**
 * Kinetic headline with a per-piece mask reveal: each word sits in an
 * overflow-hidden box and slides up from 105% → 0, staggered.
 * The block itself also honours MotionProps (and an optional exit).
 */
export const AnimatedText: React.FC<Props> = ({
  text,
  split = "word",
  stagger = 3,
  size = 72,
  weight = 700,
  color = T.text,
  gradient,
  tracking = -0.03,
  lineHeight = 1.08,
  align = "center",
  style,
  ...m
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const block = resolveMotion(frame, fps, { opacity: 1, ...m, startFrame: m.startFrame, duration: m.duration ?? 22 });
  if (block.opacity <= 0.001) return null;
  const lines = text.split("\n");
  let k = 0;
  const pieceStyle: CSSProperties = gradient
    ? { backgroundImage: gradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
    : { color };
  return (
    <div
      style={{
        fontFamily: T.font,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: `${tracking}em`,
        lineHeight,
        textAlign: align,
        ...style,
        ...block.style,
      }}
    >
      {lines.map((ln, li) => {
        const pieces = split === "line" ? [ln] : split === "char" ? [...ln] : ln.split(" ");
        return (
          <div key={li} style={{ whiteSpace: "nowrap" }}>
            {pieces.map((pc, pi) => {
              const p = progressAt(frame, fps, {
                startFrame: m.startFrame,
                delay: (m.delay ?? 0) + k++ * stagger,
                duration: m.duration ?? 22,
                easing: m.easing ?? ease.out,
              });
              return (
                <span
                  key={pi}
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    verticalAlign: "top",
                    paddingBottom: "0.12em",
                    marginBottom: "-0.12em",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: `translateY(${(1 - p) * 105}%)`,
                      ...pieceStyle,
                    }}
                  >
                    {pc}
                    {split === "word" && pi < pieces.length - 1 ? " " : ""}
                  </span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
