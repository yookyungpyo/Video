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

**사용자가 이미지(사진·소스 이미지)를 주지 않은 영상/카드뉴스 작업은, 필요한 이미지를 GPT 이미지 모델로 생성해서 구현한다.**
- 1순위 경로: 연결된 Higgsfield 커넥터(`mcp__hiqq__generate_image`)의 OpenAI GPT 이미지 모델
  (`gpt_image_2_5` 기본, 또는 `gpt_image_2`). 사용자의 Higgsfield 구독 크레딧을 쓰며 API 키가 필요 없다.
  영상 비율에 맞는 `aspect_ratio`(9:16 / 16:9 / 1:1) 사용.
- 2순위(사용자가 원할 때만): `openai_image` 도구(`gpt-image-1`, `OPENAI_API_KEY` 필요, 사용량 과금).
- ChatGPT 구독(Plus/Pro)은 API 접근을 포함하지 않으므로 이 환경에서 직접 쓸 수 없다. 사용자가 ChatGPT에서
  직접 만든 이미지를 업로드하면 그 이미지를 사용한다.
- 생성 전에 도구·모델·장수·예상 크레딧을 한 줄로 알리고 진행 (AGENT_GUIDE의 Decision Communication Contract).
  가능하면 먼저 견적(estimate)을 확인한다. 크레딧이 부족하면 조용히 다른 모델로 대체하지 말고 알린다.
- 사용자가 이미지를 준 경우엔 그 이미지를 우선 사용한다.
- 시리즈 내 일관성(색감·인물·스타일)을 프롬프트에 명시한다. 카드뉴스라면 마스코트 규칙도 함께 지킨다.
