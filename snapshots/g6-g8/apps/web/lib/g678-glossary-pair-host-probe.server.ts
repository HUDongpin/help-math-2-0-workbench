import 'server-only';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {hasLocalOnlyAnimationModule} from '@helpmath/demos/local-only-animation-registry-metadata';
import {splitAdmissionDescriptor} from './g678-split-admission.server';
import {pairHostAssetManifest,type GlossaryPairId} from './g678-glossary-pair-assets.server';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const IDS=['shared-alg001-l12-p013','shared-alg001-l12-p015'] as const;
function demand(value:unknown,message:string):asserts value{if(!value)throw Error(`PAIR_HOST_PROBE: ${message}`);}
/** Two explicit, unregistered placements in the existing source-ordered lesson.
 * This descriptor is confined to the candidate route, never registry output. */
export function glossaryPairHostProbeDescriptor(selected:GlossaryPairId):PageOnlyLessonPlayerDescriptor{
 demand(IDS.includes(selected)&&isG678LocalPreviewEnabled(),'local pair only');
 demand(!hasLocalOnlyAnimationModule(selected),'selected probe remains unregistered');
 const candidates=IDS.filter(id=>!hasLocalOnlyAnimationModule(id));
 for(const id of IDS)pairHostAssetManifest(id);
 const inputs=JSON.parse(readFileSync(path.join(getWorkspaceRoot(),'output/alg-l12-next-glossary-20260927/source-inputs.json'),'utf8'));
 const base=splitAdmissionDescriptor(hasLocalOnlyAnimationModule(IDS[0])?IDS[0]:'shared-alg001-l12-p012');
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===12&&base.pages.length===52,'exact lesson');
 const glossary=[...base.glossary];
 const pages=base.pages.map(page=>{
  if(!candidates.includes(page.animationId as GlossaryPairId))return page;
  const index=page.animationId===IDS[0]?13:15,source=inputs.pages.find((p:{animationId:string})=>p.animationId===page.animationId);
  demand(source&&page.globalPageOrdinal===index&&page.sectionPageOrdinal===index-6&&page.sectionCode==='VB'&&
   page.placementId===page.animationId&&page.source.assetId===`swf-${source.source.sha256}`&&page.rendererAvailability.kind==='unavailable','exact source placement');
  for(const entry of source.glossary as PageOnlyLessonGlossaryEntry[]){
   const old=glossary.find(item=>item.sourceKeyAttribute===entry.sourceKeyAttribute);
   if(old)demand(old.id===entry.id&&(['en','es']as const).every(lang=>old.definitions[lang]===entry.definitions[lang]),'same dictionary meaning');
   else{demand(!glossary.some(item=>item.id===entry.id),'no dictionary ID collision');glossary.push(entry);}
  }
  return Object.freeze({...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:page.animationId,
   runtimeQuery:Object.freeze({frameDomain:source.frameDomain as string,language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
   runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
    actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,
    replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
    productBehavior:'maintained-javascript-state-machine-implemented' as const,productVisualBehaviorComposite:'not-established' as const})});
 });
 const ids=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(ids.length===base.productBridge.registeredAnimationCount+candidates.length,'exact candidate substitutions');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:glossary-pair-probe`,calibrationId:'alg-l12-glossary-pair-unregistered-v1',
  releaseId:`${base.releaseId}:glossary-pair-probe`,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${selected}`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:glossary-pair-probe`}),
  pages:Object.freeze(pages),glossary:Object.freeze(glossary),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(ids),registeredAnimationCount:ids.length})});
}
