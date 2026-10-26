import {notFound} from 'next/navigation';
import {isP053SourceAudioRequest,P053_SOURCE_AUDIO_BYTES}
  from '@/lib/nms-l02-p053-source-audio-access';

const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  :import('@/lib/nms-l02-p053-source-audio.server');

export const dynamic='force-dynamic';

async function responseFor(request:Request,method:'GET'|'HEAD'){
  if(process.env.NODE_ENV!=='development')notFound();
  if(!isP053SourceAudioRequest({method:request.method,url:new URL(request.url),
    headers:request.headers})||request.method!==method)notFound();
  let bytes:Buffer;
  try{
    const source=await loadSource();
    if(!source)notFound();
    bytes=source.readP053SourceAudio();
  }catch{notFound();}
  if(bytes.length!==P053_SOURCE_AUDIO_BYTES)notFound();
  const headers={
    'Content-Type':'audio/mpeg',
    'Content-Length':String(bytes.length),
    'Cache-Control':'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy':'same-origin',
    'X-Content-Type-Options':'nosniff',
    'X-Robots-Tag':'noindex, nofollow, noarchive',
    Vary:'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  };
  return new Response(method==='HEAD'?null:new Uint8Array(bytes),{headers});
}

export const GET=(request:Request)=>responseFor(request,'GET');
export const HEAD=(request:Request)=>responseFor(request,'HEAD');
