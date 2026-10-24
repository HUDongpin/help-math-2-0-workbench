import {notFound} from 'next/navigation';
import {p015ResourceForRequest,P015_RESOURCE_PINS,type P015Resource}
  from '@/lib/alg-l06-p015-local-request-v1';

const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  :import('@/lib/alg-l06-p015-resources-v1.server');
export const dynamic='force-dynamic';

async function responseFor(request:Request,method:'GET'|'HEAD',
  {params}:{params:Promise<{resource:string}>}){
  const token=p015ResourceForRequest({method:request.method,url:new URL(request.url),
    headers:request.headers});
  const {resource}=await params;
  if(request.method!==method||token===null||token!==resource||
    !Object.hasOwn(P015_RESOURCE_PINS,token))notFound();
  const row=P015_RESOURCE_PINS[token];
  let bytes:Buffer;
  try{
    const source=await load();
    if(!source)notFound();
    bytes=await source.readP015Resource(token as P015Resource);
  }catch{notFound();}
  if(bytes.length!==row.bytes)notFound();
  return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{
    'Content-Type':row.contentType,'Content-Length':String(bytes.length),
    'Cache-Control':'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
    'X-Helpmath-G678-Asset':'p015-candidate-local-only',
    'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
    Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
export const GET=(request:Request,context:{params:Promise<{resource:string}>})=>
  responseFor(request,'GET',context);
export const HEAD=(request:Request,context:{params:Promise<{resource:string}>})=>
  responseFor(request,'HEAD',context);
