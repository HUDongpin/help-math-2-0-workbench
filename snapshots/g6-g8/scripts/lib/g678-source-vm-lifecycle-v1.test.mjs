import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import {fixture} from './g678-technical-assessor-fixture-v1.mjs';
import {assessPage} from './g678-technical-assessor-v1.mjs';
import {readRetainedSourceSurface,sourceVmOwnerChanged,sourceVmRetired,sourceVmReplayCause} from './g678-source-vm-lifecycle-v1.mjs';

const OUT=fs.realpathSync(process.env.G678_LIFECYCLE_TEST_ROOT??os.tmpdir());
function retirement(sample,atMs=1200) {
  const identity=structuredClone(sample.identity);
  return {...identity,connected:false,hasRuntime:true,activeAudio:0,activeTimers:0,observation:{status:'retired',identity,
    lifecycle:{kind:'hfr-player-lifecycle-v1',identity,observedAtMs:atMs,pageLeaseCurrent:false,pageSessionCurrent:false,
      ownsActiveLoad:false,playerDestroyed:true,currentPlayerRunning:false,animationFramePending:false,unattributedAnimationFrames:0,
      audioContext:{contextId:'unit-only-old-context',state:'closed',trackedStreams:0,trackedEvents:0},
      htmlMedia:[{mediaId:'unit-only-old-html-media',src:'/unit-only/es.mp3',currentSrc:'/unit-only/es.mp3',paused:true,ended:false,pendingPlays:0}],
      unattributedHtmlMedia:0,htmlMediaObservationOverflow:0}}};
}
function setup(t,{remount=true,replayStarts=false}={}) {
  fs.mkdirSync(path.join(OUT,'test-work'),{recursive:true});const root=fs.mkdtempSync(path.join(OUT,'test-work','case-'));
  t.after(()=>fs.rmSync(root,{recursive:true}));const f=fixture(root);
  for(const c of f.raw.cells) {
    const samples=c.documents[0].samples;
    if(remount) {
      for(const s of samples.slice(3))s.identity.replay=0;
      for(const m of c.mediaChecks)m.replay=0;
    }
    c.flows.find(flow=>flow.kind==='replay').retired=retirement(samples[2]);
    if(replayStarts) {
      Object.assign(c.flows.find(flow=>flow.kind==='natural-playback'&&flow.before===4),
        {startKind:'replay',eventSequences:[4],replayFlowBefore:3,replayFlowAfter:4});
      c.documents[0].events=c.documents[0].events.filter(event=>event.sequence!==5);
    }
  }
  return f;
}
function parts(f) {const cell=f.raw.cells[0],before=cell.documents[0].samples[2],after=cell.documents[0].samples[3],flow=cell.flows.find(flow=>flow.kind==='replay');
  return {cell,before,after,retired:flow.retired,event:cell.documents[0].events.find(event=>event.sequence===4),initialState:f.contract.terminal.initialState};}

test('existing six-cell fixture passes with real-owner semantics and both source-vm local Replay counters at zero',t=>{
  const f=setup(t),p=parts(f);assert.equal(p.before.identity.replay,0);assert.equal(p.after.identity.replay,0);
  assert.equal(sourceVmOwnerChanged(p.before.identity,p.after.identity),true);assert.equal(sourceVmReplayCause(p),true);
  const result=assessPage(f);assert.equal(result.status,'pass',JSON.stringify(result.issues));
});
test('a trusted old-owner Replay can initiate the new source-vm natural run without a fabricated counter increment',t=>{
  const f=setup(t,{replayStarts:true}),result=assessPage(f);assert.equal(result.status,'pass',JSON.stringify(result.issues));
});
for(const [name,change]of [
  ['detached DOM without producer lifecycle',p=>{delete p.retired.observation.lifecycle;}],
  ['old page lease still current',p=>{p.retired.observation.lifecycle.pageLeaseCurrent=true;}],
  ['old page session still current',p=>{p.retired.observation.lifecycle.pageSessionCurrent=true;}],
  ['page session observation missing',p=>{delete p.retired.observation.lifecycle.pageSessionCurrent;}],
  ['old RAF still pending',p=>{p.retired.observation.lifecycle.animationFramePending=true;}],
  ['unattributed RAF',p=>{p.retired.observation.lifecycle.unattributedAnimationFrames=1;}],
  ['native close pending',p=>{p.retired.observation.lifecycle.audioContext.state='suspended';}],
  ['context identity absent',p=>{delete p.retired.observation.lifecycle.audioContext.contextId;}],
  ['stream still tracked',p=>{p.retired.observation.lifecycle.audioContext.trackedStreams=1;}],
  ['event audio still tracked',p=>{p.retired.observation.lifecycle.audioContext.trackedEvents=1;}],
  ['HTML play pending after pause',p=>{p.retired.observation.lifecycle.htmlMedia[0].pendingPlays=1;}],
  ['old HTML still playing',p=>{p.retired.observation.lifecycle.htmlMedia[0].paused=false;}],
  ['HTML ownership unknown',p=>{p.retired.observation.lifecycle.unattributedHtmlMedia=1;}],
  ['bounded record overflow',p=>{p.retired.observation.lifecycle.htmlMediaObservationOverflow=1;}],
  ['duplicate old media identity',p=>{p.retired.observation.lifecycle.htmlMedia.push({...p.retired.observation.lifecycle.htmlMedia[0]});}],
  ['new owner lifecycle substituted for old',p=>{p.retired.observation.lifecycle.identity=structuredClone(p.after.identity);}],
  ['source SHA mismatch',p=>{p.retired.observation.lifecycle.identity={...p.before.identity,sourceSha256:'f'.repeat(64)};}],
  ['retirement read before Replay event',p=>{p.retired.observation.lifecycle.observedAtMs=1050;}],
  ['same player owner',p=>{p.after.identity.playerId=p.before.identity.playerId;}],
  ['same lease token',p=>{p.after.identity.leaseToken=p.before.identity.leaseToken;}],
  ['counter increment without new owner',p=>{p.after.identity={...p.before.identity,replay:1};}],
  ['synthetic Replay input',p=>{p.event.synthetic=true;}],
  ['forced Replay input',p=>{p.event.forced=true;}],
  ['untrusted Replay input',p=>{p.event.trusted=false;}],
  ['unrelated old-owner click',p=>{p.event.action='next';}],
  ['new-owner input mislabeled as Replay',p=>{p.event.playerId=p.after.identity.playerId;}],
  ['wrong keyboard key',p=>{p.event.type='keydown';p.event.key='x';}],
  ['missing before clock',p=>{delete p.before.atMs;}],
  ['nonfinite after clock',p=>{p.after.atMs=NaN;}],
  ['missing source initial state',p=>{p.initialState={};}],
  ['undefined expected field',p=>{p.initialState={'source.absent':undefined};}],
  ['wrong source initial state',p=>{p.after.source.frame=3;}],
])test('source-vm Replay rejects '+name,t=>{
  const p=parts(setup(t));change(p);assert.equal(sourceVmReplayCause(p),false);
});

test('shared LessonRuntime existence is not old page resource activity',t=>{
  const p=parts(setup(t));p.retired.hasRuntime=true;assert.equal(sourceVmRetired(p.retired,p.before),true);
  p.retired.observation.lifecycle.currentPlayerRunning=true;p.retired.observation.lifecycle.playerDestroyed=false;
  p.retired.observation.lifecycle.ownsActiveLoad=false;assert.equal(sourceVmRetired(p.retired,p.before),true,'same player may own a different load; old lease/resource reader stays exact');
});
test('plain detached element cannot produce cleanup zeroes',()=>{
  assert.deepEqual(readRetainedSourceSurface({isConnected:false}),{connected:false,observation:null});
});
test('assessor rejects an active old page reservation and does not accept only legacy hasRuntime=false counters',t=>{
  const f=setup(t),p=parts(f);p.retired.observation.lifecycle.pageSessionCurrent=true;
  assert(assessPage(f).issues.some(issue=>issue.code==='replay-old-owner-not-retired'));
  p.cell.flows.find(flow=>flow.kind==='replay').retired={playerId:p.before.identity.playerId,connected:false,hasRuntime:false,activeAudio:0,activeTimers:0};
  assert(assessPage(f).issues.some(issue=>issue.code==='replay-old-owner-not-retired'));
});

function nativeFixture(t) {
  const f=setup(t,{remount:false});f.contract.rendererFamily='native-canvas';
  for(const c of f.raw.cells) {
    for(const s of c.documents[0].samples){s.identity.ownerKind='surface-run';s.identity.surfaceId=s.render.surfaceId;s.identity.runEpoch=s.identity.replay;s.identity.runToken=`source-stage:${s.identity.replay}`;delete s.identity.leaseToken;s.source.observedFrom='renderer-state';s.source.tickKind='observed-committed-paint';s.render.rendererFamily='native-canvas';}
    c.flows.find(flow=>flow.kind==='replay').retired={kind:'surface-run',playerId:`${c.cellId}-player-0`,runEpoch:0,sourceNodeIds:['source-old'],activeSourceNodes:0,pendingMediaStarts:0};
    for(const m of c.mediaChecks)m.sourceNodeIds=[m.replay===0?'source-old':'source-new'];
  }
  f.saveContract();return f;
}
test('surface-run unchanged: shared DOM/context with new run epoch and source nodes still passes',t=>{
  const f=nativeFixture(t),result=assessPage(f);assert.equal(result.status,'pass',JSON.stringify(result.issues));
});
test('surface-run unchanged: zero-to-zero counter does not gain the source-vm remount exception',t=>{
  const f=nativeFixture(t),c=f.raw.cells[0];for(const s of c.documents[0].samples.slice(3)){s.identity.replay=0;s.identity.runEpoch=0;}
  assert(assessPage(f).issues.some(issue=>issue.code==='replay-did-not-reset-with-fresh-owner'));
});
test('surface-run unchanged: active source nodes or pending starts cannot retire',t=>{
  const f=nativeFixture(t),retired=f.raw.cells[0].flows.find(flow=>flow.kind==='replay').retired;
  retired.activeSourceNodes=1;assert(assessPage(f).issues.some(issue=>issue.code==='replay-old-owner-not-retired'));
  retired.activeSourceNodes=0;retired.pendingMediaStarts=1;assert(assessPage(f).issues.some(issue=>issue.code==='replay-old-owner-not-retired'));
});
test('surface-run unchanged: recycled old audio nodes fail the existing ownership rule',t=>{
  const f=nativeFixture(t);f.raw.cells[0].mediaChecks[1].sourceNodeIds=['source-old'];
  assert(assessPage(f).issues.some(issue=>issue.code==='native-replay-audio-source-node-ownership-missing-or-stale'));
});
