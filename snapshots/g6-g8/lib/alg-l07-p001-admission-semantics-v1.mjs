import assert from 'node:assert/strict';
import {pinFile,readJsonPin,readPin,admissionArtifactPins,admissionSourcePins} from './g678-admission-proof.mjs';

export const P001_ID='shared-alg001-l07-p001';
export const P001_CALIBRATION='g678-alg-l07-p001-current-js-20261003-v1';
export const P001_SWF='cef7d8d01efa3a8cc1f2a6d6e6334213c23892e0375bdac72624fd6979c16821';
export const P001_STREAM='6ac6c824b8877f0365fb3ee878b2ba08e5015c44aa5e33fa3e9acc19dbe2e856';
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const migration=`migrations/${P001_ID}`;
export function assertP001SourceAudio(audio,extracted){
 assert.deepEqual(audio,{kind:'embedded-source-stream-v1',sourceCharacterId:142,extracted});
}
export function validateP001Admission(root,packet,registration){
 const modelPin=pinFile(root,`${migration}/native-v1/source-model-v1.json`),
  model=readJsonPin(root,modelPin),decode=readJsonPin(root,pinFile(root,`${migration}/audit-v1/decode-v1.json`));
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.sourceRoot],
  [1,P001_CALIBRATION,'local-only',sourceRoot]);
 assert.deepEqual(packet.source,{path:'G6-G8-shared/ALG001/L7/IR/L7IR01.swf',bytes:72497,sha256:P001_SWF});
 assert.deepEqual(packet.sourceXml,{path:'G6-G8-shared/ALG001/L7/index.xml',bytes:13727,
  sha256:'5eac052615476e688afc1e69391c17bb0c20db8200e7be3f7ea1f9bb778d85f6'});
 assert.deepEqual(admissionSourcePins(packet),[packet.source,packet.sourceXml]);
 assert.equal(packet.selectedPages.length,1);const page=packet.selectedPages[0],runtime=page.runtime;
 assert.deepEqual([page.animationId,page.placementId,page.assetId,page.sourceSha256,page.moduleCode,
  page.lessonNumber,page.globalPageOrdinal,page.sourceOccurrence,page.sectionCode,
  page.sectionPageOrdinal,page.complexityLane],
  [P001_ID,P001_ID,`swf-${P001_SWF}`,P001_SWF,'ALG001',7,1,1,'IR',1,'behavior-heavy']);
 assert.deepEqual([runtime.frameDomain,runtime.frameCount,runtime.rootFrameCount,
  runtime.rootBeginFrame,runtime.beginFrame,runtime.fps,runtime.stage],
  ['sprite-142',138,10,6,1,12,{width:800,height:600}]);
 assert.equal(runtime.playbackMode,'loop');assert.equal(runtime.hostPlaybackCompletion,false);
 assert.equal(runtime.originalRuntimeTimingAccepted,false);
 assert.deepEqual(runtime.rendererBinding,packet.entry.artifacts);
 assert.equal(packet.entry.artifacts.kind,'maintained-dom-module-v1');
 for(const pin of admissionArtifactPins(packet.entry))readPin(root,pin);
 const member=readJsonPin(root,packet.entry.artifacts.memberManifest),
  run=readJsonPin(root,packet.entry.artifacts.sourceRun);
 assert.equal(member.animationId,P001_ID);assert.equal(member.source.sha256,P001_SWF);
 assert.deepEqual(run.members,[packet.entry.artifacts.memberManifest]);
 for(const pin of member.files)readPin(root,pin);
 assert.deepEqual([model.animationId,model.source.sha256,model.frameDomain,model.frameCount,
  model.rootFrameCount,model.rootEntryFrame,model.fps,model.title],
  [P001_ID,P001_SWF,'sprite-142',138,10,6,12,'Linear and Nonlinear Functions: Introduction']);
 assert.equal(model.frames.length,138);assert.equal(model.stream.blockCount,138);
 assert.equal(model.stream.pin.sha256,P001_STREAM);
 assert(model.frames.every((frame,index)=>frame.frame===index+1&&frame.layers.length===2&&
  frame.layers[0].characterId===140&&frame.layers[1].characterId===141&&
  frame.layers[0].alpha256===frame.layers[1].alpha256&&
  frame.layers[0].scaleX===frame.layers[1].scaleX&&
  frame.layers[0].scaleY===frame.layers[1].scaleY));
 assertP001SourceAudio(packet.sourceAudio,pinFile(root,`${migration}/source-v1/source-stream-142.mp3`));
 assert.deepEqual([decode.pass,decode.sourceBytes,decode.sourceSha256,decode.sampleRate,
  decode.channels,decode.decodedSamples,decode.pcmSha256,decode.contextClosed,
  decode.listeningAccepted,decode.originalRuntimeAccepted],
  [true,57070,P001_STREAM,22050,1,252864,
   '34314aa545cdca1370a0d958143e8dfb90ad20ed5bcd352d9ede8897c93e8405',true,false,false]);
 assert.deepEqual(packet.audio,{trigger:'explicit-user-only',localeAutoplay:false,
  playbackMode:'loop',sourceFrameCount:138,sourceBlockCount:138,
  firstSeekSamples:1673,decodedSamples:252864,sampleRate:22050,
  originalHostTerminationEstablished:false,originalRuntimeTimingAccepted:false,
  listeningAccepted:false,measurement:pinFile(root,`${migration}/audit-v1/decode-v1.json`)});
 assert.equal(registration.calibrationId,P001_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(value=>value===false));
 return {status:'L7 P001 source title loop, embedded stream and explicit-only playback verified'};
}
