import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p047DecodeAudio} from '../src/nms-l02-p047-audio-decode-v1';
import {p047PrepareSourcePcm,type P047AudioDomain} from '../src/nms-l02-p047-audio-pcm-v1';
import {P047_AUDIO_PLANS} from '../src/generated/nms-l02-p047-audio-plan-v1';
/** This decoder stand-in tests orchestration/validation, not browser MP3 decode. */
test('decode validates complete source before decoding and copies exact prepared PCM',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'OfflineAudioContext');
 try {
  for(const domain of Object.keys(P047_AUDIO_PLANS)as P047AudioDomain[]){
   const plan=P047_AUDIO_PLANS[domain],source=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p047/audit/sprite-${domain}-source-stream-v1.mp3`,import.meta.url));
   const raw=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p047/audit/sprite-${domain}-source-pcm-v1.f32le`,import.meta.url));
   const pcm=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));const encoded=Uint8Array.from(source).buffer;
   let calls=0,allocations=0,copied:Float32Array|undefined,mode='valid';let abort:AbortController|undefined;
   class Decoder {
    constructor(channels:number,length:number,rate:number){assert.equal(channels,1);assert.equal(length,1);assert.equal(rate,22050);}
    async decodeAudioData(input:ArrayBuffer){calls++;assert.notEqual(input,encoded);assert.deepEqual(new Uint8Array(input),new Uint8Array(encoded));abort?.abort();
     return {numberOfChannels:mode==='channels'?2:1,sampleRate:mode==='rate'?48000:22050,length:mode==='length'?pcm.length-1:pcm.length,getChannelData:()=>pcm};
    }
   }
   Object.defineProperty(globalThis,'OfflineAudioContext',{configurable:true,value:Decoder});
   const context={createBuffer(channels:number,length:number,rate:number){allocations++;assert.equal(channels,1);assert.equal(length,plan.totalSamples);assert.equal(rate,22050);return {copyToChannel(samples:Float32Array,channel:number){assert.equal(channel,0);copied=samples;}};}} as unknown as BaseAudioContext;
   await p047DecodeAudio(context,domain,encoded,new AbortController().signal);assert.deepEqual(copied,p047PrepareSourcePcm(domain,pcm));assert.equal(calls,1);assert.equal(allocations,1);
   const corrupt=encoded.slice(0);new Uint8Array(corrupt)[0]^=1;await assert.rejects(p047DecodeAudio(context,domain,corrupt,new AbortController().signal),/HASH/);assert.equal(calls,1);
   await assert.rejects(p047DecodeAudio(context,domain,encoded.slice(1),new AbortController().signal),/INPUT/);assert.equal(calls,1);
   for(mode of ['channels','rate','length'])await assert.rejects(p047DecodeAudio(context,domain,encoded,new AbortController().signal),/DECODE/);
   assert.equal(allocations,1);mode='valid';abort=new AbortController();await assert.rejects(p047DecodeAudio(context,domain,encoded,abort.signal),/abort/i);assert.equal(allocations,1);
  }
 }finally{if(original)Object.defineProperty(globalThis,'OfflineAudioContext',original);else Reflect.deleteProperty(globalThis,'OfflineAudioContext');}
});
