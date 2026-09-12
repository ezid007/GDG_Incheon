import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateMissionData} from './mission-validation.mjs';
import {buildMap} from './build-map.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(await readFile(join(root,'data/missions.json'),'utf8'));
validateMissionData(data);
const assets={};
const imagePaths=new Set(data.missions.flatMap(m=>m.answerImage?[m.image,m.answerImage]:[m.image]));
for(const imagePath of imagePaths){
  const bytes=await readFile(join(root,'public',imagePath));
  const ext=imagePath.split('.').at(-1);const mime={svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];
  assets[imagePath]='data:'+mime+';base64,'+bytes.toString('base64');
}
const core=(await readFile(join(root,'game-state.mjs'),'utf8')).replace(/^export /gm,'');
const demoCore=(await readFile(join(root,'demo-session.mjs'),'utf8')).replace(/^export /gm,'');
const escapeJson=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const template=await readFile(join(root,'index.template.html'),'utf8');
const output=template.replace('/*__DATA__*/',()=>escapeJson(data)).replace('/*__STATE__*/',()=>core).replace('/*__DEMO__*/',()=>demoCore).replace('/*__ASSETS__*/',()=>escapeJson(assets));
if(/\/\*__(?:DATA|STATE|DEMO|ASSETS)__\*\//.test(output))throw new Error('Unfilled template marker.');
await writeFile(join(root,'public/index.html'),output,'utf8');
console.log('Built standalone game: '+data.missions.length+' missions, '+Buffer.byteLength(output)+' bytes.');
await buildMap(root);
