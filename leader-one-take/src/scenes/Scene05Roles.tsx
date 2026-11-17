import React from "react";
import { SceneProps, SceneView } from "../components/SceneView";
import { SCENES } from "../config/scenes";

// 05 역할 배치 — Tilt down to the notes on the board, then rise and widen.
// If public/images/scene-05-top.* exists the rise ends on that top view (hidden cut inside the scene).
export const Scene05Roles: React.FC<SceneProps> = ({ mod }) => <SceneView scene={SCENES[4]} mod={mod} />;
