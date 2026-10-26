import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import plan from '../../../migrations/shared-alg001-l06-p035/audio-source-v1/source-audio-plan-v1.json';
import {P035_MEASURED_BINDINGS,type P035MeasuredDomainId}
 from './alg-l06-p035-measured-bindings-v1';
import {P035MeasuredAudioIntegrationV1,type P035MeasuredAudioOptions}
 from './alg-l06-p035-measured-audio-v1';
import type {P035Transport}
 from './alg-l06-p035-audio-owner-v1';
import type {DecodedSourceStreamBinding,DecodedStreamPhase,DecodedSourceStreamTransport}
 from './decoded-source-stream-transport';

const root='/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/';
const IDS=['main','sa',80,95,126,154,195,207] as const;
const yes=(reason:string)=>({accepted:true,reason});
class FakeTransport{
 phase:DecodedStreamPhase='idle';epoch=0;cursor=0;
 prepared=0;played=0;paused=0;replayed=0;closed=0;
 volume=1;volumeSets=0;
 listeners=new Set<()=>void>();
 constructor(readonly binding:DecodedSourceStreamBinding){}
 subscribe(fn:()=>void){this.listeners.add(fn);return ()=>this.listeners.delete(fn);}
 emit(){for(const fn of this.listeners)fn();}
 snapshot(){return {phase:this.phase,epoch:this.epoch,decodedSample:this.cursor,
  contextTime:null,heldContextTime:null,playbackAnchor:null,
  elapsedMs:0,volume:this.volume,failure:null,sourceAlignment:'unresolved' as const,
  lessonCompleted:false as const};}
 async prepare(bytes:ArrayBuffer){assert.equal(bytes.byteLength,this.binding.sourceBytes);
  this.prepared++;this.phase='ready';this.epoch++;this.emit();return yes('ready');}
 async play(){this.played++;this.phase='playing';this.epoch++;this.emit();return yes('playing');}
 pause(){this.paused++;this.cursor+=7;this.phase='paused';this.epoch++;this.emit();
  return yes('paused');}
 replay(){this.replayed++;this.cursor=0;this.phase=this.prepared?'ready':'idle';
  this.epoch++;this.emit();return yes('ready');}
 async close(){this.closed++;this.phase='closed';this.epoch++;this.emit();this.listeners.clear();}
 setVolume(volume:number){if(this.phase==='closed'||volume<0||volume>1)
  return {accepted:false,reason:'invalid-volume'};
  this.volume=volume;this.volumeSets++;this.emit();return yes('volume-set');}
}
function pin(id:P035MeasuredDomainId){
 return id==='sa'?plan.separateSupplemental:
  plan.domains.find(row=>row.characterId===(id==='main'?227:id))!.transportAsset;
}
function source(id:P035MeasuredDomainId):ArrayBuffer{
 const p=pin(id),bytes=readFileSync(p.path.startsWith('/')?p.path:root+p.path);
 return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
}
function setup(overrides:Partial<P035MeasuredAudioOptions>={}){
 let now=0;
 const transports=new Map<P035MeasuredDomainId,FakeTransport>();
 const sourceUrls=Object.fromEntries(IDS.map(id=>[id,`/asset/${id}`])) as
  Record<P035MeasuredDomainId,string>;
 let mutate:(id:P035MeasuredDomainId,bytes:ArrayBuffer)=>ArrayBuffer=(_id,bytes)=>bytes;
 let shorten=false;
 const fetchSource=async(input:RequestInfo|URL,init?:RequestInit):Promise<Response>=>{
  const url=new URL(String(input));
  const id=IDS.find(value=>url.pathname===`/asset/${value}`);
  if(id===undefined)throw Error('unlisted-request');
  if(init?.redirect!=='error'||init?.method!=='GET'||init?.cache!=='no-store')
   throw Error('unbounded-request');
  let bytes=mutate(id,source(id));
  if(shorten)bytes=bytes.slice(0,-1);
  const response=new Response(bytes,{status:200,headers:{
   'content-length':String(pin(id).bytes),
   'content-type':id===207?'audio/wav':'audio/mpeg'}});
  Object.defineProperty(response,'url',{value:url.href});
  return response;
 };
 const options:P035MeasuredAudioOptions={nowSeconds:()=>now,
  commitMain:()=>true,commitFeedback:()=>true,
  baseUrl:'http://127.0.0.1:3367/',sourceUrls,
  fetchSource:fetchSource as typeof fetch,
  createTransport:(id,binding)=>{
   assert.deepEqual(binding,P035_MEASURED_BINDINGS[id]);
   const fake=new FakeTransport(binding);transports.set(id,fake);
   return fake as P035Transport & Pick<DecodedSourceStreamTransport,'setVolume'>;
  },...overrides};
 return {options,transports,setNow:(value:number)=>{now=value;},
  corrupt:(fn:typeof mutate)=>{mutate=fn;},shorten:()=>{shorten=true;}};
}

test('browser fetch keeps the global receiver for injected and default functions',async()=>{
 const s=setup(),delegate=s.options.fetchSource!;
 let calls=0;
 const browserFetch=function(this:unknown,input:RequestInfo|URL,
  init?:RequestInit):Promise<Response>{
  assert.equal(this,globalThis);
  calls++;
  return delegate(input,init);
 } as typeof fetch;
 const injected=await P035MeasuredAudioIntegrationV1.create({
  ...s.options,fetchSource:browserFetch});
 try{
  assert.equal((await injected.prepare('main')).accepted,true);
  assert.equal(calls,1);
 }finally{await injected.close();}

 const priorFetch=globalThis.fetch;
 globalThis.fetch=browserFetch;
 try{
  const fallback=await P035MeasuredAudioIntegrationV1.create({
   ...s.options,fetchSource:undefined});
  try{
   assert.equal((await fallback.prepare('sa')).accepted,true);
   assert.equal(calls,2);
  }finally{await fallback.close();}
 }finally{globalThis.fetch=priorFetch;}
});

test('eight exact root-readback browser bindings and source bytes prepare once',async()=>{
 const s=setup(),owner=await P035MeasuredAudioIntegrationV1.create(s.options);
 for(const id of IDS){
  assert.equal(P035_MEASURED_BINDINGS[id].sourceBytes,pin(id).bytes);
  assert.equal(P035_MEASURED_BINDINGS[id].sourceSha256,pin(id).sha256);
  assert.equal((await owner.prepare(id)).accepted,true);
  assert.equal(s.transports.get(id)!.prepared,1);
 }
 assert.deepEqual([P035_MEASURED_BINDINGS[207].sampleRate,
  P035_MEASURED_BINDINGS[207].decodedSamples],[22050,23922]);
 assert.equal(P035_MEASURED_BINDINGS.main.decodedSamples,958464);
 assert.equal(P035_MEASURED_BINDINGS.sa.decodedSamples,448128);
 assert.equal((await owner.prepare(179 as P035MeasuredDomainId)).accepted,false);
 assert.equal((await owner.prepare('main')).accepted,false);
 await owner.close();
 assert.equal([...s.transports.values()].every(t=>t.closed===1),true);
});

test('My Lesson volume applies to every domain before preparation and after Replay',async()=>{
 const s=setup(),owner=await P035MeasuredAudioIntegrationV1.create(s.options);
 assert.equal(owner.setVolume(.35).accepted,true);
 assert.equal([...s.transports.values()].every(t=>t.volume===.35&&t.volumeSets===1),true);
 assert.equal((await owner.prepare('sa')).accepted,true);
 assert.equal(s.transports.get('sa')!.snapshot().volume,.35);
 owner.replay();
 assert.equal(owner.setVolume(.7).accepted,true);
 assert.equal([...s.transports.values()].every(t=>t.volume===.7&&t.volumeSets===2),true);
 assert.equal(owner.setVolume(-.1).accepted,false);
 assert.equal([...s.transports.values()].every(t=>t.volume===.7),true);
 await owner.close();
 assert.equal(owner.setVolume(.4).accepted,false);
});

test('bounded GET rejects drifted SHA and premature EOF before transport prepare',async()=>{
 const s=setup(),owner=await P035MeasuredAudioIntegrationV1.create(s.options);
 s.corrupt((_id,buffer)=>{const copy=buffer.slice(0);new Uint8Array(copy)[0]^=1;return copy;});
 assert.equal((await owner.prepare('main')).reason,'P035_SOURCE_SHA256_MISMATCH');
 assert.equal(s.transports.get('main')!.prepared,0);
 s.corrupt((_id,buffer)=>buffer);s.shorten();
 assert.equal((await owner.prepare('main')).reason,'P035_SOURCE_HTTP_EARLY_EOF');
 assert.equal(s.transports.get('main')!.prepared,0);
 await owner.close();
});

test('Replay aborts pending source GET and prevents stale prepare',async()=>{
 const s=setup();let aborted=false;
 const deferred=((_input:RequestInfo|URL,init?:RequestInit)=>
  new Promise<Response>((_resolve,reject)=>{
   init?.signal?.addEventListener('abort',()=>{aborted=true;
    reject(new DOMException('aborted','AbortError'));},{once:true});
  })) as typeof fetch;
 const owner=await P035MeasuredAudioIntegrationV1.create({...s.options,fetchSource:deferred});
 const pending=owner.prepare('main');
 assert.equal(owner.replay().accepted,true);
 assert.equal((await pending).reason,'stale-source-load');
 assert.equal(aborted,true);
 assert.equal(s.transports.get('main')!.prepared,0);
 await owner.close();
});

test('constructor failures close every transport already made',async()=>{
 const s=setup();
 await assert.rejects(P035MeasuredAudioIntegrationV1.create({
  ...s.options,commitMain:()=>false}),/P035_INITIAL_CANVAS_FRAME_NOT_COMMITTED/);
 assert.equal(s.transports.size,8);
 assert.equal([...s.transports.values()].every(t=>t.closed===1),true);
 const partial=setup();
 await assert.rejects(P035MeasuredAudioIntegrationV1.create({...partial.options,
  createTransport:(id,binding)=>{
   if(id===80)throw Error('test-factory-failure');
   const fake=new FakeTransport(binding);partial.transports.set(id,fake);
   return fake as P035Transport & Pick<DecodedSourceStreamTransport,'setVolume'>;
  }}),/test-factory-failure/);
 assert.equal(partial.transports.size,2);
 assert.equal([...partial.transports.values()].every(t=>t.closed===1),true);
});

test('main, feedback, and explicit SA never own audio simultaneously; subscribe sees changes',async()=>{
 const s=setup(),owner=await P035MeasuredAudioIntegrationV1.create(s.options);
 let notices=0;const unsubscribe=owner.subscribe(()=>{notices++;});
 for(const id of ['main',80,'sa'] as const)assert.equal((await owner.prepare(id)).accepted,true);
 assert.equal((await owner.playMain({activation:'user'})).accepted,true);
 s.setNow(1);await owner.tick();
 assert.equal(owner.snapshot().activeOwner,'main');
 s.setNow(12);await owner.tick();
 assert.equal(owner.snapshot().activeOwner,'none');
 assert.equal(owner.choose('A').accepted,true);
 assert.equal((await owner.resolveFeedback(80,{activation:'user'})).accepted,true);
 s.setNow(12+1/12);await owner.tick();
 assert.equal(owner.snapshot().activeOwner,'feedback');
 assert.equal((await owner.startSupplemental({activation:'user'})).accepted,false);
 assert.equal(owner.replay().accepted,true);
 assert.equal((await owner.startSupplemental({activation:'user'})).accepted,true);
 assert.equal(owner.snapshot().activeOwner,'sa');
 assert.equal(s.transports.get('main')!.phase==='playing',false);
 assert.equal(s.transports.get(80)!.phase==='playing',false);
 assert.equal(owner.returnSupplemental().accepted,true);
 assert.equal(owner.snapshot().activeOwner,'none');
 assert.equal(notices>0,true);unsubscribe();
 await owner.close();
 assert.equal([...s.transports.values()].every(t=>t.closed===1),true);
});

test('close aborts pending source GET and makes later prepare unavailable',async()=>{
 const s=setup();let aborted=false;
 const deferred=((_input:RequestInfo|URL,init?:RequestInit)=>
  new Promise<Response>((_resolve,reject)=>{
   init?.signal?.addEventListener('abort',()=>{aborted=true;
    reject(new DOMException('aborted','AbortError'));},{once:true});
  })) as typeof fetch;
 const owner=await P035MeasuredAudioIntegrationV1.create({...s.options,fetchSource:deferred});
 const pending=owner.prepare('main');
 await owner.close();
 assert.equal(aborted,true);
 assert.equal((await pending).reason,'stale-source-load');
 assert.equal((await owner.prepare('main')).accepted,false);
 assert.equal([...s.transports.values()].every(t=>t.closed===1),true);
});

test('default factory constructs all measured maintained transports lazily',async()=>{
 const s=setup();
 const owner=await P035MeasuredAudioIntegrationV1.create({
  ...s.options,createTransport:undefined});
 assert.equal(owner.snapshot().mainAudio.phase,'idle');
 assert.equal(owner.snapshot().supplementalAudio.phase,'idle');
 assert.equal(owner.snapshot().lessonCompleted,false);
 await owner.close();
 assert.equal(owner.snapshot().phase,'closed');
});


test('stale Replay fetch cleanup cannot erase the new pending owner or its close cancellation',async()=>{
 const s=setup();const calls:{signal:AbortSignal;reject:(e:Error)=>void}[]=[];
 const deferred=((_input:RequestInfo|URL,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{
  const signal=init?.signal as AbortSignal;calls.push({signal,reject});
 })) as typeof fetch;
 const owner=await P035MeasuredAudioIntegrationV1.create({...s.options,fetchSource:deferred});
 const old=owner.prepare('main');owner.replay();assert.equal(calls[0].signal.aborted,true);
 const fresh=owner.prepare('main');assert.equal(calls.length,2);
 calls[0].reject(new DOMException('old-abort','AbortError'));assert.equal((await old).reason,'stale-source-load');
 const duplicate=owner.prepare('main');
 if(calls.length!==2){calls[2].reject(new Error('cleanup'));calls[1].reject(new Error('cleanup'));await fresh;await duplicate;await owner.close();assert.fail('old finally erased current pending source owner');}
 assert.equal((await duplicate).reason,'measured-prepare-unavailable');
 await owner.close();assert.equal(calls[1].signal.aborted,true);calls[1].reject(new DOMException('closed','AbortError'));assert.equal((await fresh).reason,'stale-source-load');
});
