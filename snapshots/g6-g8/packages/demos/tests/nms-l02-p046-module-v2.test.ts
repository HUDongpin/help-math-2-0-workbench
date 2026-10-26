// Current typed successor; preserve all v1 behavior assertions and pass the shared runtime context.
import test from 'node:test';
import assert from 'node:assert/strict';
import animationModule from '../src/modules/g678-nms-l02-native-equivalent-fraction-p046';
import {isP046RuntimeModule} from '../../../apps/web/lib/nms-l02-p046-runtime-access';
test('actual product module passes exact runtime binding with root metadata separate from main domain',()=>{
 assert(isP046RuntimeModule(animationModule));assert.equal(animationModule.movie.frameCount,10);assert.equal(animationModule.runtime?.defaultFrameDomain,'sprite-205');assert.equal(animationModule.textPresentation?.playbackEndFrameByDomain?.['sprite-205'],654);
 const state=animationModule.getFrameState(706,{frame:706,frameDomain:'sprite-205',scenario:'source-inspection',lang:'en',seed:0});assert.equal(state.state.phase,'ready');
 const snapshot=animationModule.textPresentation!.getSnapshot(state,{frame:706,frameDomain:'sprite-205',scenario:'source-inspection',lang:'en',seed:0});assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks.find(b=>b.id==='complete')!.visible,false);
});
