import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadMissionData } from '../load-quiz.mjs';
import { renderMap } from '../build-map.mjs';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const source = await loadMissionData();
const html = await renderMap(appRoot, source);
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1, 'the deployed map has one inline controller');
const controller = scripts[0][1];
const config = JSON.parse(controller.match(/const MAP = (\{[^\n]+\});/)[1]);
const startTime = 1_789_200_000_000;

function element(attributes = {}, reflectsHidden = true) {
  const attrs = new Map(Object.entries(attributes));
  const handlers = new Map();
  const classes = new Set((attributes.class ?? '').split(/\s+/).filter(Boolean));
  let hiddenProperty;
  return {
    dataset: Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5), value])),
    style: {}, children: [], textContent: '', disabled: false, clientWidth: 390, clientHeight: 440,
    get hidden() { return reflectsHidden ? attrs.has('hidden') : hiddenProperty; },
    set hidden(value) { if (!reflectsHidden) hiddenProperty = value; else if (value) attrs.set('hidden', ''); else attrs.delete('hidden'); },
    get src() { return attrs.get('src') ?? ''; },
    set src(value) { attrs.set('src', String(value)); },
    get alt() { return attrs.get('alt') ?? ''; },
    set alt(value) { attrs.set('alt', String(value)); },
    classList: { toggle(name, force) { if (force) classes.add(name); else classes.delete(name); }, contains: name => classes.has(name) },
    setAttribute(name, value) { attrs.set(name, String(value)); },
    removeAttribute(name) { attrs.delete(name); },
    getAttribute(name) { return attrs.get(name) ?? null; },
    hasAttribute(name) { return attrs.has(name); },
    addEventListener(name, callback) { handlers.set(name, callback); },
    emit(name) { if (name !== 'click' || !this.disabled) handlers.get(name)?.(); },
    append(child) { this.children.push(child); },
    scrollTo(options) { this.lastScroll = options; },
  };
}

// Only tests supply positions and time. The production page has no simulated GPS path.
function page({ secure = true, supported = true, throwing = false, search = '', markup = html } = {}) {
  const controller = [...markup.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)][0][1];
  const config = JSON.parse(controller.match(/const MAP = (\{[^\n]+\});/)[1]);
  const nodes = new Map();
  for (const tag of markup.matchAll(/<[a-z][^>]*\bid="[^"]+"[^>]*>/gi)) {
    const attributes = Object.fromEntries([...tag[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
    if (/\shidden(?:\s|>)/.test(tag[0])) attributes.hidden = '';
    nodes.set(attributes.id, element(attributes, !/^<g\b/i.test(tag[0])));
  }
  assert.ok(nodes.get('user-location').hasAttribute('hidden'), 'the initial SVG must hide the location marker');
  const timers = new Map();
  const requests = [];
  let currentTime = startTime;
  let timerId = 0;
  const document = {
    ...element(), hidden: false,
    getElementById: id => { assert.ok(nodes.has(id), `unexpected DOM lookup: ${id}`); return nodes.get(id); },
    createElement: () => element(),
    querySelectorAll: selector => {
      if (selector === '[data-quiz]') return nodes.get('region-buttons').children;
      if (selector === '[data-zone]') return [...nodes.values()].filter(node => node.dataset.zone);
      throw new Error(`unexpected selector: ${selector}`);
    },
  };
  const navigator = {};
  if (supported) navigator.geolocation = {
    getCurrentPosition(success, error, options) {
      if (throwing) throw new Error('location unavailable');
      requests.push({ success, error, options });
    },
  };
  runInNewContext(controller, {
    document, navigator, URLSearchParams, encodeURIComponent,
    window: { ...element(), isSecureContext: secure, location: { search } },
    Date: class extends Date { static now() { return currentTime; } },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, due: currentTime + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  }, { filename: 'public/map.html', timeout: 1000 });
  const get = id => nodes.get(id);
  return {
    get, requests, document,
    click: () => get('locate').emit('click'),
    visible: () => !get('user-location').hasAttribute('hidden'),
    state: () => get('location-status').dataset.state,
    message: () => get('location-status').textContent,
    position(overrides = {}, age = 0) {
      return {
        coords: { latitude: (config.bounds.north + config.bounds.south) / 2,
          longitude: (config.bounds.east + config.bounds.west) / 2, accuracy: 15, ...overrides },
        timestamp: currentTime - age,
      };
    },
    advance(ms, runTimers = true) {
      const end = currentTime + ms;
      if (runTimers) {
        let steps = 0;
        while (true) {
          const next = [...timers].filter(([, timer]) => timer.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
          if (!next) break;
          assert.ok(++steps < 100, 'timer callbacks must terminate');
          currentTime = next[1].due;
          timers.delete(next[0]);
          next[1].callback();
        }
      }
      currentTime = end;
    },
  };
}

test('a map waits for a user gesture, then displays a recent location and accuracy ellipse', () => {
  const ui = page();
  assert.equal(ui.requests.length, 0);
  assert.equal(ui.visible(), false);
  assert.equal(ui.get('user-location').getAttribute('transform'), null);
  ui.click();
  assert.equal(ui.get('locate').disabled, true);
  assert.equal(ui.requests.length, 1);
  assert.equal(ui.requests[0].options.enableHighAccuracy, true);
  assert.equal(ui.requests[0].options.timeout, 15_000);
  assert.equal(ui.requests[0].options.maximumAge, 0);
  ui.requests[0].success(ui.position());
  assert.equal(ui.visible(), true);
  assert.equal(ui.state(), 'ready');
  assert.equal(ui.get('locate').disabled, false);
  assert.match(ui.message(), /예상 오차 약 15m/);
  const coordinates = ui.get('user-location').getAttribute('transform').match(/translate\(([^ ]+) ([^)]+)\)/);
  assert.ok(Math.abs(Number(coordinates[1]) - config.width / 2) < 1e-6);
  assert.ok(Math.abs(Number(coordinates[2]) - config.height / 2) < 1e-6);
  assert.ok(Number(ui.get('user-accuracy').getAttribute('rx')) > 0);
  assert.ok(Number(ui.get('user-accuracy').getAttribute('ry')) > 0);
});

test('insecure and unsupported browsers explain the limitation without requesting location', () => {
  for (const [settings, message] of [[{ secure: false }, /HTTPS/], [{ supported: false }, /지원하지/]]) {
    const ui = page(settings);
    ui.click();
    assert.equal(ui.requests.length, 0);
    assert.equal(ui.visible(), false);
    assert.equal(ui.state(), 'error');
    assert.equal(ui.get('locate').disabled, false);
    assert.match(ui.message(), message);
  }
});

test('permission denial, unavailable position, and browser timeout let users retry', () => {
  for (const [code, message] of [[1, /허용되지/], [2, /찾지 못/], [3, /시간이 지났/], [99, /실패/]]) {
    const ui = page();
    ui.click();
    ui.requests[0].error({ code });
    assert.equal(ui.visible(), false);
    assert.equal(ui.state(), 'error');
    assert.equal(ui.get('locate').disabled, false);
    assert.match(ui.message(), message);
    ui.advance(20_001);
    assert.match(ui.message(), message, 'completed requests must clear the fallback timer');
    ui.click();
    assert.equal(ui.requests.length, 2);
  }
});

test('outside, inaccurate, stale, and invalid readings never reveal a location marker', () => {
  for (const [makePosition, message] of [
    [ui => ui.position({ longitude: config.bounds.east + 0.01 }), /범위 밖/],
    [ui => ui.position({ accuracy: 101 }), /오차가 커서/],
    [ui => ui.position({}, 60_001), /오래된/],
    [ui => ui.position({ latitude: NaN }), /읽지 못/],
  ]) {
    const ui = page();
    ui.click();
    ui.requests[0].success(makePosition(ui));
    assert.equal(ui.visible(), false);
    assert.equal(ui.state(), 'error');
    assert.equal(ui.get('locate').disabled, false);
    assert.equal(ui.get('user-location').getAttribute('transform'), null);
    assert.equal(ui.get('user-accuracy').getAttribute('rx'), null);
    assert.match(ui.message(), message);
  }
});

test('one-minute expiry hides old locations and prompts a fresh measurement', () => {
  const ui = page();
  ui.click();
  ui.requests[0].success(ui.position());
  ui.advance(59_999);
  assert.equal(ui.visible(), true);
  ui.advance(22);
  assert.equal(ui.visible(), false);
  assert.equal(ui.state(), 'idle');
  assert.match(ui.message(), /1분이 지나/);
});

test('a page returning from the background expires its marker even when timers were paused', () => {
  const ui = page();
  ui.click();
  ui.requests[0].success(ui.position());
  ui.document.hidden = true;
  ui.advance(65_000, false);
  ui.document.hidden = false;
  ui.document.emit('visibilitychange');
  assert.equal(ui.visible(), false);
  assert.match(ui.message(), /1분이 지나/);
});

test('a new lookup immediately hides the old marker and replaces its expiry timer', () => {
  const ui = page();
  ui.click();
  ui.requests[0].success(ui.position());
  ui.advance(30_000);
  ui.click();
  assert.equal(ui.visible(), false);
  ui.requests[1].success(ui.position());
  ui.advance(30_021);
  assert.equal(ui.visible(), true, 'the first reading expiry cannot remove the new reading');
  ui.advance(30_000);
  assert.equal(ui.visible(), false);
});

test('the fallback timer releases a hanging request and rejects its late callbacks', () => {
  const ui = page();
  ui.click();
  ui.click();
  assert.equal(ui.requests.length, 1, 'disabled buttons prevent duplicate requests');
  ui.advance(20_000);
  assert.equal(ui.get('locate').disabled, false);
  assert.equal(ui.visible(), false);
  assert.match(ui.message(), /오래 걸리고/);
  ui.requests[0].success(ui.position());
  assert.equal(ui.visible(), false);
  assert.match(ui.message(), /오래 걸리고/);
  ui.click();
  ui.requests[0].error({ code: 1 });
  assert.equal(ui.get('locate').disabled, true, 'an old error cannot finish a newer lookup');
  ui.requests[1].success(ui.position());
  assert.equal(ui.visible(), true);
  assert.equal(ui.get('locate').disabled, false);
  assert.equal(ui.state(), 'ready');
});

test('a synchronous geolocation failure clears timers and restores the button', () => {
  const ui = page({ throwing: true });
  ui.click();
  assert.equal(ui.get('locate').disabled, false);
  assert.equal(ui.visible(), false);
  assert.equal(ui.state(), 'error');
  assert.match(ui.message(), /실행하지 못/);
  ui.advance(20_001);
  assert.match(ui.message(), /실행하지 못/);
});

test('a quiz query selects only its search circle and corresponding field and demo links', () => {
  for (const quiz of config.quizzes) {
    const ui = page({ search: '?quiz=' + encodeURIComponent(quiz.id) });
    assert.equal(ui.get('region-title').textContent, '문제 ' + quiz.number + ' · 장소 찾기');
    assert.equal(ui.get('region-description').textContent, quiz.description);
    assert.equal(ui.get('field-quiz').getAttribute('href'), './?play=field&quiz=' + encodeURIComponent(quiz.id));
    assert.equal(ui.get('demo-arrival').getAttribute('href'), './?demo=arrival&quiz=' + encodeURIComponent(quiz.id));
    for (const item of config.quizzes) {
      const zone = ui.get('zone-' + item.id);
      assert.equal(zone.hasAttribute('hidden'), item.id !== quiz.id, 'SVG visibility must change through its hidden attribute');
      assert.equal(zone.classList.contains('is-active'), item.id === quiz.id);
    }
    for (const button of ui.get('region-buttons').children) {
      assert.equal(button.getAttribute('aria-pressed'), String(button.dataset.quiz === quiz.id));
    }
    assert.equal(ui.visible(), false);
    assert.equal(ui.requests.length, 0);
  }
});

test('legacy region links select a matching quiz or the first authored quiz', () => {
  for (const search of ['', '?region=', '?region=unknown', '?region=songwol', '?region=chinatown']) {
    const legacyRegion = new URLSearchParams(search).get('region');
    const expected = config.quizzes.find(quiz => quiz.regionId === legacyRegion) || config.quizzes[0];
    const ui = page({ search });
    assert.equal(ui.get('region-title').textContent, '문제 ' + expected.number + ' · 장소 찾기');
    assert.equal(ui.get('demo-arrival').getAttribute('href'), './?demo=arrival&quiz=' + encodeURIComponent(expected.id));
    assert.equal(ui.visible(), false);
    assert.equal(ui.requests.length, 0);
  }
});

test('an explicit missing or ambiguous quiz never silently opens a different question', () => {
  for (const search of ['?quiz=', '?quiz=unknown', '?quiz=%22%3E%3Cscript%3E', '?quiz=unknown&region=chinatown', '?quiz=' + config.quizzes[0].id + '&quiz=unknown']) {
    const ui = page({ search });
    assert.equal(ui.get('field-play').hidden, true);
    assert.equal(ui.get('demo-panel').hidden, true);
    assert.equal(ui.get('region-clue').hidden, true);
    assert.equal(ui.get('field-quiz').getAttribute('href'), null);
    assert.equal(ui.get('demo-arrival').getAttribute('href'), null);
    assert.match(ui.get('region-description').textContent, /문제를 찾지 못/);
    for (const quiz of config.quizzes) assert.equal(ui.get('zone-' + quiz.id).hasAttribute('hidden'), true);
    ui.get('region-buttons').children[0].emit('click');
    assert.equal(ui.get('field-play').hidden, false, 'the problem list can recover from a stale link');
  }
});

test('changing the quiz updates its links without changing a measured GPS location', async () => {
  const first = source.missions.find(mission => mission.sceneKind === 'field');
  const fixture = { ...source, missions: [first, { ...first, id: 'second-field-mission', explorationRegionId: 'songwol', explorationDescription: '두 번째 사진의 장소를 찾아보세요.' }] };
  const markup = await renderMap(appRoot, fixture);
  const ui = page({ markup });
  ui.click();
  ui.requests[0].success(ui.position());
  const measuredTransform = ui.get('user-location').getAttribute('transform');
  const measuredMessage = ui.message();
  assert.equal(ui.get('region-buttons').children.length, 2);
  for (const [index, button] of ui.get('region-buttons').children.entries()) {
    button.emit('click');
    assert.equal(button.textContent, '문제 ' + (index + 1));
    assert.equal(ui.get('region-title').textContent, '문제 ' + (index + 1) + ' · 장소 찾기');
    assert.equal(ui.get('field-quiz').getAttribute('href'), './?play=field&quiz=' + encodeURIComponent(button.dataset.quiz));
    assert.equal(ui.get('demo-arrival').getAttribute('href'), './?demo=arrival&quiz=' + encodeURIComponent(button.dataset.quiz));
    for (const mission of fixture.missions) assert.equal(ui.get('zone-' + mission.id).hasAttribute('hidden'), mission.id !== button.dataset.quiz);
    assert.equal(ui.get('user-location').getAttribute('transform'), measuredTransform);
    assert.equal(ui.visible(), true);
    assert.equal(ui.message(), measuredMessage);
    assert.equal(ui.requests.length, 1);
  }
});

test('only authored field missions become numbered map problems and cropped photo clues', async () => {
  const missions = source.missions.filter(mission => mission.sceneKind === 'field');
  assert.deepEqual(config.quizzes.map(quiz => quiz.id), missions.map(mission => mission.id));
  const ui = page();
  assert.equal(ui.get('region-buttons').children.length, missions.length);
  for (const [index, mission] of missions.entries()) {
    const quiz = config.quizzes[index];
    ui.get('region-buttons').children[index].emit('click');
    assert.equal(quiz.number, index + 1);
    assert.equal(ui.get('field-play').hidden, false);
    assert.equal(ui.get('demo-panel').hidden, false);
    assert.equal(ui.get('region-clue').hidden, false);
    assert.equal(ui.get('region-clue').alt, mission.imageAlt);
    const bytes = await readFile(new URL('../public/' + mission.image, import.meta.url));
    assert.equal(ui.get('region-clue').src.split(',')[1], bytes.toString('base64'));
    assert.equal(ui.visible(), false);
    assert.equal(ui.requests.length, 0);
  }
  assert.equal(config.regions, undefined, 'internal district definitions do not become public navigation tabs');
});

test('the map does not embed second-stage quiz or answer images for a field mission', async () => {
  for (const mission of source.missions.filter(item => item.sceneKind === 'field')) {
    for (const imagePath of [mission.quizImage, mission.answerImage].filter(Boolean)) {
      const bytes = await readFile(new URL('../public/' + imagePath, import.meta.url));
      assert.equal(html.includes(bytes.toString('base64')), false, 'second-stage photos must not be used as map clues');
      assert.equal(html.includes(imagePath), false);
    }
  }
});

test('an empty authored problem list leaves the map and GPS usable without arrival buttons', async () => {
  const markup = await renderMap(appRoot, { ...source, missions: source.missions.filter(mission => mission.sceneKind !== 'field') });
  const ui = page({ markup, search: '?quiz=missing' });
  assert.equal(ui.get('region-buttons').children.length, 0);
  assert.equal(ui.get('field-play').hidden, true);
  assert.equal(ui.get('demo-panel').hidden, true);
  assert.equal(ui.get('region-clue').hidden, true);
  assert.match(ui.get('region-description').textContent, /아직 등록된 현장 문제가 없어요/);
  assert.equal(ui.get('field-quiz').getAttribute('href'), null);
  assert.equal(ui.get('demo-arrival').getAttribute('href'), null);
  ui.get('zoom-in').emit('click');
  ui.get('fit').emit('click');
  ui.click();
  ui.requests[0].success(ui.position());
  assert.equal(ui.visible(), true);
});

test('multiple missions in one district keep distinct areas, descriptions and quiz selection', async () => {
  const first = source.missions.find(mission => mission.sceneKind === 'field');
  const area = { latitude: 37.477, longitude: 126.620, radiusMeters: 85 };
  const second = { ...first, id: 'second-same-district', explorationArea: area, explorationDescription: '두 번째 문제 전용 탐색 설명' };
  const markup = await renderMap(appRoot, { ...source, missions: [first, second] });
  const generated = JSON.parse(markup.match(/const MAP = (\{[^\n]+\});/)[1]);
  assert.equal(generated.quizzes.length, 2);
  assert.equal(generated.quizzes[1].description, second.explorationDescription);
  assert.ok(Math.abs(generated.quizzes[1].x - (area.longitude - config.bounds.west) / (config.bounds.east - config.bounds.west) * config.width) < 0.01);
  assert.ok(Math.abs(generated.quizzes[1].y - (config.bounds.north - area.latitude) / (config.bounds.north - config.bounds.south) * config.height) < 0.01);
  assert.notEqual(generated.quizzes[0].radius, generated.quizzes[1].radius);
  const ui = page({ markup, search: '?quiz=second-same-district&region=chinatown' });
  assert.equal(ui.get('region-title').textContent, '문제 2 · 장소 찾기');
  assert.equal(ui.get('region-description').textContent, second.explorationDescription);
  assert.equal(ui.get('zone-' + first.id).hasAttribute('hidden'), true);
  assert.equal(ui.get('zone-' + second.id).hasAttribute('hidden'), false);
  assert.equal(ui.get('field-quiz').getAttribute('href'), './?play=field&quiz=second-same-district');
});

test('invalid mission-specific exploration areas fail instead of inventing or snapping coordinates', async () => {
  const first = source.missions.find(mission => mission.sceneKind === 'field');
  for (const area of [null, {}, {latitude:37.477,longitude:126.620,radiusMeters:0}, {latitude:37.477,longitude:126.620,radiusMeters:NaN}, {latitude:37.477,longitude:127,radiusMeters:100}, {latitude:'37.477',longitude:126.620,radiusMeters:100}]) {
    await assert.rejects(renderMap(appRoot, { ...source, missions: [{...first, explorationArea:area}] }), /Invalid exploration area/);
  }
});
