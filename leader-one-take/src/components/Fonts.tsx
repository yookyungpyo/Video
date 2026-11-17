import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

export const FONT = "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
const css = [["SemiBold", 600], ["Bold", 700], ["ExtraBold", 800], ["Black", 900]]
  .map(([name, weight]) => `@font-face { font-family: 'Pretendard'; font-weight: ${weight}; src: url('${staticFile(`fonts/Pretendard-${name}.woff2`)}') format('woff2'); }`)
  .join("\n");

/** Loads Pretendard from public/fonts and holds the render until it is ready, so no frame uses a fallback font. */
export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender("pretendard"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([600, 700, 800, 900].map((w) => (document as any).fonts.load(`${w} 40px "Pretendard"`, "가")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};
