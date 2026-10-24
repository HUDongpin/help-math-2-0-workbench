import {notFound} from 'next/navigation';
import {p004PredecessorResourceForRequest,P004_PREDECESSOR_RESOURCES}
  from '@/lib/alg-l06-p004-predecessor-request-v1';

const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  :import('@/lib/alg-l06-p004-predecessor-resources-v1.server');
export const dynamic='force-dynamic';

export async function GET(request:Request){
  if(p004PredecessorResourceForRequest({method:request.method,url:new URL(request.url),
    headers:request.headers})!=='canvas')notFound();
  let bytes:Buffer;
  try{const source=await loadSource();if(!source)notFound();
    bytes=source.readP004PredecessorResource('canvas');}catch{notFound();}
  const resource=P004_PREDECESSOR_RESOURCES.canvas;
  return new Response(new Uint8Array(bytes),{headers:{
    'Content-Type':resource.contentType,'Content-Length':String(bytes.length),
    'Cache-Control':'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
    'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
    Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
