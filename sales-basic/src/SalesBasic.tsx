import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/800.css";
import React, { useEffect, useState } from "react";
import { fitText } from "@remotion/layout-utils";
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame,
} from "remotion";
import { Caption, HOOK_VOICE, SAFE, SCENES, STYLE, Scene, VIDEO, VOICE } from "./config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const ALL_TEXT = SCENES.flatMap((s) => s.captions.map((c) => c.text.replace(/\*\*/g, ""))).join("");

// ── photo layer ──────────────────────────────────────────────
const SceneImage: React.FC<{ scene: Scene; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const next = SCENES[index + 1];
  const half = STYLE.crossfade / 2;
  const fadeIn = scene.transitionIn === "fade";
  const start = fadeIn ? scene.from - half : scene.from;
  const end = next && next.transitionIn === "fade" ? scene.to + half : scene.to;
  if (frame < start || frame >= end) return null;

  const opacity = fadeIn ? interpolate(frame, [scene.from - half, scene.from + half], [0, 1], clamp) : 1;
  const t = interpolate(frame, [scene.from, scene.to], [0, 1], clamp);
  const scale = interpolate(ease(t), [0, 1], scene.zoom);

  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      <Img
        src={staticFile(scene.image)}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${scale})`, transformOrigin: scene.origin,
        }}
      />
    </AbsoluteFill>
  );
};

// ── caption line ─────────────────────────────────────────────
const renderMarked = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") ? (
      <span key={i} style={{
        fontWeight: STYLE.emphasisWeight,
        backgroundImage: "linear-gradient(transparent 64%, rgba(20,33,61,0.16) 64%, rgba(20,33,61,0.16) 92%, transparent 92%)",
      }}>{part.slice(2, -2)}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

const usableWidth = VIDEO.width - SAFE.left - SAFE.right;
const sizeFor = (c: Caption) => {
  const target = c.size ?? STYLE.captionSize;
  const { fontSize } = fitText({
    text: c.text.replace(/\*\*/g, ""),
    withinWidth: usableWidth,
    fontFamily: STYLE.fontFamily,
    fontWeight: String(STYLE.emphasisWeight), // measure with the bold weight so emphasis never overflows
  });
  return Math.min(target, Math.floor(fontSize));
};

const CaptionLine: React.FC<{ c: Caption }> = ({ c }) => {
  const frame = useCurrentFrame();
  const to = c.to ?? VIDEO.durationInFrames + 1;
  if (frame < c.from || frame >= to) return null;
  const inK = interpolate(frame, [c.from, c.from + STYLE.fadeIn], [0, 1], { ...clamp, easing: ease });
  const outK = c.to === undefined ? 1 : interpolate(frame, [to - STYLE.fadeOut, to], [1, 0], clamp);
  const size = sizeFor(c);
  return (
    <div style={{
      opacity: inK * outK,
      transform: `translateY(${(1 - inK) * STYLE.rise}px)`,
      fontSize: size,
      lineHeight: STYLE.lineHeight,
      whiteSpace: "nowrap",
      letterSpacing: "-0.01em",
    }}>
      {renderMarked(c.text)}
    </div>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const scene = SCENES.find((s) => frame >= s.from && frame < s.to) ?? SCENES[SCENES.length - 1];
  return (
    <div style={{
      position: "absolute", top: STYLE.captionTop, left: SAFE.left, right: SAFE.right,
      maxHeight: VIDEO.height - STYLE.captionTop - SAFE.bottom,
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      fontFamily: STYLE.fontFamily, fontWeight: STYLE.baseWeight, color: STYLE.textColor,
      textShadow: "0 0 22px rgba(255,255,255,0.75), 0 0 6px rgba(255,255,255,0.6)",
    }}>
      {scene.captions.map((c, i) => <CaptionLine key={`${scene.id}-${i}`} c={c} />)}
    </div>
  );
};

// ── composition ──────────────────────────────────────────────
export const SalesBasic: React.FC = () => {
  const [handle] = useState(() => delayRender("Loading Korean fonts"));
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    Promise.all([
      document.fonts.load(`${STYLE.baseWeight} 64px "${STYLE.fontFamily}"`, ALL_TEXT),
      document.fonts.load(`${STYLE.emphasisWeight} 64px "${STYLE.fontFamily}"`, ALL_TEXT),
    ])
      .then(() => document.fonts.ready)
      .then(() => { setFontsReady(true); continueRender(handle); })
      .catch((e) => { console.error(e); continueRender(handle); });
  }, [handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#E9DFD2" }}>
      {SCENES.map((s, i) => <SceneImage key={s.id} scene={s} index={i} />)}
      {fontsReady && <Captions />}
      {HOOK_VOICE.enabled && (
        <Sequence from={HOOK_VOICE.at} layout="none">
          <Audio src={staticFile(HOOK_VOICE.file)} volume={HOOK_VOICE.volume} />
        </Sequence>
      )}
      {VOICE.enabled && VOICE.lines.map((l, i) => {
        const a = Math.round(l.src[0] * VIDEO.fps), b = Math.round(l.src[1] * VIDEO.fps);
        return (
          <Sequence key={i} from={l.at} durationInFrames={b - a + 6} layout="none">
            <Audio src={staticFile(VOICE.file)} trimBefore={a} trimAfter={b + 6} volume={VOICE.volume} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
