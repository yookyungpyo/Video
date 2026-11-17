import React from "react";
import { SceneProps } from "../components/SceneView";
import { Scene01Hook } from "./Scene01Hook";
import { Scene02RoleShift } from "./Scene02RoleShift";
import { Scene03Direction } from "./Scene03Direction";
import { Scene04Understanding } from "./Scene04Understanding";
import { Scene05Roles } from "./Scene05Roles";
import { Scene06Problem } from "./Scene06Problem";
import { Scene07Growth } from "./Scene07Growth";
import { Scene08Conclusion } from "./Scene08Conclusion";

/** Scene components in film order (same order as SCENES in config/scenes.ts). */
export const SCENE_COMPONENTS: React.FC<SceneProps>[] = [Scene01Hook, Scene02RoleShift, Scene03Direction, Scene04Understanding, Scene05Roles, Scene06Problem, Scene07Growth, Scene08Conclusion];
