import React from "react";
import { SceneProps, SceneView } from "../components/SceneView";
import { SCENES } from "../config/scenes";

// 08 최종 결론 — Pull out 1.20 → 1.02 while rising from the seated team to the leader.
// If public/images/scene-08-top.* exists the move ends on that top view (crane-up-like, hidden cut inside the scene).
export const Scene08Conclusion: React.FC<SceneProps> = ({ mod }) => <SceneView scene={SCENES[7]} mod={mod} />;
