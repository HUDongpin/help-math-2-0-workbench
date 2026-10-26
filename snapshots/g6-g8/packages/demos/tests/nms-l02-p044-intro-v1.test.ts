import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p044IntroFrame} from '../src/nms-l02-p044-intro-v1';
test('source partition replacement beats retain the authored overshoot and correction',()=>{
  const source=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p044/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
  const main=source.timelines.find((t:{timelineId:string})=>t.timelineId==='sprite-243');
  for(const [frame,character,parts]of [[72,54,2],[81,57,3],[86,58,5],[91,62,4],[132,66,4]]){
    assert.ok(main.events.some((e:{frame:number;characterId:number;kind:string})=>e.frame===frame&&e.characterId===character&&e.kind==='place'));
    assert.equal(p044IntroFrame(frame).parts,parts);
  }
  assert.deepEqual(p044IntroFrame(131).selected,[]);assert.deepEqual(p044IntroFrame(132).selected,[2]);
  assert.deepEqual(p044IntroFrame(322).target,{numerator:1,denominator:4});
  assert.deepEqual(p044IntroFrame(323).target,{numerator:1,denominator:5});assert.equal(p044IntroFrame(323).parts,1);
});
test('all introframes are bounded; exact click frames and poststop modern hold are explicit',()=>{
  const clicks=[];for(let f=1;f<=361;f++){const s=p044IntroFrame(f);assert.ok(s.selected.every(n=>n>=1&&n<=s.parts));if(s.sourceClick)clicks.push(f);assert.equal(s.visible,f>=5);}
  assert.deepEqual(clicks,[292,323]);assert.equal(p044IntroFrame(361).tailHold,true);
  assert.equal(p044IntroFrame(7).target,null);assert.deepEqual(p044IntroFrame(8).target,{numerator:1,denominator:4});
  assert.throws(()=>p044IntroFrame(362),/FRAME/);assert.throws(()=>p044IntroFrame(0),/FRAME/);
});
