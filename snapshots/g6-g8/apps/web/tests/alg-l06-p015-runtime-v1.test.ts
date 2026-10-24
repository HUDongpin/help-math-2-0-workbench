import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P015_AUDIO_ASSETS} from '../../../packages/demos/src/alg-l06-p015-audio-schedule-v1';
import {P015_GLOSSARY_ENTRY_ID,p015HostPlayback,p015LoadMainAudio}
  from '../components/g678-alg-l06-p015-runtime-v1';

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
function exactResponse(bytes:number,url:string,options?:{mime?:string;length?:number;redirected?:boolean;url?:string}){
  const response=new Response(new Uint8Array(bytes),{headers:{
    'content-type':options?.mime??'audio/mpeg',
    'content-length':String(options?.length??bytes),
  }});
  Object.defineProperty(response,'url',{value:options?.url??url});
  if(options?.redirected)Object.defineProperty(response,'redirected',{value:true});
  return response;
}

test('P015 six host glossary IDs match the source crosswalk exactly',()=>{
  const audit=JSON.parse(readFileSync(
    'migrations/shared-alg001-l06-p015/audit/glossary-v1/six-term-crosswalk-v1.json','utf8'));
  assert.deepEqual(audit.sourceButtons.map((button:{sourceKeyAttribute:string;entryId:string})=>
    [button.sourceKeyAttribute,button.entryId]),Object.entries(P015_GLOSSARY_ENTRY_ID));
  assert.deepEqual(Object.values(P015_GLOSSARY_ENTRY_ID),
    ['function','value','relation','rule','input','output']);
});

test('P015 main loader requests four separate exact pinned audio resources',async t=>{
  await withWindow(async()=>{
    const seen:string[]=[];
    t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
      const url=String(input);
      seen.push(url);
      const pin=P015_AUDIO_ASSETS.find(asset=>url.endsWith(
        `/${asset.id}?sha256=${asset.sourceSha256}`));
      assert(pin,'only exact P015 main asset IDs are fetched');
      assert.deepEqual([init?.credentials,init?.cache,init?.redirect],
        ['same-origin','no-store','error']);
      return exactResponse(pin.sourceBytes,url);
    });
    for(const pin of P015_AUDIO_ASSETS){
      const bytes=await p015LoadMainAudio(pin.id,new AbortController().signal);
      assert.equal(bytes.byteLength,pin.sourceBytes);
      assert(seen.at(-1)?.startsWith(`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p015/`));
    }
    assert.deepEqual(seen.map(url=>new URL(url).pathname.split('/').at(-1)),
      ['main-1','main-2','main-3','main-4']);
    assert(!seen.some(url=>url.includes('optional-spanish-audio')),
      'mount-time main loading never requests separate SA');
  });
});

test('P015 main loader rejects response identity, MIME, length and unbound IDs',async t=>{
  await withWindow(async()=>{
    const pin=P015_AUDIO_ASSETS[0];
    const expected=`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p015/${pin.id}?sha256=${pin.sourceSha256}`;
    for(const option of [{mime:'text/html'},{length:pin.sourceBytes+1},
      {redirected:true},{url:`${ORIGIN}/unexpected`}]){
      t.mock.method(globalThis,'fetch',async()=>exactResponse(pin.sourceBytes,expected,option));
      await assert.rejects(p015LoadMainAudio(pin.id,new AbortController().signal),
        /p015-main-response-mismatch/);
      t.mock.restoreAll();
    }
    await assert.rejects(p015LoadMainAudio('missing' as typeof pin.id,
      new AbortController().signal),/p015-unknown-audio-domain/);
  });
});

test('P015 My Lesson transport reports main, Spanish selection and terminal frame separately',()=>{
  const sample={frame:914,phase:'timeline-ended',selectedAudio:'main',
    audio:{phase:'buffer-ended'},spanish:{phase:'idle'}} as Parameters<typeof p015HostPlayback>[0];
  const ended=p015HostPlayback(sample);
  assert.deepEqual([ended.frame,ended.frameCount,ended.frameDomain,ended.fps,
    ended.playbackProgress,ended.narration,ended.seekAvailable],
  [914,914,'sprite-270',12,1,'idle',false]);
  const main=p015HostPlayback({...sample,frame:500,phase:'playing',
    audio:{phase:'playing'}} as Parameters<typeof p015HostPlayback>[0]);
  assert.equal(main.narration,'playing');
  const spanish=p015HostPlayback({...sample,selectedAudio:'spanish',
    spanish:{phase:'playing'}} as Parameters<typeof p015HostPlayback>[0]);
  assert.equal(spanish.narration,'playing');
});
