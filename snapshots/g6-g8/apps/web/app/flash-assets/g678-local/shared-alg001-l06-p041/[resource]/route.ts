import {notFound} from 'next/navigation';

// Keep private source pins out of the Production route bundle. The local
// request table is loaded only inside the development-only response path.
const loadPolicy=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/lib/alg-l06-p041-local-request-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/lib/alg-l06-p041-resources-v1.server');

export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{resource:string}>}){
 const {resource}=await params;
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||
  process.env.VERCEL_ENV)notFound();
 const policy=await loadPolicy();if(!policy)notFound();
 const {p041ResourceForRequest,P041_RESOURCE_PINS}=policy;
 const token=p041ResourceForRequest({method:request.method,url:new URL(request.url),
  headers:request.headers});
 if(token!==resource||
  !Object.hasOwn(P041_RESOURCE_PINS,token))notFound();
 const row=P041_RESOURCE_PINS[token],source=await loadSource();
 if(!source)notFound();
 let bytes:Buffer;
 try{bytes=await source.readP041Resource(token as keyof typeof P041_RESOURCE_PINS);}catch{notFound();}
 if(bytes.length!==row.bytes)notFound();
 return new Response(request.method==='HEAD'?null:new Uint8Array(bytes),{
  headers:{'Content-Type':row.contentType,'Content-Length':String(bytes.length),
   'Cache-Control':'private, no-store, max-age=0',
   'Cross-Origin-Resource-Policy':'same-origin',
   'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive',
   'Vary':'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
   'X-Helpmath-G678-Asset':'p041-candidate-local-only'},
 });
}
export const HEAD=GET;
