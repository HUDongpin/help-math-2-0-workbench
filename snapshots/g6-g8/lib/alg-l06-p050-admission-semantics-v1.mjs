/** Source-grounded game admission. Independent acceptance remains open. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin} from './g678-admission-proof.mjs';
export const P050_ID='shared-alg001-l06-p050';
export const P050_CALIBRATION='g678-alg-l06-p050-current-js-20261003-v1';
export const P050_SWF='4353f9cbd7e60043baa8f59c7f5193fcd930778ace4b918ab56f2953f306937e';
export const P050_CANVAS='d384ef32b39c8bd1e013c667653bcb5a643cbe703be6c145b87ce87a752347ff';
export function validateP050Admission(root,packet,registration){
 const M=`migrations/${P050_ID}`,modelPin=pinFile(root,`${M}/native-v1/source-model-v1.json`);
 assert.equal(modelPin.sha256,'928ca5042b469795ae207921638d44ffd212034e8eb33e954d943b1721c05fb7');
 const model=readJsonPin(root,modelPin),native=readJsonPin(root,pinFile(root,`${M}/native-v1/native-bindings-v1.json`));
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.source.sha256,packet.sourceXml.sha256],
  [1,P050_CALIBRATION,'local-only',P050_SWF,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c']);
 assert.equal(packet.selectedPages.length,1);const p=packet.selectedPages[0],r=p.runtime;
 assert.deepEqual([p.animationId,p.globalPageOrdinal,p.sectionCode,p.sectionPageOrdinal,p.complexityLane],
  [P050_ID,50,'GS',1,'behavior-heavy']);
 assert.equal(p.sourceSha256,P050_SWF);
 assert.deepEqual([r.frameDomain,r.frameCount,r.beginFrame,r.firstQuestionFrame,r.finalFrame,r.rootFrameCount,r.rootBeginFrame,r.fps,r.stage],
  ['sprite-489',674,662,663,673,10,6,12,{width:800,height:600}]);
 assert.equal(r.hostPlaybackCompletion,false);assert.equal(r.originalRuntimeTimingAccepted,false);
 assert.deepEqual(packet.game.behavior,model.behavior);
 assert.deepEqual(packet.game.questions,model.questions.map(q=>({number:q.number,frame:q.frame,correctChoice:q.correctChoice,
  options:q.options.map(o=>({letter:o.letter,instance:o.instance,buttonId:o.buttonId,correct:o.correct,wrongText:o.wrongText,unboundParentWrongCall:o.unboundParentWrongCall}))})));
 assert.deepEqual(packet.game.questions.map(q=>q.correctChoice),['D','A','B','D','C','A','B','C','D','B']);
 const b=packet.game.behavior;
 assert.deepEqual([b.selection,b.questionCount,b.correctPoints,b.wrongPoints],['random-without-replacement',10,10,0]);
 assert.deepEqual([b.wrong.spriteId,b.wrong.startFrame,b.wrong.popupFirstFrame,b.wrong.holdFrame,b.wrong.closeJump,b.wrong.endFrame,b.wrong.branchCount,b.wrong.allBranchesSameSprite],
  [380,2,17,23,24,28,3,true]);
 assert.deepEqual([b.score.spriteId,b.score.startFrame,b.score.normalEndFrame,b.score.hundredStartFrame,b.score.hundredEndFrame],[265,2,10,11,20]);
 assert.equal(b.directions.repeatsAudio,false);assert.equal(b.finalStart.reinitializesGame,false);
 assert.deepEqual([packet.game.retryWrong,packet.game.modernReplayResetsAll,packet.game.unresolvedCallsExecuted],[false,true,false]);
 assert.equal(native.sourceModelSha256,modelPin.sha256);assert.equal(native.sourceSwfSha256,P050_SWF);
 assert.equal(native.questions.length,10);assert.equal(native.originalFontFidelity,false);
 assert.deepEqual(packet.audio.activeDomains,['main','wrong','correct358','correct432','correct479']);
 assert.equal(packet.audio.embeddedStreamCount,6);assert.equal(packet.audio.unselectedSpriteId,345);
 assert.deepEqual(packet.audio.streams.map(p=>[p.path,p.sha256]),[
  [`${M}/assets/source-stream-489-main.mp3`,'e507c0e9eda0e12349bab2db8f88d2ce3f943d397028c22c0714e38a04ba29e9'],
  [`${M}/assets/source-stream-380-wrong.mp3`,'1c3e481dcaa018b19c5b24eaa05b11d88e7cb75a640acd8a06133ccf3ff0c7e5'],
  [`${M}/assets/source-stream-358-correct-358.mp3`,'ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8'],
  [`${M}/assets/source-stream-432-correct-432.wav`,'f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8'],
  [`${M}/assets/source-stream-479-correct-479.mp3`,'3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7']]);
 assert.deepEqual([packet.audio.correct432Adpcm.sourceRate,packet.audio.correct432Adpcm.skippedSourceSamples,
  packet.audio.correct432Adpcm.decodedRate,packet.audio.correct432Adpcm.decodedSample],[5512,459,11025,919]);
 assert.equal(packet.audio.originalTimingAccepted,false);assert.equal(packet.audio.listeningAccepted,false);
 assert.equal(packet.optionalSpanishAudio.source.sha256,'518d91f553c9ecf52f2a2eb1228a7193e1b2230a6357df382314a7d94c78583b');
 assert.deepEqual([packet.optionalSpanishAudio.trigger,packet.optionalSpanishAudio.localeAutoplay,packet.optionalSpanishAudio.mainStreamSpliced],['explicit-user-only',false,false]);
 assert.equal(registration.calibrationId,P050_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.equal(registration.entries[0].artifacts.runtime.sha256,P050_CANVAS);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(x=>x===false));
 return {status:'P050 source random graph game semantics verified'};
}
