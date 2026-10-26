import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {FROZEN_GLOSSARY_IDS,FROZEN_GLOSSARY_FREEZE,readFrozenGlossaryPackage,validateFrozenGlossaryReplacement} from '../lib/g678-frozen16-glossary-authority.server';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const packet=readFrozenGlossaryPackage(ROOT);
const read=(file:string)=>{const b=readFileSync(path.join(ROOT,file));return{path:file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),value:JSON.parse(b.toString())};};
const input={predecessor:packet.predecessor,candidate:packet.candidate,freeze:read(FROZEN_GLOSSARY_FREEZE.path)};
test('exact source, generated modules and all eight replacement entries have current physical closure',()=>{
  assert.deepEqual(packet.entries.map(e=>e.key),FROZEN_GLOSSARY_IDS);assert(packet.physicalPaths.length>100);
  assert.equal(validateFrozenGlossaryReplacement(input).entries.length,8);
});
for(const kind of ['source','controls','other-page','acceptance'] as const)test(`reject ${kind} mutation instead of expanding successor authority`,()=>{
  const bad=structuredClone(input);
  const changed=bad.freeze.value.selectedPages.find((p:any)=>p.animationId===FROZEN_GLOSSARY_IDS[0]);
  if(kind==='source')changed.sourceSha256='0'.repeat(64);
  if(kind==='controls')changed.frozenGlossarySuccessor.controls=[];
  if(kind==='other-page')bad.freeze.value.selectedPages.find((p:any)=>!FROZEN_GLOSSARY_IDS.includes(p.animationId)).runtime.frameCount++;
  if(kind==='acceptance')bad.freeze.value.productCalibrationPassed=true;
  const b=Buffer.from(JSON.stringify(bad.freeze.value,null,2)+'\n');bad.freeze.bytes=b.length;bad.freeze.sha256=createHash('sha256').update(b).digest('hex');
  assert.throws(()=>validateFrozenGlossaryReplacement(bad),/AUTHORITY_INVALID/);
});
