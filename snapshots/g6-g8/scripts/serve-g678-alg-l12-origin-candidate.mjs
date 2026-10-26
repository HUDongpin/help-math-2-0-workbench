import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  '../migrations/shared-alg001-l12-p011/candidate-v2');
const files=new Map([['/', 'local-visual-probe.html'],
  ['/local-visual-probe.html','local-visual-probe.html'],
  ['/canvas-renderer.js','canvas-renderer.js']]);
http.createServer(async(request,response)=>{
  const pathname=new URL(request.url,'http://127.0.0.1').pathname;
  const file=files.get(pathname);
  if(!file){response.writeHead(404).end();return;}
  try {
    const bytes=await readFile(path.join(root,file));
    response.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8',
      'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});
    response.end(bytes);
  }catch{response.writeHead(500).end();}
}).listen(3127,'127.0.0.1',()=>console.log('Origin candidate v2: http://127.0.0.1:3127'));
