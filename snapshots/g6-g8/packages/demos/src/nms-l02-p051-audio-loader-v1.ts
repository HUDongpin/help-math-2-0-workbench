import {P051_AUDIO_PLANS} from './generated/nms-l02-p051-audio-plan-v1';
import type {P051Window} from './nms-l02-p051-audio-window-v1';
type P051AudioDomain=P051Window['domain'];
export function p051AudioUrl(domain:P051AudioDomain) {
  const source=P051_AUDIO_PLANS[domain];
  if(!Object.hasOwn(P051_AUDIO_PLANS,domain))throw Error('P051_AUDIO_UNBOUND');
  return `/flash-assets/g678-local/shared-nms002-l02-p051/source-audio/${domain}?sha256=${source.inputSha256}`;
}
/** Local-only source route; exact bounded body, MIME and hash before decode. */
export async function readP051SourceAudio(domain:P051AudioDomain,signal:AbortSignal):Promise<ArrayBuffer>{
  signal.throwIfAborted();if(location.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(location.hostname))throw Error('P051_AUDIO_LOCAL_ONLY');const source=P051_AUDIO_PLANS[domain],url=new URL(p051AudioUrl(domain),location.origin);
  const response=await fetch(url,{signal,cache:'no-store',credentials:'same-origin',redirect:'error'});
  signal.throwIfAborted();
  const mime='audio/mpeg';
  if(!response.ok||response.url!==url.href||response.redirected||response.headers.get('content-type')!==mime||response.headers.get('content-length')!==String(source.inputBytes))throw Error('P051_AUDIO_RESPONSE');
  const reader=response.body?.getReader();if(!reader)throw Error('P051_AUDIO_BODY');
  const bytes=new Uint8Array(source.inputBytes);let offset=0;
  try {
    for(;;){signal.throwIfAborted();const {done,value}=await reader.read();signal.throwIfAborted();if(done)break;if(offset+value.length>bytes.length)throw Error('P051_AUDIO_SIZE');bytes.set(value,offset);offset+=value.length;}
    if(offset!==bytes.length)throw Error('P051_AUDIO_SIZE');
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    signal.throwIfAborted();if(hash!==source.inputSha256)throw Error('P051_AUDIO_HASH');return bytes.buffer;
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
