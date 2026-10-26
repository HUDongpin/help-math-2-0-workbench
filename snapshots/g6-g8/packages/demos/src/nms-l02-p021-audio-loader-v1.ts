import {P021_IR as IR} from './generated/nms-l02-p021-source-ir-v1';
export function p021AudioUrl(domain:string){if(!Object.hasOwn(IR.audio,domain))throw Error('P021_AUDIO_DOMAIN');return '/flash-assets/g678-local/shared-nms002-l02-p021/source-audio/'+domain+'?sha256='+IR.audio[domain].sourceSha256;}
export async function readP021SourceAudio(domain:string,signal:AbortSignal):Promise<ArrayBuffer>{const expected=new URL(p021AudioUrl(domain),location.origin),source=IR.audio[domain],response=await fetch(expected,{signal,cache:'no-store',credentials:'same-origin',redirect:'error'});
 if(!response.ok||response.url!==expected.href||response.redirected||response.headers.get('content-type')!=='audio/mpeg'||response.headers.get('content-length')!==String(source.sourceBytes))throw Error('P021_AUDIO_RESPONSE');
 const reader=response.body?.getReader();if(!reader)throw Error('P021_AUDIO_BODY');const bytes=new Uint8Array(source.sourceBytes);let offset=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;if(offset+value.length>bytes.length)throw Error('P021_AUDIO_SIZE');bytes.set(value,offset);offset+=value.length;}if(offset!==bytes.length)throw Error('P021_AUDIO_SIZE');return bytes.buffer;}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
