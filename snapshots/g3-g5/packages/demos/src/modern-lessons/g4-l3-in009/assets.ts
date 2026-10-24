import MANIFEST from './assets.generated.json';
import {loadBitmaps,disposeBitmaps,type AssetLoaders} from './painter';
import type {In009Assets} from './asset-contract';
const SOURCE='766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c';
export interface In009AssetEnvironment {fetch:typeof fetch;decode:(blob:Blob)=>Promise<ImageBitmap>;digest:(bytes:ArrayBuffer)=>Promise<string>}
const defaults:In009AssetEnvironment={fetch:(input,init)=>globalThis.fetch(input,init),decode:blob=>globalThis.createImageBitmap(blob,{colorSpaceConversion:'none'}),digest:async bytes=>Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('')};
function checkAbort(signal:AbortSignal){if(signal.aborted)throw signal.reason??new DOMException('IN009 asset loading cancelled','AbortError');}
/** Bound bytes before joining buffers, including servers omitting Content-Length. */
export async function readExactBytes(stream:ReadableStream<Uint8Array>,expected:number,signal:AbortSignal):Promise<Uint8Array>{
 if(!Number.isSafeInteger(expected)||expected<=0||expected>16*1024*1024)throw Error('Invalid IN009 byte limit');
 const reader=stream.getReader(),chunks:Uint8Array[]=[];let total=0,abortReason:unknown;
 const onAbort=()=>{abortReason=signal.reason??new DOMException('IN009 asset loading cancelled','AbortError');void reader.cancel(abortReason).catch(()=>{});};signal.addEventListener('abort',onAbort,{once:true});
 try{checkAbort(signal);while(true){const part=await reader.read();checkAbort(signal);if(abortReason)throw abortReason;if(part.done)break;total+=part.value.byteLength;if(total>expected){await reader.cancel();throw Error('IN009 asset exceeds exact byte count');}chunks.push(part.value);}if(total!==expected)throw Error('IN009 asset byte count mismatch');const result=new Uint8Array(total);let at=0;for(const chunk of chunks){result.set(chunk,at);at+=chunk.length;}return result;}finally{signal.removeEventListener('abort',onAbort);reader.releaseLock();}
}
async function fetchExact(url:string,bytes:number,signal:AbortSignal,environment:In009AssetEnvironment){
 checkAbort(signal);if(!/^\/lesson-typography-v1\/g4-l3-in009\/[a-z0-9.-]+$/.test(url))throw Error('Unbound IN009 resource URL');
 const response=await environment.fetch(url,{signal,redirect:'error',credentials:'same-origin'});if(!response.ok||response.redirected||!response.body)throw Error('IN009 resource HTTP failure');
 const length=response.headers.get('Content-Length'),encoding=response.headers.get('Content-Encoding');if((!encoding||encoding==='identity')&&length!==null&&Number(length)!==bytes){await response.body.cancel();throw Error('IN009 response length mismatch');}
 return readExactBytes(response.body,bytes,signal);
}
/** Real resources only: partial decodes and late cancelled results are always closed. */
export async function loadIn009Assets(signal:AbortSignal,environment:In009AssetEnvironment=defaults):Promise<In009Assets>{
 if(MANIFEST.schemaVersion!==1||MANIFEST.sourceSha256!==SOURCE||MANIFEST.bitmaps.length!==11)throw Error('IN009 asset manifest identity mismatch');
 const compressed=await fetchExact(MANIFEST.data.url,MANIFEST.data.bytes,signal,environment);checkAbort(signal);
 if(await environment.digest(compressed.buffer as ArrayBuffer)!==MANIFEST.data.sha256)throw Error('IN009 compressed input hash mismatch');
 if(typeof DecompressionStream==='undefined')throw Error('Gzip resource decoding unavailable');
 const unpacked=new Blob([compressed as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
 const bytes=await readExactBytes(unpacked,MANIFEST.data.decodedBytes,signal);checkAbort(signal);
 if(await environment.digest(bytes.buffer as ArrayBuffer)!==MANIFEST.data.decodedSha256)throw Error('IN009 decoded input hash mismatch');
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 if(data.schemaVersion!==1||data.animationId!=='course-g04-l03-in-009'||data.geometry?.sourceSha256!==SOURCE||data.geometry?.packingVersion!==1||data.sceneInputs?.sourceSha256!==SOURCE)throw Error('IN009 decoded identity mismatch');
 const specs=new Map(MANIFEST.bitmaps.map(spec=>[spec.url,spec]));
 const loaders:AssetLoaders={fetch:async input=>{if(typeof input!=='string'||!specs.has(input))throw Error('Unbound IN009 bitmap URL');const spec=specs.get(input)!;const body=await fetchExact(spec.url,spec.bytes,signal,environment);return new Response(body as BodyInit,{status:200,headers:{'Content-Type':'image/png'}});},decode:blob=>environment.decode(blob),digest:bytes=>environment.digest(bytes)};
 const bitmaps=await loadBitmaps(MANIFEST.bitmaps,signal,loaders);if(signal.aborted){disposeBitmaps(bitmaps);checkAbort(signal);}
 const bitmap19=MANIFEST.bitmaps.find(spec=>spec.id===19);if(!bitmap19){disposeBitmaps(bitmaps);throw Error('IN009 weather bitmap missing');}
 let disposed=false;return{geometry:data.geometry,sceneInputs:data.sceneInputs,bitmaps,bitmap19Url:bitmap19.url,dispose:()=>{if(disposed)return;disposed=true;disposeBitmaps(bitmaps);}};
}
