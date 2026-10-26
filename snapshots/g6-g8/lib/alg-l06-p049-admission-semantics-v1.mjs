/** P049's authored fixed-feedback function-table question; engineering admission only. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin} from './g678-admission-proof.mjs';
export const P049_ID='shared-alg001-l06-p049';
export const P049_CALIBRATION='g678-alg-l06-p049-current-js-20261002-v1';
export const P049_SWF='33f90f5897fa60939fb7015f60c8789d98aad3dca65ad39cb04dac4fededb3a6';
export const P049_CANVAS='298611af1cccf27353df77f9b4d7b4fdbebe7992e1d0950c974dba83a85fc3d3';
export function validateP049Admission(root,packet,registration){
 const model=readJsonPin(root,pinFile(root,`migrations/${P049_ID}/native-v1/source-model-v2.json`));
 const binding=readJsonPin(root,pinFile(root,`migrations/${P049_ID}/native-v1/native-bindings-v3.json`));
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.source.sha256,packet.sourceXml.sha256],
  [1,P049_CALIBRATION,'local-only',P049_SWF,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c']);
 assert.equal(packet.selectedPages.length,1);const p=packet.selectedPages[0],r=p.runtime;
 assert.deepEqual([p.animationId,p.globalPageOrdinal,p.sectionCode,p.sectionPageOrdinal,p.complexityLane],
  [P049_ID,49,'TI',8,'behavior-heavy']);
 assert.deepEqual([r.frameDomain,r.frameCount,r.quizHoldFrame,r.resumeFrame,r.terminalFrame,r.rootFrameCount,r.rootBeginFrame,r.fps,r.stage],
  ['sprite-327',401,159,160,401,10,6,12,{width:800,height:600}]);
 assert.equal(p.sourceSha256,P049_SWF);assert.equal(r.hostPlaybackCompletion,false);assert.equal(r.originalRuntimeTimingAccepted,false);
 assert.equal(model.correctChoice,'B');assert.equal(binding.sourceSha256,P049_SWF);
 assert.deepEqual(packet.quiz.choices,model.answerPlacements.map(x=>({letter:x.letter,instance:x.instance,buttonId:x.buttonId,branch:x.branch})));
 assert.deepEqual(packet.quiz.behavior,model.sourceBehavior);assert.deepEqual(binding.behavior,model.sourceBehavior);
 assert.deepEqual([packet.quiz.correctChoice,packet.quiz.firstWrongReturnsToQuiz,packet.quiz.secondWrongResumesMain,packet.quiz.rightPreservesPriorWrongCount],['B',true,true,true]);
 const w=packet.quiz.behavior.wrong4,c=packet.quiz.behavior.right4;
 assert.deepEqual([w.spriteId,w.startFrame,w.popupFirstFrame,w.holdFrame,w.closeButtonId,w.closeJump,w.terminalFrame,w.firstText,w.secondText],
  [302,2,15,22,290,23,28,'Use the values in one of the rows of the table to test your answer.Try again.','Use the values in one of the rows of the table to test your answer.']);
 assert.deepEqual([c.spriteId,c.startFrame,c.terminalFrame,c.preservesPriorWrongCount],[192,2,25,true]);
 assert.equal(packet.quiz.behavior.randomFeedbackCalled,false);
 assert.deepEqual(packet.quiz.optionVisibility,Object.fromEntries(Object.entries(binding.options).map(([letter,row])=>[letter,row.visibleRanges])));
 assert.equal(packet.audio.embeddedStreamCount,3);assert.deepEqual(packet.audio.activeDomains,['main','wrong4','right4']);
 assert.equal(binding.sourceModelSha256,'8faf55033928e8449c96fe3a9c1a7504b7f119119f2f90a4f81d8caf309b11ff');
 assert.deepEqual(Object.entries(binding.options).map(([letter,row])=>[letter,row.branch]),[['A','wrong4'],['B','right4'],['C','wrong4'],['D','wrong4']]);
 assert.deepEqual(binding.table.rows.map(row=>row.map(cell=>cell.text)),[['5','8,800'],['10','17,600'],['15','26,400']]);
 assert.deepEqual(packet.quiz.sourceTable,model.sourceTable);
 assert.deepEqual(packet.audio.streams.map(p=>[p.path,p.sha256]),[
  [`migrations/${P049_ID}/assets/source-stream-327-main.mp3`,'3641957aaae5efe149e318409f35c8de196dea06124a15df2abdb42fb5424b55'],
  [`migrations/${P049_ID}/assets/source-stream-302-wrong4.mp3`,'f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1'],
  [`migrations/${P049_ID}/assets/source-stream-192-right4.wav`,'f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8']]);
 const adpcm=model.streams.find(s=>s.spriteId===192),a=packet.audio.right4Adpcm;
 assert.equal(adpcm.codec,'swf-adpcm');assert.equal(adpcm.head.compression,'1');
 assert.equal(adpcm.blocks.length,13);assert(adpcm.blocks.every(b=>b.samples===459&&b.payloadBytes===290));
 assert.deepEqual([a.raw.sha256,a.wav.sha256,a.sourceRate,a.skippedSourceSamples,a.entryFrame,a.decodedRate,a.decodedSample],
  ['e5c99e029d9df7717bc7755b5f4660841ad3f453d10bb8dbc8010d69b5a653b6','f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8',5512,459,2,11025,919]);
 assert.equal(a.decodedSample,Math.ceil(a.skippedSourceSamples*a.decodedRate/a.sourceRate));
 assert.equal(a.resamplerPhaseVerified,false);
 assert.equal(packet.audio.originalTimingAccepted,false);assert.equal(packet.audio.listeningAccepted,false);
 assert.equal(packet.optionalSpanishAudio.source.sha256,'936b059a5355877c47f2bda90da6d4de47d7145371d97ef50cd9f1e267254150');
 assert.deepEqual([packet.optionalSpanishAudio.trigger,packet.optionalSpanishAudio.localeAutoplay,packet.optionalSpanishAudio.mainStreamSpliced],['explicit-user-only',false,false]);
 assert.equal(registration.calibrationId,P049_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.equal(registration.entries[0].artifacts.runtime.sha256,P049_CANVAS);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(x=>x===false));
 return {status:'P049 source function-table/fixed feedback semantics verified'};
}
