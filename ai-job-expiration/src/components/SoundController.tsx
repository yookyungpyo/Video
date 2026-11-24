import React from "react";
import { Audio, staticFile } from "remotion";

/**
 * Sound. Every key click, send, answer tick, heartbeat, bass hit and the music are placed by
 * scripts/build_audio.py on the frames of the same timeline the picture uses, and mixed into one track.
 */
export const SoundController: React.FC = () => <Audio src={staticFile("audio/track.mp4")} />;
