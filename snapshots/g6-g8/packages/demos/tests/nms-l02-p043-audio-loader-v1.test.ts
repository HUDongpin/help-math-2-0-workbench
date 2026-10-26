import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p043AudioUrl,readP043SourceAudio} from '../src/nms-l02-p043-audio-loader-v1';
import {P043_AUDIO_PLANS} from '../src/generated/nms-l02-p043-audio-plan-v1';
import type {P043AudioDomain} from '../src/nms-l02-p043-audio-pcm-v1';
test('eight bound exact source bodies pass; unbound247, truncation, drift and redirect are rejected',async()=>{
  const originalFetch=globalThis.fetch,originalLocation=Object.getOwnPropertyDescriptor(globalThis,'location');
  Object.defineProperty(globalThis,'location',{configurable:true,value:{origin:'http://127.0.0.1:3450'}});
  try {
    for(const domain of Object.keys(P043_AUDIO_PLANS) as P043AudioDomain[]) {
      if(domain==='247'){assert.throws(()=>p043AudioUrl(domain),/UNBOUND/);continue;}
      const path=domain==='183'?'adpcm-decoded-v1/-1.wav':`sprite-${domain}-source-stream-v1.mp3`;
      const body=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p043/audit/${path}`,import.meta.url));
      const plan=P043_AUDIO_PLANS[domain];
      const response=(bytes:Uint8Array,url:string)=>{
        const r=new Response(new Uint8Array(bytes),{headers:{'content-type':domain==='183'?'audio/wav':'audio/mpeg','content-length':String(plan.inputBytes)}});
        Object.defineProperty(r,'url',{value:url});return r;
      };
      globalThis.fetch=async(input,init)=>{assert.equal(init?.redirect,'error');return response(body,String(input));};
      assert.deepEqual(new Uint8Array(await readP043SourceAudio(domain,new AbortController().signal)),new Uint8Array(body));
      globalThis.fetch=async(input)=>response(body.subarray(1),String(input));
      await assert.rejects(readP043SourceAudio(domain,new AbortController().signal),/SIZE/);
      const drift=new Uint8Array(body);drift[0]^=1;
      globalThis.fetch=async(input)=>response(drift,String(input));
      await assert.rejects(readP043SourceAudio(domain,new AbortController().signal),/HASH/);
      globalThis.fetch=async()=>response(body,'https://example.invalid/redirect');
      await assert.rejects(readP043SourceAudio(domain,new AbortController().signal),/RESPONSE/);
    }
    const abort=new AbortController();abort.abort();await assert.rejects(readP043SourceAudio('250',abort.signal));
  }finally{globalThis.fetch=originalFetch;if(originalLocation)Object.defineProperty(globalThis,'location',originalLocation);else Reflect.deleteProperty(globalThis,'location');}
});
