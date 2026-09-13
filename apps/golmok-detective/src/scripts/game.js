(() => {
  'use strict';
  /*__STATE__*/
  /*__DEMO__*/
  const ASSETS = /*__ASSETS__*/ null;
  const DATA = JSON.parse(document.getElementById('mission-data').textContent);
  const PLAY = getPlaySession(DATA, location.search);
  const missions = PLAY.missions;
  const STORE = PLAY.storageKey;
  const $ = (id) => document.getElementById(id);
  const allExample =
    missions.length > 0 && missions.every((m) => m.sceneKind === 'example');
  const firstField = missions.find((m) => m.sceneKind === 'field');
  const selectedQuiz = PLAY.autoStart && PLAY.quizId ? missions[0] : null;
  let state = initialState(missions);
  let storageWorking = true;
  let activeMissionId = null;
  function flagStorage() {
    storageWorking = false;
    $('storage-warning').hidden = false;
  }
  try {
    const raw = sessionStorage.getItem(STORE);
    if (raw)
      state = restoreState(JSON.parse(raw), missions, PLAY.storageVersion);
  } catch (error) {
    if (error instanceof SyntaxError) {
      state = initialState(missions);
    } else flagStorage();
  }
  $('intro-return').hidden = !PLAY.autoStart;
  if (PLAY.autoStart && state.screen === 'start')
    state = transition(state, { type: 'START' }, missions);
  function save() {
    if (!storageWorking) return;
    try {
      sessionStorage.setItem(
        STORE,
        JSON.stringify({ version: PLAY.storageVersion, state }),
      );
    } catch {
      flagStorage();
    }
  }
  function dispatch(action) {
    state = transition(state, action, missions);
    save();
    render();
  }
  function imageSource(mission, showAnswer = false) {
    const path =
      showAnswer && mission.answerImage
        ? mission.answerImage
        : mission.quizImage || mission.image;
    return ASSETS[path] || path;
  }
  function imageDescription(mission, showAnswer = false) {
    return showAnswer && mission.answerImage
      ? mission.answerImageAlt
      : mission.quizImageAlt || mission.imageAlt;
  }
  function focusSection(id) {
    requestAnimationFrame(() => {
      $(id).focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }
  function configureIntro() {
    $('total-start').textContent = String(missions.length);
    if (missions.length) {
      $('cover-image').src = ASSETS[missions[0].image] || missions[0].image;
      $('cover-image').alt = missions[0].imageAlt;
    }
    if (firstField) {
      document.querySelector('.hero-facts>span').textContent = '◷ 도보 탐험';
    }
    if (!missions.length || allExample) return;

    $('start-button').querySelector('span').textContent = '문제 목록 둘러보기';
    document.querySelector('.hero-description').textContent =
      '그림 지도와 사진 힌트로 장소를 찾고, 도착하면 2차 현장 퀴즈에 도전해요.';
    const steps = [
      ['1차 · 장소 찾기', '그림 지도와 사진 힌트를 보고 장소를 찾아요.'],
      [
        '2차 · 현장 퀴즈',
        '도착한 장소를 관찰하고 네 개의 답 중 하나를 골라요.',
      ],
      ['정답 확인', '전체 사진과 해설로 발견한 단서를 확인해요.'],
    ];
    document.querySelectorAll('.how>div').forEach((step, index) => {
      step.querySelector('strong').textContent = steps[index][0];
      step.querySelector('p').textContent = steps[index][1];
    });
    $('mode-label').textContent = '골목 탐험';
    $('mode-caption').textContent = '장면 속 발견을 모아보세요';
    $('sample-notice').textContent =
      '그림 지도에서 넓은 탐색 구역을 살펴보고, 현장에서 사진 단서를 찾아 문제를 풀어보세요. 전체 확인 사진은 정답을 맞힌 뒤 공개됩니다.';
    $('cover-caption').textContent = missions[0].placeLabel;
    $('completion-notice').textContent =
      '사진 속 특징을 발견한 탐험입니다. 위치나 현장 방문을 인증하지 않습니다.';
    $('footer-mode').textContent = '현장형 해커톤 · 관찰 게임';
  }
  function configureNavigation() {
    if (firstField) $('game-map-return').hidden = false;
    document.querySelectorAll('[data-map-link]').forEach((link) => {
      link.href = PLAY.mapHref;
    });
    if (!selectedQuiz) return;

    $('next-quiz-link').hidden = false;
    $('next-quiz-link').href = PLAY.nextQuizId
      ? './map.html?quiz=' + encodeURIComponent(PLAY.nextQuizId)
      : './map.html';
    $('next-quiz-link').textContent = PLAY.nextQuizId
      ? '다음 문제 장소 찾기 →'
      : '문제 목록으로 →';
    $('complete-heading').textContent =
      '문제 ' + PLAY.quizNumber + '을 해결했어요!';
    $('play-again').querySelector('span').textContent = '이 문제 다시 풀기';
  }
  function configureDemoMode() {
    if (!PLAY.isDemo) return;

    $('demo-banner').hidden = false;
    const caption =
      PLAY.contentKind === 'example'
        ? '실제 문제 준비 중, 예시 퀴즈'
        : PLAY.contentKind === 'empty'
          ? '선택한 문제 준비 중'
          : '문제 ' + PLAY.quizNumber + ' · 도착 후 퀴즈';
    $('demo-title').textContent = '시연 모드 · ' + caption;
    $('mode-label').textContent = '도착 시연';
    $('mode-caption').textContent = PLAY.quizNumber
      ? '문제 ' + PLAY.quizNumber + ' / ' + PLAY.quizCount
      : '통합 탐험';
    $('completion-notice').textContent =
      '시연으로 완료한 탐험이에요. 실제 방문이나 일반 플레이 기록에 반영되지 않습니다.';
    $('footer-mode').textContent = '도착 시연 · 일반 플레이와 별도 기록';
    $('restart-dialog').querySelector('p').textContent =
      '이 시연의 진행 상황을 초기화하고 첫 번째 문제부터 다시 시작합니다. 일반 플레이 기록은 유지돼요.';
  }
  function configureFieldMode() {
    if (!PLAY.autoStart || PLAY.isDemo) return;

    $('mode-label').textContent = '현장 문제';
    $('mode-caption').textContent = PLAY.quizNumber
      ? '문제 ' + PLAY.quizNumber + ' / ' + PLAY.quizCount
      : '통합 탐험';
    $('restart-dialog').querySelector('p').textContent =
      '이 문제의 진행 상황을 초기화하고 다시 시작합니다.';
  }
  function render() {
    $('unavailable-screen').hidden = PLAY.contentKind !== 'empty';
    if (PLAY.contentKind === 'empty') {
      $('start-screen').hidden = true;
      $('game-screen').hidden = true;
      $('complete-screen').hidden = true;
      return;
    }
    $('start-screen').hidden = state.screen !== 'start';
    $('game-screen').hidden = state.screen !== 'mission';
    $('complete-screen').hidden = state.screen !== 'complete';
    if (state.screen === 'start') {
      activeMissionId = null;
      return;
    }
    if (state.screen === 'complete') {
      renderCompletion();
      return;
    }
    renderMission();
  }
  function createFinding(mission, index) {
    const row = document.createElement('div');
    row.className = 'finding';
    const image = document.createElement('img');
    image.src = imageSource(mission, true);
    image.alt = '';
    const text = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent =
      String(PLAY.quizNumber || index + 1).padStart(2, '0') +
      ' · ' +
      mission.options.find((option) => option.id === mission.answerId).label;
    const explanation = document.createElement('p');
    explanation.textContent = mission.explanation;
    text.append(heading, explanation);
    row.append(image, text);
    return row;
  }
  function renderCompletion() {
    $('completed-count').textContent = missions.length + '개의 단서';
    $('findings').replaceChildren();
    missions.forEach((mission, index) => {
      $('findings').append(createFinding(mission, index));
    });
  }
  function renderMission() {
    const mission = missions[state.missionIndex];
    const number = String(PLAY.quizNumber || state.missionIndex + 1).padStart(
      2,
      '0',
    );
    const correct = state.feedback === 'correct';
    renderQuestion(mission, number);
    renderScene(mission, correct);
    renderOptions(mission, correct);
    renderProgress();
    renderHint(mission);
    renderFeedback(mission, correct);
    renderMissionActions(correct);
  }
  function renderQuestion(mission, number) {
    $('mission-number').textContent = number;
    $('mission-heading').textContent =
      mission.sceneKind === 'field'
        ? '2차 퀴즈 · 현장 관찰'
        : state.missionIndex + 1 + '번째 단서를 찾아요';
    $('mission-location').textContent = mission.placeLabel;
    $('scene-count').textContent =
      (mission.sceneKind === 'field' ? 'QUIZ ' : 'SCENE ') +
      number +
      ' / ' +
      String(PLAY.quizCount || missions.length).padStart(2, '0');
    $('question-kicker').textContent =
      mission.sceneKind === 'field'
        ? '2차 퀴즈 · 현장에서 답 찾기'
        : 'MISSION ' + number;
    $('question').textContent = mission.question;
  }
  function renderScene(mission, correct) {
    const currentImage = imageSource(mission, correct);
    if ($('mission-image').getAttribute('src') !== currentImage)
      $('mission-image').src = currentImage;
    $('mission-image').alt = imageDescription(mission, correct);
    $('scene-kind').textContent =
      mission.sceneKind === 'example'
        ? '예시 관찰 장면'
        : correct
          ? mission.answerImage
            ? '정답 확인 사진'
            : '주변 위치 참고 사진'
          : mission.sceneKind === 'field'
            ? '2차 · 현장 문제 사진'
            : '관찰할 장면';
    $('scene-container')
      .closest('figure')
      .querySelector('.observation').textContent =
      mission.sceneKind === 'field'
        ? '사진에서 확인할 모양을 살펴보고, 현장에서 질문의 답을 찾아보세요.'
        : '눈에 보이는 모양, 작은 표식, 방향. 정답은 항상 장면 안에 있어요.';
    $('evidence-mark').hidden =
      !correct || (mission.sceneKind === 'field' && !mission.answerImage);
    $('evidence-mark').style.left = mission.evidence.x + '%';
    $('evidence-mark').style.top = mission.evidence.y + '%';
    $('photo-caption').textContent = correct
      ? mission.answerImage
        ? '정답 사진에서 근거를 확인해요'
        : mission.sceneKind === 'field'
          ? '현장에서 본 단서를 해설과 비교해 보세요'
          : '표시된 부분이 정답의 근거예요'
      : mission.sceneKind === 'field'
        ? mission.quizImage
          ? '질문의 답을 현장에서 확인해 보세요'
          : '이곳에서 질문의 답을 확인해 보세요'
        : '화면 속 작은 단서를 찾아보세요';
  }
  function createOptionButton(option, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.dataset.option = option.id;
    const letter = document.createElement('span');
    letter.className = 'letter';
    letter.textContent = String.fromCharCode(65 + index);
    letter.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = option.label;
    const status = document.createElement('span');
    status.className = 'option-status';
    button.append(letter, label, status);
    button.addEventListener('click', () =>
      dispatch({ type: 'SELECT', optionId: option.id }),
    );
    return button;
  }
  function renderOptions(mission, correct) {
    if (activeMissionId !== mission.id) {
      activeMissionId = mission.id;
      $('options').replaceChildren();
      mission.options.forEach((option, index) => {
        $('options').append(createOptionButton(option, index));
      });
    }
    $('options')
      .querySelectorAll('button')
      .forEach((button) => {
        const id = button.dataset.option;
        const selected = id === state.selectedOptionId;
        button.setAttribute('aria-pressed', String(selected));
        button.disabled = correct;
        button.classList.toggle(
          'is-correct',
          correct && id === mission.answerId,
        );
        button.classList.toggle(
          'is-wrong',
          state.feedback === 'wrong' && selected,
        );
        button.querySelector('.option-status').textContent =
          correct && id === mission.answerId
            ? '정답 ✓'
            : state.feedback === 'wrong' && selected
              ? '다시 시도'
              : selected
                ? '선택'
                : '';
      });
  }
  function renderProgress() {
    $('progress-bars').replaceChildren();
    missions.forEach((item, i) => {
      const segment = document.createElement('span');
      segment.className =
        'progress-segment' +
        (state.solvedIds.includes(item.id)
          ? ' done'
          : i === state.missionIndex
            ? ' current'
            : '');
      $('progress-bars').append(segment);
    });
    $('progress-label').textContent =
      '발견 ' + state.solvedIds.length + ' / ' + missions.length;
  }
  function renderHint(mission) {
    $('hint-box').textContent = mission.hint;
    $('hint-box').hidden = !state.hintVisible;
    $('hint-button').setAttribute('aria-expanded', String(state.hintVisible));
    $('hint-button').textContent = state.hintVisible
      ? '힌트 접기 −'
      : '힌트가 필요해요 +';
  }
  function renderFeedback(mission, correct) {
    $('feedback').hidden = state.feedback === 'idle';
    $('feedback').dataset.kind = state.feedback;
    $('feedback-title').textContent = correct
      ? '발견했어요!'
      : state.feedback === 'wrong'
        ? '조금만 더 살펴볼까요?'
        : '';
    $('feedback-copy').textContent = correct
      ? mission.explanation
      : state.feedback === 'wrong'
        ? '아직 정답이 아니에요. 다른 답을 골라보세요. 어려우면 힌트를 펼쳐보세요.'
        : '';
  }
  function renderMissionActions(correct) {
    $('check-button').hidden = correct;
    $('check-button').disabled = state.selectedOptionId === null;
    $('next-button').hidden = !correct;
    $('next-label').textContent =
      state.missionIndex === missions.length - 1
        ? selectedQuiz
          ? '문제 결과 보기'
          : '탐험 결과 보기'
        : '다음 단서 찾기';
  }
  $('start-button').addEventListener('click', () => {
    if (!PLAY.autoStart && firstField) {
      location.assign('./map.html');
      return;
    }
    dispatch({ type: 'START' });
    focusSection('mission-heading');
  });
  $('check-button').addEventListener('click', () =>
    dispatch({ type: 'CHECK' }),
  );
  $('hint-button').addEventListener('click', () =>
    dispatch({ type: 'TOGGLE_HINT' }),
  );
  $('next-button').addEventListener('click', () => {
    dispatch({ type: 'NEXT' });
    focusSection(
      state.screen === 'complete' ? 'complete-heading' : 'mission-heading',
    );
  });
  $('restart-game').addEventListener('click', () =>
    $('restart-dialog').showModal(),
  );
  function restart() {
    dispatch({ type: 'RESTART' });
    if (PLAY.autoStart) {
      dispatch({ type: 'START' });
      focusSection('mission-heading');
      return;
    }
    $('start-button').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  $('confirm-restart').addEventListener('click', () => {
    $('restart-dialog').close();
    restart();
  });
  $('play-again').addEventListener('click', restart);
  function zoom() {
    const m = missions[state.missionIndex],
      correct = state.feedback === 'correct';
    $('large-image').src = imageSource(m, correct);
    $('large-image').alt = imageDescription(m, correct);
    $('large-caption').textContent =
      correct && m.answerImage
        ? m.evidenceQuote
        : m.placeLabel +
          (m.sceneKind === 'example'
            ? ' · 설명용 가상 그림'
            : m.quizImage
              ? ' · 질문의 답을 현장에서 확인해요'
              : ' · 장소를 찾는 사진 단서');
    $('image-dialog').showModal();
  }
  $('zoom-button').addEventListener('click', zoom);
  $('scene-container').addEventListener('click', zoom);
  function share() {
    if (location.protocol === 'file:') {
      showToast('공개된 게임 주소에서 링크를 공유할 수 있어요.');
      return;
    }
    $('share-url').value = new URL('./', location.href).href;
    $('copy-result').textContent = '';
    $('share-qr-image').src = ASSETS['assets/share-qr-20260913.jpg'];
    $('share-dialog').showModal();
  }
  $('share-top').addEventListener('click', share);
  $('share-end').addEventListener('click', share);
  $('copy-url').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText($('share-url').value);
      $('copy-result').textContent =
        '주소를 복사했어요. 원하는 곳에 붙여넣어 주세요.';
    } catch {
      $('share-url').focus();
      $('share-url').select();
      $('copy-result').textContent =
        '주소를 길게 누르거나 복사 단축키로 복사해 주세요.';
    }
  });
  document
    .querySelectorAll('[data-close]')
    .forEach((button) =>
      button.addEventListener('click', () => $(button.dataset.close).close()),
    );
  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => {
      $('toast').hidden = true;
    }, 3500);
  }
  configureIntro();
  configureNavigation();
  configureDemoMode();
  configureFieldMode();
  render();
  save();
})();
