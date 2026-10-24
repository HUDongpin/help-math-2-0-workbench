/** P003 source facts and formal proof semantics. No registry or host writes. */
import assert from 'node:assert/strict';
import {readJsonPin,readPin} from './g678-admission-proof.mjs';
export const ID='shared-alg001-l06-p003';
export const CALIBRATION='g678-alg-l06-p003-continuous-20260928-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const RUN_ROOT=`work/g678-shared-page-factory/${CALIBRATION}`;
export const MEMBER_ROOT=`${RUN_ROOT}/members/${ID}`;
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`catalog/g678-admission-v1/${ID}.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/RW/L6RW03.swf',bytes:1220637,sha256:'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6RW03.mp3',bytes:135408,sha256:'d280e8f5e653c165755baf2f8960cfd667f03205d2f9aaafe1820a15d327f89a'};
export const AUDIT={path:'output/alg-l06-p003-audio-alignment-20260928/continuous-v3.json',bytes:320688,sha256:'d3b66115dc1aa6bc61e3d375f475052d646f4f52ea50e544fa9eff4be3b273af'};
export const MAIN={path:'/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt/source-stream.mp3',bytes:263640,sha256:'91ddead67e2e39640b4fe76493f9764959daba8dab40e0ac2036670103285111'};
export const ARTIFACTS={
 module:{path:`packages/demos/src/modules/${ID}.tsx`,bytes:1097,sha256:'a91a594c1b810868a774114ea905a44aa1fe8f02e573a4759ed4f758ac10639c'},
 timeline:{path:`packages/demos/src/timelines/${ID}.ts`,bytes:1219,sha256:'14860b675965f7d34953c70a7da723b4868cd9017fa59800c4fa7c1bb03b6543'},
 runtime:{path:`${MEMBER_ROOT}/canvas-renderer.js`,bytes:9063233,sha256:'87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c'},
};
export const RUN={path:`${RUN_ROOT}/run-manifest.json`,bytes:5919,sha256:'ac34445e7c353c591d512e5b0fd123907639f8a882803a535ad0e8f28695c5d4'};
export const MEMBER={path:`${MEMBER_ROOT}/member-manifest.json`,bytes:6391,sha256:'a90f2a12fc7a868dc5f3b7f2378535f5146e247e441af3302b5fc006b866877e'};
export const ACCEPTANCE={authoritativeOriginalRuntime:false,fidelityAccepted:false,audioAccepted:false,
 humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
export const RUNTIME={frameDomain:'sprite-154',frameCount:719,rootFrameCount:10,rootBeginFrame:6,
 fps:12,stage:{width:800,height:600},scenario:'source-static-frame',seed:'0',
 canvasRenderer:ARTIFACTS.runtime,hostPlaybackCompletion:false};
export const CONTINUOUS={audit:AUDIT,mp3:MAIN,streamHeadCount:1,blockCount:637,sampleRate:22050,
 decodedSamples:1168128,initialSeekSamples:1673,firstAudioBlockFrame:41,twoRunPlayback:false,
 originalRuntimeAccepted:false,audioAccepted:false};
export const OPTIONAL_SPANISH={source:SA,asset:{...SA,path:`${MEMBER_ROOT}/optional-spanish.mp3`},
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,mainPausedDuringPlayback:true,
 pendingLoadCancellation:true,returnMainSupported:true,startSample:0,audioAccepted:false};

export function validateP003AdmissionSemantics(packet,registration){
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,assetId:`swf-${SOURCE.sha256}`,
  sourceSha256:SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,globalPageOrdinal:3,sourceOccurrence:3,
  sectionCode:'RW',sectionPageOrdinal:2,complexityLane:'behavior-heavy',runtime:RUNTIME}]);
 assert.deepEqual(packet.entry,{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'behavior-heavy',artifacts:ARTIFACTS});
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert.deepEqual(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert.deepEqual(packet.canonicalRun,RUN);assert.deepEqual(packet.canonicalMember,MEMBER);
 return true;
}

export function readP003CanonicalSource(root){
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 const audit=readJsonPin(root,AUDIT),run=readJsonPin(root,RUN),member=readJsonPin(root,MEMBER);
 assert.equal(audit.kind,'alg-l06-p003-continuous-stream-source-audit-v3');
 assert.deepEqual(audit.inputs.source,{...SOURCE,path:`${SOURCE_ROOT}/${SOURCE.path}`});
 assert.equal(audit.sourceStream.frameDomain,'sprite-154');assert.equal(audit.sourceStream.fps,12);
 assert.equal(audit.sourceStream.singleHead.initialLatencySamples,1673);
 assert.deepEqual(audit.sourceStream.fullMp3,{bytes:MAIN.bytes,sha256:MAIN.sha256});
 assert.equal(audit.sourceStream.packetGroups.reduce((n,row)=>n+row.blockCount,0),637);
 assert.equal(audit.decode.sampleCount,1168128);assert.equal(audit.capabilityBoundary.noBlockProvesAudibleSilence,false);
 assert.equal(audit.capabilityBoundary.originalRuntimeAccepted,false);assert.equal(audit.capabilityBoundary.audioAccepted,false);
 assert.deepEqual(run.artifacts,ARTIFACTS);assert.deepEqual(member.artifacts,ARTIFACTS);
 assert.deepEqual(run.member,MEMBER);assert.equal(member.audio.main.mode,'one-natural-continuous-stream');
 assert.equal(member.audio.optionalSpanish.trigger,'explicit-user-only');
 for(const pin of [...Object.values(ARTIFACTS),{...MAIN,path:`${MEMBER_ROOT}/continuous-source.mp3`},
  OPTIONAL_SPANISH.asset,...run.reusedDependencies])readPin(root,pin);
 return {audit,run,member};
}
