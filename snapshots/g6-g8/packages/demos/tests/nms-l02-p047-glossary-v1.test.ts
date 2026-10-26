import test from 'node:test';
import assert from 'node:assert/strict';
import {P047_GLOSSARY as original} from '../src/generated/nms-l02-p047-glossary-v1';
import {P047_GLOSSARY as display} from '../src/nms-l02-p047-glossary-v1';
import {P047_COPY} from '../src/nms-l02-p047-copy-v1';
import {p047InstructionParts} from '../src/nms-l02-p047-instruction-v1';
test('only Whole has a documented teaching correction; original definitions remain intact',()=>{
 assert.equal(display.length,5);for(const entry of display){const source=original.find(e=>e.id===entry.id)!;if(entry.id==='whole'){assert.equal(entry.teachingCorrection,'whole-unit-not-denominator-count');assert.notDeepEqual(entry.definitions,source.definitions);assert.equal(source.definitions.en,'The total number of parts in a fraction.');}else assert.deepEqual(entry.definitions,source.definitions);}
});
test('main and help glossary links preserve exact bilingual copy and source roles',()=>{
 for(const language of ['en','es']as const){for(const [field,context]of [['instruction','main'],['helpDefinition','definition']]as const){const copy=P047_COPY[language][field],parts=p047InstructionParts(copy,language,context);assert.equal(parts.map(p=>p.text).join(''),copy);const ids=[...new Set(parts.map(p=>p.id).filter(Boolean))].sort();assert.deepEqual(ids,context==='main'?['fraction','number-line','position']:['fraction','number-line','part','whole']);}}
 assert.equal(p047InstructionParts('fractional positioning partly wholesome','en','definition').some(p=>p.id),false);
});
