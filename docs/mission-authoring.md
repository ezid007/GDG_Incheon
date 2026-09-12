# 현장 4지선다 문제 전달 양식

확인 날짜: 2026-09-12 · 적용: 차이나타운 골목탐정 정적 웹, `field` 미션

팀원이 작성한 문제를 검수한 뒤 게임에 반영한다. 현재 관문 문제 1개를 실제 미션으로 반영하고 예시 3개는 준비 중인 구역의 시연용으로 보존한다. 자료가 준비되기 전에는 실제 장소의 문제·정답을 임의로 만들지 않는다.

## 한 문제에 필요한 자료

아래 내용을 복사해 `docs/quiz-이름.md`에 작성하고 사진은 `apps/golmok-detective/data/quiz-images/이름/`에 함께 올린다. 현재 팀원 자료는 `apps/golmok-detective/data/quiz.js`와 `data/quiz-images/inhwamun/`에 있다. 초안이 곧 검수 완료를 뜻하지는 않는다.

```text
미션 이름:
장소 이름(운영진 확인용):
넓은 탐색 구역: 예) 안내지도에서 입구를 지나 첫 골목 주변
찾아가는 단서: 정답 장소를 정확한 핀으로 알려주지 않는 짧은 문장
1차 장소 찾기 부분 사진 파일:
2차 현장 퀴즈 사진 파일:
사진 설명: 정답을 미리 말하지 않는 설명
질문:
A:
B:
C:
D:
정답: A / B / C / D 중 하나
정답 근거: 실제 현장에서 어느 부분을 확인했는지
근거 위치: 문제 사진의 어느 부분인지
확인 사진 파일: 필요한 경우 별도의 원본 사진
해설:
추가 관찰 안내: 정답 자체를 공개하지 않는 문장
확인 날짜와 현장 확인 여부:
```

- 서로 구분되는 선택지 **4개**, 정답 **1개**가 필요하다. 같은 말을 반복한 선택지는 넣지 않는다.
- 질문으로 묻는 글자·이름·사진은 지도나 이동 안내, 힌트에서 먼저 공개하지 않는다. 원본 사진이 답을 보여주면 정답 확인용 자료로 구분해 전달한다.
- 넓은 탐색 구역은 지도 위 위치 설명이나 표시한 참고 사진으로 전달할 수 있다. **GPS 좌표는 제출 필수가 아니다.** 구현자가 지도 구역과 대조한다. 확인되지 않은 좌표를 작성하지 않는다.
- 사진에 나온 장소와 질문의 정답이 일치하는지 확인한다. 특히 여러 관문의 이름·현판 글자를 혼동하지 않는다.
- 지나가는 사람의 얼굴, 연락처 등 불필요한 개인정보가 포함된 사진은 그대로 공개하지 않는다.

## 게임 반영과 검증

<<<<<<< Updated upstream
문제 원본은 `apps/golmok-detective/data/quiz.js`, 검수·표시 정보는 `data/quiz-support.json`이며, 검토된 이미지는 `apps/golmok-detective/public/assets/`에 둔다. `sceneKind: "field"`는 정확히 4개 선택지를, 기존 `example`은 3개 선택지를 받는다. 선택지의 ID·표시는 고유해야 하며 `answerId`는 해당 ID 하나와 정확히 일치해야 한다. `evidence.x`, `evidence.y`는 사진에서 근거를 표시하는 0~100 범위의 백분율이며 GPS 좌표가 아니다.
=======
미션 원본은 `apps/golmok-detective/data/inhwamun.json`이며, 검토된 이미지는 `apps/golmok-detective/public/assets/`에 둔다. `sceneKind: "field"`는 정확히 4개 선택지를, 기존 `example`은 3개 선택지를 받는다. 선택지의 ID·표시는 고유해야 하며 `answerId`는 해당 ID 하나와 정확히 일치해야 한다. `evidence.x`, `evidence.y`는 사진에서 근거를 표시하는 0~100 범위의 백분율이며 GPS 좌표가 아니다.
>>>>>>> Stashed changes

탐색 구역과 사진 공개 시점을 확인한 뒤, 미션 순서·선택지·정답을 바꾸면 검수 파일의 최상위 `version`도 갱신한다. 이미지 경로는 `assets/영문소문자-파일명.jpg`와 같은 형식을 사용한다. 지원 형식은 SVG/JPG/JPEG/PNG/WebP다. 빌드 때 사진은 게임 HTML에 내장된다. 정답 데이터도 브라우저에 포함되므로 현장 탐색을 돕는 체험 게임의 용도다.

`explorationRegionId`는 현재 `chinatown` 또는 `songwol`로 연결한다. 1차 단서 사진은 `image`·`imageAlt`, 2차 문제 사진은 선택 쌍 `quizImage`·`quizImageAlt`로 구분한다. 2차 사진을 생략하면 단서 사진을 사용한다. 별도 정답 사진은 `answerImage`와 `answerImageAlt`를 함께 지정하며, `evidence`는 그 정답 사진 기준으로 작성한다. 파이썬 등으로 전달할 때도 사진을 함께 저장소에 올리고 개인 PC 절대 경로 대신 상대 경로를 적는다. 정답 번호는 ‘1번’인지 ‘0부터 시작하는 인덱스’인지 명확히 쓰며, 웹에는 `answerId`로 변환한다.

```sh
node apps/golmok-detective/build.mjs
node --test apps/golmok-detective/tests/*.test.mjs
```

검수자는 휴대전화 화면에서 보기 4개와 네 번째 정답 처리, 오답 재시도, 해설·완료까지 확인한다. 원본 자료의 업로드와 공개 게임 반영은 구분하며, 게임 HTML 생성과 배포가 완료되어야 플레이 화면에 나타난다.

문서 근거: 이 저장소의 `build.mjs`, `mission-validation.mjs`, `game-state.mjs`와 팀원 공유 자료 경로를 확인했다. 새 외부 API나 패키지 설정은 필요하지 않다.

### 팀원 JavaScript 자료와 웹 필드 대응

| 팀원 `quiz.js` | 웹에서 사용하는 값 |
|---|---|
| `partPhoto` | 검수된 `image`와 같은 사진: 1차 장소 찾기 |
| `quizPhoto` | 검수된 `quizImage`와 같은 사진: 2차 문제 |
| `answerImage` | 검수된 `answerImage`와 같은 사진: 정답 확인 후 |
| `quizText`, `choices` | 질문과 번호 접두어를 정리한 보기 4개 |
| `correctAnswerIndex` | 현재 팀원 양식은 보기 번호 1~4, 검수 정답 글자와 다시 대조 |
| `geoCoordinates` | 참고 좌표. 도착 인증에 사용하지 않음 |

`quiz-support.json`의 해당 검수 항목과 실제 공개 사진을 함께 갱신해야 새 자료를 빌드할 수 있다. 파일 이름만 같은 다른 사진, 검수하지 않은 정답 변경, 아직 검수 목록에 없는 새 문제는 자동 공개하지 않는다.
