import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL6P041FormalDescriptor} from './alg-l06-p041-formal-admission-v1.server';
import {P042_SOURCE_BINDING as B} from './alg-l06-p042-source-binding-v1';
import {P042_ID as ID,P042_SOURCE_ROOT,p042LocalDevelopment}
 from './alg-l06-p042-preview-policy-v1';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

const SHA='7df2077da472138df83a4485c0e15b7f3b1063aefcdcf2e3ded9232c98f68fcb';
const SA='1af6e25217490b60e3bce052a5e29f3be3d5ce932389a48de14bde0369603907';
const CANVAS='8eebb94446a095f5219bc5b3b46f740179d92e8ee6260a6a5cfa2d9d34fae8f4';
const CALIBRATION='g678-alg-l06-p042-current-js-20261002-v1';
const FREEZE_SHA='d94696dd5ff21b0956abc8044ac5477ca299fda62a45d2ba6b54790cd2fab2c7';
const GLOSSARY={path:'migrations/shared-alg001-l06-p042/behavior-v1/source-glossary-additions-v1.json',
 bytes:2658,sha256:'0117f94cda7d2f4a9e25b1f40905b0cc3d04a419ba85720bfa0b0e343288f6a5'};
const KEYTERM_ROOT='/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const DICTIONARIES=[
 {path:'L1KTE01.xml',bytes:345838,sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
 {path:'L1KTS01.xml',bytes:344456,sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
] as const;
const PREDECESSOR_INDEX={path:'catalog/g678-admission-v1/index-v124.json',
 bytes:8896,sha256:'6eea846665bce7c1fb4e7593609dfbf844a73a9e0a27428e47ef327f5b4078d7'};
const PROOF_PATH='work/g678-workflow/candidates/shared-alg001-l06-p042-proof-v1.json';
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P042_FORMAL_DESCRIPTOR_INVALID: '+why);};

/** One registered, proof-backed P042 projection on the actual P041 formal base. */
export function algL6P042FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p042LocalDevelopment(),'exact local physical source and development scope');
 const root=getWorkspaceRoot(),predecessor=readJsonPin(root,PREDECESSOR_INDEX),
  index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host),
  tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(predecessor.pages.length===31&&index.pages.length>=32&&
  isDeepStrictEqual(index.pages.slice(0,31),predecessor.pages)&&
  own.length===1&&index.pages[31].animationId===ID&&
  own[0].proof.path===PROOF_PATH,'one P042 proof after the exact 31 predecessors');
 const entries:{key:string}[]=tx.registry.calibrations.flatMap((c:{entries:{key:string}[]})=>c.entries);
 demand(entries.filter(e=>e.key===ID).length===1&&
  entries.filter(e=>e.key.startsWith('shared-')).length>=522,
  'P042 retained in the admitted shared registry');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],
  meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.entries.length===1&&entry.key===ID&&
  entry.module===`./modules/${ID}`&&entry.maturity==='private-current-js'&&
  entry.complexityLane==='behavior-heavy'&&registration.deploymentScope==='local-only'&&
  registration.calibrationId===CALIBRATION&&
  registration.freezeManifestSha256===FREEZE_SHA&&
  isDeepStrictEqual(packet.entry,entry)&&
  entry.artifacts.module.path===`packages/demos/src/modules/${ID}.tsx`&&
  entry.artifacts.timeline.path===`packages/demos/src/timelines/${ID}.ts`&&
  entry.artifacts.runtime.sha256===B.canvasRenderer.sha256&&
  meta?.calibrationId===registration.calibrationId&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===entry.artifacts.runtime.sha256&&
  packet.freezeManifest.sha256===FREEZE_SHA,
  'actual registry, generated dispatch and exact maintained runtime');
 const sourcePins=[B.sourceAudit,B.sourcePins,B.behaviorIr,B.nativeModel,
  B.clipPlan,B.canvasMetadata,B.canvasRenderer,B.audioSchedule,B.clockIr,
  B.measuredBindings,GLOSSARY];
 demand(sourcePins.every(pin=>[...proof.files,...host.files].some(
  (row:{path:string;bytes:number;sha256:string})=>isDeepStrictEqual(row,pin))),
  'proof owns exact P042 source, audio, glossary and Canvas inputs');
 const selectedPage=packet.selectedPages[0],runtime=selectedPage.runtime;
 demand(selectedPage.animationId===ID&&selectedPage.placementId===ID&&
  selectedPage.assetId===`swf-${SHA}`&&selectedPage.sourceSha256===SHA&&
  selectedPage.moduleCode==='ALG001'&&selectedPage.lessonNumber===6&&
  selectedPage.globalPageOrdinal===42&&selectedPage.sourceOccurrence===42&&
  selectedPage.sectionCode==='TI'&&selectedPage.sectionPageOrdinal===1&&
  runtime.frameDomain==='sprite-341'&&runtime.frameCount===400&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.fps===12&&
  runtime.quizHoldFrame===279&&runtime.hostPlaybackCompletion===false&&
  runtime.originalRuntimeTimingAccepted===false&&
  isDeepStrictEqual(runtime.canvasRenderer,entry.artifacts.runtime),
  'exact source occurrence, quiz hold, runtime and open timing gate');
 demand(packet.sourceRoot===P042_SOURCE_ROOT&&
  isDeepStrictEqual(packet.source,B.physical.swf)&&
  isDeepStrictEqual(packet.sourceXml,B.physical.xml)&&
  isDeepStrictEqual(packet.optionalSpanishAudio?.source,B.physical.sa)&&
  packet.optionalSpanishAudio?.source.sha256===SA&&
  packet.optionalSpanishAudio?.trigger==='explicit-user-only'&&
  packet.optionalSpanishAudio?.localeAutoplay===false&&
  packet.optionalSpanishAudio?.mainStreamSpliced===false&&
  packet.optionalSpanishAudio?.audioAccepted===false&&
  packet.acceptanceEffects&&Object.values(packet.acceptanceEffects).length>0&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'physical source, explicit SA and independent acceptance gates');
 for(const pin of Object.values(B.physical))readPin(P042_SOURCE_ROOT,pin);
 const maintained=[B.sourceAudit,B.sourcePins,B.behaviorIr,B.nativeModel,
  B.clipPlan,B.canvasMetadata,B.canvasRenderer,B.audioSchedule,B.clockIr,
  B.measuredBindings];
 for(const pin of maintained)readPin(root,pin);
 for(const pin of DICTIONARIES)readPin(KEYTERM_ROOT,pin);
 const audit=readJsonPin(root,B.sourceAudit),ir=readJsonPin(root,B.behaviorIr),
  native=readJsonPin(root,B.nativeModel),canvas=readJsonPin(root,B.canvasMetadata),
  clock=readJsonPin(root,B.clockIr),glossary=readJsonPin(root,GLOSSARY);
 demand(audit.identity.animationId===ID&&audit.identity.xmlOccurrence===42&&
  audit.identity.section==='TI'&&audit.identity.sectionPageOrdinal===1&&
  audit.source.swf.sha256===SHA&&audit.source.lessonXml.sha256===B.physical.xml.sha256&&
  audit.source.separateSpanishAudioCandidate.sha256===SA,
  'exact physical source occurrence');
 demand(ir.identity.animationId===ID&&ir.identity.globalLessonOrdinal===42&&
  ir.identity.sourcePage==='TI/L6TI02.swf'&&ir.identity.xmlTitleEnglish==='Question 1'&&
  ir.nativeTimeline.mainSpriteId===341&&ir.nativeTimeline.mainFrames===400&&
  ir.nativeTimeline.quizHoldFrame===279&&ir.nativeTimeline.terminalFrame===400&&
  ir.quiz.visibleAnswerLabels.status==='source-stage-bound'&&
  ir.quiz.visibleAnswerLabels.browserHitParityAccepted===false&&
  ir.quiz.visibleAnswerLabels.originalRuntimeOutcomeVerified===false&&
  isDeepStrictEqual(ir.quiz.answerInstancePlacementsAtFrame279.map(
   (x:{instance:string;branch:string;letter:string;value:string})=>
   [x.letter,x.value,x.instance,x.branch]),[
    ['B','3','AnsBtn1','wrong'],['A','–3','AnsBtn2','right'],
    ['C','10','AnsBtn3','wrong'],['D','25','AnsBtn4','wrong']]),
  'source-stage answers, feedback chronology and original runtime gap');
 demand(native.animationId===ID&&native.source.swf.sha256===SHA&&
  native.root.frames===10&&native.root.animationSpriteId===341&&
  native.quiz.holdFrame===279&&native.quiz.answerPlacements.length===4&&
  native.quiz.sourceStageLabelBindingAccepted===true&&
  native.quiz.browserHitParityAccepted===false,
  'native answer, root and source-stage mapping');
 demand(canvas.animationId===ID&&canvas.physicalSource.sha256===SHA&&
  canvas.assetSha256===CANVAS&&canvas.stage.width===800&&canvas.stage.height===600&&
  canvas.root.frame===6&&canvas.root.mainSpriteId===341&&
  canvas.main.frameDomain==='sprite-341'&&canvas.main.frameCount===400&&
  canvas.main.quizHoldFrame===279&&canvas.stateContract.nmhOpen.includes('default false')&&
  canvas.productRegistered===false,
  'Canvas source identity and explicit visibility');
 demand(clock.animationId===ID&&clock.sourcePins.physicalCws.sha256===SHA&&
  clock.gates.sourceDeclaredClockBuilt===true&&
  clock.gates.measuredFlashToBrowserFrameSeek===false&&
  clock.gates.originalRuntimeTimingAccepted===false&&
  clock.separateSaBrowserDecode.compressedSha256===SA&&
  clock.separateSaBrowserDecode.automaticTimelineOwner===false,
  'separate streams, explicit SA and uncalibrated source timing');
 demand(glossary.kind==='alg-l06-p042-source-glossary-additions-v1'&&
  glossary.animationId===ID&&glossary.sourceSwfSha256===SHA&&
  isDeepStrictEqual(glossary.entries.map((e:{id:string;sourceKeyAttribute:string})=>
   [e.id,e.sourceKeyAttribute]),[['expression','Expression'],['simplify','Simplify']])&&
  glossary.originalRuntimeBehaviorAccepted===false&&
  glossary.entries.every((entry:PageOnlyLessonGlossaryEntry)=>
   entry.source.en.sha256===DICTIONARIES[0].sha256&&
   entry.source.es.sha256===DICTIONARIES[1].sha256),
  'exact missing source glossary terms and bilingual dictionary bytes');
 const base=algL6P041FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===44&&
  base.pages[40].animationId==='shared-alg001-l06-p041'&&
  base.pages[40].rendererAvailability.kind==='registered',
  'exact formally admitted P041 predecessor');
 const existing=['Substitute','Input','Value','Calculate','Output','Function'];
 demand(existing.every(key=>base.glossary.filter(g=>
  g.sourceKeyAttribute.toLowerCase()===key.toLowerCase()).length===1)&&
  glossary.entries.every((entry:PageOnlyLessonGlossaryEntry)=>
   !base.glossary.some(g=>g.id===entry.id)),
  'six existing terms and exactly two new source dictionary terms');
 const target=base.pages[41];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===42&&target.sectionCode==='TI'&&
  target.sectionPageOrdinal===1&&target.source.assetId===`swf-${SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p041'&&
  target.nextPlacementId==='shared-alg001-l06-p043',
  'source-ordered unregistered P042 occurrence');
 const pages=base.pages.map((page,index)=>index!==41?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-341',language:'fixed-en' as const,
    scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,
   naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p042-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===45&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'exactly one additional formal page');
 const calibration=registration.calibrationId;
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${calibration}`,
  calibrationId:calibration,releaseId:calibration,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  source:Object.freeze({...base.source,
   candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:${calibration}`}),
  pages:Object.freeze(pages),
  glossary:Object.freeze([...base.glossary,...glossary.entries.map(
   (entry:PageOnlyLessonGlossaryEntry)=>Object.freeze({id:entry.id,
    sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,
    definitions:entry.definitions,source:entry.source}))]),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:45})});
}
