import assert from 'node:assert/strict';
import test from 'node:test';
import module from '../src/modules/shared-alg001-l06-p018';
import {ALG_L06_P018_DRAWING} from '../src/timelines/shared-alg001-l06-p018';
import {P018_TEXT_STATE_SOURCE} from '../src/generated/alg-l06-p018-text-state-v1';

test('P018 module retains seven separately timed glossary instances and exact source drawing',()=>{
 assert.equal(module.key,'shared-alg001-l06-p018');
 assert.equal(module.maturity,'private-current-js');
 assert.equal(ALG_L06_P018_DRAWING.mainFrameDomain,'sprite-32');
 assert.equal(ALG_L06_P018_DRAWING.mainFrameCount,648);
 const instances=module.privateAlgL06P018.glossaryInstances;
 assert.equal(new Set(instances.map(row=>row.instanceId)).size,7);
 for(const control of P018_TEXT_STATE_SOURCE.glossaryControls){
  const instance=instances.find(row=>row.instanceId===control.sourceButtonInstanceId);
  assert(instance);assert.equal(instance.key,control.key);
  assert.equal(instance.availableSpans[0][0],control.firstCandidateFrame);
 }
 assert.equal(module.privateAlgL06P018.sourceAudio.length,1);
 assert.notEqual(module.privateAlgL06P018.optionalSpanishAudio.sourceSha256,
  module.privateAlgL06P018.sourceAudio[0].sourceSha256);
});
