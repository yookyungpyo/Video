import React from "react";
import { interpolate } from "remotion";
import { curve, Flash, GLASS, Link, Pulse, Title } from "../components/Fx";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { ICE, clamp, easeInOut } from "../theme";
import { SceneProps } from "./common";

// 04 The turn — the clutter of scene 03 is sucked away, the camera orbits (the card swings in 3D while the
// background slides the other way), and the links between him and the agents switch on one by one.
const F: [number, number] = [0.5, 0.47], R1: [number, number] = [0.5, 0.17], R2: [number, number] = [0.85, 0.29], R3: [number, number] = [0.7, 0.46];

export const Scene04: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[4];
  const c1 = cue(4, 1);
  const tilt = interpolate(g, [from - 6, to + 6], [-8, 8], { ...clamp, easing: easeInOut });
  const links: { at: number; a: [number, number]; via: [number, number]; b: [number, number] }[] = [
    { at: c1 + 2, a: F, via: [0.4, 0.3], b: R1 },
    { at: c1 + 13, a: R1, via: [0.74, 0.13], b: R2 },
    { at: c1 + 24, a: R2, via: [0.88, 0.42], b: R3 },
    { at: c1 + 35, a: R3, via: [0.6, 0.52], b: F },
  ];
  return (
    <>
      <Stage n={4} g={g} tilt={tilt} glow={`rgba(120,200,255,${interpolate(g, [c1, c1 + 40], [0, 0.45], clamp)})`}
        keys={[[from - 6, { z: 1.12, x: 0.42, y: 0.46 }], [to + 6, { z: 1.05, x: 0.6, y: 0.42 }]]}
        overlay={(p) => (
          <>
            <Flash g={g} at={from} color={ICE} peak={0.35} dur={12} />
            {links.map((l, i) => (
              <Link key={i} g={g} at={l.at} until={to + 6} w={p.card.w} h={p.card.h} pts={curve(p.P(...l.a), p.P(...l.via), p.P(...l.b))} packets={6} every={16} travel={16} draw={10} />
            ))}
            {[R1, R2, R3].map((r, i) => {
              const [x, y] = p.P(...r);
              return <Pulse key={i} g={g} at={links[i].at + 9} until={to + 6} x={x} y={y} r={0.1 * p.wi} />;
            })}
          </>
        )}
        front={(p) => (
          <>
            {/* the waiting tasks from scene 03 fly into the ring and are gone */}
            {([[0.17, 0.1, "지시 대기"], [0.8, 0.07, "업무 배분"], [0.17, 0.62, "확인 요청"], [0.79, 0.66, "다음 업무?"]] as [number, number, string][]).map(([x, y, label], i) => {
              const t = interpolate(g, [from - 2 + i * 2, from + 16 + i * 2], [0, 1], { ...clamp, easing: easeInOut });
              if (t >= 1) return null;
              return (
                <div key={i} style={{ ...GLASS, position: "absolute", left: (x + (0.66 - x) * t) * p.card.w, top: (y + (0.32 - y) * t) * p.card.h, transform: `translate(-50%,-50%) scale(${1 - 0.8 * t}) rotate(${t * 40}deg)`, opacity: 1 - t,
                  borderColor: "rgba(255,138,138,0.7)", display: "flex", alignItems: "center", gap: 11, padding: "11px 21px 13px", borderRadius: 23, fontSize: 38, fontWeight: 700, letterSpacing: -0.4, whiteSpace: "nowrap" }}>
                  <span style={{ color: "#FF8A8A", fontWeight: 900 }}>●</span>{label}
                </div>
              );
            })}
          </>
        )} />
      <Title g={g} at={cue(4, 0) + 6} until={c1 + 2} text="AI를 사용하는 조직" size={66} weight={800} from="rise" />
      <Title g={g} at={c1 + 4} until={to + 4} text="AI에게 {맡기는} 조직" size={78} />
    </>
  );
};
