import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction}
 from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P021FormalDescriptor} from './alg-l06-p021-formal-admission-v1.server';
import {P022_ID as ID,P022_SOURCE_ROOT as ROOT,p022LocalDevelopment}
 from './alg-l06-p022-preview-policy-v1';
import {P022_RESOURCE_PINS} from './alg-l06-p022-local-request-v1';
import {P022_CANDIDATE_BINDING} from './alg-l06-p022-candidate-binding-v1';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';
function demand(value:unknown,reason:string):asserts value{
 if(!value)throw Error(`P022_CANDIDATE_INVALID: ${reason}`);
}
/** Reviewed P022 source projection over the exact admitted P021 predecessor.
 * Every own runtime/evidence input is pinned separately from host activation. */
export function algL6P022CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p022LocalDevelopment(),'local physical source environment');
 const root=getWorkspaceRoot(),base=algL6P021FormalDescriptor();
 const tx=readRegistryTransaction(root),binding=P022_CANDIDATE_BINDING;
 demand(tx.sha256===binding.registrySha256&&registeredLocalOnlyAnimationKeys.length===509&&
  !localOnlyAnimationModuleRegistration(ID)&&
  !tx.registry.calibrations.some((c:{entries:Array<{key:string}>})=>c.entries.some(e=>e.key===ID)),
  '509 registered pages and P022 unregistered');
 const packet=readJsonPin(root,binding.packet);
 demand(packet.animationId===ID&&packet.source.sha256===binding.sourceSha256&&
  Object.values(packet.acceptanceEffects).every(x=>x===false),'source and independent gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const external of packet.external)readPin(external.root,external.pin);
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===32&&
  base.glossary.length===34&&Object.values(base.productBridge.acceptanceEffects).every(x=>x===false),
  'exact P021 predecessor');
 const intake=readJsonPin(root,packet.intake),audit=readJsonPin(root,packet.audit),
  text=readJsonPin(root,packet.text),canvas=readJsonPin(root,packet.canvas),
  audio=readJsonPin(root,packet.audio),plan=readJsonPin(root,packet.audioPlan),
  crosswalk=readJsonPin(root,packet.crosswalk);
 demand(intake.identity.animationId===ID&&intake.identity.globalOrdinal===22&&
  intake.identity.xmlOccurrence===22&&intake.identity.sectionCode==='VB'&&
  intake.identity.sectionPageOrdinal===12&&intake.source.swf.sha256===packet.source.sha256&&
  intake.source.samePathFlaExists===false&&intake.sourceStructure.main.domain==='sprite-67'&&
  intake.sourceStructure.main.frames===422,'exact VB12 placement');
 const gates=[[7,'Graph',8],[8,'Representation',42],[9,'Function',17],
  [15,'Ordered pair',85],[16,'Input',91],[17,'Output',99]];
 demand(audit.identity.animationId===ID&&audit.identity.mainFrameCount===422&&
  audit.identity.rootEntryFrame===6&&audit.textDefinitions.length===36&&
  isDeepStrictEqual(audit.buttons.map((b:{characterId:number;keyAttribute:string;
   instances:Array<{firstSourceReadyFrame:number}>})=>
   [b.characterId,b.keyAttribute,b.instances.length,b.instances[0]?.firstSourceReadyFrame]),
   gates.map(([id,key,frame])=>[id,key,1,frame])),'six exact source label/hit gates');
 demand(text.animationId===ID&&text.sourceSwfSha256===packet.source.sha256&&
  text.frameDomain==='sprite-67'&&text.frameCount===422&&text.textInstances.length===87&&
  text.glossaryControls.length===6&&text.policy.canvasGlyphs==='preserved'&&
  text.policy.language==='source-en-fallback'&&text.policy.originalRuntimeAccepted===false&&
  text.orderedPair.firstCompletePairFrame===361,'source-timed native text and geometry pair');
 demand(canvas.animationId===ID&&canvas.source.sha256===packet.source.sha256&&
  canvas.mainFrameCount===422&&canvas.rootFrame===6&&canvas.sourceGlyphRendering.definitions===36&&
  canvas.sourceGlyphRendering.preserved===true&&canvas.sourceClipMasks.length===3&&
  canvas.outputs[0].sha256===P022_RESOURCE_PINS['canvas-renderer.js'].sha256&&
  Object.values(canvas.acceptanceEffects).every(x=>x===false),'source drawing');
 demand(audio.source.swf.sha256===packet.source.sha256&&audio.main.domain==='sprite-67'&&
  audio.main.blockCount===404&&audio.main.ranges.length===2&&
  isDeepStrictEqual(audio.main.ranges.map((r:{firstBlockFrame:number;lastBlockFrame:number})=>
   [r.firstBlockFrame,r.lastBlockFrame]),[[2,132],[150,422]])&&
  isDeepStrictEqual(audio.main.negativeSeekBlocks.map((r:{frame:number;rawSeekSamples:number})=>
   [r.frame,r.rawSeekSamples]),[[132,-2018]])&&
  audio.separateSa.copy.sha256===P022_RESOURCE_PINS['optional-spanish-audio-v1'].sha256&&
  plan.optionalSpanishAudio.joinedWithMain===false&&plan.optionalSpanishAudio.localeAutoplay===false&&
  plan.limits.originalRuntimeObserved===false&&plan.limits.listeningAccepted===false,
  'two exact main ranges and independent SA');
 demand(crosswalk.identity.animationId===ID&&crosswalk.inputs.swf.sha256===packet.source.sha256&&
  crosswalk.active.registeredLessonPages===32&&crosswalk.entries.length===6&&
  isDeepStrictEqual(crosswalk.missingModernKeys,['Graph','Representation'])&&
  crosswalk.originalHostRunObserved===false,'source dictionary');
 const glossary=[...base.glossary];
 for(const key of ['Graph','Representation']){
  const row=crosswalk.entries.find((e:{key:string})=>e.key===key);
  demand(row&&!row.modern.present&&!glossary.some(e=>e.id===row.dictionary.id)&&
   row.dictionary.definitions.en&&row.dictionary.definitions.es,'new dictionary exact key');
  const d=row.dictionary;
  glossary.push(Object.freeze({id:d.id,sourceKeyAttribute:key,labels:Object.freeze({...d.labels}),
   definitions:Object.freeze({...d.definitions}),source:Object.freeze({...d.source})}) as PageOnlyLessonGlossaryEntry);
 }
 demand(glossary.length===36&&gates.every(([,key])=>glossary.filter(e=>e.sourceKeyAttribute===key).length===1),
  'six retained/new glossary entries');
 const target=base.pages[21];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===22&&
  target.sectionPageOrdinal===12&&target.source.assetId===`swf-${packet.source.sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p021'&&target.nextPlacementId==='shared-alg001-l06-p023',
  'exact source ordered target');
 const pages=base.pages.map((page,index)=>index!==21?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-67',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p022-source-readable'}),
 }));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===33&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'one source candidate added');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p022-candidate-v1`,
  calibrationId:'g678-alg-l06-p022-unregistered-candidate-v1',releaseId:`${base.releaseId}:p022-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p022-candidate-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:33})});
}
