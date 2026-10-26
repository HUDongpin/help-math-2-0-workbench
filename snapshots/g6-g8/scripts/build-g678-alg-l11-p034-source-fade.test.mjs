import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from './build-g678-alg-l11-p034-source-fade.mjs';
test('all24 source release scripts derive the same scheduled40-alpha100ms contract',async()=>{
  const data=await build({check:true});assert.equal(data.sourceScripts.length,24);
  assert.deepEqual(data.scheduledFunctions,['fadeOut1','fadeOut2']);
  assert.deepEqual(data.unscheduledDefinitions,['fadeOut3','fadeOut4']);
  assert.equal(data.intervalMs,100);assert.equal(data.alphaDecrementPerTick,40);
});
