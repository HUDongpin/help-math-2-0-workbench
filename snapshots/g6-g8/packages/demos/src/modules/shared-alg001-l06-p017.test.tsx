import assert from 'node:assert/strict';
import test from 'node:test';
import module from './shared-alg001-l06-p017';
import {ALG_L06_P017_DRAWING} from '../timelines/shared-alg001-l06-p017';
import {P017_TIMELINE} from '../alg-l06-p017-timeline-v1';

test('P017 maintained module binds exact source drawing, audio and six exact glossary contracts',()=>{
 assert.equal(module.key,'shared-alg001-l06-p017');
 assert.equal(module.maturity,'private-current-js');
 assert.equal(module.privateAlgL06P017.drawing,ALG_L06_P017_DRAWING);
 assert.equal(module.privateAlgL06P017.sourceAudio.length,1);
 assert.equal(module.privateAlgL06P017.textSource.textDefinitions.length,20);
 assert.equal(module.privateAlgL06P017.glossary.Function.firstAvailableFrame,20);
 assert.equal(module.privateAlgL06P017.glossary.Function.firstFullHitFrame,20);
 assert.deepEqual(Object.keys(module.privateAlgL06P017.glossary),['Equation','Sentence','Function','Rule','Output variable','Input variable']);
 assert.equal(P017_TIMELINE.frameDomain,'sprite-42');
 assert.equal(ALG_L06_P017_DRAWING.mainFrameCount,721);
 assert.equal(ALG_L06_P017_DRAWING.assetSha256,
  'b78c06d8e3f0111ae28ee7d4c90f98381001fe3b3fa0e9e92d6b3ab24bda6a7f');
 assert.equal(module.privateAlgL06P017.textSource.policy.originalRuntimeAccepted,false);
});
