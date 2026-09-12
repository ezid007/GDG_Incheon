import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { createGameServer } from '../serve.mjs';

let root;
let server;
let port;

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'golmok-server-test-'));
  await mkdir(join(root, 'assets'));
  await writeFile(join(root, 'index.html'), '<!doctype html><h1>골목탐정</h1>');
  for (const name of ['window', 'sign', 'direction']) {
    await writeFile(join(root, 'assets', `example-${name}.svg`), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  }
  await writeFile(join(root, 'private.txt'), 'private fixture');
  server = createGameServer({ publicRoot: root });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  port = server.address().port;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  if (root) {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.match(basename(root), /^golmok-server-test-/);
    await rm(root, { recursive: true, force: true });
  }
});

function request(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ hostname: '127.0.0.1', port, path, method }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
      response.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

test('the root and index serve UTF-8 HTML with fresh content and response policies', async () => {
  for (const path of ['/', '/index.html', '/?preview=1']) {
    const result = await request(path);
    assert.equal(result.status, 200);
    assert.match(result.headers['content-type'], /^text\/html; charset=utf-8$/);
    assert.match(result.body, /골목탐정/);
    assert.equal(Number(result.headers['content-length']), Buffer.byteLength(result.body), JSON.stringify(result));
    assert.match(result.headers['cache-control'], /no-store/);
    assert.equal(result.headers['x-content-type-options'], 'nosniff');
    assert.equal(result.headers['referrer-policy'], 'no-referrer');
    assert.match(result.headers['content-security-policy'], /frame-ancestors 'none'/);
  }
});

test('HEAD returns the same length and type as GET without a response body', async () => {
  const get = await request('/');
  const head = await request('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.equal(head.headers['content-length'], get.headers['content-length']);
  assert.equal(head.headers['content-type'], get.headers['content-type']);
});

test('all three reviewed illustrations are served with SVG MIME type', async () => {
  for (const name of ['window', 'sign', 'direction']) {
    const result = await request(`/assets/example-${name}.svg`);
    assert.equal(result.status, 200);
    assert.match(result.headers['content-type'], /^image\/svg\+xml; charset=utf-8$/);
    assert.match(result.body, /^<svg/);
  }
});

test('POST is refused with an explicit Allow header', async () => {
  const result = await request('/', 'POST');
  assert.equal(result.status, 405);
  assert.equal(result.headers.allow, 'GET, HEAD');
});

test('existing unlisted files, directories, and project-private paths are not public', async () => {
  for (const path of ['/private.txt', '/assets/', '/missing', '/docs/notes.md', '/logs/development.log', '/.env', '/.codex-remote-attachments/photo.jpg', '/../private.txt', '/%2e%2e/private.txt', '/assets/../index.html']) {
    const result = await request(path);
    assert.equal(result.status, 404, path);
    assert.equal(result.body, 'Not found.');
  }
  const head = await request('/private.txt', 'HEAD');
  assert.equal(head.status, 404);
  assert.equal(head.body, '');
});

test('changed game content is visible on the next request', async () => {
  await writeFile(join(root, 'index.html'), '<!doctype html><h1>Updated preview</h1>');
  const result = await request('/');
  assert.equal(result.status, 200);
  assert.match(result.body, /Updated preview/);
});

test('an unavailable allowlisted file returns a generic error without a local path', async () => {
  await rm(join(root, 'assets', 'example-direction.svg'));
  const result = await request('/assets/example-direction.svg');
  assert.equal(result.status, 500);
  assert.equal(result.body, 'The page is temporarily unavailable.');
  assert.ok(!result.body.includes(root));
});

test('the HTTP handler emits exact GET/HEAD headers before any network filtering', async () => {
  const handler = server.listeners('request')[0];
  async function capture(method) {
    const result = {};
    await handler({ method, url: '/' }, {
      writeHead(status, headers) {
        result.status = status;
        result.headers = headers;
      },
      end(body) {
        result.body = body;
      },
    });
    return result;
  }
  const get = await capture('GET');
  const head = await capture('HEAD');
  assert.equal(get.status, 200);
  assert.equal(head.status, 200);
  assert.equal(get.headers['Content-Length'], Buffer.byteLength(get.body));
  assert.deepEqual(head.headers, get.headers);
  assert.equal(head.body, undefined);
  assert.match(get.headers['Content-Security-Policy'], /connect-src 'none'/);
});
