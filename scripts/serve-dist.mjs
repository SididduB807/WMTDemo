import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

// Serve the actual production files at BOTH mounts; no Vite rewrite or dev server.
const directory = resolve('dist');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const mountedPath = pathname.startsWith('/demo-repo/') ? pathname.slice('/demo-repo'.length) : pathname;
    const file = resolve(directory, `.${mountedPath.endsWith('/') ? mountedPath + 'index.html' : mountedPath}`);
    if (!file.startsWith(directory + sep)) { response.writeHead(403).end(); return; }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(4173, '127.0.0.1', () => process.stdout.write('Built demo available at http://127.0.0.1:4173/ and /demo-repo/\n'));
