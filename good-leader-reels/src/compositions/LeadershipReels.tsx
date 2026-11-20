import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Subtitle, SubtitleShade } from "../components/Subtitle";
import { SCENE_T, TIMING, VOICE_SYNCED } from "../data";
import { FONT, clamp, easeSine, fontCss } from "../theme";
import { Scene01 } from "../scenes/Scene01";
import { Scene02 } from "../scenes/Scene02";
import { Scene03 } from "../scenes/Scene03";
import { Scene04 } from "../scenes/Scene04";
import { Scene05 } from "../scenes/Scene05";
import { Scene06 } from "../scenes/Scene06";
import { Scene07 } from "../scenes/Scene07";
import { Scene08 } from "../scenes/Scene08";
import type { SceneProps } from "../scenes/common";

// Scene order and how each scene comes in. Restrained on purpose: soft dissolves, and one dip through black
// before the turn in scene 06. `frames` is the length of the change, centred on the scene boundary.
type Enter = { kind: "cut" | "dissolve" | "dip"; frames: number };
const SCENES: { n: number; C: React.FC<SceneProps>; enter: Enter }[] = [
  { n: 1, C: Scene01, enter: { kind: "cut", frames: 0 } },
  { n: 2, C: Scene02, enter: { kind: "dissolve", frames: 14 } },
  { n: 3, C: Scene03, enter: { kind: "dissolve", frames: 16 } },
  { n: 4, C: Scene04, enter: { kind: "dissolve", frames: 14 } },
  { n: 5, C: Scene05, enter: { kind: "dissolve", frames: 16 } },
  { n: 6, C: Scene06, enter: { kind: "dip", frames: 26 } },
  { n: 7, C: Scene07, enter: { kind: "dissolve", frames: 20 } },
  { n: 8, C: Scene08, enter: { kind: "dissolve", frames: 24 } },
];

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("pretendard"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([600, 700, 800].map((w) => (document as any).fonts.load(`${w} 40px "Pretendard"`, "가")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

export const LeadershipReels: React.FC = () => {
  const g = useCurrentFrame();
  const total = TIMING.totalFrames;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <FontLoader />
      {SCENES.map(({ n, C, enter }, i) => {
        const t = SCENE_T[n];
        const next = SCENES[i + 1]?.enter ?? { kind: "cut", frames: 0 };
        if (g < t.from - enter.frames / 2 - 1 || g > t.to + next.frames / 2 + 1) return null;
        const p = enter.frames ? interpolate(g, [t.from - enter.frames / 2, t.from + enter.frames / 2], [0, 1], { ...clamp, easing: easeSine }) : 1;
        // dissolve: fade in over the previous scene. dip: the scene appears only in the second half, out of black.
        const alpha = enter.kind === "dip" ? interpolate(p, [0.5, 1], [0, 1], clamp) : p;
        return <C key={n} g={g} alpha={alpha} />;
      })}
      {SCENES.filter((s) => s.enter.kind === "dip").map(({ n, enter }) => {
        const at = SCENE_T[n].from;
        const dark = interpolate(g, [at - enter.frames / 2, at, at + 2], [0, 1, 1], { ...clamp, easing: easeSine });
        return g <= at + 2 && dark > 0 ? <AbsoluteFill key={n} style={{ background: "#000", opacity: dark }} /> : null;
      })}
      <SubtitleShade />
      {SCENES.flatMap(({ n }) => {
        const t = SCENE_T[n];
        return t.chunks.map((c, j) => <Subtitle key={`${n}-${j}`} g={g} c={c} end={j < t.chunks.length - 1 ? c.end : Math.min(t.to - 5, t.voiceEnd + 22)} />);
      })}
      {/* in from black at the start; the last second lingers and then fades slowly */}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [0, 7], [1, 0], clamp) }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [total - 20, total - 1], [0, 1], { ...clamp, easing: easeSine }) }} />
      {!VOICE_SYNCED && (
        <div style={{ position: "absolute", left: 90, top: 372, padding: "10px 18px", borderRadius: 10, background: "rgba(180,40,40,0.9)", color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 30 }}>
          임시 타이밍 · 음성 싱크 미완료
        </div>
      )}
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
