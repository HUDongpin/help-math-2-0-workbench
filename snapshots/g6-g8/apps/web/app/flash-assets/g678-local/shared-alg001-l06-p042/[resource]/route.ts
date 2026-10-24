import {notFound} from 'next/navigation';
import {P042_LOCAL_ORIGIN} from '@/lib/alg-l06-p042-preview-policy-v1';

// Development-only dynamic imports keep private source pins out of Production.
const loadPolicy=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/lib/alg-l06-p042-local-request-v1');
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/lib/alg-l06-p042-resources-v1.server');

export const dynamic='force-dynamic';
async function responseFor(request:Request,method:'GET'|'HEAD',
 {params}:{params:Promise<{resource:string}>}){
 const {resource}=await params;
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||
  process.env.VERCEL_ENV||request.method!==method)notFound();
 const policy=await loadPolicy();if(!policy)notFound();
 const {p042ResourceForRequest,P042_RESOURCE_PINS}=policy;
 if(!Object.hasOwn(P042_RESOURCE_PINS,resource))notFound();
 const row=P042_RESOURCE_PINS[resource],rewritten=new URL(request.url);
 if(!['127.0.0.1','localhost'].includes(rewritten.hostname)||
  rewritten.protocol!=='http:'||rewritten.port!=='3331'||
  ![row.originalPath,row.bridgePath].includes(rewritten.pathname)||
  rewritten.username||rewritten.password||rewritten.hash)notFound();
 const original=new URL(P042_LOCAL_ORIGIN+row.originalPath+rewritten.search);
 const token=p042ResourceForRequest({method,url:original,headers:request.headers});
 if(token!==resource)notFound();
 const source=await loadSource();
 if(!source)notFound();
 let bytes:Buffer;
 try{bytes=await source.readP042Resource(token as keyof typeof P042_RESOURCE_PINS);}catch{notFound();}
 if(bytes.length!==row.bytes)notFound();
 return new Response(method==='HEAD'?null:new Uint8Array(bytes),{
  headers:{'Content-Type':row.contentType,'Content-Length':String(bytes.length),
   'Cache-Control':'private, no-store, max-age=0',
   'Cross-Origin-Resource-Policy':'same-origin',
   'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive',
   'Vary':'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
   'X-Helpmath-G678-Asset':'p042-candidate-local-only'},
 });
}
export const GET=(request:Request,context:{params:Promise<{resource:string}>})=>
 responseFor(request,'GET',context);
export const HEAD=(request:Request,context:{params:Promise<{resource:string}>})=>
 responseFor(request,'HEAD',context);
