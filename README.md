# 차이나타운 골목탐정

그림 지도와 사진 단서로 장소를 찾고, 현장에서 4지선다 문제를 푸는 모바일 골목 탐험 게임입니다.

[게임 웹사이트](https://ezid007.github.io/GDG_Incheon/) · [문제 목록과 지도](https://ezid007.github.io/GDG_Incheon/map.html)

콘텐츠 버전: `unified-three-missions-v1`. 실제 문제 3개가 한 지도와 세로 목록에 표시되며, 가상 예시 3개는 실제 목록에서 제외됩니다.

## 플레이 흐름

1. 첫 화면에서 게임 소개와 진행 방법을 확인합니다.
2. 문제 목록을 아래로 스크롤하며 부분 사진·지도 탐색 범위로 장소를 찾습니다.
3. 해당 카드의 **장소를 찾았어요 → 2차 퀴즈**를 누릅니다.
4. 현장에서 확인한 답을 네 보기 중 골라 정답·해설을 확인합니다.
5. 다음 문제의 장소 찾기로 이동하거나 목록으로 돌아갑니다.

| 문제 | 1차 장소 찾기 | 2차 문제 | 정답 |
|---|---|---|---|
| 인화문 | 금빛 조각상 근접 사진 | 현판을 가린 관문 사진 | 仁華門 |
| 피노키오 | 피노키오·하트 크롭 사진 | 파란 구름 무늬 확대 사진 | 파란 계열 5개 |
| 동화마을 | 양철 나무꾼 근접 사진 | 성 외관을 참고해 조형물 옆 벽화 관찰 | 가방 |

인화문·피노키오의 전체 정답 사진은 맞힌 뒤 보여줍니다. 동화마을은 출제자가 확인한 정답을 사용하며, 제공된 성 외관 사진은 주변 위치 참고용입니다. 벽화 전체의 정답 근거 사진은 아직 없어 정답 표시점을 찍지 않습니다.

발표에서는 각 카드의 **발표 시연: 도착을 가정하고 2차 퀴즈**를 이용합니다. 일반 플레이와 시연 진행은 분리됩니다. GPS는 사용자가 요청할 때 대략적인 현재 위치를 표시하며 도착 인증이나 문제 잠금에 사용하지 않습니다. 위치는 저장하거나 전송하지 않습니다.

## 로컬 실행

Node.js 22/24 표준 모듈을 사용하며 별도 패키지 설치가 필요 없습니다.

```sh
node apps/golmok-detective/build.mjs
node apps/golmok-detective/serve.mjs
```

[로컬 게임 소개](http://127.0.0.1:4179/) · [문제 목록과 지도](http://127.0.0.1:4179/map.html)

다른 포트: `node apps/golmok-detective/serve.mjs --port 4184`. 로컬 주소는 서버를 실행한 컴퓨터에서만 열립니다. 휴대전화의 외부 접속에는 별도 HTTPS 공개가 필요합니다.

## 문제 작성과 파일 구조

- 문제·선택지·검수 정보: `apps/golmok-detective/data/quiz-support.json` 하나에서 관리합니다. 이전 `quiz.js`는 사용하지 않습니다.
- 사진: `apps/golmok-detective/public/assets/quiz/gate/`, `pinocchio/`, `taletown/`에 있습니다. 중복 원본 폴더는 다시 만들지 않습니다.
- `image`는 장소 찾기, `quizImage`는 도착 후 질문, `answerImage`는 정답 확인 후 사진입니다.
- 실제 문제의 `expectedAnswer`는 네 보기 중 정확히 하나의 `label`과 일치해야 합니다. 로더가 이를 `answerId`로 변환합니다.
- `quiz-schema.mjs`는 입력을 검증하고, `load-quiz.mjs`는 기존 호환성을 위해 일반 객체를 반환합니다. JSON Schema와 `types.d.ts`는 작성·개발을 돕습니다.
- 생성된 `public/index.html`, `public/map.html`은 직접 고치지 않고 템플릿·데이터 수정 후 빌드합니다. 사진과 지도는 HTML에 내장됩니다.

[문제 작성 양식](docs/mission-authoring.md) · [미션 검수 기록](docs/field-missions.md) · [구현 안내](docs/implementation.md) · [실행·배포 안내](docs/deployment.md)

## 검증

```sh
node --test apps/golmok-detective/tests/*.test.mjs
```

검사는 문제 순서·사진 역할·정답·데이터 검증·게임 진행·지도·HTTP 응답을 확인합니다. 브라우저에서는 첫 안내→문제 목록→장소 도착→오답 재시도→정답·완료→목록 복귀를 확인합니다. 작은 화면의 가로 넘침, 이미지 로딩, 일반 플레이와 시연 기록 분리도 함께 확인합니다.

실제 현장 GPS 정확도와 동화마을 벽화 전체 근거 사진은 추가 확인 사항입니다.

## GitHub Pages 배포 방법

1. 저장소의 **Actions → Deploy Golmok Detective**를 엽니다.
2. 비활성화되어 있다면 **Enable workflow**를 누릅니다.
3. **Run workflow**를 열어 브랜치 **main**을 선택한 뒤 실행합니다.
4. 실행 목록 맨 위에서 방금 실행한 항목을 엽니다. 실행 시각과 브랜치 **main**, 대상 커밋을 확인해 과거 실행과 구분합니다.
5. 실행 상세의 전체 결과가 **Success**이고 **build**, **deploy** 두 작업 모두 초록색 체크인지 확인합니다. build만 성공하거나 deploy가 Skipped인 경우 배포 완료가 아닙니다.
6. 실행 요약의 **deploy / github-pages**에 표시된 배포 주소를 확인하고, 게임 웹사이트를 열어 반영된 내용도 확인합니다.

GitHub에서 노란색은 대기·실행 중, 초록색 체크/Success는 성공, 빨간색/Failure는 실패를 뜻합니다. 실패한 작업을 클릭하면 단계별 로그를 볼 수 있습니다. 저장소 코드 화면의 커밋 체크나 오래된 성공 기록만으로 이번 배포 완료를 판단하지 않습니다.

워크플로는 `.github/workflows/deploy-pages.yml`에 정의되어 있습니다. 활성화된 상태에서는 main의 게임 코드 또는 워크플로 파일 변경 시 자동 실행됩니다. README만 수정한 경우에는 자동 배포를 시작하지 않습니다. 실행 결과는 GitHub Actions에서 확인합니다.
