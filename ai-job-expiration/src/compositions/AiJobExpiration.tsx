import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import { AutoScroll } from "../components/AutoScroll";
import { CameraZoom } from "../components/CameraZoom";
import { ChatHeader } from "../components/ChatHeader";
import { ChatInput } from "../components/ChatInput";
import { EndingScreen } from "../components/EndingScreen";
import { SoundController } from "../components/SoundController";
import { APP, C, clamp, fontCss } from "../theme";

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(h);
    const fonts = (document as any).fonts;
    Promise.all([500, 600, 700, 800].map((w) => fonts.load(`${w} 40px "Pretendard"`, "가A?"))).then(() => fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// One continuous chat screen from the first frame to the fade: the app is never reset or cut.
export const AiJobExpiration: React.FC = () => {
  const g = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.page }}>
      <FontLoader />
      {/* the page around the app: only a faint violet haze (these are the areas Instagram covers) */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 40% at 20% 78%, rgba(109,40,217,0.16), rgba(109,40,217,0) 70%), radial-gradient(ellipse 60% 35% at 90% 30%, rgba(76,29,149,0.14), rgba(76,29,149,0) 70%)" }} />
      <div style={{ position: "absolute", left: APP.x, top: APP.y, width: APP.w, height: APP.h, borderRadius: APP.radius, overflow: "hidden", background: C.app, boxShadow: "0 0 0 1.5px rgba(255,255,255,0.1), 0 0 70px rgba(109,40,217,0.22)" }}>
        <CameraZoom g={g}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 34% at 0% 86%, rgba(109,40,217,0.2), rgba(109,40,217,0) 70%), radial-gradient(ellipse 40% 30% at 100% 55%, rgba(76,29,149,0.12), rgba(76,29,149,0) 70%)" }} />
          <AutoScroll g={g} />
          <ChatHeader />
          <ChatInput g={g} />
        </CameraZoom>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [0, 8], [1, 0], clamp) }} />
      <EndingScreen g={g} />
      <SoundController />
    </AbsoluteFill>
  );
};
