import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMissionData } from './mission-validation.mjs';
import { buildMap } from './build-map.mjs';
import { loadMissionData } from './load-quiz.mjs';
import {
  readPageSource,
  replaceSlot,
  serializeJson,
  assertFilled,
} from './build-page.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const data = await loadMissionData();
validateMissionData(data);
const assets = {};
const imagePaths = new Set(
  data.missions.flatMap((m) =>
    [m.image, m.quizImage, m.answerImage].filter((path) => path !== undefined),
  ),
);
imagePaths.add('assets/share-qr-20260913.jpg');
for (const imagePath of imagePaths) {
  const bytes = await readFile(join(root, 'public', imagePath));
  const ext = imagePath.split('.').at(-1);
  const mime = {
    svg: 'image/svg+xml',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }[ext];
  assets[imagePath] = 'data:' + mime + ';base64,' + bytes.toString('base64');
}
const core = (await readFile(join(root, 'game-state.mjs'), 'utf8')).replace(
  /^export /gm,
  '',
);
const demoCore = (
  await readFile(join(root, 'demo-session.mjs'), 'utf8')
).replace(/^export /gm, '');
let output = await readPageSource(root, 'game');
for (const [slot, value] of [
  ['/*__DATA__*/', serializeJson(data)],
  ['/*__STATE__*/', core],
  ['/*__DEMO__*/', demoCore],
  ['/*__ASSETS__*/ null', serializeJson(assets)],
])
  output = replaceSlot(output, slot, value);
assertFilled(output);
await writeFile(join(root, 'public/index.html'), output, 'utf8');
console.log(
  'Built standalone game: ' +
    data.missions.length +
    ' missions, ' +
    Buffer.byteLength(output) +
    ' bytes.',
);
await buildMap(root, data);
