import assert from 'node:assert/strict';
import test from 'node:test';
import {ALG_L06_P020_DRAWING as canonical} from '../src/timelines/shared-alg001-l06-p020';
import {ALG_L06_P020_DRAWING as moduleDrawing} from '../src/modules/shared-alg001-l06-p020';
import {P020_TIMELINE} from '../src/alg-l06-p020-timeline-v1';

test('P020 canonical timeline is the same source drawing as maintained module',()=>{
 assert.deepEqual(canonical,moduleDrawing);
 assert.equal(canonical.animationId,P020_TIMELINE.animationId);
 assert.equal(canonical.mainFrameDomain,P020_TIMELINE.frameDomain);
 assert.equal(canonical.mainFrameCount,172);
 assert.equal(P020_TIMELINE.quizHoldFrame,58);
 assert.deepEqual(Object.keys(P020_TIMELINE.glossary),['Input','Function','Output']);
 assert.deepEqual(Object.keys(P020_TIMELINE.acknowledgmentActions),['60','74','89']);
});
