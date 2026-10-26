import type {DecodedSourceStreamBinding} from '../decoded-source-stream-transport';
import {P029_AUDIO_MANIFEST} from './audio-schedule-v1';

type Asset=(typeof P029_AUDIO_MANIFEST.embedded)[number]|typeof P029_AUDIO_MANIFEST.separateSa;
const sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(
  await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const scope='/flash-assets/g678-local/shared-alg001-l06-p029/audio-v1/';

/** Proposed product route; stage and bind this exact route before using it.
 * The caller's AbortSignal is the owner reservation cancellation signal. */
export async function loadP029Audio(asset:Asset,signal:AbortSignal):Promise<ArrayBuffer>{
  const url=new URL(`${scope}${asset.filename}?sha256=${asset.sourceSha256}`,window.location.origin);
  if(url.origin!==window.location.origin||!url.pathname.startsWith(scope))
    throw Error('P029_AUDIO_URL_SCOPE_MISMATCH');
  const response=await fetch(url,{signal,credentials:'same-origin',cache:'no-store',redirect:'error'});
  const contentType=response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if(!response.ok||response.redirected||response.url!==url.href||
    ![asset.playbackCodec,asset.playbackCodec==='audio/wav'?'audio/x-wav':''].includes(contentType??'')||
    response.headers.get('content-length')!==String(asset.sourceBytes)||!response.body)
    throw Error('P029_AUDIO_RESPONSE_MISMATCH');
  const bytes=new Uint8Array(asset.sourceBytes),reader=response.body.getReader();
  let count=0;
  try{
    for(;;){
      const chunk=await reader.read();
      if(signal.aborted)throw Error('P029_AUDIO_LOAD_CANCELED');
      if(chunk.done)break;
      if(count+chunk.value.byteLength>bytes.length)throw Error('P029_AUDIO_RESPONSE_TOO_LARGE');
      bytes.set(chunk.value,count);count+=chunk.value.byteLength;
    }
    if(count!==bytes.length||await sha(bytes.buffer)!==asset.sourceSha256)
      throw Error('P029_AUDIO_SOURCE_IDENTITY_MISMATCH');
    return bytes.buffer;
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}

/** Browser-only PCM measurement. FFmpeg's candidate digest is never accepted
 * as a DecodedSourceStreamBinding. Source WAV resampling is measured here. */
export async function measureP029BrowserDecode(asset:Asset,source:ArrayBuffer,
  createContext?:(rate:number)=>AudioContext):Promise<DecodedSourceStreamBinding>{
  const bytes=source.slice(0);
  if(bytes.byteLength!==asset.sourceBytes||await sha(bytes)!==asset.sourceSha256)
    throw Error('P029_BROWSER_MEASURE_SOURCE_MISMATCH');
  const context=createContext?.(asset.sampleRate)??
    new AudioContext({sampleRate:asset.sampleRate,latencyHint:'interactive'});
  try{
    if(context.sampleRate!==asset.sampleRate)throw Error('P029_BROWSER_MEASURE_CONTEXT_RATE_MISMATCH');
    const decoded=await context.decodeAudioData(bytes);
    if(decoded.sampleRate!==asset.sampleRate||decoded.numberOfChannels!==1||
      !Number.isSafeInteger(decoded.length)||decoded.length<=0)
      throw Error('P029_BROWSER_MEASURE_DECODE_MISMATCH');
    const samples=new ArrayBuffer(decoded.length*4),view=new DataView(samples);
    const channel=decoded.getChannelData(0);
    for(let index=0;index<decoded.length;index++){
      if(!Number.isFinite(channel[index]))throw Error('P029_BROWSER_MEASURE_NONFINITE_PCM');
      view.setFloat32(index*4,channel[index],true);
    }
    return Object.freeze({sourceSha256:asset.sourceSha256,
      sourceBytes:asset.sourceBytes,sampleRate:asset.sampleRate,channels:1,
      decodedSamples:decoded.length,pcmSha256:await sha(samples)});
  }finally{if(context.state!=='closed')await context.close();}
}
