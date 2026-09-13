import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import {
  assertFilled,
  readPageSource,
  replaceSlot,
  serializeJson,
} from '../build-page.mjs';
import { renderMap } from '../build-map.mjs';
import { loadMissionData } from '../load-quiz.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = await loadMissionData();

// Assemble in memory: these tests never overwrite a preview or deployment file.
async function renderGame() {
  let html = await readPageSource(root, 'game');
  const modules = await Promise.all(
    ['game-state.mjs', 'demo-session.mjs'].map(async (file) =>
      (await readFile(join(root, file), 'utf8')).replace(/^export /gm, ''),
    ),
  );
  const assets = {
    'assets/share-qr-20260913.jpg': 'data:image/jpeg;base64,/9j/2Q==',
  };
  for (const [slot, value] of [
    ['/*__DATA__*/', serializeJson(data)],
    ['/*__STATE__*/', modules[0]],
    ['/*__DEMO__*/', modules[1]],
    ['/*__ASSETS__*/ null', serializeJson(assets)],
  ]) {
    html = replaceSlot(html, slot, value);
  }
  assertFilled(html);
  return html;
}

test('a template slot inserts source literally and rejects ambiguous templates', () => {
  const value = 'const replacements = ["$&", "$$", "$`", "$\'"];';
  assert.equal(replaceSlot('before SLOT after', 'SLOT', value), `before ${value} after`);
  assert.throws(() => replaceSlot('no placeholder', 'SLOT', value), /template slot/);
  assert.throws(() => replaceSlot('SLOT and SLOT', 'SLOT', value), /template slot/);
});

test('unfinished HTML and JavaScript slots cannot pass the final build check', () => {
  for (const source of [
    '<style>/*__STYLES__*/</style>',
    '<script>const data = /*__MAPDATA__*/ null;</script>',
    '<main><!--__QUIZ_CARDS__--></main>',
  ]) {
    assert.throws(() => assertFilled(source), /Unfilled/);
  }
  assert.doesNotThrow(() => assertFilled('<main><!-- a normal comment --></main>'));
});

test('serialized quiz text survives an inline JSON script without closing its tag', () => {
  const value = {
    question: '</script><script>throw new Error("unexpected script")</script>',
    '<label>': '<!-- 글자 < 모양 & 색상 -->',
    options: ['한글', 'quote " and backslash \\', null],
  };
  const serialized = serializeJson(value);
  const html = `<script type="application/json">${serialized}</script>`;
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.deepEqual(JSON.parse(scripts[0][1]), value);
  assert.equal(serialized.includes('<'), false);
});

test('only the two supported page names can be assembled', async () => {
  await assert.rejects(readPageSource(root, '../game'), /Unknown page/);
});

for (const page of ['game', 'map']) {
  test(`${page} embeds the editable stylesheet and controller without external loads`, async () => {
    const html = await readPageSource(root, page);
    const [css, script] = await Promise.all([
      readFile(join(root, 'src/styles', `${page}.css`), 'utf8'),
      readFile(join(root, 'src/scripts', `${page}.js`), 'utf8'),
    ]);
    const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
    const controllers = [...html.matchAll(/<script\s*>([\s\S]*?)<\/script>/gi)];
    assert.equal(styles.length, 1);
    assert.equal(controllers.length, 1);
    assert.equal(styles[0][1].trim(), css.trim());
    assert.equal(controllers[0][1].trim(), script.trim());
    assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
    assert.doesNotMatch(html, /<link\b[^>]*\brel=["']stylesheet["']/i);
    assert.match(html, /<html\b[^>]*\blang="ko"/i);
    assert.match(html, /<meta\b[^>]*\bname="viewport"/i);
    assert.match(html, /<title>[^<]+<\/title>/i);
    assert.match(html, /<main\b/);
    assert.match(html, /<a\b[^>]*\bhref="\.\/"/);
  });
}

test('the assembled game keeps quiz JSON separate from one valid inline controller', async () => {
  const html = await renderGame();
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 2);
  const json = scripts.find((script) => /type="application\/json"/.test(script[1]));
  const executable = scripts.filter((script) => !/type="application\/json"/.test(script[1]));
  assert.ok(json, 'quiz data must remain non-executable JSON');
  assert.deepEqual(JSON.parse(json[2]), JSON.parse(JSON.stringify(data)));
  assert.equal(executable.length, 1);
  assert.doesNotThrow(() => new Script(executable[0][2], { filename: 'game.html' }));
});

test('the share dialog retains QR, a labelled link field, and a copy action together', async () => {
  const html = await renderGame();
  const dialog = [...html.matchAll(/<dialog\b([^>]*)>([\s\S]*?)<\/dialog\s*>/gi)]
    .find((match) => /\bid="share-dialog"/.test(match[1]));
  assert.ok(dialog, 'the sharing controls must belong to one dialog');
  assert.match(dialog[1], /aria-labelledby="share-title"/);
  const qr = dialog[2].match(/<img\b[^>]*\bid="share-qr-image"[^>]*>/);
  assert.ok(qr, 'the QR must be visible markup, not only social-preview metadata');
  assert.match(qr[0], /\balt="[^"]+"/);
  assert.match(dialog[2], /<label\b[^>]*\bfor="share-url"/);
  assert.match(dialog[2], /<input\b[^>]*\bid="share-url"[^>]*\breadonly/);
  assert.match(dialog[2], /<button\b[^>]*\bid="copy-url"/);
});

test('the rendered map has filled content and one syntactically valid inline controller', async () => {
  const html = await renderMap(root, data);
  assert.doesNotThrow(() => assertFilled(html));
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1], { filename: 'map.html' }));
  assert.match(html, /<svg\b[^>]*\bid="exploration-map"/);
  assert.match(html, /<section\b[^>]*\bid="quiz-list"/);
});
