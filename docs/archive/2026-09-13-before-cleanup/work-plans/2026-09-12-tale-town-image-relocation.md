# 작업 계획: tale-town-1 이미지 앱 내부로 이동

날짜: 2026-09-12

## 배경

`public/images/quiz/tale-town-1/`는 저장소 루트의 임시 위치이며 빌드 파이프라인이 읽지 않는다. 골목탐정 앱은 `apps/golmok-detective/` 아래 두 위치를 사용한다.

- 검수 원본: `apps/golmok-detective/data/quiz-images/<quizKey>/` — `load-quiz.mjs`가 공개 사본과 바이트 일치를 검증
- 공개 자산: `apps/golmok-detective/public/assets/` — 빌드 시 게임 HTML에 내장

## 할 일

1. `public/images/quiz/tale-town-1/{part,hint}-photo.jpg` → `apps/golmok-detective/data/quiz-images/tale-town-1/`로 `git mv`.
2. 공개 사본을 `apps/golmok-detective/public/assets/field-taletown-clue.jpg`, `field-taletown-quiz.jpg`로 복사.
3. 빈 `public/images/quiz/` 디렉터리 정리.
4. tale-town 퀴즈를 `quiz.js`·`quiz-support.json` 파이프라인에 연결(별도 `tale-town-1.json` 삭제).
5. 빌드와 전체 테스트 통과 확인 후 fetch → rebase → 커밋 → 푸시.

## 완료 기준

- 이미지가 앱 내부 표준 위치에만 존재하고 루트 `public/images/quiz/`는 사라진다.
- 빌드 산출물에 field 미션 2개(chinatown, songwol)가 포함되고 전체 테스트가 통과한다.
- 원격 main에 반영된다.
