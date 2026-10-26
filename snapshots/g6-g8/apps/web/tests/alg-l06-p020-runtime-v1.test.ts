import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P020_AUDIO_ASSETS} from '../../../packages/demos/src/alg-l06-p020-audio-schedule-v1';
import {P020_RESOURCE_PINS} from '../lib/alg-l06-p020-local-request-v1';
import {P020_GLOSSARY_ENTRY_ID,p020HostPlayback,p020LoadAudio}
 from '../components/g678-alg-l06-p020-runtime-v1';

const ORIGIN='http://127.0.0.1:3331';
function withWindow<T>(run:()=>Promise<T>):Promise<T>{
 const prior=Object.getOwnPropertyDescriptor(globalThis,'window');
 Object.defineProperty(globalThis,'window',{value:{location:{origin:ORIGIN}},
  configurable:true,writable:true});
 return run().finally(()=>{
  if(prior)Object.defineProperty(globalThis,'window',prior);
  else Reflect.deleteProperty(globalThis,'window');
 });
}
function exactResponse(bytes:number,url:string,options?:{mime?:string;length?:number;
 redirected?:boolean;url?:string}){
 const response=new Response(new Uint8Array(bytes),{headers:{
  'content-type':options?.mime??'audio/mpeg',
  'content-length':String(options?.length??bytes),
 }});
 Object.defineProperty(response,'url',{value:options?.url??url});
 if(options?.redirected)Object.defineProperty(response,'redirected',{value:true});
 return response;
}

test('P020 host binds only three existing dictionary keys and exact Canvas SHA',()=>{
 assert.deepEqual(P020_GLOSSARY_ENTRY_ID,{Input:'input',Function:'function',Output:'output'});
 const source=readFileSync('apps/web/components/g678-alg-l06-p020-runtime-v1.tsx','utf8');
 assert(source.includes(`const CANVAS_SHA256 = '${P020_RESOURCE_PINS['canvas-renderer.js'].sha256}'`));
 assert(source.includes("asset.metadata.deterministicContentTimeline.timelineId !== 'sprite-162'"));
});

test('eight domain loaders request exact unjoined source MP3s; SA is separate',async t=>{
 await withWindow(async()=>{
  assert.equal(P020_AUDIO_ASSETS.length,8);
  let requests=0;
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
   const url=new URL(String(input)),id=url.pathname.split('/').at(-1)!;
   const pin=P020_AUDIO_ASSETS.find(asset=>asset.id===id);
   assert(pin);
   requests++;
   assert.equal(String(input),`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p020/${id}?sha256=${pin.sourceSha256}`);
   assert.deepEqual([init?.credentials,init?.cache,init?.redirect],
    ['same-origin','no-store','error']);
   return exactResponse(pin.sourceBytes,String(input));
  });
  for(const pin of P020_AUDIO_ASSETS){
   const bytes=await p020LoadAudio(pin.id,new AbortController().signal);
   assert.equal(bytes.byteLength,pin.sourceBytes);
  }
  assert.equal(requests,8);
  assert(!new Set<string>(P020_AUDIO_ASSETS.map(asset=>asset.id))
   .has('optional-spanish-audio-v1'));
 });
});

test('P020 loader rejects redirect, wrong MIME, length, URL and unbound domain',async t=>{
 await withWindow(async()=>{
  const pin=P020_AUDIO_ASSETS[0];
  const expected=`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p020/${pin.id}?sha256=${pin.sourceSha256}`;
  for(const option of [{mime:'text/html'},{length:pin.sourceBytes+1},
   {redirected:true},{url:`${ORIGIN}/unexpected`}]){
   t.mock.method(globalThis,'fetch',async()=>exactResponse(pin.sourceBytes,expected,option));
   await assert.rejects(p020LoadAudio(pin.id,new AbortController().signal),
    /p020-domain-response-mismatch/);
   t.mock.restoreAll();
  }
  await assert.rejects(p020LoadAudio('missing' as typeof pin.id,
   new AbortController().signal),/p020-unknown-audio-domain/);
 });
});

test('P020 My Lesson keeps held quiz and eventual main frame 172',()=>{
 const sample={frame:172,phase:'timeline-ended',selectedAudio:'main',
  audio:{phase:'buffer-ended'},spanish:{phase:'idle'}} as Parameters<typeof p020HostPlayback>[0];
 const ended=p020HostPlayback(sample);
 assert.deepEqual([ended.frame,ended.frameCount,ended.frameDomain,ended.fps,
  ended.playbackProgress,ended.narration,ended.seekAvailable],
  [172,172,'sprite-162',12,1,'idle',false]);
 const held=p020HostPlayback({...sample,frame:58,phase:'quiz-held',
  audio:{phase:'paused'}} as Parameters<typeof p020HostPlayback>[0]);
 assert.equal(held.frame,58);
 const feedback=p020HostPlayback({...sample,frame:58,phase:'playing',
  audio:{phase:'playing'}} as Parameters<typeof p020HostPlayback>[0]);
 assert.equal(feedback.narration,'playing');
});
