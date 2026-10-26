import http from 'node:http';
import {readFile} from 'node:fs/promises';
const runtime=new URL('../migrations/shared-alg001-l12-p003/candidate-v1/canvas-renderer.js',import.meta.url);
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,"><title>P003 drawing candidate</title>
<h1>P003 unregistered drawing candidate</h1><p>Silent English source drawing. No fidelity or host acceptance.</p>
<canvas id="stage" width="800" height="600"></canvas><output id="status">Loading</output>
<script src="/canvas-renderer.js"></script><script>
const asset=HELP_MATH_CANVAS_ASSETS['shared-alg001-l12-p003'];
asset.ready().then(()=>{asset.render(document.getElementById('stage'),{frame:1});document.getElementById('status').textContent='Ready';});
</script></html>`;
http.createServer(async(req,res)=>{
  if(req.method!=='GET'||!['/','/canvas-renderer.js'].includes(req.url)){res.writeHead(404).end();return;}
  try{const script=req.url==='/canvas-renderer.js';res.writeHead(200,{'Content-Type':script?'text/javascript':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}).end(script?await readFile(runtime):html);}catch{res.writeHead(500).end();}
}).listen(3134,'127.0.0.1',()=>console.log('P003 drawing probe http://127.0.0.1:3134'));
