import test from 'node:test';import assert from 'node:assert/strict';
import {p040DecodeAudio}from'../src/nms-l02-p040-audio-decode-v1';
test('aborting a pending decode prevents prepared buffer creation',async()=>{
 let resolve!:(value:AudioBuffer)=>void,created=0;
 const context={sampleRate:22050,decodeAudioData:()=>new Promise<AudioBuffer>(r=>{resolve=r}),createBuffer:()=>{created++;throw Error('unexpected')}} as unknown as BaseAudioContext;
 const controller=new AbortController();const pending=p040DecodeAudio(context,new ArrayBuffer(1),controller.signal);controller.abort();resolve({}as AudioBuffer);await assert.rejects(pending);assert.equal(created,0);
});
test('wrong sample rate rejected before decode starts',async()=>{
 let decoded=false;const context={sampleRate:48000,decodeAudioData:()=>{decoded=true}}as unknown as BaseAudioContext;
 await assert.rejects(p040DecodeAudio(context,new ArrayBuffer(1),new AbortController().signal),/P040_AUDIO_RATE/);assert.equal(decoded,false);
});
