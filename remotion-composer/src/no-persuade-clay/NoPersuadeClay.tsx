import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  AUDIO,
  CAPTION,
  CAPTIONS,
  CHARCOAL,
  CapGroup,
  DISSOLVE,
  FADE_OUT_FRAMES,
  HEIGHT,
  IVORY,
  SCENES,
  Scene,
  TOTAL_FRAMES,
  WIDTH,
} from "./timeline";

const SANS = "Noto Sans KR";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- fonts (local files in public/fonts) ----------
const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`700 60px "${SANS}"`, "가"),
      (document as any).fonts.load(`900 60px "${SANS}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ---------- image scenes with a slow, frame-based camera ----------
const SceneImage: React.FC<{ f: number; scene: Scene }> = ({ f, scene }) => {
  if (f < scene.from || f >= scene.to) return null;
  const end = scene.zoomEnd ?? scene.to;
  const easing = scene.zoomEnd ? Easing.out(Easing.quad) : Easing.inOut(Easing.sin);
  const z = interpolate(f, [scene.from, end], [1, scene.zoomTo], { ...clamp, easing });
  const op = scene.in === "dissolve"
    ? interpolate(f, [scene.from, scene.from + DISSOLVE], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) })
    : 1;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Img
        src={staticFile(scene.image)}
        style={{
          width: WIDTH,
          height: HEIGHT,
          objectFit: "cover", // keeps the 941×1672 source ratio — never stretched
          transform: `scale(${z})`,
          transformOrigin: `${scene.origin[0]}px ${scene.origin[1]}px`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- captions ----------
const Caption: React.FC<{ f: number; g: CapGroup }> = ({ f, g }) => {
  if (f < g.from || f >= g.to) return null;
  const fade = g.brisk ? CAPTION.fadeFrames - 1 : CAPTION.fadeFrames;
  const rise = g.brisk ? 18 : 12;
  const out = interpolate(f, [g.to - 6, g.to], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: CAPTION.left, right: CAPTION.right, top: CAPTION.top, opacity: out }}>
      {g.lines.map((l, i) => {
        if (f < l.at) return null;
        const p = interpolate(f, [l.at, l.at + fade], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const size = Math.max(CAPTION.baseSize, ...l.segs.map((s) => s.s ?? CAPTION.baseSize));
        return (
          <div key={i} style={{
            fontSize: size, lineHeight: CAPTION.lineHeight, whiteSpace: "nowrap",
            opacity: p, transform: `translateY(${(1 - p) * rise}px)`,
          }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{
                fontSize: s.s ?? CAPTION.baseSize,
                fontWeight: s.w ?? 700,
                color: s.c ?? CHARCOAL,
                letterSpacing: -1,
              }}>{s.t}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ---------- root ----------
export const NoPersuadeClay: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL_FRAMES - FADE_OUT_FRAMES, TOTAL_FRAMES - 1], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: IVORY, fontFamily: `'${SANS}', sans-serif`, overflow: "hidden" }}>
      <FontLoader />
      {/* the original audio track, start to end, untouched */}
      <Audio src={staticFile(AUDIO)} />
      {SCENES.map((s) => <SceneImage key={s.id} f={f} scene={s} />)}
      <AbsoluteFill style={{ textShadow: "0 0 18px rgba(245,237,226,0.9), 0 0 4px rgba(245,237,226,0.8)" }}>
        {CAPTIONS.map((g, i) => <Caption key={i} f={f} g={g} />)}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: IVORY, opacity: endFade }} />
    </AbsoluteFill>
  );
};
