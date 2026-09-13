# 현장 4지선다 문제 작성·검수

확인 날짜: 2026-09-13 · 적용 버전: `unified-three-missions-v1` · Node.js 22/24 정적 웹

## 현재 원본과 사진

`apps/golmok-detective/data/quiz-support.json`이 유일한 콘텐츠 원본입니다. 이전 `quiz.js`·`data/quiz-images`와 두 파일의 정답/사진 대조 방식은 사용을 중단했습니다. 사진은 `public/assets/quiz/<문제폴더>/`에서 한 번만 관리합니다. 현재 폴더는 `gate`, `pinocchio`, `taletown`입니다.

`reviews` 배열의 순서가 실제 문제 1·2·3 순서입니다. `examples`의 가상 예시는 실제 목록에 섞지 않습니다. 문제마다 사진으로 장소 찾기→도착→현장 4지선다→정답 해설로 진행합니다.

## 출제자가 전달할 내용

```text
문제 ID: 영문 소문자·숫자·하이픈
검수 키(quizKey): 다른 문제와 중복 없이
장소 이름(운영자 참고):
탐색 구역: chinatown 또는 songwol
장소 찾기 안내: 정답을 미리 알려주지 않는 문장
1차 장소 찾기 사진(image)과 실제 내용 설명(imageAlt):
2차 현장 문제 사진(quizImage)과 설명(quizImageAlt):
질문:
보기 a:
보기 b:
보기 c:
보기 d:
정답(expectedAnswer): 정답 보기의 label과 정확히 같은 문구
현장 관찰 힌트:
정답 해설:
정답 근거와 확인 출처:
선택: 정답 사진(answerImage), 설명(answerImageAlt), 근거 지점(evidence):
현장 확인 날짜 및 검수 결과:
```

사진은 질문·설명과 실제 내용이 일치해야 합니다. 동화마을처럼 주변 전경만 제공된 경우 벽화 전체를 보여준다고 쓰지 않습니다. 정답 근거 사진이 없으면 현장 관찰과 출제자 확인에 의존한다는 제한을 검수 기록에 남깁니다. 필요 없는 개인정보가 담긴 사진은 그대로 공개하지 않습니다.

## 데이터 규칙

- 실제 문제는 `sceneKind: "field"`, 보기 ID·문구가 중복되지 않는 4개 선택지입니다. 예시는 `example`, 3개 선택지입니다.
- `id`와 `quizKey`는 각각 고유해야 합니다. 기존 공유 링크를 유지하기 위해 문제 ID를 임의로 바꾸지 않습니다.
- `expectedAnswer`는 보기의 `label`과 정확히 한 번 일치해야 합니다. `reviews`에 `answerId`를 따로 쓰지 않습니다. 로더가 변환합니다.
- `image`는 장소 찾기용입니다. `quizImage`가 있으면 2차에서 사용하며, 없으면 `image`로 대체합니다. `answerImage`는 맞힌 뒤에만 화면에 표시합니다.
- 이미지 경로 예: `assets/quiz/pinocchio/field-pinocchio-quiz.jpg`. 영문 소문자·숫자·하이픈 폴더/파일명과 SVG/JPG/JPEG/PNG/WebP를 지원합니다. 절대 경로·상위 폴더 이동·외부 URL은 받지 않습니다.
- `evidence: {"x": 50, "y": 40}`은 사진 내부 백분율입니다. 정답 위치 GPS가 아닙니다. 현장 문제의 정답 표시점은 별도 `answerImage`가 있을 때만 표시합니다. 정답 사진 없이 남아 있는 근거 좌표는 화면에 사용하지 않습니다.
- `explorationRegionId`는 기존 넓은 탐색 영역을 고르는 내부 값입니다. 지역별 탭을 만들지 않습니다. `explorationDescription`에는 그 문제의 단서 안내를 씁니다.
- 별도 검수한 범위만 `explorationArea: {latitude, longitude, radiusMeters}`로 지정합니다. `geoCoordinates`만 있다고 지도에 정확한 핀을 찍거나 도착을 인증하지 않습니다.
- 순서·선택지·정답·진행 의미가 바뀌면 최상위 `version`도 갱신합니다. 현재 값은 `unified-three-missions-v1`입니다.

## 검증·반영 절차

1. 출제자의 질문·정답·사진 사용 시점을 검수합니다. 단일 JSON으로 통합하면서 이전의 별도 검수본 바이트 비교는 사라졌으므로 이미지 교체도 코드 변경과 함께 리뷰합니다.
2. `quiz-support.json`과 사진을 수정합니다. JSON Schema는 작성 보조이고 실제 빌드 검증은 `quiz-schema.mjs`와 `mission-validation.mjs`가 담당합니다.
3. 빌드 후 첫 안내→3문제 세로 목록→도착→오답 재시도→정답 사진/해설→다음 문제 또는 목록을 확인합니다.
4. 일반·시연 진행의 분리와 새로고침 복원을 확인합니다. 320/390px에서 이미지·보기·가로 넘침을 확인합니다.
5. 생성 HTML도 함께 커밋합니다. **현재 Pages와 배포 워크플로는 중단 상태이므로 푸시만으로 공개되지 않습니다.**

```sh
node apps/golmok-detective/build.mjs
node --test apps/golmok-detective/tests/*.test.mjs
```

기존 링크 형식: `map.html?quiz=inhwamun-plaque`, `./?play=field&quiz=pinocchio-clouds`, `./?demo=arrival&quiz=taletown-mural`.

이번 병합 빌드 성공, 75개 중 73개 통과. 나머지 2개는 기존 로컬 HTTP 응답 필터 HTTP 간섭입니다. 실제 현장 GPS 및 동화마을 벽화 전체 근거 사진은 별도 확인합니다. 새 패키지·API·환경 변수는 없습니다.

근거: [프로젝트 소스](https://github.com/ezid007/GDG_Incheon/tree/main/apps/golmok-detective), [정답·좌표 검수 기록](work-plans/2026-09-12-tale-town-quiz-merge.md), [현장 검수 기록](field-missions.md).
