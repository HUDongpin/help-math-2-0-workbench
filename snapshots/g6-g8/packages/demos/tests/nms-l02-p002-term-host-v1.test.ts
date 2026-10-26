import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createP002TermHost,p002SourceTerm} from '../src/nms-l02-p002-term-host-v1';
import {getNmsL2P002FrameState} from '../src/nms-l02-p002-timeline-v1';
import type {LessonHostRequest} from '../src/lesson-host-contract';
const state=(frame:number)=>getNmsL2P002FrameState(frame,{seed:0,lang:'en'});
const request=(entryId:string):LessonHostRequest=>({type:'open-keyterm',entryId,sourceAnimationId:'shared-nms002-l02-p002',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});
test('exact source terms require their own visible run and a source-stop request',()=>{
  const host=createP002TermHost();
  for(const [id,before,first] of [['fraction',660,661],['whole',718,719],['group',736,737]] as const){
    assert.equal(host.dispatch(request(id),state(before)).status,'blocked');
    assert.equal(host.dispatch(request(id),state(first)).status,'allowed');
    assert.equal(host.snapshot().keytermEntryId,id);
    assert.equal(host.dispatch({type:'close-keyterm'},state(first)).status,'allowed');
    assert.equal(host.snapshot().keytermEntryId,null);
  }
  assert.equal(host.dispatch(request('constructor'),state(910)).status,'blocked');
  assert.equal(host.dispatch(request('fraction'),state(1)).status,'blocked');
  assert.equal(host.dispatch({type:'open-keyterm',entryId:'fraction'},state(910)).status,'blocked');
  assert.equal(host.dispatch({...request('fraction'),sourceAnimationId:'shared-nms002-l02-p005'} as LessonHostRequest,state(910)).status,'blocked');
  assert.equal(host.dispatch({type:'navigate',targetAnimationId:'shared-nms002-l02-p005'},state(910)).status,'blocked');
  assert.equal(p002SourceTerm('whole')?.definitions.en,'The total number of parts in a fraction.');
  assert.equal(p002SourceTerm('__proto__'),undefined);
});
