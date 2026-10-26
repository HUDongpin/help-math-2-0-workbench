import assert from 'node:assert/strict';
import test from 'node:test';
import module, {ALG_L06_P020_DRAWING} from '../src/modules/shared-alg001-l06-p020';
import {P020_TIMELINE} from '../src/alg-l06-p020-timeline-v1';
import {P020_TEXT_STATE_SOURCE,p020TextState} from '../src/generated/alg-l06-p020-text-state-v1';

test('P020 canonical entry keeps source main, seven branches and three glossary keys separate',()=>{
 assert.equal(module.key,'shared-alg001-l06-p020');
 assert.equal(module.maturity,'private-current-js');
 assert.equal(ALG_L06_P020_DRAWING.mainFrameDomain,'sprite-162');
 assert.equal(ALG_L06_P020_DRAWING.mainFrameCount,172);
 assert.equal(P020_TIMELINE.quizHoldFrame,58);
 assert.equal(module.privateAlgL06P020.sourceAudio.length,8);
 assert.deepEqual(Object.keys(module.privateAlgL06P020.glossary),
  ['Input','Function','Output']);
 for(const control of P020_TEXT_STATE_SOURCE.glossaryControls){
  const term=P020_TIMELINE.glossary[control.key];
  assert.equal(term.instanceId,control.sourceButtonInstanceId);
  assert.equal(term.actionSha256,control.sourceActionSha256);
  assert.equal(term.firstFullHitFrame,control.firstCandidateFrame);
 }
 assert.notEqual(module.privateAlgL06P020.optionalSpanishAudio.sourceSha256,
  module.privateAlgL06P020.sourceAudio.find(row=>row.id==='main-1')?.sourceSha256);
 const final=p020TextState(172);
 assert.deepEqual(final.options.filter(option=>option.visible).map(option=>
  [option.option,option.value]),[['B','-2']]);
});
