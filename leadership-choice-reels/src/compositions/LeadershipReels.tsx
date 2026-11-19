import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Streaks, Wash } from "../components/Comic";
import { Subtitle } from "../components/Subtitle";
import { DUR, Kind, panelState, progress } from "../components/transitions";
import { SCENE_T, TIMING } from "../data";
import { clamp, fontCss } from "../theme";
import { Scene01 } from "../scenes/Scene01";
import { Scene02 } from "../scenes/Scene02";
import { Scene03 } from "../scenes/Scene03";
import { Scene04 } from "../scenes/Scene04";
import { Scene05 } from "../scenes/Scene05";
import { Scene06 } from "../scenes/Scene06";
import { Scene07 } from "../scenes/Scene07";
import { Scene08 } from "../scenes/Scene08";
import type { SceneProps } from "../scenes/common";

// Scene order and the change that brings each scene in. Strong where the story is loud, soft where it is quiet.
const SCENES: { n: number; C: React.FC<SceneProps>; enter: Kind }[] = [
  { n: 1, C: Scene01, enter: "none" },        // the panel lands (Scene01 does it itself)
  { n: 2, C: Scene02, enter: "slide-left" },  // panel slide
  { n: 3, C: Scene03, enter: "slide-up" },    // panel slide, calmer
  { n: 4, C: Scene04, enter: "dim" },         // through the dark
  { n: 5, C: Scene05, enter: "flash" },       // a burst of light
  { n: 6, C: Scene06, enter: "slide-right" }, // panel slide, gentle
  { n: 7, C: Scene07, enter: "speed" },       // speed lines
  { n: 8, C: Scene08, enter: "dissolve" },    // soft
];

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("pretendard"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([700, 800].map((w) => (document as any).fonts.load(`${w} 40px "Pretendard"`, "가")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

export const LeadershipReels: React.FC = () => {
  const g = useCurrentFrame();
  const total = TIMING.totalFrames;
  const live = SCENES.map((s, i) => {
    const t = SCENE_T[s.n];
    const out: Kind = SCENES[i + 1]?.enter ?? "none";
    const visible = g >= t.from - Math.ceil(DUR[s.enter] / 2) && g < t.to + Math.ceil(DUR[out] / 2) + 1;
    return { ...s, t, out, visible, state: panelState(g, t.from, t.to, s.enter, out) };
  }).filter((s) => s.visible);
  const cutOf = (n: number) => SCENE_T[n].from;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <FontLoader />
      {/* all pages first, then all panels: a panel that slides out stays above the page that fades in */}
      {live.map(({ n, C, state }) => <C key={`bg${n}`} g={g} layer="bg" state={state} />)}
      {live.map(({ n, C, state }) => <C key={`p${n}`} g={g} layer="panel" state={state} />)}
      <Wash g={g} at={cutOf(4)} before={11} after={12} color="#05060f" peak={0.72} />
      <Wash g={g} at={cutOf(5)} before={4} after={13} color="#FFF4C2" peak={0.92} />
      <Streaks g={g} p={progress(g, cutOf(7), "speed")} color="#FFF3C4" />
      {SCENES.map(({ n }) => <Subtitle key={n} g={g} c={SCENE_T[n].subtitle} />)}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [total - 9, total - 1], [0, 1], clamp) }} />
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
