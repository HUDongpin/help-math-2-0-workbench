import {notFound} from 'next/navigation';
import {P001_LOCAL_ORIGIN,p001DocumentReferer} from '@/lib/alg-l08-p001-preview-policy-v1';
import {P001_RESOURCE_PINS,p001ResourceForRequest} from '@/lib/alg-l08-p001-local-request-v1';
export const dynamic='force-dynamic';
async function respond(request:Request,method:'GET'|'HEAD'){
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||request.method!==method)notFound();
 const mode=p001DocumentReferer(request.headers.get('referer'),'candidate')?'candidate':
  p001DocumentReferer(request.headers.get('referer'),'registered')?'registered':null;
 if(!mode)notFound();const url=new URL(request.url);
 if(url.protocol!=='http:'||url.port!=='3331'||!['127.0.0.1','localhost'].includes(url.hostname)||url.username||url.password||url.hash)notFound();
 const external=new URL(`${P001_LOCAL_ORIGIN}${url.pathname}${url.search}`);
 if(p001ResourceForRequest({method,url:external,headers:request.headers},mode)!=='source-stream')notFound();
 let bytes:Buffer;try{const source=await import('@/lib/alg-l08-p001-resources-v1.server');bytes=source.readP001Resource('source-stream');}catch{notFound();}
 const row=P001_RESOURCE_PINS['source-stream'];
 if(bytes.length!==row.bytes)notFound();
 return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{'Content-Type':row.contentType,'Content-Length':String(bytes.length),
  'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'}});
}
export async function GET(request:Request){return respond(request,'GET');}
export async function HEAD(request:Request){return respond(request,'HEAD');}
