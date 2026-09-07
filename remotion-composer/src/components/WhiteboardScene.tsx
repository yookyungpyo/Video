import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * WhiteboardScene — animated whiteboard drawing with progressive SVG reveal.
 *
 * Each "element" is drawn in sequence on a white/cream background, mimicking
 * a marker drawing on a whiteboard. Elements support:
 *   { kind: "text", text: "Hello", x: 960, y: 300 }           — chars typed one-by-one
 *   { kind: "line", x1: 100, y1: 200, x2: 500, y2: 200 }      — line drawn left-to-right
 *   { kind: "arrow", x1: 100, y1: 200, x2: 500, y2: 200 }     — line with arrowhead
 *   { kind: "rect", x: 200, y: 150, width: 400, height: 200 }  — rectangle traced
 *   { kind: "circle", cx: 960, cy: 540, r: 150 }               — circle traced
 *   { kind: "path", d: "M 100 200 Q 300 50 500 200" }          — arbitrary SVG path
 *   { kind: "pause", seconds: 0.5 }                             — silent dwell
 *
 * Coordinates are in px relative to a 1920×1080 canvas.
 * SVG paths use strokeDashoffset animation for the draw-on effect.
 */

export type WhiteboardElement =
  | { kind: "text"; text: string; x: number; y: number; fontSize?: number; color?: string; durationSeconds?: number; bold?: boolean }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; strokeWidth?: number; color?: string; durationSeconds?: number }
  | { kind: "arrow"; x1: number; y1: number; x2: number; y2: number; strokeWidth?: number; color?: string; durationSeconds?: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number; strokeWidth?: number; color?: string; durationSeconds?: number; fill?: boolean }
  | { kind: "circle"; cx: number; cy: number; r: number; strokeWidth?: number; color?: string; durationSeconds?: number }
  | { kind: "path"; d: string; strokeWidth?: number; color?: string; durationSeconds?: number }
  | { kind: "pause"; seconds: number };

interface WhiteboardSceneProps {
  elements: WhiteboardElement[];
  title?: string;
  backgroundColor?: string;
  strokeColor?: string;
  accentColor?: string;
}

// Layout timing for each element
interface ElementTiming {
  element: WhiteboardElement;
  startFrame: number;
  durationFrames: number;
}

function buildTimeline(elements: WhiteboardElement[], fps: number): ElementTiming[] {
  const timeline: ElementTiming[] = [];
  let cursor = 0;

  for (const el of elements) {
    if (el.kind === "pause") {
      cursor += Math.ceil(el.seconds * fps);
      continue;
    }

    let dur: number;
    if (el.kind === "text") {
      const speed = 0.06; // seconds per char
      dur = Math.ceil(Math.max(el.text.length * speed, 0.3) * fps);
      if (el.durationSeconds) dur = Math.ceil(el.durationSeconds * fps);
    } else {
      const defaultDur = el.kind === "rect" ? 1.2 : el.kind === "circle" ? 1.0 : 0.8;
      dur = Math.ceil((el.durationSeconds ?? defaultDur) * fps);
    }

    timeline.push({ element: el, startFrame: cursor, durationFrames: dur });
    cursor += dur + Math.ceil(0.1 * fps); // brief gap between elements
  }

  return timeline;
}

// Approximate SVG path length using a coarse sampling approach (no DOM)
function approxPathLength(d: string): number {
  // Parse M, L, Q, C commands and sum segment distances
  const tokens = d.match(/[MLQCZmlqcz][^MLQCZmlqcz]*/g) ?? [];
  let length = 0;
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;

  for (const token of tokens) {
    const cmd = token[0];
    const nums = (token.slice(1).match(/-?\d+\.?\d*/g) ?? []).map(Number);

    if (cmd === "M") {
      cx = nums[0]; cy = nums[1]; startX = cx; startY = cy;
    } else if (cmd === "L") {
      const dx = nums[0] - cx; const dy = nums[1] - cy;
      length += Math.sqrt(dx * dx + dy * dy);
      cx = nums[0]; cy = nums[1];
    } else if (cmd === "Q") {
      // Quadratic bezier — approximate with 10 samples
      const [x1, y1, x2, y2] = nums;
      let px = cx; let py = cy;
      for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        const nx = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * x1 + t * t * x2;
        const ny = (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * y1 + t * t * y2;
        const ddx = nx - px; const ddy = ny - py;
        length += Math.sqrt(ddx * ddx + ddy * ddy);
        px = nx; py = ny;
      }
      cx = x2; cy = y2;
    } else if (cmd === "C") {
      // Cubic bezier — approximate with 15 samples
      const [x1, y1, x2, y2, x3, y3] = nums;
      let px = cx; let py = cy;
      for (let i = 1; i <= 15; i++) {
        const t = i / 15;
        const mt = 1 - t;
        const nx = mt * mt * mt * cx + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
        const ny = mt * mt * mt * cy + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
        const ddx = nx - px; const ddy = ny - py;
        length += Math.sqrt(ddx * ddx + ddy * ddy);
        px = nx; py = ny;
      }
      cx = x3; cy = y3;
    } else if (cmd === "Z" || cmd === "z") {
      const dx = startX - cx; const dy = startY - cy;
      length += Math.sqrt(dx * dx + dy * dy);
      cx = startX; cy = startY;
    }
  }
  return Math.max(length, 1);
}

// Rendered SVG element with draw-on animation
const DrawnElement: React.FC<{
  el: WhiteboardElement;
  progress: number; // 0–1
  defaultStroke: string;
  accentColor: string;
}> = ({ el, progress, defaultStroke, accentColor }) => {
  const color = (el as any).color || defaultStroke;

  if (el.kind === "text") {
    const charsToShow = Math.floor(el.text.length * progress);
    const visible = el.text.slice(0, charsToShow);
    const opacity = spring({ frame: Math.round(progress * 10), fps: 10, config: { damping: 20 } });
    return (
      <text
        x={el.x}
        y={el.y}
        fontSize={el.fontSize ?? 52}
        fontWeight={el.bold ? "bold" : "normal"}
        fill={color}
        fontFamily="'Segoe UI', 'Arial', sans-serif"
        opacity={Math.min(opacity, 1)}
      >
        {visible}
      </text>
    );
  }

  if (el.kind === "line" || el.kind === "arrow") {
    const dx = el.x2 - el.x1;
    const dy = el.y2 - el.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const sw = el.strokeWidth ?? 4;

    // Arrowhead points
    const angle = Math.atan2(dy, dx);
    const arrowSize = sw * 5;
    const ax = el.x2 - arrowSize * Math.cos(angle - 0.4);
    const ay = el.y2 - arrowSize * Math.sin(angle - 0.4);
    const bx = el.x2 - arrowSize * Math.cos(angle + 0.4);
    const by = el.y2 - arrowSize * Math.sin(angle + 0.4);

    const dashTotal = len;
    const dashOffset = dashTotal * (1 - progress);
    const arrowProgress = Math.max(0, (progress - 0.75) / 0.25);

    return (
      <g>
        <line
          x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2}
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={dashTotal}
          strokeDashoffset={dashOffset}
        />
        {el.kind === "arrow" && arrowProgress > 0 && (
          <g opacity={arrowProgress}>
            <line x1={el.x2} y1={el.y2} x2={ax} y2={ay}
              stroke={color} strokeWidth={sw} strokeLinecap="round" />
            <line x1={el.x2} y1={el.y2} x2={bx} y2={by}
              stroke={color} strokeWidth={sw} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  }

  if (el.kind === "rect") {
    const sw = el.strokeWidth ?? 4;
    const perimeter = 2 * (el.width + el.height);
    const dashOffset = perimeter * (1 - progress);
    const fillOpacity = el.fill ? progress * 0.15 : 0;
    return (
      <rect
        x={el.x} y={el.y} width={el.width} height={el.height}
        stroke={color} strokeWidth={sw} fill={el.fill ? color : "none"} fillOpacity={fillOpacity}
        strokeDasharray={perimeter} strokeDashoffset={dashOffset}
        strokeLinecap="round" strokeLinejoin="round"
      />
    );
  }

  if (el.kind === "circle") {
    const sw = el.strokeWidth ?? 4;
    const circumference = 2 * Math.PI * el.r;
    const dashOffset = circumference * (1 - progress);
    return (
      <circle
        cx={el.cx} cy={el.cy} r={el.r}
        stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90, ${el.cx}, ${el.cy})`}
      />
    );
  }

  if (el.kind === "path") {
    const sw = el.strokeWidth ?? 4;
    const pathLen = approxPathLength(el.d);
    const dashOffset = pathLen * (1 - progress);
    return (
      <path
        d={el.d}
        stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={pathLen} strokeDashoffset={dashOffset}
        strokeLinecap="round" strokeLinejoin="round"
      />
    );
  }

  return null;
};

// Animated marker dot that follows the drawing tip
const MarkerTip: React.FC<{ el: WhiteboardElement; progress: number; color: string }> = ({ el, progress, color }) => {
  if (el.kind === "text") {
    const charsShown = Math.floor(el.text.length * progress);
    // Approximate char width
    const charWidth = (el as any).fontSize ? (el as any).fontSize * 0.55 : 28;
    const cx = el.x + charsShown * charWidth;
    const cy = el.y;
    return <circle cx={cx} cy={cy} r={5} fill={color} opacity={0.7} />;
  }
  if (el.kind === "line" || el.kind === "arrow") {
    const cx = el.x1 + (el.x2 - el.x1) * progress;
    const cy = el.y1 + (el.y2 - el.y1) * progress;
    return <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.8} />;
  }
  return null;
};

export const WhiteboardScene: React.FC<WhiteboardSceneProps> = ({
  elements,
  title,
  backgroundColor = "#FAFAF8",
  strokeColor = "#1A1A2E",
  accentColor = "#2563EB",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const timeline = buildTimeline(elements, fps);

  // Title fade-in
  const titleOpacity = interpolate(frame, [0, Math.ceil(0.5 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Subtle paper texture lines (horizontal rules, very faint)
  const lineCount = 12;
  const lineSpacing = height / (lineCount + 1);

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      {/* Paper lines — very subtle */}
      <svg
        width={width} height={height}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <line
            key={i}
            x1={0} y1={(i + 1) * lineSpacing}
            x2={width} y2={(i + 1) * lineSpacing}
            stroke="#E8E8E0" strokeWidth={1}
          />
        ))}
        {/* Left margin line */}
        <line x1={120} y1={0} x2={120} y2={height} stroke="#F0C0C0" strokeWidth={1.5} />
      </svg>

      {/* Title */}
      {title && (
        <div style={{
          position: "absolute",
          top: 48,
          left: 0, right: 0,
          textAlign: "center",
          fontSize: 36,
          fontWeight: 700,
          color: strokeColor,
          opacity: titleOpacity,
          fontFamily: "'Segoe UI', 'Arial', sans-serif",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}>
          {title}
        </div>
      )}

      {/* Drawing canvas */}
      <svg
        width={width} height={height}
        style={{ position: "absolute", inset: 0 }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {timeline.map(({ element, startFrame, durationFrames }, i) => {
          if (element.kind === "pause") return null;

          const localFrame = frame - startFrame;
          if (localFrame < 0) return null;

          // Clamp progress to [0, 1] — element stays visible after it finishes drawing
          const rawProgress = localFrame / durationFrames;
          const progress = Math.min(Math.max(rawProgress, 0), 1);

          const isActivelyDrawing = localFrame >= 0 && localFrame <= durationFrames;

          return (
            <g key={i}>
              <DrawnElement
                el={element}
                progress={progress}
                defaultStroke={strokeColor}
                accentColor={accentColor}
              />
              {isActivelyDrawing && progress < 0.98 && (
                <MarkerTip el={element} progress={progress} color={accentColor} />
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
