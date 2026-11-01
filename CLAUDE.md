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

## 프로젝트 규칙: 이미지 미제공 시 GPT 이미지 생성 (사용자 지정)

**사용자가 이미지(사진·소스 이미지)를 주지 않은 영상/카드뉴스 작업은, 필요한 이미지를 OpenAI GPT 이미지 모델로 생성해서 구현한다.**
- 도구: `openai_image` (`tools/graphics/openai_image.py`, 기본 모델 `gpt-image-1`). 비율에 맞는 `size` 사용
  (9:16 → `1024x1536`, 16:9 → `1536x1024`, 1:1 → `1024x1024`).
- 생성 전에 도구·모델·장수·예상 비용을 한 줄로 알리고 진행 (AGENT_GUIDE의 Decision Communication Contract).
- 사용자가 이미지를 준 경우엔 그 이미지를 우선 사용한다.
- `OPENAI_API_KEY`가 없거나 `openai` 패키지가 없으면 조용히 다른 방식으로 대체하지 말고, 막힌 점을 알리고
  설정(키 등록·`pip install openai`)을 안내한 뒤 사용자 승인 후 진행한다.
- 시리즈 내 일관성(색감·인물·스타일)을 프롬프트에 명시한다. 카드뉴스라면 마스코트 규칙도 함께 지킨다.
