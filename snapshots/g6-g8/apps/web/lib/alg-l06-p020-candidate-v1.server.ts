import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P019FormalDescriptor} from './alg-l06-p019-formal-admission-v1.server';
import {P020_ID as ID,P020_SOURCE_ROOT as ROOT,p020LocalDevelopment}
 from './alg-l06-p020-preview-policy-v1';
import {P020_RESOURCE_PINS} from './alg-l06-p020-local-request-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB13.swf',bytes:143936,
 sha256:'6d0df40af188c98b77a7419b89223c922200723ce106240a6d08e49891a5d25f'};
const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB13.mp3',bytes:66864,
 sha256:'f4ba15d3d1d483da6bb90e46a444196f7d80b910af862d2b03c56f3a1f2618d4'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const INTAKE={path:'output/alg-l06-p020-intake-recon-v1/intake-recon-v1.json',bytes:6114,
 sha256:'557725d95f07603aed150bf1e77424affac0de9e8324709887ad0306b75f70e7'};
const SOURCE_AUDIT={path:'output/alg-l06-p020-source-audit-v1/source-audit-v1.json',bytes:241742,
 sha256:'8e48a11f8b3f4a1a3f6545105124b0a85eff1827675dd3ca28eb912226a112fb'};
const FRAMES={path:'output/alg-l06-p020-source-audit-v1/domain-frame-states-v1.json',bytes:7286493,
 sha256:'5edb62a3422e4cbda9c9abdf47f3abc2b83385657a0bec4568890193180736e7'};
const BEHAVIOR={path:'output/alg-l06-p020-behavior-v1/source-behavior-audit-v1.json',bytes:33673,
 sha256:'c46706b5c6d7fc57af6ac4584b655d86d6b87d0395aed7ca35af4275287a8523'};
const TEXT={path:'migrations/shared-alg001-l06-p020/audit/text-state-v1/text-state-source-v1.json',bytes:14542,
 sha256:'271378e3ebae1c7553c8205980211dc46a844df362bb9f72e629bbc9239363b0'};
const TEXT_GENERATOR={path:'scripts/build-alg-l06-p020-text-state-v1.mjs',bytes:16714,
 sha256:'312467748991c12c821dd27eca8101c88e3a80b80e9fc0eeb2d96ca7dcb16dbe'};
const NATIVE_STATE={path:'packages/demos/src/generated/alg-l06-p020-text-state-v1.ts',bytes:17802,
 sha256:'7371cae53f65d025eff4305e10c16a572694c9a005c823582c450fc9e62a0dbc'};
const NATIVE_COMPONENT={path:'packages/demos/src/alg-l06-p020-native-text-v1.tsx',bytes:8574,
 sha256:'fd09c6c46689bebbb3ff37e305362f99361678f5c122263eb503841a40ee9b47'};
const CANVAS={path:'output/alg-l06-p020-canvas-v1/canvas-manifest.json',bytes:9878,
 sha256:'6c959fc5141a26e103bc28664fcd6f2f80d7367524a06f0e94aa2a8a4aec5bf3'};
const CANVAS_XML={path:'output/alg-l06-p020-canvas-v1/source.xml',bytes:1745964,
 sha256:'7d51e4063cebd6f20a8572033ea6e1ba695995d3853906a0e446b963a6d18bc0'};
const AUDIO={path:'output/alg-l06-p020-audio-v1/audio-source-audit-v1.json',bytes:126345,
 sha256:'3d8ee4c576c28865ed407cbd85fb66ea1e89fd3f514a97d7d6e4ff560efe0724'};
const AUDIO_PLAN={path:'output/alg-l06-p020-audio-v1/domain-audio-plan-v1.json',bytes:7332,
 sha256:'4a581a63f859bca8d6c5cdba8564cdcdc6dbef56f5fb0f081e68aa8cf8e9e5f3'};
const OWN_TOKENS=['canvas-renderer.js','main-1','feedback-right-1','feedback-right-2',
 'feedback-right-3','feedback-right-4','feedback-wrong-1','feedback-wrong-2',
 'feedback-wrong-3','optional-spanish-audio-v1'] as const;
const GLOSSARY=['Input','Function','Output'] as const;
const DOMAINS=['sprite-157','sprite-128','sprite-108','sprite-141',
 'sprite-65','sprite-94','sprite-80'] as const;
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`P020_CANDIDATE_INVALID: ${reason}`);
}

/** Source-locked VB10 projection. It does not mutate the active index. */
export function algL6P020CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p020LocalDevelopment(),'local physical source environment');
 const base=algL6P019FormalDescriptor(),root=getWorkspaceRoot();
 const transaction=readRegistryTransaction(root);
 demand(registeredLocalOnlyAnimationKeys.length===507&&
  !localOnlyAnimationModuleRegistration(ID)&&
  !transaction.registry.calibrations.some((row:{entries:{key:string}[]})=>
   row.entries.some(entry=>entry.key===ID)),
  '507 formal pages; P020 unregistered');
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===30&&
  base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===30&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  base.glossary.length===32&&Object.values(base.productBridge.acceptanceEffects).every(v=>v===false),
  'P019 formal predecessor');
 for(const pin of [SOURCE,SA,XML])readPin(ROOT,pin);
 for(const pin of [FRAMES,CANVAS_XML,TEXT_GENERATOR,NATIVE_STATE,NATIVE_COMPONENT])
  readPin(root,pin);
 for(const token of OWN_TOKENS){
  const row=P020_RESOURCE_PINS[token];
  demand(row.root==='workspace','own asset root');
  readPin(root,{path:row.path,bytes:row.bytes,sha256:row.sha256});
 }
 const intake=readJsonPin(root,INTAKE),sourceAudit=readJsonPin(root,SOURCE_AUDIT),
  behavior=readJsonPin(root,BEHAVIOR),text=readJsonPin(root,TEXT),
  canvas=readJsonPin(root,CANVAS),audio=readJsonPin(root,AUDIO),
  audioPlan=readJsonPin(root,AUDIO_PLAN);
 demand(intake.identity.animationId===ID&&intake.identity.globalOrdinal===20&&
  intake.identity.sectionCode==='VB'&&intake.identity.sectionPageOrdinal===10&&
  intake.source.swf.sha256===SOURCE.sha256&&intake.source.swf.bytes===SOURCE.bytes&&
  intake.source.authoringEvidence==='swf-only'&&
  intake.source.samePathFlaExists===false&&
  intake.sourceStructure.mainDomain.id==='sprite-162'&&
  intake.sourceStructure.mainDomain.frames===172&&
  intake.sourceStructure.buttons.definitions===8,
  'physical VB10 source');
 demand(sourceAudit.identity.animationId===ID&&sourceAudit.source.sha256===SOURCE.sha256&&
  sourceAudit.identity.rootEntryFrame===6&&sourceAudit.identity.mainDomain==='sprite-162'&&
  sourceAudit.identity.mainFrameCount===172&&sourceAudit.sourceSummary.staticTextDefinitions===36&&
  sourceAudit.sourceSummary.dynamicFields===3&&sourceAudit.audioDomains.length===8&&
  sourceAudit.frameEvidence.sha256===FRAMES.sha256&&
  sourceAudit.limits.originalRuntimeObserved===false,
  'time-resolved source structure');
 demand(behavior.source.sha256===SOURCE.sha256&&behavior.main.domain==='sprite-162'&&
  behavior.main.frameCount===172&&behavior.main.quizStopFrame===58&&
  behavior.answers.length===4&&behavior.feedback.length===7&&
  isDeepStrictEqual(behavior.feedback.map((row:{domain:string})=>row.domain),DOMAINS)&&
  behavior.limits.originalRuntime===false,
  'four answers and seven exact feedback domains');
 demand(text.animationId===ID&&text.sourceSwfSha256===SOURCE.sha256&&
  text.frameDomain==='sprite-162'&&text.frameCount===172&&
  text.glossaryControls.length===3&&
  isDeepStrictEqual(text.glossaryControls.map((c:{key:string;buttonId:number;firstCandidateFrame:number})=>
   [c.key,c.buttonId,c.firstCandidateFrame]),[['Input',7,7],['Function',8,7],['Output',9,7]])&&
  text.policy.canvasGlyphs==='preserved'&&text.policy.language==='source-en-fallback'&&
  text.policy.originalRuntimeAccepted===false,
  'native source-English companion and glossary gates');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE.sha256&&
  canvas.main.domain==='sprite-162'&&canvas.main.frames===172&&
  canvas.main.quizStop===58&&canvas.rootFrame===6&&
  canvas.outputs[0].sha256===P020_RESOURCE_PINS['canvas-renderer.js'].sha256&&
  canvas.sourceText.staticGlyphsPreserved===true&&
  canvas.sourceText.dynamicFeedbackNeedsNative===true&&
  Object.values(canvas.acceptanceEffects).every(v=>v===false),
  'maintained branch-aware Canvas');
 demand(audio.source.swf.sha256===SOURCE.sha256&&audio.source.separateSa.sha256===SA.sha256&&
  audio.streams.length===8&&audioPlan.domains.length===8&&
  audioPlan.optionalSpanishAudio.asset.sha256===SA.sha256&&
  audioPlan.optionalSpanishAudio.activation==='explicit-user-only'&&
  audioPlan.optionalSpanishAudio.localeAutoplay===false&&
  audioPlan.optionalSpanishAudio.joinedWithMain===false&&
  audioPlan.policy.sprite94NegativeSeekUnresolved===true&&
  audioPlan.policy.originalRuntimeObserved===false,
  'separate branch audio and explicit SA');
 for(const key of GLOSSARY)demand(base.glossary.filter(entry=>
  entry.sourceKeyAttribute===key&&entry.id===key.toLowerCase()).length===1,
  `preserve exact ${key} dictionary entry`);
 const target=base.pages[19];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===20&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===10&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.source.sourceOccurrence===20&&target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p019',
  'exact P020 VB10 placement');
 const pages=base.pages.map((page,index)=>index!==19?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-162',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p020-source-readable'}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===31&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'one candidate projection only');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p020-candidate-v1`,
  calibrationId:'g678-alg-l06-p020-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p020-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p020-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:31}),
 });
}
