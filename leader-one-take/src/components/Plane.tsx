import React from "react";
import { Img, staticFile } from "remotion";
import { Picture, PLACEHOLDER } from "../camera/assets";
import { Rect } from "../camera/solve";

/** One picture (or layer) drawn at the rectangle the camera solved. */
export const Plane: React.FC<{ picture: Picture; rect: Rect; filter?: string }> = ({ picture, rect, filter }) => (
  <Img src={staticFile(picture.src)} style={{ position: "absolute", left: rect.left, top: rect.top, width: rect.width, height: rect.height, maxWidth: "none", filter }} />
);

/**
 * Stand-in for a scene whose picture does not exist yet. It is drawn in picture space and moved by the same
 * rectangle as a real picture, so camera moves and transitions can be judged before any image is final.
 */
export const PlaceholderPlane: React.FC<{ rect: Rect; n: number; title: string; file: string; hue: number }> = ({ rect, n, title, file, hue }) => {
  const k = rect.width / PLACEHOLDER.width;
  const cell = 144;
  return (
    <div style={{ position: "absolute", left: rect.left, top: rect.top, width: PLACEHOLDER.width, height: PLACEHOLDER.height, transform: `scale(${k})`, transformOrigin: "0 0",
      background: `linear-gradient(160deg, hsl(${hue} 34% 30%), hsl(${hue + 40} 38% 14%))`, overflow: "hidden", fontFamily: "'Pretendard', sans-serif", color: "#fff" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.10) 2px, transparent 2px)", backgroundSize: `${cell}px ${cell}px` }} />
      <div style={{ position: "absolute", left: "50%", top: "42%", width: 520, height: 520, marginLeft: -260, marginTop: -260, borderRadius: "50%", border: "6px dashed rgba(255,255,255,0.45)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "42%", transform: "translateY(-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 210, fontWeight: 900, lineHeight: 1, opacity: 0.9 }}>{String(n).padStart(2, "0")}</div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 18 }}>{title}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "62%", textAlign: "center", fontSize: 34, fontWeight: 600, opacity: 0.75 }}>
        이미지 없음 · public/images/{file}.png
      </div>
    </div>
  );
};
