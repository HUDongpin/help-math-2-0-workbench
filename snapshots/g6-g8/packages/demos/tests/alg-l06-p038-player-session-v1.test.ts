import assert from 'node:assert/strict';
import test from 'node:test';
import {P038PlayerSessionV1,type P038SessionOptions,type P038SessionRuntime,
  type P038SessionSnapshot} from '../src/alg-l06-p038-player-session-v1';

const result=(accepted=true,reason='ok')=>({accepted,reason});
const bytes=()=>new ArrayBuffer(8);
function deferred<T>(){
  let resolve!: (value:T)=>void;
  const promise=new Promise<T>(done=>{resolve=done;});
  return {promise,resolve};
}
function fakeRuntime(){
  const calls:string[]=[];
  let phase='idle',selected:'main'|'spanish'='main',glossary:string|null=null;
  let spanishReady=false;
  const runtime={
    snapshot:()=>({phase,frame:1,selectedAudio:selected,glossaryOpen:glossary,
      mainAudio:{nativeEofObserved:false},
      spanishAudio:{phase:spanishReady?'ready':'idle',ready:spanishReady},
      visualBoundaryReached:false}) as P038SessionSnapshot,
    tick:()=>{calls.push('tick');return runtime.snapshot();},
    prepareMain:async (_:ArrayBuffer)=>{calls.push('prepare-main');phase='ready';return result();},
    prepareSpanish:async (_:ArrayBuffer)=>{calls.push('prepare-spanish');
      spanishReady=true;return result();},
    play:async (_:unknown)=>{calls.push('play');phase='playing';return result();},
    pause:()=>{calls.push('pause');phase='paused';return result();},
    openGlossary:(key:string)=>{calls.push('open-'+key);glossary=key;return result();},
    closeGlossary:()=>{calls.push('close-glossary');glossary=null;return result();},
    startSpanish:async (_:unknown)=>{calls.push('start-spanish');selected='spanish';return result();},
    returnMain:()=>{calls.push('return-main');selected='main';return result();},
    replay:()=>{calls.push('replay');selected='main';glossary=null;phase='ready';return result();},
    setVolume:(volume:number)=>{calls.push('volume-'+volume);return result();},
    close:async()=>{calls.push('close');phase='closed';},
  } as unknown as P038SessionRuntime;
  return {runtime,calls};
}
function fixture(overrides:Partial<P038SessionOptions>={}){
  const fake=fakeRuntime(),snapshots:P038SessionSnapshot[]=[],failures:Error[]=[];
  const dialogs:{closed:number}={closed:0};
  const options:P038SessionOptions={
    readyVisual:async()=>{},paintInitial:()=>true,
    createRuntime:()=>fake.runtime,
    loadMain:async()=>bytes(),loadSpanish:async()=>bytes(),
    initialVolume:0.75,getReducedMotion:()=>false,
    onSnapshot:value=>snapshots.push(value),
    onFailure:error=>failures.push(error),
    onCloseDialog:()=>{dialogs.closed++;},...overrides,
  };
  return {session:new P038PlayerSessionV1(options),fake,snapshots,failures,dialogs};
}

test('host Play survives visual and main-source loading, with no autoplay',async()=>{
  const visual=deferred<void>(),main=deferred<ArrayBuffer>();
  const f=fixture({readyVisual:()=>visual.promise,loadMain:()=>main.promise});
  const loading=f.session.start();
  assert.equal(await f.session.play(),true);
  assert.deepEqual(f.fake.calls,[]);
  visual.resolve();await Promise.resolve();
  assert.deepEqual(f.fake.calls,[]);
  main.resolve(bytes());await loading;
  assert.deepEqual(f.fake.calls,['prepare-main','volume-0.75','play']);
  assert.equal(f.session.current?.phase,'playing');
  await f.session.close();
});

test('one mount cannot start two competing source preparations',async()=>{
  const main=deferred<ArrayBuffer>();let loads=0;
  const f=fixture({loadMain:()=>{loads++;return main.promise;}});
  const first=f.session.start(),second=f.session.start();
  await Promise.resolve();
  main.resolve(bytes());await Promise.all([first,second]);
  assert.equal(loads,1);
  assert.equal(f.fake.calls.filter(call=>call==='prepare-main').length,1);
  await f.session.close();
});

test('Pause cancels queued Play; a fresh explicit Play starts after prepare',async()=>{
  const main=deferred<ArrayBuffer>();
  const f=fixture({loadMain:()=>main.promise});
  const loading=f.session.start();await f.session.play();f.session.pause();
  main.resolve(bytes());await loading;
  assert.deepEqual(f.fake.calls,['prepare-main','volume-0.75']);
  await f.session.play();assert.equal(f.fake.calls.at(-1),'play');
  await f.session.close();
});

test('StrictMode-like cleanup aborts first mount and rejects late source resolution',async()=>{
  const main=deferred<ArrayBuffer>();
  let aborted=false;
  const first=fixture({loadMain:signal=>{
    signal.addEventListener('abort',()=>{aborted=true;});return main.promise;}});
  const loading=first.session.start();await Promise.resolve();
  await first.session.close();
  const second=fixture();await second.session.start();
  main.resolve(bytes());await loading;
  assert.equal(aborted,true);
  assert.equal(first.fake.calls.includes('prepare-main'),false);
  assert.equal(second.fake.calls.includes('prepare-main'),true);
  assert.equal(first.failures.length,0);
  await second.session.close();
});

test('cleanup during pending main decode closes its owner and blocks a late Play',async()=>{
  const decoding=deferred<ReturnType<typeof result>>();
  const f=fixture();
  const runtime=f.fake.runtime;
  runtime.prepareMain=async()=>{f.fake.calls.push('prepare-main');return decoding.promise;};
  const loading=f.session.start();
  await Promise.resolve();await Promise.resolve();
  await f.session.play();
  await f.session.close();
  decoding.resolve(result());await loading;
  assert.equal(f.fake.calls.includes('close'),true);
  assert.equal(f.fake.calls.includes('play'),false);
  assert.equal(f.session.isDisposed,true);
});

test('separate Spanish source loads only after explicit click, returns held, and reuses decode',async()=>{
  let spanishLoads=0;
  const f=fixture({loadSpanish:async()=>{spanishLoads++;return bytes();}});
  await f.session.start();assert.equal(spanishLoads,0);
  await f.session.play();assert.equal(spanishLoads,0);
  assert.equal(await f.session.startSpanish(),true);
  assert.deepEqual(f.fake.calls.slice(-3),['pause','prepare-spanish','start-spanish']);
  assert.equal(f.session.current?.selectedAudio,'spanish');
  assert.equal(f.session.returnMain(),true);
  assert.equal(f.fake.calls.at(-1),'return-main');
  assert.equal(f.session.current?.selectedAudio,'main');
  assert.equal(await f.session.startSpanish(),true);
  assert.equal(spanishLoads,1);
  f.session.pause();
  assert.equal(await f.session.play(),true);
  assert.equal(f.fake.calls.at(-1),'start-spanish');
  await f.session.close();
});

test('Replay closes glossary, cancels pending SA and returns main frame one held',async()=>{
  const spanish=deferred<ArrayBuffer>();
  let loads=0;
  const f=fixture({loadSpanish:()=>{loads++;return spanish.promise;}});
  await f.session.start();
  const trigger={isConnected:true,disabled:false,
    focus:()=>{}} as unknown as HTMLButtonElement;
  assert.equal(f.session.openGlossary('Table',trigger,()=>{}),true);
  f.session.closeGlossary();
  const pending=f.session.startSpanish();
  let token=0;
  assert.equal(f.session.replay(()=>{token++;}),true);
  spanish.resolve(bytes());assert.equal(await pending,false);
  assert.equal(loads,0);
  assert.equal(token,1);
  assert.equal(f.session.current?.selectedAudio,'main');
  assert.equal(f.session.current?.phase,'ready');
  assert.equal(f.fake.calls.includes('start-spanish'),false);
  assert.equal(f.fake.calls.at(-1),'replay');
  assert.ok(f.dialogs.closed>=1);
  await f.session.close();
});

test('a rejected native user start retains its owner for a fresh explicit retry',async()=>{
  const f=fixture();await f.session.start();
  const original=f.fake.runtime.play;let attempts=0;
  f.fake.runtime.play=async policy=>++attempts===1?
    result(false,'play-rejected'):original(policy);
  assert.equal(await f.session.play(),false);
  assert.equal(f.session.isDisposed,false);
  assert.equal(f.failures.length,0);
  assert.equal(f.fake.calls.includes('close'),false);
  assert.equal(await f.session.play(),true);
  assert.equal(attempts,2);
  await f.session.close();
});

test('a stale pending Play cannot close a newer successful start',async()=>{
  const f=fixture(),first=deferred<ReturnType<typeof result>>();
  await f.session.start();let attempts=0;
  f.fake.runtime.play=async()=>++attempts===1?first.promise:result();
  const pending=f.session.play();
  assert.equal(await f.session.play(),true);
  first.resolve(result(false,'stale-main-start'));
  assert.equal(await pending,false);
  assert.equal(f.session.isDisposed,false);
  assert.equal(f.fake.calls.includes('close'),false);
  await f.session.close();
});

test('a rejected optional SA start retains the decoded source for explicit retry',async()=>{
  let loads=0;const f=fixture({loadSpanish:async()=>{loads++;return bytes();}});
  await f.session.start();let attempts=0;
  const original=f.fake.runtime.startSpanish;
  f.fake.runtime.startSpanish=async policy=>++attempts===1?
    result(false,'play-rejected'):original(policy);
  assert.equal(await f.session.startSpanish(),false);
  assert.equal(f.session.isDisposed,false);
  assert.equal(f.failures.length,0);
  assert.equal(await f.session.startSpanish(),true);
  assert.equal(loads,1);assert.equal(attempts,2);
  await f.session.close();
});
