import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPlaySession } from '../demo-session.mjs';
import { initialState, restoreState, transition } from '../game-state.mjs';

const example = { id: 'example-1', sceneKind: 'example', options: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], answerId: 'a' };
const songwol = { ...example, id: 'songwol-1', sceneKind: 'field', explorationRegionId: 'songwol' };
const chinatown = { ...example, id: 'chinatown-1', sceneKind: 'field', explorationRegionId: 'chinatown' };
const data = { version: 'test-v1', missions: [example, songwol, chinatown] };

test('normal mode shows field missions without auto-start and preserves existing storage identity', () => {
  const session = getPlaySession(data);
  assert.equal(session.isDemo, false);
  assert.equal(session.autoStart, false);
  assert.deepEqual(session.missions, [songwol, chinatown]);
  assert.equal(session.storageKey, 'golmok-detective:v1');
  assert.equal(session.storageVersion, data.version);
  assert.equal(session.mapHref, './map.html');
});

test('normal example-only mode keeps the example dataset', () => {
  const source = { ...data, missions: [example] };
  const session = getPlaySession(source);
  assert.equal(session.missions, source.missions);
  assert.equal(session.autoStart, false);
});

test('only explicit arrival queries for one supported region activate demo mode', () => {
  for (const search of ['?demo=arrival', '?region=songwol', '?demo=other&region=songwol',
    '?demo=arrival&region=elsewhere', '?demo=arrival&region=constructor',
    '?demo=arrival&region=songwol&region=chinatown', '?demo=arrival&demo=other&region=songwol',
    '?demo=arrival&play=field&region=songwol']) {
    const session = getPlaySession(data, search);
    assert.equal(session.isDemo, false, search);
    assert.equal(session.storageKey, 'golmok-detective:v1');
  }
  assert.equal(getPlaySession(data, '?demo=arrival&region=songwol').isDemo, true);
  assert.equal(getPlaySession(data, '?region=chinatown&demo=arrival').isDemo, true);
  assert.equal(getPlaySession(data, '?region=chinatown&demo=arrival').autoStart, true);
});

test('field play auto-starts only the chosen region with its own progress and share link', () => {
  const session = getPlaySession(data, '?play=field&region=chinatown');
  assert.equal(session.isDemo, false);
  assert.equal(session.autoStart, true);
  assert.equal(session.contentKind, 'field');
  assert.deepEqual(session.missions, [chinatown]);
  assert.equal(session.storageKey, 'golmok-detective:field:v1:chinatown');
  assert.equal(session.storageVersion, 'test-v1:field:chinatown');
  assert.equal(session.mapHref, './map.html?region=chinatown');
  assert.equal(session.queryString, '?play=field&region=chinatown');
  for (const search of ['?play=field', '?play=field&region=other', '?play=wrong&region=songwol',
    '?play=field&play=wrong&region=songwol', '?play=field&region=songwol&region=chinatown']) {
    assert.equal(getPlaySession(data, search).autoStart, false, search);
  }
});

test('field play with no matching field mission stays empty instead of showing examples or other regions', () => {
  const session = getPlaySession({ ...data, missions: [example, chinatown] }, '?play=field&region=songwol');
  assert.equal(session.isDemo, false);
  assert.equal(session.autoStart, true);
  assert.equal(session.contentKind, 'empty');
  assert.deepEqual(session.missions, []);
});

test('a demo selects only matching field missions in their original order', () => {
  const another = { ...songwol, id: 'songwol-2' };
  const unassigned = { ...songwol, id: 'unassigned', explorationRegionId: undefined };
  const source = { ...data, missions: [example, songwol, chinatown, another, unassigned] };
  const before = structuredClone(source);
  const session = getPlaySession(source, '?demo=arrival&region=songwol');
  assert.equal(session.contentKind, 'field');
  assert.deepEqual(session.missions.map(mission => mission.id), ['songwol-1', 'songwol-2']);
  assert.deepEqual(source, before);
  assert.equal(session.mapHref, './map.html?region=songwol');
  assert.equal(session.queryString, '?demo=arrival&region=songwol');
});

test('an unprepared region falls back to examples rather than another region field mission', () => {
  const anotherExample = { ...example, id: 'example-2' };
  for (const source of [
    { ...data, missions: [example, anotherExample] },
    { ...data, missions: [example, chinatown, anotherExample] },
  ]) {
    const session = getPlaySession(source, '?demo=arrival&region=songwol');
    assert.equal(session.contentKind, 'example');
    assert.deepEqual(session.missions.map(mission => mission.id), ['example-1', 'example-2']);
  }
});

test('a region with neither matching field missions nor examples has an empty prepared state', () => {
  const session = getPlaySession({ ...data, missions: [chinatown] }, '?demo=arrival&region=songwol');
  assert.equal(session.isDemo, true);
  assert.equal(session.contentKind, 'empty');
  assert.deepEqual(session.missions, []);
});

test('normal, field, and demo regions use separate storage, and demo fallback versions differ from field versions', () => {
  const normal = getPlaySession(data);
  const first = getPlaySession(data, '?demo=arrival&region=songwol');
  const second = getPlaySession(data, '?demo=arrival&region=chinatown');
  const fieldFirst = getPlaySession(data, '?play=field&region=songwol');
  const fieldSecond = getPlaySession(data, '?play=field&region=chinatown');
  assert.equal(new Set([normal.storageKey, first.storageKey, second.storageKey, fieldFirst.storageKey, fieldSecond.storageKey]).size, 5);
  const fallback = getPlaySession({ ...data, missions: [example] }, '?demo=arrival&region=songwol');
  assert.equal(fallback.storageKey, first.storageKey);
  assert.notEqual(fallback.storageVersion, first.storageVersion);
});

test('arrival demo enters a quiz without solving it and cannot restore normal progress as demo progress', () => {
  const session = getPlaySession(data, '?demo=arrival&region=songwol');
  let state = initialState(session.missions);
  state = transition(state, { type: 'START' }, session.missions);
  assert.equal(state.screen, 'mission');
  assert.equal(state.missionIndex, 0);
  assert.equal(state.feedback, 'idle');
  assert.deepEqual(state.solvedIds, []);
  const normal = getPlaySession({ ...data, missions: session.missions });
  const normalState = transition(transition(state, { type: 'SELECT', optionId: 'a' }, session.missions), { type: 'CHECK' }, session.missions);
  assert.deepEqual(
    restoreState({ version: normal.storageVersion, state: normalState }, session.missions, session.storageVersion),
    initialState(session.missions),
  );
  assert.deepEqual(
    restoreState({ version: session.storageVersion, state }, session.missions, session.storageVersion),
    state,
  );
});
