import assert from 'node:assert/strict';import test from 'node:test';
import {getCourseG04L03Ti003FrameState} from '../src/modules/course-g04-l03-ti-003';
import {getTi003TextSnapshot} from '../src/modern-lessons/g4-l3-ti003-text';
import {createCourseG04L03Ti003NumberLineDragState as initial,reduceCourseG04L03Ti003NumberLineDrag as reduce} from '../src/timelines/course-g04-l03-ti-003-number-line-drag-interaction';
const context=(frame:number)=>({frame,frameDomain:'sprite-126',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});
const state=(frame:number)=>getCourseG04L03Ti003FrameState(frame,context(frame));
test('native snapshot respects source reveal and exact source identity',()=>{
 const early=getTi003TextSnapshot(state(20),context(20));assert.equal(early.status,'ready');assert.equal(early.blocks.find(b=>b.id==='instruction-first')?.visible,false);
 const full=getTi003TextSnapshot(state(100),context(100));assert.equal(full.status,'ready');assert.equal(full.blocks.filter(b=>b.id.startsWith('instruction')).map(b=>b.text).join(''),'Drag and drop each number to its correct position on the number line.');assert.equal(full.blocks.filter(b=>b.id.startsWith('tick-')&&b.visible).length,25);assert.equal(full.blocks.find(b=>b.id==='tick--12')?.text,'−12');
 assert.equal(getTi003TextSnapshot({...state(100),sourceSwfSha256:'bad'},context(100)).status,'blocked');
});
test('question snapshots require actual interaction and distinguish wrong and complete',()=>{
 assert(getTi003TextSnapshot(state(139),context(139)).blockers.includes('interaction-state-required'));
 let s=initial();s=reduce(s,{type:'drop-card',cardId:'Scr_1',targetId:'Mc_Tar_2'});const wrong=getTi003TextSnapshot(state(139),context(139),s);assert.equal(wrong.status,'ready');assert.equal(wrong.blocks.find(b=>b.id==='wrong-feedback')?.text,'Number lines show numbers in order. Try again.');assert.equal(wrong.blocks.find(b=>b.id==='wrong-feedback')?.visible,true);assert.equal(wrong.blocks.find(b=>b.id==='complete-feedback')?.visible,false);
 s=initial();for(const id of [1,2,3,4,5,6] as const){s=reduce(s,{type:'drop-card',cardId:`Scr_${id}`,targetId:`Mc_Tar_${id}`});s=reduce(s,{type:'feedback-complete'});}assert.equal(getTi003TextSnapshot(state(139),context(139),s).blocks.find(b=>b.id==='complete-feedback')?.visible,true);
});
test('question keeps main ticks visible and help exposes its separate full signed axis',()=>{
 const closed=getTi003TextSnapshot(state(139),context(139),initial());
 assert.equal(closed.blocks.filter(b=>b.id.startsWith('tick-')&&b.visible).length,25);
 assert.equal(closed.blocks.filter(b=>b.id.startsWith('help-tick-')&&b.visible).length,0);
 const opened=getTi003TextSnapshot(state(139),context(139),initial(),true);
 assert.deepEqual(opened.blocks.filter(b=>b.id.startsWith('help-tick-')&&b.visible).map(b=>b.text),Array.from({length:21},(_,i)=>i<10?`−${10-i}`:String(i-10)));
});
