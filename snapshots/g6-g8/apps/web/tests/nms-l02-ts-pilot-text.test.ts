import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {p055TextSnapshot,P055_CONTROLS,type P055TextIr} from '../../../packages/demos/src/nms-l02-ts-pilot-text';
import {sourceGlossaryControlsAtFrame} from '../../../packages/demos/src/source-glossary-controls';
const ir=JSON.parse(readFileSync(new URL('../../../output/nms-l02-ts-family-20260927/visual/source-text-ir.json',import.meta.url),'utf8')) as P055TextIr;
test('source entrances keep alpha-zero text suppressed but unavailable to native presentation',()=>{
 const before=p055TextSnapshot(ir,83),entrance=p055TextSnapshot(ir,84),after=p055TextSnapshot(ir,85);
 assert.equal(before.text.some(x=>x.characterId===13),false);
 assert.equal(entrance.text.find(x=>x.characterId===13)?.visible,false);
 assert(entrance.suppressionIds.includes('sprite-26/depth-10/generation-1'));
 assert.equal(after.text.find(x=>x.characterId===13)?.visible,true);
 assert.equal(after.text.find(x=>x.characterId===13)?.alpha,28/256);
});
test('short emphasis generations and source linebreaks survive frame replay',()=>{
 for(const [frame,generation] of [[114,1],[116,2],[118,3]] as const){
  assert(p055TextSnapshot(ir,frame).text.some(x=>x.instanceId===`sprite-26/depth-15/generation-${generation}`));
  assert(!p055TextSnapshot(ir,frame+1).text.some(x=>x.characterId===17));
 }
 const terminal=p055TextSnapshot(ir,351);
 assert.equal(terminal.text.find(x=>x.characterId===20)?.text,'Read the problem and decide what the question\nis asking.');
 assert.equal(terminal.text.find(x=>x.characterId===24)?.text,'Write the question in your own words.');
 assert.deepEqual(p055TextSnapshot(ir,1),p055TextSnapshot(ir,1));
 assert.throws(()=>p055TextSnapshot(ir,352),/P055_TEXT_CONTEXT/);
});
test('dictionary controls follow source instance timing and distinct button identity',()=>{
 assert.equal(sourceGlossaryControlsAtFrame(P055_CONTROLS,83,'sprite-26').length,0);
 assert.deepEqual(sourceGlossaryControlsAtFrame(P055_CONTROLS,84,'sprite-26').map(x=>x.characterId),[15,16]);
 assert.deepEqual(sourceGlossaryControlsAtFrame(P055_CONTROLS,145,'sprite-26').map(x=>x.sourceKeyAttribute),['Restate','Question','Problem']);
});
