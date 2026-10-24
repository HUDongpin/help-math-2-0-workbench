/** Source-bound P014 admission semantics. This reader does not register a page. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p014';
export const CALIBRATION='g678-alg-l06-p014-current-js-20260929-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB05.swf',bytes:566603,
 sha256:'aed0f7755d4f691cefcc28c815acc6b9d083fdfaae88ff385f22d3b32ba07603'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB05.mp3',bytes:136080,
 sha256:'b506e9e83e9716ed9c57d358f3f6664b5e3b8d8735d94ea4acb57449e148592d'};
const auditPath='migrations/shared-alg001-l06-p014/audit';
export const SOURCE_AUDIT={path:`${auditPath}/source-v1/source-audit-v1.json`,bytes:10839,
 sha256:'008dd6f28d312f41c48ab389efce2e58452aef83c98312fa981c5aa88d69eb13'};
export const AUDIO_AUDIT={path:`${auditPath}/audio-v1/audio-source-audit-v1.json`,bytes:209282,
 sha256:'21430358709c5d2d5c3668774482a6981e34355605d50fbd2c5fa3c6e4bc63f8'};
export const BEHAVIOR_AUDIT={path:`${auditPath}/behavior-v1/source-behavior-audit-v1.json`,bytes:11048,
 sha256:'61cf9abc496457e78fb7610f8b2d4739a8b751ea074f97cad6a8fca3bbcaf896'};
export const TEXT_AUDIT_PATH=`${auditPath}/text-state-v1/text-state-audit-v1.json`;
export const GLOSSARY_AUDIT={path:`${auditPath}/glossary-v1/input-output-crosswalk-v1.json`,bytes:4901,
 sha256:'43a93c9aef1cb238fcaa8d395b9a80c8ed65e6f23e3b21c6995164d5c1be8c32'};
export const CANVAS_MANIFEST={path:'output/alg-l06-p014-canvas-v1/canvas-manifest.json',bytes:6281,
 sha256:'df88878fbde893748c7e55f9ded97b824da4621dec8dd25b699b6cf08dd38162'};
export const BROWSER_AUDIO={path:'output/playwright/alg-l06-p014-browser-audio-v1/decode-receipt.json',bytes:4482,
 sha256:'e7489f077cbf3f9d55dfea53b15401b850af3803cd4c697682e83babd1c44f4a'};
export const CANVAS_SOURCE={path:'output/alg-l06-p014-canvas-v1/canvas-renderer.js',bytes:3939200,
 sha256:'d01ed8b9bf43d9d88d8eeb5960e42ac1bcac941fce1b0a1eb31732ac097cad3f'};
export const MAIN_AUDIO=Object.freeze([
 {path:`${auditPath}/audio-v1/sprite-227-range-1-source-v1.mp3`,bytes:44720,sha256:'73f2bb2a7319375e303ac746597e93e3ca3a9f25abdc1b62fb2771b117d575fd'},
 {path:`${auditPath}/audio-v1/sprite-227-range-2-source-v1.mp3`,bytes:134810,sha256:'0b3ff7347edc73632e4c55356f2139d959f124dfaa4b4efebcb9316765a821f7'},
]);
export const SA_COPY={path:`${auditPath}/audio-v1/separate-sa-source-v1.mp3`,bytes:136080,sha256:SA.sha256};
export const FEEDBACK=Object.freeze({
 right:[['sprite-115',25],['sprite-156',27],['sprite-83',31],['sprite-148',27]],
 wrong:[['sprite-173',22,23,167,31],['sprite-187',23,24,182,29],['sprite-28',20,21,21,28]],
 tryLimit:2,quizHoldFrame:120,
});
export const TRAILER=Object.freeze({domain:'sprite-83',bytes:386,
 sha256:'d14a608f74eab33aa50401e45f0226b845a8b29aa02417254d15dc8675accaa0',
 interpretedAsTags:false,appendedToAudio:false});
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='behavior-heavy';
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,browserDecode:BROWSER_AUDIO,
 mainRanges:MAIN_AUDIO,mainRangeFrames:[[2,110],[125,449]],mainFrameDomain:'sprite-227',
 feedbackDomains:FEEDBACK,unresolvedTrailer:TRAILER,branchPlaybackScheduleResolved:false,
 negativeSeekSemanticsResolved:false,syntheticSilenceForAbsentBlocks:false,
 originalRuntimeAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,sourceCopy:SA_COPY,browserDecode:BROWSER_AUDIO,
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
 mainPausedDuringPlayback:true,pendingLoadCancellation:true,returnMainSupported:true,
 audioAccepted:false});
export const GLOSSARY=Object.freeze({
 Input:{characterId:32,sourceKey:'Input',actionSha256:'2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5',entryId:'input'},
 Output:{characterId:33,sourceKey:'Output',actionSha256:'1262eac21bf8a718d551c8d7b046220855f8f878214783cfdfb7d0c37f5ff5c7',entryId:'output'},
});
export const ARTIFACT_PATHS=Object.freeze({
 module:`packages/demos/src/modules/${ID}.tsx`,timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`,
});
// P014's player is still being repaired. Read its current bytes at admission time.
export const MAINTAINED_PATHS=Object.freeze([
 'packages/demos/src/alg-l06-p014-player-v1.tsx',
 'packages/demos/src/alg-l06-p014-timeline-v1.ts',
 'packages/demos/src/alg-l06-p014-audio-schedule-v1.ts',
 'packages/demos/src/alg-l06-p014-optional-spanish-audio-v1.ts',
 'packages/demos/src/generated/alg-l06-p014-text-state-v1.ts',
 'packages/demos/src/generated/alg-l06-p014-canvas-v1.ts',
]);
const pin=({path,bytes,sha256})=>({path,bytes,sha256});
function collect(root,item,local,external){
 const exact=pin(item);
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const source=exact.path.startsWith(`${root}/`)
  ? {root,pin:{...exact,path:path.relative(root,exact.path)}}
  : exact.path.startsWith(`${SOURCE_ROOT}/`)
   ? {root:SOURCE_ROOT,pin:{...exact,path:path.relative(SOURCE_ROOT,exact.path)}}
   : {root:path.dirname(exact.path),pin:{...exact,path:path.basename(exact.path)}};
 readPin(source.root,source.pin);
 if(source.root===root)local.push(source.pin);else external.push(source);
}
/** Physical member check is required when preparing the formal packet. */
export function readP014Artifacts(root){
 const artifacts={module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime:pinFile(root,ARTIFACT_PATHS.runtime)};
 assert.deepEqual(artifacts.runtime,{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},'exact copied Canvas member');
 return artifacts;
}
/** An unregistered proposal for tests/preparation; never a physical member claim. */
export function proposedP014Artifacts(root){return {
 module:pinFile(root,ARTIFACT_PATHS.module),timeline:pinFile(root,ARTIFACT_PATHS.timeline),
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
};}
export function p014Runtime(artifacts){return Object.freeze({frameDomain:'sprite-227',frameCount:449,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 quizHoldFrame:120,feedbackDomains:FEEDBACK,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false});}

/** Recheck exact source, warnings, nested feedback and tagged audio. */
export function readP014CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const textAuditPin=pinFile(root,TEXT_AUDIT_PATH);
 const audit=readJsonPin(root,SOURCE_AUDIT),audio=readJsonPin(root,AUDIO_AUDIT),
  behavior=readJsonPin(root,BEHAVIOR_AUDIT),text=readJsonPin(root,textAuditPin),
  glossary=readJsonPin(root,GLOSSARY_AUDIT),canvas=readJsonPin(root,CANVAS_MANIFEST),
  browser=readJsonPin(root,BROWSER_AUDIO);
 assert.equal(audit.kind,'alg-l06-p014-source-audit-v1');assert.equal(audit.animationId,ID);
 assert.deepEqual(pin(audit.source),SOURCE);assert.deepEqual(pin(audit.lessonXml),XML);
 assert.deepEqual(pin(audit.separateSaCandidate),SA);
 assert.deepEqual([audit.catalog.globalOrdinal,audit.catalog.section,audit.catalog.sectionPageOrdinal],[14,'VB',4]);
 assert.deepEqual([audit.runtime.header.signature,audit.runtime.header.fps,audit.runtime.header.stage.width,
  audit.runtime.header.stage.height,audit.runtime.header.rootFrameCount],['CWS',12,800,600,10]);
 assert.deepEqual([audit.runtime.domainCount,audit.runtime.mainDomain,audit.runtime.mainFrames,
  audit.runtime.rootMainPlacement.frame,audit.runtime.rootMainPlacement.characterId],[14,'sprite-227',449,6,227]);
 assert.deepEqual([audit.runtime.actionScript.tagCounts.DoAction,audit.runtime.sourceTagCounts.DefineButton2,
  audit.runtime.sourceTagCounts.DefineEditText,audit.runtime.sourceTagCounts.DefineMorphShape],[31,7,3,62]);
 assert.equal(audit.capabilityBoundary.xmlCompleteStructuralEvidence,false);
 assert.equal(audit.capabilityBoundary.originalRuntimeObserved,false);
 assert.deepEqual(audit.warningReconciliation.unresolvedBinaryTail.map(x=>[x.domain,x.bytes,x.sha256]),
  [[TRAILER.domain,TRAILER.bytes,TRAILER.sha256]]);
 assert.equal(audit.warningReconciliation.taggedAudioTraversal.trailerAppendedToAudio,false);
 assert.equal(audio.kind,'alg-l06-p014-audio-source-audit-v1');
 assert.deepEqual([audio.domainCount,audio.streamCount],[14,8]);
 assert.deepEqual(audio.trailers.map(x=>[x.domain,x.bytes,x.sha256]),
  [[TRAILER.domain,TRAILER.bytes,TRAILER.sha256]]);
 const main=audio.streams.find(x=>x.domain==='sprite-227');
 assert.deepEqual(main.contiguousRanges.map(x=>[x.firstFrame,x.lastFrame]),CONTINUOUS.mainRangeFrames);
 assert.deepEqual([main.blockCount,main.extractedMp3.bytes],[434,179530]);
 assert.deepEqual(audio.streams.filter(x=>x.domain!==main.domain).map(x=>x.domain).sort(),
  [...FEEDBACK.right,...FEEDBACK.wrong].map(x=>x[0]).sort());
 assert.equal(audio.limits.trailingBytesAreNotInterpretedAsTags,true);
 assert.equal(audio.limits.branchPlaybackScheduleResolved,false);
 assert.equal(audio.limits.separateSaExplicitTriggerRequired,true);
 assert.equal(audio.limits.separateSaSplicedIntoMain,false);
 assert.equal(audio.limits.localeChangeStartsSa,false);
 assert.deepEqual(pin(audio.separateSa.copy),SA_COPY);
 assert.equal(behavior.kind,'alg-l06-p014-source-behavior-audit-v1');
 assert.deepEqual([behavior.mainQuizHold.domain,behavior.mainQuizHold.frame],['sprite-227',120]);
 assert(behavior.mainQuizHold.effects.includes('stop'));
 assert.deepEqual(behavior.feedback.right.map(x=>[x.domain,x.terminalFrame]),FEEDBACK.right);
 assert.deepEqual(behavior.feedback.wrong.map(x=>[x.domain,x.holdFrame,x.resumeFrame,
  x.ackButtonCharacterId,x.terminalFrame]),FEEDBACK.wrong);
 assert.equal(behavior.feedback.tryLimit,2);
 assert.equal(behavior.oldHost.exactP014LaunchObserved,false);
 assert(Object.values(behavior.acceptanceEffects).every(x=>x===false));
 assert.equal(text.kind,'alg-l06-p014-text-state-audit-v1');
 assert.equal(text.animationId,ID);
 assert.equal(glossary.kind,'alg-l06-p014-input-output-glossary-crosswalk-v1');
 assert.deepEqual(glossary.buttons.map(x=>[x.characterId,x.key,x.actionSha256]),
  Object.values(GLOSSARY).map(x=>[x.characterId,x.sourceKey,x.actionSha256]));
 assert.deepEqual(glossary.terms.map(x=>[x.sourceKeyAttribute,x.id]),[['Input','input'],['Output','output']]);
 assert.equal(glossary.originalHost.actualLaunchObserved,false);
 assert.equal(canvas.kind,'alg-l06-p014-maintained-canvas-v1');
 assert.deepEqual(pin(canvas.source),SOURCE);
 assert.deepEqual([canvas.rootFrame,canvas.mainFrameCount],[6,449]);
 assert.equal(canvas.sourceGlyphRendering.nativeBinding,'semantic-flow-companion');
 assert.equal(canvas.sourceGlyphRendering.preserved,true);
 assert.equal(canvas.sourceMorphCharacterIds.length,62);
 assert.equal(canvas.sourceMaskNormalization.length,3);
 assert.deepEqual(Object.entries(canvas.feedbackDomains).map(([domain,v])=>[domain,v.frameCount]),
  [...FEEDBACK.right,...FEEDBACK.wrong].map(x=>[x[0],x.at(-1)]));
 assert.deepEqual(canvas.sourceAudioTrailer,{bytes:TRAILER.bytes,sha256:TRAILER.sha256,
  includedInTaggedAudio:false});
 assert(canvas.outputs.some(x=>JSON.stringify(pin(x))===JSON.stringify(CANVAS_SOURCE)));
 assert.equal(browser.kind,'alg-l06-p014-browser-decode-v1');
 assert.equal(browser.results.length,10);
 assert(browser.results.every(x=>x.playbackStarted===false));
 assert.equal(browser.originalRuntimeAccepted,false);assert.equal(browser.listeningAccepted,false);
 for(const item of [...MAIN_AUDIO,SA_COPY,CANVAS_SOURCE])readPin(root,item);
 const local=[SOURCE_AUDIT,AUDIO_AUDIT,BEHAVIOR_AUDIT,textAuditPin,GLOSSARY_AUDIT,
  CANVAS_MANIFEST,BROWSER_AUDIO,...MAIN_AUDIO,SA_COPY,CANVAS_SOURCE,
  ...MAINTAINED_PATHS.map(relative=>pinFile(root,relative))];
 const external=[SOURCE,XML,SA].map(item=>({root:SOURCE_ROOT,pin:item}));
 for(const item of [audit.catalog,...audit.artifacts,...text.inputs,text.output,
  ...canvas.inputs,...canvas.outputs,...Object.values(behavior.actionPins),
  glossary.inputs.source,glossary.inputs.composition,glossary.inputs.scripts,
  glossary.inputs.predecessor,...Object.values(glossary.inputs.dictionaryBanks)])
  collect(root,item,local,external);
 const byAbsolute=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),previous=byAbsolute.get(key);
  if(previous)assert.deepEqual(previous,item,`conflicting external pin: ${key}`);
  else byAbsolute.set(key,item);}
 return {audit,audio,behavior,text,glossary,canvas,browser,localInputs:uniquePins(local),
  external:[...byAbsolute.values()].sort((a,b)=>path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
/** Packet semantics only; readP014Artifacts and readPageProof verify physical admission. */
export function validateP014AdmissionSemantics(packet,registration,root){
 assert(root,'P014_REQUIRES_CURRENT_ROOT');
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.glossaryActions,GLOSSARY);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=proposedP014Artifacts(root);
 assert.deepEqual(packet.entry?.artifacts,artifacts);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:14,sourceOccurrence:14,sectionCode:'VB',
  sectionPageOrdinal:4,complexityLane:COMPLEXITY_LANE,runtime:p014Runtime(artifacts)}]);
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
 for(const required of [SOURCE_AUDIT,AUDIO_AUDIT,BEHAVIOR_AUDIT,pinFile(root,TEXT_AUDIT_PATH),GLOSSARY_AUDIT,
  CANVAS_MANIFEST,BROWSER_AUDIO,...MAIN_AUDIO,SA_COPY,CANVAS_SOURCE,
  ...MAINTAINED_PATHS.map(relative=>pinFile(root,relative)),...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P014 evidence: ${required.path}`);
 for(const item of packet.integrity.files)
  assert(!FORBIDDEN.has(item.path)&&item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
   `no registry-dependent P014 evidence: ${item.path}`);
 return true;
}
