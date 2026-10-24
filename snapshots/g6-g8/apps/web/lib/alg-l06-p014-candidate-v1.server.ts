import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
  from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P013FormalDescriptor} from './alg-l06-p013-formal-admission-v1.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p014';
const ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB05.swf',bytes:566603,
  sha256:'aed0f7755d4f691cefcc28c815acc6b9d083fdfaae88ff385f22d3b32ba07603'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
  sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const AUDIT={path:'migrations/shared-alg001-l06-p014/audit/source-v1/source-audit-v1.json',bytes:10839,
  sha256:'008dd6f28d312f41c48ab389efce2e58452aef83c98312fa981c5aa88d69eb13'};
const GLOSSARY={path:'migrations/shared-alg001-l06-p014/audit/glossary-v1/input-output-crosswalk-v1.json',bytes:4901,
  sha256:'43a93c9aef1cb238fcaa8d395b9a80c8ed65e6f23e3b21c6995164d5c1be8c32'};
const AUDIO={path:'migrations/shared-alg001-l06-p014/audit/audio-v1/audio-source-audit-v1.json',bytes:209282,
  sha256:'21430358709c5d2d5c3668774482a6981e34355605d50fbd2c5fa3c6e4bc63f8'};
const BEHAVIOR={path:'migrations/shared-alg001-l06-p014/audit/behavior-v1/source-behavior-audit-v1.json',bytes:11048,
  sha256:'61cf9abc496457e78fb7610f8b2d4739a8b751ea074f97cad6a8fca3bbcaf896'};
const CANVAS={path:'output/alg-l06-p014-canvas-v1/canvas-manifest.json',bytes:6281,
  sha256:'df88878fbde893748c7e55f9ded97b824da4621dec8dd25b699b6cf08dd38162'};
const TEXT={path:'migrations/shared-alg001-l06-p014/audit/text-state-v1/text-state-audit-v1.json',bytes:9623,
  sha256:'c0c86e251229a3dcbeebe5178eb34f93e5a1788796bbc77d129a80d11ffa66d7'};
const NATIVE_STATE={path:'packages/demos/src/generated/alg-l06-p014-text-state-v1.ts',bytes:16432,
  sha256:'8403203b018274da94db7a0aacaedacf5d42c21cb0a13f9ca77b4ffde319cb01'};
const RENDERER={path:'output/alg-l06-p014-canvas-v1/canvas-renderer.js',bytes:3939200,
  sha256:'d01ed8b9bf43d9d88d8eeb5960e42ac1bcac941fce1b0a1eb31732ac097cad3f'};
const SA={path:'migrations/shared-alg001-l06-p014/audit/audio-v1/separate-sa-source-v1.mp3',bytes:136080,
  sha256:'b506e9e83e9716ed9c57d358f3f6664b5e3b8d8735d94ea4acb57449e148592d'};
const REGISTRY_SHA='ba4097d367f116cc5e1e5a8d6401dcda1604668ea5adf09bac58faae38a4eaee';
function demand(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(`P014_CANDIDATE_INVALID: ${reason}`);}

/** Local projection of VB4 into the real My Lesson host. No formal registration. */
export function algL6P014CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
  demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
    process.env.HELP_MATH_G678_SOURCE_ROOT===ROOT&&
    ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
  const base=algL6P013FormalDescriptor(),root=getWorkspaceRoot();
  const transaction=readRegistryTransaction(root);
  demand(transaction.sha256===REGISTRY_SHA&&registeredLocalOnlyAnimationKeys.length===501&&
    !localOnlyAnimationModuleRegistration(ID)&&
    !transaction.registry.calibrations.some((row:{entries:{key:string}[]})=>
      row.entries.some(entry=>entry.key===ID)),'501 formal pages; P014 is unregistered');
  demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&base.pages.length===60&&
    base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===24&&
    base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===24&&
    base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
    Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
    'formal 24-page P013 predecessor');
  readPin(ROOT,SOURCE);readPin(ROOT,XML);
  for(const item of [RENDERER,NATIVE_STATE,SA])readPin(root,item);
  const audit=readJsonPin(root,AUDIT),glossary=readJsonPin(root,GLOSSARY),
    audio=readJsonPin(root,AUDIO),behavior=readJsonPin(root,BEHAVIOR),
    canvas=readJsonPin(root,CANVAS),text=readJsonPin(root,TEXT);
  demand(audit.kind==='alg-l06-p014-source-audit-v1'&&audit.animationId===ID&&
    audit.source.sha256===SOURCE.sha256&&audit.catalog.globalOrdinal===14&&
    audit.catalog.section==='VB'&&audit.catalog.sectionPageOrdinal===4&&
    audit.runtime.header.rootFrameCount===10&&audit.runtime.header.fps===12&&
    audit.runtime.mainDomain==='sprite-227'&&audit.runtime.mainFrames===449&&
    audit.capabilityBoundary.xmlCompleteStructuralEvidence===false,
    'source identity, domain and parser boundary');
  demand(glossary.kind==='alg-l06-p014-input-output-glossary-crosswalk-v1'&&
    glossary.animationId===ID&&glossary.source.sha256===SOURCE.sha256&&
    isDeepStrictEqual(glossary.terms.map((term:{id:string})=>term.id),['input','output'])&&
    Object.values(glossary.acceptanceEffects).every(value=>value===false),
    'source Input/Output glossary crosswalk');
  demand(audio.kind==='alg-l06-p014-audio-source-audit-v1'&&
    audio.source.swf.sha256===SOURCE.sha256&&audio.source.separateSa.sha256===SA.sha256&&
    audio.separateSa.copy.sha256===SA.sha256&&audio.streamCount===8&&
    audio.trailers.length===1&&audio.trailers[0].domain==='sprite-83'&&
    audio.trailers[0].bytes===386,'eight tagged streams and separate SA');
  const mainAudio=audio.streams.find((stream:{domain:string})=>stream.domain==='sprite-227');
  demand(mainAudio?.contiguousRanges.length===2&&
    isDeepStrictEqual(mainAudio.contiguousRanges.map((range:{firstFrame:number;lastFrame:number})=>
      [range.firstFrame,range.lastFrame]),[[2,110],[125,449]]),
    'two source main-audio intervals');
  demand(behavior.kind==='alg-l06-p014-source-behavior-audit-v1'&&
    behavior.animationId===ID&&behavior.source.sha256===SOURCE.sha256&&
    behavior.mainQuizHold.frame===120&&
    Object.values(behavior.acceptanceEffects).every(value=>value===false),
    'source quiz behavior evidence');
  demand(canvas.kind==='alg-l06-p014-maintained-canvas-v1'&&canvas.animationId===ID&&
    canvas.source.sha256===SOURCE.sha256&&canvas.rootFrame===6&&
    canvas.mainFrameCount===449&&canvas.outputs[0].sha256===RENDERER.sha256&&
    Object.values(canvas.acceptanceEffects).every((value:unknown)=>value===false),
    'maintained source drawing candidate');
  demand(text.kind==='alg-l06-p014-text-state-audit-v1'&&text.animationId===ID&&
    text.sourceSwf.sha256===SOURCE.sha256&&
    text.output.path===NATIVE_STATE.path&&text.output.bytes===NATIVE_STATE.bytes&&
    text.output.sha256===NATIVE_STATE.sha256&&
    text.semanticTiming.answerButtonsAtHold===120&&
    text.semanticTiming.inputValue===188&&text.semanticTiming.substitution===254&&
    text.semanticTiming.intermediate===311&&text.semanticTiming.resultFull===425&&
    isDeepStrictEqual(text.feedbackAcknowledgments.map((entry:{holdFrame:number})=>
      entry.holdFrame),[20,22,23]),
    'source text and feedback reveal evidence');
  const target=base.pages[13];
  demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===14&&
    target.sectionCode==='VB'&&target.sectionPageOrdinal===4&&
    target.source.assetId===`swf-${SOURCE.sha256}`&&target.source.sourceOccurrence===14&&
    target.rendererAvailability.kind==='unavailable'&&
    target.previousPlacementId==='shared-alg001-l06-p013'&&
    target.nextPlacementId==='shared-alg001-l06-p015','exact P014 placement');
  demand(['input','output'].every(id=>base.glossary.filter(entry=>entry.id===id).length===1),
    'existing source-bound Input/Output glossary');
  const pages=base.pages.map((page,index)=>index!==13?page:Object.freeze({...page,
    rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
      runtimeQuery:Object.freeze({frameDomain:'sprite-227',language:'fixed-en' as const,
        scenario:'source-static-frame',seed:'0'})}),
    runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
      actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
      audioAcceptance:'not-established' as const,
      replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
      productVisualBehaviorComposite:'not-established' as const}),
    presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p014-source-readable'}),
  }));
  const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
    .map(page=>page.animationId);
  demand(selected.length===25&&
    isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
    'exact single candidate addition');
  return Object.freeze({...base,descriptorId:`${base.descriptorId}:p014-candidate-v1`,
    calibrationId:'g678-alg-l06-p014-unregistered-candidate-v1',
    releaseId:`${base.releaseId}:p014-candidate-v1`,
    course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
    persistence:Object.freeze({...base.persistence,
      storageKey:`${base.persistence.storageKey}:p014-candidate-v1`}),
    pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
      selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:25}),
  });
}
