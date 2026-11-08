import { Img, staticFile } from "remotion";
import { Trend } from "./data";
import { STORIES } from "./stories/Stories";
import {
  CARD, ORANGE, POSTER_H, POSTER_W, Rect, STORY, clamp01, easeInOut, lerp, lerpRect, prog, tileRect,
} from "./theme";
import { Section } from "./timing";
import { Frame, SceneLabel } from "./ui";

const progIO = (f: number, at: number, dur: number) => prog(f, at, dur, easeInOut);

// image placement inside a frame for a camera (zoom z relative to "poster fits CARD", focal fx/fy in poster coords)
const camera = (rect: Rect, z0: number, fx: number, fy: number) => {
  const z = Math.max(z0, rect.w / POSTER_W, rect.h / POSTER_H); // always cover the frame — no empty edges
  const wi = POSTER_W * z;
  const hi = POSTER_H * z;
  const ox = Math.min(0, Math.max(rect.w - wi, rect.w / 2 - fx * wi));
  const oy = Math.min(0, Math.max(rect.h - hi, rect.h / 2 - fy * hi));
  return { wi, hi, ox, oy };
};

export const TrendScene: React.FC<{ f: number; trend: Trend; sec: Section }> = ({ f, trend, sec }) => {
  const st = sec.stage!;
  const S = st.A;
  const END = sec.start + sec.frames;
  if (f < S || f >= END) return null;
  const i = trend.n - 1;
  const tile = tileRect(i);

  // ---- frame rect: tile → story canvas → poster card → tile ----
  let rect: Rect;
  if (f < st.C) rect = lerpRect(tile, STORY, progIO(f, S, 20));
  else if (f < st.E) rect = lerpRect(STORY, CARD, progIO(f, st.C, 32));
  else rect = lerpRect(CARD, tile, progIO(f, st.E, 22));
  const op = Math.min(prog(f, S, 10), 1 - prog(f, END - 10, 10));

  // ---- camera ----
  const [b0, b1] = trend.band;
  const bandMid = (b0 + b1) / 2;
  const zB = Math.max(STORY.h / ((b1 - b0) * POSTER_H), STORY.w / POSTER_W);
  const [cx0, cy0, cx1, cy1] = trend.core;
  const coreMid = [(cx0 + cx1) / 2, (cy0 + cy1) / 2];
  let z: number, fx: number, fy: number;
  if (f < st.C) {
    const t = clamp01((f - st.B) / Math.max(1, st.C - st.B));
    z = zB * (1 + 0.05 * t);
    fx = lerp(trend.drift[0], trend.drift[1], easeInOut(t));
    fy = bandMid;
  } else {
    const m = progIO(f, st.C, 32);
    const d = progIO(f, st.D, 70);
    z = lerp(zB * 1.05, 1, m) + 0.025 * d;
    fx = lerp(lerp(trend.drift[1], 0.5, m), coreMid[0], d);
    fy = lerp(lerp(bandMid, 0.5, m), coreMid[1], d);
  }
  const cam = camera(rect, z, fx, fy);
  const P = (x: number, y: number) => [cam.ox + x * cam.wi, cam.oy + y * cam.hi];

  // ---- layers ----
  const storyOp = 1 - prog(f, st.B + 8, 16);
  const reveal = progIO(f, st.B, 22);
  const radius = Math.hypot(rect.w, rect.h) * 0.55 * reveal;
  const glowA = prog(f, st.B + 10, 20) * (1 - prog(f, st.C, 16));
  const titleA = prog(f, st.C + 26, 16) * (1 - prog(f, st.D, 14));
  const coreA = prog(f, st.D, 16) * (1 - prog(f, st.E, 10));
  const sheen = clamp01((f - st.D) / 45);
  const Story = STORIES[trend.id];
  const storyScale = Math.max(rect.w / STORY.w, rect.h / STORY.h);

  const box = (b: [number, number, number, number], pad: number) => {
    const [x0, y0] = P(b[0], b[1]);
    const [x1, y1] = P(b[2], b[3]);
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
  };
  const tb = box(trend.title, 8);
  const cb = box(trend.core, 6);
  const perim = (r: { w: number; h: number }) => 2 * (r.w + r.h);

  return (
    <>
      <SceneLabel f={f} text={`TREND ${trend.id} / 10`} from={S + 8} to={st.C + 6} />
      <Frame x={rect.x} y={rect.y} w={rect.w} h={rect.h} r={rect.r} op={op}>
        {storyOp > 0 && (
          <div style={{
            position: "absolute", left: (rect.w - STORY.w * storyScale) / 2, top: (rect.h - STORY.h * storyScale) / 2,
            width: STORY.w, height: STORY.h, transform: `scale(${storyScale})`, transformOrigin: "0 0", opacity: storyOp,
          }}>
            <Story f={f} sec={sec} trend={trend} />
          </div>
        )}
        {f >= st.B && (
          <div style={{ position: "absolute", inset: 0, clipPath: reveal < 1 ? `circle(${radius}px at 50% 50%)` : undefined }}>
            <Img src={staticFile(trend.image)} style={{ position: "absolute", left: cam.ox, top: cam.oy, width: cam.wi, height: cam.hi }} />
            {/* soft light pulses on the illustration's own elements */}
            {glowA > 0 && trend.glows.map(([gx, gy], k) => {
              const [px, py] = P(gx, gy);
              const pulse = 0.5 + 0.5 * Math.sin((f - st.B) / 30 * Math.PI * 1.2 - k * 1.3);
              const r = 70 * (cam.wi / (POSTER_W * zB));
              return (
                <div key={k} style={{
                  position: "absolute", left: px - r, top: py - r, width: r * 2, height: r * 2, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,236,200,0.95) 0%, rgba(255,214,150,0.35) 45%, rgba(255,214,150,0) 70%)",
                  mixBlendMode: "screen", opacity: glowA * (0.25 + 0.45 * pulse),
                }} />
              );
            })}
            {/* one sheen pass when the core line is highlighted */}
            {sheen > 0 && sheen < 1 && (
              <div style={{
                position: "absolute", top: 0, bottom: 0, width: rect.w * 0.35, left: lerp(-rect.w * 0.4, rect.w * 1.05, sheen),
                background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)",
                mixBlendMode: "soft-light",
              }} />
            )}
            {/* outlines around the printed keyword and the printed 핵심 한 줄 (never over the text) */}
            <svg width={rect.w} height={rect.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {titleA > 0 && (
                <rect x={tb.x} y={tb.y} width={tb.w} height={tb.h} rx={18} fill="none" stroke={ORANGE} strokeWidth={4}
                  strokeDasharray={perim(tb)} strokeDashoffset={perim(tb) * (1 - prog(f, st.C + 26, 22))} opacity={titleA}
                  style={{ filter: "drop-shadow(0 0 6px rgba(242,106,27,0.55))" }} />
              )}
              {coreA > 0 && (
                <rect x={cb.x} y={cb.y} width={cb.w} height={cb.h} rx={24} fill="none" stroke={ORANGE}
                  strokeWidth={3 + 2 * (0.5 + 0.5 * Math.sin((f - st.D) / 30 * Math.PI * 1.4))}
                  strokeDasharray={perim(cb)} strokeDashoffset={perim(cb) * (1 - prog(f, st.D, 22))} opacity={coreA}
                  style={{ filter: "drop-shadow(0 0 8px rgba(242,106,27,0.5))" }} />
              )}
            </svg>
          </div>
        )}
      </Frame>
    </>
  );
};
