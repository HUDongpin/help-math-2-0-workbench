import assert from 'node:assert/strict';
import test from 'node:test';
import module from './shared-alg001-l06-p016';
import {ALG_L06_P016_DRAWING} from '../timelines/shared-alg001-l06-p016';
import {P016_TIMELINE} from '../alg-l06-p016-timeline-v1';

test('P016 maintained module binds exact source drawing, audio and Function contract',()=>{
 assert.equal(module.key,'shared-alg001-l06-p016');
 assert.equal(module.maturity,'private-current-js');
 assert.equal(module.privateAlgL06P016.drawing,ALG_L06_P016_DRAWING);
 assert.equal(module.privateAlgL06P016.sourceAudio.length,2);
 assert.equal(module.privateAlgL06P016.textSource.textDefinitions.length,19);
 assert.equal(module.privateAlgL06P016.glossary.Function.firstAvailableFrame,72);
 assert.equal(module.privateAlgL06P016.glossary.Function.firstFullHitFrame,null);
 assert.equal(P016_TIMELINE.frameDomain,'sprite-139');
 assert.equal(ALG_L06_P016_DRAWING.mainFrameCount,815);
 assert.equal(ALG_L06_P016_DRAWING.assetSha256,
  '3f6fddbf841d5cac7e28f1112971faed148c89160a8529ba81a30e12ab146b3a');
 assert.equal(module.privateAlgL06P016.textSource.policy.originalRuntimeAccepted,false);
});
