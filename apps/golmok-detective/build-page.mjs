import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Reject a missing or repeated slot so an incomplete page never becomes output.
export function replaceSlot(source, slot, value) {
  if (source.split(slot).length !== 2) {
    throw new Error(`Expected one template slot: ${slot}`);
  }
  return source.replace(slot, () => value);
}

export function assertFilled(source) {
  if (/\/\*__[A-Z_]+__\*\/|<!--__[A-Z_]+__-->/.test(source)) {
    throw new Error('Unfilled page template slot');
  }
}

export function serializeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export async function readPageSource(root, page) {
  if (!['game', 'map'].includes(page)) throw new Error(`Unknown page: ${page}`);
  const [html, css, script] = await Promise.all([
    readFile(join(root, 'src/pages', `${page}.html`), 'utf8'),
    readFile(join(root, 'src/styles', `${page}.css`), 'utf8'),
    readFile(join(root, 'src/scripts', `${page}.js`), 'utf8'),
  ]);
  const styled = replaceSlot(html, '/*__STYLES__*/', css);
  return replaceSlot(styled, '/*__SCRIPT__*/', script);
}
