import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P049FormalDescriptor} from './alg-l06-p049-formal-admission-v1.server';
import {P050_ID as ID,P050_SOURCE_ROOT,p050LocalDevelopment} from './alg-l06-p050-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
// Pin list is filled from the physically checked P050 source closure below.
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p050/source-v1/L6GS02.swf",
    "bytes": 828730,
    "sha256": "4353f9cbd7e60043baa8f59c7f5193fcd930778ace4b918ab56f2953f306937e"
  },
  {
    "path": "migrations/shared-alg001-l06-p050/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p050/source-v1/L6GS02.mp3",
    "bytes": 629664,
    "sha256": "518d91f553c9ecf52f2a2eb1228a7193e1b2230a6357df382314a7d94c78583b"
  },
  {
    "path": "migrations/shared-alg001-l06-p050/native-v1/source-model-v1.json",
    "bytes": 1682220,
    "sha256": "928ca5042b469795ae207921638d44ffd212034e8eb33e954d943b1721c05fb7"
  },
  {
    "path": "migrations/shared-alg001-l06-p050/native-v1/native-bindings-v1.json",
    "bytes": 23222,
    "sha256": "f8e35ff41c426f48d03c8cf686c5242e5ad71bddc8aee6b5c7e7f3f6443a1bdd"
  },
  {
    "path": "migrations/shared-alg001-l06-p050/canvas-v1/canvas-renderer-draft.js",
    "bytes": 10456890,
    "sha256": "d384ef32b39c8bd1e013c667653bcb5a643cbe703be6c145b87ce87a752347ff"
  }
] as const;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P050_SOURCE_CANDIDATE_INVALID: '+why);};

/** One unregistered ten-question graph game candidate after formal P049. */
export function algL6P050CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p050LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/GS/L6GS02.swf',
  'G6-G8-shared/ALG001/L6/index.xml','G6-G8-shared/ALG001/L6/SA/L6GS02.mp3'].entries())
  readPin(P050_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[3]),binding=readJsonPin(root,workspacePins[4]);
 demand(model.animationId===ID&&model.placement.ordinal===50&&model.placement.section==='GS'&&
  model.runtime.mainSpriteId===489&&model.runtime.mainFrames===674&&
  model.behavior.beginFrame===662&&model.behavior.finalFrame===673&&
  binding.sourceSwfSha256===workspacePins[0].sha256&&binding.sourceModelSha256===workspacePins[3].sha256&&
  isDeepStrictEqual(model.questions.map((q:{correctChoice:string})=>q.correctChoice),
   ['D','A','B','D','C','A','B','C','D','B'])&&binding.questions.length===10,'source game and timeline');
 const base=algL6P049FormalDescriptor(),target=base.pages[49];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===52&&
  base.pages[48].animationId==='shared-alg001-l06-p049'&&base.pages[48].rendererAvailability.kind==='registered',
  'formally admitted P049 predecessor');
 demand(target.animationId===ID&&target.globalPageOrdinal===50&&target.sectionPageOrdinal===1&&
  target.sectionCode==='GS'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&
  target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p049'&&
  target.nextPlacementId==='shared-alg001-l06-p051','one source-ordered occurrence');
 const pages=base.pages.map((page,index)=>index!==49?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-489',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p050-source-readable'})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===53&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  '52 registered pages plus one local candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p050-source-game-candidate-v1`,
  calibrationId:'g678-alg-l06-p050-source-game-candidate-v1',releaseId:`${base.releaseId}:p050-source-game-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p050-source-game-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:53})});
}
