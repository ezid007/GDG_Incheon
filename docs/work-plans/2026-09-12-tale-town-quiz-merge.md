# 작업 계획: tale-town 퀴즈를 quiz.js 파이프라인으로 통합

날짜: 2026-09-12 · 작성: OpenClaw 에이전트

## 배경

`apps/golmok-detective/data/tale-town-1.json`은 별도 파일로 추가되어 있으나, 현재 저장소의 퀴즈 원본은 `apps/golmok-detective/data/quiz.js`의 `quizzes` 배열이며 `load-quiz.mjs` 로더가 `quiz-support.json`의 검수 항목과 대조해 빌드에 반영한다. 별도 JSON은 빌드에 연결되지 않는다.

## 할 일

1. 이미지 정리
   - `public/images/quiz/tale-town-1/{part,hint}-photo.jpg` → `apps/golmok-detective/data/quiz-images/tale-town-1/`로 이동(검수 원본 위치).
   - 공개용 사본을 `apps/golmok-detective/public/assets/field-taletown-clue.jpg`(1차 장소 찾기), `assets/field-taletown-quiz.jpg`(2차 문제)로 복사.
   - 중복이 된 `public/images/quiz/tale-town-1/`은 저장소에서 제거.
2. `quiz.js`의 `quizzes` 배열에 tale-town 퀴즈 추가
   - 질문: "옆에 날아다니는 가구 중 아닌 것은?"
   - 보기: 의자 / 서랍 / 우산 / 가방, 정답 4번(가방)
   - 좌표: 송월동 동화마을 37.477661, 126.620583
3. `quiz-support.json`에 검수 항목 추가 (`explorationRegionId: "songwol"`, `expectedAnswer: "가방"`), 최상위 `version`을 `field-v3`로 갱신.
4. `tale-town-1.json` 삭제.
5. `node apps/golmok-detective/build.mjs` 빌드, `node --test` 전체 테스트 통과 확인.
6. fetch → rebase → 커밋 → 푸시.

## 완료 기준

- 빌드 산출물에 field 미션 2개(chinatown, songwol)가 포함되고 전체 테스트가 통과한다.
- 원격 main에 반영된다.
