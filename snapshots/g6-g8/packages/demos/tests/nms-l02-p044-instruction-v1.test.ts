import test from 'node:test';
import assert from 'node:assert/strict';
import {p044InstructionParts} from '../src/nms-l02-p044-instruction-v1';
import {P044_COPY} from '../src/nms-l02-p044-practice-view-v1';
import {p044PartsLabel} from '../src/nms-l02-p044-partition-v1';
test('both localized instructions preserve all words and bind the two source glossary targets',()=>{
  for(const lang of ['en','es']as const){const text=P044_COPY[lang].instruction,parts=p044InstructionParts(text,lang);assert.equal(parts.map(p=>p.text).join(''),text);assert.deepEqual(parts.filter(p=>p.id).map(p=>p.id),['numerator','fraction']);}
  assert.throws(()=>p044InstructionParts('missing links','en'),/BINDING/);
});
test('one-part labels are singular in both languages',()=>{
  assert.equal(p044PartsLabel(1,'en'),'1 equal part');assert.equal(p044PartsLabel(1,'es'),'1 parte igual');
  assert.equal(p044PartsLabel(2,'en'),'2 equal parts');assert.equal(p044PartsLabel(2,'es'),'2 partes iguales');
});
