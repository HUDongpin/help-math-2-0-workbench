import assert from 'node:assert/strict';import test from 'node:test';
import {getCourseG04L03Ti004FrameState} from '../src/modules/course-g04-l03-ti-004';
import {getTi004TextSnapshot} from '../src/modern-lessons/g4-l3-ti004-text';
import {createCourseG04L03Ti004LeastToGreatestDragState as initial} from '../src/timelines/course-g04-l03-ti-004-least-to-greatest-drag-interaction';
import source from '../src/modern-lessons/generated/g4-l3-ti004-question.json';
const context=(frame:number)=>({frame,frameDomain:'sprite-274',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});
const state=(frame:number)=>getCourseG04L03Ti004FrameState(frame,context(frame));
test('intro retains source reveal, alternating emphasis and seven positions',()=>{
 assert.equal(source.frames[19].instruction,'');assert(source.frames[69].instruction.length>0);
 assert.equal(source.frames[83].emphasis,'least');assert.equal(source.frames[84].emphasis,null);
 assert.equal(source.frames[89].line?.sourceShapeId,180);assert.equal(source.frames[90].line,null);
 assert.equal(source.frames[115].line?.sourceShapeId,193);assert.equal(source.frames[117].emphasis,'greatest');
 const full=getTi004TextSnapshot(state(123),context(123));assert.equal(full.status,'ready');assert.equal(full.blocks.filter(b=>b.id.startsWith('instruction')).map(b=>b.text).join(''),'Drag and drop each number so that the numbers are in order from least to greatest.');assert.equal(full.blocks.filter(b=>b.id.startsWith('card-')&&b.visible).length,7);
});
test('question binds full help only when open and rejects source/context mismatch',()=>{
 const c=context(124),s=state(124);assert(getTi004TextSnapshot(s,c).blockers.includes('interaction-state-required'));
 const closed=getTi004TextSnapshot(s,c,initial());assert.equal(closed.status,'ready');assert.equal(closed.blocks.filter(b=>b.id.startsWith('help-tick-')&&b.visible).length,0);
 const opened=getTi004TextSnapshot(s,c,initial(),true);assert.equal(opened.blocks.filter(b=>b.id.startsWith('help-tick-')&&b.visible).length,21);assert.equal(opened.blocks.find(b=>b.id==='help-tick--10')?.text,'−10');
 assert.equal(getTi004TextSnapshot({...s,rootFrame:7},c,initial()).status,'blocked');assert.equal(getTi004TextSnapshot({...s,sourceSwfSha256:'bad'},c,initial()).status,'blocked');
});
