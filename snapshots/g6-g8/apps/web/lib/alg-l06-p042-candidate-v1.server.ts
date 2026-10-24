import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
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
const GLOSSARY={path:'migrations/shared-alg001-l06-p042/behavior-v1/source-glossary-additions-v1.json',
 bytes:2658,sha256:'0117f94cda7d2f4a9e25b1f40905b0cc3d04a419ba85720bfa0b0e343288f6a5'};
const KEYTERM_ROOT='/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const DICTIONARIES=[
 {path:'L1KTE01.xml',bytes:345838,sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
 {path:'L1KTS01.xml',bytes:344456,sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
] as const;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P042_CANDIDATE_INVALID: '+why);};

/** One unregistered source-locked P042 projection on the actual P041 formal base. */
export function algL6P042CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p042LocalDevelopment(),'exact local physical source and development scope');
 demand(!localOnlyAnimationModuleRegistration(ID),'P042 must remain unregistered');
 const root=getWorkspaceRoot();
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
  base.productBridge.selectedAnimationIds),'exactly one candidate projection');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p042-candidate-v1`,
  calibrationId:'g678-alg-l06-p042-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p042-candidate-v1`,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p042-candidate-v1`}),
  pages:Object.freeze(pages),
  glossary:Object.freeze([...base.glossary,...glossary.entries.map(
   (entry:PageOnlyLessonGlossaryEntry)=>Object.freeze({id:entry.id,
    sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,
    definitions:entry.definitions,source:entry.source}))]),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:45})});
}
