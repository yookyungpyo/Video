# OpenMontage

**MANDATORY: Read [`AGENT_GUIDE.md`](AGENT_GUIDE.md) before responding to ANY user message.**

Do not act on the user's request until you have read AGENT_GUIDE.md.
It contains routing rules that determine your first action based on what the user asked.
Skipping it WILL cause you to take the wrong action.

There are no instructions in this file. All instructions are in AGENT_GUIDE.md.

---

## 프로젝트 규칙: 카드뉴스 마스코트 (사용자 지정)

**카드뉴스(card news / 카드형 콘텐츠)를 만들 때는 반드시 브랜드 마스코트 캐릭터를 등장시킨다.**
캐릭터 에셋과 외형 스펙은 [`assets/brand/CARD_NEWS_CHARACTER.md`](assets/brand/CARD_NEWS_CHARACTER.md)
및 [`assets/brand/mascot.png`](assets/brand/mascot.png) 참고. 시리즈 전반에서 외형(둥근 검정 안경·곱슬
검은 머리·파우더블루 블레이저)을 일관되게 유지할 것.

## 프로젝트 규칙: 이미지가 필요할 때 — 사용자가 직접 만들어 준다 (사용자 지정)

**이미지(사진·장면 이미지)가 필요한데 사용자가 주지 않았으면, 자동 생성하지 말고 사용자에게 요청한다.**
사용자가 자신의 ChatGPT 구독으로 직접 만들어서 업로드한다.
- 요청할 때 장면별 "샷 리스트"를 준다: 번호, 용도(어느 장면), 비율(9:16 / 16:9 / 1:1),
  ChatGPT에 그대로 붙여넣을 수 있는 한국어 프롬프트, 시리즈 일관성 지시(색감·인물·조명·스타일).
- 이미지를 기다리는 동안 이미지와 무관한 작업(스토리보드, 모션, 효과음, 음성 대본)은 먼저 진행해도 된다.
- 업로드된 이미지는 화면 캡처면 UI를 잘라내고, 비율에 맞게 크롭해서 사용한다.
- Higgsfield(`mcp__hiqq__generate_image`)나 `openai_image` 같은 유료 이미지 생성은
  사용자가 명시적으로 요청할 때만 사용한다.
- 카드뉴스라면 마스코트 규칙도 함께 지킨다.

## 프로젝트 규칙: 작업 전 시놉시스 먼저 (사용자 지정)

**영상 제작(새 영상이든 수정이든)을 시작하기 전에 시놉시스를 먼저 보여주고 승인을 받은 뒤 작업한다.**
- 시놉시스에 들어갈 것: 한 줄 콘셉트, 길이·비율, 장면별 흐름(시간·화면·자막·음성 대사·효과음),
  배경/색감/폰트, 사용할 이미지(없으면 샷 리스트), 음성 사용 여부.
- 선택이 필요한 부분은 질문을 한 번에 하나씩 하고, 추천안을 함께 제시한다.
- 승인 전에는 렌더링·유료 생성(음성·이미지)을 하지 않는다.
