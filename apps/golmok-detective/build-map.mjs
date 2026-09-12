import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { projectPoint } from './location.mjs';

const xml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
const fixed = value => Number(value.toFixed(2));

export async function renderMap(root, data) {
  const source = JSON.parse(await readFile(join(root, 'data/exploration-map.json'), 'utf8'));
  const geography = JSON.parse(await readFile(join(root, 'data/map-geography.json'), 'utf8'));
  const missions = data.missions.filter(mission => mission.sceneKind === 'field');
  const { bounds, width } = source;
  const metersPerLongitude = 111320 * Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);
  const metersWidth = (bounds.east - bounds.west) * metersPerLongitude;
  const height = Math.round(width * (bounds.north - bounds.south) * 111320 / metersWidth);
  const config = { version: source.version, bounds, width, height, quizzes: [] };
  const pixelsPerMeter = width / metersWidth;
  const quizIds = new Set();
  for (const [index, mission] of missions.entries()) {
    if (typeof mission.id !== 'string' || !/^[a-z0-9-]+$/.test(mission.id) || quizIds.has(mission.id)) throw new Error('Invalid or duplicate map quiz ID');
    quizIds.add(mission.id);
    const region = source.regions.find(item => item.id === mission.explorationRegionId);
    const area = mission.explorationArea === undefined ? region : mission.explorationArea;
    const p = area && projectPoint(area.latitude, area.longitude, bounds, width, height);
    if (!p || p.x < 0 || p.x > width || p.y < 0 || p.y > height || !Number.isFinite(area.radiusMeters) || area.radiusMeters <= 0) throw new Error(`Invalid exploration area for ${mission.id}`);
    if (!/^assets\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(svg|jpg|jpeg|png|webp)$/.test(mission.image)) throw new Error('Invalid map clue image');
    const bytes = await readFile(join(root, 'public', mission.image));
    const extension = mission.image.split('.').at(-1);
    const mime = {svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[extension];
    const description = mission.explorationDescription ?? region?.description ?? '사진 속 특징이 있는 장소를 색칠된 범위 안에서 찾아보세요.';
    if (typeof description !== 'string' || !description.trim()) throw new Error(`Invalid exploration description for ${mission.id}`);
    config.quizzes.push({
      id: mission.id, number: index + 1, regionId: mission.explorationRegionId ?? null,
      description, clueImage: `data:${mime};base64,${bytes.toString('base64')}`, clueAlt: mission.imageAlt,
      x: fixed(p.x), y: fixed(p.y), radius: fixed(area.radiusMeters * pixelsPerMeter),
    });
  }
  const point = ([longitude, latitude]) => projectPoint(latitude, longitude, bounds, width, height);
  const path = (feature, close = false) => feature.geometry.map((coordinate, index) => {
    const p = point(coordinate);
    if (!p) throw new Error('Invalid source map coordinate');
    return `${index ? 'L' : 'M'}${fixed(p.x)},${fixed(p.y)}`;
  }).join(' ') + (close ? ' Z' : '');
  const allowed = feature => feature.tags?.foot !== 'no' && (feature.tags?.foot === 'yes' || !['private','no'].includes(feature.tags?.access));
  const paths = [];
  for (const park of geography.parks) paths.push(`<path d="${path(park,true)}" class="park"/>`);
  for (const railway of geography.railways) {
    if (!['rail','light_rail'].includes(railway.tags?.railway)) continue;
    paths.push(`<path d="${path(railway)}" class="railway"/>`);
  }
  for (const road of geography.roads.filter(allowed)) {
    const category = /^(primary|secondary|tertiary)/.test(road.tags.highway) ? 'main-road' : ['footway','steps','path'].includes(road.tags.highway) ? 'walking-path' : 'alley';
    paths.push(`<path d="${path(road)}" class="road-edge ${category}"/><path d="${path(road)}" class="road ${category}"/>`);
  }
  const landmark = (id, label, kind) => {
    const item = geography.landmarks.find(candidate => candidate.id === id);
    if (!item) throw new Error('Missing map landmark');
    const p = point(item.coordinates);
    const decoration = kind === 'station' ? '<rect x="-22" y="-26" width="44" height="46" rx="8"/><path d="M-12-15H12V0H-12ZM-13 29l6-9m20 9-6-9"/>' : '';
    return `<g transform="translate(${fixed(p.x)} ${fixed(p.y)})" class="landmark ${kind}">${decoration}<text y="${kind==='station'?-43:0}">${xml(label)}</text></g>`;
  };
  const zones = config.quizzes.map(quiz => `<g id="zone-${xml(quiz.id)}" class="zone" data-zone="${xml(quiz.id)}" hidden><circle cx="${quiz.x}" cy="${quiz.y}" r="${quiz.radius}"/><g transform="translate(${quiz.x} ${fixed(quiz.y-quiz.radius+27)})"><rect x="-60" y="-24" width="120" height="46" rx="23"/><text y="8">문제 ${quiz.number}</text></g></g>`);
  const cards = config.quizzes.map(quiz => {
    const id = xml(quiz.id);
    const query = xml(encodeURIComponent(quiz.id));
    return `<article id="quiz-card-${id}" class="quiz-card" data-quiz-card="${id}" aria-labelledby="quiz-title-${id}"><header class="quiz-card-heading"><p class="panel-label">문제 ${quiz.number}</p><h2 id="quiz-title-${id}">1차 · 장소 찾기 사진</h2></header><img id="quiz-clue-${id}" class="quiz-clue" src="${xml(quiz.clueImage)}" alt="${xml(quiz.clueAlt)}"><div class="quiz-card-body"><p id="quiz-description-${id}" class="quiz-description">${xml(quiz.description)}</p><button id="map-button-${id}" class="map-link" data-quiz="${id}" type="button" aria-pressed="false">이 문제의 지도 보기 <span aria-hidden="true">↓</span></button><a id="field-quiz-${id}" class="arrival-link" href="./?play=field&amp;quiz=${query}">장소를 찾았어요 → 2차 퀴즈</a><p class="field-note">현장에서 직접 확인하고 답해 주세요. GPS 도착 인증은 필요하지 않아요.</p><a id="demo-arrival-${id}" class="demo-link" href="./?demo=arrival&amp;quiz=${query}">발표 시연: 도착을 가정하고 2차 퀴즈</a><p class="demo-note">실제 현장 방문 없이 진행하는 시연이에요.</p></div></article>`;
  }).join('') || '<p id="quiz-empty" class="empty-card">아직 등록된 현장 문제가 없어요. 문제가 준비되면 이곳에서 탐험을 시작할 수 있어요.</p>';
  const park = geography.parks.find(item => item.tags?.name==='자유공원');
  let parkLabel = '';
  if (park) {
    const inside = park.geometry.map(point).filter(p=>p.x>0&&p.x<width&&p.y>0&&p.y<height);
    if(inside.length) {
      const x = inside.reduce((sum,p)=>sum+p.x,0)/inside.length;
      const y = inside.reduce((sum,p)=>sum+p.y,0)/inside.length;
      parkLabel = `<g class="park-label" transform="translate(${fixed(x)} ${fixed(y)})"><path d="M0-80l-28 42h14l-22 31h72L14-38h14ZM0-8v26"/><text y="52">자유공원</text></g>`;
    }
  }
  const svg = `<svg id="exploration-map" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="map-title map-description"><title id="map-title">차이나타운·동화마을 탐색 지도</title><desc id="map-description">북쪽이 위인 실제 도로 기반 그림 지도. 색칠된 원은 넓은 탐색 구역입니다. 정답 위치와 이동 경로는 표시하지 않습니다.</desc><defs><clipPath id="map-clip"><rect width="${width}" height="${height}" rx="12"/></clipPath><pattern id="paper-grain" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".7" fill="#c2bea9" opacity=".35"/></pattern></defs><g clip-path="url(#map-clip)"><rect width="${width}" height="${height}" fill="#e8e3cd"/><rect width="${width}" height="${height}" fill="url(#paper-grain)"/>${paths.join('')}${zones.join('')}${landmark('incheon-station','인천역','station')}${parkLabel}<g id="user-location" hidden><ellipse id="user-accuracy"/><circle id="user-dot" r="11"/><text id="user-label" y="-24">내 위치 · 대략</text></g></g><g class="compass" transform="translate(${width-55} 65)"><path d="M0-25L-10 4H10ZM0-25V25"/><text y="-37">N</text></g><g class="scale" transform="translate(30 ${height-30})"><path d="M0-8V0H${fixed(pixelsPerMeter*100)}V-8"/><text x="${fixed(pixelsPerMeter*50)}" y="-14">약 100m</text></g></svg>`;
  const template = await readFile(join(root,'map.template.html'),'utf8');
  const locationCore = (await readFile(join(root,'location.mjs'),'utf8')).replace(/^export /gm,'');
  const output = template.replace('<!--__MAP_SVG__-->',()=>svg).replace('<!--__QUIZ_CARDS__-->',()=>cards).replace('/*__MAPDATA__*/',()=>JSON.stringify(config).replace(/</g,'\\u003c')).replace('/*__LOCATION__*/',()=>locationCore);
  if (/__(?:MAP_SVG|QUIZ_CARDS|MAPDATA|LOCATION)__/.test(output)) throw new Error('Unfilled map marker');
  return output;
}

export async function buildMap(root, data) {
  const output = await renderMap(root, data);
  await writeFile(join(root,'public/map.html'),output,'utf8');
  console.log(`Built exploration map: ${data.missions.filter(mission => mission.sceneKind === 'field').length} field quizzes.`);
}
