/** Source-bound P013 semantics for one local Current-JS page. No writes. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p013';
export const CALIBRATION='g678-alg-l06-p013-current-js-20260928-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB04.swf',bytes:269912,
 sha256:'1be47750557385ef91c648fb87fdcde642d342caadc35da7a1f7a2d1fdb11d35'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB04.mp3',bytes:327936,
 sha256:'2db938405bd646e4bf37e0b9cdf5438cc65451a2d4f7304c93dbc2b6653e8575'};
export const SOURCE_AUDIT={path:'migrations/shared-alg001-l06-p013/audit/source-v1/source-audit-v1.json',bytes:12299,
 sha256:'ec5707528c5ebc3f0992aec542c6eace1a3eebaa8256cc3d5aebfc7f037078af'};
export const AUDIO_AUDIT={path:'migrations/shared-alg001-l06-p013/audit/audio-v1/audio-source-audit-v1.json',bytes:90068,
 sha256:'73558518b95735e4256432d9b750eabf33e42b04d62cf1c11f6fa1b6151d28d8'};
export const TEXT_AUDIT={path:'migrations/shared-alg001-l06-p013/audit/text-state-v1/text-state-audit-v1.json',bytes:2837,
 sha256:'19d43c2ce35d3f73863ae5482396d1e633b01f23ef580ef1fc579c8458879611'};
export const HOST_AUDIT={path:'migrations/shared-alg001-l06-p013/audit/source-v1/host-glossary-disposition-v1.json',bytes:2848,
 sha256:'b7fe4460532e53fa9e2302056d99b9afc0ec49107fede9b09f9794f0c2c23d43'};
export const GLOSSARY_AUDIT={path:'migrations/shared-alg001-l06-p013/audit/glossary-v1/input-output-crosswalk-v1.json',bytes:9423,
 sha256:'7a6d26e663d948f77833378ee1c2c5e60130e55aa6299bc7b0eacf070b091e2e'};
export const CANVAS_MANIFEST={path:'output/alg-l06-p013-canvas-v1/canvas-manifest.json',bytes:3872,
 sha256:'d64bda48c9b63f3d05c3ca1e587bea9aa1eceb59b7ab6bedfa49c8749944607e'};
export const BROWSER_AUDIO={path:'output/playwright/alg-l06-p013-browser-audio-v1/decode-receipt.json',bytes:1136,
 sha256:'5f7cca3ec48184236107fd78ebe359ef3236dc5e48426583ab583c54152bf3cb'};
export const MAIN={path:'migrations/shared-alg001-l06-p013/audit/audio-v1/continuous-source-v1.mp3',bytes:151710,
 sha256:'3d646619b33b9e859aff68bf331f224158916aa9f4e99b16cdc910791c7d41c1'};
export const SA_COPY={path:'migrations/shared-alg001-l06-p013/audit/audio-v1/separate-sa-source-v1.mp3',bytes:327936,
 sha256:SA.sha256};
export const CANVAS_SOURCE={path:'output/alg-l06-p013-canvas-v1/canvas-renderer.js',bytes:4346113,
 sha256:'0fcb9e14cbae8ff38b0fbf213b090e1299d65027abd4b365950ca875042b4b0d'};
export const ARTIFACT_PATHS=Object.freeze({
 module:`packages/demos/src/modules/${ID}.tsx`,timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`,
});
export const ARTIFACTS=Object.freeze({
 module:{path:ARTIFACT_PATHS.module,bytes:3016,
  sha256:'0dcd99ad2b1db95bc0b11a97d74a9a8624e1a4d98c4bab49d0947acf8e7790f5'},
 timeline:{path:ARTIFACT_PATHS.timeline,bytes:1178,
  sha256:'8d7dc3fa3c029b02ecd064e81b6d725924ec6a271276d4d5614eb4acc4e32cc4'},
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
});
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='interactive-understood';
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,browserDecode:BROWSER_AUDIO,mp3:MAIN,
 streamHeadCount:1,blockCount:368,firstAudioBlockFrame:2,lastAudioBlockFrame:372,
 sampleRate:22050,decodedSamples:672192,initialSeekSamples:1673,
 zeroPayloadFrames:[3,161,252],negativeSeekFrames:[161,252],absentBlockFrames:[253,254,255],
 negativeSeekSemanticsResolved:false,syntheticSilenceForAbsentBlocks:false,
 oneConcatenatedMp3Transport:true,originalRuntimeAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,sourceCopy:SA_COPY,browserDecode:BROWSER_AUDIO,
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
 mainPausedDuringPlayback:true,pendingLoadCancellation:true,returnMainSupported:true,
 startSample:0,audioAccepted:false});
export const GLOSSARY=Object.freeze({
 Input:{characterId:131,sourceKey:'Input',sourceFirstFrame:258,firstFullHitFrame:296,
  actionSha256:'2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5',entryId:'input'},
 Output:{characterId:137,sourceKey:'Output',sourceFirstFrame:297,firstFullHitFrame:365,
  actionSha256:'1262eac21bf8a718d551c8d7b046220855f8f878214783cfdfb7d0c37f5ff5c7',entryId:'output'},
});

const sourcePin=pin=>({path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
function collect(root,pin,local,external){
 assert(pin&&typeof pin.path==='string','P013_SOURCE_INPUT_PIN_MISSING');
 const exact=sourcePin(pin);
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const source=exact.path.startsWith(`${root}/`)
  ? {root,pin:{...exact,path:path.relative(root,exact.path)}}
  : exact.path.startsWith(`${SOURCE_ROOT}/`)
   ? {root:SOURCE_ROOT,pin:{...exact,path:path.relative(SOURCE_ROOT,exact.path)}}
   : {root:path.dirname(exact.path),pin:{...exact,path:path.basename(exact.path)}};
 readPin(source.root,source.pin);
 if(source.root===root)local.push(source.pin);else external.push(source);
}
export function readP013Artifacts(root){
 const artifacts=Object.fromEntries(Object.entries(ARTIFACT_PATHS).map(([key,relative])=>
  [key,pinFile(root,relative)]));
 assert.deepEqual(artifacts,ARTIFACTS,'exact maintained module, timeline and Canvas member');
 return artifacts;
}
export function p013Runtime(artifacts){return Object.freeze({frameDomain:'sprite-140',frameCount:372,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'conditional-indexMI-host-hold',hostPlaybackCompletion:false});}

/** Recheck physical source and source-grounded artifacts, without registry state. */
export function readP013CanonicalSource(root){
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 const audit=readJsonPin(root,SOURCE_AUDIT),audio=readJsonPin(root,AUDIO_AUDIT),
  text=readJsonPin(root,TEXT_AUDIT),host=readJsonPin(root,HOST_AUDIT),
  glossary=readJsonPin(root,GLOSSARY_AUDIT),canvas=readJsonPin(root,CANVAS_MANIFEST),
  browser=readJsonPin(root,BROWSER_AUDIO);
 assert.equal(audit.kind,'alg-l06-p013-source-audit-v1');assert.equal(audit.animationId,ID);
 assert.deepEqual(sourcePin(audit.source),SOURCE);
 assert.deepEqual([audit.catalog.globalOrdinal,audit.catalog.section,audit.catalog.sectionPageOrdinal],[13,'VB',3]);
 assert.deepEqual([audit.runtime.header.signature,audit.runtime.header.fps,
  audit.runtime.header.stage.width,audit.runtime.header.stage.height,
  audit.runtime.header.rootFrameCount],['CWS',12,800,600,10]);
 assert.deepEqual(audit.runtime.domains.map(x=>[x.domainId,x.declaredFrames]),[['root',10],['sprite-140',372]]);
 assert.deepEqual([audit.runtime.rootMainPlacement.frame,audit.runtime.rootMainPlacement.characterId],[6,140]);
 assert.deepEqual(audit.teaching.buttons.map(x=>[x.characterId,x.sourceKeyAttribute,x.firstFrame,x.actionSha256]),
  Object.values(GLOSSARY).map(x=>[x.characterId,x.sourceKey,x.sourceFirstFrame,x.actionSha256]));
 assert.equal(audit.teaching.mainOwnDoActionCount,0);
 assert.deepEqual([audit.audio.mainStream.blocks,audit.audio.mainStream.firstFrame,
  audit.audio.mainStream.lastFrame,audit.audio.mainStream.mp3Sha256],[368,2,372,MAIN.sha256]);
 assert.deepEqual(sourcePin(audit.audio.separateSA),SA);
 assert.equal(audit.legacyHost.conditionalTerminal,
  'old host stops non-FQ animation at its totalFrames; original runtime unobserved');
 assert.equal(audio.kind,'alg-l06-p013-audio-source-audit-v1');
 assert.deepEqual([audio.embedded.blockCount,audio.embedded.firstBlockFrame,
  audio.embedded.lastBlockFrame],[368,2,372]);
 assert.deepEqual(audio.embedded.absentBlockFrames,[253,254,255]);
 assert.deepEqual(audio.embedded.zeroPayloadBlocks.map(x=>x.frame),[3,161,252]);
 assert.deepEqual(audio.embedded.zeroPayloadBlocks.filter(x=>x.seek<0).map(x=>x.frame),[161,252]);
 assert.deepEqual(sourcePin(audio.embedded.extractedMp3),MAIN);
 assert.deepEqual(sourcePin(audio.decode.separateSaCopy),SA_COPY);
 assert.deepEqual([audio.decode.main.sampleRate,audio.decode.main.samples],[22050,672192]);
 assert.equal(audio.swf.streamHead.initialLatencySamples,1673);
 assert.equal(audio.limits.negativeSeekFrames161And252OperationalMeaningResolved,false);
 assert.equal(audio.limits.missingBlocksProveAudibleSilence,false);
 assert.equal(audio.scheduleCandidate.noSyntheticSilenceForMissingBlockFrames,true);
 assert.equal(text.kind,'alg-l06-p013-text-state-audit-v1');
 assert.deepEqual([text.semanticReveal.inputButtonPlaced,text.semanticReveal.inputHitFirstFull,
  text.semanticReveal.outputButtonPlaced,text.semanticReveal.outputHitFirstFull],[258,296,297,365]);
 assert.equal(host.kind,'alg-l06-p013-host-glossary-disposition-v1');
 assert.deepEqual(sourcePin(host.lessonXml),XML);
 assert.equal(host.exactPageBinding.mainFrameCount,372);
 assert.deepEqual(host.buttons.map(x=>x.sourceKeyAttribute),['Input','Output']);
 assert.equal(glossary.kind,'alg-l06-p013-input-output-glossary-crosswalk-v1');
 assert.deepEqual(glossary.terms.map(x=>[x.sourceKeyAttribute,x.entryId]),[['Input','input'],['Output','output']]);
 assert.equal(glossary.reusable.exactInputAndOutputTermIdsAlreadyInP004AndP008,true);
 assert.equal(glossary.reusable.newDefinitionOrConceptAliasRequired,false);
 assert.equal(canvas.kind,'alg-l06-p013-maintained-canvas-v1');
 assert.deepEqual(sourcePin(canvas.source),SOURCE);
 assert.deepEqual([canvas.rootFrame,canvas.mainFrameCount],[6,372]);
 assert.equal(canvas.sourceGlyphRendering.nativeBinding,'semantic-flow-companion');
 assert(canvas.outputs.some(pin=>JSON.stringify(sourcePin(pin))===JSON.stringify(CANVAS_SOURCE)));
 assert.equal(browser.kind,'alg-l06-p013-browser-decode-v1');
 assert.deepEqual(browser.results.map(x=>[x.role,x.sourceSha256,x.decodedSamples,x.pcmSha256]),[
  ['main',MAIN.sha256,672192,'ce922cc619860dbc6fc65dfdff37b77be744d1f01a481dfa97562b13bba75cd3'],
  ['separate-sa',SA.sha256,1124352,'d55dd696dd4418ebeeb188764e2281eb23bafe876e38063e62345945b399b4c6']]);
 assert(browser.results.every(x=>x.playbackStarted===false));
 assert.equal(browser.originalRuntimeAccepted,false);assert.equal(browser.listeningAccepted,false);
 const local=[SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,HOST_AUDIT,GLOSSARY_AUDIT,
  CANVAS_MANIFEST,BROWSER_AUDIO,MAIN,SA_COPY,CANVAS_SOURCE];
 const external=[SOURCE,XML,SA].map(pin=>({root:SOURCE_ROOT,pin}));
 for(const pin of [audit.catalog,...audit.artifacts,...text.inputs,text.output,
  ...canvas.inputs,...canvas.outputs,audio.decode.separateSaCopy,
  host.oldHostSwf,host.oldHostFunctionScript,host.oldHostFrameObserver,
  glossary.inputs.dictionaryBanks.en,glossary.inputs.dictionaryBanks.es])
  collect(root,pin,local,external);
 const byAbsolute=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),previous=byAbsolute.get(key);
  if(previous)assert.deepEqual(previous,item,`conflicting external source: ${key}`);
  else byAbsolute.set(key,item);}
 return {audit,audio,text,host,glossary,canvas,browser,localInputs:uniquePins(local),
  external:[...byAbsolute.values()].sort((a,b)=>
   path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
export function validateP013AdmissionSemantics(packet,registration){
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.glossaryActions,GLOSSARY);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=packet.entry?.artifacts;
 assert.deepEqual(artifacts,ARTIFACTS);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:13,sourceOccurrence:13,sectionCode:'VB',
  sectionPageOrdinal:3,complexityLane:COMPLEXITY_LANE,runtime:p013Runtime(artifacts)}]);
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
 for(const required of [SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,HOST_AUDIT,GLOSSARY_AUDIT,
  CANVAS_MANIFEST,BROWSER_AUDIO,MAIN,SA_COPY,CANVAS_SOURCE,...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P013 evidence: ${required.path}`);
 for(const pin of packet.integrity.files){
  assert(!FORBIDDEN.has(pin.path)&&pin.path!==PROOF_PATH&&pin.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(pin.path),
   `no registry-dependent P013 evidence: ${pin.path}`);
 }
 return true;
}
