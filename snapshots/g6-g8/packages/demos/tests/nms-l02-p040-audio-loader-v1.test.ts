import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync}from'node:fs';import{fileURLToPath}from'node:url';
import {readP040SourceAudio,p040AudioUrl}from'../src/nms-l02-p040-audio-loader-v1';
const bytes=readFileSync(fileURLToPath(new URL('../../../migrations/shared-nms002-l02-p040/audit/sprite-43-source-stream-v1.mp3',import.meta.url)));
test('exact source accepted; hash corruption, length drift, redirect and cancellation rejected',async()=>{
 const previousFetch=globalThis.fetch,descriptor=Object.getOwnPropertyDescriptor(globalThis,'location');Object.defineProperty(globalThis,'location',{configurable:true,value:{origin:'http://127.0.0.1:3460'}});
 let payload:Uint8Array=bytes,redirected=false,length=bytes.length;let calls=0;
 globalThis.fetch=async(_url,options)=>{calls++;assert.equal(options?.redirect,'error');const response=new Response(new Uint8Array(payload),{headers:{'content-type':'audio/mpeg','content-length':String(length)}});Object.defineProperty(response,'url',{value:'http://127.0.0.1:3460'+p040AudioUrl()});Object.defineProperty(response,'redirected',{value:redirected});return response;};
 try{
  assert.deepEqual(new Uint8Array(await readP040SourceAudio(new AbortController().signal)),new Uint8Array(bytes));
  payload=Uint8Array.from(bytes);payload[100]^=1;await assert.rejects(readP040SourceAudio(new AbortController().signal),/P040_AUDIO_HASH/);
  payload=bytes.subarray(1);await assert.rejects(readP040SourceAudio(new AbortController().signal),/P040_AUDIO_SIZE/);
  payload=bytes;redirected=true;await assert.rejects(readP040SourceAudio(new AbortController().signal),/P040_AUDIO_RESPONSE/);redirected=false;
  length=1;await assert.rejects(readP040SourceAudio(new AbortController().signal),/P040_AUDIO_RESPONSE/);
  const ac=new AbortController();ac.abort();const before=calls;await assert.rejects(readP040SourceAudio(ac.signal));assert.equal(calls,before);
 }finally{globalThis.fetch=previousFetch;if(descriptor)Object.defineProperty(globalThis,'location',descriptor);else Reflect.deleteProperty(globalThis,'location');}
});
