export function initialState(missions) {
  return {
    screen: 'start',
    missionIndex: 0,
    solvedIds: [],
    selectedOptionId: null,
    feedback: 'idle',
    hintVisible: false,
  };
}

function copyState(state) {
  return {
    screen: state.screen,
    missionIndex: state.missionIndex,
    solvedIds: [...state.solvedIds],
    selectedOptionId: state.selectedOptionId,
    feedback: state.feedback,
    hintVisible: state.hintVisible,
  };
}

function hasExpectedSolvedIds(state, missions, count) {
  return (
    state.solvedIds.length === count &&
    state.solvedIds.every((id, index) => id === missions[index]?.id)
  );
}

export function restoreState(raw, missions, version) {
  const fallback = () => initialState(missions);
  if (
    !raw ||
    typeof raw !== 'object' ||
    Array.isArray(raw) ||
    raw.version !== version
  )
    return fallback();
  const state = raw.state;
  if (!state || typeof state !== 'object' || Array.isArray(state))
    return fallback();
  if (
    !['start', 'mission', 'complete'].includes(state.screen) ||
    !Number.isInteger(state.missionIndex) ||
    !Array.isArray(state.solvedIds) ||
    new Set(state.solvedIds).size !== state.solvedIds.length ||
    !['idle', 'wrong', 'correct'].includes(state.feedback) ||
    typeof state.hintVisible !== 'boolean'
  )
    return fallback();

  if (state.screen === 'start') return fallback();

  if (
    !Array.isArray(missions) ||
    missions.length === 0 ||
    state.missionIndex < 0 ||
    state.missionIndex >= missions.length
  )
    return fallback();

  if (state.screen === 'complete') {
    return state.missionIndex === missions.length - 1 &&
      hasExpectedSolvedIds(state, missions, missions.length) &&
      state.selectedOptionId === null &&
      state.feedback === 'idle' &&
      state.hintVisible === false
      ? copyState(state)
      : fallback();
  }

  const mission = missions[state.missionIndex];
  const selectionIsValid =
    state.selectedOptionId === null ||
    mission.options.some((option) => option.id === state.selectedOptionId);
  if (!selectionIsValid) return fallback();

  if (state.feedback === 'correct') {
    if (
      state.selectedOptionId !== mission.answerId ||
      !hasExpectedSolvedIds(state, missions, state.missionIndex + 1)
    )
      return fallback();
  } else {
    if (!hasExpectedSolvedIds(state, missions, state.missionIndex))
      return fallback();
    if (
      state.feedback === 'wrong' &&
      (state.selectedOptionId === null ||
        state.selectedOptionId === mission.answerId)
    )
      return fallback();
  }
  return copyState(state);
}

export function transition(state, action, missions) {
  const next = copyState(state);
  if (!action || typeof action !== 'object') return next;
  if (action.type === 'RESTART') return initialState(missions);
  if (action.type === 'START') {
    return state.screen === 'start' && missions.length > 0
      ? { ...initialState(missions), screen: 'mission' }
      : next;
  }
  if (state.screen !== 'mission') return next;
  const mission = missions[state.missionIndex];
  if (!mission) return next;

  switch (action.type) {
    case 'SELECT':
      if (
        state.feedback !== 'correct' &&
        mission.options.some((option) => option.id === action.optionId)
      ) {
        next.selectedOptionId = action.optionId;
        next.feedback = 'idle';
      }
      return next;
    case 'CHECK':
      if (state.selectedOptionId === null || state.feedback === 'correct')
        return next;
      next.feedback =
        state.selectedOptionId === mission.answerId ? 'correct' : 'wrong';
      if (next.feedback === 'correct' && !next.solvedIds.includes(mission.id))
        next.solvedIds.push(mission.id);
      return next;
    case 'TOGGLE_HINT':
      next.hintVisible = !state.hintVisible;
      return next;
    case 'NEXT':
      if (state.feedback !== 'correct') return next;
      next.selectedOptionId = null;
      next.feedback = 'idle';
      next.hintVisible = false;
      if (state.missionIndex === missions.length - 1) {
        next.screen = 'complete';
      } else {
        next.missionIndex += 1;
      }
      return next;
    default:
      return next;
  }
}
