/** P020 source-backed, local-only admission proposal. No registration side effects. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p020';
export const CALIBRATION='g678-alg-l06-p020-current-js-20260929-v2';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v2.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB13.swf',bytes:143936,
 sha256:'6d0df40af188c98b77a7419b89223c922200723ce106240a6d08e49891a5d25f'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB13.mp3',bytes:66864,
 sha256:'f4ba15d3d1d483da6bb90e46a444196f7d80b910af862d2b03c56f3a1f2618d4'};
export const CANVAS_SOURCE={path:'output/alg-l06-p020-canvas-v1/canvas-renderer.js',
 bytes:1459184,sha256:'24223de75354e7d58dc197bf350ccea41af142b9eac715b28e449876f7548331'};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='behavior-heavy';
export const FEEDBACK=Object.freeze([
 ['right',1,'sprite-157',28,null,null],['right',2,'sprite-128',33,null,null],
 ['right',3,'sprite-108',32,null,null],['right',4,'sprite-141',28,null,null],
 ['wrong',1,'sprite-65',28,23,24],['wrong',2,'sprite-94',28,20,21],
 ['wrong',3,'sprite-80',28,21,22]]);
export const AUDIO_SOURCES=Object.freeze([
 {domain:'sprite-65',path:'output/alg-l06-p020-audio-v1/sprite-65-source-v1.mp3',bytes:11050,sha256:'1c3e481dcaa018b19c5b24eaa05b11d88e7cb75a640acd8a06133ccf3ff0c7e5'},
 {domain:'sprite-80',path:'output/alg-l06-p020-audio-v1/sprite-80-source-v1.mp3',bytes:11050,sha256:'3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0'},
 {domain:'sprite-94',path:'output/alg-l06-p020-audio-v1/sprite-94-source-v1.mp3',bytes:10270,sha256:'1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e'},
 {domain:'sprite-108',path:'output/alg-l06-p020-audio-v1/sprite-108-source-v1.mp3',bytes:12350,sha256:'7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11'},
 {domain:'sprite-128',path:'output/alg-l06-p020-audio-v1/sprite-128-source-v1.mp3',bytes:12740,sha256:'c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e'},
 {domain:'sprite-141',path:'output/alg-l06-p020-audio-v1/sprite-141-source-v1.mp3',bytes:11570,sha256:'ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8'},
 {domain:'sprite-157',path:'output/alg-l06-p020-audio-v1/sprite-157-source-v1.mp3',bytes:11050,sha256:'3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7'},
 {domain:'sprite-162',path:'output/alg-l06-p020-audio-v1/sprite-162-source-v1.mp3',bytes:70850,sha256:'fedf4b38d47116379c961728cc7088481bef08a11eb1e739c39b86365e8a8dd3'},
]);
export const GLOSSARY=Object.freeze({
 Input:{buttonId:7,entryId:'input',instanceId:'sprite-162/depth-3/generation-1',firstFullHitFrame:7,
  sourceActionSha256:'2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5'},
 Function:{buttonId:8,entryId:'function',instanceId:'sprite-162/depth-5/generation-1',firstFullHitFrame:7,
  sourceActionSha256:'549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8'},
 Output:{buttonId:9,entryId:'output',instanceId:'sprite-162/depth-7/generation-1',firstFullHitFrame:7,
  sourceActionSha256:'1262eac21bf8a718d551c8d7b046220855f8f878214783cfdfb7d0c37f5ff5c7'},
});
export const CONTINUOUS=Object.freeze({mainDomain:'sprite-162',mainFrames:172,
 quizStopFrame:58,mainResumeFrame:59,feedback:FEEDBACK,sourceAudio:AUDIO_SOURCES,
 mainStreamsConcatenated:false,feedbackStreamsConcatenated:false,
 sprite94NegativeSeekSemanticsResolved:false,syntheticSilenceAdded:false,
 originalHostBindingObserved:false,originalRuntimeAccepted:false,
 listeningAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,
 sourceCopy:{...SA,path:'output/alg-l06-p020-audio-v1/separate-sa-source-v1.mp3'},
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
 mainPausedDuringPlayback:true,returnMainSupported:true,audioAccepted:false});
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`});
export const AUDIT_PATHS=Object.freeze({intake:'output/alg-l06-p020-intake-recon-v1/intake-recon-v1.json',
 source:'output/alg-l06-p020-source-audit-v1/source-audit-v1.json',
 frames:'output/alg-l06-p020-source-audit-v1/domain-frame-states-v1.json',
 behavior:'output/alg-l06-p020-behavior-v1/source-behavior-audit-v1.json',
 text:`migrations/${ID}/audit/text-state-v1/text-state-source-v1.json`,
 audio:'output/alg-l06-p020-audio-v1/audio-source-audit-v1.json',
 plan:'output/alg-l06-p020-audio-v1/domain-audio-plan-v1.json',
 browser:'output/alg-l06-p020-audio-v1/browser-decode-v1/decode-receipt.json',
 canvas:'output/alg-l06-p020-canvas-v1/canvas-manifest.json',
 metadata:'output/alg-l06-p020-canvas-v1/canvas-metadata-v1.json'});
export const MAINTAINED_PATHS=Object.freeze([
 'packages/demos/src/alg-l06-p020-timeline-v1.ts',
 'packages/demos/src/alg-l06-p020-state-v1.ts',
 'packages/demos/src/alg-l06-p020-audio-schedule-v1.ts',
 'packages/demos/src/alg-l06-p020-clock-v1.ts',
 'packages/demos/src/alg-l06-p020-audio-owner-v1.ts',
 'packages/demos/src/alg-l06-p020-optional-spanish-audio-v1.ts',
 'packages/demos/src/alg-l06-p020-native-text-v1.tsx',
 'packages/demos/src/alg-l06-p020-player-v1.tsx',
 'packages/demos/src/generated/alg-l06-p020-audio-plan-v1.ts',
 'packages/demos/src/generated/alg-l06-p020-text-state-v1.ts']);
const pin=({path,bytes,sha256})=>({path,bytes,sha256});
function requirePin(root,item,local,external){
 if(!item||typeof item.path!=='string'||!Number.isSafeInteger(item.bytes)||
  !/^[a-f0-9]{64}$/u.test(item.sha256))throw Error('P020_INVALID_EVIDENCE_PIN');
 const exact=pin(item);
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const holder=exact.path.startsWith(`${root}/`)?root:
  exact.path.startsWith(`${SOURCE_ROOT}/`)?SOURCE_ROOT:path.dirname(exact.path);
 const relative={...exact,path:path.relative(holder,exact.path)};
 readPin(holder,relative);
 if(holder===root)local.push(relative);else external.push({root:holder,pin:relative});
}
export function proposedP020Artifacts(root){return {
 module:pinFile(root,ARTIFACT_PATHS.module),timeline:pinFile(root,ARTIFACT_PATHS.timeline),
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime}};}
export function readP020Artifacts(root){
 const artifacts={module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime:pinFile(root,ARTIFACT_PATHS.runtime)};
 assert.deepEqual(artifacts.runtime,{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
  'exact physical P020 Canvas member');return artifacts;
}
export function p020Runtime(artifacts){return Object.freeze({frameDomain:'sprite-162',
 frameCount:172,rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 quizHoldFrame:58,feedbackDomains:FEEDBACK.map(row=>row[2]),
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false});}

/** Verify current physical bytes and semantic identities; original Flash playback is not inferred. */
export function readP020CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const migration=readJsonPin(root,pinFile(root,`migrations/${ID}/migration.json`));
 const audits=Object.fromEntries(Object.entries(AUDIT_PATHS).map(([key,relative])=>
  [key,readJsonPin(root,pinFile(root,relative))]));
 const {intake,source,frames,behavior,text,audio,plan,browser,canvas,metadata}=audits;
 assert.deepEqual([migration.id,migration.animationId,migration.assetId,
  migration.source.swfSha256,migration.runtime.complexity,migration.status],
  [ID,ID,`swf-${SOURCE.sha256}`,SOURCE.sha256,COMPLEXITY_LANE,'preserved']);
 assert.deepEqual([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,migration.acceptance.ownerReview.decision],
  ['pending','pending','pending']);
 assert.deepEqual([intake.identity.animationId,intake.identity.globalOrdinal,
  intake.identity.sectionCode,intake.identity.sectionPageOrdinal,
  intake.source.samePathFlaExists],[ID,20,'VB',10,false]);
 assert.deepEqual([source.kind,source.source.sha256,source.identity.mainDomain,
  source.identity.mainFrameCount,source.identity.rootEntryFrame,
  source.sourceSummary.staticTextDefinitions,source.sourceSummary.dynamicFields,
  source.audioDomains.length,source.limits.originalRuntimeObserved],
  ['alg-l06-p020-source-text-display-domain-audit-v1',SOURCE.sha256,'sprite-162',
   172,6,36,3,8,false]);
 assert.deepEqual([frames.sourceSha256,frames.domains.find(row=>
  row.timelineId==='sprite-162')?.frameCount], [SOURCE.sha256,172]);
 assert.deepEqual([behavior.kind,behavior.source.sha256,behavior.main.domain,
  behavior.main.frameCount,behavior.main.quizStopFrame,
  behavior.answers.length,behavior.limits.originalRuntime],
  ['alg-l06-p020-source-behavior-audit-v1',SOURCE.sha256,'sprite-162',172,58,4,false]);
 assert.deepEqual(behavior.feedback.map(row=>[row.kind,row.ordinal,row.domain,
  row.terminalFrame,row.holdFrame??null,row.resumeFrame??null]),FEEDBACK);
 assert.deepEqual([behavior.semantics.firstWrongTerminal,behavior.semantics.secondWrongTerminal,
  behavior.semantics.wrongClose,behavior.semantics.rightTerminal],
  ['increment try count to1 and allow retry at main58',
   'reset try count0, quizSection false, resume main',
   'resume own feedback tail; does not skip directly to retry',
   'disable answers, quizSection false, resume main without changing try count']);
 assert.equal(behavior.hostReference.qualification.includes('no P020 original-host execution observed'),true);
 assert.deepEqual([text.animationId,text.sourceSwfSha256,text.frameDomain,text.frameCount,
  text.policy.canvasGlyphs,text.policy.language,text.policy.originalRuntimeAccepted],
  [ID,SOURCE.sha256,'sprite-162',172,'preserved','source-en-fallback',false]);
 assert.deepEqual(text.options.map(row=>[row.option,row.value,
  row.sourceInteractiveFrame,row.visibleSpans]),
  [['A','1',58,[[7,59]]],['B','-2',58,[[7,172]]],
   ['C','3',58,[[7,59]]],['D','5',58,[[7,59]]]]);
 for(const [key,expected] of Object.entries(GLOSSARY)){
  const item=text.glossaryControls.find(row=>row.key===key);
  assert(item,`source glossary key: ${key}`);
  assert.deepEqual([item.buttonId,item.sourceButtonInstanceId,item.firstCandidateFrame,
   item.sourceActionSha256,item.availableSpans],
   [expected.buttonId,expected.instanceId,expected.firstFullHitFrame,
    expected.sourceActionSha256,[[7,172]]]);
 }
 assert.equal(text.glossaryControls.length,3);
 assert.deepEqual([audio.source.swf.sha256,audio.source.separateSa.sha256,
  audio.streams.length,plan.domains.length,plan.policy.sprite94NegativeSeekUnresolved,
  plan.policy.noInventedSilence,plan.policy.originalRuntimeObserved],
  [SOURCE.sha256,SA.sha256,8,8,true,true,false]);
 assert.deepEqual(audio.streams.map(row=>({domain:row.domain,...pin(row.extractedMp3)})),
  AUDIO_SOURCES);
 assert.deepEqual(plan.domains.map(row=>({domain:row.domain,...pin(row.extractedMp3)})),
  AUDIO_SOURCES);
 assert.deepEqual(audio.streams.find(row=>row.domain==='sprite-94').negativeSeekBlocks.map(row=>
  [row.frame,row.rawSeekSamples,row.mp3Bytes]),[[27,-2093,0]]);
 assert.deepEqual([plan.optionalSpanishAudio.asset.sha256,
  plan.optionalSpanishAudio.activation,plan.optionalSpanishAudio.localeAutoplay,
  plan.optionalSpanishAudio.joinedWithMain],
  [SA.sha256,'explicit-user-only',false,false]);
 assert.equal(browser.kind,'alg-l06-p020-browser-decode-v1');
 assert.equal(browser.results.length,9);assert(browser.results.every(row=>
  row.playbackStarted===false&&row.sourceNodeCreated===false&&row.contextClosed===true));
 for(const asset of [...AUDIO_SOURCES,{domain:'separate-sa',...OPTIONAL_SPANISH.sourceCopy}]){
  const row=browser.results.find(result=>result.domain===asset.domain);
  assert(row,`browser decoded source domain: ${asset.domain}`);
  assert.deepEqual([row.sourceBytes,row.sourceSha256,row.channels],
   [asset.bytes,asset.sha256,1]);
 }
 assert.deepEqual([canvas.kind,canvas.source.sha256,canvas.main.domain,canvas.main.frames,
  canvas.main.quizStop,metadata.frameDomain,metadata.frameCount,
  metadata.sourceMainStopFrame,metadata.assetSha256,
  metadata.sourceGlyphRendering.preservedStatic],
  ['alg-l06-p020-branch-canvas-candidate-v1',SOURCE.sha256,'sprite-162',172,58,
   'sprite-162',172,58,CANVAS_SOURCE.sha256,true]);
 assert.equal(Object.keys(metadata.feedbackDomains).length,7);
 readPin(root,CANVAS_SOURCE);
 const local=[pinFile(root,`migrations/${ID}/migration.json`),
  ...Object.values(AUDIT_PATHS).map(relative=>pinFile(root,relative)),CANVAS_SOURCE,
  ...MAINTAINED_PATHS.map(relative=>pinFile(root,relative))];
 const external=[SOURCE,XML,SA].map(item=>({root:SOURCE_ROOT,pin:item}));
 const references=[...Object.values(source.inputs),
  {...source.frameEvidence,path:`output/alg-l06-p020-source-audit-v1/${source.frameEvidence.path}`},
  behavior.xml,behavior.exportReceipt,behavior.hostReference.pin,
  ...text.inputs,plan.audit,...plan.domains.map(row=>row.extractedMp3),
  plan.optionalSpanishAudio.asset,...canvas.inputs,...canvas.outputs];
 for(const item of references)if(item)requirePin(root,item,local,external);
 const uniqueExternal=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),old=uniqueExternal.get(key);
  if(old)assert.deepEqual(old,item,`conflicting external source: ${key}`);else uniqueExternal.set(key,item);}
 return {...audits,migration,localInputs:uniquePins(local),
  external:[...uniqueExternal.values()].sort((a,b)=>
   path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}
const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
export function validateP020AdmissionSemantics(packet,registration,root){
 assert(root,'P020_REQUIRES_CURRENT_ROOT');
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.sourceRoot,packet.scope,
  packet.deploymentScope],[1,CALIBRATION,SOURCE_ROOT,'private-engineering','local-only']);
 assert.deepEqual([packet.source,packet.sourceXml,packet.continuousSource,
  packet.optionalSpanishAudio,packet.glossaryActions,packet.acceptanceEffects],
  [SOURCE,XML,CONTINUOUS,OPTIONAL_SPANISH,GLOSSARY,ACCEPTANCE]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=proposedP020Artifacts(root);
 assert.deepEqual(packet.entry,{key:ID,module:`./modules/${ID}`,
  maturity:'private-current-js',complexityLane:COMPLEXITY_LANE,artifacts});
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:20,sourceOccurrence:20,sectionCode:'VB',
  sectionPageOrdinal:10,complexityLane:COMPLEXITY_LANE,runtime:p020Runtime(artifacts)}]);
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert(Number.isSafeInteger(packet.freezeManifest.bytes)&&packet.freezeManifest.bytes>0);
 assert(/^[a-f0-9]{64}$/u.test(packet.freezeManifest.sha256));
 assert.deepEqual(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert.equal(packet.integrity.completeTransitiveClosure,false);
 const evidence=new Map(packet.integrity.files.map(item=>[item.path,item]));
 const source=readP020CanonicalSource(root);
 for(const required of [...source.localInputs,...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P020 evidence: ${required.path}`);
 for(const item of packet.integrity.files)assert(!FORBIDDEN.has(item.path)&&
  item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
  !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
  `no registration-dependent P020 evidence: ${item.path}`);
 return true;
}
