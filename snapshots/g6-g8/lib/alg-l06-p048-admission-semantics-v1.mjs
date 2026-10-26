/** P048's authored fixed-feedback graph question; engineering admission only. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin} from './g678-admission-proof.mjs';
export const P048_ID='shared-alg001-l06-p048';
export const P048_CALIBRATION='g678-alg-l06-p048-current-js-20261002-v1';
export const P048_SWF='03a8334e6349a9e80b47bdea4d2c5ada40f635570be5d63f70e8706a03761780';
export const P048_CANVAS='a27fa6d830bab0f90c653e62f89e069c2301b570a7e34e309592bbf552e0733f';
export function validateP048Admission(root,packet,registration){
 const model=readJsonPin(root,pinFile(root,`migrations/${P048_ID}/native-v1/source-model-v1.json`));
 const binding=readJsonPin(root,pinFile(root,`migrations/${P048_ID}/native-v1/native-bindings-v2.json`));
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.source.sha256,packet.sourceXml.sha256],
  [1,P048_CALIBRATION,'local-only',P048_SWF,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c']);
 assert.equal(packet.selectedPages.length,1);const p=packet.selectedPages[0],r=p.runtime;
 assert.deepEqual([p.animationId,p.globalPageOrdinal,p.sectionCode,p.sectionPageOrdinal,p.complexityLane],
  [P048_ID,48,'TI',7,'behavior-heavy']);
 assert.deepEqual([r.frameDomain,r.frameCount,r.quizHoldFrame,r.resumeFrame,r.terminalFrame,r.rootFrameCount,r.rootBeginFrame,r.fps,r.stage],
  ['sprite-348',327,224,225,327,10,6,12,{width:800,height:600}]);
 assert.equal(p.sourceSha256,P048_SWF);assert.equal(r.hostPlaybackCompletion,false);assert.equal(r.originalRuntimeTimingAccepted,false);
 assert.equal(model.correctChoice,'A');assert.equal(binding.sourceSha256,P048_SWF);
 assert.deepEqual(packet.quiz.choices,model.answerPlacements.map(x=>({letter:x.letter,instance:x.instance,buttonId:x.buttonId,branch:x.branch})));
 assert.deepEqual(packet.quiz.behavior,model.sourceBehavior);assert.deepEqual(binding.behavior,model.sourceBehavior);
 assert.deepEqual([packet.quiz.correctChoice,packet.quiz.firstWrongReturnsToQuiz,packet.quiz.secondWrongResumesMain,packet.quiz.rightPreservesPriorWrongCount],['A',true,true,true]);
 const w=packet.quiz.behavior.wrong4,c=packet.quiz.behavior.right4;
 assert.deepEqual([w.spriteId,w.startFrame,w.popupFirstFrame,w.holdFrame,w.closeButtonId,w.closeJump,w.terminalFrame,w.firstText,w.secondText],
  [304,2,16,22,297,23,31,'Study the graph carefully.Try again.','Study the graph carefully.']);
 assert.deepEqual([c.spriteId,c.startFrame,c.terminalFrame,c.preservesPriorWrongCount],[217,2,25,true]);
 assert.equal(packet.quiz.behavior.randomFeedbackCalled,false);
 assert.deepEqual(packet.quiz.optionVisibility,Object.fromEntries(Object.entries(binding.options).map(([letter,row])=>[letter,row.visibleRanges])));
 assert.equal(packet.audio.embeddedStreamCount,3);assert.deepEqual(packet.audio.activeDomains,['main','wrong4','right4']);
 assert.equal(packet.optionalSpanishAudio.source.sha256,'b76a62e5c4af35ab3ba277c2e186bf2d148a319b63c8fe9a9f954ae15057e5fd');
 assert.deepEqual([packet.optionalSpanishAudio.trigger,packet.optionalSpanishAudio.localeAutoplay,packet.optionalSpanishAudio.mainStreamSpliced],['explicit-user-only',false,false]);
 assert.equal(registration.calibrationId,P048_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.equal(registration.entries[0].artifacts.runtime.sha256,P048_CANVAS);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(x=>x===false));
 return {status:'P048 source graph/fixed feedback semantics verified'};
}
