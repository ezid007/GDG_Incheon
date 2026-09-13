# 현장 4지선다 문제 작성

확인일: 2026-09-13 · 콘텐츠 버전: `unified-three-missions-v1`

## 원본과 입력 양식

`apps/golmok-detective/data/quiz-support.json`이 유일한 콘텐츠 원본입니다. `reviews` 순서가 실제 문제 순서이며, `examples`의 가상 예시는 실제 지도 목록에서 제외합니다. 사진은 `public/assets/quiz/<문제폴더>/`에 한 번만 저장합니다.

```text
id / quizKey: 각각 중복 없는 영문 소문자·숫자·하이픈
sourceId: 출제 자료의 식별자
sceneKind: field
explorationRegionId: chinatown 또는 songwol
placeLabel: 장소 설명
explorationDescription: 정답을 미리 알리지 않는 탐색 안내
image / imageAlt: 1차 장소 찾기 사진과 실제 내용 설명
quizImage / quizImageAlt: 도착 후 질문 사진과 설명(선택)
question: 현장에서 확인할 질문
options: a·b·c·d의 4개 보기
expectedAnswer: 정답 보기의 label과 정확히 같은 문구
hint: 현장에서 관찰할 부분
explanation / evidenceQuote: 정답 해설과 확인 근거
evidence: 사진 내부 위치 {x: 50, y: 40}
answerImage / answerImageAlt: 정답 후 근거 사진과 설명(선택)
```

실제 문제의 필수 항목과 허용 형식은 `data/quiz-schema.mjs`, 실행 데이터 규칙은 `mission-validation.mjs`를 기준으로 합니다. `data/quiz-support.schema.json`은 편집기 작성 보조입니다.

## 데이터·사진 규칙

- `expectedAnswer`는 4개 보기 중 정확히 하나의 `label`과 일치해야 합니다. `reviews`에 `answerId`를 별도로 관리하지 않습니다.
- 로더가 검수 정답을 보기 ID로 변환합니다. 보기 문구와 정답을 따로 수정해 어긋나게 만들지 않습니다.
- `image`는 장소 찾기, `quizImage`는 도착 후 질문, `answerImage`는 정답 후 공개입니다. 질문 사진이 없으면 장소 찾기 사진을 사용합니다.
- 이미지 경로는 `assets/quiz/pinocchio/field-pinocchio-quiz.jpg`와 같은 공개 폴더 기준 상대 경로입니다. 외부 URL·절대 경로·상위 폴더 이동은 허용하지 않습니다.
- `evidence`의 x·y는 사진 내부 0~100 범위입니다. GPS 좌표가 아닙니다. 정답 사진이 없으면 현장 문제의 근거 표시점은 화면에 그리지 않습니다.
- `geoCoordinates`는 참고 값입니다. 검수한 별도 탐색 범위만 `explorationArea: {latitude, longitude, radiusMeters}`로 지정합니다.
- 기존 문제 ID를 바꾸면 공유 주소와 진행 기록에 영향을 줍니다. 순서·보기·정답·진행 의미가 바뀌면 콘텐츠 `version`도 갱신합니다.
- 사진 이름만 보고 역할을 정하지 않습니다. 실제 내용과 현장·출제자 근거를 [검수 문서](field-missions.md)에 남깁니다.

## 추가·수정 절차

1. 출제자의 질문·4개 보기·확정 정답과 사진 사용 시점을 검토합니다.
2. 필요한 사진만 공개 사진 폴더에 넣고 단일 JSON을 수정합니다. 사용하지 않는 원본은 `reference/` 또는 비공개 자료 위치에 보존합니다.
3. 빌드·데이터 검사를 실행하고, 1차 → 도착 → 오답 → 정답 해설 흐름을 직접 확인합니다.
4. 모바일 사진 순서, 정답 전 사진 노출, 일반·시연 기록 분리를 확인합니다.
5. 현재 검수 문서와 루트 PLAN을 갱신하고 검증한 소스·데이터·생성 HTML을 함께 검토합니다. 배포는 별도 요청이 있을 때만 진행합니다.

```sh
node apps/golmok-detective/build.mjs
node --test apps/golmok-detective/tests/*.test.mjs
```

기존 연결 예: `map.html?quiz=inhwamun-plaque`, `./?play=field&quiz=pinocchio-clouds`, `./?demo=arrival&quiz=taletown-mural`.

[작업 순서와 파일 관리](development-workflow.md) · [원본 데이터](../apps/golmok-detective/data/quiz-support.json)
