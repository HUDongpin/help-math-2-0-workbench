import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {RuntimeContext} from '../contract';
import {frameAtElapsedMs,frameToElapsedMs} from '../runtime';
import {getCourseG03L09Rw007FrameState} from '../modules/course-g03-l09-rw-007';
import {lessonTextInstanceId} from '../lesson-text-snapshot';
import {RW007} from './g3-l9-rw007-config';
import {getRw007Snapshot,rw007TermRequest,RW007_BINDING} from './g3-l9-rw007-state';
import {Rw007NativeSurface,G3_L9_RW007_TEXT_PRESENTATION as capability} from './g3-l9-rw007';
const ctx=(frame:number,replay=0):RuntimeContext=>({frame,frameDomain:'sprite-77',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:23,replay});
const snapshot=(frame:number,replay=0)=>{const c=ctx(frame,replay);return getRw007Snapshot(getCourseG03L09Rw007FrameState(frame,c),c);};
const markup=(frame:number,replay=0)=>renderToStaticMarkup(<Rw007NativeSurface snapshot={snapshot(frame,replay)} figure={<div data-test-figure="true"/>} onLessonHostRequest={()=>{}}/>);

for(const segment of RW007.segments) test(`whole semantic segment ${segment.id} begins exactly at ${segment.revealFrame}`,()=>{
  for(const frame of [segment.revealFrame-1,segment.revealFrame,segment.revealFrame+1]){
    const snap=snapshot(frame);assert.equal(snap.status,'ready');
    assert.equal(snap.blocks.find(b=>b.id===segment.id)?.visible,frame>=segment.revealFrame);
    assert.equal(markup(frame).includes(`data-lesson-text-block="${segment.id}"`),frame>=segment.revealFrame);
  }
});
test('all 384 host frames produce only active canonical suppression identities; all four masks are absent',()=>{
  for(let frame=1;frame<=384;frame++){
    const snap=snapshot(frame);assert.equal(snap.status,'ready');
    assert.deepEqual(snap.suppressedInstances.map(x=>x.id),RW007.exclusions.filter(x=>frame>=x.firstFrame && frame<x.lastFrameExclusive).map(x=>x.id));
    for(const i of snap.suppressedInstances){assert.equal(i.id,lessonTextInstanceId(i.path));assert.ok(![63,69,70,76].includes(i.path[0].characterId));}
  }
});
test('normal host clock keeps advancing 324 through 336 without a page pause or second clock',()=>{
  const movie={stage:{width:800,height:600},fps:12,frameCount:384,durationMs:32000};
  for(let frame=324;frame<=336;frame++){
    assert.equal(frameAtElapsedMs(frameToElapsedMs(frame,movie),movie,'once',384),frame);
    const a=snapshot(frame),b=snapshot(frame);assert.deepEqual(a,b);assert.equal(a.identity.frame,frame);
  }
  assert.equal('frameControl' in capability,false);assert.equal(capability.sourceTimelineAudioCues.length,1);assert.equal(capability.sourceTimelineAudioCues[0].frame,12);assert.equal(capability.sourceTimelineAudioCues[0].endFrame,385);
  for(const name of ['g3-l9-rw007.tsx','g3-l9-rw007-state.ts','g3-l9-rw007-loader.ts']){
    const text=readFileSync(new URL('./'+name,import.meta.url),'utf8');
    assert.doesNotMatch(text,/\b(setTimeout|setInterval|requestAnimationFrame|performance\.now|Date\.now)\s*\(/);
  }
});
test('Replay hides all seven segments at frame 1 and a second pass is deterministic',()=>{
  const first=snapshot(384,0),restart=snapshot(1,1),second=snapshot(384,1);
  assert.equal(first.blocks.filter(b=>b.visible).length,7);assert.equal(restart.blocks.some(b=>b.visible),false);
  assert.equal(restart.suppressedInstances.length,0);assert.equal(restart.identity.replay,1);
  assert.deepEqual(first.blocks,second.blocks);assert.deepEqual(first.suppressedInstances,second.suppressedInstances);
  assert.equal(markup(1,1).includes('Essential Question:'),false);assert.equal(markup(1,1).includes('three-dimensional'),false);
});
test('reduced motion is the explicit complete question frame from the same snapshot path',()=>{
  assert.equal(capability.reducedMotionFrameByDomain['sprite-77'],384);assert.equal(capability.playbackEndFrameByDomain['sprite-77'],384);
  assert.equal(snapshot(capability.reducedMotionFrameByDomain['sprite-77']).blocks.filter(b=>b.visible).length,7);
});
test('bad source, frame, domain, root, scenario, language, seed or replay fail closed with no hidden question content',()=>{
  const context=ctx(372),state=getCourseG03L09Rw007FrameState(372,context);
  for(const patch of [{sourceSwfSha256:'0'.repeat(64)},{frame:371},{animationId:'other'},{frameDomain:'root'},{rootFrame:5},{seed:24},{language:'es'},{status:'blocked'}]){
    const result=getRw007Snapshot({...state,...patch} as typeof state,context);assert.equal(result.status,'blocked');assert.equal(result.blocks.length,0);assert.equal(result.suppressedInstances.length,0);
  }
  for(const patch of [{frame:0},{frame:385},{frame:372.1},{frameDomain:'root'},{rootFrame:5},{scenario:'default'},{lang:'es'},{seed:-1},{seed:2**32},{replay:-1},{replay:1.2}]){
    const result=getRw007Snapshot(state,{...context,...patch} as RuntimeContext);assert.equal(result.status,'blocked');assert.equal(result.blocks.length,0);
  }
});
for(const id of ['two','three','figures','classified']) test(`term ${id} keeps authored request and earliest full-word gate`,()=>{
  const segment=RW007.segments.find(s=>s.id===id)!;assert.ok('term' in segment);
  assert.equal(rw007TermRequest(id,snapshot(segment.revealFrame-1)),null);
  const request=rw007TermRequest(id,snapshot(segment.revealFrame));assert.deepEqual(request,{type:'open-keyterm',entryId:segment.term.entryId,
    sourceAnimationId:RW007.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});
});
test('source strings/slices and markup contain only the two question text definitions; root title and RW003 checklist stay separate',()=>{
  assert.equal(RW007.placementId,'g03-l09-placement-007');
  for(const s of RW007.segments){assert.equal(s.slices.map(x=>x.sourceRunText.slice(x.start,x.endExclusive)).join(''),s.text);}
  assert.deepEqual([...new Set(RW007_BINDING.blocks.flatMap(b=>b.sourceTextIds))],['character-65/run-0','character-65/run-1','character-65/run-2','character-65/run-3','character-72/run-0','character-72/run-1']);
  assert.doesNotMatch(markup(384),/Geometry: Your World|Measurement|symmetry-letter|data-native-rw-checklist|✓/);
  assert.equal((markup(384).match(/<button /g)||[]).length,4);assert.ok(markup(384).includes('data-source-button-id="68"'));
});
test('native button click passes current trigger and source stop disposition; close/resume are owned by the host',()=>{
  const calls:unknown[]=[];const element=Rw007NativeSurface({snapshot:snapshot(384),figure:null,onLessonHostRequest:(request,options)=>{calls.push([request,options]);}});
  const buttons:React.ReactElement<any>[]=[];
  function walk(node:any){if(Array.isArray(node)){node.forEach(walk);return;}if(isValidElement(node)){if(node.type==='button')buttons.push(node as React.ReactElement<any>);walk((node.props as any).children);}}
  walk(element);assert.equal(buttons.length,4);
  const trigger={id:'keyboard-activated-source-term'};buttons[0].props.onClick({currentTarget:trigger});
  assert.deepEqual(calls,[[rw007TermRequest('two',snapshot(384)),{trigger}]]);
  for(const b of buttons){assert.equal(b.props.type,'button');assert.equal(b.props.onKeyDown,undefined);}
});
