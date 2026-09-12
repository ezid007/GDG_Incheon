# 실행과 임시 공개

확인일: 2026-09-12 · 게임 버전: example-v1 · Node.js 표준 모듈만 사용

## 현재 접속 주소

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

서버는 게임 HTML과 명시된 예시 SVG 3개만 제공한다. 작업 문서, 로그, 인증 자료, 사진 원본, 첨부 디렉터리는 제공하지 않는다. HTML 자체에 그림·데이터·코드를 포함해 내려받은 파일로도 플레이할 수 있다.

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
