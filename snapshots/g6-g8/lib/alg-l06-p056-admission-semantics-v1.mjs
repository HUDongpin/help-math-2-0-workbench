/** P056 walkthrough and terminal-count semantics; independent acceptance stays open. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin} from './g678-admission-proof.mjs';
export const P056_ID='shared-alg001-l06-p056';
export const P056_CALIBRATION='g678-alg-l06-p056-current-js-20261003-v1';
export const P056_SWF='ba6ba691fafbc6bbd2d0a14b4d249c59e7f1569ca8aaddaa778957c6120205d1';
export const P056_CANVAS='9d0fa77a8c1339a4e559a76187c782167d6f351bdc3bae7ff4c3917c42847416';
export function validateP056Admission(root,packet,registration){
 const M=`migrations/${P056_ID}`,modelPin=pinFile(root,`${M}/native-v1/source-model-v1.json`);
 assert.equal(modelPin.sha256,'e41e8877a173cf62bbdb5356b273c61bdd78ac07841c813123d82927fd1eab98');
 const model=readJsonPin(root,modelPin);assert.equal(model.identity.sectionOrdinal,6);
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.source.sha256,packet.sourceXml.sha256],
  [1,P056_CALIBRATION,'local-only',P056_SWF,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c']);
 assert.equal(packet.selectedPages.length,1);const p=packet.selectedPages[0],r=p.runtime;
 assert.deepEqual([p.animationId,p.globalPageOrdinal,p.sectionCode,p.sectionPageOrdinal,p.complexityLane],[P056_ID,56,'TS',6,'behavior-heavy']);
 assert.equal(p.sourceSha256,P056_SWF);
 assert.deepEqual([r.frameDomain,r.frameCount,r.beginFrame,r.quizFrame,r.postQuizFrame,r.rootFrameCount,r.rootBeginFrame,r.fps,r.stage],
  ['sprite-305',818,1,801,802,10,6,12,{width:800,height:600}]);
 assert.equal(r.hostPlaybackCompletion,false);assert.equal(r.originalRuntimeTimingAccepted,false);
 assert.deepEqual(packet.walkthrough.stops,[273,441,590,748]);
 assert.deepEqual(packet.walkthrough.boxes,[[590,250,15,20,249],[748,270,15,20,269]]);
 assert.deepEqual([packet.walkthrough.closeResumesParent,packet.walkthrough.boxAudio,packet.walkthrough.nativeContinueSourceHandler,packet.walkthrough.emptySourceClipMouseHitClaim],[false,false,181,false]);
 assert.deepEqual(packet.quiz.answers,[{letter:'A',value:'22',right:false},{letter:'B',value:'24',right:false},{letter:'C',value:'25',right:true},{letter:'D',value:'39',right:false}]);
 const sourceAnswers=model.answerPlacements.map(a=>({letter:a.textMatches[0].text,value:a.textMatches[1].text,right:a.branch==='right'})).sort((a,b)=>a.letter.localeCompare(b.letter));
 assert.deepEqual(packet.quiz.answers,sourceAnswers);
 assert.deepEqual([packet.quiz.correctAnswer,packet.quiz.wrongIncrement,packet.quiz.firstWrong,packet.quiz.secondWrong,packet.quiz.rightPreservesPriorCount],
  ['C','feedback-terminal','retry-at-801','continue-at-802',true]);
 assert.deepEqual(packet.quiz.branches,[[83,'right',25],[124,'right',27],[51,'right',31],[116,'right',27],[138,'wrong',31],[149,'wrong',29],[160,'wrong',28]]);
 assert.equal(packet.quiz.feedbackHasAuthoredHold,false);assert.equal(packet.quiz.originalHostPairingVerified,false);assert.equal(packet.quiz.inactiveDuplicateSprite223Played,false);
 assert.deepEqual(packet.help,{activeSpriteId:288,inactiveAngleSpriteId:304,sourceCaseResolution:'SWF6-Mc_Popup-and-Mc_PopUp',originalHostPairingVerified:false});
 assert.deepEqual(packet.glossary.sourceKeys,['Value','Function','Input','Output','Table','Pattern','Relation','Evaluate','Substitute','Equation','Solve']);
 assert.deepEqual(packet.audio.activeDomains,['main','83','124','51','116','138','149','160']);
 assert.equal(packet.audio.sourceEmbeddedStreamCount,9);assert.equal(packet.audio.activeEmbeddedStreamCount,8);
 assert.deepEqual(packet.audio.streams.map(p=>p.path),[305,83,124,51,116,138,149,160].map(id=>`${M}/assets/source-stream-${id}.mp3`));
 for(const pin of packet.audio.streams)assert.deepEqual(pin,pinFile(root,pin.path));
 assert.deepEqual([packet.audio.stereoSprites,packet.audio.right116EntrySample,packet.audio.mainFirstBlockFrame,packet.audio.wrong138FirstBlockFrame,packet.audio.emptyNegativeMarkers],[[83,116],3512,14,3,[[51,31,-1953],[160,27,-2093],[305,817,-2223]]]);
 assert.equal(packet.audio.originalTimingAccepted,false);assert.equal(packet.audio.listeningAccepted,false);
 assert.equal(packet.optionalSpanishAudio.source.sha256,'5cc8952addd8da05969c88bee6c1f2563a968056ac787d2cd7a7070e4434ceec');
 assert.deepEqual([packet.optionalSpanishAudio.trigger,packet.optionalSpanishAudio.localeAutoplay,packet.optionalSpanishAudio.mainStreamSpliced],['explicit-user-only',false,false]);
 assert.equal(registration.calibrationId,P056_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.equal(registration.entries[0].artifacts.runtime.sha256,P056_CANVAS);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(x=>x===false));
 return {status:'P056 walkthrough, source controls and feedback semantics verified'};
}
