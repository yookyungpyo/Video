import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { auxOf, layersOf, Picture, pictureOf, sizeOf } from "../camera/assets";
import { CamMod, NO_MOD, Pose, poseAt, SCREEN, solve, View, viewFor } from "../camera/solve";
import { progress } from "../camera/transition";
import { LayerName, SceneConfig } from "../config/types";
import { FRAME, HALF, W } from "../config/video";
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
 * A picture that is not portrait: shown whole in the window, over a blurred, darkened copy of itself that fills
 * the screen and drifts with the camera at a third of its speed. The window's top and bottom edges are feathered,
 * so the sharp picture melts into the backdrop instead of sitting on it like a card.
 */
const Framed: React.FC<{ backdrop: Picture; pose: Pose; children: React.ReactNode }> = ({ backdrop, pose, children }) => {
  const back: Pose = { scale: 1.08 + (pose.scale - 1) * 0.3, focal: [0.5 + (pose.focal[0] - 0.5) * 0.35, 0.5 + (pose.focal[1] - 0.5) * 0.35], x: pose.x * 0.35, y: pose.y * 0.35 };
  const f = FRAME.feather;
  const mask = `linear-gradient(to bottom, transparent 0px, #000 ${f}px, #000 ${FRAME.height - f}px, transparent ${FRAME.height}px)`;
  return (
    <AbsoluteFill style={{ background: "#07090f", overflow: "hidden" }}>
      {/* scaled up a little so the blur's transparent rim stays outside the frame */}
      <AbsoluteFill style={{ filter: "blur(40px) brightness(0.6) saturate(1.1)", transform: "scale(1.14)" }}>
        <Plane picture={backdrop} rect={solve(backdrop, back, [0.5, 0.5], NO_MOD, SCREEN)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(7,9,15,0.5) 0%, rgba(7,9,15,0.12) 26%, rgba(7,9,15,0.12) 70%, rgba(7,9,15,0.55) 100%)" }} />
      <div style={{ position: "absolute", left: 0, top: FRAME.top, width: W, height: FRAME.height, overflow: "hidden", WebkitMaskImage: mask, maskImage: mask }}>{children}</div>
    </AbsoluteFill>
  );
};

/**
 * Draws one scene at the current frame. The frame is read with useCurrentFrame(): every scene sits in a
 * <Sequence> that starts HALF frames before its boundary, so `local` runs from −6 to length + 6.
 *
 *   portrait picture     → fills the screen (cover); wider picture → shown whole in the window (see Framed)
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

  /** A picture with its camera, in whichever layout fits its shape. */
  const shot = (pic: Picture | null, p: Pose, cm: CamMod, planes: (view: View) => React.ReactNode) => {
    const view = viewFor(sizeOf(pic), scene.layout);
    return view.framed && pic ? <Framed backdrop={pic} pose={p}>{planes(view)}</Framed> : <AbsoluteFill>{planes(view)}</AbsoluteFill>;
  };

  const main = (m: CamMod) => {
    const cm = join(mod, m);
    if (layers && depth) {
      return shot(layers.bg, pose, cm, (view) => LAYERS.map((l) => {
        const file = layers[l];
        if (!file) return null;
        const d = depth[l];
        const lp: Pose = {
          scale: first.scale + (pose.scale - first.scale) * d.zoom,
          focal: [first.focal[0] + (pose.focal[0] - first.focal[0]) * d.pan, first.focal[1] + (pose.focal[1] - first.focal[1]) * d.pan],
          x: pose.x * d.pan, y: pose.y * d.pan,
        };
        return <Plane key={l} picture={file} rect={solve(file, lp, scene.anchor, cm, view)} filter={layerFilter?.(l, local)} />;
      }));
    }
    return shot(picture, pose, cm, (view) => {
      const rect = solve(sizeOf(picture), pose, scene.anchor, cm, view);
      return picture ? <Plane picture={picture} rect={rect} /> : <PlaceholderPlane rect={rect} n={scene.n} title={scene.title} file={scene.id} hue={205 + scene.n * 19} />;
    });
  };

  const aux = scene.aux;
  const auxPicture = aux ? auxOf(aux.key) : null;
  if (!aux || !auxPicture) return main(NO_MOD);

  const extra = (m: CamMod) => {
    const p = poseAt(aux.keys, local);
    return shot(auxPicture, p, join(mod, m), (view) => <Plane picture={auxPicture} rect={solve(auxPicture, p, scene.anchor, join(mod, m), view)} />);
  };
  const [a, b] = aux.place === "start" ? [extra, main] : [main, extra];
  if (local < aux.cutAt - HALF) return a(NO_MOD);
  if (local >= aux.cutAt + HALF) return b(NO_MOD);
  return <Transition spec={aux.transition} p={progress(local, aux.cutAt)} a={a} b={b} />;
};
