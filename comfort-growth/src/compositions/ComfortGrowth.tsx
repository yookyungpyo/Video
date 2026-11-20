import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BrushWipe, brushOpenMask, inkSpreadMask } from "../components/Ink";
import { Emphasis, Subtitle } from "../components/Subtitle";
import { SCENE_T, TIMING, VOICE_SYNCED } from "../data";
import { FONT, INK, PANEL, PAPER, SAFE, clamp, easeInOut, easeOut, easeSine, fontCss } from "../theme";
import { Scene01 } from "../scenes/Scene01";
import { Scene02 } from "../scenes/Scene02";
import { Scene03 } from "../scenes/Scene03";
import { Scene04 } from "../scenes/Scene04";
import { Scene05 } from "../scenes/Scene05";
import { Scene06 } from "../scenes/Scene06";
import { Scene07 } from "../scenes/Scene07";
import { Scene08 } from "../scenes/Scene08";
import { Scene09 } from "../scenes/Scene09";
import type { SceneProps } from "../scenes/common";

// Scene order and how each scene comes in (frames = length of the change, centred on the scene boundary).
//   dissolve  one picture fades into the next
//   ink       the next picture bleeds in like ink on wet paper
//   shadow    the big shadow of scene 04 closes over the page; scene 05 comes up out of it
//   brush     one broad stroke slashes the page in two and the cut opens onto the next scene — the turning point
type Enter = { kind: "cut" | "dissolve" | "ink" | "shadow" | "brush"; frames: number };
const SCENES: { n: number; C: React.FC<SceneProps>; enter: Enter }[] = [
  { n: 1, C: Scene01, enter: { kind: "cut", frames: 0 } },
  { n: 2, C: Scene02, enter: { kind: "ink", frames: 22 } },
  { n: 3, C: Scene03, enter: { kind: "dissolve", frames: 16 } },
  { n: 4, C: Scene04, enter: { kind: "ink", frames: 22 } },
  { n: 5, C: Scene05, enter: { kind: "shadow", frames: 30 } },
  { n: 6, C: Scene06, enter: { kind: "brush", frames: 30 } },
  { n: 7, C: Scene07, enter: { kind: "dissolve", frames: 18 } },
  { n: 8, C: Scene08, enter: { kind: "dissolve", frames: 16 } },
  { n: 9, C: Scene09, enter: { kind: "dissolve", frames: 22 } },
];
const LAST = SCENES[SCENES.length - 1].n;

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("pretendard"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([600, 700, 800, 900].map((w) => (document as any).fonts.load(`${w} 40px "Pretendard"`, "가")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

/** The closing words, in the middle of the frame: each line arrives with the sentence it belongs to. */
const Ending: React.FC<{ g: number }> = ({ g }) => {
  const lines = SCENE_T[LAST].chunks.filter((c) => c.center);
  if (!lines.length || g < lines[0].start - 2) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left - 20, width: SAFE.right - SAFE.left + 40, top: PANEL.cy - 150, height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22,
      fontFamily: FONT, color: INK, textAlign: "center", whiteSpace: "nowrap", letterSpacing: -1.5 }}>
      {lines.map((c, i) => {
        const a = interpolate(g, [c.start - 2, c.start + 14], [0, 1], { ...clamp, easing: easeOut });
        return (
          <div key={i} style={{ opacity: a, transform: `translateY(${(1 - a) * 14}px)`, fontWeight: i === 0 ? 600 : 700, fontSize: i === 0 ? 50 : 58, lineHeight: 1.2, textShadow: `0 0 18px ${PAPER}, 0 0 6px ${PAPER}` }}>
            <Emphasis text={c.text} scale={1.2} />
          </div>
        );
      })}
    </div>
  );
};

export const ComfortGrowth: React.FC = () => {
  const g = useCurrentFrame();
  const total = TIMING.totalFrames;
  const at = (n: number) => SCENE_T[n].from;
  const shadow = SCENES.find((s) => s.enter.kind === "shadow")!;
  const brush = SCENES.find((s) => s.enter.kind === "brush")!;
  const sp = interpolate(g, [at(shadow.n) - shadow.enter.frames / 2, at(shadow.n) + shadow.enter.frames / 2], [0, 1], clamp);
  const bp = interpolate(g, [at(brush.n) - brush.enter.frames / 2, at(brush.n) + brush.enter.frames / 2], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <FontLoader />
      {SCENES.map(({ n, C, enter }, i) => {
        const t = SCENE_T[n];
        const next = SCENES[i + 1]?.enter ?? { kind: "cut", frames: 0 };
        if (g < t.from - enter.frames / 2 - 1 || g > t.to + next.frames / 2 + 1) return null;
        const p = enter.frames ? interpolate(g, [t.from - enter.frames / 2, t.from + enter.frames / 2], [0, 1], clamp) : 1;
        // shadow: the page is fully covered at the boundary, so the scene simply appears there
        const alpha = enter.kind === "dissolve" ? easeSine(p) : enter.kind === "shadow" ? (p >= 0.5 ? 1 : 0) : enter.kind === "ink" ? Math.min(1, p * 4) : 1;
        return (
          <AbsoluteFill key={n} style={enter.kind === "ink" ? inkSpreadMask(p) : enter.kind === "brush" ? brushOpenMask(p) : undefined}>
            <C g={g} alpha={alpha} />
          </AbsoluteFill>
        );
      })}
      {/* the shadow: dark ink wash that grows down from the top until the page is covered, then thins out */}
      {sp > 0 && sp < 1 && (
        <AbsoluteFill style={{ opacity: interpolate(sp, [0, 0.45, 0.55, 1], [0, 1, 1, 0], { ...clamp, easing: easeInOut }),
          background: `linear-gradient(to bottom, #171717 ${Math.min(100, sp * 2.3 * 100 - 12)}%, rgba(23,23,23,0.55) ${Math.min(100, sp * 2.3 * 100 + 18)}%, rgba(23,23,23,${sp >= 0.45 ? 1 : 0.15}) 100%)` }} />
      )}
      <BrushWipe p={bp} />
      {SCENES.flatMap(({ n }) => {
        const t = SCENE_T[n];
        return t.chunks.map((c, j) => {
          if (c.center) return null;
          const lastShown = j === t.chunks.length - 1 || t.chunks[j + 1].center;
          return <Subtitle key={`${n}-${j}`} g={g} c={c} size={n === 1 ? 1.1 : 1} end={lastShown ? Math.min(c.end, n === LAST ? c.end : t.to) - (n === LAST ? 4 : 6) : c.end} />;
        });
      })}
      <Ending g={g} />
      {/* in from paper at the start; after the last word everything holds, then fades back to paper */}
      <AbsoluteFill style={{ background: PAPER, opacity: interpolate(g, [0, 6], [1, 0], clamp) }} />
      <AbsoluteFill style={{ background: PAPER, opacity: interpolate(g, [total - 26, total - 2], [0, 1], { ...clamp, easing: easeSine }) }} />
      {!VOICE_SYNCED && (
        <div style={{ position: "absolute", left: 90, top: 372, padding: "10px 18px", borderRadius: 10, background: "rgba(150,30,30,0.92)", color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 30 }}>
          무음 미리보기 · 임시 타이밍 (내레이션 필요)
        </div>
      )}
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
