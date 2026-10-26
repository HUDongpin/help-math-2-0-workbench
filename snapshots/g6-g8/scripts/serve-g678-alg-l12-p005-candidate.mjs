import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const version = process.argv[2] || 'v1';
if (process.argv.length > 3 || !['v1','v2'].includes(version)) throw new Error('only v1 or v2 supported');
const runtime = new URL(`../migrations/shared-alg001-l12-p005/candidate-${version}/canvas-renderer.js`, import.meta.url);
const expected = version === 'v1' ? '3dbbe2b2448530f9c531b3de9609e6f3167e0803a7c1e7d38899fd422d51713c' : '48efbca3ddebf218565cdd635ffa130ae3a402c5693dd1ebcf359b2c30d500dd';
const bytes = await readFile(runtime);
if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error('P005 candidate drift');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,"><title>P005 drawing candidate</title>
<h1>P005 unregistered source drawing</h1><p>Silent English source drawing. Child clocks, audio and original runtime are not accepted.</p>
<canvas id="stage" width="800" height="600"></canvas><output id="status">Loading</output>
<script src="/canvas-renderer.js"></script><script>
const asset=HELP_MATH_CANVAS_ASSETS['shared-alg001-l12-p005'];
asset.ready().then(()=>{asset.render(document.getElementById('stage'),{frame:1});document.getElementById('status').textContent='Ready';}).catch(error=>{document.getElementById('status').textContent=String(error);});
</script></html>`;
http.createServer((req, res) => {
  if (req.method !== 'GET' || !['/', '/canvas-renderer.js'].includes(req.url)) {
    res.writeHead(404).end(); return;
  }
  const script = req.url === '/canvas-renderer.js';
  res.writeHead(200, {'Content-Type': script ? 'text/javascript' : 'text/html; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex,nofollow'}).end(script ? bytes : html);
}).listen(3134, '127.0.0.1', () => console.log('P005 probe http://127.0.0.1:3134'));
