import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {P052_AUDIO_PLANS,P052_AUDIO_WINDOWS} from '../src/generated/nms-l02-p052-runtime-audio-v1';
import {p052PrepareSourcePcm} from '../src/nms-l02-p052-audio-pcm-v1';
import {p052AudioUrl,readP052SourceAudio,p052DecodeAudio,createP052AudioLoader} from '../src/nms-l02-p052-audio-loader-v1';
const audit=new URL('../../../migrations/shared-nms002-l02-p052/audit/',import.meta.url);
const bytes=(domain:string)=>Uint8Array.from(fs.readFileSync(new URL(`${domain}-source-stream-v1.mp3`,audit)));
function pcm(domain:string){const b=fs.readFileSync(new URL(`${domain}-source-pcm-v1.f32le`,audit));return Float32Array.from({length:b.length/4},(_,i)=>b.readFloatLE(i*4));}
test('all six runtime PCM plans preserve every source sample and authored gap',()=>{
 for(const [domain,plan]of Object.entries(P052_AUDIO_PLANS)){
  const input=pcm(domain),output=p052PrepareSourcePcm(domain,input);let end=0,total=0;
  assert.equal(output.length,plan.totalSamples);
  for(const s of plan.segments){
   assert.ok(output.subarray(end,s.outputStart).every(n=>n===0));
   assert.deepEqual(output.subarray(s.outputStart,s.outputEnd),input.subarray(s.sourceStart,s.sourceEnd));
   end=s.outputEnd;total+=s.sourceEnd-s.sourceStart;
  }
  assert.equal(total,input.length-1673);assert.equal(end,output.length);
 }
 assert.equal(P052_AUDIO_PLANS['sprite-350'].sourceSampleCountMismatch,576);
 assert.equal(P052_AUDIO_PLANS['sprite-350'].frame102ReplacementSamples,0);
 assert.equal(P052_AUDIO_WINDOWS.intro.endSample,P052_AUDIO_WINDOWS.outro.startSample);
 assert.equal(P052_AUDIO_WINDOWS.outro.endSample,285666);
 assert.throws(()=>p052PrepareSourcePcm('__proto__',new Float32Array()),/DOMAIN/);
 assert.throws(()=>p052PrepareSourcePcm('sprite-8',new Float32Array(8640)),/SILENT/);
 const bad=pcm('sprite-8');bad[500]=NaN;assert.throws(()=>p052PrepareSourcePcm('sprite-8',bad),/NONFINITE/);
});
function install(t:any){
 const oldLocation=Object.getOwnPropertyDescriptor(globalThis,'location');
 const oldDecoder=Object.getOwnPropertyDescriptor(globalThis,'OfflineAudioContext');
 Object.defineProperty(globalThis,'location',{configurable:true,value:new URL('http://127.0.0.1:3231')});
 t.after(()=>{
  if(oldLocation)Object.defineProperty(globalThis,'location',oldLocation);else Reflect.deleteProperty(globalThis,'location');
  if(oldDecoder)Object.defineProperty(globalThis,'OfflineAudioContext',oldDecoder);else Reflect.deleteProperty(globalThis,'OfflineAudioContext');
 });
 let calls=0,decodes=0,cancelled=0,transform=(b:Uint8Array)=>b;
 let wrongMime=false,wrongRate=false;
 t.mock.method(globalThis,'fetch',async(input:URL,options:RequestInit)=>{
  calls++;assert.equal(options.redirect,'error');assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');
  const domain=input.pathname.split('/').at(-1)!;const raw=bytes(domain),data=transform(raw);
  const response=new Response(new ReadableStream({start(controller){controller.enqueue(data);controller.close();},cancel(){cancelled++;}}),
   {headers:{'content-type':wrongMime?'text/html':'audio/mpeg','content-length':String(raw.length)}});
  Object.defineProperty(response,'url',{value:input.href});return response;
 });
 Object.defineProperty(globalThis,'OfflineAudioContext',{configurable:true,value:class {
  constructor(channels:number,length:number,rate:number){assert.deepEqual([channels,length,rate],[1,1,22050]);}
  async decodeAudioData(encoded:ArrayBuffer){
   decodes++;const domain=Object.keys(P052_AUDIO_PLANS).find(id=>bytes(id).length===encoded.byteLength)!;
   assert.deepEqual(new Uint8Array(encoded),bytes(domain));const samples=pcm(domain);
   return {length:samples.length,numberOfChannels:1,sampleRate:wrongRate?48000:22050,getChannelData:()=>samples};
  }
 }});
 const context={createBuffer(channels:number,length:number,rate:number){
  return {numberOfChannels:channels,length,sampleRate:rate,samples:new Float32Array(length),copyToChannel(samples:Float32Array,channel:number){assert.equal(channel,0);this.samples.set(samples);}};
 }} as unknown as BaseAudioContext;
 return {context,calls:()=>calls,decodes:()=>decodes,cancelled:()=>cancelled,
  transform:(fn:typeof transform)=>{transform=fn;},wrongMime:()=>{wrongMime=true;},wrongRate:()=>{wrongRate=true;}};
}
test('whole source bytes validate, decode once and cache only per owned context',async t=>{
 const h=install(t),load=createP052AudioLoader(),signal=new AbortController().signal;
 for(const domain of Object.keys(P052_AUDIO_PLANS)){
  const first=await load(h.context,domain,signal),second=await load(h.context,domain,signal);
  assert.equal(first,second);assert.deepEqual((first as any).samples,p052PrepareSourcePcm(domain,pcm(domain)));
 }
 assert.equal(h.calls(),6);assert.equal(h.decodes(),6);
 const aborted=new AbortController();aborted.abort();
 await assert.rejects(load(h.context,'sprite-8',aborted.signal),{name:'AbortError'});
 assert.equal(h.calls(),6);
});
test('rejects wrong MIME, unknown domain and nonlocal origins before decode',async t=>{
 const h=install(t),signal=new AbortController().signal;h.wrongMime();
 await assert.rejects(readP052SourceAudio('sprite-8',signal),/RESPONSE/);assert.equal(h.decodes(),0);
 assert.throws(()=>p052AudioUrl('constructor'),/DOMAIN/);
 Object.defineProperty(globalThis,'location',{configurable:true,value:new URL('https://example.com')});
 await assert.rejects(readP052SourceAudio('sprite-8',signal),/LOCAL_ONLY/);assert.equal(h.calls(),1);
});
test('rejects truncated, oversized and same-length mutated bodies, allows retry',async t=>{
 const h=install(t),load=createP052AudioLoader(),signal=new AbortController().signal;
 for(const [transform,error]of [
  [(b:Uint8Array)=>b.slice(1),/SIZE/],
  [(b:Uint8Array)=>new Uint8Array(b.length+1),/SIZE/],
  [(b:Uint8Array)=>{b[10]^=1;return b;},/HASH/],
 ] as const){h.transform(transform);await assert.rejects(load(h.context,'sprite-8',signal),error);}
 assert.equal(h.decodes(),0);h.transform(b=>b);await load(h.context,'sprite-8',signal);assert.equal(h.decodes(),1);
});
test('decoder rejects encoded hash drift and source-rate drift',async t=>{
 const h=install(t),signal=new AbortController().signal,encoded=bytes('sprite-350');encoded[10]^=1;
 await assert.rejects(p052DecodeAudio(h.context,'sprite-350',encoded.buffer,signal),/HASH/);assert.equal(h.decodes(),0);
 h.wrongRate();await assert.rejects(p052DecodeAudio(h.context,'sprite-350',bytes('sprite-350').buffer,signal),/DECODE/);
});
test('abort during uninterruptible decode prevents a cached result and retries cleanly',async t=>{
 const h=install(t),load=createP052AudioLoader(),abort=new AbortController();
 const Decoder=globalThis.OfflineAudioContext;let release!:()=>void,entered!:()=>void;
 const gate=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
 Object.defineProperty(globalThis,'OfflineAudioContext',{configurable:true,value:class extends Decoder {
  async decodeAudioData(encoded:ArrayBuffer){entered();await gate;return super.decodeAudioData(encoded);}
 }});
 const pending=load(h.context,'sprite-350',abort.signal);await started;abort.abort();release();
 await assert.rejects(pending,{name:'AbortError'});
 await load(h.context,'sprite-350',new AbortController().signal);
 assert.equal(h.calls(),2);assert.equal(h.decodes(),2);
});
