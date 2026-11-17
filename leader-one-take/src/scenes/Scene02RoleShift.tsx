import React from "react";
import { SceneProps, SceneView } from "../components/SceneView";
import { SCENES } from "../config/scenes";

// 02 역할의 변화 — From behind the leader's shoulder out to the team: pull out 1.18 → 1.02.
// If public/images/scene-02-alt.* exists it is shown first (the view moving behind the shoulder) and joined to the
// main picture by a hidden cut; the camera does not really orbit.
export const Scene02RoleShift: React.FC<SceneProps> = ({ mod }) => <SceneView scene={SCENES[1]} mod={mod} />;
