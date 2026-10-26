import {P039_AUDIO_SOURCE as SOURCE} from './generated/nms-l02-p039-audio-source-v1';
export type P039EncodedDomain='223'|'230'|'234'|'237';
export function p039EncodedSource(domain:string){
 if(domain==='230')return {source:SOURCE.coach.source,decodedSamples:SOURCE.coach.decodedSamples};
 if(domain==='223'||domain==='234'||domain==='237')return SOURCE.streams[domain];
 throw Error('P039_AUDIO_DOMAIN');
}
export function p039AudioUrl(domain:string){const plan=p039EncodedSource(domain);return '/flash-assets/g678-local/shared-nms002-l02-p039/source-audio/'+domain+'?sha256='+plan.source.sha256;}
/** The host route is admitted separately. This reader never follows a redirect. */
export async function readP039SourceAudio(domain:string,signal:AbortSignal):Promise<ArrayBuffer>{
 const plan=p039EncodedSource(domain),url=new URL(p039AudioUrl(domain),location.origin);
 const response=await fetch(url,{signal,cache:'no-store',credentials:'same-origin',redirect:'error'});
 if(!response.ok||response.url!==url.href||response.redirected||response.headers.get('content-type')!=='audio/mpeg'||response.headers.get('content-length')!==String(plan.source.bytes))throw Error('P039_AUDIO_RESPONSE');
 const reader=response.body?.getReader();if(!reader)throw Error('P039_AUDIO_BODY');
 const bytes=new Uint8Array(plan.source.bytes);let count=0;
 try{for(;;){const result=await reader.read();if(result.done)break;if(count+result.value.length>bytes.length)throw Error('P039_AUDIO_SIZE');bytes.set(result.value,count);count+=result.value.length;}if(count!==bytes.length)throw Error('P039_AUDIO_SIZE');return bytes.buffer;}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
