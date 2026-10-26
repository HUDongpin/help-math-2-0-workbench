import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction}
 from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P022FormalDescriptor} from './alg-l06-p022-formal-admission-v1.server';
import {P023_ID as ID,p023LocalDevelopment} from './alg-l06-p023-preview-policy-v1';
import {P023_RESOURCE_PINS} from './alg-l06-p023-local-request-v1';
import {P023_CANDIDATE_BINDING} from './alg-l06-p023-candidate-binding-v1';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

function demand(value:unknown,reason:string):asserts value{
 if(!value)throw Error(`P023_CANDIDATE_INVALID: ${reason}`);
}

/** One source-backed, unregistered P023 projection over the exact formal P022
 * predecessor. This descriptor deliberately does not alter official coverage. */
export function algL6P023CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p023LocalDevelopment(),'local physical source environment');
 const root=getWorkspaceRoot(),base=algL6P022FormalDescriptor();
 const tx=readRegistryTransaction(root),binding=P023_CANDIDATE_BINDING;
 const currentIndex=readJsonPin(root,G678_ADMISSION_INDEX);
 demand(String(G678_ADMISSION_INDEX.path)==='catalog/g678-admission-v1/index-v77.json'&&
  String(G678_ADMISSION_INDEX.sha256)==='2f48a75961e553c2c900a92c05b3ef0937726fcffb80b65f6e71e55d9abded92'&&
  currentIndex.host.path==='catalog/g678-admission-v1/host-v77.json'&&
  currentIndex.host.sha256==='7fab53a8a847553095ac9da477e8342ec401cb06d2aff1253304f61cfbbbea88'&&
  currentIndex.pages.length===20&&
  currentIndex.pages.some((page:{animationId:string})=>page.animationId==='shared-alg001-l06-p022')&&
  !currentIndex.pages.some((page:{animationId:string})=>page.animationId===ID),
  'current host-v77/index-v77 and P023 still candidate');
 demand(tx.sha256===binding.registrySha256&&registeredLocalOnlyAnimationKeys.length===510&&
  !localOnlyAnimationModuleRegistration(ID)&&
  !tx.registry.calibrations.some((c:{entries:Array<{key:string}>})=>c.entries.some(e=>e.key===ID)),
  '510 registered pages and P023 unregistered');
 const packet=readJsonPin(root,binding.packet);
 demand(packet.kind==='alg-l06-p023-candidate-source-binding-v1'&&
  packet.animationId===ID&&packet.source.sha256===binding.sourceSha256&&
  packet.historicalCrosswalkIndex?.path==='catalog/g678-admission-v1/index-v76.json'&&
  packet.historicalCrosswalkIndex?.role===
   'dated glossary crosswalk input; not the current candidate host activation'&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'source and independent gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const external of packet.external)readPin(external.root,external.pin);
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===33&&
  base.glossary.length===36&&Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'exact P022 formal predecessor');
 const intake=readJsonPin(root,packet.intake),audit=readJsonPin(root,packet.audit),
  text=readJsonPin(root,packet.text),canvas=readJsonPin(root,packet.canvas),
  audio=readJsonPin(root,packet.audio),plan=readJsonPin(root,packet.audioPlan),
  crosswalk=readJsonPin(root,packet.crosswalk);
 demand(intake.animationId===ID&&intake.identity.globalOrdinal===23&&
  intake.identity.xmlOccurrence===23&&intake.identity.sectionCode==='VB'&&
  intake.identity.sectionPageOrdinal===13&&intake.source.swf.sha256===packet.source.sha256&&
  intake.source.samePathFlaExists===false&&intake.structure.main.frameDomain==='sprite-38'&&
  intake.structure.main.frameCount===410,'exact VB13 source placement');
 const gates=[[8,'Domain',21],[9,'Input',68],[10,'Set',47],[11,'Function',30]];
 demand(audit.identity.animationId===ID&&audit.identity.mainFrameCount===410&&
  audit.identity.rootEntryFrame===6&&audit.textDefinitions.length===21&&
  isDeepStrictEqual(audit.maskPlacements.map((m:{frame:number;characterId:number;
   depth:number;clipDepth:number})=>[m.frame,m.characterId,m.depth,m.clipDepth]),[[11,3,3,14]])&&
  isDeepStrictEqual(audit.buttons.map((b:{characterId:number;keyAttribute:string;
   instances:Array<{firstSourceReadyFrame:number}>})=>
   [b.characterId,b.keyAttribute,b.instances.length,b.instances[0]?.firstSourceReadyFrame]),
   gates.map(([id,key,frame])=>[id,key,1,frame])),'one mask and four exact source label/hit gates');
 demand(text.animationId===ID&&text.sourceSwfSha256===packet.source.sha256&&
  text.frameDomain==='sprite-38'&&text.frameCount===410&&text.glossaryControls.length===4&&
  text.policy.canvasGlyphs==='preserved'&&text.policy.language==='source-en-fallback'&&
  text.policy.originalRuntimeAccepted===false&&text.reading.tableFirstCompleteFrame===173&&
  text.reading.setFirstOrderedFrame===401,'source-timed native text and set geometry');
 demand(canvas.animationId===ID&&canvas.source.sha256===packet.source.sha256&&
  canvas.mainFrameCount===410&&canvas.rootFrame===6&&
  canvas.sourceGlyphRendering.definitions===21&&canvas.sourceGlyphRendering.preserved===true&&
  canvas.sourceClipMasks.length===1&&canvas.sourceMorphCharacterIds.length===0&&
  canvas.outputs[0].sha256===P023_RESOURCE_PINS['canvas-renderer.js'].sha256&&
  Object.values(canvas.acceptanceEffects).every(value=>value===false),'source drawing');
 demand(audio.source.swf.sha256===packet.source.sha256&&audio.main.domain==='sprite-38'&&
  audio.main.blockCount===400&&audio.main.firstBlockFrame===11&&audio.main.lastBlockFrame===410&&
  audio.main.negativeSeekBlocks.length===0&&
  audio.main.extractedMp3.sha256===P023_RESOURCE_PINS['main-1'].sha256&&
  audio.separateSa.copy.sha256===P023_RESOURCE_PINS['optional-spanish-audio-v1'].sha256&&
  plan.main.asset.id==='main-1'&&plan.main.sourceBlocks.count===400&&
  plan.optionalSpanishAudio.joinedWithMain===false&&
  plan.optionalSpanishAudio.localeAutoplay===false&&
  plan.limits.originalRuntimeObserved===false&&plan.limits.listeningAccepted===false,
  'one exact main range and independent SA');
 demand(crosswalk.identity.animationId===ID&&crosswalk.inputs.swf.sha256===packet.source.sha256&&
  crosswalk.active.registeredLessonPages===33&&crosswalk.active.glossaryEntryCount===36&&
  isDeepStrictEqual(crosswalk.active.index.path,packet.historicalCrosswalkIndex.path)&&
  crosswalk.entries.length===4&&isDeepStrictEqual(crosswalk.missingModernKeys,['Domain'])&&
  crosswalk.originalHostRunObserved===false,'source dictionary');
 const glossary=[...base.glossary];
 const row=crosswalk.entries.find((entry:{key:string})=>entry.key==='Domain');
 demand(row&&!row.modern.present&&!glossary.some(entry=>entry.id===row.dictionary.id)&&
  row.dictionary.definitions.en&&row.dictionary.definitions.es,'new Domain dictionary entry');
 const domain=row.dictionary;
 glossary.push(Object.freeze({id:domain.id,sourceKeyAttribute:'Domain',
  labels:Object.freeze({...domain.labels}),definitions:Object.freeze({...domain.definitions}),
  source:Object.freeze({...domain.source})}) as PageOnlyLessonGlossaryEntry);
 demand(glossary.length===37&&gates.every(([,key])=>
  glossary.filter(entry=>entry.sourceKeyAttribute===key).length===1),
  'four retained/new glossary entries');
 const target=base.pages[22];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===23&&
  target.sectionPageOrdinal===13&&target.source.assetId===`swf-${packet.source.sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p022'&&
  target.nextPlacementId==='shared-alg001-l06-p024','exact source ordered target');
 const pages=base.pages.map((page,index)=>index!==22?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-38',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p023-source-readable'}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===34&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'one source candidate added');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p023-candidate-v1`,
  calibrationId:'g678-alg-l06-p023-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p023-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p023-candidate-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:34})});
}
