import React from "react";
import { SceneProps, SceneView } from "../components/SceneView";
import { SCENES } from "../config/scenes";

// 06 문제 해결 — Push in 1.03 → 1.16 on the team member who is stuck.
export const Scene06Problem: React.FC<SceneProps> = ({ mod }) => <SceneView scene={SCENES[5]} mod={mod} />;
