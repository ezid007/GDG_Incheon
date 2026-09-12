# 03. 에이전트 환경 및 도구 설정 (Agent Environment & Config)

## 1. 출발 전 노트북 환경 점검 (Before You Leave)
노트북은 AI Agent가 24시간 일하는 본부입니다. 이동 중 원격 지휘가 끊기지 않도록 다음 설정을 확인합니다.

### 🔌 필수 점검 체크리스트
1. **전원 어댑터 연결:** 배터리 모드로 동작하지 않도록 전원 상시 연결
2. **절전 모드 OFF:** Mac 설정에서 화면 꺼짐 시 잠자기 비활성화 (`caffeinate` 등 활용)
3. **Wi-Fi 연결 유지:** 행사장 안정적인 Wi-Fi망 유지
4. **행사 종료까지 상시 가동:** 16:00 종료 시까지 노트북 닫지 않기
5. **OpenClaw 데몬 실행 상태:** 백그라운드 게이트웨이 프로세스 가동 확인
6. **Telegram 왕복 테스트:** 현장 출발 전 모바일 텔레그램 메시지 송수신 확인

---

## 2. 권장 모델 설정 (Recommended Models)
Qwen 3.8 시리즈는 텍스트/이미지/비디오 멀티모달을 지원하며 처리 비용이 매우 효율적입니다.

* **경량/빠른 작업용:** `qwen/qwen3.8-flash`
  ```bash
  openclaw models set qwen/qwen3.8-flash
  ```
* **고난도/복잡한 로직 구현용:** `qwen/qwen3.8-max`
  ```bash
  openclaw models set qwen/qwen3.8-max
  ```

---

## 3. Runyour AI API Key 및 환경 재설정
온보딩 및 API 키 갱신 시 아래 CLI 명령어를 사용합니다.

```bash
openclaw onboard --non-interactive --accept-risk --install-daemon \
  --flow quickstart \
  --auth-choice custom-api-key \
  --custom-provider-id runyour-ai \
  --custom-base-url https://api.runyour.ai/v1 \
  --custom-api-key "<YOUR_API_KEY>" \
  --custom-model-id "qwen/qwen3.8-flash"
```

---

## 4. 장애 발생 시 긴급 대응 (Emergency Manual)
현장에서 원격 지휘 도중 Telegram 응답이 없을 경우:

1. 텔레그램으로 짧은 메시지를 1회 더 전송해 봅니다.
2. 1~2분 대기 후에도 무응답 시 **카카오톡 행사 단체방**에 상황 공유 요청을 보냅니다.
   > *"Telegram에서 OpenClaw가 응답하지 않습니다. 노트북 상태 확인 및 권한 팝업 허용 부탁드립니다."*
3. **권한 요청 팝업 주의:** 관리자 권한, 시스템 설정 변경, 대량 파일 삭제 등 불명확한 권한 요청은 승인 전 반드시 이유를 검토합니다.
