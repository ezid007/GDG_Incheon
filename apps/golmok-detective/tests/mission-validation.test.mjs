import assert from 'node:assert/strict';
import { loadMissionData } from '../load-quiz.mjs';
import { test } from 'node:test';
import { validateMissionData } from '../mission-validation.mjs';
import { initialState, restoreState, transition } from '../game-state.mjs';

const examples = await loadMissionData();
const fieldData = () => {
  const mission = structuredClone(examples.missions[0]);
  mission.sceneKind = 'field';
  mission.explorationRegionId = 'chinatown';
  mission.options = [
    { id: 'a', label: '첫 번째 선택지' },
    { id: 'b', label: '두 번째 선택지' },
    { id: 'c', label: '세 번째 선택지' },
    { id: 'd', label: '네 번째 선택지' },
  ];
  mission.answerId = 'd';
  return { version: 'field-test-v1', missions: [mission] };
};

test('existing examples and four-choice field missions validate without mutation', () => {
  for (const data of [examples, fieldData()]) {
    const before = structuredClone(data);
    assert.doesNotThrow(() => validateMissionData(data));
    assert.deepEqual(data, before);
  }
});

test('field missions reject three or five choices, and examples retain three choices', () => {
  for (const count of [3, 5]) {
    const data = fieldData();
    data.missions[0].options = Array.from({ length: count }, (_, index) => ({ id: String(index), label: String(index) }));
    assert.throws(() => validateMissionData(data), /field missions require exactly 4 choices/);
  }
  const data = fieldData();
  data.missions[0].sceneKind = 'example';
  assert.throws(() => validateMissionData(data), /example missions require exactly 3 choices/);
});

test('duplicate IDs or labels and blank or malformed options are rejected', () => {
  for (const key of ['id', 'label']) {
    const data = fieldData();
    data.missions[0].options[3][key] = ' ' + data.missions[0].options[0][key] + ' ';
    assert.throws(() => validateMissionData(data), /must be unique/);
  }
  for (const option of [null, { id: 'd', label: '' }, { id: '', label: 'fourth' }]) {
    const data = fieldData();
    data.missions[0].options[3] = option;
    assert.throws(() => validateMissionData(data), /non-empty strings/);
  }
});

test('a field answer must identify one of its four choices', () => {
  const data = fieldData();
  data.missions[0].answerId = 'missing';
  assert.throws(() => validateMissionData(data), /answer ID/);
});

test('field missions must name a supported map region', () => {
  for (const region of ['songwol', 'chinatown']) {
    const data = fieldData();
    data.missions[0].explorationRegionId = region;
    assert.doesNotThrow(() => validateMissionData(data));
  }
  for (const region of [undefined, '', 'other', 'constructor']) {
    const data = fieldData();
    data.missions[0].explorationRegionId = region;
    assert.throws(() => validateMissionData(data), /supported exploration region/);
  }
});

test('a separate answer image is optional but needs a valid asset path and description', () => {
  const data = fieldData();
  delete data.missions[0].answerImage;
  delete data.missions[0].answerImageAlt;
  assert.doesNotThrow(() => validateMissionData(data));
  data.missions[0].answerImage = 'assets/gate-answer.jpg';
  data.missions[0].answerImageAlt = '정답 확인용 전체 현장 사진';
  assert.doesNotThrow(() => validateMissionData(data));
  for (const path of ['../gate.jpg', 'https://example.com/gate.jpg', '', null]) {
    const invalid = structuredClone(data);
    invalid.missions[0].answerImage = path;
    assert.throws(() => validateMissionData(invalid), /Invalid answer image path/);
  }
  for (const description of [undefined, '', ' ']) {
    const invalid = structuredClone(data);
    invalid.missions[0].answerImageAlt = description;
    assert.throws(() => validateMissionData(invalid), /Missing answer image description/);
  }
  delete data.missions[0].answerImage;
  assert.throws(() => validateMissionData(data), /requires an answer image/);
});

test('a separate quiz image is optional but needs a valid asset path and description', () => {
  const data = fieldData();
  delete data.missions[0].quizImage;
  delete data.missions[0].quizImageAlt;
  assert.doesNotThrow(() => validateMissionData(data));
  data.missions[0].quizImage = 'assets/gate-quiz.jpg';
  data.missions[0].quizImageAlt = '현판을 가린 현장 문제 사진';
  assert.doesNotThrow(() => validateMissionData(data));
  for (const path of ['../gate.jpg', 'https://example.com/gate.jpg', '', null]) {
    const invalid = structuredClone(data);
    invalid.missions[0].quizImage = path;
    assert.throws(() => validateMissionData(invalid), /Invalid quiz image path/);
  }
  for (const description of [undefined, '', ' ']) {
    const invalid = structuredClone(data);
    invalid.missions[0].quizImageAlt = description;
    assert.throws(() => validateMissionData(invalid), /Missing quiz image description/);
  }
  delete data.missions[0].quizImage;
  assert.throws(() => validateMissionData(data), /requires a quiz image/);
});

test('missing field evidence, duplicate mission IDs, and unsafe image paths remain invalid', () => {
  const missing = fieldData();
  missing.missions[0].evidenceQuote = ' ';
  assert.throws(() => validateMissionData(missing), /Missing mission text: evidenceQuote/);
  const duplicate = fieldData();
  duplicate.missions.push(structuredClone(duplicate.missions[0]));
  assert.throws(() => validateMissionData(duplicate), /Invalid mission identity/);
  for (const patch of [{ image: '../private.jpg' }, { evidence: { x: 101, y: 50 } }]) {
    const data = fieldData();
    Object.assign(data.missions[0], patch);
    assert.throws(() => validateMissionData(data), /Invalid (public image path|evidence point)/);
  }
});

test('empty or malformed mission data and unknown sources are rejected', () => {
  for (const data of [null, {}, { version: 'v1', missions: [] }, { version: 'v1', missions: [null] }]) {
    assert.throws(() => validateMissionData(data), /invalid|Invalid/);
  }
  const data = fieldData();
  data.missions[0].sceneKind = 'constructor';
  assert.throws(() => validateMissionData(data), /Invalid mission identity or source/);
});

test('the fourth choice can be answered, restored, and completed after a wrong retry', () => {
  const data = fieldData();
  const apply = (state, action) => transition(state, action, data.missions);
  let state = apply(initialState(data.missions), { type: 'START' });
  state = apply(state, { type: 'SELECT', optionId: 'a' });
  state = apply(state, { type: 'CHECK' });
  assert.equal(state.feedback, 'wrong');
  state = apply(state, { type: 'SELECT', optionId: 'd' });
  state = apply(state, { type: 'CHECK' });
  assert.equal(state.feedback, 'correct');
  assert.equal(state.selectedOptionId, 'd');
  assert.deepEqual(restoreState({ version: data.version, state }, data.missions, data.version), state);
  state = apply(state, { type: 'NEXT' });
  assert.equal(state.screen, 'complete');
  assert.deepEqual(state.solvedIds, [data.missions[0].id]);
});
