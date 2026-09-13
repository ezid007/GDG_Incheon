'use strict';
const MAP = /*__MAPDATA__*/ null;
/*__LOCATION__*/
const $ = (id) => document.getElementById(id);
const MAP_MIN_WIDTH = 600;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.3;
const LOCATION_REQUEST_TIMEOUT_MS = 15000;
const LOCATION_PENDING_TIMEOUT_MS = 20000;
let selectedQuiz = null,
  zoom = 1,
  expiryTimer,
  lastTimestamp = 0,
  requestSerial = 0,
  pendingTimer;
function focusMapPoint(point) {
  point = point || { x: MAP.width / 2, y: MAP.height / 2 };
  const scale = $('map-canvas').clientWidth / MAP.width;
  $('map-scroll').scrollTo({
    left: point.x * scale - $('map-scroll').clientWidth / 2,
    top: point.y * scale - $('map-scroll').clientHeight / 2,
    behavior: 'instant',
  });
}
function resizeMap() {
  const width = Math.max(MAP_MIN_WIDTH, $('map-scroll').clientWidth) * zoom;
  $('map-canvas').style.width = width + 'px';
  $('map-canvas').style.height = (width * MAP.height) / MAP.width + 'px';
  $('zoom-out').disabled = zoom <= ZOOM_MIN;
  $('zoom-in').disabled = zoom >= ZOOM_MAX;
  focusMapPoint(selectedQuiz);
}
function selectQuiz(quiz, scrollToMap = false) {
  selectedQuiz = quiz || null;
  $('quiz-warning').hidden = Boolean(quiz) || !MAP.quizzes.length;
  $('quiz-warning').textContent = quiz
    ? ''
    : '요청한 문제를 찾지 못했어요. 아래 사진 목록에서 원하는 문제의 지도를 열어 주세요.';
  $('map-question-title').textContent = quiz
    ? '문제 ' + quiz.number + ' · 탐색 지도'
    : '탐색 지도';
  $('map-question-description').textContent = quiz
    ? quiz.description
    : '위의 문제에서 지도 보기 버튼을 눌러 탐색할 범위를 확인해요.';
  MAP.quizzes.forEach((item) => {
    const active = item.id === quiz?.id;
    $('map-button-' + item.id).setAttribute('aria-pressed', String(active));
    $('quiz-card-' + item.id).classList.toggle('is-selected', active);
  });
  document.querySelectorAll('[data-zone]').forEach((zone) => {
    const active = zone.dataset.zone === quiz?.id;
    zone.classList.toggle('is-active', active);
    if (active) zone.removeAttribute('hidden');
    else zone.setAttribute('hidden', '');
  });
  focusMapPoint(quiz);
  if (scrollToMap)
    $('shared-map').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
MAP.quizzes.forEach((quiz) =>
  $('map-button-' + quiz.id).addEventListener('click', () =>
    selectQuiz(quiz, true),
  ),
);
$('zoom-in').addEventListener('click', () => {
  zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP);
  resizeMap();
});
$('zoom-out').addEventListener('click', () => {
  zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP);
  resizeMap();
});
$('fit').addEventListener('click', () => {
  zoom =
    $('map-scroll').clientWidth /
    Math.max(MAP_MIN_WIDTH, $('map-scroll').clientWidth);
  resizeMap();
});
window.addEventListener('resize', resizeMap);
function status(message, state = 'idle') {
  $('location-status').textContent = message;
  $('location-status').dataset.state = state;
}
function hideLocation() {
  clearTimeout(expiryTimer);
  $('user-location').setAttribute('hidden', '');
  lastTimestamp = 0;
}
function checkExpiry() {
  if (lastTimestamp && Date.now() - lastTimestamp > LOCATION_MAX_AGE_MS) {
    hideLocation();
    status(
      '확인한 지 1분이 지나 위치 점을 숨겼어요. 이동했다면 다시 확인해 주세요.',
    );
  }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkExpiry();
});
function showPosition(position) {
  const result = assessLocation(position, MAP.bounds, MAP.width, MAP.height);
  hideLocation();
  const messages = {
    outside:
      '지금은 이 지도의 범위 밖이에요. 차이나타운·동화마을에 도착해서 다시 확인해 주세요.',
    inaccurate:
      '위치 오차가 커서 점을 표시하지 않았어요. 주변이 트인 곳에서 다시 확인해 주세요.',
    stale: '오래된 위치가 전달됐어요. 현재 위치를 다시 확인해 주세요.',
    invalid:
      '위치를 읽지 못했어요. 휴대전화의 위치 설정을 확인한 뒤 다시 눌러 주세요.',
  };
  if (result.status !== 'ready') {
    status(messages[result.status], 'error');
    return;
  }
  lastTimestamp = result.timestamp;
  $('user-location').setAttribute(
    'transform',
    `translate(${result.x} ${result.y})`,
  );
  $('user-accuracy').setAttribute('rx', result.radiusX);
  $('user-accuracy').setAttribute('ry', result.radiusY);
  $('user-location').removeAttribute('hidden');
  status(
    '파란 점이 현재 위치예요. 예상 오차 약 ' +
      Math.max(1, Math.ceil(result.accuracy)) +
      'm · 이동 후 다시 눌러 주세요.',
    'ready',
  );
  focusMapPoint(result);
  expiryTimer = setTimeout(
    checkExpiry,
    Math.max(0, LOCATION_MAX_AGE_MS - (Date.now() - result.timestamp)) + 20,
  );
}
function locateUser() {
  hideLocation();
  if (!window.isSecureContext) {
    status(
      '위치 확인은 HTTPS 주소에서 가능해요. 공개된 게임 주소로 열어 주세요.',
      'error',
    );
    return;
  }
  if (!navigator.geolocation) {
    status(
      '이 브라우저에서는 위치 확인을 지원하지 않아요. 그림 지도로 주변을 살펴봐 주세요.',
      'error',
    );
    return;
  }
  const serial = ++requestSerial;
  $('locate').disabled = true;
  status('현재 위치를 확인하고 있어요. 권한 창이 나타나면 허용해 주세요.');
  const finish = () => {
    if (serial !== requestSerial) return false;
    clearTimeout(pendingTimer);
    $('locate').disabled = false;
    return true;
  };
  pendingTimer = setTimeout(() => {
    if (finish()) {
      requestSerial++;
      status(
        '위치 확인이 오래 걸리고 있어요. 휴대전화 위치 권한을 확인한 뒤 다시 눌러 주세요.',
        'error',
      );
    }
  }, LOCATION_PENDING_TIMEOUT_MS);
  try {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (finish()) showPosition(position);
      },
      (error) => {
        if (!finish()) return;
        const messages = {
          1: '위치 접근이 허용되지 않았어요. 브라우저의 사이트 설정에서 위치를 허용하고 다시 눌러 주세요.',
          2: '현재 위치를 찾지 못했어요. 휴대전화 위치 기능을 켜고 다시 시도해 주세요.',
          3: '위치를 확인하는 시간이 지났어요. 주변이 트인 곳에서 다시 눌러 주세요.',
        };
        status(
          messages[error.code] ||
            '위치 확인에 실패했어요. 잠시 후 다시 눌러 주세요.',
          'error',
        );
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_REQUEST_TIMEOUT_MS,
        maximumAge: 0,
      },
    );
  } catch {
    if (finish())
      status(
        '위치 기능을 실행하지 못했어요. 브라우저 설정을 확인해 주세요.',
        'error',
      );
  }
}
$('locate').addEventListener('click', locateUser);
const requested = new URLSearchParams(window.location.search);
if (requested.has('quiz')) {
  selectedQuiz =
    requested.getAll('quiz').length === 1
      ? MAP.quizzes.find((quiz) => quiz.id === requested.get('quiz')) || null
      : null;
} else {
  selectedQuiz =
    MAP.quizzes.find((quiz) => quiz.regionId === requested.get('region')) ||
    MAP.quizzes[0] ||
    null;
}
resizeMap();
selectQuiz(selectedQuiz);
if (selectedQuiz && (requested.has('quiz') || requested.has('region')))
  $('quiz-card-' + selectedQuiz.id).scrollIntoView({
    behavior: 'instant',
    block: 'start',
  });
