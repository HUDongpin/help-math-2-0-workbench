import {notFound} from 'next/navigation';
import {isP008ResourceRequest,P008_RESOURCE_PINS} from '@/lib/alg-l06-p008-local-request-v1';

const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  :import('@/lib/alg-l06-p008-resources-v1.server');
export const dynamic='force-dynamic';
async function responseFor(request:Request,method:'GET'|'HEAD'){
  if(request.method!==method||!isP008ResourceRequest({method:request.method,
    url:new URL(request.url),headers:request.headers},'main'))notFound();
  let bytes:Buffer;
  try{const source=await load();if(!source)notFound();bytes=source.readP008Resource('main');}
  catch{notFound();}
  const pin=P008_RESOURCE_PINS.main;
  if(bytes.length!==pin.bytes)notFound();
  return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers:{
    'Content-Type':pin.contentType,'Content-Length':String(bytes.length),
    'Cache-Control':'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
    'X-Robots-Tag':'noindex, nofollow, noarchive',
    Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
export const GET=(request:Request)=>responseFor(request,'GET');
export const HEAD=(request:Request)=>responseFor(request,'HEAD');

