import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {literal,compileInstruction} from './build-g678-nms-l01-p044-readable-instruction.mjs';
const placements=JSON.parse(await readFile(new URL('../work/g678-shared-page-factory/g678-nms-l01-p044-source-canvas-v1/source-instance-placements.json',import.meta.url))).placements;
const ids=[17,45,86,87,88,89,91,92,94,95,109,...Array.from({length:14},(_,i)=>111+i),128,280,281,282,283,287,288,291],text={};
for(const id of ids)text[id]=literal(await readFile(new URL(`../work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v1/export/texts/${id}.txt`,import.meta.url),'utf8'));
test('source literal normalization retains currency, multiplication and punctuation',()=>{assert.equal(literal(' A\n--- RECORDSEPARATOR ---\n $40 '),'A $40');assert.throws(()=>literal('A\0'));});
test('actual source produces distinct40x3 and25x5 diagrams with exact endpoints',()=>{const d=compileInstruction(text,placements);assert.deepEqual(d.jeans.jumpEndpoints,[0,40,80,120]);assert.deepEqual(d.help.jumpEndpoints,[0,25,50,75,100,125]);assert.equal(d.equation.numeric,'Total Cost = $40 × 3 = $120');assert.equal(d.help.numeric,'Money Made: $25 × 5 = $125');});
test('source reveal frames do not show teaching summaries before source placements',()=>{assert.deepEqual(compileInstruction(text,placements).reveal,{question:2,questionTask:313,information:450,equation:576,numberLine:698});});
test('changed quantities, missing operator or extra repeat cannot silently alter math',()=>{
  for(const [id,value]of [[92,'Total Cost = $40 3 = $140'],[94,'+'],[128,'$25'],[283,'Money Made: $25 x 4 = $100'],[111,'1']])assert.throws(()=>compileInstruction({...text,[id]:value},placements));
  assert.throws(()=>compileInstruction(text,[...placements,placements.find(p=>p.parentDomain==='sprite-139'&&p.sourceObjectId===128)]));
});
test('source art and all acceptance gates stay separate',()=>{const d=compileInstruction(text,placements);assert.equal(d.sourceVisualModified,false);assert.equal(d.currentJavaScriptRegistered,false);assert.equal(d.productCalibrationPassed,false);assert.equal(d.originalRuntimeAccepted,false);});
