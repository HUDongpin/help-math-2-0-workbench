import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {algL6P034FormalDescriptor} from './alg-l06-p034-formal-admission-v1.server';
import {P035_SOURCE_BINDING} from './alg-l06-p035-source-binding-v1';
import {P035_ID as ID,P035_SOURCE_ROOT,p035LocalDevelopment} from './alg-l06-p035-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {getWorkspaceRoot} from './catalog';
const SHA='9aaf16b58c32b00b056c7c5040b38f9d1391486bb025b71c95fa0326bbae33b3';
const KEYS=['Substitute','Equation','Function','Output','Input'];
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P035_SOURCE_PROJECTION_INVALID: '+why);};

/** Reusable pinned source projection. No candidate packet or old-registry guard. */
export function algL6P035SourceProjection():PageOnlyLessonPlayerDescriptor{
 demand(p035LocalDevelopment(),'local development and physical source');
 const root=getWorkspaceRoot(),binding=P035_SOURCE_BINDING;
 for(const pin of Object.values(binding.physical))readPin(P035_SOURCE_ROOT,pin);
 const source=readJsonPin(root,binding.sourceFacts),native=readJsonPin(root,binding.nativeInteraction),
  canvas=readJsonPin(root,binding.canvasMetadata),audio=readJsonPin(root,binding.audioPlan);
 demand(source.animationId===ID&&source.source.swf.sha256===SHA&&
  source.stage.fps===12&&source.stage.rootFrames===10&&
  source.sprites.some((s:{id:number;declaredFrames:number})=>s.id===227&&s.declaredFrames===534)&&
  isDeepStrictEqual(source.glossary.map((g:{label:string})=>g.label),KEYS)&&
  source.quiz.optionText['52']==='51'&&source.quiz.correctButton.source.includes('_root.showRightFeed()')&&
  source.quiz.authoredStop.source.includes('_global.quizTryCount = 0;'),
  'source sprite, glossary, quiz stop and exact correct choice');
 demand(native.sourceSwf.sha256===SHA&&native.mainFrameDomain==='sprite-227'&&
  native.mainFrameCount===534&&native.quizFrame===145&&native.quizChoices.length===4&&
  isDeepStrictEqual(native.quizChoices.map((q:{letter:string;value:string})=>[q.letter,q.value]),
   [['A','50'],['B','51'],['C','225'],['D','226']])&&
  isDeepStrictEqual(native.glossary.map((g:{key:string})=>g.key),KEYS)&&
  canvas.sourceSwfSha256===SHA&&canvas.main.spriteId===227&&canvas.main.frameCount===534&&
  canvas.main.quizStopFrame===145&&canvas.feedback.find((f:{spriteId:number})=>f.spriteId===179)?.held===true,
  'source-native interaction and incomplete feedback held');
 demand(audio.sourceSwf.sha256===SHA&&audio.mainClock.quizHoldFrame===145&&
  audio.mainClock.encodedFinalFrame===534&&audio.mainClock.authoredCompletion===false&&
  audio.separateSupplemental.trigger==='explicit-user-only'&&
  audio.separateSupplemental.localeAutoplay===false&&audio.separateSupplemental.mainSplice===false&&
  isDeepStrictEqual(audio.domains.filter((d:{eligible:boolean})=>d.eligible)
   .map((d:{characterId:number})=>d.characterId),[80,95,126,154,195,207,227])&&
  audio.domains.find((d:{characterId:number})=>d.characterId===179)?.eligible===false,
  'continuous source domain, independent optional audio and unavailable 179');
 const base=algL6P034FormalDescriptor();
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===41&&
  base.pages[33].animationId==='shared-alg001-l06-p034'&&
  base.pages[33].rendererAvailability.kind==='registered'&&base.glossary.length===45,
  'actual registered predecessor My Lesson');
 demand(KEYS.every(key=>base.glossary.filter(g=>g.sourceKeyAttribute.toLowerCase()===key.toLowerCase()).length===1),
  'five unique existing glossary definitions');
 const target=base.pages[34];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===35&&
  target.sectionCode==='IN'&&target.sectionPageOrdinal===6&&target.source.assetId===`swf-${SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p034'&&target.nextPlacementId==='shared-alg001-l06-p036',
  'source-ordered IN07 occurrence');
 const pages=base.pages.map((page,i)=>i!==34?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-227',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p035-source-readable'})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===42&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  'only the unregistered P035 engineering projection changes');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p035-candidate-v1`,
  calibrationId:'g678-alg-l06-p035-unregistered-candidate-v1',releaseId:`${base.releaseId}:p035-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p035-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:42})});
}
