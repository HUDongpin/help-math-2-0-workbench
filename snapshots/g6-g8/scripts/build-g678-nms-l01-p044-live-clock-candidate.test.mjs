import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PINS,WITNESSES,mapHistoricalInput,validateRepairEvidence,wrapperSource} from './build-g678-nms-l01-p044-live-clock-candidate.mjs';
const doc=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
const [browser,metadata,base,authority,failure]=await Promise.all(['browser','metadata','base','authority','failure'].map(k=>doc(PINS[k].path)));
test('exact repaired browser metadata preserves the old runtime and independently retains the failed registered run',()=>{
  const r=validateRepairEvidence(browser,metadata,base,authority,failure);assert.equal(r.key,'shared-nms002-l01-p044');assert.equal(r.playbackEndFrame,756);
});
test('repair evidence cannot borrow a successful status, change a stop, or erase the registered failure',()=>{
  for(const mutate of[(b,m,f)=>b.loadGates[0].before.admitted=true,(b,m,f)=>m.actual.metadata.playbackEndFrame=759,(b,m,f)=>f.status='passed',(b,m,f)=>f.records.at(-1).errors=[]]){
    const [b,m,f]=structuredClone([browser,metadata,failure]);mutate(b,m,f);assert.throws(()=>validateRepairEvidence(b,m,base,authority,f));}
});
test('only two exact mutable predecessor inputs may map to witnesses',()=>{for(const w of WITNESSES){assert.deepEqual(mapHistoricalInput(w.capturedInput),w.physicalWitness);
  assert.throws(()=>mapHistoricalInput({...w.capturedInput,bytes:1}));assert.throws(()=>mapHistoricalInput({...w.capturedInput,sha256:'0'.repeat(64)}));}
  assert.deepEqual(mapHistoricalInput(PINS.browser),PINS.browser);
});
test('generated wrapper selects only the repair module and never claims registration or acceptance',()=>{const s=wrapperSource();assert.match(s,/prepared-module-v3/);assert.match(s,/CURRENT_JAVASCRIPT_REGISTERED=false/);assert.doesNotMatch(s,/CURRENT_JAVASCRIPT_REGISTERED=true/);});
