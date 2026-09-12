import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadMissionData } from '../load-quiz.mjs';

const html = await readFile(new URL('../public/map.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1, 'the deployed map has one inline controller');
const controller = scripts[0][1];
const config = JSON.parse(controller.match(/const MAP = (\{[^\n]+\});/)[1]);
const startTime = 1_789_200_000_000;

function element(attributes = {}) {
  const attrs = new Map(Object.entries(attributes));
  const handlers = new Map();
  const classes = new Set((attributes.class ?? '').split(/\s+/).filter(Boolean));
  return {
    dataset: Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5), value])),
    style: {}, children: [], textContent: '', disabled: false, clientWidth: 390, clientHeight: 440,
    get hidden() { return attrs.has('hidden'); },
    set hidden(value) { if (value) attrs.set('hidden', ''); else attrs.delete('hidden'); },
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
function page({ secure = true, supported = true, throwing = false, search = '' } = {}) {
  const nodes = new Map();
  for (const tag of html.matchAll(/<[a-z][^>]*\bid="[^"]+"[^>]*>/gi)) {
    const attributes = Object.fromEntries([...tag[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
    if (/\shidden(?:\s|>)/.test(tag[0])) attributes.hidden = '';
    nodes.set(attributes.id, element(attributes));
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
      if (selector === '[data-region]') return nodes.get('region-buttons').children;
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

test('a known region query selects its map zone and corresponding arrival demo link', () => {
  for (const region of config.regions) {
    const ui = page({ search: '?region=' + encodeURIComponent(region.id) });
    assert.equal(ui.get('region-title').textContent, region.letter + ' · ' + region.name);
    assert.equal(ui.get('region-description').textContent, region.description);
    assert.equal(ui.get('demo-arrival').getAttribute('href'), './?demo=arrival&region=' + encodeURIComponent(region.id));
    assert.equal(ui.get('zone-' + region.id).classList.contains('is-active'), true);
    for (const button of ui.get('region-buttons').children) {
      assert.equal(button.getAttribute('aria-pressed'), String(button.dataset.region === region.id));
    }
    assert.equal(ui.visible(), false, 'selecting a region must not fabricate a GPS location');
    assert.equal(ui.requests.length, 0);
  }
});

test('missing or unknown region queries use the first configured zone and a safe demo link', () => {
  const fallback = config.regions[0];
  for (const search of ['', '?region=', '?region=unknown', '?region=%22%3E%3Cscript%3E']) {
    const ui = page({ search });
    assert.equal(ui.get('region-title').textContent, fallback.letter + ' · ' + fallback.name);
    assert.equal(ui.get('demo-arrival').getAttribute('href'), './?demo=arrival&region=' + encodeURIComponent(fallback.id));
    assert.equal(ui.visible(), false);
    assert.equal(ui.requests.length, 0);
  }
});

test('changing the region updates the arrival link without changing a measured GPS location', () => {
  const ui = page();
  ui.click();
  ui.requests[0].success(ui.position());
  const measuredTransform = ui.get('user-location').getAttribute('transform');
  const measuredMessage = ui.message();
  for (const region of [...config.regions].reverse()) {
    const button = ui.get('region-buttons').children.find(candidate => candidate.dataset.region === region.id);
    button.emit('click');
    assert.equal(ui.get('region-title').textContent, region.letter + ' · ' + region.name);
    assert.equal(ui.get('demo-arrival').getAttribute('href'), './?demo=arrival&region=' + encodeURIComponent(region.id));
    assert.equal(ui.get('user-location').getAttribute('transform'), measuredTransform);
    assert.equal(ui.visible(), true);
    assert.equal(ui.message(), measuredMessage);
    assert.equal(ui.requests.length, 1);
  }
});

test('field play and its clue appear only in a region with an authored field mission', async () => {
  const source = await loadMissionData();
  const ui = page();
  for (const region of config.regions) {
    const mission = source.missions.find(item => item.sceneKind === 'field' && item.explorationRegionId === region.id);
    ui.get('region-buttons').children.find(button => button.dataset.region === region.id).emit('click');
    assert.equal(region.ready, Boolean(mission));
    assert.equal(ui.get('field-play').hidden, !mission);
    assert.equal(ui.get('field-quiz').getAttribute('href'), './?play=field&region=' + encodeURIComponent(region.id));
    assert.equal(ui.get('demo-arrival').getAttribute('href'), './?demo=arrival&region=' + encodeURIComponent(region.id));
    assert.equal(ui.get('region-clue').hidden, !mission);
    if (mission) {
      assert.equal(ui.get('region-status').textContent, '현장 4지선다 미션');
      assert.equal(ui.get('region-clue').alt, mission.imageAlt);
      const sourceBytes = await readFile(new URL('../public/' + mission.image, import.meta.url));
      assert.equal(ui.get('region-clue').src.split(',')[1], sourceBytes.toString('base64'));
    } else {
      assert.match(ui.get('region-status').textContent, /문제 준비 중/);
      assert.equal(ui.get('region-clue').getAttribute('src'), null);
      assert.equal(ui.get('region-clue').alt, '');
    }
    assert.equal(ui.visible(), false, 'a ready mission must not create a GPS arrival marker');
    assert.equal(ui.requests.length, 0);
  }
});

test('the map does not embed second-stage quiz or answer images for a field mission', async () => {
  const source = await loadMissionData();
  for (const mission of source.missions.filter(item => item.sceneKind === 'field')) {
    for (const imagePath of [mission.quizImage, mission.answerImage].filter(Boolean)) {
      const bytes = await readFile(new URL('../public/' + imagePath, import.meta.url));
      assert.equal(html.includes(bytes.toString('base64')), false, 'second-stage photos must not be used as map clues');
      assert.equal(html.includes(imagePath), false);
    }
  }
});
