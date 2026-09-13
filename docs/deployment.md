# 로컬 실행과 배포 경계

확인일: 2026-09-13 · Node.js 22/24 · GitHub Actions에서는 Node.js 24

## 현재 운영 원칙

전면 정리 기간의 GitHub Pages 게시를 중단하고 배포 워크플로를 비활성화했습니다. `deploy-pages.yml`은 수동 실행만 남겼습니다. **재배포는 별도 실행 절차로 진행합니다.** 실제 활성 여부는 GitHub의 Settings → Pages와 Actions에서 확인합니다.

코드 확인과 공개를 분리합니다.

| 작업 | 설정·영향 |
|---|---|
| 로컬 빌드·검사 | 로컬 파일을 생성·확인하며 외부에 공개하지 않음 |
| main 푸시·PR | 해당 경로 변경 시 `check.yml`이 빌드·검사만 수행 |
| Pages 배포 | `deploy-pages.yml`의 수동 실행. 현재 비활성 |
| GitHub 저장소 공유 | Git 추적 파일 공유이며 사이트 배포와 별개 |

자동 검사는 `apps/golmok-detective/**`와 검사 워크플로 변경을 대상으로 합니다. 문서만 고치면 해당 자동 검사도 실행되지 않습니다. 배포 이력을 README에 누적하지 않습니다.

## 로컬에서 실행

저장소 루트에서 다음 명령을 사용합니다. 별도 패키지 설치는 필요 없습니다.

```sh
node apps/golmok-detective/build.mjs
node --test apps/golmok-detective/tests/*.test.mjs
node apps/golmok-detective/serve.mjs
```

기본 주소는 `http://127.0.0.1:4179/`, 지도는 같은 주소의 `map.html`입니다. 포트를 바꾸려면 `node apps/golmok-detective/serve.mjs --port 4184`를 사용합니다.

소스를 수정한 뒤 다시 빌드하고 브라우저를 새로고침합니다. 서버는 요청할 때 생성 HTML을 읽으므로 빌드 결과를 보기 위해 매번 서버를 재시작할 필요는 없습니다. 로컬 주소는 서버 컴퓨터에서만 접속할 수 있습니다.

## 공개 파일과 QR

Pages 업로드 대상은 `apps/golmok-detective/public/`입니다. HTML과 사용 중인 사진·공유 QR이 포함됩니다. `src/`, `reference/`, 문서, 로그, 첨부 원본, 인증 설정은 사이트에 올리지 않습니다.

로컬 서버는 게임·지도 HTML, 예시 SVG, 공유 QR처럼 코드에 명시된 경로만 제공합니다. 생성 HTML 내부에 사용 사진이 내장되므로 사진별 서버 경로를 추가할 필요가 없습니다.

게임 공유 주소는 `https://ezid007.github.io/GDG_Incheon/`입니다. QR 원본은 `assets/share-qr-20260913.jpg`이며, QR은 외부 중간 서비스 주소를 담고 있습니다. 2026-09-13의 이전 확인에서는 중간 화면의 건너뛰기 링크가 게임으로 연결됐습니다. 원본을 그대로 보존했으며 이 외부 서비스의 동작은 프로젝트에서 제어하지 않습니다.

## 재개를 요청받은 경우의 완료 기준

빌드·검사 성공, 배포할 변경 범위 확인, Actions 배포 성공, 공개 주소의 실제 화면 확인을 구분합니다. 로컬 화면이나 푸시 성공만으로 배포 완료라고 판단하지 않습니다. 캐시가 의심되면 새로고침과 버전 쿼리로 비교하되 공유할 기본 주소에는 검사 쿼리를 남기지 않습니다.

[개발 작업 가이드](development-workflow.md) · [워크플로 소스](../.github/workflows/deploy-pages.yml) · [자동 검사 소스](../.github/workflows/check.yml)
