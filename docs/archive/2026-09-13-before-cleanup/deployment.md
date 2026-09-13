# 실행과 임시 공개

## 현재 상태 · 2026-09-13

**GitHub Pages는 다시 공개되어 있습니다.** [게임 공개 주소](https://ezid007.github.io/GDG_Incheon/)의 HTTPS GET 200과 브라우저의 문제 3개 표시를 확인했습니다. GitHub 공개 API에서 `.github/workflows/deploy-pages.yml`의 상태도 `active`로 확인했습니다. QR 공유 이미지와 게임·지도 메타데이터의 공개 응답까지 확인했습니다.

로컬 실행은 아래 명령을 따릅니다. 기존 Quick Tunnel 주소는 현재 사용하지 않습니다. 게임 사진은 HTML에 내장되고 공개 대상 폴더는 `apps/golmok-detective/public`입니다.

## QR 이미지 링크 미리보기 · 공개 반영 완료

확인일: 2026-09-13 · 적용 대상: 게임 첫 화면과 `map.html` · 기존 Node.js 표준 모듈 구성 유지

사용자가 제공한 원본 JPEG(1280×1280)를 변경 없이 `assets/share-qr-20260913.jpg`로 공개하고, 두 HTML의 Open Graph와 Twitter Card 메타데이터에서 동일한 이미지를 가리키도록 적용했습니다. 이미지 공개 주소는 `https://ezid007.github.io/GDG_Incheon/assets/share-qr-20260913.jpg`이며, `og:image`, `og:image:type=image/jpeg`, 이미지 크기·대체 설명과 `twitter:card=summary`를 지정했습니다. 정사각형 원본에 맞춘 설정이며 실제 메신저의 카드 표시와 캐시 갱신은 아직 확인하지 않았습니다. Open Graph 설정 근거: [공식 문서](https://ogp.me/).

로컬 코드·모바일 화면 검증과 전체 검사 76개를 통과했고, 공유 이미지와 업로드 원본의 SHA가 일치함을 확인했습니다. 이전 기록의 로컬 HTTP 검사 실패 2건은 이번 검사에서 재현되지 않았습니다. 코드 `53af4e5`의 [GitHub Actions 실행](https://github.com/ezid007/GDG_Incheon/actions/runs/34742507232)에서 빌드·검사·배포가 모두 성공했습니다. 공개 게임·지도·QR 이미지 모두 GET 200, 메타데이터 주소·MIME·1280×1280 크기와 원본 SHA 일치를 확인했습니다. 공개 모바일 화면의 깨진 이미지·가로 넘침·JavaScript 오류도 없었습니다.

미리보기를 공유할 때는 [게임 직접 주소](https://ezid007.github.io/GDG_Incheon/)를 사용합니다. 원본 QR에 들어 있는 `https://q.me-qr.com/lylo99z2`는 `https://qr1.me-qr.com/ko/lylo99z2`의 광고·중간 화면으로 이동했고, 해당 화면의 **건너뛰다** 링크를 눌러 게임 직접 주소와 첫 안내 화면까지 열리는 것을 확인했습니다. QR 중간 사이트의 미리보기 메타데이터는 이 프로젝트에서 변경할 수 없습니다.

## 이전 배포 설정·검증 이력

확인일: 2026-09-12 · 게임 버전: unified-pinocchio-v2 · Node.js 표준 모듈만 사용

아래 배포·검증 결과는 각 작업 당시의 기록입니다. 이후 사용자 요청으로 Pages 게시를 중단하고 워크플로를 수동 비활성화했던 시기가 있었으며, `unified-three-missions-v1` 통합 당시에는 로컬 포트 4184에서만 확인했습니다. 현재 공개 여부는 문서 상단의 2026-09-13 확인 결과를 따릅니다.

## 팀원 GitHub Pages 배포

두 협업자 모두 GitHub 초대를 수락했고 쓰기 권한이 있다. 개인 계정 저장소는 소유자와 협업자 두 단계여서 별도의 Pages 관리자 역할을 줄 수 없다. 소유자가 Pages 소스를 GitHub Actions로 설정하고, 협업자는 main에 코드를 푸시하거나 Actions의 `Deploy Golmok Detective` → `Run workflow`로 배포한다. 수동 실행은 main을 선택한다.

워크플로: `.github/workflows/deploy-pages.yml`. Node 24에서 테스트·빌드 후 `apps/golmok-detective/public`만 업로드한다. 원본 자료·문서·로그는 사이트에 포함하지 않는다. 빌드는 contents:read, 배포는 pages:write와 id-token:write를 사용한다. 개인 API 토큰이나 계정 공유가 필요 없다.

첫 실행 #1은 테스트20개·빌드·배포 모두 성공했다. [실행 기록](https://github.com/ezid007/GDG_Incheon/actions/runs/34669308422). 아래 공개 URL에서 GET 200과 게임 제목을 확인했다. 팀원 본인의 세션에서 직접 실행하는 검증은 별도다.

지도 포함 실행 #2도 테스트21개·빌드·배포 성공했고 `/map.html` GET 200을 확인했다. [실행 #2](https://github.com/ezid007/GDG_Incheon/actions/runs/34669603240). 서비스명은 차이나타운 골목탐정이며 배포 주소는 유지한다.

**기본 공개 주소: [GitHub Pages 게임](https://ezid007.github.io/GDG_Incheon/)**. 지도는 `/GDG_Incheon/map.html`에 제공한다. 이 주소는 개발 노트북이나 Cloudflare 터널 실행 여부와 관계없이 GitHub Pages에서 제공된다. 변경 반영은 푸시 후 Actions 배포가 성공해야 완료된다.

공식 근거: [개인 저장소 권한](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository), [Pages 사용자 정의 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [쓰기 권한으로 수동 실행](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## 로컬 수정 확인용 임시 주소

[골목탐정 임시 웹](https://machines-ambien-wear-arab.trycloudflare.com)

초기 개발 때 사용한 Cloudflare Quick Tunnel 주소다. 현재 유지 여부는 확인하지 않았으므로 제출·공유에는 위 GitHub Pages 주소를 사용한다. 현재 게임에는 검수된 현장 문제 1개가 반영되어 있다.

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

서버는 게임 HTML, 지도 HTML과 명시된 예시 SVG 3개를 제공한다. 이번 공유 미리보기 작업에서는 원본 QR JPEG `/assets/share-qr-20260913.jpg` 1개만 허용 경로에 추가했다. 작업 문서, 로그, 인증 자료, 첨부 디렉터리는 제공하지 않는다. 지도 HTML은 실제 도로 SVG·구역·문제 단서 사진·위치 처리 코드를 내장한다. 게임 HTML에는 검토한 문제 사진과 정답 확인용 사진을 내장한다. 각 HTML은 그림·데이터·코드를 포함해 파일로도 열 수 있지만 현재 위치 기능은 HTTPS와 사용자 권한이 필요하다.

제출 백업으로 작동 화면 녹화/캡처와 소스를 준비한다. 현장 휴대전화에서 재생 가능한지 확인한다. Drive 보관과 웹 공개는 별개다.

## 이전 배포 검증 범위

- HTTPS GET: 200, 게임 제목·본문 확인.
- 외부 HEAD: 200, HTML MIME, 본문 0바이트 확인.
- Chrome 공개 주소: 시작·첫 미션 정답 처리·재시작 취소/확정·공유 주소 복사 확인. 수집된 오류·경고 없음.
- 320·390·768·1280px: 가로 넘침과 깨진 이미지 없음.
- 공개 URL의 `/docs/`, `/PLAN.md`, `/.env`: 모두 404.
- 실제 현장 휴대전화의 모바일 데이터망에서 접속·완주하는 확인은 아직 남아 있다.
- 로컬 응답 필터가 HTML 헤더·HEAD를 바꾸는 환경 문제는 구현 안내의 검사 결과에 기록한다. 보안 도구 설정은 변경하지 않았다.

출처: [Cloudflare Quick Tunnels 공식 문서](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/). 개발·테스트 용도이고 가용성 보장이 없다.

## 이전 배포 기록 · 두 단계 현장 퀴즈

- 기본 주소에서 1차 지도·부분 사진으로 장소를 찾는다. `map.html?region=chinatown`은 현재 준비된 차이나타운 구역이다.
- 지도에서 **장소를 찾았어요 → 2차 퀴즈**를 누르면 `?play=field&region=chinatown`으로 이동한다. 대략 위치 보조와 도착 자가확인은 별개다.
- 발표용 **시연: 도착했어요 → 2차 퀴즈**는 `?demo=arrival&region=chinatown`으로 이동하며 일반 진행과 별도 저장한다.
- 인화문 현장 문제 1개와 정답 사진을 반영했다. 정답을 맞히기 전에는 전체 정답 사진을 화면에 표시하지 않는다.
- 로컬 브라우저에서 두 단계 이동·네 선택지·오답·힌트·정답 사진·확대·완료·복원·시연 기록 분리 확인. 320·390·1280px 지도 가로 넘침 없음.
- 로컬 자동 검사 68개 중66통과, 기존 응답 필터 관련2실패 유지. 신규 지도·위치·미션·세션 검사를 포함한59개는 모두 통과. CI의 68개 검사·빌드·배포와 공개 주소 반영 확인을 마쳤다.

## 이전 배포 확인 · field-v2

2026-09-12 코드 커밋 `4deb9db`의 [GitHub Actions](https://github.com/ezid007/GDG_Incheon/actions/runs/34672204009)에서 68개 검사·빌드·배포가 성공했다. 로컬 응답 필터 실패2건은 CI에서 재현되지 않았다. 공개 HTTPS의 시작 버튼→1차 지도→일반 도착→2차 가림 사진·4지선다→정답 원본 사진·해설→완료를 브라우저에서 확인했다. 시연 주소는 별도 진행 0/1로 열리고 시연 안내가 표시된다. 브라우저 주소와 링크가 GitHub Pages 저장소 경로 아래에서 정상 연결된다. 현장 GPS 오차는 실제 휴대전화 확인이 남아 있다.

## 이전 통합 배포 · unified-v1

- 통합 지도: https://ezid007.github.io/GDG_Incheon/map.html
- 문제 1 장소 찾기: `map.html?quiz=inhwamun-plaque`
- 문제 1 현장 퀴즈: `?play=field&quiz=inhwamun-plaque`
- 문제 1 시연: `?demo=arrival&quiz=inhwamun-plaque`
- 기존 region 링크도 호환하지만 새 UI에서는 문제 ID로 이동한다. 정답 후 다음 문제의 지도 또는 전체 문제 목록으로 연결한다.
- 로컬 빌드 성공, 72개 검사 중70통과·기존 AdGuard 응답 변경2실패. 지도18개·세션10개 포함 신규 검사는 통과했다. 320px 통합 지도, 선택 범위 표시, 문제별 완료와 목록 이동을 브라우저에서 확인했다. CI·공개 배포 결과는 다음 기록에서 확인한다.

최종 확인: 코드 `f12fe15`의 [GitHub Actions](https://github.com/ezid007/GDG_Incheon/actions/runs/34673092862)에서 빌드·72개 검사·Pages 배포 모두 성공했다. 공개 Chrome에서 통합 문제 목록→선택한 탐색 원→일반 도착→2차 가림 사진·4지선다→정답 전체 사진→완료→문제 목록을 확인했다. 일반 완료 후 시연은 별도0/1진행으로 열린다. 공개390px와 로컬320·1280px에서 가로 넘침이 없었다. 기존 로컬AdGuard2실패는CI에서재현되지않았고 현장GPS오차확인만남아있다.

## 피노키오 문제 추가 · unified-pinocchio-v1

새문제장소찾기: https://ezid007.github.io/GDG_Incheon/map.html?quiz=pinocchio-clouds
시연: https://ezid007.github.io/GDG_Incheon/?demo=arrival&quiz=pinocchio-clouds
현재빌드의실제문제는2개이며자료버전변경으로이전진행과구분한다. 로컬390px에서사진공개시점과4지선다오답/정답처리확인. 새커밋의CI·Pages확인은아직대기상태다.

최종확인: `4349271`의 [Actions34673636479](https://github.com/ezid007/GDG_Incheon/actions/runs/34673636479)에서72개검사·빌드·배포모두성공. 공개문제2지도에서확대무늬사진, 시연도착후근접사진·3/4/5/6보기, 5개정답후전체전경과해설을확인했다. 지도와퀴즈상대링크가저장소경로아래서작동한다. 원본사진3장의무변경복사와로컬320·390px화면도확인했다.

## 새 정답 사진 · unified-pinocchio-v2

주소는기존 pinocchio-clouds 링크를유지한다. 사용자제공새정답사진·확정5개반영,질문을파란색계열무늬로한정하고분홍색을제외했다. 콘텐츠버전변경으로이전진행과구분한다. 로컬빌드·390px정답후새사진/확대확인을마쳤다. 코드8c45c77의 Actions34673933342에서72개검사·빌드·Pages배포가성공했다.


## 세로 목록과 사진 순서 정정 · scroll-pinocchio-v1

전체 문제를 세로 카드로 펼치고 공용 지도는 아래 하나를 둔다. 피노키오 장소 찾기는 Photo1 피노키오·하트 크롭, 2차 퀴즈는 Photo3 파란 무늬 확대, 정답 후는 사용자 확인을 받은 최신 벽면 사진을 사용한다. 정답은 파란 계열5개이며 분홍색을 제외한다. 질문 사진과 보기도 모든 화면에서 상하로 배치한다.

로컬 build 성공,73개 검사 중71통과·기존 AdGuard HTTP2실패 유지. 지도 UI19개 모두 통과. Chrome320/390/1280px 세로 목록·가로 넘침 없음·공용 지도 전환·도착 시연·사진 순서·5개 정답 후 최신 사진/확대 확인. 코드 `de8b695`의 [Actions34674323476](https://github.com/ezid007/GDG_Incheon/actions/runs/34674323476)에서 빌드·73개 검사·Pages 배포 성공. 공개390px에서 두 카드의 세로 목록·피노키오1차 사진·시연도착후 파란 무늬 사진·5개 정답 후 최신 벽사진을 확인했다. 로컬 AdGuard2실패는 CI에서 재현되지 않았다. 현장 GPS 정확도 검증은 별도다.
