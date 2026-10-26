import {notFound} from 'next/navigation';
import {P057_RESOURCE_PINS,type P057Resource}
 from '@/lib/alg-l06-p057-local-request-v1';
import {P057_LOCAL_ORIGIN} from '@/lib/alg-l06-p057-preview-policy-v1';
import {P057_REGISTERED_ASSET_ROOT,p057RegisteredResourceForRequest}
 from '@/lib/alg-l06-p057-registered-access-v1';

export const dynamic='force-dynamic';
const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/lib/alg-l06-p057-resources-v1.server');

async function responseFor(request:Request,method:'GET'|'HEAD',
 {params}:{params:Promise<{resource:string}>}){
 const {resource}=await params;
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||
  process.env.VERCEL_ENV||request.method!==method||
  !Object.hasOwn(P057_RESOURCE_PINS,resource))notFound();
 const row=P057_RESOURCE_PINS[resource as P057Resource];
 const rewritten=new URL(request.url);
 if(!['127.0.0.1','localhost'].includes(rewritten.hostname)||
  rewritten.protocol!=='http:'||rewritten.port!=='3331'||
  ![row.originalPath,`${P057_REGISTERED_ASSET_ROOT}/${resource}`]
   .includes(rewritten.pathname)||
  rewritten.username||rewritten.password||rewritten.hash)notFound();
 const original=new URL(P057_LOCAL_ORIGIN+row.originalPath+rewritten.search);
 const token=p057RegisteredResourceForRequest({method,url:original,headers:request.headers});
 if(token!==resource)notFound();
 let bytes:Buffer;
 try{const source=await load();if(!source)notFound();
  bytes=await source.readP057Resource(token as P057Resource);
 }catch{notFound();}
 if(bytes.length!==row.bytes)notFound();
 return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{
  'Content-Type':row.contentType,'Content-Length':String(bytes.length),
  'Cache-Control':'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
  'X-Helpmath-G678-Asset':'p057-registered-local-only',
  'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
  Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
 }});
}
export const GET=(request:Request,context:{params:Promise<{resource:string}>})=>
 responseFor(request,'GET',context);
export const HEAD=(request:Request,context:{params:Promise<{resource:string}>})=>
 responseFor(request,'HEAD',context);
