# 현장 문제 검수 기준

확인일: 2026-09-13 · 콘텐츠 버전: `unified-three-missions-v1`

현재 실제 문제는 3개입니다. 원본은 `apps/golmok-detective/data/quiz-support.json`, 사진은 `public/assets/quiz/`에서 관리합니다. 정답과 사진 역할은 검수한 내용을 유지합니다.

| 문제 | 1차 장소 찾기 | 도착 후 2차 | 정답·근거 |
|---|---|---|---|
| 인화문 | `gate/field-gate-detail.jpg` 금빛 조각상 | `gate/field-gate-quiz.jpg` 현판 가림 사진 | **仁華門**. `gate/field-gate-answer.jpg`의 현판 |
| 피노키오 | `pinocchio/field-pinocchio-clue.jpg` 피노키오·하트 크롭 | `pinocchio/field-pinocchio-quiz.jpg` 파란 무늬 확대 | **5개**. `pinocchio/field-pinocchio-answer.jpg`의 파란 계열 무늬 |
| 동화마을 | `taletown/field-taletown-clue.jpg` 양철 나무꾼 | `taletown/field-taletown-quiz.jpg` 성 외관 참고 | **가방**. 출제자 확인, 벽화 전체 근거 사진 미제공 |

위 사진 경로는 `public/assets/quiz/` 기준입니다.

## 변경하면 안 되는 사진 역할

피노키오를 찾을 때는 피노키오가 나온 크롭 사진을 사용합니다. 파란 무늬 확대는 도착 후 세어야 할 무늬를 알려주는 사진입니다. 정답은 흰 벽의 파란색 계열만 세어 5개이며, 옅은 하늘색을 포함하고 분홍색은 제외합니다. 갈라진 꼬리선을 각각 세지 않습니다.

인화문의 현판 글자가 보이는 전체 사진은 정답 후에 보여줍니다. 1차 또는 2차 사진을 전체 정답 사진으로 바꾸지 않습니다.

동화마을의 성 외관 사진은 위치 참고 사진입니다. 벽화 전체나 정답 가방의 증거를 보여준다고 설명하지 않습니다. 전체 근거 사진이 없으므로 정답 근거 표시점도 숨깁니다. 출제자의 정답·좌표 확인 내용은 [당시 전달 문서](archive/2026-09-13-before-cleanup/work-plans/2026-09-12-tale-town-quiz-merge.md)에 보존돼 있습니다.

## 사진 보관과 추가 검수

사용하지 않는 인화문 힌트 사진과 동화마을 중복 사진은 앱의 `reference/unused-photos/`로 보존했습니다. 공개 폴더에는 검수한 문제 자산만 포함합니다.

새 문제는 사진의 실제 내용, 정답 보기, 현장 근거, 사진을 보여줄 단계를 함께 확인합니다. 사진만으로 판단할 수 없으면 출제자 확인과 미검증 항목을 구분합니다. 실제 정밀 위치가 확인되지 않았다면 탐색 구역의 대표점과 혼동하지 않습니다.

[문제 입력 규칙](mission-authoring.md) · [이전 검수 이력](archive/2026-09-13-before-cleanup/field-missions.md)
