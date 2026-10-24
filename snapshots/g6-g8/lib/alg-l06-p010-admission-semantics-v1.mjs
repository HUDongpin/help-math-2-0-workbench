/** P010 source facts for one-page local Current-JS admission. No writes. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p010';
export const CALIBRATION='g678-alg-l06-p010-current-js-20260928-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/RW/L6RW09.swf',bytes:114334,
 sha256:'96552f567037f39868d01b1ba77311858caf2efcdb141ef64ed0878a6c48ce14'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6RW09.mp3',bytes:301056,
 sha256:'903c1bd16cebf9f1ceda0d9b8a47905cae20f380bb857fa33fc855a6db350275'};
export const SOURCE_AUDIT={path:'migrations/shared-alg001-l06-p010/audit/source-v1/source-audit-v1.json',bytes:8394,
 sha256:'14a34b6527a77dc374f650ccad9f7bd9e4c1c8bc6e23198f93eb2a82e6f7de64'};
export const AUDIO_AUDIT={path:'migrations/shared-alg001-l06-p010/audit/audio-v1/audio-source-audit-v1.json',bytes:69985,
 sha256:'142f375cbb3fb8344409b859fd5d918df9002cb63b23735b04d77a0504d48775'};
export const TEXT_AUDIT={path:'migrations/shared-alg001-l06-p010/audit/text-state-v1/text-state-audit-v1.json',bytes:2331,
 sha256:'465f4d94eaf83b16d504e65db22663103ba45d328a97959c16bfa47c5f53ade1'};
export const SA_HOST_AUDIT={path:'migrations/shared-alg001-l06-p010/audit/sa-host-v1/sa-host-disposition-v1.json',bytes:10890,
 sha256:'b5d6ae0f80df570ea341a4c8f00308ebe563eb26898d2247e1f0cd92b42045f6'};
export const CANVAS_MANIFEST={path:'output/alg-l06-p010-canvas-v1/canvas-manifest.json',bytes:3547,
 sha256:'e4c55c7f30adec8a60ed3848076fe87783987b9ea373364c7a9703aeb50fd079'};
export const MAIN={path:'migrations/shared-alg001-l06-p010/audit/audio-v1/continuous-source-v1.mp3',bytes:124280,
 sha256:'f5c71e9d066a0d2ce37be7afd20c3d1f8182b5c2c7b6a06a38c131074093fa89'};
export const CANVAS_SOURCE={path:'output/alg-l06-p010-canvas-v1/canvas-renderer.js',bytes:1154661,
 sha256:'0a1aa913455ff358ceec7674e7f73fa6c27f59a054fc8d43f41e7bc91b8720c1'};
export const ARTIFACT_PATHS=Object.freeze({
 module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`,
});
export const ARTIFACTS=Object.freeze({
 module:{path:ARTIFACT_PATHS.module,bytes:2576,
  sha256:'b52cd0525a0b7deb44691ad090d584409d39588cb9556a3039896143c8b03418'},
 timeline:{path:ARTIFACT_PATHS.timeline,bytes:1322,
  sha256:'e2fb9e5d84c34723e20a570216c455d5a01c1163240ba4822db786734ad5fdc2'},
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
});
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='interactive-understood';
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,mp3:MAIN,streamHeadCount:1,
 blockCount:300,firstAudioBlockFrame:4,lastAudioBlockFrame:303,sampleRate:22050,
 decodedSamples:550656,initialSeekSamples:1673,zeroPayloadFrames:[5],
 oneCyclePlayback:true,syntheticSilenceForZeroPayloadFrame:false,
 originalRuntimeAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,trigger:'explicit-user-only',
 localeAutoplay:false,mainStreamSpliced:false,mainPausedDuringPlayback:true,
 pendingLoadCancellation:true,returnMainSupported:true,startSample:0,audioAccepted:false});

const sourcePin=(pin)=>({path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
function collect(root,pin,local,external){
 if(!pin||typeof pin.path!=='string')throw Error('P010_SOURCE_INPUT_PIN_MISSING');
 const exact=sourcePin(pin);
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 if(exact.path.startsWith(`${root}/`)){
  const relative={...exact,path:path.relative(root,exact.path)};
  readPin(root,relative);local.push(relative);return;
 }
 const source=exact.path.startsWith(`${SOURCE_ROOT}/`)
  ? {root:SOURCE_ROOT,pin:{...exact,path:path.relative(SOURCE_ROOT,exact.path)}}
  : {root:path.dirname(exact.path),pin:{...exact,path:path.basename(exact.path)}};
 readPin(source.root,source.pin);external.push(source);
}
export function readP010Artifacts(root){
 const artifacts=Object.fromEntries(Object.entries(ARTIFACT_PATHS).map(([key,relative])=>
  [key,pinFile(root,relative)]));
 assert.deepEqual(artifacts,ARTIFACTS,'exact maintained module, timeline and Canvas member');
 return artifacts;
}
export function p010Runtime(artifacts){return Object.freeze({frameDomain:'sprite-52',frameCount:303,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'conditional-indexMI-host-hold',hostPlaybackCompletion:false});}

/** Recheck physical source and local evidence without consulting registry state. */
export function readP010CanonicalSource(root){
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 const audit=readJsonPin(root,SOURCE_AUDIT),audio=readJsonPin(root,AUDIO_AUDIT),
  text=readJsonPin(root,TEXT_AUDIT),saHost=readJsonPin(root,SA_HOST_AUDIT);
 const canvasPin=pinFile(root,CANVAS_MANIFEST.path),canvas=readJsonPin(root,CANVAS_MANIFEST);
 assert.deepEqual(canvasPin,CANVAS_MANIFEST);
 assert.equal(audit.kind,'alg-l06-p010-source-audit-v1');assert.equal(audit.animationId,ID);
 assert.deepEqual(sourcePin(audit.source),SOURCE);
 assert.equal(audit.catalog.globalOrdinal,10);assert.equal(audit.catalog.sectionCode,'RW');
 assert.equal(audit.catalog.sectionPageOrdinal,9);
 assert.equal(audit.header.signature,'CWS');assert.equal(audit.header.fps,12);
 assert.equal(audit.header.stage.width,800);assert.equal(audit.header.stage.height,600);
 assert.equal(audit.header.rootFrameCount,10);
 assert.deepEqual(audit.frameDomains.map(x=>[x.domainId,x.declaredFrames]),
  [['root',10],['sprite-52',303],['sprite-55',1]]);
 assert.equal(audit.rootMain.entryFrame,6);assert.equal(audit.rootMain.mainTerminalStopDeclared,false);
 assert.equal(audit.rootMain.originalRuntimeExecution,'unobserved');
 assert.deepEqual([audit.button.characterId,audit.button.firstFrame,audit.button.sourceKey,
  audit.button.hostAPI,audit.button.actualHostEffect],[51,268,'Function','DoHyperLinks','unresolved']);
 assert.deepEqual([audit.audio.embedded.blockCount,audit.audio.embedded.firstFrame,
  audit.audio.embedded.lastFrame,audit.audio.embedded.concatenatedSha256],
  [300,4,303,MAIN.sha256]);
 assert.deepEqual(sourcePin(audit.audio.separateSaCandidate),SA);
 assert.equal(audio.kind,'alg-l06-p010-audio-source-audit-v1');
 assert.equal(audio.status,'source-and-ffmpeg-measured-one-cycle-not-original-runtime-or-listening');
 assert.equal(audio.embedded.blockCount,300);assert.equal(audio.embedded.firstBlockFrame,4);
 assert.equal(audio.embedded.lastBlockFrame,303);
 assert.deepEqual(audio.embedded.zeroPayloadBlocks.map(x=>x.frame),[5]);
 assert.deepEqual(sourcePin(audio.embedded.extractedMp3),MAIN);
 assert.equal(audio.decode.main.samples,550656);assert.equal(audio.swf.streamHead.initialLatencySamples,1673);
 assert.equal(audio.swf.streamHead.sampleRate,22050);
 assert.equal(audio.scheduleCandidate.oneConcatenatedMp3Transport,true);
 assert.equal(audio.scheduleCandidate.noSyntheticSilenceForZeroPayloadFrame,true);
 assert.equal(audio.limits.originalRuntimeTraceObserved,false);
 assert.equal(text.kind,'alg-l06-p010-text-state-audit-v1');
 assert.equal(text.sourceSwfSha256,SOURCE.sha256);
 assert.deepEqual(text.semanticReveal,{headingFull:29,equationFull:148,tableFull:167,
  graphFull:198,questionMaskStarts:268,questionReadableFrom:297,functionControlPlaced:268});
 assert.equal(saHost.kind,'alg-l06-p010-separate-sa-and-function-host-disposition-v1');
 assert.equal(saHost.status,
  'verified-static-host-algorithm-conditional-page-application-not-runtime-or-listening');
 assert.equal(saHost.applicability.xmlPlacement.globalOrdinal,10);
 assert.equal(saHost.functionGlossaryCrosswalk.sourceKey,'Function');
 assert.equal(saHost.functionGlossaryCrosswalk.sourceButtonCharacterId,51);
 assert.equal(saHost.functionGlossaryCrosswalk.firstFrame,268);
 assert.equal(saHost.functionGlossaryCrosswalk.reusableExactKey,'Function');
 assert.equal(saHost.functionGlossaryCrosswalk.hostApi,'DoHyperLinks');
 assert.equal(saHost.functionGlossaryCrosswalk.hostLookupSuffix,'~English');
 assert.equal(saHost.functionGlossaryCrosswalk.hostKeyTermsGate,
  'dtfKTLesson text uppercased is not OFF');
 assert.deepEqual(saHost.functionGlossaryCrosswalk.dictionaryEntrySha256,{
  en:'bc0f40b8bdcc75633dd2ce1de92ea861198a5343564a757ea5f466681dcb9249',
  es:'47b6db9a18b6e7372ce870bb9f8f1b4862c92a023ef8a0d8abbe7148796448cc'});
 assert.equal(saHost.applicability.staticVisibilityGate.setting,
  'dtfSPANISH text uppercased equals ON');
 assert.equal(saHost.applicability.pageMainPlacement.mainFrameCount,303);
 assert.equal(saHost.applicability.actualSpokenLanguage,'unverified');
 assert(Object.values(saHost.acceptanceEffects).every(x=>x===false));
 assert.equal(canvas.kind,'alg-l06-p010-maintained-canvas-v1');
 assert.deepEqual(sourcePin(canvas.source),SOURCE);
 assert.equal(canvas.rootFrame,6);assert.equal(canvas.mainFrameCount,303);
 assert.equal(canvas.sourceGlyphRendering.nativeBinding,'semantic-flow-companion');
 assert.equal(canvas.sourceGlyphRendering.totalSourceTextDefinitions,42);
 assert(canvas.outputs.some(pin=>JSON.stringify(sourcePin(pin))===JSON.stringify(CANVAS_SOURCE)));
 const local=[SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,SA_HOST_AUDIT,canvasPin,MAIN,CANVAS_SOURCE];
 const external=[SOURCE,XML,SA].map(pin=>({root:SOURCE_ROOT,pin}));
 for(const pin of [audit.catalog,...audit.outputPins,...text.inputs,text.output,
  ...canvas.inputs,...canvas.outputs,audio.decode.separateSaCopy,
  ...Object.values(saHost.inputs)])collect(root,pin,local,external);
 const localInputs=uniquePins(local),byAbsolute=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),previous=byAbsolute.get(key);
  if(previous)assert.deepEqual(previous,item,`conflicting external source: ${key}`);
  else byAbsolute.set(key,item);}
 return {audit,audio,text,saHost,canvas,localInputs,
  external:[...byAbsolute.values()].sort((a,b)=>
   path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
export function validateP010AdmissionSemantics(packet,registration){
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=packet.entry?.artifacts;
 assert.deepEqual(artifacts,ARTIFACTS);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:10,sourceOccurrence:10,sectionCode:'RW',
  sectionPageOrdinal:9,complexityLane:COMPLEXITY_LANE,runtime:p010Runtime(artifacts)}]);
 assert.deepEqual(packet.entry,{key:ID,module:`./modules/${ID}`,
  maturity:'private-current-js',complexityLane:COMPLEXITY_LANE,artifacts});
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert(Number.isSafeInteger(packet.freezeManifest.bytes)&&packet.freezeManifest.bytes>0);
 assert(/^[a-f0-9]{64}$/u.test(packet.freezeManifest.sha256));
 assert.deepEqual(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert(!('canonicalRun' in packet)&&!('canonicalMember' in packet));
 assert.equal(packet.integrity.completeTransitiveClosure,false);
 assert(Array.isArray(packet.integrity.files));
 const evidence=new Map(packet.integrity.files.map(pin=>[pin.path,pin]));
 for(const required of [SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,SA_HOST_AUDIT,CANVAS_MANIFEST,MAIN,CANVAS_SOURCE,
  ...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P010 evidence: ${required.path}`);
 for(const pin of packet.integrity.files){
  assert(!FORBIDDEN.has(pin.path)&&pin.path!==PROOF_PATH&&pin.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(pin.path),
   `no registry-dependent P010 evidence: ${pin.path}`);
 }
 return true;
}
