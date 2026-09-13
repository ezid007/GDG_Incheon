# 그림 지도와 위치 탐색

확인일: 2026-09-13 · 콘텐츠 버전: `unified-three-missions-v1`

## 화면과 문제 연결

차이나타운과 송월동 동화마을을 한 장의 SVG 그림 지도에 표시합니다. 실제 문제 3개를 세로 카드로 나열하며, 카드를 고르면 해당 문제의 넓은 탐색 범위를 표시합니다. 지역 선택 탭·정답 위치 핀·자동 길찾기는 제공하지 않습니다.

| 순서 | 문제 ID | 장소 찾기 사진 | 기본 탐색 범위 |
|---|---|---|---|
| 1 | `inhwamun-plaque` | 금빛 조각상 근접 사진 | 한중문화관 대표점 주변 135m |
| 2 | `pinocchio-clouds` | 피노키오·분홍 하트 크롭 사진 | 송월동 동화마을 대표점 주변 110m |
| 3 | `taletown-mural` | 양철 나무꾼 근접 사진 | 송월동 동화마을 대표점 주변 110m |

대표점은 정확한 정답 위치나 촬영 위치가 아닙니다. 별도로 검수한 `explorationArea`가 있으면 해당 문제에만 적용합니다. `geoCoordinates`가 있다는 이유로 정답 핀이나 도착 조건으로 사용하지 않습니다.

카드의 **장소를 찾았어요 → 2차 퀴즈**는 현장 방문을 스스로 확인하는 버튼입니다. **발표 시연: 도착을 가정하고 2차 퀴즈**는 별도 시연 기록으로 같은 문제를 엽니다. 지도에는 `image`만 넣으며 2차·정답 사진을 내장하지 않습니다.

## 위치 표시

**내 위치 확인**을 눌렀을 때 한 번 위치를 요청합니다. 위경도와 도로에 같은 투영식을 적용해 파란 점과 오차 범위를 표시합니다. 확대·축소·전체 보기와 지도를 이동하는 조작을 지원합니다.

- HTTPS 또는 브라우저가 신뢰하는 로컬 환경과 위치 권한이 필요합니다.
- 100m를 넘는 오차, 1분이 지난 위치, 지도 범위 밖 좌표는 점을 표시하지 않습니다.
- 위치 오류·거부·시간 초과를 안내하고 다시 요청할 수 있습니다.
- 위치를 저장·전송하거나 백그라운드에서 계속 추적하지 않습니다.
- 실제 스마트폰·현장의 GPS 오차와 통행 가능 여부는 별도 확인이 필요합니다.

## 데이터와 수정 위치

앱 기준 `src/pages/map.html`은 구조, `src/styles/map.css`는 스타일, `src/scripts/map.js`는 선택·확대·위치 요청을 담당합니다. `location.mjs`는 투영·오차 판정을, `build-map.mjs`는 카드와 SVG 지도를 생성합니다.

`data/exploration-map.json`에서 지도 범위·대표 탐색 영역을, `data/map-geography.json`에서 도로·공원·철도·출처를 관리합니다. 실제 문제의 순서는 `data/quiz-support.json`의 `reviews` 순서입니다. `public/map.html`은 생성 파일입니다.

## 출처와 적용 범위

아래는 프로젝트 데이터에 기록된 출처이며, 도로 데이터 수집일은 2026-09-12입니다. 이번 정리는 지도를 새로 수집한 작업이 아닙니다.

| 항목 | 출처 |
|---|---|
| 도로·공원·철도 | [OpenStreetMap map API](https://api.openstreetmap.org/api/0.6/map?bbox=126.615,37.472,126.627,37.481) |
| 한중문화관 대표점 | [인천투어 한중문화관](https://itour.incheon.go.kr/ssst/ssst/detail.do?cotId=ITD21121514191939746) |
| 동화마을 대표점 | [인천투어 송월동 동화마을](https://itour.incheon.go.kr/ssst/ssst/detail.do?cotId=ITD22012113593866643) |
| 도로 저작권·라이선스 | [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · [ODbL](https://opendatacommons.org/licenses/odbl/1-0/) |

화면은 서 126.615 / 남 37.472 / 동 126.624 / 북 37.4805를 포함하며 북쪽이 위입니다. 외부 지도 타일이나 지도 API 키를 사용하지 않습니다. 도로의 접근 제한 표식을 일부 반영하지만 실제 통행을 보증하지는 않습니다.

[문제 작성 안내](mission-authoring.md) · [개발·검증 순서](development-workflow.md) · [이전 지도 기록](archive/2026-09-13-before-cleanup/map.md)
