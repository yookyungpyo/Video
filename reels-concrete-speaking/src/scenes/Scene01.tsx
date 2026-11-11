import React from "react";
import { Shot } from "../components/Camera";
import { SceneProps } from "./common";

// 01 Hook — same talk, two reactions. Start on the presenter (both panels), then pan to the audience
// (bored above / surprised below). Subtitle sits on the diagonal divider (see Subtitles in the composition).
export const Scene01: React.FC<SceneProps> = ({ g }) => (
  <Shot n={1} g={g} keys={[
    [0, { z: 1.03, x: 0.2, y: 0.5 }],
    [55, { z: 1.04, x: 0.2, y: 0.5 }],
    [108, { z: 1.05, x: 0.8, y: 0.5 }],
    [160, { z: 1.07, x: 0.8, y: 0.5 }],
  ]} />
);
