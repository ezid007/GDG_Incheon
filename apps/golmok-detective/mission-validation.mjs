const optionCounts = { example: 3, field: 4 };
const requiredText = [
  'sourceId',
  'placeLabel',
  'imageAlt',
  'question',
  'hint',
  'explanation',
  'evidenceQuote',
];
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
export const isPublicImage = (value) =>
  typeof value === 'string' &&
  /^assets\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(svg|jpg|jpeg|png|webp)$/.test(value);

export function validateMissionData(data) {
  if (
    !data ||
    !hasText(data.version) ||
    !Array.isArray(data.missions) ||
    data.missions.length === 0
  ) {
    throw new Error('Mission data is empty or invalid.');
  }
  const ids = new Set();
  for (const mission of data.missions) {
    if (
      !mission ||
      !hasText(mission.id) ||
      ids.has(mission.id) ||
      !Object.hasOwn(optionCounts, mission.sceneKind)
    ) {
      throw new Error('Invalid mission identity or source.');
    }
    ids.add(mission.id);
    if (
      mission.sceneKind === 'field' &&
      !['songwol', 'chinatown'].includes(mission.explorationRegionId)
    ) {
      throw new Error(
        'Field missions require a supported exploration region: songwol or chinatown.',
      );
    }
    const expectedCount = optionCounts[mission.sceneKind];
    if (
      !Array.isArray(mission.options) ||
      mission.options.length !== expectedCount
    ) {
      throw new Error(
        `${mission.sceneKind} missions require exactly ${expectedCount} choices.`,
      );
    }
    if (
      !mission.options.every(
        (option) => option && hasText(option.id) && hasText(option.label),
      )
    ) {
      throw new Error('Option IDs and labels must be non-empty strings.');
    }
    if (
      new Set(mission.options.map((option) => option.id.trim())).size !==
        expectedCount ||
      new Set(mission.options.map((option) => option.label.trim())).size !==
        expectedCount
    ) {
      throw new Error('Option IDs and labels must be unique.');
    }
    if (
      mission.options.filter((option) => option.id === mission.answerId)
        .length !== 1
    ) {
      throw new Error('The answer ID must match exactly one choice.');
    }
    for (const key of requiredText) {
      if (!hasText(mission[key]))
        throw new Error('Missing mission text: ' + key);
    }
    if (
      !mission.evidence ||
      !['x', 'y'].every(
        (key) =>
          Number.isFinite(mission.evidence[key]) &&
          mission.evidence[key] >= 0 &&
          mission.evidence[key] <= 100,
      )
    ) {
      throw new Error('Invalid evidence point.');
    }
    if (!isPublicImage(mission.image)) {
      throw new Error('Invalid public image path.');
    }
    if (mission.quizImage !== undefined) {
      if (!isPublicImage(mission.quizImage))
        throw new Error('Invalid quiz image path.');
      if (!hasText(mission.quizImageAlt))
        throw new Error('Missing quiz image description.');
    } else if (mission.quizImageAlt !== undefined) {
      throw new Error('A quiz image description requires a quiz image.');
    }
    if (mission.answerImage !== undefined) {
      if (!isPublicImage(mission.answerImage))
        throw new Error('Invalid answer image path.');
      if (!hasText(mission.answerImageAlt))
        throw new Error('Missing answer image description.');
    } else if (mission.answerImageAlt !== undefined) {
      throw new Error('An answer image description requires an answer image.');
    }
  }
}
