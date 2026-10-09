import {createServer} from 'node:http';
import {brotliCompressSync, gzipSync, constants} from 'node:zlib';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleContactRequest} from './lib/contact.mjs';
const root = dirname(fileURLToPath(import.meta.url));
const fileCache = new Map();
const types = {'.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp', '.woff2':'font/woff2'};
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self'; font-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
  let path;
  try {path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400);res.end();return;}
  if (path === '/api/contact') {await handleContactRequest(req,res);return;}
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  if (path === '/') path = '/index.html';
  if (!['/index.html','/style.css','/app.js'].includes(path) && !/^\/assets\/[a-zA-Z0-9._-]+\.(?:webp|woff2|svg)$/.test(path)) {res.writeHead(404);res.end('Not found');return;}
  const file = resolve(root,'.'+path);
  try {
    const info = await stat(file);
    const etag = `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
    res.setHeader('ETag',etag);res.setHeader('Vary','Accept-Encoding');
    res.setHeader('Cache-Control',path.startsWith('/assets/')?'public, max-age=86400':'no-cache');
    if (req.headers['if-none-match'] === etag) {res.writeHead(304);res.end();return;}
    const extension = extname(file);
    const encoding = /\bbr\b/.test(req.headers['accept-encoding'] || '') ? 'br' : /\bgzip\b/.test(req.headers['accept-encoding'] || '') ? 'gzip' : '';
    const compress = ['.html','.css','.js','.svg'].includes(extension) && encoding;
    let cached = fileCache.get(file);
    if (!cached || cached.etag !== etag) {cached = {etag, bytes: await readFile(file)};fileCache.set(file,cached);}
    let content = cached.bytes;
    if (compress) {
      if (!cached[encoding]) cached[encoding] = encoding === 'br' ? brotliCompressSync(content,{params:{[constants.BROTLI_PARAM_QUALITY]:4}}) : gzipSync(content);
      content = cached[encoding];res.setHeader('Content-Encoding',encoding);
    }
    res.setHeader('Vary','Accept-Encoding');res.setHeader('Content-Type',types[extension]);res.setHeader('Content-Length',content.length);
    res.writeHead(200);res.end(req.method === 'HEAD'?undefined:content);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.requestTimeout = 20000;server.headersTimeout = 10000;
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`Portfolio running on port ${Number(process.env.PORT)||3000}`));
