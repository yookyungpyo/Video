import { useEffect, useState } from "react";
import { AbsoluteFill, Img, staticFile, continueRender, delayRender } from "remotion";

// "도둑놈" bold swipe card-news set. Same locked bold layout as src/boldcard,
// new topic + illustrations (public/thief/).
const BHS = "Black Han Sans";
const SANS = "Noto Sans KR";
const INK = "#1B1B1E";
const SUB = "#6A6A70";
const GREEN = "#CBF54A";
const ORANGE = "#F26B21";
const PAGE = "#F3F2EF";

const fontCss = `
@font-face{font-family:'${BHS}';font-weight:400;src:url('${staticFile("fonts/black-han-sans-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${SANS}';font-weight:900;src:url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2');}
`;
export const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([(document as any).fonts.load(`400 90px "${BHS}"`, "천재부엌"), (document as any).fonts.load(`900 40px "${SANS}"`, "AI")]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

export type CardData = { img: string; tag: string; head: string[]; sub: string; page: string; last?: boolean };
const Card: React.FC<{ d: CardData }> = ({ d }) => (
  <AbsoluteFill style={{ background: PAGE }}>
    <Fonts />
    <div style={{ position: "absolute", left: 56, top: 52, width: 968, height: 656, background: "#FFFFFF", borderRadius: 30, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #ECEAE4" }}>
      <Img src={staticFile(d.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <div style={{ position: "absolute", left: 60, top: 762, background: d.last ? ORANGE : GREEN, color: d.last ? "#fff" : INK, fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 1, padding: "12px 26px", borderRadius: 12 }}>{d.tag}</div>
    <div style={{ position: "absolute", left: 56, top: 866, width: 984, fontFamily: BHS, fontSize: 104, lineHeight: 1.16, color: INK, letterSpacing: -1 }}>
      {d.head.map((l, i) => <div key={i} style={{ color: d.last && i === d.head.length - 1 ? ORANGE : INK }}>{l}</div>)}
    </div>
    <div style={{ position: "absolute", left: 62, top: 1116, width: 956, fontFamily: SANS, fontWeight: 700, fontSize: 42, lineHeight: 1.35, color: SUB }}>{d.sub}</div>
    <div style={{ position: "absolute", left: 64, bottom: 62, fontFamily: SANS, fontWeight: 900, fontSize: 42, color: "#A7A49C" }}>{d.page}</div>
    <div style={{ position: "absolute", right: 56, bottom: 50, background: d.last ? ORANGE : GREEN, color: d.last ? "#fff" : INK, fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 2, padding: "16px 30px", borderRadius: 14 }}>{d.last ? "끝." : "SWIPE →"}</div>
  </AbsoluteFill>
);

export const CARDS: CardData[] = [
  { img: "thief/i1.jpg", tag: "돌직구", head: ["잘 거 다 자고", "놀 거 다 놀았다"], sub: "그런데 왜 대접은 남보다 잘 받길 바라나?", page: "1 / 7" },
  { img: "thief/i2.jpg", tag: "① 시간", head: ["똑같은 24시간", "똑같이 썼다"], sub: "쉴 때 쉬고 즐길 때 즐기고 — 남들과 판박이", page: "2 / 7" },
  { img: "thief/i3.jpg", tag: "② 착각", head: ["그런데 결과는", "나만 특별하길"], sub: "같은 걸 하고 다른 결과를 바라는 건 그냥 욕심", page: "3 / 7" },
  { img: "thief/i4.jpg", tag: "③ 자리", head: ["더 받는 자린", "이미 임자가 있다"], sub: "남들 잘 때 깨어 있던 사람이 가져간 자리", page: "4 / 7" },
  { img: "thief/i5.jpg", tag: "④ 팩트", head: ["그걸 넘보는 게", "도둑놈 심보다"], sub: "치른 값도 없이 남의 몫을 탐내는 것", page: "5 / 7" },
  { img: "thief/i6.jpg", tag: "⑤ 전환", head: ["부럽다면 방법은", "딱 하나뿐"], sub: "샘내지 말고, 남들 멈출 때 한 발 더", page: "6 / 7" },
  { img: "thief/i7.jpg", tag: "결론", head: ["대접은 조르는 게", "아니라 버는 것"], sub: "값을 치른 만큼, 세상은 정확히 돌려준다", page: "7 / 7", last: true },
];

export const ThiefCard: React.FC<{ i: number }> = ({ i }) => <Card d={CARDS[i]} />;
