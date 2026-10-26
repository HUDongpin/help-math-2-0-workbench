import assert from'node:assert/strict';import test from'node:test';
import {readP039SourceAudio,p039AudioUrl}from'../src/nms-l02-p039-audio-loader-v1';
test('encoded audio reader binds same-origin URL, exact headers and streamed byte count',async()=>{
 const originalFetch=globalThis.fetch,originalLocation=Object.getOwnPropertyDescriptor(globalThis,'location');
 Object.defineProperty(globalThis,'location',{value:{origin:'http://localhost:3464'},configurable:true});
 try{
  let size=1950,declared='1950',urlOverride:string|null=null,mime='audio/mpeg';
  globalThis.fetch=async(input,options)=>{assert.equal(options?.redirect,'error');assert.equal(options?.credentials,'same-origin');const response=new Response(new Uint8Array(size),{headers:{'content-type':mime,'content-length':declared}});Object.defineProperty(response,'url',{value:urlOverride??String(input)});return response;};
  const signal=new AbortController().signal;assert.equal((await readP039SourceAudio('223',signal)).byteLength,1950);
  size=1951;await assert.rejects(readP039SourceAudio('223',signal),/P039_AUDIO_SIZE/);
  size=1949;await assert.rejects(readP039SourceAudio('223',signal),/P039_AUDIO_SIZE/);
  size=1950;declared='1951';await assert.rejects(readP039SourceAudio('223',signal),/P039_AUDIO_RESPONSE/);
  declared='1950';mime='text/html';await assert.rejects(readP039SourceAudio('223',signal),/P039_AUDIO_RESPONSE/);
  mime='audio/mpeg';urlOverride='http://elsewhere.invalid/audio';await assert.rejects(readP039SourceAudio('223',signal),/P039_AUDIO_RESPONSE/);
  assert.throws(()=>p039AudioUrl('236'),/P039_AUDIO_DOMAIN/);
 }finally{globalThis.fetch=originalFetch;if(originalLocation)Object.defineProperty(globalThis,'location',originalLocation);else Reflect.deleteProperty(globalThis,'location');}
});
