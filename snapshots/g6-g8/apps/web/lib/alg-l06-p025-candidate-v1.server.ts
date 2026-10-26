import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {algL6P024FormalDescriptor} from './alg-l06-p024-formal-admission-v1.server';
import {P025_CANDIDATE_BINDING} from './alg-l06-p025-candidate-binding-v1';
import {P025_ID as ID,p025LocalDevelopment} from './alg-l06-p025-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const demand=(ok:unknown,message:string)=>{if(!ok)throw Error('P025_CANDIDATE_INVALID: '+message);};

/** One exact local projection; official registry membership remains unchanged. */
export function algL6P025CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p025LocalDevelopment(),'development/physical source environment');
 const root=getWorkspaceRoot(),binding=P025_CANDIDATE_BINDING,
  tx=readRegistryTransaction(root),base=algL6P024FormalDescriptor();
 demand(tx.sha256===binding.registrySha256&&!localOnlyAnimationModuleRegistration(ID),
  'frozen current registry and unregistered placement');
 const packet=readJsonPin(root,binding.packet);
 demand(packet.kind==='alg-l06-p025-candidate-source-binding-v1'&&packet.animationId===ID&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),'own exact packet and independent gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const external of packet.external)readPin(external.root,external.pin);
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===35&&
  base.glossary.length===38,'formal35/60 predecessor');
 const crosswalk=readJsonPin(root,packet.crosswalk);
 const glossary=[...base.glossary],independent=crosswalk.entries.find((e:{key:string})=>e.key==='Independent variable');
 demand(independent&&!independent.modern.present&&crosswalk.missingModernKeys.length===1&&
  crosswalk.missingModernKeys[0]==='Independent variable','only source-dictionary Independent variable absent');
 const d=independent.dictionary;glossary.push(Object.freeze({id:d.id,sourceKeyAttribute:'Independent variable',
  labels:Object.freeze({...d.labels}),definitions:Object.freeze({...d.definitions}),source:Object.freeze({...d.source})}));
 const audit=readJsonPin(root,packet.audit),native=readJsonPin(root,packet.native),
  canvas=readJsonPin(root,packet.canvas),audio=readJsonPin(root,packet.audioPlan);
 demand(audit.animationId===ID&&audit.source.swf.sha256===packet.source.sha256&&
  isDeepStrictEqual(audit.runtime.domains.map((d:{domain:string;declaredFrames:number})=>[d.domain,d.declaredFrames]),
   [['root',10],['sprite-21',299]])&&audit.runtime.buttonActions.length===4,
  'source identity and frame domains');
 demand(native.sourceSwfSha256===packet.source.sha256&&native.frameCount===299&&
  isDeepStrictEqual(native.glossaryControls.map((c:{key:string;firstSourceGeometryReadyFrame:number})=>
   [c.key,c.firstSourceGeometryReadyFrame]),
   [['Independent variable',28],['Input variable',41],['Function',50],['Domain',295]]),
  'exact own glyph/hit gates');
 demand(canvas.animationId===ID&&canvas.suppression.unownedSourceTextFallback&&
  isDeepStrictEqual(canvas.suppression.auditedStaticTextIds,[5,15])&&
  audio.main.frameDomain==='sprite-21'&&audio.optionalSpanishAudio.localeAutoplay===false&&
  audio.optionalSpanishAudio.joinedWithMain===false,'drawing and independent SA');
 for(const key of ['Independent variable','Input variable','Function','Domain'])
  demand(glossary.filter(e=>e.sourceKeyAttribute===key).length===1,'one source glossary '+key);
 const target=base.pages[24];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===25&&
  target.sectionCode==='VB'&&target.sectionPageOrdinal===15&&
  target.source.assetId===`swf-${packet.source.sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p024'&&
  target.nextPlacementId==='shared-alg001-l06-p026','one source-ordered VB15 target');
 const pages=base.pages.map((page,i)=>i!==24?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-21',language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p025-source-readable'})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===36&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  'one unregistered candidate; all59 other placements unchanged');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p025-candidate-v1`,
  calibrationId:'g678-alg-l06-p025-unregistered-candidate-v1',releaseId:`${base.releaseId}:p025-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p025-candidate-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:36})});
}
