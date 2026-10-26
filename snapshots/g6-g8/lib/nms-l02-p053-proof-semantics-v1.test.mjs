import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as S from './nms-l02-p053-proof-semantics-v1.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const audit=name=>JSON.parse(fs.readFileSync(path.join(ROOT,
 `migrations/shared-nms002-l02-p053/audit/${name}.json`)));
const clone=value=>structuredClone(value);
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
const fake=(relative,letter='a')=>({path:relative,bytes:1,sha256:letter.repeat(64)});

function sourceFixture(){return{
 native:audit('native-display-product-v1'),visual:audit('visual-scene-v1'),
 stream:audit('source-stream-product-v1'),
 host:audit('host-navigation-resolution-v1'),
 audioStructure:audit('audio-structure-v1'),
};}

function domFixture(){
 const module=fake(S.P053_MODULE_PATH),timeline=fake(S.P053_TIMELINE_PATH);
 const sourceRun=fake(S.P053_RUN_PATH),memberManifest=fake(S.P053_MEMBER_PATH);
 const artifacts={kind:'maintained-dom-module-v1',module,timeline,sourceRun,memberManifest};
 const rawExports=Array.from({length:68},(_,i)=>fake(`/tmp/p053-shapes/${i}.svg`));
 const externalEvidence=[
  {...S.P053_SOURCE,path:path.join(S.P053_SOURCE_ROOT,S.P053_SOURCE.path)},
  {...S.P053_XML,path:path.join(S.P053_SOURCE_ROOT,S.P053_XML.path)},
  S.P053_MOVIE_XML,S.P053_IDENTIFIED_HOST_BINDING,
  S.P053_AUDIO.mp3,S.P053_AUDIO.rawIndex,...rawExports,
 ].sort((a,b)=>a.path.localeCompare(b.path));
 const inputs=[...Object.values(S.P053_SOURCE_AUDITS),module,timeline,
  ...S.P053_REQUIRED_PAGE_PATHS.filter(item=>![S.P053_RUN_PATH,S.P053_MEMBER_PATH,
   S.P053_MODULE_PATH,S.P053_TIMELINE_PATH,...Object.values(S.P053_SOURCE_AUDITS).map(x=>x.path)]
   .includes(item)).map(item=>fake(item)),
 ].sort((a,b)=>a.path.localeCompare(b.path));
 const sharedDependencies=S.P053_SHARED_DEPENDENCY_PATHS.map(item=>fake(item));
 const run={schemaVersion:1,kind:'nms-l02-p053-maintained-dom-source-run-v1',
  animationId:S.P053_ADMISSION_ID,sourceRoot:S.P053_SOURCE_ROOT,
  complexityLane:'behavior-heavy',source:S.P053_SOURCE,sourceXml:S.P053_XML,
  sourceStructure:{stage:{width:800,height:600},fps:12,rootFrameCount:10,
   rootBeginFrame:6,frameDomain:'sprite-187',sourceFrameCount:694,maintainedHeldFrame:693,
   sourceFrameIntrospectionOnly:true,genericFrameCompletionAvailable:false,
   originalRuntimeParityEstablished:false},
  sourceActions:{freshScripts:Array.from({length:59},(_,i)=>fake(`as/${String(i).padStart(2,'0')}.as`)),
   earlyStartBasename:'L7GS03',lateStartBasename:'L2GS03',popupCloseReceiverResolved:false},
  audio:{source:S.P053_AUDIO.mp3,rawIndex:S.P053_AUDIO.rawIndex,blockCount:619,
   firstBlockFrame:4,lastBlockFrame:694,decodedSamples:1135296,acceptedCueCount:0,
   sourceAlignmentAccepted:false,listeningAccepted:false,independentUserTriggeredFullMp3:true,
   localeAutoPlayback:false,spanishAudioActivated:false},
  shapes:{exported:68,consumed:48,rawExports},sourceKeyAttributeCalls:0,glossary:[],
  behavior:{controller:inputs.find(item=>item.path==='packages/demos/src/nms-l02-p053-controller-candidate.ts'),
   player:inputs.find(item=>item.path==='packages/demos/src/nms-l02-p053-player-state-v1.ts'),
   scene:inputs.find(item=>item.path==='packages/demos/src/nms-l02-p053-source-scene-v1.tsx'),
   runtimeAdapter:inputs.find(item=>item.path==='apps/web/components/nms-l02-p053-lesson-runtime-v1.tsx'),
   audioLoader:inputs.find(item=>item.path==='packages/demos/src/nms-l02-p053-source-audio-loader.ts'),
   hostNavigation:inputs.find(item=>item.path==='packages/demos/src/nms-l02-p053-host-navigation-v1.ts'),
   browserEvidence:'separate-formal-page-proof-not-in-this-dom-run',hostPlaybackCompletion:false},
  inputs,outputs:[module,timeline],sharedDependencies,externalEvidence,
  deferredHostPaths:[
   'apps/web/components/g678-nms-l02-p053-product-lesson-v1.generated.tsx',
   'apps/web/lib/nms-l02-p053-product-candidate.server.ts',
   'apps/web/lib/nms-l02-p053-source-audio.server.ts',
   'apps/web/lib/nms-l02-p053-game-resource-access.ts',
   'apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l02-p053/page.tsx',
  ],
  completeTransitiveClosure:false,productCalibrationPassed:false,scaleOutAuthorized:false,
  acceptanceEffects:S.P053_ACCEPTANCE_EFFECTS,
 };
 const member={schemaVersion:1,kind:'nms-l02-p053-maintained-dom-member-v1',
  animationId:S.P053_ADMISSION_ID,rendererBindingKind:'maintained-dom-module-v1',
  source:S.P053_SOURCE,sourceXml:S.P053_XML,sourceRun,module,timeline,
  inputs,outputs:[module,timeline],externalEvidence,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,
  acceptanceEffects:S.P053_ACCEPTANCE_EFFECTS};
 return {run,member,artifacts};
}

function packetFixture(artifacts,files,sharedDependencies){
 const entry={key:S.P053_ADMISSION_ID,module:`./modules/${S.P053_ADMISSION_ID}`,
  maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts};
 const freeze=fake(S.P053_FREEZE_PATH);
 const packet={schemaVersion:1,calibrationId:S.P053_ADMISSION_CALIBRATION,
  sourceRoot:S.P053_SOURCE_ROOT,scope:'private-engineering',deploymentScope:'local-only',
  source:S.P053_SOURCE,sourceXml:S.P053_XML,
  selectedPages:[{animationId:S.P053_ADMISSION_ID,placementId:S.P053_ADMISSION_ID,
   assetId:`swf-${S.P053_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',
   sourceSha256:S.P053_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
   globalPageOrdinal:53,sourceOccurrence:53,sectionCode:'GS',sectionPageOrdinal:1,
   complexityLane:'behavior-heavy',runtime:S.P053_RUNTIME}],
  entry,sourceAudits:S.P053_SOURCE_AUDITS,
  audio:{source:S.P053_AUDIO.mp3,rawIndex:S.P053_AUDIO.rawIndex,blockCount:619,
   firstBlockFrame:4,lastBlockFrame:694,decodedSamples:1135296,
   independentUserTriggeredFullMp3:true,localeAutoPlayback:false,
   spanishAudioActivated:false,sourceAlignmentAccepted:false,listeningAccepted:false,
   originalRuntimeAccepted:false},
  behavior:{earlyStartBasename:'L7GS03',earlyStartResolution:'current-page-reload',
   lateStartBasename:'L2GS03',lateStartResolution:'P054-level-scoped-handoff',
   popupSpriteId:104,popupTextIds:[13,16,102,103],popupCloseReceiverResolved:false,
   sourceFrameCount:694,maintainedHeldFrame:693,hostPlaybackCompletion:false,
   originalHostNavigationObserved:false,originalRuntimeParityEstablished:false},
  glossary:[],sourceKeyAttributeCalls:0,acceptanceEffects:S.P053_ACCEPTANCE_EFFECTS,
  productCalibrationPassed:false,scaleOutAuthorized:false,freezeManifest:freeze,
  integrity:{scope:'single-NMS-L02-P053-source-and-implementation',
   completeTransitiveClosure:false,
   qualification:'popup-close original-host audio-sync completion remain unestablished',
   files,sharedDependencies}};
 const registration={calibrationId:S.P053_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.P053_FREEZE_PATH,freezeManifestBytes:freeze.bytes,
  freezeManifestSha256:freeze.sha256,entries:[entry]};
 return {packet,registration,freeze};
}

test('real reviewed source audits retain popup, hold, audio gaps and host branch limits',()=>{
 const facts=sourceFixture();
 assert.equal(S.validateP053SourceInventory(facts),true);
 const popup=clone(facts);popup.native.domains.find(item=>item.id==='sprite-104').placements[2].characterId=999;
 assert.throws(()=>S.validateP053SourceInventory(popup),/four readable source text placements/u);
 const wording=clone(facts);wording.native.textDefinitions.find(item=>item.characterId===102).sourceText='Ten points';
 assert.throws(()=>S.validateP053SourceInventory(wording),/exact popup source text 102/u);
 const clock=clone(facts);clock.visual.mainFrameDomain.nextFrameAutoReachedEstablished=true;
 assert.throws(()=>S.validateP053SourceInventory(clock),/held frame 693/u);
 const audio=clone(facts);audio.stream.stream.missingFrameRanges=[];
 assert.throws(()=>S.validateP053SourceInventory(audio),/619 blocks/u);
 const host=clone(facts);host.host.p053Actions.earlyStart.matchesCurrentGsSection=true;
 assert.throws(()=>S.validateP053SourceInventory(host),/early current-page reload/u);
});

test('DOM contract requires all scripts, art, source pins and false gates',()=>{
 const {run,member,artifacts}=domFixture();
 assert.equal(S.validateP053DomManifests(run,member,artifacts),true);
 const missing=clone(run);missing.externalEvidence=missing.externalEvidence.filter(item=>
  item.path!==S.P053_AUDIO.rawIndex.path);
 assert.throws(()=>S.validateP053DomManifests(missing,member,artifacts),/external source\/resource/u);
 const changed=clone(run);changed.audio.localeAutoPlayback=true;
 assert.throws(()=>S.validateP053DomManifests(changed,member,artifacts),/independent full-buffer audio/u);
 const wrong=clone(member);wrong.sourceRun.sha256='b'.repeat(64);
 assert.throws(()=>S.validateP053DomManifests(run,wrong,artifacts),/member references reviewed run pin/u);
});

test('packet requires actual GS1 runtime and local-only fragment without parity promotion',()=>{
 const {run,artifacts}=domFixture();
 const {packet,registration}=packetFixture(artifacts,run.inputs,run.sharedDependencies);
 assert.equal(S.validateP053AdmissionSemantics(packet,registration),true);
 const held=clone(packet);held.selectedPages[0].runtime.heldFrame=694;
 assert.throws(()=>S.validateP053AdmissionSemantics(held,registration),/held-frame runtime/u);
 const close=clone(packet);close.behavior.popupCloseReceiverResolved=true;
 assert.throws(()=>S.validateP053AdmissionSemantics(close,registration),/source directions/u);
 const audio=clone(packet);audio.audio.localeAutoPlayback=true;
 assert.throws(()=>S.validateP053AdmissionSemantics(audio,registration),/independent source MP3/u);
 const fragment=clone(registration);fragment.deploymentScope='production';
 assert.throws(()=>S.validateP053AdmissionSemantics(packet,fragment),/local-only registration/u);
});

test('proof closure fails closed without an independently reviewed seal',()=>{
 const {run,member,artifacts}=domFixture();
 const pageFiles=[...run.inputs,fake(S.P053_RUN_PATH),fake(S.P053_MEMBER_PATH),
  fake('lib/nms-l02-p053-proof-semantics-v1.mjs'),
  fake('lib/nms-l02-p053-proof-semantics-v1.test.mjs')]
  .filter((item,index,array)=>array.findIndex(other=>other.path===item.path)===index)
  .sort((a,b)=>a.path.localeCompare(b.path));
 const {packet,registration,freeze}=packetFixture(artifacts,pageFiles,run.sharedDependencies);
 const fragment=fake(S.P053_FRAGMENT_PATH);
 const external=run.externalEvidence.map(item=>item.path.startsWith(`${S.P053_SOURCE_ROOT}/`)
  ? {root:S.P053_SOURCE_ROOT,pin:{...item,path:path.relative(S.P053_SOURCE_ROOT,item.path)}}
  : {root:path.dirname(item.path),pin:{...item,path:path.basename(item.path)}});
 const proof={schemaVersion:1,kind:'nms-l02-page-proof-v1',
  hostContract:'nms-l02-source-bound-host-v1',animationId:S.P053_ADMISSION_ID,
  freeze,packet:{...packet,freezeManifest:undefined},registration,
  files:[...pageFiles,freeze,fragment].sort((a,b)=>a.path.localeCompare(b.path)),external};
 const reviewed={runManifest:run,memberManifest:member,artifacts,pageFiles,
  externalEvidence:run.externalEvidence};
 assert.throws(()=>S.validateP053ProofClosure(proof),/reviewed DOM manifest/u);
 assert.equal(S.validateP053ProofClosure(proof,reviewed),true);
 const sparse=clone(proof);sparse.packet.integrity.files=sparse.packet.integrity.files.filter(item=>
  item.path!==S.P053_SOURCE_AUDITS.native.path);
 assert.throws(()=>S.validateP053ProofClosure(sparse,reviewed),/complete independently reviewed page pins/u);
 const changed=clone(proof);changed.external=changed.external.filter(item=>
  item.pin.sha256!==S.P053_AUDIO.mp3.sha256);
 assert.throws(()=>S.validateP053ProofClosure(changed,reviewed),/all external files retained/u);
});
