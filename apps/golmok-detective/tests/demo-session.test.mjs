import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPlaySession } from '../demo-session.mjs';
import { initialState, restoreState, transition } from '../game-state.mjs';

const example = { id: 'example-1', sceneKind: 'example', options: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], answerId: 'a' };
const fieldOptions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const songwol = { ...example, id: 'songwol-1', sceneKind: 'field', explorationRegionId: 'songwol', options: fieldOptions, answerId: 'd' };
const chinatown = { ...songwol, id: 'chinatown-1', explorationRegionId: 'chinatown' };
const data = { version: 'test-v1', missions: [example, songwol, chinatown] };

test('normal mode combines field quizzes from both regions in source order without starting', () => {
  const session = getPlaySession(data);
  assert.equal(session.isDemo, false);
  assert.equal(session.autoStart, false);
  assert.deepEqual(session.missions, [songwol, chinatown]);
  assert.equal(session.quizId, 'songwol-1');
  assert.equal(session.quizNumber, 1);
  assert.equal(session.quizCount, 2);
  assert.equal(session.nextQuizId, 'chinatown-1');
  assert.equal(session.storageKey, 'golmok-detective:v1');
  assert.equal(session.storageVersion, data.version);
  assert.equal(session.mapHref, './map.html?quiz=songwol-1');
});

test('normal example-only mode keeps its dataset and has no field quiz metadata', () => {
  const source = { ...data, missions: [example] };
  const session = getPlaySession(source);
  assert.equal(session.missions, source.missions);
  assert.equal(session.autoStart, false);
  assert.equal(session.quizId, null);
  assert.equal(session.quizNumber, 0);
  assert.equal(session.quizCount, 0);
  assert.equal(session.nextQuizId, null);
  assert.equal(session.mapHref, './map.html');
});

test('field and demo quiz links select exactly one quiz with its global number and next quiz', () => {
  const before = structuredClone(data);
  for (const mode of ['play=field', 'demo=arrival']) {
    const first = getPlaySession(data, '?' + mode + '&quiz=songwol-1');
    assert.equal(first.isDemo, mode === 'demo=arrival');
    assert.equal(first.autoStart, true);
    assert.deepEqual(first.missions, [songwol]);
    assert.equal(first.quizId, 'songwol-1');
    assert.equal(first.quizNumber, 1);
    assert.equal(first.quizCount, 2);
    assert.equal(first.nextQuizId, 'chinatown-1');
    assert.equal(first.mapHref, './map.html?quiz=songwol-1');
    assert.equal(first.queryString, '?' + mode + '&quiz=songwol-1');
    const last = getPlaySession(data, '?' + mode + '&quiz=chinatown-1');
    assert.deepEqual(last.missions, [chinatown]);
    assert.equal(last.quizNumber, 2);
    assert.equal(last.quizCount, 2);
    assert.equal(last.nextQuizId, null);
  }
  assert.deepEqual(data, before);
});

test('omitting quiz starts the first field quiz and old region links resolve to a single quiz', () => {
  const moreSongwol = { ...songwol, id: 'songwol-2' };
  const source = { ...data, missions: [...data.missions, moreSongwol] };
  for (const mode of ['play=field', 'demo=arrival']) {
    assert.deepEqual(getPlaySession(source, '?' + mode).missions, [songwol]);
    assert.deepEqual(getPlaySession(source, '?' + mode + '&region=songwol').missions, [songwol]);
    const legacy = getPlaySession(source, '?' + mode + '&region=chinatown');
    assert.deepEqual(legacy.missions, [chinatown]);
    assert.equal(legacy.queryString, '?' + mode + '&quiz=chinatown-1');
    const missingRegion = getPlaySession({ ...data, missions: [example, chinatown] }, '?' + mode + '&region=songwol');
    assert.deepEqual(missingRegion.missions, [chinatown]);
    assert.equal(missingRegion.quizNumber, 1);
    assert.deepEqual(getPlaySession(source, '?' + mode + '&region=unknown').missions, [songwol]);
  }
});

test('explicit quiz selection takes precedence over an old region parameter', () => {
  const session = getPlaySession(data, '?play=field&quiz=chinatown-1&region=songwol');
  assert.deepEqual(session.missions, [chinatown]);
  assert.equal(session.quizNumber, 2);
});

test('unknown, empty, example, or duplicate explicit quiz parameters show an empty state', () => {
  for (const mode of ['play=field', 'demo=arrival']) {
    for (const query of ['quiz=missing', 'quiz=', 'quiz=example-1', 'quiz=constructor',
      'quiz=songwol-1&quiz=chinatown-1', 'quiz=songwol-1&quiz=songwol-1']) {
      const session = getPlaySession(data, '?' + mode + '&' + query);
      assert.equal(session.autoStart, true, query);
      assert.equal(session.contentKind, 'empty', query);
      assert.deepEqual(session.missions, []);
      assert.equal(session.quizId, null);
      assert.equal(session.quizNumber, 0);
      assert.equal(session.quizCount, 2);
      assert.equal(session.nextQuizId, null);
      assert.equal(getPlaySession(data, session.queryString).contentKind, 'empty');
    }
  }
});

test('missing, unknown, mixed, or duplicate mode parameters stay in normal mode', () => {
  for (const query of ['?quiz=chinatown-1', '?region=songwol', '?demo=other&quiz=songwol-1',
    '?play=other&quiz=songwol-1', '?demo=arrival&play=field&quiz=songwol-1',
    '?demo=arrival&demo=arrival&quiz=songwol-1', '?play=field&play=other&quiz=songwol-1']) {
    const session = getPlaySession(data, query);
    assert.equal(session.isDemo, false, query);
    assert.equal(session.autoStart, false, query);
    assert.equal(session.contentKind, 'standard');
    assert.equal(session.storageKey, 'golmok-detective:v1');
  }
});

test('demo falls back to all examples only when no field quizzes and no explicit quiz are supplied', () => {
  const examples = [example, { ...example, id: 'example-2' }, { ...example, id: 'example-3' }];
  const source = { ...data, missions: examples };
  for (const query of ['?demo=arrival', '?demo=arrival&region=songwol']) {
    const session = getPlaySession(source, query);
    assert.equal(session.isDemo, true);
    assert.equal(session.contentKind, 'example');
    assert.deepEqual(session.missions, examples);
    assert.equal(session.quizId, null);
    assert.equal(session.quizNumber, 0);
    assert.equal(session.quizCount, 0);
  }
  assert.equal(getPlaySession(source, '?demo=arrival&quiz=missing').contentKind, 'empty');
  assert.equal(getPlaySession(source, '?play=field').contentKind, 'empty');
  assert.equal(getPlaySession({ ...data, missions: [] }, '?demo=arrival').contentKind, 'empty');
});

test('normal, both field quizzes, both demos, and demo examples have separate progress identities', () => {
  const normal = getPlaySession(data);
  const first = getPlaySession(data, '?demo=arrival&quiz=songwol-1');
  const second = getPlaySession(data, '?demo=arrival&quiz=chinatown-1');
  const fieldFirst = getPlaySession(data, '?play=field&quiz=songwol-1');
  const fieldSecond = getPlaySession(data, '?play=field&quiz=chinatown-1');
  const examples = getPlaySession({ ...data, missions: [example] }, '?demo=arrival');
  assert.equal(new Set([normal, first, second, fieldFirst, fieldSecond, examples].map(session => session.storageKey)).size, 6);
  assert.equal(first.storageKey, 'golmok-detective:demo-quiz:v1:songwol-1');
  assert.equal(fieldFirst.storageKey, 'golmok-detective:quiz:v1:songwol-1');
  assert.notEqual(first.storageVersion, fieldFirst.storageVersion);
  const renamedRegion = { ...data, missions: data.missions.map(m => ({ ...m, explorationRegionId: 'changed' })) };
  assert.equal(getPlaySession(renamedRegion, '?play=field&quiz=songwol-1').storageKey, fieldFirst.storageKey);
});

test('one selected quiz supports wrong retry, fourth-answer completion, restoration, and isolated next quiz', () => {
  for (const mode of ['play=field', 'demo=arrival']) {
    const session = getPlaySession(data, '?' + mode + '&quiz=songwol-1');
    const apply = (state, action) => transition(state, action, session.missions);
    let state = apply(initialState(session.missions), { type: 'START' });
    assert.equal(state.missionIndex, 0);
    assert.equal(state.feedback, 'idle');
    assert.deepEqual(state.solvedIds, []);
    state = apply(state, { type: 'SELECT', optionId: 'a' });
    state = apply(state, { type: 'CHECK' });
    assert.equal(state.feedback, 'wrong');
    state = apply(state, { type: 'SELECT', optionId: 'd' });
    state = apply(state, { type: 'CHECK' });
    state = apply(state, { type: 'NEXT' });
    assert.equal(state.screen, 'complete');
    assert.deepEqual(state.solvedIds, ['songwol-1']);
    const saved = { version: session.storageVersion, state };
    assert.deepEqual(restoreState(saved, session.missions, session.storageVersion), state);
    const next = getPlaySession(data, '?' + mode + '&quiz=' + session.nextQuizId);
    assert.deepEqual(restoreState(saved, next.missions, next.storageVersion), initialState(next.missions));
    const otherMode = getPlaySession(data, '?' + (session.isDemo ? 'play=field' : 'demo=arrival') + '&quiz=songwol-1');
    assert.deepEqual(restoreState(saved, otherMode.missions, otherMode.storageVersion), initialState(otherMode.missions));
    assert.deepEqual(apply(state, { type: 'RESTART' }), initialState(session.missions));
  }
});
