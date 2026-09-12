# 실행과 임시 공개

확인일: 2026-09-12 · 게임 버전: example-v1 · Node.js 표준 모듈만 사용

## 팀원 GitHub Pages 배포

두 협업자 모두 GitHub 초대를 수락했고 쓰기 권한이 있다. 개인 계정 저장소는 소유자와 협업자 두 단계여서 별도의 Pages 관리자 역할을 줄 수 없다. 소유자가 Pages 소스를 GitHub Actions로 설정하고, 협업자는 main에 코드를 푸시하거나 Actions의 `Deploy Golmok Detective` → `Run workflow`로 배포한다. 수동 실행은 main을 선택한다.

워크플로: `.github/workflows/deploy-pages.yml`. Node 24에서 테스트·빌드 후 `apps/golmok-detective/public`만 업로드한다. 원본 자료·문서·로그는 사이트에 포함하지 않는다. 빌드는 contents:read, 배포는 pages:write와 id-token:write를 사용한다. 개인 API 토큰이나 계정 공유가 필요 없다.

첫 실행 #1은 테스트20개·빌드·배포 모두 성공했다. [실행 기록](https://github.com/ezid007/GDG_Incheon/actions/runs/34669308422). 아래 공개 URL에서 GET 200과 게임 제목을 확인했다. 팀원 본인의 세션에서 직접 실행하는 검증은 별도다.

지도 포함 실행 #2도 테스트21개·빌드·배포 성공했고 `/map.html` GET 200을 확인했다. [실행 #2](https://github.com/ezid007/GDG_Incheon/actions/runs/34669603240). 서비스명은 차이나타운 골목탐정이며 배포 주소는 유지한다.

**기본 공개 주소: [GitHub Pages 게임](https://ezid007.github.io/GDG_Incheon/)**. 지도는 `/GDG_Incheon/map.html`에 제공한다. 이 주소는 개발 노트북이나 Cloudflare 터널 실행 여부와 관계없이 GitHub Pages에서 제공된다. 변경 반영은 푸시 후 Actions 배포가 성공해야 완료된다.

공식 근거: [개인 저장소 권한](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository), [Pages 사용자 정의 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [쓰기 권한으로 수동 실행](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## 로컬 수정 확인용 임시 주소

[골목탐정 임시 웹](https://machines-ambien-wear-arab.trycloudflare.com)

Cloudflare Quick Tunnel을 통해 공개하는 개발용 HTTPS 주소다. 앱 로그인 없이 주소로 플레이할 수 있다. 게임은 가상 예시 3미션이며 실제 현장 자료는 아직 반영하지 않았다.

개발 노트북·게임 서버·터널이 실행 중이어야 한다. 터널을 다시 시작하면 주소가 바뀔 수 있다. 영구 배포·가용성 보장이 아니며 최종 제출 시 운영진의 공개 기간 조건을 확인한다.

## 실행과 수정

저장소 루트에서:

```sh
node apps/golmok-detective/build.mjs
node apps/golmok-detective/serve.mjs
```

게임 서버는 `127.0.0.1:4179`에 바인딩한다. 설치된 cloudflared를 별도 터미널에서 실행한다.

```sh
cloudflared tunnel --url http://127.0.0.1:4179 --no-autoupdate --protocol http2
```

콘솔에 반환된 HTTPS 주소를 사용한다. 두 프로세스를 종료하면 공개도 끝난다. 절전 상태에서는 서비스를 제공할 수 없다.

템플릿·상태 코드·미션 데이터·이미지 수정 → 빌드 → 검사 → 같은 웹 주소에서 새로고침. 서버는 매 요청 HTML을 다시 읽는다. 미션 구성이나 의미가 바뀔 때 데이터 `version`을 갱신한다.

## 공개 범위와 백업

서버는 게임 HTML, 지도 HTML과 명시된 예시 SVG 3개만 제공한다. 작업 문서, 로그, 인증 자료, 첨부 디렉터리는 제공하지 않는다. 지도 HTML은 실제 도로 SVG·구역·문제 단서 사진·위치 처리 코드를 내장한다. 게임 HTML에는 검토한 문제 사진과 정답 확인용 사진을 내장한다. 각 HTML은 그림·데이터·코드를 포함해 파일로도 열 수 있지만 현재 위치 기능은 HTTPS와 사용자 권한이 필요하다.

제출 백업으로 작동 화면 녹화/캡처와 소스를 준비한다. 현장 휴대전화에서 재생 가능한지 확인한다. Drive 보관과 웹 공개는 별개다.

## 검증 범위

- HTTPS GET: 200, 게임 제목·본문 확인.
- 외부 HEAD: 200, HTML MIME, 본문 0바이트 확인.
- Chrome 공개 주소: 시작·첫 미션 정답 처리·재시작 취소/확정·공유 주소 복사 확인. 수집된 오류·경고 없음.
- 320·390·768·1280px: 가로 넘침과 깨진 이미지 없음.
- 공개 URL의 `/docs/`, `/PLAN.md`, `/.env`: 모두 404.
- 실제 현장 휴대전화의 모바일 데이터망에서 접속·완주하는 확인은 아직 남아 있다.
- 로컬 응답 필터가 HTML 헤더·HEAD를 바꾸는 환경 문제는 구현 안내의 검사 결과에 기록한다. 보안 도구 설정은 변경하지 않았다.

출처: [Cloudflare Quick Tunnels 공식 문서](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/). 개발·테스트 용도이고 가용성 보장이 없다.

## 2026-09-12 두 단계 현장 퀴즈 업데이트

- 기본 주소에서 1차 지도·부분 사진으로 장소를 찾는다. `map.html?region=chinatown`은 현재 준비된 차이나타운 구역이다.
- 지도에서 **장소를 찾았어요 → 2차 퀴즈**를 누르면 `?play=field&region=chinatown`으로 이동한다. 대략 위치 보조와 도착 자가확인은 별개다.
- 발표용 **시연: 도착했어요 → 2차 퀴즈**는 `?demo=arrival&region=chinatown`으로 이동하며 일반 진행과 별도 저장한다.
- 인화문 현장 문제 1개와 정답 사진을 반영했다. 정답을 맞히기 전에는 전체 정답 사진을 화면에 표시하지 않는다.
- 로컬 브라우저에서 두 단계 이동·네 선택지·오답·힌트·정답 사진·확대·완료·복원·시연 기록 분리 확인. 320·390·1280px 지도 가로 넘침 없음.
- 로컬 자동 검사 67개 중65통과, 기존 응답 필터 관련2실패 유지. 신규 지도·위치·미션·세션 검사를 포함한58개는 모두 통과. 이번 변경의 CI와 공개 주소 반영은 배포 후 기록한다.
