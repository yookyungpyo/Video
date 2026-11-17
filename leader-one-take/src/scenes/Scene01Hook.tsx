import React from "react";
import { SceneProps, SceneView } from "../components/SceneView";
import { SCENES } from "../config/scenes";

// 01 후킹 — Dolly-zoom-like opening on the leader's face.
// With layer files the person (mid) keeps its scale while only the background grows (depth in the scene config).
// With one flat picture this is a 2D push-in around the face — it is not called a dolly zoom anywhere.
export const Scene01Hook: React.FC<SceneProps> = ({ mod }) => <SceneView scene={SCENES[0]} mod={mod} />;
