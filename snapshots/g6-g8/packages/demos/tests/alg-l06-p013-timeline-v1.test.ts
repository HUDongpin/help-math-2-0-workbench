import assert from 'node:assert/strict';
import test from 'node:test';
import {P013_TIMELINE,p013FrameState} from '../src/alg-l06-p013-timeline-v1';

test('P013 source placements stay distinct and controls wait for complete mask reveal',()=>{
 assert.equal(P013_TIMELINE.frameDomain,'sprite-140');
 assert.equal(P013_TIMELINE.mainFrameCount,372);
 assert.equal(P013_TIMELINE.glossary.Input.sourceFirstFrame,258);
 assert.equal(P013_TIMELINE.glossary.Output.sourceFirstFrame,297);
 assert.deepEqual(p013FrameState(257).availableGlossaryKeys,[]);
 assert.deepEqual(p013FrameState(258).availableGlossaryKeys,[]);
 assert.deepEqual(p013FrameState(295).availableGlossaryKeys,[]);
 assert.deepEqual(p013FrameState(296).availableGlossaryKeys,['Input']);
 assert.deepEqual(p013FrameState(297).availableGlossaryKeys,['Input']);
 assert.deepEqual(p013FrameState(364).availableGlossaryKeys,['Input']);
 assert.deepEqual(p013FrameState(365).availableGlossaryKeys,['Input','Output']);
 assert.equal(p013FrameState(372).hostHeldTerminal,true);
 assert.equal(p013FrameState(371).hostHeldTerminal,false);
 assert.throws(()=>p013FrameState(373),/P013_INVALID_MAIN_FRAME/u);
});
