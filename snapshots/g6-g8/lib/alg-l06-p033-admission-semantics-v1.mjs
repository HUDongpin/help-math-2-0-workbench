/** Source two-attempt semantics; independent acceptance remains open. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin} from './g678-admission-proof.mjs';
export const P033_ID='shared-alg001-l06-p033';
export const P033_CALIBRATION='g678-alg-l06-p033-current-js-20261003-v1';
export const P033_SWF='fb11fd842f3f0948cf5b00bf3b7b63bde86f0af9bf41bb2f9e3a762a1daad071';
export const P033_CANVAS='750d595b47eb3aa518df51e3b9bbb552e8fe27c8ff0a6a4d23d464fca615f465';
export function validateP033Admission(root,packet,registration){
 const M=`migrations/${P033_ID}`,modelPin=pinFile(root,`${M}/native-v1/source-model-v1.json`);
 assert.equal(modelPin.sha256,'ee17508b0ce795e1d4eab49686f293e3d24a7bfeaec58c8b8caf3681695510fa');
 const model=readJsonPin(root,modelPin);
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.source.sha256,packet.sourceXml.sha256],
  [1,P033_CALIBRATION,'local-only',P033_SWF,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c']);
 assert.equal(packet.selectedPages.length,1);const p=packet.selectedPages[0],r=p.runtime;
 assert.deepEqual([p.animationId,p.globalPageOrdinal,p.sectionCode,p.sectionPageOrdinal,p.complexityLane],[P033_ID,33,'IN',4,'behavior-heavy']);
 assert.equal(p.sourceSha256,P033_SWF);
 assert.deepEqual([r.frameDomain,r.frameCount,r.beginFrame,r.quizFrame,r.postQuizFrame,r.rootFrameCount,r.rootBeginFrame,r.fps,r.stage],
  ['sprite-190',385,1,52,53,10,6,12,{width:800,height:600}]);
 assert.equal(r.hostPlaybackCompletion,false);assert.equal(r.originalRuntimeTimingAccepted,false);
 assert.deepEqual(packet.quiz.answers,model.answerPlacements.map(a=>({letter:a.letter,answer:a.answer})));
 assert.deepEqual(packet.quiz.answers,[{letter:'A',answer:1},{letter:'B',answer:2},{letter:'C',answer:3},{letter:'D',answer:4}]);
 assert.deepEqual([packet.quiz.correctAnswer,packet.quiz.wrongIncrement,packet.quiz.firstWrong,packet.quiz.secondWrong,packet.quiz.closeTarget],
  [1,'on-release','retry-at-52','continue-at-53','nested-popup-parent-feedback']);
 assert.deepEqual(packet.quiz.branches,[[78,'right',25],[119,'right',27],[46,'right',31],[111,'right',27],
  [147,'wrong',31,22,16,23],[161,'wrong',29,23,16,24],[175,'wrong',28,20,13,21]]);
 assert.equal(packet.quiz.unboundEnableButtonExecuted,false);assert.equal(packet.quiz.originalHostPairingVerified,false);
 assert.deepEqual(packet.glossary.sourceKeys,['Set','Ordered pair','Function','Value']);
 assert.deepEqual(packet.audio.activeDomains,['main','78','119','46','111','147','161','175']);
 assert.deepEqual(packet.audio.streams.map(p=>p.path),[190,78,119,46,111,147,161,175].map(id=>`${M}/assets/source-stream-${id}.mp3`));
 for(const pin of packet.audio.streams)assert.deepEqual(pin,pinFile(root,pin.path));
 assert.deepEqual([packet.audio.right111EntrySample,packet.audio.wrong147FirstBlockFrame,packet.audio.emptyNegativeMarkers],[3511,3,[[46,31,-1953],[175,27,-2093]]]);
 assert.equal(packet.audio.originalTimingAccepted,false);assert.equal(packet.audio.listeningAccepted,false);
 assert.equal(packet.optionalSpanishAudio.source.sha256,'172f4d7a8f90e4e3d98487048eae702fdd4debf6706248d705f5c5dc55008220');
 assert.deepEqual([packet.optionalSpanishAudio.trigger,packet.optionalSpanishAudio.localeAutoplay,packet.optionalSpanishAudio.mainStreamSpliced],['explicit-user-only',false,false]);
 assert.equal(registration.calibrationId,P033_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.equal(registration.entries[0].artifacts.runtime.sha256,P033_CANVAS);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(x=>x===false));
 return {status:'P033 two-attempt source semantics verified'};
}
