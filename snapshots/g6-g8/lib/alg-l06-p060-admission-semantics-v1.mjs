/** Exact maintained-native quiz semantics and all original question/option roles. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin,readPin,admissionArtifactPins,admissionSourcePins} from './g678-admission-proof.mjs';
export const P060_ID='shared-alg001-l06-p060';
export const P060_CALIBRATION='g678-alg-l06-p060-current-js-20261003-v1';
export const P060_SWF='3228fd031f09bc4f888e35328c4c3ffc1b7a85d430e62af77335fadcd3214832';
const AUDIO_ROOT='G6-G8-shared/ALG001/L6/FQ/';
export function validateP060Admission(root,packet,registration){
 const M=`migrations/${P060_ID}`,modelPin=pinFile(root,`${M}/native-v1/source-model-v1.json`);
 assert.equal(modelPin.sha256,'6e5422eb24aeac0d76138d1733b3d1fd22650cfba51f14ecf0e7258ab4f373a1');
 const model=readJsonPin(root,modelPin),audio=readJsonPin(root,pinFile(root,`${M}/audio-v1/source-role-inventory-v1.json`)),native=readJsonPin(root,pinFile(root,`${M}/native-v1/native-derivation-v1.json`));
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.sourceRoot],[1,P060_CALIBRATION,'local-only','/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware']);
 assert.deepEqual(packet.source,{path:AUDIO_ROOT+'L6FQ02.swf',bytes:48994,sha256:P060_SWF});
 assert.deepEqual(packet.sourceXml,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
 assert.equal(packet.selectedPages.length,1);const p=packet.selectedPages[0],r=p.runtime;
 assert.deepEqual([p.animationId,p.globalPageOrdinal,p.sectionCode,p.sectionPageOrdinal,p.complexityLane,p.sourceSha256],[P060_ID,60,'FQ',2,'behavior-heavy',P060_SWF]);
 assert.deepEqual([r.frameDomain,r.frameCount,r.beginFrame,r.rootFrameCount,r.rootBeginFrame,r.fps,r.stage],['sprite-973',69,1,10,6,12,{width:800,height:600}]);
 assert.equal(r.originalRuntimeTimingAccepted,false);
 assert.deepEqual(r.rendererBinding,packet.entry.artifacts);
 assert.equal(packet.entry.artifacts.kind,'maintained-dom-module-v1');
 for(const pin of admissionArtifactPins(packet.entry))readPin(root,pin);
 const member=readJsonPin(root,packet.entry.artifacts.memberManifest),run=readJsonPin(root,packet.entry.artifacts.sourceRun);
 assert.equal(member.animationId,P060_ID);assert.equal(member.source.sha256,P060_SWF);assert.equal(run.animationId,P060_ID);assert.equal(run.source.sha256,P060_SWF);
 assert.deepEqual(run.members,[packet.entry.artifacts.memberManifest]);for(const pin of member.files)readPin(root,pin);
 assert.deepEqual(packet.quiz,{questionCount:24,sessionQuestionCount:10,choiceHandlers:96,answerKeys:model.questions.map(q=>q.answerKey),questionFrames:model.questions.map(q=>q.questionFrame),reviewFrames:model.questions.map(q=>q.reviewFrame),withoutReplacement:true,reviewOrder:'session-presentation-order',correctMarkerOverridesSelected:true,gradeBands:[[0,3,'Unsatisfactory'],[4,6,'Partially Proficient'],[7,8,'Proficient'],[9,10,'Advanced']],sourceLocalFinishReviewEdgeEstablished:false,sourceResultPlacementFound:false,legacyNetworkCallsExecuted:false,originalRandomTraceAccepted:false,elapsedPolicy:'monotonic-active-frozen-at-ten',reviewEntry:'explicit-modern-control',reviewExit:'local-results',continue:'typed-host-completion'});
 assert.equal(model.questions.length,24);assert.equal(audio.assets.length,240);assert.equal(model.embeddedAudioCount,0);
 assert.deepEqual(packet.sourceAudio,{kind:'question-option-source-audio-v1',sources:audio.assets.map(a=>({...a.source,path:a.source.path.slice(packet.sourceRoot.length+1)}))});
 assert.equal(admissionSourcePins(packet).length,242);
 const roles=new Set();for(const a of audio.assets){
  assert.equal(a.questionFrame,a.question+1);assert.equal(a.owner,'Mc_Quiz_Audio'+(a.choice===null?'':'_'+('ABCD'.indexOf(a.choice)+1)));
  const role=`${a.question}/${a.language}/${a.choice??'question'}`;assert(!roles.has(role));roles.add(role);
  assert.equal(a.source.path,`${packet.sourceRoot}/${AUDIO_ROOT}${a.language==='en'?'EA':'SA'}/Q${a.question}${a.choice??''}.mp3`);
  readPin(root,a.copy);assert.deepEqual([a.source.bytes,a.source.sha256],[a.copy.bytes,a.copy.sha256]);
 }
 assert.deepEqual(packet.audio,{roles:240,questions:24,rolesPerQuestion:5,languages:['en','es'],trigger:'explicit-user-only',localeAutoplay:false,resumeAutoplay:false,reviewPlayback:false,sourceEmbeddedAudioCount:0,originalHostPairingVerified:false,listeningAccepted:false,measurement:pinFile(root,`${M}/audit-v1/browser-decode-v1.json`)});
 assert.deepEqual(packet.native,{questions:24,tables:8,graphs:8,sourceGeometryPlacements:16,allCurvesIndependentlyCrosschecked:true,inventedNumericFunction:false,golfSourceAxis:'E',labelPlacement:'responsive-source-coordinate-rails',derivation:pinFile(root,`${M}/native-v1/native-derivation-v1.json`)});
 assert.equal(native.geometryChecks.length,16);assert(native.geometryChecks.every(c=>c.allCurvesIndependentlyCrosschecked));
 assert.equal(registration.calibrationId,P060_CALIBRATION);assert.equal(registration.entries.length,1);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);assert(Object.values(packet.acceptanceEffects).every(v=>v===false));
 return {status:'P060 native quiz, source roles and explicit adaptations verified'};
}
