const normalStore = 'golmok-detective:v1';

export function getPlaySession(data, search = '') {
  const params = new URLSearchParams(search);
  const fieldMissions = data.missions.filter(
    (mission) => mission.sceneKind === 'field',
  );
  const isDemo =
    params.get('demo') === 'arrival' &&
    params.getAll('demo').length === 1 &&
    !params.has('play');
  const isFieldPlay =
    params.get('play') === 'field' &&
    params.getAll('play').length === 1 &&
    !params.has('demo');
  const firstQuiz = fieldMissions[0];
  if (!isDemo && !isFieldPlay) {
    return {
      isDemo: false,
      autoStart: false,
      regionId: null,
      regionLabel: '',
      quizId: firstQuiz?.id ?? null,
      quizNumber: firstQuiz ? 1 : 0,
      quizCount: fieldMissions.length,
      nextQuizId: fieldMissions[1]?.id ?? null,
      contentKind: 'standard',
      missions: fieldMissions.length ? fieldMissions : data.missions,
      storageKey: normalStore,
      storageVersion: data.version,
      mapHref: firstQuiz
        ? './map.html?quiz=' + encodeURIComponent(firstQuiz.id)
        : './map.html',
      queryString: '',
    };
  }

  const hasQuiz = params.has('quiz');
  const validQuizParameter = params.getAll('quiz').length === 1;
  let selectedQuiz;
  if (hasQuiz) {
    if (validQuizParameter)
      selectedQuiz = fieldMissions.find(
        (mission) => mission.id === params.get('quiz'),
      );
  } else {
    const regionId =
      params.getAll('region').length === 1 ? params.get('region') : null;
    selectedQuiz =
      fieldMissions.find(
        (mission) =>
          regionId !== null && mission.explorationRegionId === regionId,
      ) ?? firstQuiz;
  }

  const examples =
    !hasQuiz && isDemo && fieldMissions.length === 0
      ? data.missions.filter((mission) => mission.sceneKind === 'example')
      : [];
  const missions = selectedQuiz ? [selectedQuiz] : examples;
  const contentKind = selectedQuiz
    ? 'field'
    : examples.length
      ? 'example'
      : 'empty';
  const quizIndex = selectedQuiz ? fieldMissions.indexOf(selectedQuiz) : -1;
  const mode = isDemo ? 'demo-quiz' : 'quiz';
  const storageId =
    selectedQuiz?.id ??
    (contentKind === 'example' ? '__examples__' : '__unavailable__');
  const modeQuery = isDemo ? '?demo=arrival' : '?play=field';
  return {
    isDemo,
    autoStart: true,
    regionId: null,
    regionLabel: '',
    quizId: selectedQuiz?.id ?? null,
    quizNumber: quizIndex + 1,
    quizCount: fieldMissions.length,
    nextQuizId:
      quizIndex >= 0 ? (fieldMissions[quizIndex + 1]?.id ?? null) : null,
    contentKind,
    missions,
    storageKey: `golmok-detective:${mode}:v1:${storageId}`,
    storageVersion: `${data.version}:${mode}:${storageId}:${contentKind}`,
    mapHref: selectedQuiz
      ? './map.html?quiz=' + encodeURIComponent(selectedQuiz.id)
      : './map.html',
    queryString: selectedQuiz
      ? modeQuery + '&quiz=' + encodeURIComponent(selectedQuiz.id)
      : hasQuiz
        ? modeQuery + '&quiz='
        : modeQuery,
  };
}
