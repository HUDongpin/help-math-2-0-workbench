import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
  from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P016FormalDescriptor} from './alg-l06-p016-formal-admission-v1.server';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
  from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p017';
const ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB10.swf',bytes:245604,
 sha256:'7010ecfee54a80298e3bba09400a712cfed65dad983811d9a470bf017156ffb3'};
const SA_SOURCE={path:'G6-G8-shared/ALG001/L6/SA/L6VB10.mp3',bytes:617568,
 sha256:'7a00a610f17eddca68ec987978221afe07936ac0f48cb098927e2d04880eaf7f'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const PREFLIGHT={path:'output/alg-l06-p017-source-preflight-v1/source-preflight-v1.json',
 bytes:23476,sha256:'bfd7a3a8560839a707726551333572dbd3a91352066fa1a783801f7cff42d3f8'};
const SOURCE_TIME={path:'output/alg-l06-p017-source-audit-v1/time-resolved-audit-v1.json',
 bytes:146861,sha256:'7977e0be92a77b01b6bae6afffa5746499edf446a6237026d28eb1e18a3e8c3f'};
const CROSSWALK={path:'output/alg-l06-p017-glossary-audit-v1/six-term-crosswalk-v1.json',
 bytes:16362,sha256:'e3e413a9bfe488cb4d2287db095efddeb05233c42c46c3bf350a729322d53731'};
const TEXT={path:'migrations/shared-alg001-l06-p017/audit/text-state-v1/text-state-source-v1.json',
 bytes:26235,sha256:'3d0e3935bb139ead600c1c40e4b53802bec0d0885be0c33560ece17c70afd0b2'};
const TEXT_GENERATOR={path:'scripts/build-alg-l06-p017-text-state-v1.mjs',bytes:10704,
 sha256:'6915fdf705849242460ffade35e46d54b11274728c9f7d342538f44f2081d836'};
const NATIVE_STATE={path:'packages/demos/src/generated/alg-l06-p017-text-state-v1.ts',
 bytes:28726,sha256:'f4e1d28e50656b3f344de73687fc751c6d63e57a63c91dab084137c009120856'};
const NATIVE_COMPONENT={path:'packages/demos/src/alg-l06-p017-native-text-v1.tsx',
 bytes:3040,sha256:'03bc1735005b22addea900c62e9857441c3e1cbcec60c847c47d0720cd587c09'};
const AUDIO={path:'migrations/shared-alg001-l06-p017/audit/audio-v1/audio-source-audit-v1.json',
 bytes:221673,sha256:'c20d3d47c012c16bf376d0c56aac76c3c57fcfe1acd75ad08fa6801aff1e9633'};
const SA_COPY={path:'migrations/shared-alg001-l06-p017/audit/audio-v1/separate-sa-source-v1.mp3',
 bytes:617568,sha256:SA_SOURCE.sha256};
const CANVAS={path:'output/alg-l06-p017-canvas-v1/canvas-manifest.json',bytes:6203,
 sha256:'f844a46ece7eec13f9cfb53991d66281b163318a07668e235cdfeab1340682d6'};
const RENDERER={path:'output/alg-l06-p017-canvas-v1/canvas-renderer.js',bytes:4047416,
 sha256:'b78c06d8e3f0111ae28ee7d4c90f98381001fe3b3fa0e9e92d6b3ab24bda6a7f'};
const REGISTRY_SHA='865c893897d5c93d70371572aff621108914b34d23f0e4e7566d73ea8748ba00';
const BUTTONS=[
 [7,'Equation','equation'],[8,'Sentence','sentence'],[9,'Function','function'],
 [16,'Rule','rule'],[19,'Output variable','output-variable'],
 [23,'Input variable','input-variable'],
] as const;
const NEW_IDS=['sentence','output-variable','input-variable'] as const;
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`P017_CANDIDATE_INVALID: ${reason}`);
}

/** One physical-source VB7 candidate; no registry or acceptance mutation. */
export function algL6P017CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===ROOT&&
  ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
 const base=algL6P016FormalDescriptor(),root=getWorkspaceRoot(),transaction=readRegistryTransaction(root);
 demand(transaction.sha256===REGISTRY_SHA&&registeredLocalOnlyAnimationKeys.length===504&&
  !localOnlyAnimationModuleRegistration(ID)&&!transaction.registry.calibrations.some(
   (row:{entries:{key:string}[]})=>row.entries.some(entry=>entry.key===ID)),
  '504 formal pages and P017 still unregistered');
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===27&&
  base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===27&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  base.glossary.length===24&&
  Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'P016 formal predecessor and independent acceptance');
 readPin(ROOT,SOURCE);readPin(ROOT,SA_SOURCE);readPin(ROOT,XML);
 for(const pin of [RENDERER,SA_COPY,TEXT_GENERATOR,NATIVE_STATE,NATIVE_COMPONENT])readPin(root,pin);
 const preflight=readJsonPin(root,PREFLIGHT),sourceTime=readJsonPin(root,SOURCE_TIME),
  crosswalk=readJsonPin(root,CROSSWALK),text=readJsonPin(root,TEXT),
  audio=readJsonPin(root,AUDIO),canvas=readJsonPin(root,CANVAS);
 demand(preflight.identity.animationId===ID&&preflight.identity.globalOrdinal===17&&
  preflight.identity.sectionCode==='VB'&&preflight.identity.sectionPageOrdinal===7&&
  preflight.source.swf.sha256===SOURCE.sha256&&
  preflight.swf.rootPlacement.frame===6&&
  preflight.swf.timelines[1].timelineId==='sprite-42'&&
  preflight.swf.timelines[1].observedFrames===721&&
  preflight.swf.summary.staticTextDefinitions===20&&
  preflight.swf.summary.dynamicFields===0&&preflight.swf.summary.buttonDefinitions===6&&
  isDeepStrictEqual(preflight.swf.glossaryButtons.map(
   (button:{characterId:number;keyAttribute:string})=>[button.characterId,button.keyAttribute]),
   BUTTONS.map(([button,key])=>[button,key])),
  'source structure and six AVM1 glossary buttons');
 demand(sourceTime.identity.animationId===ID&&sourceTime.source.sha256===SOURCE.sha256&&
  sourceTime.identity.mainDomain==='sprite-42'&&
  sourceTime.identity.mainFrameCount===721&&sourceTime.identity.rootEntryFrame===6&&
  sourceTime.identity.fps===12&&sourceTime.textDefinitions.length===20&&
  sourceTime.buttons.length===6&&sourceTime.limits.originalRuntimeObserved===false,
  'time-resolved source audit remains static evidence');
 demand(text.animationId===ID&&text.sourceSwfSha256===SOURCE.sha256&&
  text.frameDomain==='sprite-42'&&text.frameCount===721&&text.fps===12&&
  text.textDefinitions.length===20&&text.policy.canvasGlyphs==='preserved'&&
  text.policy.originalRuntimeAccepted===false&&
  isDeepStrictEqual(text.glossaryControls.map((item:{key:string;firstCandidateFrame:number})=>
   [item.key,item.firstCandidateFrame]),
   [['Equation',11],['Function',20],['Sentence',54],['Rule',68],
    ['Output variable',108],['Input variable',173]])&&
  text.glossaryControls.every((item:{originalClickObserved:boolean})=>
   item.originalClickObserved===false)&&
  text.inputs.some((item:{path:string;sha256:string})=>
   item.path===SOURCE_TIME.path&&item.sha256===SOURCE_TIME.sha256),
  'native text and fully exposed source glossary gates');
 demand(audio.source.swf.sha256===SOURCE.sha256&&
  audio.source.separateSa.sha256===SA_SOURCE.sha256&&
  audio.separateSa.copy.sha256===SA_COPY.sha256&&audio.streamCount===1&&
  audio.trailers.length===0&&audio.streams[0].domain==='sprite-42'&&
  isDeepStrictEqual(audio.streams[0].contiguousRanges.map(
   (range:{firstFrame:number;lastFrame:number})=>[range.firstFrame,range.lastFrame]),
   [[2,721]])&&audio.limits.separateSaExplicitTriggerRequired===true&&
  audio.limits.separateSaSplicedIntoMain===false&&audio.limits.localeChangeStartsSa===false,
  'one continuous main source stream and independent optional SA');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE.sha256&&
  canvas.mainFrameCount===721&&canvas.rootFrame===6&&
  canvas.outputs[0].sha256===RENDERER.sha256&&
  canvas.sourceGlyphRendering.definitions===20&&
  canvas.sourceGlyphRendering.preserved===true&&
  canvas.sourceClipMasks.length===5&&
  Object.values(canvas.acceptanceEffects).every(value=>value===false),
  'source-bound Canvas and preserved glyphs');
 demand(crosswalk.identity.animationId===ID&&
  crosswalk.identity.sourceSwfSha256===SOURCE.sha256&&
  crosswalk.active.registeredLessonPages===27&&
  crosswalk.active.glossaryEntryCount===24&&
  isDeepStrictEqual(crosswalk.entries.map(
   (entry:{buttonCharacterId:number;key:string;dictionary:{id:string}})=>
    [entry.buttonCharacterId,entry.key,entry.dictionary.id]),BUTTONS)&&
  isDeepStrictEqual(crosswalk.missingModernKeys,
   ['Sentence','Output variable','Input variable'])&&
  Object.values(crosswalk.acceptanceEffects).every(value=>value===false),
  'exact six source glossary definitions and three missing modern terms');
 for(const entry of crosswalk.entries){
  demand(entry.sourceButton.callsRootDoHyperLinks===true&&
   entry.sourceButton.stopsMainAnimation===true&&
   entry.dictionary.sourceKeyAttribute===entry.key&&
   entry.dictionary.definitions.en.length>0&&entry.dictionary.definitions.es.length>0,
   `source and bilingual dictionary: ${entry.key}`);
 }
 const oldIds=new Set(base.glossary.map(entry=>entry.id));
 demand(oldIds.size===24&&BUTTONS.filter(([, ,id])=>oldIds.has(id)).length===3&&
  NEW_IDS.every(id=>!oldIds.has(id))&&
  BUTTONS.filter(([, ,id])=>oldIds.has(id)).every(([,key,id])=>
   base.glossary.some(entry=>entry.id===id&&entry.sourceKeyAttribute===key)),
  'retain exact existing Equation, Function and Rule');
 const additions:PageOnlyLessonGlossaryEntry[]=NEW_IDS.map(id=>{
  const item=crosswalk.entries.find((entry:{dictionary:{id:string}})=>entry.dictionary.id===id);
  demand(item&&item.modern.present===false&&item.modern.entryId===null,
   `new exact glossary entry: ${id}`);
  return Object.freeze({id,sourceKeyAttribute:item.key,
   labels:Object.freeze({...item.dictionary.labels}),
   definitions:Object.freeze({...item.dictionary.definitions}),
   source:Object.freeze({en:Object.freeze({...item.dictionary.source.en}),
    es:Object.freeze({...item.dictionary.source.es})})});
 });
 const glossary=Object.freeze([...base.glossary,...additions]);
 demand(glossary.length===27&&
  BUTTONS.every(([,key,id])=>glossary.some(entry=>
   entry.id===id&&entry.sourceKeyAttribute===key)),'all six exact modern glossary entries');
 const target=base.pages[16];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===17&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===7&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.source.sourceOccurrence===17&&target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p016'&&
  target.nextPlacementId==='shared-alg001-l06-p018','exact P017 placement');
 const pages=base.pages.map((page,index)=>index!==16?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-42',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p017-source-readable'}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===28&&
  isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  'exact single candidate addition');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p017-candidate-v1`,
  calibrationId:'g678-alg-l06-p017-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p017-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p017-candidate-v1`}),
  glossary,pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:28}),
 });
}
