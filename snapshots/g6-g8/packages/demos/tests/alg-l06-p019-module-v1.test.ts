import assert from 'node:assert/strict';
import test from 'node:test';
import module from '../src/modules/shared-alg001-l06-p019';
import {ALG_L06_P019_DRAWING} from '../src/timelines/shared-alg001-l06-p019';
import {P019_TEXT_STATE_SOURCE} from '../src/generated/alg-l06-p019-text-state-v1';

test('P019 module retains six separately timed glossary instances and exact source drawing',()=>{
 assert.equal(module.key,'shared-alg001-l06-p019');
 assert.equal(module.maturity,'private-current-js');
 assert.equal(ALG_L06_P019_DRAWING.mainFrameDomain,'sprite-37');
 assert.equal(ALG_L06_P019_DRAWING.mainFrameCount,351);
 const instances=module.privateAlgL06P019.glossaryInstances;
 assert.equal(new Set(instances.map(row=>row.instanceId)).size,6);
 for(const control of P019_TEXT_STATE_SOURCE.glossaryControls){
  const instance=instances.find(row=>row.instanceId===control.sourceButtonInstanceId);
  assert(instance);assert.equal(instance.key,control.key);
  assert.equal(instance.availableSpans[0][0],control.firstCandidateFrame);
 }
 assert.equal(module.privateAlgL06P019.sourceAudio.length,1);
 assert.notEqual(module.privateAlgL06P019.optionalSpanishAudio.sourceSha256,
  module.privateAlgL06P019.sourceAudio[0].sourceSha256);
});
