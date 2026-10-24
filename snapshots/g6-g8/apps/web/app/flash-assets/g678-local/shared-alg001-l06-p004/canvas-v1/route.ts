import {notFound} from 'next/navigation';
import {isP004ResourceRequest,P004_RESOURCE_PINS} from '@/lib/alg-l06-p004-local-request-v1';

const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
 :import('@/lib/alg-l06-p004-resources-v1.server');
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!isP004ResourceRequest({method:request.method,url:new URL(request.url),headers:request.headers},'canvas'))notFound();
 let bytes:Buffer;
 try{const source=await load();if(!source)notFound();bytes=source.readP004Resource('canvas');}catch{notFound();}
 if(bytes.length!==P004_RESOURCE_PINS.canvas.bytes)notFound();
 return new Response(new Uint8Array(bytes),{headers:{
  'Content-Type':P004_RESOURCE_PINS.canvas.contentType,'Content-Length':String(bytes.length),
  'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive',
  Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
 }});
}
