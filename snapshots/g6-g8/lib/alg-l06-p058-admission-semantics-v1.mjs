/** P058 walkthrough and terminal-count semantics; independent acceptance stays open. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin} from './g678-admission-proof.mjs';
export const P058_ID='shared-alg001-l06-p058';
export const P058_CALIBRATION='g678-alg-l06-p058-current-js-20261003-v1';
export const P058_SWF='79bd9d4896d7b297a4df928711c92f1bd2b9f78b976f8399fc9e640d9704c4d3';
export const P058_CANVAS='bd89e6fa6d8209ae0fe12c0a1388cac2944122e8d01d6491c3fb5db4cefb1494';
export function validateP058Admission(root,packet,registration){
 const M=`migrations/${P058_ID}`,modelPin=pinFile(root,`${M}/native-v1/source-model-v1.json`);
 assert.equal(modelPin.sha256,'0241cb5d6f0427442f56d6ac9a5188e56f9c2a7394134ab2b897092003f22c04');
 const model=readJsonPin(root,modelPin);assert.equal(model.identity.sectionOrdinal,8);
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.source.sha256,packet.sourceXml.sha256],
  [1,P058_CALIBRATION,'local-only',P058_SWF,'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c']);
 assert.equal(packet.selectedPages.length,1);const p=packet.selectedPages[0],r=p.runtime;
 assert.deepEqual([p.animationId,p.globalPageOrdinal,p.sectionCode,p.sectionPageOrdinal,p.complexityLane],[P058_ID,58,'TS',8,'behavior-heavy']);
 assert.equal(p.sourceSha256,P058_SWF);
 assert.deepEqual([r.frameDomain,r.frameCount,r.beginFrame,r.quizFrame,r.postQuizFrame,r.rootFrameCount,r.rootBeginFrame,r.fps,r.stage],
  ['sprite-285',951,1,934,935,10,6,12,{width:800,height:600}]);
 assert.equal(r.hostPlaybackCompletion,false);assert.equal(r.originalRuntimeTimingAccepted,false);
 assert.deepEqual(packet.walkthrough.stops,[403,571,720,878]);
 assert.deepEqual(packet.walkthrough.boxes,[[720,242,15,20,241],[878,252,15,20,251]]);
 assert.deepEqual([packet.walkthrough.closeResumesParent,packet.walkthrough.boxAudio,packet.walkthrough.nativeContinueSourceHandler,packet.walkthrough.emptySourceClipMouseHitClaim],[false,false,176,false]);
 assert.deepEqual(packet.quiz.answers,[{letter:'A',value:'The strength is staying the same.',right:false},{letter:'B',value:'The strength is getting higher.',right:false},{letter:'C',value:'The strength is getting lower.  ',right:true},{letter:'D',value:'The strength is at its lowest.',right:false}]);
 const sourceAnswers=model.answerPlacements.map(a=>({letter:a.textMatches[0].text,value:a.textMatches[1].text,right:a.branch==='right'})).sort((a,b)=>a.letter.localeCompare(b.letter));
 assert.deepEqual(packet.quiz.answers,sourceAnswers);
 assert.deepEqual([packet.quiz.correctAnswer,packet.quiz.wrongIncrement,packet.quiz.firstWrong,packet.quiz.secondWrong,packet.quiz.rightPreservesPriorCount],
  ['C','feedback-terminal','retry-at-934','continue-at-935',true]);
 assert.deepEqual(packet.quiz.branches,[[97,'right',33],[76,'right',32],[62,'right',31],[36,'right',28],[129,'wrong',31],[115,'wrong',28],[140,'wrong',29]]);
 assert.equal(packet.quiz.feedbackHasAuthoredHold,false);assert.equal(packet.quiz.originalHostPairingVerified,false);assert.equal(packet.quiz.inactiveDuplicateSprite218Played,false);
 assert.deepEqual(packet.help,{activeSpriteId:268,inactiveAngleSpriteId:284,sourceCaseResolution:'SWF6-Mc_Popup-and-Mc_PopUp',originalHostPairingVerified:false});
 assert.deepEqual(packet.glossary.sourceKeys,['Graph','Function','Time']);
 assert.deepEqual(packet.audio.activeDomains,['main','97','76','62','36','129','115','140']);
 assert.equal(packet.audio.sourceEmbeddedStreamCount,9);assert.equal(packet.audio.activeEmbeddedStreamCount,8);
 assert.deepEqual(packet.audio.streams.map(p=>p.path),[285,97,76,62,36,129,115,140].map(id=>`${M}/assets/source-stream-${id}.mp3`));
 for(const pin of packet.audio.streams)assert.deepEqual(pin,pinFile(root,pin.path));
 assert.deepEqual([packet.audio.stereoSprites,packet.audio.frame1Stream36EntrySample,packet.audio.mainFirstBlockFrame,packet.audio.frame3StreamIds,packet.audio.emptyNegativeMarkers],[[],3511,14,[76,97,129],[[62,31,-1953],[285,951,-1853]]]);
 assert.equal(packet.quiz.rightTerminalOrder,'parent-play-before-reset-feedback');
 assert.deepEqual(packet.graph,{sourceShapeId:156,sourceCurveSegments:15,quadraticSegments:5,sourceXmlCurveCrosschecked:true,numericFunctionInvented:false});
 assert.equal(packet.audio.originalTimingAccepted,false);assert.equal(packet.audio.listeningAccepted,false);
 assert.equal(packet.optionalSpanishAudio.source.sha256,'5e3fa2f4bfc3c534102315ec592c9547b667fb5d19198f2d653a3c9768636c7a');
 assert.deepEqual([packet.optionalSpanishAudio.trigger,packet.optionalSpanishAudio.localeAutoplay,packet.optionalSpanishAudio.mainStreamSpliced],['explicit-user-only',false,false]);
 assert.equal(registration.calibrationId,P058_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.equal(registration.entries[0].artifacts.runtime.sha256,P058_CANVAS);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(x=>x===false));
 return {status:'P058 walkthrough, source controls and feedback semantics verified'};
}
