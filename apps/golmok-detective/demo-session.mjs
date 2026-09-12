const demoRegions = {
  songwol: '송월동 동화마을',
  chinatown: '차이나타운',
};
const normalStore = 'golmok-detective:v1';

export function getPlaySession(data, search = '') {
  const params = new URLSearchParams(search);
  const regionId = params.get('region');
  const validRegion = params.getAll('region').length === 1 && Object.hasOwn(demoRegions, regionId);
  const isDemo = validRegion && params.get('demo') === 'arrival'
    && params.getAll('demo').length === 1 && !params.has('play');
  const isFieldPlay = validRegion && params.get('play') === 'field'
    && params.getAll('play').length === 1 && !params.has('demo');
  const allFieldMissions = data.missions.filter(mission => mission.sceneKind === 'field');
  if (!isDemo && !isFieldPlay) {
    return {
      isDemo: false,
      autoStart: false,
      regionId: null,
      regionLabel: '',
      contentKind: 'standard',
      missions: allFieldMissions.length ? allFieldMissions : data.missions,
      storageKey: normalStore,
      storageVersion: data.version,
      mapHref: './map.html',
      queryString: '',
    };
  }

  const fieldMissions = allFieldMissions.filter(mission => mission.explorationRegionId === regionId);
  if (isFieldPlay) {
    return {
      isDemo: false,
      autoStart: true,
      regionId,
      regionLabel: demoRegions[regionId],
      contentKind: fieldMissions.length ? 'field' : 'empty',
      missions: fieldMissions,
      storageKey: `golmok-detective:field:v1:${regionId}`,
      storageVersion: `${data.version}:field:${regionId}`,
      mapHref: `./map.html?region=${regionId}`,
      queryString: `?play=field&region=${regionId}`,
    };
  }
  const examples = data.missions.filter(mission => mission.sceneKind === 'example');
  const missions = fieldMissions.length ? fieldMissions : examples;
  const contentKind = fieldMissions.length ? 'field' : examples.length ? 'example' : 'empty';
  return {
    isDemo: true,
    autoStart: true,
    regionId,
    regionLabel: demoRegions[regionId],
    contentKind,
    missions,
    storageKey: `golmok-detective:demo-arrival:v1:${regionId}`,
    storageVersion: `${data.version}:demo-arrival:${regionId}:${contentKind}`,
    mapHref: `./map.html?region=${regionId}`,
    queryString: `?demo=arrival&region=${regionId}`,
  };
}
