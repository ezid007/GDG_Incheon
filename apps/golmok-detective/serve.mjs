import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORT = 4179;
const PUBLIC_ROOT = join(dirname(fileURLToPath(import.meta.url)), 'public');
const ROUTES = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/assets/example-window.svg', ['assets/example-window.svg', 'image/svg+xml; charset=utf-8']],
  ['/assets/example-sign.svg', ['assets/example-sign.svg', 'image/svg+xml; charset=utf-8']],
  ['/assets/example-direction.svg', ['assets/example-direction.svg', 'image/svg+xml; charset=utf-8']],
]);

const HEADERS = {
  'Cache-Control': 'no-store, max-age=0, no-transform',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

export function createGameServer({ publicRoot = PUBLIC_ROOT } = {}) {
  return createServer(async (request, response) => {
    function send(status, body, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
      response.writeHead(status, {
        ...HEADERS,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(body),
        ...extraHeaders,
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      send(405, 'Method not allowed.', undefined, { Allow: 'GET, HEAD' });
      return;
    }

    // Only these literal paths are public; queries may be used to refresh a preview.
    const pathname = (request.url ?? '').split('?')[0];
    const route = ROUTES.get(pathname);
    if (!route) {
      send(404, 'Not found.');
      return;
    }

    const [filename, contentType] = route;
    try {
      const body = await readFile(join(publicRoot, filename));
      send(200, body, contentType);
    } catch {
      send(500, 'The page is temporarily unavailable.');
    }
  });
}

function parsePort(args) {
  if (args.length === 0) return DEFAULT_PORT;
  if (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1])) {
    throw new Error('Usage: node serve.mjs [--port 1-65535]');
  }
  const port = Number(args[1]);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('Port must be an integer from 1 to 65535.');
  }
  return port;
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  try {
    const port = parsePort(process.argv.slice(2));
    const server = createGameServer();
    server.on('error', () => {
      console.error('Unable to start the game server. Check whether the port is available.');
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      console.log(`Golmok Detective: http://127.0.0.1:${port}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
