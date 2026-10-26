import{p036AudioSource}from'./nms-l02-p036-audio-pcm-v1';
export function p036AudioUrl(domain:string){const source=p036AudioSource(domain);return '/flash-assets/g678-local/shared-nms002-l02-p036/source-audio/'+domain+'?sha256='+source.sourceSha256;}
export async function readP036SourceAudio(domain:string,signal:AbortSignal):Promise<ArrayBuffer>{
 const expected=new URL(p036AudioUrl(domain),location.origin),source=p036AudioSource(domain),response=await fetch(expected,{signal,cache:'no-store',credentials:'same-origin',redirect:'error'});
 if(!response.ok||response.url!==expected.href||response.redirected||response.headers.get('content-type')!=='audio/mpeg'||response.headers.get('content-length')!==String(source.sourceBytes))throw Error('P036_AUDIO_RESPONSE');
 const reader=response.body?.getReader();if(!reader)throw Error('P036_AUDIO_BODY');const bytes=new Uint8Array(source.sourceBytes);let offset=0;
 try{for(;;){const{done,value}=await reader.read();if(done)break;if(offset+value.length>bytes.length)throw Error('P036_AUDIO_SIZE');bytes.set(value,offset);offset+=value.length;}if(offset!==bytes.length)throw Error('P036_AUDIO_SIZE');return bytes.buffer;}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
