import test from 'node:test';
import assert from 'node:assert/strict';
import {getCourseG04L03In006FrameState} from '../../modules/course-g04-l03-in-006';
import {getIn006Snapshot} from './snapshot';
import {create,reduce} from './interaction';
const context=(frame:number)=>({frame,rootFrame:6,frameDomain:'sprite-151',scenario:'source-static-frame',lang:'en' as const,seed:0,replay:0});
test('all1054 source frames admit42real bound text blocks with no future instruction or answer',()=>{
 for(let frame=1;frame<=1054;frame++){
  const ctx=context(frame),snapshot=getIn006Snapshot(getCourseG04L03In006FrameState(frame,ctx),ctx);
  assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks.length,42);assert.equal(snapshot.blocks.filter(b=>b.id.startsWith('tick-')).length,31);
  assert(!snapshot.blocks.some(b=>b.text.includes('as many times as you like')));
  const equation=snapshot.blocks.find(b=>b.id==='equation')!;assert.equal(equation.visible,frame>=512&&frame<=628);
 }
});
test('capture state mismatches fail and quiz snapshots include the actual existing reducer state',()=>{
 const ctx=context(1054),state=getCourseG04L03In006FrameState(1054,ctx);
 for(const invalid of [{...ctx,seed:1},{...ctx,lang:'es' as const},{...ctx,frameDomain:'root'},{...ctx,frame:1055},{...ctx,rootFrame:1}])assert.equal(getIn006Snapshot(state,invalid).status,'blocked');
 let interaction=reduce(create(),{type:'place',magnitude:2});
 let snapshot=getIn006Snapshot(state,ctx,interaction);assert.equal(snapshot.blocks.find(b=>b.id==='equation')!.text,'-11 + 2 = -9');
 assert.equal(snapshot.blocks.find(b=>b.id==='correct')!.visible,false);
 interaction=reduce(interaction,{type:'place',magnitude:1});snapshot=getIn006Snapshot(state,ctx,interaction);
 assert.equal(snapshot.blocks.find(b=>b.id==='correct')!.visible,true);
 interaction=reduce(interaction,{type:'feedback-complete'});interaction=reduce(interaction,{type:'new-number'});snapshot=getIn006Snapshot(state,ctx,interaction);
 assert.equal(snapshot.blocks.find(b=>b.id==='prompt')!.text,'−8 to −15');assert.equal(snapshot.blocks.find(b=>b.id==='equation')!.visible,false);
});
