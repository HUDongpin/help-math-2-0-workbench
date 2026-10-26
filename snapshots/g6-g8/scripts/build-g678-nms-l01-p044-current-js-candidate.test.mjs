import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePreparedEvidence,wrapperSource,EFFECTS} from './build-g678-nms-l01-p044-current-js-candidate.mjs';
const b=JSON.parse(await readFile(new URL('../output/playwright/g678-nms-l01-p044-product-v9-prepared-bound/evidence.json',import.meta.url)));
const m=JSON.parse(await readFile(new URL('../work/g678-shared-page-factory/g678-nms-l01-p044-prepared-module-metadata-v1/metadata.json',import.meta.url)));
test('actual prepared browser and module evidence bind exact one-page runtime',()=>{const runtime=validatePreparedEvidence(b,m);assert.equal(runtime.key,'shared-nms002-l01-p044');assert.equal(runtime.interactiveStops.length,5);});
test('early admission, wrong first frame, image mismatch or missing failure gate cannot pass',()=>{
  for(const mutate of[x=>x.loadGates[0].before.admitted=true,x=>x.loadGates[3].after.firstVisualFrame=2,x=>x.preparedDefaultPixels[0].differingBytes=1,x=>x.loadGates.pop(),x=>x.inputsUnchanged=false]){const copy=structuredClone(b);mutate(copy);assert.throws(()=>validatePreparedEvidence(copy,m));}
});
test('wrapper inherits awaited module and cannot promote independent gates',()=>{assert.ok(wrapperSource().includes("from '../g678-nms-l01-p044-prepared-module'"));assert.ok(wrapperSource().includes('CURRENT_JAVASCRIPT_REGISTERED=false'));assert.ok(Object.values(EFFECTS).every(v=>v===false));});
