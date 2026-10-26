import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readJsonPin,readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P058FormalDescriptor} from './alg-l06-p058-formal-admission-v1.server';
import {P060_ID as ID,P060_SOURCE_ROOT,p060LocalDevelopment} from './alg-l06-p060-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const workspacePins = [
  {
    "path": "migrations/shared-alg001-l06-p060/source-v1/L6FQ02.swf",
    "bytes": 48994,
    "sha256": "3228fd031f09bc4f888e35328c4c3ffc1b7a85d430e62af77335fadcd3214832"
  },
  {
    "path": "migrations/shared-alg001-l06-p060/source-v1/index.xml",
    "bytes": 13926,
    "sha256": "9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c"
  },
  {
    "path": "migrations/shared-alg001-l06-p060/native-v1/source-model-v1.json",
    "bytes": 4780567,
    "sha256": "6e5422eb24aeac0d76138d1733b3d1fd22650cfba51f14ecf0e7258ab4f373a1"
  },
  {
    "path": "migrations/shared-alg001-l06-p060/audio-v1/source-role-inventory-v1.json",
    "bytes": 155920,
    "sha256": "011e17afadb1449610b3ca208ba0a4a8c2b74a37e7667fd04f7dc825b3a4c7e6"
  }
];
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P060_SOURCE_CANDIDATE_INVALID: '+why);};
export function algL6P060CandidateDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p060LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot();for(const pin of workspacePins)readPin(root,pin);
 for(const [index,path] of ['G6-G8-shared/ALG001/L6/FQ/L6FQ02.swf','G6-G8-shared/ALG001/L6/index.xml'].entries())readPin(P060_SOURCE_ROOT,{...workspacePins[index],path});
 const model=readJsonPin(root,workspacePins[2]),audio=readJsonPin(root,workspacePins[3]);
 demand(model.animationId===ID&&model.runtime.mainFrames===69&&model.runtime.mainSpriteId===973&&model.questions.length===24&&model.embeddedAudioCount===0,'source quiz identity');
 demand(audio.assets.length===240&&new Set(audio.assets.map((a:{id:string})=>a.id)).size===240,'all original audio roles');
 for(const a of audio.assets){readPin(root,a.copy);demand(a.source.path.startsWith(P060_SOURCE_ROOT+'/'),'physical source root');readPin(P060_SOURCE_ROOT,{...a.source,path:a.source.path.slice(P060_SOURCE_ROOT.length+1)});}
 const base=algL6P058FormalDescriptor(),target=base.pages[59];
 demand(base.pages.length===60&&base.productBridge.registeredAnimationCount===57&&base.pages[57].animationId==='shared-alg001-l06-p058'&&base.pages[57].rendererAvailability.kind==='registered'&&base.pages[58].animationId==='shared-alg001-l06-p059'&&base.pages[58].rendererAvailability.kind==='registered','formal predecessor and existing FQ introduction');
 demand(target.animationId===ID&&target.globalPageOrdinal===60&&target.sectionPageOrdinal===2&&target.sectionCode==='FQ'&&target.source.assetId===`swf-${workspacePins[0].sha256}`&&target.rendererAvailability.kind==='unavailable'&&target.previousPlacementId==='shared-alg001-l06-p059'&&target.nextPlacementId===null,'final source-ordered occurrence');
 const pages=base.pages.map((page,index)=>index!==59?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,runtimeQuery:Object.freeze({frameDomain:'sprite-973',language:'fixed-en' as const,scenario:'source-explicit-frames',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,audioAcceptance:'not-established' as const,replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,productVisualBehaviorComposite:'not-established' as const})}));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===58&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),'57 registered plus one candidate');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p060-source-quiz-candidate-v1`,calibrationId:'g678-alg-l06-p060-source-quiz-candidate-v1',releaseId:`${base.releaseId}:p060-source-quiz-candidate-v1`,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p060-source-quiz-v1`}),pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:58})});
}
