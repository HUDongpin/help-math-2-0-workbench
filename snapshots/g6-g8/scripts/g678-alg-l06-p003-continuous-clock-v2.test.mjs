import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const bundled = await build({entryPoints: [fileURLToPath(new URL('../packages/demos/src/alg-l06-p003-continuous-source-clock-v2.ts', import.meta.url))], bundle:true, platform:'node',format:'esm',write:false});
const {AlgL06P003ContinuousSourceClockV2: Clock} = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`);
const plan = new Clock({commitHeldFrame:()=>true}).plan;
const user = {activation:'user',reducedMotion:false};
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
const deferred = () => {let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function context() {
  const c = {sampleRate:22050,currentTime:0,state:'suspended',destination:{},nodes:[],listeners:new Set(),
    createGain:()=>({gain:{setValueAtTime(){}},connect(){},disconnect(){}}),
    addEventListener:(_,fn)=>c.listeners.add(fn),removeEventListener:(_,fn)=>c.listeners.delete(fn),
    decodeAudioData:async()=>({sampleRate:22050,numberOfChannels:1,length:plan.decodedSamples,getChannelData:()=>new Float32Array(plan.decodedSamples)}),
    resume:async()=>{c.state='running';},close:async()=>{c.state='closed';},
    emit(state){c.state=state;for(const f of c.listeners)f();},
    createBufferSource(){const n={onended:null,stopped:0,disconnected:0,connect(){},disconnect(){this.disconnected++;},stop(){this.stopped++;},start(...args){this.args=args;}};c.nodes.push(n);return n;}};
  return c;
}
// Explicitly fake hashing and decoded audio only in lifecycle tests. Production
// source/PCM guards are exercised below, not represented as browser decode proof.
function fixture(t) {
  const c=context(), frames=[];let commit=true;
  const clock=new Clock({createContext:()=>c,commitHeldFrame:f=>{frames.push(f);return commit;}});
  const digest=t.mock.method(crypto.subtle,'digest',async(_,bytes)=>Uint8Array.from(Buffer.from(bytes.byteLength===plan.sourceBytes?plan.sourceSha256:plan.measuredPcmSha256,'hex')).buffer);
  return {clock,c,frames,digest,setCommit:v=>{commit=v;},prepare:()=>clock.prepare(new ArrayBuffer(plan.sourceBytes))};
}

test('rejects real wrong source bytes before creating context', async()=>{
  let created=0;const clock=new Clock({commitHeldFrame:()=>true,createContext:()=>{created++;throw Error();}});
  assert.equal((await clock.prepare(new ArrayBuffer(plan.sourceBytes))).reason,'source-byte-identity-mismatch');assert.equal(created,0);await clock.close();
});
test('one source node across packet gaps; preroll, EOF postroll, held terminal and replay',async t=>{
  const f=fixture(t);assert.equal((await f.prepare()).accepted,true);
  assert.equal((await f.clock.play({activation:'automatic',reducedMotion:false})).accepted,false);
  assert.equal(f.c.nodes.length,0);assert.equal((await f.clock.play(user)).accepted,true);
  assert.equal(f.clock.snapshot().audio.phase,'preroll');assert.equal(f.c.nodes.length,1);
  near(f.c.nodes[0].args[0],40/12);near(f.c.nodes[0].args[1],1673/22050);
  for(const frame of [41,501,502,543,544]){f.c.currentTime=(frame-1)/12;assert.equal(f.clock.snapshot().frame,frame);assert.equal(f.clock.snapshot().audio.phase,'playing');assert.equal(f.c.nodes.length,1);}
  f.c.currentTime=plan.audioEndSeconds;f.c.nodes[0].onended();
  assert.equal(f.clock.snapshot().audio.phase,'postroll');assert.equal(f.clock.snapshot().lessonCompleted,false);
  f.c.currentTime=718/12;assert.equal(f.clock.snapshot().timelineReachedEnd,true);assert.equal(f.frames.at(-1),719);assert.equal(f.clock.snapshot().lessonCompleted,false);
  assert.equal(f.clock.replay().accepted,true);assert.equal(f.clock.snapshot().frame,1);assert.equal(f.clock.snapshot().phase,'ready');assert.equal(f.c.nodes.length,1);await f.clock.close();
});
test('fractional pause resumes exact sample; postroll resume creates no audio node; seek rejected',async t=>{
  const f=fixture(t);await f.prepare();await f.clock.play(user);f.c.currentTime=42.123456;
  assert.equal(f.clock.pause().accepted,true);const held=f.clock.snapshot();near(held.elapsedSeconds,42.123456);assert.equal(f.c.nodes[0].stopped,1);
  f.c.currentTime=45;await f.clock.play(user);near(f.c.nodes[1].args[1],(1673+(42.123456-40/12)*22050)/22050);
  f.c.currentTime=45+(57-42.123456);f.clock.pause();assert.equal(f.clock.snapshot().audio.decodedSample,null);await f.clock.play(user);assert.equal(f.c.nodes.length,2);
  assert.equal(f.clock.seekCandidateFrame(544).reason,'arbitrary-source-frame-seek-unsupported');assert.equal(f.clock.snapshot().frame,685);await f.clock.close();
});
test('pause, replay and close invalidate pending resume without stale nodes',async t=>{
  for(const action of ['pause','replay','close']){const f=fixture(t);await f.prepare();const pending=deferred();f.c.resume=()=>pending.promise;const start=f.clock.play(user);await f.clock[action]();f.c.state='running';pending.resolve();assert.equal((await start).accepted,false);assert.equal(f.c.nodes.length,0);assert.equal(f.clock.snapshot().phase,action==='pause'?'paused':action==='replay'?'ready':'closed');await f.clock.close();f.digest.mock.restore();}
});
test('interruption preserves fractional clock; failed frame commit blocks audio',async t=>{
  const f=fixture(t);await f.prepare();await f.clock.play(user);f.c.currentTime=12.345;f.c.emit('suspended');assert.equal(f.clock.snapshot().phase,'paused');near(f.clock.snapshot().elapsedSeconds,12.345);assert.equal(f.c.nodes[0].stopped,1);
  f.setCommit(false);assert.equal((await f.clock.play(user)).accepted,false);assert.equal(f.clock.snapshot().phase,'failed');assert.equal(f.c.nodes.length,1);await f.clock.close();
});
test('PCM mismatch closes context; pending decode cannot resurrect closed clock',async t=>{
  const f=fixture(t);f.digest.mock.mockImplementation(async(_,bytes)=>Uint8Array.from(Buffer.from(bytes.byteLength===plan.sourceBytes?plan.sourceSha256:'00'.repeat(32),'hex')).buffer);
  assert.equal((await f.prepare()).reason,'decoded-buffer-identity-mismatch');assert.equal(f.c.state,'closed');f.digest.mock.restore();
  const g=fixture(t), pending=deferred(), entered=deferred();g.c.decodeAudioData=()=>{entered.resolve();return pending.promise;};const prep=g.prepare();await entered.promise;await g.clock.close();pending.resolve({});assert.equal((await prep).reason,'stale-prepare');assert.equal(g.clock.snapshot().phase,'closed');
});
test('terminal frame commit failure never reports timeline or lesson completion',async t=>{
  const f=fixture(t);await f.prepare();await f.clock.play(user);f.setCommit(false);f.c.currentTime=100;const s=f.clock.snapshot();assert.equal(s.phase,'failed');assert.equal(s.timelineReachedEnd,false);assert.equal(s.lessonCompleted,false);assert.equal(f.c.nodes[0].stopped,1);await f.clock.close();
});
