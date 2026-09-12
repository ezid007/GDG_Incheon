import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { projectPoint } from './location.mjs';

const xml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
const fixed = value => Number(value.toFixed(2));

export async function buildMap(root, data) {
  const config = JSON.parse(await readFile(join(root, 'data/exploration-map.json'), 'utf8'));
  const geography = JSON.parse(await readFile(join(root, 'data/map-geography.json'), 'utf8'));
  const missions = data.missions;
  for (const region of config.regions) {
    const mission = missions.find(item => item.sceneKind === 'field' && item.explorationRegionId === region.id);
    region.ready = Boolean(mission);
    if (mission) {
      if (!/^assets\/[a-z0-9-]+\.(svg|jpg|jpeg|png|webp)$/.test(mission.image)) throw new Error('Invalid map clue image');
      const bytes = await readFile(join(root, 'public', mission.image));
      const extension = mission.image.split('.').at(-1);
      const mime = {svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[extension];
      region.clueImage = `data:${mime};base64,${bytes.toString('base64')}`;
      region.clueAlt = mission.imageAlt;
    }
  }
  const { bounds, width } = config;
  const metersPerLongitude = 111320 * Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);
  const metersWidth = (bounds.east - bounds.west) * metersPerLongitude;
  const height = Math.round(width * (bounds.north - bounds.south) * 111320 / metersWidth);
  config.height = height;
  const pixelsPerMeter = width / metersWidth;
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
  const regions = config.regions.map(region => {
    const p = projectPoint(region.latitude, region.longitude, bounds, width, height);
    if (!p || p.x<0 || p.x>width || p.y<0 || p.y>height || !(region.radiusMeters>0)) throw new Error('Invalid exploration region');
    region.x = fixed(p.x); region.y = fixed(p.y); region.radius = fixed(region.radiusMeters*pixelsPerMeter);
    return `<g id="zone-${xml(region.id)}" class="zone" data-zone="${xml(region.id)}"><circle cx="${region.x}" cy="${region.y}" r="${region.radius}"/><g transform="translate(${region.x} ${fixed(region.y-region.radius+27)})"><rect x="-50" y="-24" width="100" height="46" rx="23"/><text y="8">구역 ${xml(region.letter)}</text></g></g>`;
  });
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
  const svg = `<svg id="exploration-map" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="map-title map-description"><title id="map-title">차이나타운·동화마을 탐색 지도</title><desc id="map-description">북쪽이 위인 실제 도로 기반 그림 지도. 색칠된 원은 넓은 탐색 구역입니다. 정답 위치와 이동 경로는 표시하지 않습니다.</desc><defs><clipPath id="map-clip"><rect width="${width}" height="${height}" rx="12"/></clipPath><pattern id="paper-grain" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".7" fill="#c2bea9" opacity=".35"/></pattern></defs><g clip-path="url(#map-clip)"><rect width="${width}" height="${height}" fill="#e8e3cd"/><rect width="${width}" height="${height}" fill="url(#paper-grain)"/>${paths.join('')}${regions.join('')}${landmark('incheon-station','인천역','station')}${parkLabel}<g id="user-location" hidden><ellipse id="user-accuracy"/><circle id="user-dot" r="11"/><text id="user-label" y="-24">내 위치 · 대략</text></g></g><g class="compass" transform="translate(${width-55} 65)"><path d="M0-25L-10 4H10ZM0-25V25"/><text y="-37">N</text></g><g class="scale" transform="translate(30 ${height-30})"><path d="M0-8V0H${fixed(pixelsPerMeter*100)}V-8"/><text x="${fixed(pixelsPerMeter*50)}" y="-14">약 100m</text></g></svg>`;
  const template = await readFile(join(root,'map.template.html'),'utf8');
  const locationCore = (await readFile(join(root,'location.mjs'),'utf8')).replace(/^export /gm,'');
  const output = template.replace('<!--__MAP_SVG__-->',()=>svg).replace('/*__MAPDATA__*/',()=>JSON.stringify(config).replace(/</g,'\\u003c')).replace('/*__LOCATION__*/',()=>locationCore);
  if (/__(?:MAP_SVG|MAPDATA|LOCATION)__/.test(output)) throw new Error('Unfilled map marker');
  await writeFile(join(root,'public/map.html'),output,'utf8');
  console.log(`Built exploration map: ${config.regions.length} regions, ${geography.roads.length} source roads.`);
}
