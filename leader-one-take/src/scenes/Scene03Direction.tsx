import React from "react";
import { SceneProps, SceneView } from "../components/SceneView";
import { SCENES } from "../config/scenes";

// 03 방향 재정립 — Pan from the chart to the leader, then push in 1.05 → 1.15 on him explaining.
export const Scene03Direction: React.FC<SceneProps> = ({ mod }) => <SceneView scene={SCENES[2]} mod={mod} />;
