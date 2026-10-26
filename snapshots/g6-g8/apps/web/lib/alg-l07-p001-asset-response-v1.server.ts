import 'server-only';
import {notFound} from 'next/navigation';
import {P001_RESOURCE_PINS,p001ResourceForRequest} from './alg-l07-p001-local-request-v1';
import {P001_ASSET_ROOT,P001_LOCAL_ORIGIN} from './alg-l07-p001-preview-policy-v1';

export async function p001AssetResponse(request:Request,method:'GET'|'HEAD',resource:string,
 mode:'candidate'|'registered'){
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  request.method!==method||resource!=='source-stream')notFound();
 const row=P001_RESOURCE_PINS['source-stream'],url=new URL(request.url);
 if(!['127.0.0.1','localhost'].includes(url.hostname)||url.protocol!=='http:'||
  url.port!=='3331'||
  ![row.originalPath,`${P001_ASSET_ROOT}-${mode}/${resource}`].includes(url.pathname)||
  url.username||url.password||url.hash)notFound();
 const original=new URL(`${P001_LOCAL_ORIGIN}${row.originalPath}${url.search}`);
 if(p001ResourceForRequest({method,url:original,headers:request.headers},mode)!==resource)notFound();
 let bytes:Buffer;
 try{const source=await import('./alg-l07-p001-resources-v1.server');
  bytes=source.readP001Resource(resource);}catch{notFound();}
 if(bytes.length!==row.bytes)notFound();
 return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{
  'Content-Type':row.contentType,'Content-Length':String(bytes.length),
  'Cache-Control':'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
  'X-Helpmath-G678-Asset':'alg-l07-p001-local-only',
  'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
  Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
 }});
}
