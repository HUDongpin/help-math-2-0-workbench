import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {correctNmsL1P003PositionLabel} from './lib/g678-nms-l01-p003-position-label-v1.mjs';
const raw=await readFile('work/g678-shared-page-factory/g678-nms-l01-p003-source-candidate-v1/members/shared-nms002-l01-p003/canvas-renderer.js','utf8');
const corrected=await readFile('work/g678-shared-page-factory/g678-nms-l01-p003-source-candidate-v2/members/shared-nms002-l01-p003/canvas-renderer.js','utf8');
const plan=JSON.parse(await readFile('/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p003-position-label-correction-v1.json'));
function definition(runtime,name){const a=runtime.indexOf(`function ${name}(`);assert(a>=0);return runtime.slice(a,runtime.indexOf('\n}',a)+2);}
test('only the wrong position-label glyph function and its251 source placements change',()=>{
  assert.equal(correctNmsL1P003PositionLabel(raw,plan),corrected);
  const after=definition(corrected,'text58');assert.deepEqual([...after.matchAll(/font14\(ctx,"([^" ]+)",textColor\);/gu)].map(m=>m[1]),['+','1','5']);
  assert.equal(definition(raw,'font14'),definition(corrected,'font14'));assert.equal(definition(raw,'text24'),definition(corrected,'text24'),'the legitimate +5 number-line tick is preserved');
  assert.equal(definition(raw,'text51'),definition(corrected,'text51'));assert.equal(definition(raw,'text57'),definition(corrected,'text57'));
  const reversed=corrected.replace(after,definition(raw,'text58')).replaceAll('place("text58",canvas,ctx,[0.04949951171875,0.0,0.0,0.04949951171875,122.35,-79.95]','place("text58",canvas,ctx,[0.04949951171875,0.0,0.0,0.04949951171875,125.35,-79.95]');
  assert.equal(reversed,raw,'no other source vector, label, timing or color is changed');
});
test('unexpected source text, coordinates, correction target or teaching result fail before transformation',()=>{
  assert.throws(()=>correctNmsL1P003PositionLabel(raw.replace('125.35,-79.95]','125.36,-79.95]'),plan));
  assert.throws(()=>correctNmsL1P003PositionLabel(raw,{...plan,correction:{...plan.correction,modernLabel:'+5'}}));
  assert.throws(()=>correctNmsL1P003PositionLabel(raw,{...plan,positionDerivation:{...plan.positionDerivation,sourceEquationResult:5}}));
});
