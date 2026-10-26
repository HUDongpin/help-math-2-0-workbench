import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P018_AUDIO_ASSETS} from '../../../packages/demos/src/alg-l06-p018-audio-schedule-v1';
import {P018_GLOSSARY_ENTRY_ID,p018HostPlayback,p018LoadMainAudio}
  from '../components/g678-alg-l06-p018-runtime-v1';

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

test('P018 five host glossary IDs match the source dictionary crosswalk',()=>{
  const audit=JSON.parse(readFileSync(
    'output/alg-l06-p018-glossary-audit-v1/five-term-crosswalk-v1.json','utf8'));
  assert.deepEqual(audit.entries.map((entry:{key:string;dictionary:{id:string}})=>
    [entry.key,entry.dictionary.id]),Object.entries(P018_GLOSSARY_ENTRY_ID));
  assert.deepEqual(Object.values(P018_GLOSSARY_ENTRY_ID),
    ['evaluate','input-variable','substitute','function','result']);
});

test('P018 main loader requests only its exact source stream and never SA',async t=>{
  await withWindow(async()=>{
    assert.equal(P018_AUDIO_ASSETS.length,1);
    const pin=P018_AUDIO_ASSETS[0];
    const expected=`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p018/main-1?sha256=${pin.sourceSha256}`;
    let requests=0;
    t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
      requests++;assert.equal(String(input),expected);
      assert.deepEqual([init?.credentials,init?.cache,init?.redirect],
        ['same-origin','no-store','error']);
      return exactResponse(pin.sourceBytes,expected);
    });
    const bytes=await p018LoadMainAudio('main-1',new AbortController().signal);
    assert.equal(bytes.byteLength,pin.sourceBytes);
    assert.equal(requests,1);
  });
});

test('P018 main loader rejects redirects, wrong MIME, length, URL and unbound IDs',async t=>{
  await withWindow(async()=>{
    const pin=P018_AUDIO_ASSETS[0];
    const expected=`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p018/main-1?sha256=${pin.sourceSha256}`;
    for(const option of [{mime:'text/html'},{length:pin.sourceBytes+1},
      {redirected:true},{url:`${ORIGIN}/unexpected`}]){
      t.mock.method(globalThis,'fetch',async()=>exactResponse(pin.sourceBytes,expected,option));
      await assert.rejects(p018LoadMainAudio('main-1',new AbortController().signal),
        /p018-main-response-mismatch/);
      t.mock.restoreAll();
    }
    await assert.rejects(p018LoadMainAudio('missing' as typeof pin.id,
      new AbortController().signal),/p018-unknown-audio-domain/);
  });
});

test('P018 My Lesson playback retains the source domain through natural frame 648',()=>{
  const sample={frame:648,phase:'timeline-ended',selectedAudio:'main',
    audio:{phase:'buffer-ended'},spanish:{phase:'idle'}} as Parameters<typeof p018HostPlayback>[0];
  const ended=p018HostPlayback(sample);
  assert.deepEqual([ended.frame,ended.frameCount,ended.frameDomain,ended.fps,
    ended.playbackProgress,ended.narration,ended.seekAvailable],
  [648,648,'sprite-32',12,1,'idle',false]);
  const main=p018HostPlayback({...sample,frame:324,phase:'playing',
    audio:{phase:'playing'}} as Parameters<typeof p018HostPlayback>[0]);
  assert.equal(main.narration,'playing');
  const spanish=p018HostPlayback({...sample,selectedAudio:'spanish',
    spanish:{phase:'playing'}} as Parameters<typeof p018HostPlayback>[0]);
  assert.equal(spanish.narration,'playing');
});
