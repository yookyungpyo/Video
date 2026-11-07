import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/900.css";
import React, { useEffect, useState } from "react";
import { fitText } from "@remotion/layout-utils";
import { AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BGM, COLORS, Caption, MOTION, SCENES, Scene, TEXT_BOX, TYPE, VIDEO } from "./config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const BOX_W = TEXT_BOX.right - TEXT_BOX.left;
const plain = (s: string) => s.replace(/\*\*/g, "");

// ── image layer ──
const SceneImage: React.FC<{ s: Scene; i: number }> = ({ s, i }) => {
  const f = useCurrentFrame();
  const fade = s.transitionIn === "fade";
  const start = fade ? s.from - MOTION.crossfade : s.from;
  if (f < start || f >= s.to) return null;
  const op = fade ? interpolate(f, [s.from - MOTION.crossfade, s.from], [0, 1], clamp) : 1;
  // current shot (hard cut between shots)
  const si = Math.max(0, s.shots.findIndex((sh, k) => f >= sh.from && (k === s.shots.length - 1 || f < s.shots[k + 1].from)));
  const shot = s.shots[si];
  const shotEnd = si < s.shots.length - 1 ? s.shots[si + 1].from : s.to;
  const t = ease(interpolate(f, [shot.from, shotEnd], [0, 1], clamp));
  const scale = interpolate(t, [0, 1], shot.zoom);
  const px = shot.pan ? interpolate(t, [0, 1], [shot.pan.from[0], shot.pan.to[0]]) : 0;
  const py = shot.pan ? interpolate(t, [0, 1], [shot.pan.from[1], shot.pan.to[1]]) : 0;
  const src = staticFile(s.image);
  const move = { transformOrigin: shot.origin, transform: `translate(${px}px, ${py}px) scale(${scale})` };

  if (s.fit === "cover") {
    return (
      <AbsoluteFill style={{ opacity: op, overflow: "hidden", zIndex: i }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", ...move }} />
      </AbsoluteFill>
    );
  }
  // fit: full image across the width, blurred copy of the same image fills the rest
  return (
    <AbsoluteFill style={{ opacity: op, overflow: "hidden", zIndex: i, backgroundColor: COLORS.backdrop }}>
      <Img src={src} style={{ position: "absolute", inset: -60, width: "calc(100% + 120px)", height: "calc(100% + 120px)", objectFit: "cover",
        filter: "blur(36px) brightness(0.55) saturate(1.1)" }} />
      <div style={{ position: "absolute", left: 0, top: s.fitTop ?? 0, width: "100%", ...move }}>
        <Img src={src} style={{ width: "100%", display: "block",
          maskImage: "linear-gradient(180deg, transparent 0, #000 40px, #000 calc(100% - 60px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0, #000 40px, #000 calc(100% - 60px), transparent 100%)" }} />
      </div>
    </AbsoluteFill>
  );
};

// ── captions ──
const Marked: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split("\n").map((ln, li) => (
      <div key={li}>
        {ln.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p, i) =>
          p.startsWith("**") ? <span key={i} style={{ fontWeight: TYPE.boldWeight, color: COLORS.accent }}>{p.slice(2, -2)}</span> : <span key={i}>{p}</span>,
        )}
      </div>
    ))}
  </>
);
const fitSize = (text: string, target: number) =>
  Math.min(target, ...plain(text).split("\n").map((ln) =>
    Math.floor(fitText({ text: ln, withinWidth: BOX_W, fontFamily: TYPE.fontFamily, fontWeight: String(TYPE.boldWeight) }).fontSize)));

const CaptionLine: React.FC<{ c: Caption }> = ({ c }) => {
  const f = useCurrentFrame();
  if (f < c.from || (c.to !== undefined && f >= c.to)) return null;
  const k = c.noFadeIn ? 1 : interpolate(f, [c.from, c.from + MOTION.textIn], [0, 1], { ...clamp, easing: ease });
  const out = c.to === undefined ? 1 : interpolate(f, [c.to - MOTION.textOut, c.to], [1, 0], clamp);
  const size = fitSize(c.text, c.size ?? TYPE.size);
  return (
    <div style={{ position: "absolute", left: TEXT_BOX.left, width: BOX_W, top: TEXT_BOX.top, textAlign: "center",
      fontSize: size, fontWeight: TYPE.weight, lineHeight: TYPE.lineHeight, letterSpacing: "-0.015em",
      color: c.color === "accent" ? COLORS.accent : COLORS.text, opacity: k * out, transform: `translateY(${(1 - k) * MOTION.rise}px)`,
      textShadow: "0 2px 14px rgba(0,20,30,0.55)" }}>
      <Marked text={c.text} />
    </div>
  );
};

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const s = SCENES.find((x) => f >= x.from && f < x.to) ?? SCENES[SCENES.length - 1];
  return <>{s.captions.map((c, i) => <CaptionLine key={`${s.id}-${i}`} c={c} />)}</>;
};

export const LastImpression: React.FC = () => {
  const [handle] = useState(() => delayRender("Loading Korean fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sample = SCENES.flatMap((s) => s.captions.map((c) => plain(c.text))).join("") + "“”‘’";
    Promise.all([TYPE.weight, TYPE.boldWeight].map((w) => document.fonts.load(`${w} 64px "${TYPE.fontFamily}"`, sample)))
      .then(() => document.fonts.ready)
      .then(() => { setReady(true); continueRender(handle); })
      .catch((e) => { console.error(e); continueRender(handle); });
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.backdrop, fontFamily: TYPE.fontFamily }}>
      {SCENES.map((s, i) => <SceneImage key={s.id} s={s} i={i} />)}
      {ready && <div style={{ position: "absolute", inset: 0, zIndex: 100 }}><Captions /></div>}
      {BGM.enabled && <Audio src={staticFile(BGM.file)} volume={BGM.volume} />}
    </AbsoluteFill>
  );
};
