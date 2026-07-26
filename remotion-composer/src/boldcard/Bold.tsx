import { useEffect, useState } from "react";
import { AbsoluteFill, Img, staticFile, continueRender, delayRender } from "remotion";

// Bold swipe card-news set (reference style): light page, framed rough-sketch
// illustration, neon-green tag chip, heavy gothic headline, subtitle, page + SWIPE.
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
const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([(document as any).fonts.load(`400 90px "${BHS}"`, "천재부엌"), (document as any).fonts.load(`900 40px "${SANS}"`, "AI")]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

type CardData = { img: string; tag: string; head: string[]; sub: string; page: string; last?: boolean };
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
    <div style={{ position: "absolute", right: 56, bottom: 50, background: GREEN, color: INK, fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 2, padding: "16px 30px", borderRadius: 14 }}>SWIPE →</div>
  </AbsoluteFill>
);

export const CARDS: CardData[] = [
  { img: "boldcard/i1.jpg", tag: "AI 활용법", head: ["천재 셰프(AI)도", "잘 차려줘야 미슐랭"], sub: "AI를 200% 쓰는 7가지 — '부엌' 비유로 쉽게", page: "1 / 9" },
  { img: "boldcard/i2.jpg", tag: "① 프롬프트", head: ["'밥 해줘' 말고", "구체적으로 주문하라"], sub: "매콤 김치볶음밥, 계란 반숙, 2인분처럼 명확하게", page: "2 / 9" },
  { img: "boldcard/i3.jpg", tag: "② 컨텍스트", head: ["우리 부엌 사정을", "먼저 알려줘라"], sub: "냄비는 싱크대 아래, 애는 안 매운 걸로, 새우 알레르기", page: "3 / 9" },
  { img: "boldcard/i4.jpg", tag: "③ 스킬", head: ["반복 작업은", "레시피 카드로"], sub: "'된장찌개는 이 순서, 이 비율' → 매번 같은 맛", page: "4 / 9" },
  { img: "boldcard/i5.jpg", tag: "④ 명령어", head: ["자주 쓰는 주문은", "단축 버튼으로"], sub: "/아침세트 → 토스트+계란+커피 자동으로 뚝딱", page: "5 / 9" },
  { img: "boldcard/i6.jpg", tag: "⑤ 플러그인", head: ["부엌에 없는 건", "밖과 연결해 조달"], sub: "재료 없네? → 마트앱 연결, 셰프가 알아서 주문", page: "6 / 9" },
  { img: "boldcard/i7.jpg", tag: "⑥ 하네스", head: ["요리하는 주방", "그 자체가 필요하다"], sub: "불·물·팬이 있어야 머릿속 레시피가 진짜 요리가 됨", page: "7 / 9" },
  { img: "boldcard/i8.jpg", tag: "⑦ 루프", head: ["맛보고 고치기를", "반복하라"], sub: "간 보고 → 소금 넣고 → 다시 간 보고, 될 때까지", page: "8 / 9" },
  { img: "boldcard/i9.jpg", tag: "결론", head: ["AI가 무능한 게 아니다", "당신이 안 차려준 것이다"], sub: "잘 차려주는 사람이, 결국 AI를 이긴다", page: "9 / 9", last: true },
];

export const BoldCard: React.FC<{ i: number }> = ({ i }) => <Card d={CARDS[i]} />;
