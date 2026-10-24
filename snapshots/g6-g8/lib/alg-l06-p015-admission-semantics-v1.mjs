/** Exact source semantics for one local P015 Current-JS proposal. No writes. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p015';
export const CALIBRATION='g678-alg-l06-p015-current-js-20260929-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB06.swf',bytes:559546,
 sha256:'d0f395f5410353733b42ae29198caa86fae6b6eebd0e2a71830a203d969868b1'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB06.mp3',bytes:363888,
 sha256:'55ae5c2c9d5aa5b3a00f3fd30e642f6410dcaf6b9e66f1bf77ee349cce2bf434'};
const AUDIT='migrations/shared-alg001-l06-p015/audit';
export const SOURCE_AUDIT={path:`${AUDIT}/source-v1/source-audit-v1.json`,bytes:8768,
 sha256:'5e474ab8e2c00be798adfb1ca39b654ace6b178c2311745f69451bba589a9824'};
export const AUDIO_AUDIT={path:`${AUDIT}/audio-v1/audio-source-audit-v1.json`,bytes:276045,
 sha256:'cc0613c295d148102df51dd970d391cda380ffa3ed0f4da9f77ba2c04453ae15'};
export const TEXT_AUDIT={path:`${AUDIT}/text-state-v1/text-state-audit-v1.json`,bytes:4981,
 sha256:'3b9e8b2e5296b5febdc1608ed502df35a70195103b5a7f2e5cb1a1c1486c2a7b'};
export const GLOSSARY_AUDIT={path:`${AUDIT}/glossary-v1/six-term-crosswalk-v1.json`,bytes:19724,
 sha256:'ac14fe36033aa463c691ec6bb27920a4a63acef804b8566e299110a309ba36ad'};
export const CANVAS_MANIFEST={path:'output/alg-l06-p015-canvas-v1/canvas-manifest.json',bytes:4878,
 sha256:'8ac70251c90af2cfebf7290bb82f326a4f7fda36f783f2bafdc4bc4605d58d23'};
export const BROWSER_AUDIO={path:'output/playwright/alg-l06-p015-browser-audio-v1/decode-receipt.json',bytes:2433,
 sha256:'f89df97650a97f8b066519f51385067285c52b474ffc9e62d1131097946ef713'};
export const CANVAS_SOURCE={path:'output/alg-l06-p015-canvas-v1/canvas-renderer.js',bytes:10515188,
 sha256:'4a572881adce44d318329f8895458eed8f63e8679e41ebfd38bbb3f0ee3dcb55'};
export const MAIN_AUDIO=Object.freeze([
 {path:`${AUDIT}/audio-v1/sprite-270-range-1-source-v1.mp3`,bytes:257010,sha256:'594760da0a94e6eff0f66bbb16c4ef6776ea23b46ff97a2a642b34e5acf80221'},
 {path:`${AUDIT}/audio-v1/sprite-270-range-2-source-v1.mp3`,bytes:23270,sha256:'3c069c45a39afe276aee729b2f92ac32d7c8341d147a55c134a13c4cd2457585'},
 {path:`${AUDIT}/audio-v1/sprite-270-range-3-source-v1.mp3`,bytes:56680,sha256:'55fb816f77fdfd1ae4eb3812af5340ac119592b1f697d87f6c7ee42a7be486d6'},
 {path:`${AUDIT}/audio-v1/sprite-270-range-4-source-v1.mp3`,bytes:26130,sha256:'f438e6cbc5ae5ef8e6de1005d80375afdd46175ada09bb5212b4069e469a2c94'},
]);
export const SA_COPY={path:`${AUDIT}/audio-v1/separate-sa-source-v1.mp3`,bytes:363888,sha256:SA.sha256};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='interactive-understood';
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,browserDecode:BROWSER_AUDIO,
 mainRanges:MAIN_AUDIO,mainRangeFrames:[[2,622],[646,702],[712,849],[852,914]],
 mainFrameDomain:'sprite-270',negativeSeekSemanticsResolved:false,
 syntheticSilenceForAbsentBlocks:false,originalRuntimeAccepted:false,
 listeningAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,sourceCopy:SA_COPY,browserDecode:BROWSER_AUDIO,
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
 mainPausedDuringPlayback:true,pendingLoadCancellation:true,returnMainSupported:true,
 audioAccepted:false});
export const GLOSSARY=Object.freeze({
 Function:{characterId:36,sourceKey:'Function',sourceFirstFrame:164,firstFullHitFrame:172,entryId:'function',actionSha256:'bf18a4b6722a58696805f4dd043c6b04a1b1c3cc9a605ef84301790c08bb4cfa'},
 Value:{characterId:37,sourceKey:'Value',sourceFirstFrame:164,firstFullHitFrame:215,entryId:'value',actionSha256:'b68cfecf6b594886cdc6d73c8c530ed1716f3be74501a3b16de93613da2c3254'},
 Relation:{characterId:38,sourceKey:'Relation',sourceFirstFrame:164,firstFullHitFrame:191,entryId:'relation',actionSha256:'bb9bd516b984a08cc4f3b3c85d9e4a7cc0243e1384a6f2497aa8e29990b4744e'},
 Rule:{characterId:45,sourceKey:'Rule',sourceFirstFrame:271,firstFullHitFrame:302,entryId:'rule',actionSha256:'b9aafff389f456dd2b9b47ba56a2948163956fc001ca6ca2add0a0d55f7f9c05'},
 Input:{characterId:46,sourceKey:'Input',sourceFirstFrame:271,firstFullHitFrame:317,entryId:'input',actionSha256:'fc18c1b076872ddbff22a6de05a0929210cfcb8d065a27a37c654e3eb33c496a'},
 Output:{characterId:47,sourceKey:'Output',sourceFirstFrame:271,firstFullHitFrame:332,entryId:'output',actionSha256:'573534c3578af9119df87b9a8e2c4751ca88e451a2e1dde1896a9ad77acd746e'},
});
export const ARTIFACT_PATHS=Object.freeze({
 module:`packages/demos/src/modules/${ID}.tsx`,timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`,
});
export const MAINTAINED_PATHS=Object.freeze([
 'packages/demos/src/alg-l06-p015-timeline-v1.ts',
 'packages/demos/src/alg-l06-p015-audio-schedule-v1.ts',
 'packages/demos/src/alg-l06-p015-clock-v1.ts',
 'packages/demos/src/alg-l06-p015-audio-owner-v1.ts',
 'packages/demos/src/alg-l06-p015-optional-spanish-audio-v1.ts',
 'packages/demos/src/alg-l06-p015-native-text-v1.tsx',
 'packages/demos/src/alg-l06-p015-player-v1.tsx',
 'packages/demos/src/generated/alg-l06-p015-audio-plan-v1.ts',
 'packages/demos/src/generated/alg-l06-p015-text-state-v1.ts',
 'packages/demos/src/generated/alg-l06-p015-canvas-v1.ts',
]);
const pin=({path,bytes,sha256})=>({path,bytes,sha256});
function collect(root,item,local,external){
 const exact=pin(item);assert(typeof exact.path==='string','source input path');
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const holder=exact.path.startsWith(`${root}/`)?root:exact.path.startsWith(`${SOURCE_ROOT}/`)
  ?SOURCE_ROOT:path.dirname(exact.path);
 const relative=path.relative(holder,exact.path),ref={root:holder,pin:{...exact,path:relative}};
 readPin(ref.root,ref.pin);if(holder===root)local.push(ref.pin);else external.push(ref);
}
export function proposedP015Artifacts(root){return {
 module:pinFile(root,ARTIFACT_PATHS.module),timeline:pinFile(root,ARTIFACT_PATHS.timeline),
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
};}
export function readP015Artifacts(root){
 const artifacts={module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime:pinFile(root,ARTIFACT_PATHS.runtime)};
 assert.deepEqual(artifacts.runtime,{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
  'exact no-replace copied Canvas member');
 return artifacts;
}
export function p015Runtime(artifacts){return Object.freeze({frameDomain:'sprite-270',frameCount:914,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false});}

/** Recheck physical canonical source and bounded structural, audio and text facts. */
export function readP015CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const audit=readJsonPin(root,SOURCE_AUDIT),audio=readJsonPin(root,AUDIO_AUDIT),
  text=readJsonPin(root,TEXT_AUDIT),glossary=readJsonPin(root,GLOSSARY_AUDIT),
  canvas=readJsonPin(root,CANVAS_MANIFEST),browser=readJsonPin(root,BROWSER_AUDIO);
 assert.equal(audit.kind,'alg-l06-p015-source-audit-v1');assert.equal(audit.animationId,ID);
 assert.deepEqual(pin(audit.source),SOURCE);
 assert.deepEqual([audit.catalog.globalOrdinal,audit.catalog.section,audit.catalog.sectionPageOrdinal],[15,'VB',5]);
 assert.deepEqual([audit.runtime.header.signature,audit.runtime.header.fps,audit.runtime.header.stage.width,
  audit.runtime.header.stage.height,audit.runtime.header.rootFrameCount],['CWS',12,800,600,10]);
 assert.deepEqual([audit.runtime.domainCount,audit.runtime.mainDomain,audit.runtime.mainFrames,
  audit.runtime.rootMainPlacement.frame,audit.runtime.rootMainPlacement.characterId],[2,'sprite-270',914,6,270]);
 assert.deepEqual([audit.runtime.actionScript.tagCounts.DoAction,audit.runtime.sourceTagCounts.DefineButton2,
  audit.runtime.sourceTagCounts.DefineText,audit.runtime.sourceTagCounts.DefineMorphShape],[2,6,15,10]);
 assert.equal(audit.capabilityBoundary.xmlCompleteThroughEnd,true);
 assert.equal(audit.capabilityBoundary.originalRuntimeObserved,false);
 assert.equal(audit.complexity.factoryScaleOutAuthorized,false);
 assert.deepEqual(audit.hostInteractions.glossaryButtons.map(x=>[x.key,x.characterId,x.actionSource.sha256]),
  Object.values(GLOSSARY).map(x=>[x.sourceKey,x.characterId,x.actionSha256]));
 assert.equal(audio.kind,'alg-l06-p015-audio-source-audit-v1');
 assert.deepEqual([audio.domainCount,audio.streamCount,audio.streams[0].domain,
  audio.streams[0].blockCount],[2,1,'sprite-270',879]);
 assert.deepEqual(audio.trailers,[]);
 assert.deepEqual(audio.streams[0].contiguousRanges.map(x=>[x.firstFrame,x.lastFrame]),CONTINUOUS.mainRangeFrames);
 assert.deepEqual(audio.streams[0].contiguousRanges.map(x=>pin(x.extractedMp3)),MAIN_AUDIO);
 assert.deepEqual(pin(audio.separateSa.copy),SA_COPY);
 assert.equal(audio.limits.negativeSeekSemanticsResolved,false);
 assert.equal(audio.limits.missingBlocksProveAudibleSilence,false);
 assert.equal(audio.limits.separateSaExplicitTriggerRequired,true);
 assert.equal(audio.limits.separateSaSplicedIntoMain,false);
 assert.equal(audio.limits.localeChangeStartsSa,false);
 assert.equal(text.kind,'alg-l06-p015-text-state-audit-v1');assert.equal(text.animationId,ID);
 assert.deepEqual(text.semanticTiming.glossaryFullHit,
  [['Function',172],['Relation',191],['Value',215],['Rule',302],['Input',317],['Output',332]]);
 assert.equal(glossary.kind,'alg-l06-p015-six-term-glossary-crosswalk-v1');
 assert.deepEqual(glossary.sourceButtons.map(x=>[x.sourceKeyAttribute,x.entryId,x.characterId,x.firstFrame,x.actionPin.sha256]),
  Object.values(GLOSSARY).map(x=>[x.sourceKey,x.entryId,x.characterId,x.sourceFirstFrame,x.actionSha256]));
 assert.deepEqual(glossary.terms.map(x=>[x.sourceKeyAttribute,x.id]),
  Object.values(GLOSSARY).map(x=>[x.sourceKey,x.entryId]));
 assert.equal(glossary.oldHostStaticPath.actualLaunchObserved,false);
 assert(Object.values(glossary.acceptanceEffects).every(value=>value===false));
 assert.equal(canvas.kind,'alg-l06-p015-maintained-canvas-v1');
 assert.deepEqual(pin(canvas.source),SOURCE);assert.deepEqual([canvas.rootFrame,canvas.mainFrameCount],[6,914]);
 assert.equal(canvas.sourceGlyphRendering.nativeBinding,'semantic-flow-companion');
 assert.equal(canvas.sourceGlyphRendering.preserved,true);
 assert.equal(canvas.sourceClipMasks.length,6);assert.equal(canvas.sourceMorphCharacterIds.length,10);
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_SOURCE)));
 assert.equal(browser.kind,'alg-l06-p015-browser-decode-v1');
 assert.deepEqual(browser.results.map(x=>x.sourceSha256),[...MAIN_AUDIO,SA_COPY].map(x=>x.sha256));
 assert(browser.results.every(x=>x.playbackStarted===false));
 assert.equal(browser.originalRuntimeAccepted,false);assert.equal(browser.listeningAccepted,false);
 const local=[SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,GLOSSARY_AUDIT,CANVAS_MANIFEST,BROWSER_AUDIO,
  ...MAIN_AUDIO,SA_COPY,CANVAS_SOURCE,...MAINTAINED_PATHS.map(relative=>pinFile(root,relative))];
 const external=[SOURCE,XML,SA].map(item=>({root:SOURCE_ROOT,pin:item}));
 for(const item of [audit.catalog,...audit.parserDependencies,...audit.artifacts,
  audio.streams[0].extractedMp3,...text.inputs,text.output,
  ...canvas.inputs,...canvas.outputs,...glossary.inputs.ffdecExportedScripts,
  glossary.inputs.oldHostFunctions,glossary.inputs.oldHostSaRelease,
  ...Object.values(glossary.inputs.dictionaryBanks),glossary.inputs.p004Glossary])
  collect(root,item,local,external);
 const byAbsolute=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),prior=byAbsolute.get(key);
  if(prior)assert.deepEqual(prior,item,`conflicting external pin: ${key}`);else byAbsolute.set(key,item);}
 return {audit,audio,text,glossary,canvas,browser,localInputs:uniquePins(local),
  external:[...byAbsolute.values()].sort((a,b)=>path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
/** Semantics are independent of registration, original-runtime and review claims. */
export function validateP015AdmissionSemantics(packet,registration,root){
 assert(root,'P015_REQUIRES_CURRENT_ROOT');
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.glossaryActions,GLOSSARY);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=proposedP015Artifacts(root);
 assert.deepEqual(packet.entry?.artifacts,artifacts);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:15,sourceOccurrence:15,sectionCode:'VB',
  sectionPageOrdinal:5,complexityLane:COMPLEXITY_LANE,runtime:p015Runtime(artifacts)}]);
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
 const evidence=new Map(packet.integrity.files.map(item=>[item.path,item]));
 const source=readP015CanonicalSource(root);
 for(const required of [...source.localInputs,SOURCE_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,GLOSSARY_AUDIT,CANVAS_MANIFEST,
  BROWSER_AUDIO,...MAIN_AUDIO,SA_COPY,CANVAS_SOURCE,...MAINTAINED_PATHS.map(relative=>pinFile(root,relative)),
  ...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P015 evidence: ${required.path}`);
 for(const item of packet.integrity.files)
  assert(!FORBIDDEN.has(item.path)&&item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
   `no registration-dependent P015 evidence: ${item.path}`);
 return true;
}
