import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const bundled=await build({entryPoints:[fileURLToPath(new URL('../packages/demos/src/alg-l06-p003-optional-spanish-audio-v1.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',write:false});
const {P003OptionalSpanishAudio:Controller,P003_OPTIONAL_SPANISH_AUDIO_BINDING:binding}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`);
const user={activation:'user'};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function nativeContext(){
 const c={sampleRate:binding.sampleRate,currentTime:0,state:'suspended',destination:{},nodes:[],listeners:new Set(),closed:0,
  createGain:()=>({gain:{setValueAtTime(){}},connect(){},disconnect(){}}),addEventListener:(_,f)=>c.listeners.add(f),removeEventListener:(_,f)=>c.listeners.delete(f),
  decodeAudioData:async()=>({sampleRate:binding.sampleRate,numberOfChannels:1,length:binding.decodedSamples,getChannelData:()=>new Float32Array(binding.decodedSamples)}),
  resume:async()=>{c.state='running';},close:async()=>{c.closed++;c.state='closed';},
  createBufferSource(){const n={onended:null,stopped:0,disconnected:0,connect(){},disconnect(){this.disconnected++;},stop(){this.stopped++;},start(...args){this.args=args;}};c.nodes.push(n);return n;}};return c;
}
function fixture(t,options={}){
 const contexts=[],signals=[],changes=[];let ended=0,loads=0;
 const controller=new Controller({onChange:s=>changes.push(s),onEnded:()=>ended++,
  load:async signal=>{signals.push(signal);loads++;return options.load?options.load(signal):new ArrayBuffer(binding.sourceBytes);},
  createContext:()=>{const c=nativeContext();options.context?.(c);contexts.push(c);return c;}});
 // Explicit deterministic fake decoder/hash in unit lifecycle tests, not browser PCM evidence.
 const digest=t.mock.method(crypto.subtle,'digest',async(_,bytes)=>Uint8Array.from(Buffer.from(bytes.byteLength===binding.sourceBytes?binding.sourceSha256:binding.pcmSha256,'hex')).buffer);
 return {controller,contexts,signals,changes,digest,get ended(){return ended;},get loads(){return loads;}};
}
test('constructor is inert and policy/volume reject invalid inputs',async()=>{
 let loads=0;const c=new Controller({onChange(){},onEnded(){},load:async()=>{loads++;throw Error();}});
 assert.equal(c.snapshot().phase,'idle');assert.equal(loads,0);assert.equal((await c.start({activation:'automatic'})).accepted,false);
 assert.equal(c.setVolume(NaN).accepted,false);assert.equal(c.setVolume(1.1).accepted,false);assert.equal(c.setVolume(.25).accepted,true);await c.close();assert.equal((await c.start(user)).accepted,false);assert.equal(loads,0);
});
test('pause/stop/close cancel loading and ignore obsolete bytes',async t=>{
 for(const action of ['pause','stop','close']){const load=deferred(),f=fixture(t,{load:()=>load.promise});const started=f.controller.start(user);await tick();
  await f.controller[action]();assert.equal(f.signals[0].aborted,true);load.resolve(new ArrayBuffer(binding.sourceBytes));assert.equal((await started).accepted,false);
  assert.equal(f.contexts.length,0);assert.equal(f.ended,0);assert.equal(f.controller.snapshot().phase,{pause:'paused',stop:'idle',close:'closed'}[action]);await f.controller.close();f.digest.mock.restore();}
});
test('pending native resume cannot start after pause or close',async t=>{
 for(const action of ['pause','close']){const resume=deferred(),entered=deferred(),f=fixture(t,{context:c=>{c.resume=()=>{entered.resolve();return resume.promise;};}});
  const started=f.controller.start(user);await entered.promise;await f.controller[action]();resume.resolve();assert.equal((await started).accepted,false);
  assert.equal(f.contexts[0].nodes.length,0);assert.equal(f.contexts[0].state,'closed');assert.equal(f.ended,0);await f.controller.close();f.digest.mock.restore();}
});
test('pause releases audio and subsequent explicit start begins sample zero after close settles',async t=>{
 const closed=deferred(),f=fixture(t);assert.equal((await f.controller.start(user)).accepted,true);const old=f.contexts[0],node=old.nodes[0];
 old.currentTime=2.345;old.close=()=>{old.closed++;return closed.promise.then(()=>{old.state='closed';});};
 f.controller.pause();assert.equal(node.stopped,1);assert.equal(node.disconnected,1);
 const restart=f.controller.start(user);await tick();assert.equal(f.contexts.length,1,'no new context before previous close');
 closed.resolve();assert.equal((await restart).accepted,true);assert.equal(f.contexts.length,2);assert.equal(f.contexts[1].nodes[0].args[1],0);assert.equal(f.ended,0);await f.controller.close();
});
test('new start supersedes an obsolete load without closing or publishing newer playback',async t=>{
 const first=deferred();let call=0;const f=fixture(t,{load:()=>++call===1?first.promise:Promise.resolve(new ArrayBuffer(binding.sourceBytes))});
 const old=f.controller.start(user);await tick();assert.equal((await f.controller.start(user)).accepted,true);first.resolve(new ArrayBuffer(binding.sourceBytes));assert.equal((await old).accepted,false);
 assert.equal(f.controller.snapshot().phase,'playing');assert.equal(f.contexts.length,1);assert.equal(f.contexts[0].nodes.length,1);await f.controller.close();
});
test('natural current buffer end notifies once after release; stale ended callback never notifies',async t=>{
 const f=fixture(t);await f.controller.start(user);const context=f.contexts[0],node=context.nodes[0],onended=node.onended;
 onended();onended();await tick();assert.equal(f.ended,1);assert.equal(f.controller.snapshot().phase,'ended');assert.equal(context.state,'closed');assert.equal(node.disconnected,1);
 await f.controller.start(user);const stale=f.contexts[1].nodes[0].onended;f.controller.stop();stale();await tick();assert.equal(f.ended,1);assert.equal(f.controller.snapshot().phase,'idle');assert.equal(f.controller.snapshot().lessonCompleted,false);await f.controller.close();
});
test('real wrong source bytes fail before context creation',async()=>{
 let contexts=0;const c=new Controller({onChange(){},onEnded(){throw Error('unexpected');},load:async()=>new ArrayBuffer(binding.sourceBytes),createContext:()=>{contexts++;throw Error('unexpected');}});
 assert.equal((await c.start(user)).reason,'source-byte-identity-mismatch');assert.equal(c.snapshot().phase,'error');assert.equal(contexts,0);await c.close();
});
test('PCM mismatch releases context and suppresses completion',async t=>{
 const f=fixture(t);f.digest.mock.mockImplementation(async(_,bytes)=>Uint8Array.from(Buffer.from(bytes.byteLength===binding.sourceBytes?binding.sourceSha256:'00'.repeat(32),'hex')).buffer);
 assert.equal((await f.controller.start(user)).reason,'decoded-buffer-identity-mismatch');await tick();assert.equal(f.controller.snapshot().phase,'error');assert.equal(f.contexts[0].state,'closed');assert.equal(f.ended,0);await f.controller.close();
});
test('default fetch is same-origin, bounded, redirect-denying and rejects bad metadata/oversize',async t=>{
 const prior=Object.getOwnPropertyDescriptor(globalThis,'window');Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{origin:'http://127.0.0.1:3331'}}});
 t.after(()=>{if(prior)Object.defineProperty(globalThis,'window',prior);else delete globalThis.window;});
 for(const mode of ['metadata','oversize']){
  const response=new Response(new Uint8Array(binding.sourceBytes+(mode==='oversize'?1:0)),{headers:{'content-type':mode==='metadata'?'text/html':'audio/mpeg','content-length':String(binding.sourceBytes)}});
  Object.defineProperty(response,'url',{value:`http://127.0.0.1:3331/flash-assets/g678-local/shared-alg001-l06-p003/optional-spanish-audio-v1?sha256=${binding.sourceSha256}`});
  const fetch=t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(url.origin,'http://127.0.0.1:3331');assert.equal(options.credentials,'same-origin');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert(options.signal instanceof AbortSignal);return response;});
  let created=0;const controller=new Controller({onChange(){},onEnded(){},createContext:()=>{created++;throw Error();}});
  assert.equal((await controller.start(user)).reason,mode==='metadata'?'optional-sa-response-mismatch':'optional-sa-response-too-large');assert.equal(created,0);await controller.close();fetch.mock.restore();
 }
});
