import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import { ASSETS } from "../camera/assets";
import { SCENES, STARTS } from "../config/scenes";
import { TOTAL_FRAMES } from "../config/video";

// Two separate tracks: narration and background music. Only files that scripts/scan-assets.mjs found are used —
// with no files this renders nothing and the film is silent.
//   public/audio/narration.(mp3|wav|m4a|aac)            one file for the whole film, starts at frame 0
//   public/audio/narration/scene-0X.(mp3|wav|m4a|aac)   or one file per scene, each starts 8 frames into its scene
//   public/audio/bgm.(mp3|wav|m4a|aac)                  music, looped, lowered under narration, faded in and out
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const VOICE_LEAD = 8;

export const AudioTracks: React.FC = () => {
  const { narration, bgm, sceneNarration } = ASSETS.audio;
  const hasVoice = !!narration || Object.keys(sceneNarration).length > 0;
  const bed = hasVoice ? 0.22 : 0.6;
  return (
    <>
      {bgm && <Audio src={staticFile(bgm)} loop volume={(f) => bed * interpolate(f, [0, 20], [0, 1], clamp) * interpolate(f, [TOTAL_FRAMES - 50, TOTAL_FRAMES - 2], [1, 0], clamp)} />}
      {narration && <Audio src={staticFile(narration)} />}
      {SCENES.map((scene, i) => (sceneNarration[scene.id] ? (
        <Sequence key={scene.id} from={STARTS[i] + VOICE_LEAD} layout="none" name={`narration ${scene.id}`}>
          <Audio src={staticFile(sceneNarration[scene.id])} />
        </Sequence>
      ) : null))}
    </>
  );
};
