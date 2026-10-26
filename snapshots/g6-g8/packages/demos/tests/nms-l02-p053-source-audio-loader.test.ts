import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createP053SourceAudioLoader,loadP053SourceAudio,
  P053_SOURCE_AUDIO_SHA256,P053_SOURCE_AUDIO_URL,
  type P053SourceAudioDependencies} from '../src/nms-l02-p053-source-audio-loader';
import {P053_SOURCE_AUDIO_SHA256 as SERVER_SHA,P053_SOURCE_AUDIO_URL as SERVER_URL}
  from '../../../apps/web/lib/nms-l02-p053-source-audio-access';

const audioPath='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p053-source-stream-product-v1/sprite-187-source-stream-v1.mp3';
function deferred<T>(){
  let resolve!:(value:T)=>void;let reject!:(reason:unknown)=>void;
  const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}

class FakeAudio {
  src:string;volume=1;currentTime=0;preload='';paused=true;loads=0;plays=0;
  onplay:(()=>void)|null=null;onpause:(()=>void)|null=null;
  onended:(()=>void)|null=null;onerror:(()=>void)|null=null;
  playDeferred:ReturnType<typeof deferred<void>>|null=null;
  constructor(url:string){this.src=url;}
  async play(){
    this.plays++;
    if(this.playDeferred)await this.playDeferred.promise;
    this.paused=false;this.onplay?.();
  }
  pause(){this.paused=true;this.onpause?.();}
  load(){this.loads++;}
  removeAttribute(name:string){if(name==='src')this.src='';}
}

function harness(){
  const pending:Array<ReturnType<typeof deferred<Blob>>>=[];
  const signals:AbortSignal[]=[];
  const clips:FakeAudio[]=[];const revoked:string[]=[];const urls:string[]=[];
  const dependencies:P053SourceAudioDependencies={
    load(signal){signals.push(signal);const d=deferred<Blob>();pending.push(d);return d.promise;},
    createUrl(){const url=`blob:p053-${urls.length+1}`;urls.push(url);return url;},
    revokeUrl(url){revoked.push(url);},
    createAudio(url){const clip=new FakeAudio(url);clips.push(clip);return clip as unknown as HTMLAudioElement;},
  };
  const states:string[]=[];
  const session=createP053SourceAudioLoader(dependencies,state=>states.push(state.status));
  return {session,pending,signals,clips,revoked,urls,states};
}

test('loader and local server use same exact full-source asset binding',()=>{
  assert.equal(P053_SOURCE_AUDIO_SHA256,SERVER_SHA);
  assert.equal(P053_SOURCE_AUDIO_URL,SERVER_URL);
});

test('full source fetch checks body bytes/hash before Blob and rejects unsafe origins',async()=>{
  const bytes=readFileSync(audioPath);
  const transport={origin:()=> 'http://127.0.0.1:3331',fetch:async(url:RequestInfo|URL)=>{
    const response=new Response(bytes,{headers:{'content-type':'audio/mpeg',
      'content-length':String(bytes.length)}});
    Object.defineProperty(response,'url',{value:String(url)});
    return response;
  }};
  const blob=await loadP053SourceAudio(new AbortController().signal,transport);
  assert.equal(blob.size,256230);
  assert.equal(blob.type,'audio/mpeg');
  await assert.rejects(()=>loadP053SourceAudio(new AbortController().signal,
    {...transport,origin:()=> 'https://example.com'}),/P053_AUDIO_LOCAL_ONLY/u);
  const altered=Buffer.from(bytes);altered[100]^=1;
  await assert.rejects(()=>loadP053SourceAudio(new AbortController().signal,{
    ...transport,fetch:async(url)=>{
      const response=new Response(altered,{headers:{'content-type':'audio/mpeg',
        'content-length':String(altered.length)}});
      Object.defineProperty(response,'url',{value:String(url)});return response;
    }}),/P053_AUDIO_HASH/u);
});

test('construction never fetches or plays; stop revokes one URL and next explicit play recovers',async()=>{
  const h=harness();
  assert.equal(h.pending.length,0);
  assert.equal(h.clips.length,0);
  const first=h.session.play();
  assert.equal(h.session.getState().status,'loading');
  h.pending[0].resolve(new Blob(['verified'],{type:'audio/mpeg'}));
  assert.equal(await first,true);
  assert.equal(h.clips[0].plays,1);
  assert.equal(h.session.getState().status,'playing');
  h.session.setVolume(1.5);
  assert.equal(h.clips[0].volume,1);
  h.session.stop();
  assert.deepEqual(h.revoked,['blob:p053-1']);
  assert.equal(h.clips[0].src,'');
  assert.equal(h.clips[0].loads,1);
  assert.equal(h.clips[0].paused,true);
  const second=h.session.play();
  h.pending[1].resolve(new Blob(['verified'],{type:'audio/mpeg'}));
  assert.equal(await second,true);
  h.session.dispose();
  assert.deepEqual(h.revoked,['blob:p053-1','blob:p053-2']);
  assert.equal(h.session.getState().status,'disposed');
  assert.equal(await h.session.play(),false);
});

test('stop and pause cancel pending loads and ignore late completion',async()=>{
  const h=harness();
  const first=h.session.play();
  h.session.stop();
  assert.equal(h.signals[0].aborted,true);
  h.pending[0].resolve(new Blob(['late']));
  assert.equal(await first,false);
  assert.equal(h.urls.length,0);
  const second=h.session.play();
  h.session.pause();
  assert.equal(h.signals[1].aborted,true);
  h.pending[1].resolve(new Blob(['late']));
  assert.equal(await second,false);
  assert.equal(h.urls.length,0);
  const third=h.session.play();
  h.pending[2].resolve(new Blob(['fresh']));
  assert.equal(await third,true);
  h.session.dispose();
});

test('late native play completion cannot re-activate a paused or departed session',async()=>{
  const h=harness();
  const initial=h.session.play();
  h.pending[0].resolve(new Blob(['verified']));
  assert.equal(await initial,true);
  const clip=h.clips[0];
  clip.playDeferred=deferred<void>();
  h.session.pause();
  const resume=h.session.play();
  h.session.pause();
  clip.playDeferred.resolve();
  assert.equal(await resume,false);
  assert.equal(h.session.getState().status,'paused');
  assert.equal(clip.paused,true);
  h.session.stop();
  assert.equal(clip.src,'');
  assert.deepEqual(h.revoked,['blob:p053-1']);
});

test('late play resolution on an old element is paused after navigation cleanup',async()=>{
  const h=harness();
  const first=h.session.play();
  h.pending[0].resolve(new Blob(['verified']));
  assert.equal(await first,true);
  const old=h.clips[0];
  old.playDeferred=deferred<void>();
  const stale=h.session.play();
  h.session.stop();
  assert.equal(old.src,'');
  const fresh=h.session.play();
  h.pending[1].resolve(new Blob(['verified']));
  assert.equal(await fresh,true);
  old.playDeferred.resolve();
  assert.equal(await stale,false);
  assert.equal(old.paused,true);
  assert.equal(h.session.getState().status,'playing');
  h.session.dispose();
});

test('native end reports stopped playback and replay reuses only the explicit source clip',async()=>{
  const h=harness();
  const first=h.session.play();
  h.pending[0].resolve(new Blob(['verified']));
  assert.equal(await first,true);
  const clip=h.clips[0];
  clip.currentTime=12;
  clip.onended?.();
  assert.equal(h.session.getState().status,'ended');
  assert.equal(h.session.getState().playing,false);
  assert.equal(await h.session.play(),true);
  assert.equal(clip.currentTime,0);
  assert.equal(clip.plays,2);
  assert.equal(h.clips.length,1);
  assert.equal(h.pending.length,1);
  h.session.dispose();
});
