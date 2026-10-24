import {notFound} from 'next/navigation';
import {p010LessonCanvasResourceForRequest,P010_LESSON_CANVAS_RESOURCES,
  type P010LessonCanvasId}
  from '@/lib/alg-l06-p010-lesson-canvas-request-v1';

const load=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  :import('@/lib/alg-l06-p010-lesson-canvas-resources-v1.server');
export const dynamic='force-dynamic';

export async function GET(request:Request,
  {params}:{params:Promise<{animationId:string}>}){
  const id=p010LessonCanvasResourceForRequest({method:request.method,
    url:new URL(request.url),headers:request.headers});
  const {animationId}=await params;
  if(id===null||id!==animationId||!Object.hasOwn(P010_LESSON_CANVAS_RESOURCES,id))notFound();
  let bytes:Buffer;
  try{
    const source=await load();
    if(!source)notFound();
    bytes=await source.readP010LessonCanvasResource(id as P010LessonCanvasId);
  }catch{notFound();}
  const pin=P010_LESSON_CANVAS_RESOURCES[id];
  if(bytes.length!==pin.bytes)notFound();
  return new Response(new Uint8Array(bytes),{headers:{
    'Content-Type':pin.contentType,'Content-Length':String(bytes.length),
    'Cache-Control':'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
    'X-Helpmath-G678-Asset':'p010-lesson-canvas-local-only',
    'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
    Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
