import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, restoreState, transition } from '../game-state.mjs';

const missions = [
  { id: 'window', options: [{ id: 'round' }, { id: 'square' }], answerId: 'round' },
  { id: 'sign', options: [{ id: 'cup' }, { id: 'book' }], answerId: 'book' },
  { id: 'direction', options: [{ id: 'left' }, { id: 'right' }], answerId: 'right' },
];
const version = 'test-v1';
const apply = (state, type, optionId, source = missions) => transition(state, { type, optionId }, source);
const begin = (source = missions) => apply(initialState(source), 'START', undefined, source);
const solve = (state, source = missions) => apply(apply(state, 'SELECT', source[state.missionIndex].answerId, source), 'CHECK', undefined, source);
const restore = state => restoreState({ version, state }, missions, version);

test('the initial state is independent and START enters the first mission', () => {
  const state = initialState(missions);
  assert.deepEqual(state, { screen: 'start', missionIndex: 0, solvedIds: [], selectedOptionId: null, feedback: 'idle', hintVisible: false });
  assert.notEqual(initialState(missions).solvedIds, state.solvedIds);
  assert.deepEqual(begin(), { ...state, screen: 'mission' });
  assert.deepEqual(begin([]), initialState([]));
});

test('CHECK without a selection and NEXT without a correct answer cannot advance', () => {
  const state = begin();
  assert.deepEqual(apply(state, 'CHECK'), state);
  assert.deepEqual(apply(state, 'NEXT'), state);
  assert.deepEqual(apply(state, 'SELECT', 'not-an-option'), state);
});

test('a wrong answer can be retried, with feedback reset when choosing again', () => {
  const wrong = apply(apply(begin(), 'SELECT', 'square'), 'CHECK');
  assert.equal(wrong.feedback, 'wrong');
  assert.equal(wrong.solvedIds.length, 0);
  const retry = apply(wrong, 'SELECT', 'round');
  assert.equal(retry.feedback, 'idle');
  const correct = apply(retry, 'CHECK');
  assert.equal(correct.feedback, 'correct');
  assert.deepEqual(correct.solvedIds, ['window']);
});

test('repeated checks do not duplicate progress and a correct answer is locked', () => {
  const correct = solve(begin());
  assert.deepEqual(apply(correct, 'CHECK'), correct);
  assert.deepEqual(apply(correct, 'SELECT', 'square'), correct);
  assert.deepEqual(apply(correct, 'NEXT').solvedIds, ['window']);
});

test('hints toggle without changing the score and reset on the next mission', () => {
  const hinted = apply(begin(), 'TOGGLE_HINT');
  assert.equal(hinted.hintVisible, true);
  assert.deepEqual(hinted.solvedIds, []);
  assert.equal(apply(hinted, 'TOGGLE_HINT').hintVisible, false);
  const next = apply(solve(hinted), 'NEXT');
  assert.equal(next.missionIndex, 1);
  assert.equal(next.hintVisible, false);
  assert.equal(next.selectedOptionId, null);
  assert.equal(next.feedback, 'idle');
});

test('all missions finish in order, complete shows N/N, and RESTART clears progress', () => {
  let state = begin();
  for (const mission of missions) {
    state = solve(state);
    assert.equal(state.solvedIds.at(-1), mission.id);
    state = apply(state, 'NEXT');
  }
  assert.equal(state.screen, 'complete');
  assert.equal(state.missionIndex, missions.length - 1);
  assert.equal(state.solvedIds.length, missions.length);
  assert.deepEqual(apply(state, 'START'), state);
  assert.deepEqual(apply(state, 'NEXT'), state);
  assert.deepEqual(apply(state, 'RESTART'), initialState(missions));
});

test('one mission supports the entire start, answer, complete, restore, and restart flow', () => {
  const single = [missions[0]];
  const done = apply(solve(begin(single), single), 'NEXT', undefined, single);
  assert.equal(done.screen, 'complete');
  assert.equal(done.solvedIds.length, 1);
  assert.deepEqual(restoreState({ version, state: done }, single, version), done);
  assert.deepEqual(apply(done, 'RESTART', undefined, single), initialState(single));
});

test('transitions and restoration do not mutate or share the original state array', () => {
  const state = Object.freeze({ ...begin(), solvedIds: Object.freeze([]) });
  const action = Object.freeze({ type: 'SELECT', optionId: 'round' });
  const next = transition(state, action, missions);
  assert.equal(state.selectedOptionId, null);
  assert.equal(next.selectedOptionId, 'round');
  assert.notEqual(next.solvedIds, state.solvedIds);
  const restored = restore(next);
  assert.deepEqual(restored, next);
  assert.notEqual(restored.solvedIds, next.solvedIds);
  assert.deepEqual(apply(state, 'UNKNOWN'), state);
});

test('restoration supports selected, wrong, correct, next-mission, and complete screens', () => {
  let state = begin();
  assert.deepEqual(restore(state), state);
  state = apply(state, 'SELECT', 'square');
  assert.deepEqual(restore(state), state);
  state = apply(state, 'CHECK');
  assert.deepEqual(restore(state), state);
  for (let index = 0; index < missions.length; index += 1) {
    state = solve(state);
    assert.deepEqual(restore(state), state);
    state = apply(state, 'NEXT');
    assert.deepEqual(restore(state), state);
  }
});

test('missing, malformed, old-version, and incorrect-type saved values reset to start', () => {
  for (const raw of [null, undefined, 'text', [], {}, { version: 'old', state: begin() }, { version, state: null }]) {
    assert.deepEqual(restoreState(raw, missions, version), initialState(missions));
  }
  for (const patch of [{ screen: 'other' }, { missionIndex: -1 }, { missionIndex: 99 }, { missionIndex: 0.5 }, { solvedIds: null }, { selectedOptionId: 'other' }, { selectedOptionId: undefined }, { feedback: 'other' }, { hintVisible: 'true' }]) {
    assert.deepEqual(restore({ ...begin(), ...patch }), initialState(missions));
  }
});

test('forged, duplicate, missing, out-of-order, or noncontiguous solved IDs are rejected', () => {
  const second = apply(solve(begin()), 'NEXT');
  for (const solvedIds of [[], ['missing'], ['window', 'window'], ['sign'], ['window', 'direction']]) {
    assert.deepEqual(restore({ ...second, solvedIds }), initialState(missions));
  }
  const correct = solve(begin());
  assert.deepEqual(restore({ ...correct, solvedIds: [] }), initialState(missions));
  assert.deepEqual(restore({ ...correct, selectedOptionId: 'square' }), initialState(missions));
});

test('inconsistent feedback or completion cannot be restored as valid progress', () => {
  const state = begin();
  for (const patch of [
    { feedback: 'wrong', selectedOptionId: null },
    { feedback: 'wrong', selectedOptionId: 'round' },
    { screen: 'complete', solvedIds: ['window'] },
    { screen: 'complete', missionIndex: 2, solvedIds: ['window', 'sign', 'direction'], selectedOptionId: 'right' },
    { screen: 'start', solvedIds: ['window'] },
  ]) assert.deepEqual(restore({ ...state, ...patch }), initialState(missions));
});
