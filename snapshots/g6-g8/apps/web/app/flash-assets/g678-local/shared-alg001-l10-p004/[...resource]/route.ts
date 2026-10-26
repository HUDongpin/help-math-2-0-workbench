import {notFound} from 'next/navigation';
import {P004_LOCAL_ORIGIN} from '@/lib/alg-l10-p004-preview-policy-v1';
import {P004_RESOURCE_PINS,p004ResourceForRequest} from '@/lib/alg-l10-p004-local-request-v1';
export const dynamic='force-dynamic';
async function respond(request:Request,method:'GET'|'HEAD'){
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||request.method!==method)notFound();
 const url=new URL(request.url);
 if(url.protocol!=='http:'||url.port!=='3331'||!['127.0.0.1','localhost'].includes(url.hostname)||url.username||url.password||url.hash)notFound();
 const token=p004ResourceForRequest({method,url:new URL(`${P004_LOCAL_ORIGIN}${url.pathname}${url.search}`),headers:request.headers});
 if(!token)notFound();let bytes:Buffer;try{const source=await import('@/lib/alg-l10-p004-resources-v1.server');bytes=source.readP004Resource(token);}catch{notFound();}
 const row=P004_RESOURCE_PINS[token];if(bytes.length!==row.bytes)notFound();
 return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{'Content-Type':row.contentType,'Content-Length':String(bytes.length),
  'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'}});
}
export async function GET(request:Request){return respond(request,'GET');}
export async function HEAD(request:Request){return respond(request,'HEAD');}
