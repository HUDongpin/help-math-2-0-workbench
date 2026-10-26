import {P043_AUDIO_PLANS} from './generated/nms-l02-p043-audio-plan-v1';
import type {P043AudioDomain} from './nms-l02-p043-audio-pcm-v1';
export function p043AudioUrl(domain:P043AudioDomain) {
  const source=P043_AUDIO_PLANS[domain];
  if(!source?.pageEventBound)throw Error('P043_AUDIO_UNBOUND');
  return `/flash-assets/g678-local/shared-nms002-l02-p043/source-audio/${domain}?sha256=${source.inputSha256}`;
}
/** Local-only source route; exact bounded body, MIME and hash before decode. */
export async function readP043SourceAudio(domain:P043AudioDomain,signal:AbortSignal):Promise<ArrayBuffer>{
  signal.throwIfAborted();const source=P043_AUDIO_PLANS[domain],url=new URL(p043AudioUrl(domain),location.origin);
  const response=await fetch(url,{signal,cache:'no-store',credentials:'same-origin',redirect:'error'});
  signal.throwIfAborted();
  const mime=source.inputCodec==='mp3'?'audio/mpeg':'audio/wav';
  if(!response.ok||response.url!==url.href||response.redirected||response.headers.get('content-type')!==mime||response.headers.get('content-length')!==String(source.inputBytes))throw Error('P043_AUDIO_RESPONSE');
  const reader=response.body?.getReader();if(!reader)throw Error('P043_AUDIO_BODY');
  const bytes=new Uint8Array(source.inputBytes);let offset=0;
  try {
    for(;;){signal.throwIfAborted();const {done,value}=await reader.read();signal.throwIfAborted();if(done)break;if(offset+value.length>bytes.length)throw Error('P043_AUDIO_SIZE');bytes.set(value,offset);offset+=value.length;}
    if(offset!==bytes.length)throw Error('P043_AUDIO_SIZE');
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    signal.throwIfAborted();if(hash!==source.inputSha256)throw Error('P043_AUDIO_HASH');return bytes.buffer;
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
