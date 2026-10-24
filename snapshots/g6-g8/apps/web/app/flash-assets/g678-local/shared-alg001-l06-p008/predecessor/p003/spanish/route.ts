import {notFound} from 'next/navigation';
import {p008PredecessorResourceForRequest,P008_PREDECESSOR_RESOURCES}
  from '@/lib/alg-l06-p008-predecessor-request-v1';

const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  :import('@/lib/alg-l06-p008-predecessor-resources-v1.server');
export const dynamic='force-dynamic';
async function responseFor(request:Request,method:'GET'|'HEAD'){
  if(request.method!==method||p008PredecessorResourceForRequest({method:request.method,
    url:new URL(request.url),headers:request.headers})!=='p003Spanish')notFound();
  let bytes:Buffer;
  try{const source=await load();if(!source)notFound();bytes=source.readP008PredecessorResource('p003Spanish');}
  catch{notFound();}
  const pin=P008_PREDECESSOR_RESOURCES.p003Spanish;
  if(bytes.length!==pin.bytes)notFound();
  return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{
    'Content-Type':pin.contentType,'Content-Length':String(bytes.length),
    'Cache-Control':'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
    'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
    Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
export const GET=(request:Request)=>responseFor(request,'GET');
export const HEAD=(request:Request)=>responseFor(request,'HEAD');

