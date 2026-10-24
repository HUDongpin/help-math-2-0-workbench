import {P027_MAIN_ASSET,P027_SA_ASSET} from './alg-l06-p027-audio-schedule-v1';

export const P027_MAIN_AUDIO_URL=
  `/flash-assets/g678-local/shared-alg001-l06-p027/main-source-v1?sha256=${P027_MAIN_ASSET.sourceSha256}`;
export const P027_OPTIONAL_SPANISH_AUDIO_URL=
  `/flash-assets/g678-local/shared-alg001-l06-p027/optional-spanish-audio-v1?sha256=${P027_SA_ASSET.sourceSha256}`;

/** Bounded, same-origin transport input. The decoder separately verifies the
 * full MP3 and decoded PCM hashes before any node may start. */
export async function p027ReadSourceAudio(urlPath:string,expectedBytes:number,
 signal:AbortSignal):Promise<ArrayBuffer>{
 const url=new URL(urlPath,window.location.origin);
 if(url.origin!==window.location.origin||!url.pathname.startsWith(
  '/flash-assets/g678-local/shared-alg001-l06-p027/'))
  throw Error('P027_AUDIO_URL_SCOPE_MISMATCH');
 const response=await fetch(url,{signal,credentials:'same-origin',cache:'no-store',
  redirect:'error'});
 if(!response.ok||response.redirected||response.url!==url.href||
  response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='audio/mpeg'||
  response.headers.get('content-length')!==String(expectedBytes)||!response.body)
  throw Error('P027_AUDIO_RESPONSE_MISMATCH');
 const reader=response.body.getReader(),bytes=new Uint8Array(expectedBytes);
 let count=0;
 try{
  for(;;){
   const chunk=await reader.read();
   if(signal.aborted)throw Error('P027_AUDIO_LOAD_CANCELED');
   if(chunk.done)break;
   if(count+chunk.value.byteLength>bytes.length)throw Error('P027_AUDIO_RESPONSE_TOO_LARGE');
   bytes.set(chunk.value,count);count+=chunk.value.byteLength;
  }
  if(count!==bytes.length)throw Error('P027_AUDIO_RESPONSE_LENGTH_MISMATCH');
  return bytes.buffer;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}

export const loadP027MainAudioSource=(signal:AbortSignal)=>
 p027ReadSourceAudio(P027_MAIN_AUDIO_URL,P027_MAIN_ASSET.sourceBytes,signal);
export const loadP027SeparateSaSource=(signal:AbortSignal)=>
 p027ReadSourceAudio(P027_OPTIONAL_SPANISH_AUDIO_URL,P027_SA_ASSET.sourceBytes,signal);
