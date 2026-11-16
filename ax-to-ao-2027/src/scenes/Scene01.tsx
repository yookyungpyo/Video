import React from "react";
import { interpolate, spring } from "remotion";
import { Flash, Title } from "../components/Fx";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { FONT, FPS, H, ICE, SAFE, W, WHITE, clamp } from "../theme";
import { SceneProps } from "./common";

// 01 Hook — "2027년" lands big; fast push-in on "당신은!", the frame opens up on "우리는!", a hard beat hit on
// "회사는!", and the whole frame lights up for "이렇게 바뀌어야 한다!". Shouted words punch in below the card.
const WORDS = ["", "당신은!", "우리는!", "회사는!", "이렇게 {바뀌어야} 한다!"];

export const Scene01: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[1];
  const c = (i: number) => cue(1, i);
  const hit = (at: number, amp: number) => (g >= at ? amp * Math.exp(-(g - at) / 4) : 0);
  const punch = hit(c(1), 0.03) + hit(c(2), 0.03) + hit(c(3), 0.07) + hit(c(4), 0.05);
  const glowA = interpolate(g, [c(4), c(4) + 10], [0, 0.6], clamp);
  return (
    <>
      <Stage n={1} g={g} punch={punch} glow={`rgba(120,200,255,${glowA})`} keys={[
        [from, { z: 1.06, x: 0.5, y: 0.45 }],
        [c(1) - 1, { z: 1.0, x: 0.5, y: 0.5 }],
        [c(1) + 6, { z: 1.34, x: 0.44, y: 0.5 }],     // 당신은! — fast push-in on the pointing hand
        [c(2) - 1, { z: 1.36, x: 0.44, y: 0.5 }],
        [c(2) + 9, { z: 1.0, x: 0.5, y: 0.5 }],       // 우리는! — the frame opens up
        [c(3) - 1, { z: 1.0, x: 0.5, y: 0.5 }],
        [c(3) + 4, { z: 1.14, x: 0.52, y: 0.42 }],    // 회사는! — beat hit
        [c(4), { z: 1.1, x: 0.52, y: 0.42 }],
        [to + 8, { z: 1.2, x: 0.5, y: 0.4 }],
      ]} overlay={() => (
        <>
          <Flash g={g} at={c(1)} peak={0.22} />
          <Flash g={g} at={c(2)} peak={0.18} />
          <Flash g={g} at={c(3)} peak={0.34} />
          <Flash g={g} at={c(4)} color={ICE} peak={0.3} dur={12} />
        </>
      )} />
      <Title g={g} at={c(0)} until={to + 4} text="{2027}년" size={124} />
      {WORDS.map((w, i) => {
        if (!w) return null;
        const at = c(i);
        const until = i < 4 ? c(i + 1) : to + 4;
        const a = interpolate(g, [at - 1, at + 2], [0, 1], clamp) * interpolate(g, [until - 3, until], [1, 0], clamp);
        if (a <= 0) return null;
        const s = spring({ frame: g - at, fps: FPS, config: { damping: 11, stiffness: 240, mass: 0.6 } });
        return (
          <div key={i} style={{ position: "absolute", left: 0, width: W, bottom: H - SAFE.bottom + 20, textAlign: "center", opacity: a, transform: `scale(${1.5 - 0.5 * s})`,
            fontFamily: FONT, fontWeight: 900, fontSize: i < 4 ? 116 : 78, letterSpacing: -3, lineHeight: 1.1, color: WHITE, textShadow: "0 6px 28px rgba(0,0,0,0.7)" }}>
            {w.split(/(\{[^}]+\})/).map((p, j) => p.startsWith("{") ? <span key={j} style={{ color: ICE }}>{p.slice(1, -1)}</span> : <span key={j}>{p}</span>)}
          </div>
        );
      })}
    </>
  );
};
