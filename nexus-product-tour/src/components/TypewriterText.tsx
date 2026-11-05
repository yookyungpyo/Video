import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { T } from "../theme";

type Props = {
  text: string;
  startFrame?: number;
  delay?: number;
  /** frames per character (can be fractional) */
  speed?: number;
  caret?: boolean;
  caretColor?: string;
  /** frame after which the caret is hidden */
  caretUntil?: number;
  style?: CSSProperties;
  placeholder?: string;
};

/** Character-by-character typing with a frame-driven blinking caret. */
export const TypewriterText: React.FC<Props> = ({
  text,
  startFrame = 0,
  delay = 0,
  speed = 1,
  caret = true,
  caretColor = T.primary,
  caretUntil,
  style,
  placeholder,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame - delay;
  const n = Math.max(0, Math.min(text.length, Math.floor(local / speed)));
  const typing = n > 0 && n < text.length;
  const blinkOn = typing || Math.floor(frame / 15) % 2 === 0;
  const showCaret = caret && local >= -10 && (caretUntil === undefined || frame < caretUntil);
  return (
    <span style={{ whiteSpace: "pre", ...style }}>
      {n === 0 && placeholder ? <span style={{ color: T.text3 }}>{placeholder}</span> : text.slice(0, n)}
      {showCaret && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1.1em",
            marginLeft: 2,
            verticalAlign: "-0.15em",
            background: caretColor,
            opacity: blinkOn ? 1 : 0,
          }}
        />
      )}
    </span>
  );
};
