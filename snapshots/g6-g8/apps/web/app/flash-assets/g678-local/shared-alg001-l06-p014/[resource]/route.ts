import {notFound} from 'next/navigation';
import {p014ResourceForRequest,P014_RESOURCE_PINS,type P014Resource}
  from '@/lib/alg-l06-p014-local-request-v1';

const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  :import('@/lib/alg-l06-p014-resources-v1.server');
export const dynamic='force-dynamic';

async function responseFor(request:Request,method:'GET'|'HEAD',
  {params}:{params:Promise<{resource:string}>}){
  const token=p014ResourceForRequest({method:request.method,url:new URL(request.url),
    headers:request.headers});
  const {resource}=await params;
  if(request.method!==method||token===null||token!==resource||
    !Object.hasOwn(P014_RESOURCE_PINS,token))notFound();
  const row=P014_RESOURCE_PINS[token];
  let bytes:Buffer;
  try{
    const source=await load();
    if(!source)notFound();
    bytes=await source.readP014Resource(token as P014Resource);
  }catch{notFound();}
  if(bytes.length!==row.bytes)notFound();
  return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{
    'Content-Type':row.contentType,'Content-Length':String(bytes.length),
    'Cache-Control':'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
    'X-Helpmath-G678-Asset':'p014-candidate-local-only',
    'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
    Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
export const GET=(request:Request,context:{params:Promise<{resource:string}>})=>
  responseFor(request,'GET',context);
export const HEAD=(request:Request,context:{params:Promise<{resource:string}>})=>
  responseFor(request,'HEAD',context);
