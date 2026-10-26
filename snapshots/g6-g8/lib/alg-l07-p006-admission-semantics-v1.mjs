import assert from 'node:assert/strict';
import {readJsonPin,readPin,admissionArtifactPins,admissionSourcePins} from './g678-admission-proof.mjs';

export const P006_ID='shared-alg001-l07-p006';
export const P006_CALIBRATION='g678-alg-l07-p006-current-js-20261003-v1';
export const P006_SWF='72c7f3e0d0fd0a5251214c3511262bf164d983837a5c52e9f1e56d4de96df155';
export const P006_STREAM='eca77ae751726a8b10efb9ef5a33359a810ae089d658346a3253a92ced424b2a';
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const MODEL={"path":"migrations/shared-alg001-l07-p006/native-v1/source-model-v1.json","bytes":14846598,"sha256":"5b1106dbace1af7fb6ae808ff05956e7626274fa7838ad9b3bee447ecc4fde3f"},STREAM={"path":"migrations/shared-alg001-l07-p006/native-v1/stream-model-v1.json","bytes":307640,"sha256":"17d78245a821b19576b9ba5b99605c76a25e05905df7fa84cfe3b30f1c72276c"},GLOSSARY={"path":"migrations/shared-alg001-l07-p006/native-v1/glossary-model-v1.json","bytes":3966,"sha256":"15400d874e9045fb2b066cf85cfc77128d91fa10a03d0a5c3d6a698e7f0a5706"},DECODE={"path":"migrations/shared-alg001-l07-p006/native-v1/decode-native-v1.json","bytes":694,"sha256":"980121bac6f29e5d43750a5602ae3414e0aa0184616f32df34e19c4d12766cd7"};
const SOURCE={path:'G6-G8-shared/ALG001/L7/RW/L7RW06.swf',bytes:1808006,sha256:P006_SWF};
const XML={path:'G6-G8-shared/ALG001/L7/index.xml',bytes:13727,
 sha256:'5eac052615476e688afc1e69391c17bb0c20db8200e7be3f7ea1f9bb778d85f6'};
const EXTRACTED={path:'migrations/shared-alg001-l07-p006/source-v1/source-stream-223.mp3',
 bytes:1219712,sha256:P006_STREAM};
const RUNS=[{firstFrame:6,firstDecodedSample:1695,endDecodedSample:4608},
 {firstFrame:8,firstDecodedSample:5370,endDecodedSample:4503168},
 {firstFrame:1233,firstDecodedSample:4503570,endDecodedSample:6755328}];

/** This page loops. The P003 terminal-stop contract is intentionally absent. */
export function validateP006Admission(root,packet,registration) {
 const model=readJsonPin(root,MODEL),stream=readJsonPin(root,STREAM),
  glossary=readJsonPin(root,GLOSSARY),decode=readJsonPin(root,DECODE);
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.sourceRoot],
  [1,P006_CALIBRATION,'local-only',sourceRoot]);
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(admissionSourcePins(packet),[SOURCE,XML]);
 assert.equal(packet.selectedPages.length,1);
 const page=packet.selectedPages[0],runtime=page.runtime;
 assert.deepEqual([page.animationId,page.placementId,page.assetId,page.sourceSha256,page.moduleCode,
  page.lessonNumber,page.globalPageOrdinal,page.sourceOccurrence,page.sectionCode,
  page.sectionPageOrdinal,page.complexityLane],
  [P006_ID,P006_ID,`swf-${P006_SWF}`,P006_SWF,'ALG001',7,6,6,'RW',5,'behavior-heavy']);
 assert.deepEqual([runtime.frameDomain,runtime.frameCount,runtime.rootFrameCount,runtime.rootBeginFrame,
  runtime.beginFrame,runtime.fps,runtime.stage,runtime.scenario,String(runtime.seed),runtime.language],
  ['sprite-223',1845,10,6,1,12,{width:800,height:600},'source-real-world','0','source-en']);
 assert.equal(runtime.playbackMode,'loop');assert.equal(runtime.hostPlaybackCompletion,false);
 assert.equal(Object.hasOwn(runtime,'terminalStopFrame'),false);
 assert.equal(runtime.originalRuntimeTimingAccepted,false);
 assert.deepEqual(runtime.rendererBinding,packet.entry.artifacts);
 assert.deepEqual([packet.entry.key,packet.entry.module,packet.entry.maturity,packet.entry.complexityLane,
  packet.entry.artifacts.kind],[P006_ID,`./modules/${P006_ID}`,'private-current-js','behavior-heavy','maintained-dom-module-v1']);
 for(const pin of admissionArtifactPins(packet.entry))readPin(root,pin);
 const member=readJsonPin(root,packet.entry.artifacts.memberManifest),
  run=readJsonPin(root,packet.entry.artifacts.sourceRun);
 assert.equal(member.animationId,P006_ID);assert.deepEqual(member.source,SOURCE);
 assert.deepEqual(run.members,[packet.entry.artifacts.memberManifest]);
 assert.deepEqual(member.sourceModel,MODEL);assert.deepEqual(member.streamModel,STREAM);
 assert.deepEqual(member.glossaryModel,GLOSSARY);assert.deepEqual(member.audioMeasurement,DECODE);
 assert.deepEqual(member.runtime,{stage:{width:800,height:600},fps:12,rootFrameCount:10,
  rootBeginFrame:6,frameDomain:'sprite-223',frameCount:1845,playbackMode:'loop',hostPlaybackCompletion:false});
 assert.equal(member.currentJsRegistered,false);assert.equal(member.acceptance,false);
 assert.equal(member.files.length,9);for(const pin of member.files)readPin(root,pin);
 assert.deepEqual([model.animationId,model.source,model.frameDomain,model.frameCount,
  model.rootFrameCount,model.rootEntryFrame,model.fps,model.behavior.playbackMode],
  [P006_ID,SOURCE,'sprite-223',1845,10,6,12,'loop']);
 assert.equal(model.frames.length,1845);assert.equal(model.behavior.sourceHasInputExercise,false);
 assert.deepEqual(model.glossaryButtons.map(b=>[b.characterId,b.key,b.frameRanges]),
  [[220,'Linear function',[[1760,1845]]],[221,'Nonlinear function',[[1760,1845]]]]);
 assert.deepEqual(glossary.entries.map(e=>[e.id,e.sourceKeyAttribute]),
  [['linear-function','Linear function'],['nonlinear-function','Nonlinear function']]);
 assert.deepEqual([stream.animationId,stream.sourceSwfSha256,stream.sourceSha256,stream.sourceBytes,
  stream.sampleRate,stream.channels,stream.sampleCount,stream.blockCount,stream.audioFirstFrame,
  stream.initialSeekSamples,stream.playbackMode,stream.sourceHasNegativeSeek],
  [P006_ID,P006_SWF,P006_STREAM,1219712,44100,1,6755328,1840,6,1695,'loop',false]);
 assert.equal(stream.binaryAndXmlPayloadByteEquivalent,true);assert.deepEqual(stream.segments,RUNS);
 assert.deepEqual(stream.blocks.filter(b=>b.mp3Bytes===0).map(b=>b.frame),[7,1232]);
 assert.deepEqual(stream.emptyNegativeBlocks,[]);
 assert.deepEqual(packet.sourceAudio,{kind:'embedded-source-stream-v1',sourceCharacterId:223,extracted:EXTRACTED});
 readPin(root,EXTRACTED);
 assert.deepEqual([decode.pass,decode.sourceBytes,decode.sourceSha256,decode.sampleRate,decode.channels,
  decode.decodedSamples,decode.pcmSha256,decode.contextClosed,decode.listeningAccepted,decode.originalRuntimeAccepted],
  [true,1219712,P006_STREAM,44100,1,6755328,
   'ec8eb8d25621b0b8b5cf81839b7ec59c8284d6b056c3f8269cc9d728199ca16a',true,false,false]);
 assert.deepEqual(packet.audio,{trigger:'explicit-user-only',localeAutoplay:false,playbackMode:'loop',
  sourceFrameCount:1845,sourceBlockCount:1840,firstAudioFrame:6,firstSeekSamples:1695,
  decodedSamples:6755328,sampleRate:44100,sourceRuns:RUNS,originalRuntimeTimingAccepted:false,
  listeningAccepted:false,spanishImplementation:'not-bound',measurement:DECODE});
 assert.equal(registration.calibrationId,P006_CALIBRATION);assert.equal(registration.entries.length,1);
 assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert(Object.values(packet.acceptanceEffects).every(v=>v===false));
 return {status:'P006 source plans, two glossary terms, 44100Hz three-run stream and looping contract verified'};
}
