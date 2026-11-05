import { AnimatedCursor, type CursorPoint } from "./AnimatedCursor";

/** Mobile fingertip indicator — AnimatedCursor in "touch" mode. */
export const TouchIndicator: React.FC<{
  points: CursorPoint[];
  startFrame?: number;
  endFrame?: number;
  highlightColor?: string;
  scale?: number;
}> = (p) => <AnimatedCursor variant="touch" {...p} />;
