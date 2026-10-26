/** P057 walkthrough and terminal-count semantics; independent acceptance stays open. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin} from './g678-admission-proof.mjs';
export const P057_ID='shared-alg001-l06-p057';
export const P057_CALIBRATION='g678-alg-l06-p057-current-js-20261003-v1';
export const P057_SWF='03782ef6ed4587d61db4476648d0d69b5ad158f84b2f6a0ba747605a6712fb31';
export const P057_CANVAS='b2d839c31d4907b168e45a2607896f714731b88943d3cb93b10b11528634b401';
export function validateP057Admission(root,packet,registration){
 const M=`migrations/${P057_ID}`,modelPin=pinFile(root,`${M}/native-v1/source-model-v1.json`);
 assert.equal(modelPin.sha256,'82d884431bcdf4d231546fa743e6f7696028422aa0ea5c3f183119e34528fdbf');
 const model=readJsonPin(root,modelPin);assert.equal(model.identity.sectionOrdinal,7);
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.source.sha256,packet.sourceXml.sha256],
  [1,P057_CALIBRATION,'local-only',P057_SWF,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c']);
 assert.equal(packet.selectedPages.length,1);const p=packet.selectedPages[0],r=p.runtime;
 assert.deepEqual([p.animationId,p.globalPageOrdinal,p.sectionCode,p.sectionPageOrdinal,p.complexityLane],[P057_ID,57,'TS',7,'behavior-heavy']);
 assert.equal(p.sourceSha256,P057_SWF);
 assert.deepEqual([r.frameDomain,r.frameCount,r.beginFrame,r.quizFrame,r.postQuizFrame,r.rootFrameCount,r.rootBeginFrame,r.fps,r.stage],
  ['sprite-312',856,1,839,840,10,6,12,{width:800,height:600}]);
 assert.equal(r.hostPlaybackCompletion,false);assert.equal(r.originalRuntimeTimingAccepted,false);
 assert.deepEqual(packet.walkthrough.stops,[313,481,629,788]);
 assert.deepEqual(packet.walkthrough.boxes,[[629,259,15,20,258],[788,267,15,20,266]]);
 assert.deepEqual([packet.walkthrough.closeResumesParent,packet.walkthrough.boxAudio,packet.walkthrough.nativeContinueSourceHandler,packet.walkthrough.emptySourceClipMouseHitClaim],[false,false,189,false]);
 assert.deepEqual(packet.quiz.answers,[{letter:'A',value:'y = 2x + 5',right:false},{letter:'B',value:'y = 3x + 8',right:false},{letter:'C',value:'y = 4x + 5',right:false},{letter:'D',value:'y = 5x – 4',right:true}]);
 const sourceAnswers=model.answerPlacements.map(a=>({letter:a.textMatches[0].text,value:a.textMatches[1].text,right:a.branch==='right'})).sort((a,b)=>a.letter.localeCompare(b.letter));
 assert.deepEqual(packet.quiz.answers,sourceAnswers);
 assert.deepEqual([packet.quiz.correctAnswer,packet.quiz.wrongIncrement,packet.quiz.firstWrong,packet.quiz.secondWrong,packet.quiz.rightPreservesPriorCount],
  ['D','feedback-terminal','retry-at-839','continue-at-840',true]);
 assert.deepEqual(packet.quiz.branches,[[77,'right',27],[93,'right',28],[52,'right',28],[105,'right',25],[157,'wrong',28],[117,'wrong',29],[129,'wrong',28]]);
 assert.equal(packet.quiz.feedbackHasAuthoredHold,false);assert.equal(packet.quiz.originalHostPairingVerified,false);assert.equal(packet.quiz.inactiveDuplicateSprite233Played,false);
 assert.deepEqual(packet.help,{activeSpriteId:295,inactiveAngleSpriteId:311,sourceCaseResolution:'SWF6-Mc_Popup-and-Mc_PopUp',originalHostPairingVerified:false});
 assert.deepEqual(packet.glossary.sourceKeys,['Equation','Function','Function table','Input','Output','Relation','Value']);
 assert.deepEqual(packet.audio.activeDomains,['main','77','93','52','105','157','117','129']);
 assert.equal(packet.audio.sourceEmbeddedStreamCount,9);assert.equal(packet.audio.activeEmbeddedStreamCount,8);
 assert.deepEqual(packet.audio.streams.map(p=>p.path),[312,77,93,52,105,157,117,129].map(id=>`${M}/assets/source-stream-${id}.${id===105?'wav':'mp3'}`));
 for(const pin of packet.audio.streams)assert.deepEqual(pin,pinFile(root,pin.path));
 assert.deepEqual([packet.audio.stereoSprites,packet.audio.adpcm105EntrySample,packet.audio.mainFirstBlockFrame,packet.audio.right77FirstBlockFrame,packet.audio.emptyNegativeMarkers],[[],919,14,3,[[77,27,-1984],[312,855,-2333]]]);
 assert.deepEqual(packet.audio.adpcm,{spriteId:105,sourceRate:5512,decodedRate:11025,entryFrame:2,skippedSourceSamples:459,decodedSamples:11935,resamplerPhaseVerified:false});
 assert.equal(packet.quiz.rightTerminalOrder,'reset-feedback-before-parent-play');
 assert.equal(packet.helpSourceComparisonRetained,'y = 18 + 5 ≠ 11');
 assert.equal(packet.audio.originalTimingAccepted,false);assert.equal(packet.audio.listeningAccepted,false);
 assert.equal(packet.optionalSpanishAudio.source.sha256,'2310e2c254f8acd45c47637176cd44b35ef3616cfa5a929cc182df628927ed0a');
 assert.deepEqual([packet.optionalSpanishAudio.trigger,packet.optionalSpanishAudio.localeAutoplay,packet.optionalSpanishAudio.mainStreamSpliced],['explicit-user-only',false,false]);
 assert.equal(registration.calibrationId,P057_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.equal(registration.entries[0].artifacts.runtime.sha256,P057_CANVAS);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(x=>x===false));
 return {status:'P057 walkthrough, source controls and feedback semantics verified'};
}
