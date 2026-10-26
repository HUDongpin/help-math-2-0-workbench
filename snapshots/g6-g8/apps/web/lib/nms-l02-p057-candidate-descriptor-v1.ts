import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {P057_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p057-terms-v1';

const ID='shared-nms002-l02-p057';
const SHA='9cc456a0af745dc31240b3a6d805e8e115c1c1c2725f851fca8e907a767820aa';
/** Explicit local preview projection. The real registry remains unchanged;
 * the caller must mark P057 as an unregistered candidate in the player. */
export function nmsL02P057CandidateDescriptorV1(base:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor{
 const page=base.pages[56];
 const registered=base.pages.filter(entry=>entry.rendererAvailability.kind==='registered').map(entry=>entry.animationId);
 const id=(index:number)=>`shared-nms002-l02-p${String(index+1).padStart(3,'0')}`;
 const ordered=base.pages.every((entry,index)=>entry.animationId===id(index)&&entry.placementId===id(index)&&
  entry.globalPageOrdinal===index+1&&entry.source.sourceOccurrence===index+1&&
  entry.previousPlacementId===(index===0?null:id(index-1))&&
  entry.nextPlacementId===(index===63?null:id(index+1)));
 if(base.schemaVersion!==2||!ordered||registered.length!==56||
  JSON.stringify(registered)!==JSON.stringify(base.productBridge.selectedAnimationIds)||
  base.course.activePageCount!==64||base.course.expectedReleaseMemberCount!==64||
  base.course.courseShellCount!==0||base.productBridge.pageOnlyDescriptorMemberCount!==64)
  throw Error('P057_CANDIDATE_PREDECESSOR');
 if(base.course.moduleCode!=='NMS002'||base.course.lesson!==2||base.pages.length!==64||
  base.productBridge.registeredAnimationCount!==56||
  page?.animationId!==ID||page.placementId!==ID||page.globalPageOrdinal!==57||
  page.sectionCode!=='TS'||page.sectionPageOrdinal!==3||page.source.sourceOccurrence!==57||
  page.source.assetId!==`swf-${SHA}`||page.rendererAvailability.kind!=='unavailable'||
  base.source.sourceXmlSha256!=='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'||
  Object.values(base.productBridge.acceptanceEffects).some(Boolean))throw Error('P057_CANDIDATE_PREDECESSOR');
 const glossary=[...base.glossary];
 for(const term of P057_SOURCE_TERMS){
  const sameId=glossary.find(t=>t.id===term.id),sameKey=glossary.find(t=>t.sourceKeyAttribute===term.sourceKeyAttribute);
  if(sameId||sameKey){
   if(sameId!==sameKey||!sameId||JSON.stringify(sameId.labels)!==JSON.stringify(term.labels)||
    JSON.stringify(sameId.definitions)!==JSON.stringify(term.definitions)||
    JSON.stringify(sameId.source)!==JSON.stringify(term.source))throw Error('P057_CANDIDATE_GLOSSARY_COLLISION');
  }else glossary.push(term);
 }
 return {...base,descriptorId:`${base.descriptorId}:p057-unregistered-product-v1`,
  course:{...base.course,href:`/migration-status/g678-calibration/${ID}`},
  persistence:{...base.persistence,storageKey:`${base.persistence.storageKey}:p057-unregistered-product-v1`},
  glossary,
  pages:base.pages.map((entry,index)=>index!==56?entry:{...entry,
   rendererAvailability:{kind:'registered',moduleKey:ID,runtimeQuery:{frameDomain:'sprite-66',
    language:'fixed-en',scenario:'source-static-frame',seed:'0'}},
   runtimeEvidenceBoundary:{runtimeKind:'source-script-bound-product-behavior-current-js-candidate',
    actionScriptExecution:'not-executed',naturalTraceValidation:'not-established',audioAcceptance:'not-established',
    replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established',
    productBehavior:'maintained-javascript-state-machine-implemented',productVisualBehaviorComposite:'not-established'},
  }),
  // This remains the actual registered predecessor count; P057 is a preview override.
  productBridge:{...base.productBridge},
 };
}
