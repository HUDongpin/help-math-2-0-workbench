import {P040_AUDIO_SOURCE as source} from './generated/nms-l02-p040-audio-plan-v1';
export const p040AudioUrl=()=>'/flash-assets/g678-local/shared-nms002-l02-p040/source-audio/43?sha256='+source.sourceSha256;
/** The local host route is registered separately. Never follow redirects. */
export async function readP040SourceAudio(signal:AbortSignal):Promise<ArrayBuffer>{
 signal.throwIfAborted();const url=new URL(p040AudioUrl(),location.origin);
 const response=await fetch(url,{signal,cache:'no-store',credentials:'same-origin',redirect:'error'});
 signal.throwIfAborted();
 if(!response.ok||response.url!==url.href||response.redirected||response.headers.get('content-type')!=='audio/mpeg'||response.headers.get('content-length')!==String(source.sourceBytes))throw Error('P040_AUDIO_RESPONSE');
 const reader=response.body?.getReader();if(!reader)throw Error('P040_AUDIO_BODY');
 const bytes=new Uint8Array(source.sourceBytes);let offset=0;
 try{
  for(;;){signal.throwIfAborted();const {done,value}=await reader.read();signal.throwIfAborted();if(done)break;if(offset+value.length>bytes.length)throw Error('P040_AUDIO_SIZE');bytes.set(value,offset);offset+=value.length;}
  if(offset!==bytes.length)throw Error('P040_AUDIO_SIZE');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');signal.throwIfAborted();
  if(hash!==source.sourceSha256)throw Error('P040_AUDIO_HASH');return bytes.buffer;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
