import assert from'node:assert/strict';import test from'node:test';import{validateTerminalTimelineAudio}from'./terminal-timeline-audio';
import type{AnimationModule}from'./contract';import type{LessonTextPresentationCapability}from'./lesson-text-contract';
const source='a'.repeat(64),hash='b'.repeat(64),module={key:'test',movie:{fps:12,frameCount:11}}as unknown as AnimationModule;
function check(frames:number,flag?:unknown,patch:Record<string,unknown>={}){const cap={binding:{animationId:'test'},playbackMode:'once',playbackEndFrameByDomain:{root:11},sourceTimelineAudioCues:[{id:'cue',frameDomain:'root',frame:1,endFrame:12,sha256:source}],terminalTimelineAudio:{frameDomain:'root',holdFrame:11,endFrameExclusive:12,cueId:'cue',sourceSha256:source,pcmSha256:hash,...flag===undefined?{}:{allowClockDriftTail:flag}},...patch}as unknown as LessonTextPresentationCapability<unknown>;validateTerminalTimelineAudio(module,cap,{[source]:{source:'/test.f32le',sha256:hash,sampleRate:48000,channels:1,frames}});}
test('default terminal policy retains its positive-tail requirement',()=>{check(42000);assert.throws(()=>check(40000));assert.throws(()=>check(39800));assert.throws(()=>check(45000));});
test('explicit clock-drift policy admits only a one-frame nominal neighborhood',()=>{check(39800,true);check(40000,true);check(42000,true);assert.throws(()=>check(35000,true));assert.throws(()=>check(45000,true));});
test('clock-drift opt-in retains identity and explicit playback-boundary gates',()=>{assert.throws(()=>check(39800,false));assert.throws(()=>check(39800,'true'));assert.throws(()=>check(39800,true,{playbackMode:undefined}));assert.throws(()=>check(39800,true,{playbackEndFrameByDomain:{root:10}}));assert.throws(()=>check(39800,true,{sourceTimelineAudioCues:[{id:'other',frame:1,endFrame:12,frameDomain:'root',sha256:source}]}));});

const quizControl={frameDomain:'root',completionFrame:11,transitions:[{fromFrame:7,toFrame:8,stopFrame:11},{fromFrame:7,toFrame:10,stopFrame:11}]};
test('authored quiz hold admits terminal audio only through direct declared final edges',()=>{
 check(39800,true,{playbackEndFrameByDomain:{root:7},frameControl:quizControl});
 check(42000,undefined,{playbackEndFrameByDomain:{root:7},frameControl:quizControl});
 for(const frameControl of [
  {...quizControl,frameDomain:'other'}, {...quizControl,completionFrame:10}, {...quizControl,transitions:[]},
  {...quizControl,transitions:[{fromFrame:6,toFrame:8,stopFrame:11}]},
  {...quizControl,transitions:[{fromFrame:7,toFrame:7,stopFrame:11}]},
  {...quizControl,transitions:[{fromFrame:7,toFrame:12,stopFrame:11}]},
  {...quizControl,transitions:[{fromFrame:7,toFrame:8.5,stopFrame:11}]},
  {...quizControl,transitions:[{fromFrame:7,toFrame:8,stopFrame:10}]},
  {...quizControl,transitions:[quizControl.transitions[0],{fromFrame:7,toFrame:10,stopFrame:10}]},
 ])assert.throws(()=>check(39800,true,{playbackEndFrameByDomain:{root:7},frameControl}));
 assert.throws(()=>check(39800,true,{playbackEndFrameByDomain:{root:0},frameControl:{...quizControl,transitions:[{fromFrame:0,toFrame:1,stopFrame:11}]}}));
 assert.throws(()=>check(35000,true,{playbackEndFrameByDomain:{root:7},frameControl:quizControl}));
 assert.throws(()=>check(45000,true,{playbackEndFrameByDomain:{root:7},frameControl:quizControl}));
});
