import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
  from '@helpmath/demos/local-only-animation-registry-metadata';
import {readPin,readJsonPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P010FormalDescriptor} from './alg-l06-p010-formal-admission-v1.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p013';
const ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB04.swf',bytes:269912,
  sha256:'1be47750557385ef91c648fb87fdcde642d342caadc35da7a1f7a2d1fdb11d35'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
  sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const AUDIT={path:'migrations/shared-alg001-l06-p013/audit/source-v1/source-audit-v1.json',bytes:12299,
  sha256:'ec5707528c5ebc3f0992aec542c6eace1a3eebaa8256cc3d5aebfc7f037078af'};
const GLOSSARY={path:'migrations/shared-alg001-l06-p013/audit/glossary-v1/input-output-crosswalk-v1.json',bytes:9423,
  sha256:'7a6d26e663d948f77833378ee1c2c5e60130e55aa6299bc7b0eacf070b091e2e'};
const AUDIO={path:'migrations/shared-alg001-l06-p013/audit/audio-v1/audio-source-audit-v1.json',bytes:90068,
  sha256:'73558518b95735e4256432d9b750eabf33e42b04d62cf1c11f6fa1b6151d28d8'};
const CANVAS={path:'output/alg-l06-p013-canvas-v1/canvas-manifest.json',bytes:3872,
  sha256:'d64bda48c9b63f3d05c3ca1e587bea9aa1eceb59b7ab6bedfa49c8749944607e'};
const TEXT={path:'migrations/shared-alg001-l06-p013/audit/text-state-v1/text-state-audit-v1.json',bytes:2837,
  sha256:'19d43c2ce35d3f73863ae5482396d1e633b01f23ef580ef1fc579c8458879611'};
const NATIVE_STATE={path:'packages/demos/src/generated/alg-l06-p013-text-state-v1.ts',bytes:17205,
  sha256:'d7f9a3100510cafd057e3c33b8d60f47312a9cf3a3f03be6f3d54414769136f3'};
const MAIN={path:'migrations/shared-alg001-l06-p013/audit/audio-v1/continuous-source-v1.mp3',bytes:151710,
  sha256:'3d646619b33b9e859aff68bf331f224158916aa9f4e99b16cdc910791c7d41c1'};
const SA={path:'migrations/shared-alg001-l06-p013/audit/audio-v1/separate-sa-source-v1.mp3',bytes:327936,
  sha256:'2db938405bd646e4bf37e0b9cdf5438cc65451a2d4f7304c93dbc2b6653e8575'};
const RENDERER={path:'output/alg-l06-p013-canvas-v1/canvas-renderer.js',bytes:4346113,
  sha256:'0fcb9e14cbae8ff38b0fbf213b090e1299d65027abd4b365950ca875042b4b0d'};
function demand(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(`P013_CANDIDATE_INVALID: ${reason}`);}

/** Disclosed local projection of one unregistered source page into the real My Lesson host. */
export function algL6P013CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
  demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
    process.env.HELP_MATH_G678_SOURCE_ROOT===ROOT&&
    ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
  const base=algL6P010FormalDescriptor(),root=getWorkspaceRoot();
  const transaction=readRegistryTransaction(root);
  demand(registeredLocalOnlyAnimationKeys.length===500&&!localOnlyAnimationModuleRegistration(ID)&&
    !transaction.registry.calibrations.some((row:{entries:{key:string}[]})=>
      row.entries.some(e=>e.key===ID)),'500 formal pages; P013 is unregistered');
  demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&base.pages.length===60&&
    base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===23&&
    base.pages.filter(p=>p.rendererAvailability.kind==='registered').length===23&&
    base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
    Object.values(base.productBridge.acceptanceEffects).every(v=>v===false),
    'formal 23-page P010 predecessor');
  readPin(ROOT,SOURCE);readPin(ROOT,XML);
  for(const pin of [MAIN,SA,RENDERER,NATIVE_STATE])readPin(root,pin);
  const audit=readJsonPin(root,AUDIT),glossary=readJsonPin(root,GLOSSARY),
    audio=readJsonPin(root,AUDIO),canvas=readJsonPin(root,CANVAS),text=readJsonPin(root,TEXT);
  demand(audit.kind==='alg-l06-p013-source-audit-v1'&&audit.animationId===ID&&
    audit.source.sha256===SOURCE.sha256&&audit.catalog.globalOrdinal===13&&
    audit.catalog.section==='VB'&&audit.catalog.sectionPageOrdinal===3&&
    audit.runtime.header.rootFrameCount===10&&audit.runtime.header.fps===12&&
    audit.runtime.domains.some((d:{domainId:string;declaredFrames:number})=>
      d.domainId==='sprite-140'&&d.declaredFrames===372),'source identity and domain');
  demand(glossary.kind==='alg-l06-p013-input-output-glossary-crosswalk-v1'&&
    glossary.animationId===ID&&
    isDeepStrictEqual(glossary.terms.map((term:{entryId:string})=>term.entryId),['input','output'])&&
    glossary.reusable.exactInputAndOutputTermIdsAlreadyInP004AndP008===true,
    'source Input/Output glossary crosswalk');
  demand(audio.kind==='alg-l06-p013-audio-source-audit-v1'&&
    audio.source.swf.sha256===SOURCE.sha256&&
    audio.source.separateSa.sha256===SA.sha256&&
    audit.audio.mainStream.mp3Sha256===MAIN.sha256,'source audio identity');
  demand(canvas.kind==='alg-l06-p013-maintained-canvas-v1'&&canvas.animationId===ID&&
    canvas.source.sha256===SOURCE.sha256&&canvas.rootFrame===6&&
    canvas.mainFrameCount===372&&canvas.outputs[0].sha256===RENDERER.sha256&&
    Object.values(canvas.acceptanceEffects).every((v:unknown)=>v===false),
    'maintained source drawing candidate');
  demand(text.kind==='alg-l06-p013-text-state-audit-v1'&&text.animationId===ID&&
    text.sourceSwf.sha256===SOURCE.sha256&&
    text.output.path===NATIVE_STATE.path&&text.output.bytes===NATIVE_STATE.bytes&&
    text.output.sha256===NATIVE_STATE.sha256&&
    text.semanticReveal.inputHitFirstFull===296&&
    text.semanticReveal.outputHitFirstFull===365&&
    text.semanticReveal.inputSentenceMaskSettles===296&&
    text.semanticReveal.outputSentenceMaskSettles===365,
    'source text state evidence');
  const target=base.pages[12];
  demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===13&&
    target.sectionCode==='VB'&&target.sectionPageOrdinal===3&&
    target.source.assetId===`swf-${SOURCE.sha256}`&&target.source.sourceOccurrence===13&&
    target.rendererAvailability.kind==='unavailable'&&
    target.previousPlacementId==='shared-alg001-l06-p012'&&
    target.nextPlacementId==='shared-alg001-l06-p014','exact P013 placement');
  demand(['input','output'].every(id=>base.glossary.filter(entry=>entry.id===id).length===1),
    'existing source-bound Input/Output glossary');
  const pages=base.pages.map((page,index)=>index!==12?page:Object.freeze({...page,
    rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
      runtimeQuery:Object.freeze({frameDomain:'sprite-140',language:'fixed-en' as const,
        scenario:'source-static-frame',seed:'0'})}),
    runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
      actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
      audioAcceptance:'not-established' as const,
      replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
      productVisualBehaviorComposite:'not-established' as const}),
    presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p013-source-readable'}),
  }));
  const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
  demand(selected.length===24&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
    'exact single candidate addition');
  return Object.freeze({...base,descriptorId:`${base.descriptorId}:p013-candidate-v1`,
    calibrationId:'g678-alg-l06-p013-unregistered-candidate-v1',
    releaseId:`${base.releaseId}:p013-candidate-v1`,
    course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
    persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p013-candidate-v1`}),
    pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
      selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:24}),
  });
}
