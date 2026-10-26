import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p046AudioUrl,readP046SourceAudio} from '../src/nms-l02-p046-audio-loader-v1';
import {P046_AUDIO_PLANS} from '../src/generated/nms-l02-p046-audio-plan-v1';
import type {P046AudioDomain} from '../src/nms-l02-p046-audio-pcm-v1';
test('six bound exact source bodies pass; truncation, drift and redirect are rejected',async()=>{
  const originalFetch=globalThis.fetch,originalLocation=Object.getOwnPropertyDescriptor(globalThis,'location');
  Object.defineProperty(globalThis,'location',{configurable:true,value:{origin:'http://127.0.0.1:3450'}});
  try {
    for(const domain of Object.keys(P046_AUDIO_PLANS) as P046AudioDomain[]) {
      const path=`sprite-${domain}-source-stream-v1.mp3`;
      const body=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p046/audit/${path}`,import.meta.url));
      const plan=P046_AUDIO_PLANS[domain];
      const response=(bytes:Uint8Array,url:string)=>{
        const r=new Response(new Uint8Array(bytes),{headers:{'content-type':'audio/mpeg','content-length':String(plan.inputBytes)}});
        Object.defineProperty(r,'url',{value:url});return r;
      };
      globalThis.fetch=async(input,init)=>{assert.equal(init?.redirect,'error');return response(body,String(input));};
      assert.deepEqual(new Uint8Array(await readP046SourceAudio(domain,new AbortController().signal)),new Uint8Array(body));
      globalThis.fetch=async(input)=>response(body.subarray(1),String(input));
      await assert.rejects(readP046SourceAudio(domain,new AbortController().signal),/SIZE/);
      const drift=new Uint8Array(body);drift[0]^=1;
      globalThis.fetch=async(input)=>response(drift,String(input));
      await assert.rejects(readP046SourceAudio(domain,new AbortController().signal),/HASH/);
      const oversized=new Uint8Array(body.length+1);oversized.set(body);
      globalThis.fetch=async(input)=>response(oversized,String(input));
      await assert.rejects(readP046SourceAudio(domain,new AbortController().signal),/SIZE/);
      for(const [header,value] of [['content-type','text/html'],['content-length',String(plan.inputBytes+1)]]){
        globalThis.fetch=async(input)=>{const r=response(body,String(input));r.headers.set(header!,value!);return r;};
        await assert.rejects(readP046SourceAudio(domain,new AbortController().signal),/RESPONSE/);
      }
      globalThis.fetch=async()=>response(body,'https://example.invalid/redirect');
      await assert.rejects(readP046SourceAudio(domain,new AbortController().signal),/RESPONSE/);
    }
    const abort=new AbortController();abort.abort();await assert.rejects(readP046SourceAudio('205',abort.signal));
  }finally{globalThis.fetch=originalFetch;if(originalLocation)Object.defineProperty(globalThis,'location',originalLocation);else Reflect.deleteProperty(globalThis,'location');}
});
