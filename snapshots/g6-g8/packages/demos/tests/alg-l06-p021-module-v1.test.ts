import assert from 'node:assert/strict';
import test from 'node:test';
import module from '../src/modules/shared-alg001-l06-p021';
import {ALG_L06_P021_DRAWING} from '../src/timelines/shared-alg001-l06-p021';
import {P021_TEXT_STATE_SOURCE} from '../src/generated/alg-l06-p021-text-state-v1';

test('P021 module retains six separately timed glossary instances and exact source drawing',()=>{
 assert.equal(module.key,'shared-alg001-l06-p021');
 assert.equal(module.maturity,'private-current-js');
 assert.equal(ALG_L06_P021_DRAWING.mainFrameDomain,'sprite-43');
 assert.equal(ALG_L06_P021_DRAWING.mainFrameCount,377);
 const instances=module.privateAlgL06P021.glossaryInstances;
 assert.equal(new Set(instances.map(row=>row.instanceId)).size,6);
 for(const control of P021_TEXT_STATE_SOURCE.glossaryControls){
  const instance=instances.find(row=>row.instanceId===control.sourceButtonInstanceId);
  assert(instance);assert.equal(instance.key,control.key);
  assert.equal(instance.availableSpans[0][0],control.firstCandidateFrame);
 }
 assert.equal(module.privateAlgL06P021.sourceAudio.length,1);
 assert.notEqual(module.privateAlgL06P021.optionalSpanishAudio.sourceSha256,
  module.privateAlgL06P021.sourceAudio[0].sourceSha256);
});
