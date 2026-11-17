import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { auxOf, layersOf, pictureOf, sizeOf } from "../camera/assets";
import { CamMod, NO_MOD, Pose, poseAt, solve } from "../camera/solve";
import { progress } from "../camera/transition";
import { LayerName, SceneConfig } from "../config/types";
import { HALF } from "../config/video";
import { PlaceholderPlane, Plane } from "./Plane";
import { Transition } from "./Transition";

const LAYERS: LayerName[] = ["bg", "mid", "fg"];
const join = (a: CamMod, b: CamMod): CamMod => ({ scaleMul: a.scaleMul * b.scaleMul, dx: a.dx + b.dx, dy: a.dy + b.dy });

export type SceneProps = { mod?: CamMod };
type Props = SceneProps & {
  scene: SceneConfig;
  /** Extra CSS filter per layer (only called when layer files exist), e.g. a focus pull. */
  layerFilter?: (layer: LayerName, local: number) => string | undefined;
};

/**
 * Draws one scene at the current frame. The frame is read with useCurrentFrame(): every scene sits in a
 * <Sequence> that starts HALF frames before its boundary, so `local` runs from −6 to length + 6.
 *
 *   layer files present  → bg / mid / fg each get their own camera (depth from the scene config) = real parallax
 *   one flat picture     → one camera, a plain 2D move
 *   no picture at all    → a placeholder card moved by the same camera
 *   extra view present   → shown before/after the main picture, joined by a hidden cut inside the scene
 */
export const SceneView: React.FC<Props> = ({ scene, mod = NO_MOD, layerFilter }) => {
  const local = useCurrentFrame() - HALF;
  const pose = poseAt(scene.keys, local);
  const first = poseAt(scene.keys, scene.keys[0].f);
  const depth = scene.depth;
  const layers = layersOf(scene.id);
  const picture = pictureOf(scene.id);

  const main = (m: CamMod) => {
    const cm = join(mod, m);
    if (layers && depth) {
      return (
        <AbsoluteFill>
          {LAYERS.map((l) => {
            const file = layers[l];
            if (!file) return null;
            const d = depth[l];
            const lp: Pose = {
              scale: first.scale + (pose.scale - first.scale) * d.zoom,
              focal: [first.focal[0] + (pose.focal[0] - first.focal[0]) * d.pan, first.focal[1] + (pose.focal[1] - first.focal[1]) * d.pan],
              x: pose.x * d.pan, y: pose.y * d.pan,
            };
            return <Plane key={l} picture={file} rect={solve(file, lp, scene.anchor, cm)} filter={layerFilter?.(l, local)} />;
          })}
        </AbsoluteFill>
      );
    }
    const rect = solve(sizeOf(picture), pose, scene.anchor, cm);
    return <AbsoluteFill>{picture ? <Plane picture={picture} rect={rect} /> : <PlaceholderPlane rect={rect} n={scene.n} title={scene.title} file={scene.id} hue={205 + scene.n * 19} />}</AbsoluteFill>;
  };

  const aux = scene.aux;
  const auxPicture = aux ? auxOf(aux.key) : null;
  if (!aux || !auxPicture) return main(NO_MOD);

  const extra = (m: CamMod) => <AbsoluteFill><Plane picture={auxPicture} rect={solve(auxPicture, poseAt(aux.keys, local), scene.anchor, join(mod, m))} /></AbsoluteFill>;
  const [a, b] = aux.place === "start" ? [extra, main] : [main, extra];
  if (local < aux.cutAt - HALF) return a(NO_MOD);
  if (local >= aux.cutAt + HALF) return b(NO_MOD);
  return <Transition spec={aux.transition} p={progress(local, aux.cutAt)} a={a} b={b} />;
};
