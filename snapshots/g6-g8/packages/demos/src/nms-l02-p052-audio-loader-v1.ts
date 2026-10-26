import {p052AudioPlan,p052PrepareSourcePcm} from './nms-l02-p052-audio-pcm-v1';
export function p052AudioUrl(domain:string){
 const plan=p052AudioPlan(domain);
 return `/flash-assets/g678-local/shared-nms002-l02-p052/source-audio/${domain}?sha256=${plan.inputSha256}`;
}
async function verifyInput(domain:string,encoded:ArrayBuffer,signal:AbortSignal){
 signal.throwIfAborted();const plan=p052AudioPlan(domain);
 if(encoded.byteLength!==plan.inputBytes)throw Error('P052_AUDIO_INPUT');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoded)),n=>n.toString(16).padStart(2,'0')).join('');
 signal.throwIfAborted();if(digest!==plan.inputSha256)throw Error('P052_AUDIO_HASH');
}
/** Local preview only. Server admission remains a separate fail-closed boundary. */
export async function readP052SourceAudio(domain:string,signal:AbortSignal):Promise<ArrayBuffer>{
 signal.throwIfAborted();const plan=p052AudioPlan(domain);
 if(location.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(location.hostname))throw Error('P052_AUDIO_LOCAL_ONLY');
 const url=new URL(p052AudioUrl(domain),location.origin);
 const response=await fetch(url,{signal,cache:'no-store',credentials:'same-origin',redirect:'error'});
 signal.throwIfAborted();
 if(!response.ok||response.url!==url.href||response.redirected||response.headers.get('content-type')!=='audio/mpeg'
  ||response.headers.get('content-length')!==String(plan.inputBytes)){
  await response.body?.cancel().catch(()=>{});throw Error('P052_AUDIO_RESPONSE');
 }
 const reader=response.body?.getReader();if(!reader)throw Error('P052_AUDIO_BODY');
 const bytes=new Uint8Array(plan.inputBytes);let offset=0;
 try{
  for(;;){signal.throwIfAborted();const {done,value}=await reader.read();signal.throwIfAborted();if(done)break;
   if(offset+value.length>bytes.length)throw Error('P052_AUDIO_SIZE');bytes.set(value,offset);offset+=value.length;
  }
  if(offset!==bytes.length)throw Error('P052_AUDIO_SIZE');
  await verifyInput(domain,bytes.buffer,signal);return bytes.buffer;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function p052DecodeAudio(context:BaseAudioContext,domain:string,encoded:ArrayBuffer,signal:AbortSignal):Promise<AudioBuffer>{
 await verifyInput(domain,encoded,signal);const plan=p052AudioPlan(domain);
 // Decode the whole stream at its source sample rate, independent of device rate.
 const decoder=new OfflineAudioContext(1,1,plan.sampleRate);
 const decoded=await decoder.decodeAudioData(encoded.slice(0));signal.throwIfAborted();
 if(decoded.numberOfChannels!==plan.channels||decoded.sampleRate!==plan.sampleRate||decoded.length!==plan.decodedSamples)throw Error('P052_AUDIO_DECODE');
 const samples=p052PrepareSourcePcm(domain,decoded.getChannelData(0));signal.throwIfAborted();
 const result=context.createBuffer(1,samples.length,plan.sampleRate);result.copyToChannel(new Float32Array(samples),0);return result;
}
/** Per-page loader; cache successful complete buffers, never rejected/aborted work. */
export function createP052AudioLoader(){
 const cache=new WeakMap<BaseAudioContext,Map<string,AudioBuffer>>();
 return async(context:BaseAudioContext,domain:string,signal:AbortSignal)=>{
  signal.throwIfAborted();p052AudioPlan(domain);
  let buffers=cache.get(context);if(!buffers){buffers=new Map();cache.set(context,buffers);}
  const cached=buffers.get(domain);if(cached)return cached;
  const result=await p052DecodeAudio(context,domain,await readP052SourceAudio(domain,signal),signal);
  signal.throwIfAborted();buffers.set(domain,result);return result;
 };
}
