import React from "react";
import { SceneProps, SceneView } from "../components/SceneView";
import { SCENES } from "../config/scenes";

// 04 사람에 대한 이해 — Lateral tracking along the team: the picture slides from +80 px to −80 px with one ease in-out.
export const Scene04Understanding: React.FC<SceneProps> = ({ mod }) => <SceneView scene={SCENES[3]} mod={mod} />;
