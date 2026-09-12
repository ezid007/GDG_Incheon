import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(await readFile(join(root,'data/missions.json'),'utf8'));
if(!data.version||!Array.isArray(data.missions)||data.missions.length===0)throw new Error('Mission data is empty or invalid.');
const ids=new Set();const assets={};
for(const m of data.missions){
  if(!m.id||ids.has(m.id)||!['example','field'].includes(m.sceneKind)||!Array.isArray(m.options)||m.options.length!==3||new Set(m.options.map(o=>o.id)).size!==3||m.options.filter(o=>o.id===m.answerId).length!==1)throw new Error('Invalid mission identity, source or choices.');
  for(const key of ['sourceId','placeLabel','imageAlt','question','hint','explanation','evidenceQuote'])if(typeof m[key]!=='string'||!m[key].trim())throw new Error('Missing mission text: '+key);
  if(!m.options.every(option=>typeof option.id==='string'&&option.id.trim()&&typeof option.label==='string'&&option.label.trim()))throw new Error('Option IDs and labels must be non-empty strings.');
  if(!m.evidence||!['x','y'].every(k=>Number.isFinite(m.evidence[k])&&m.evidence[k]>=0&&m.evidence[k]<=100))throw new Error('Invalid evidence point.');
  if(!/^assets\/[a-z0-9-]+\.(svg|jpg|jpeg|png|webp)$/.test(m.image))throw new Error('Invalid public image path.');
  ids.add(m.id);const bytes=await readFile(join(root,'public',m.image));
  const ext=m.image.split('.').at(-1);const mime={svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];
  assets[m.image]='data:'+mime+';base64,'+bytes.toString('base64');
}
const core=(await readFile(join(root,'game-state.mjs'),'utf8')).replace(/^export /gm,'');
const escapeJson=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const template=await readFile(join(root,'index.template.html'),'utf8');
const output=template.replace('/*__DATA__*/',()=>escapeJson(data)).replace('/*__STATE__*/',()=>core).replace('/*__ASSETS__*/',()=>escapeJson(assets));
if(/\/\*__(?:DATA|STATE|ASSETS)__\*\//.test(output))throw new Error('Unfilled template marker.');
await writeFile(join(root,'public/index.html'),output,'utf8');
console.log('Built standalone game: '+data.missions.length+' missions, '+Buffer.byteLength(output)+' bytes.');
