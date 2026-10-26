import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P019_AUDIO_ASSETS} from '../../../packages/demos/src/alg-l06-p019-audio-schedule-v1';
import {P019_GLOSSARY_ENTRY_ID,p019HostPlayback,p019LoadMainAudio}
  from '../components/g678-alg-l06-p019-runtime-v1';

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

test('P019 six host glossary IDs match the source dictionary crosswalk',()=>{
  const audit=JSON.parse(readFileSync(
    'output/alg-l06-p019-glossary-audit-v1/six-term-crosswalk-v1.json','utf8'));
  assert.deepEqual(audit.entries.map((entry:{key:string;dictionary:{id:string}})=>
    [entry.key,entry.dictionary.id]),Object.entries(P019_GLOSSARY_ENTRY_ID));
  assert.deepEqual(Object.values(P019_GLOSSARY_ENTRY_ID),
    ['function-table','input','pair','table','output','function']);
});

test('P019 main loader requests only its exact source stream and never SA',async t=>{
  await withWindow(async()=>{
    assert.equal(P019_AUDIO_ASSETS.length,1);
    const pin=P019_AUDIO_ASSETS[0];
    const expected=`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p019/main-1?sha256=${pin.sourceSha256}`;
    let requests=0;
    t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
      requests++;assert.equal(String(input),expected);
      assert.deepEqual([init?.credentials,init?.cache,init?.redirect],
        ['same-origin','no-store','error']);
      return exactResponse(pin.sourceBytes,expected);
    });
    const bytes=await p019LoadMainAudio('main-1',new AbortController().signal);
    assert.equal(bytes.byteLength,pin.sourceBytes);
    assert.equal(requests,1);
  });
});

test('P019 main loader rejects redirects, wrong MIME, length, URL and unbound IDs',async t=>{
  await withWindow(async()=>{
    const pin=P019_AUDIO_ASSETS[0];
    const expected=`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p019/main-1?sha256=${pin.sourceSha256}`;
    for(const option of [{mime:'text/html'},{length:pin.sourceBytes+1},
      {redirected:true},{url:`${ORIGIN}/unexpected`}]){
      t.mock.method(globalThis,'fetch',async()=>exactResponse(pin.sourceBytes,expected,option));
      await assert.rejects(p019LoadMainAudio('main-1',new AbortController().signal),
        /p019-main-response-mismatch/);
      t.mock.restoreAll();
    }
    await assert.rejects(p019LoadMainAudio('missing' as typeof pin.id,
      new AbortController().signal),/p019-unknown-audio-domain/);
  });
});

test('P019 My Lesson playback retains the source domain through natural frame 351',()=>{
  const sample={frame:351,phase:'timeline-ended',selectedAudio:'main',
    audio:{phase:'buffer-ended'},spanish:{phase:'idle'}} as Parameters<typeof p019HostPlayback>[0];
  const ended=p019HostPlayback(sample);
  assert.deepEqual([ended.frame,ended.frameCount,ended.frameDomain,ended.fps,
    ended.playbackProgress,ended.narration,ended.seekAvailable],
  [351,351,'sprite-37',12,1,'idle',false]);
  const main=p019HostPlayback({...sample,frame:324,phase:'playing',
    audio:{phase:'playing'}} as Parameters<typeof p019HostPlayback>[0]);
  assert.equal(main.narration,'playing');
  const spanish=p019HostPlayback({...sample,selectedAudio:'spanish',
    spanish:{phase:'playing'}} as Parameters<typeof p019HostPlayback>[0]);
  assert.equal(spanish.narration,'playing');
});
