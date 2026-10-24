import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
  from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P017FormalDescriptor} from './alg-l06-p017-formal-admission-v1.server';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
  from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p018';
const ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const DICTIONARY_ROOT='/Volumes/WestWorld/HELP MATH Related Files';
const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB11.swf',bytes:223574,
 sha256:'400f0cdcb574864c7e9e2208f986e91f26e10f796623b6ea41d80a59310e167a'};
const SA_SOURCE={path:'G6-G8-shared/ALG001/L6/SA/L6VB11.mp3',bytes:308112,
 sha256:'1d6f1de82903f62e5c642ce0e51b1baa03ec30c1fbfbcd46f135e2c4d5538057'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const DICTIONARY_EN={path:'HELP_OnlineKeyTerms_XML/MI/L1KTE01.xml',bytes:345838,
 sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'};
const DICTIONARY_ES={path:'HELP_OnlineKeyTerms_XML/MI/L1KTS01.xml',bytes:344456,
 sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'};
const PREFLIGHT={path:'output/alg-l06-p018-source-preflight-v1/source-preflight-v1.json',
 bytes:17663,sha256:'4ae5baf4b8a7a339c0d647bb548a035203ff797dcf42809f7b7be76ccda80604'};
const SOURCE_TIME={path:'output/alg-l06-p018-source-audit-v1/time-resolved-audit-v2.json',
 bytes:143368,sha256:'6a8e289b3f4ce2c635cff61ae8b950596272d6ff835c3fae0ec6a8f1dfd66e79'};
const SOURCE_FRAMES={path:'output/alg-l06-p018-source-audit-v1/frame-states-v2.json',
 bytes:12647538,sha256:'b03f44b01075da419444ba8e11b27ee2bff2352369d7d5da3b599b1fdeadf9b0'};
const CROSSWALK={path:'output/alg-l06-p018-glossary-audit-v1/five-term-crosswalk-v1.json',
 bytes:10887,sha256:'bc60ac167944ec74c9a0e5170363d6311319eb6c097fc532da97334bb2bfa9a1'};
const TEXT={path:'migrations/shared-alg001-l06-p018/audit/text-state-v1/text-state-source-v1.json',
 bytes:39713,sha256:'b79014abb74c3a910e7f7e11d45d13a442c27f47f4fe4b230f299e1d46a70d88'};
const TEXT_GENERATOR={path:'scripts/build-alg-l06-p018-text-state-v1.mjs',bytes:12257,
 sha256:'0d58002a6a71ec183bc53d86ffc9a35cb82a3fec98320df9045b86038a295480'};
const NATIVE_STATE={path:'packages/demos/src/generated/alg-l06-p018-text-state-v1.ts',bytes:42515,
 sha256:'36fb7a24061bc68376d9ef4852d6b6f5e60602fe2849faaacc4366729c2db0cd'};
const NATIVE_COMPONENT={path:'packages/demos/src/alg-l06-p018-native-text-v1.tsx',bytes:4476,
 sha256:'8a4e793da6420507bd2f520c1071f21c0bf82ff081d97ad3758189c1808b94bd'};
const AUDIO={path:'migrations/shared-alg001-l06-p018/audit/audio-v1/audio-source-audit-v1.json',
 bytes:199476,sha256:'c70000c012ccdbb7a78de7ee8059f1e3d595e0977a2d52d81d6357a618ca0b3b'};
const AUDIO_PLAN={path:'migrations/shared-alg001-l06-p018/audit/audio-plan-v1/audio-plan-v1.json',
 bytes:2417,sha256:'8f376a99fa2cdc0dbb4f5b77c332a6d52ad33febf2e766f3902e314ed707eace'};
const MAIN_AUDIO={path:'migrations/shared-alg001-l06-p018/audit/audio-v1/sprite-32-source-v1.mp3',
 bytes:268190,sha256:'dbdb6229947cde1d0353c3ccc41e05514ac988559b49d26c9f8f52d637a59770'};
const SA_COPY={path:'migrations/shared-alg001-l06-p018/audit/audio-v1/separate-sa-source-v1.mp3',
 bytes:308112,sha256:SA_SOURCE.sha256};
const CANVAS={path:'output/alg-l06-p018-canvas-v1/canvas-manifest.json',bytes:6576,
 sha256:'5cff7085f08d0bc1cbb203f6c3497662838caa5f81c29c5ad1341c0c130f7ad9'};
const CANVAS_XML={path:'output/alg-l06-p018-canvas-v1/source.xml',bytes:603300,
 sha256:'44630c9276e1b6c99e54a1d6ab75839a59633e608ff4b6f698e4908a5937ef81'};
const RENDERER={path:'output/alg-l06-p018-canvas-v1/canvas-renderer.js',bytes:2638179,
 sha256:'0204230c05b37bc076ae7510bbb4f6ef56b25d1fe50945f2bbb35e43521e88c6'};
const REGISTRY_SHA='b630eab4d74e56e1fe16c98d9cdc639953a05ee907b37b2c059b5be09206294d';
const BUTTONS=[[8,'Evaluate','evaluate'],[9,'Input variable','input-variable'],
 [10,'Substitute','substitute'],[11,'Function','function'],[20,'Result','result']] as const;
const INSTANCE_GATES=[['Evaluate',8,4,6,11],['Function',11,10,6,18],
 ['Substitute',10,8,6,43],['Input variable',9,6,6,65],['Result',20,16,19,102],
 ['Evaluate',8,22,27,324],['Function',11,24,27,333]] as const;
const NEW_IDS=['evaluate','substitute','result'] as const;
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`P018_CANDIDATE_INVALID: ${reason}`);
}

/** Unregistered VB8 projection for a local My Lesson candidate only. */
export function algL6P018CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===ROOT&&
  ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local physical source environment');
 const base=algL6P017FormalDescriptor(),root=getWorkspaceRoot(),transaction=readRegistryTransaction(root);
 demand(transaction.sha256===REGISTRY_SHA&&registeredLocalOnlyAnimationKeys.length===505&&
  !localOnlyAnimationModuleRegistration(ID)&&!transaction.registry.calibrations.some(
   (row:{entries:{key:string}[]})=>row.entries.some(entry=>entry.key===ID)),
  '505 formal pages; P018 remains unregistered');
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===28&&
  base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===28&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  base.glossary.length===27&&
  Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'P017 formal predecessor and closed acceptance');
 for(const pin of [SOURCE,SA_SOURCE,XML])readPin(ROOT,pin);
 for(const pin of [DICTIONARY_EN,DICTIONARY_ES])readPin(DICTIONARY_ROOT,pin);
 for(const pin of [SOURCE_FRAMES,CANVAS_XML,RENDERER,TEXT_GENERATOR,NATIVE_STATE,
  NATIVE_COMPONENT,MAIN_AUDIO,SA_COPY])readPin(root,pin);
 const preflight=readJsonPin(root,PREFLIGHT),sourceTime=readJsonPin(root,SOURCE_TIME),
  crosswalk=readJsonPin(root,CROSSWALK),text=readJsonPin(root,TEXT),
  audio=readJsonPin(root,AUDIO),plan=readJsonPin(root,AUDIO_PLAN),
  canvas=readJsonPin(root,CANVAS);
 const structural=preflight.structuralSourceFacts;
 demand(preflight.identity.animationId===ID&&preflight.identity.globalOrdinal===18&&
  preflight.identity.sectionCode==='VB'&&preflight.identity.sectionPageOrdinal===8&&
  preflight.source.swf.sha256===SOURCE.sha256&&
  preflight.source.optionalSpanishAudioCandidate.sha256===SA_SOURCE.sha256&&
  preflight.source.lessonXml.sha256===XML.sha256&&
  structural.header.fps===12&&structural.header.rootFrameCount===10&&
  structural.frameDomains.longestStaticallyRootReachableDomain.domainId==='sprite-32'&&
  structural.frameDomains.longestStaticallyRootReachableDomain.declaredFrameCount===648&&
  structural.tagCounts.DefineText===17&&structural.tagCounts.DefineButton2===5&&
  structural.tagCounts.SoundStreamBlock===647,
  'physical VB8 source structure');
 demand(sourceTime.schemaVersion===2&&sourceTime.identity.animationId===ID&&
  sourceTime.source.sha256===SOURCE.sha256&&sourceTime.identity.sourceOccurrence===18&&
  sourceTime.identity.section==='VB'&&sourceTime.identity.sectionPageOrdinal===8&&
  sourceTime.identity.rootEntryFrame===6&&sourceTime.identity.mainDomain==='sprite-32'&&
  sourceTime.identity.mainFrameCount===648&&sourceTime.identity.fps===12&&
  sourceTime.textDefinitions.length===17&&sourceTime.instances.length===45&&
  sourceTime.instances.filter((item:{role:string})=>item.role==='static-text').length===38&&
  sourceTime.buttons.length===5&&sourceTime.frameEvidence.sha256===SOURCE_FRAMES.sha256&&
  isDeepStrictEqual(sourceTime.replacementPlacements.map(
   (item:{frame:number;depth:number;fromCharacterId:number;toCharacterId:number})=>
    [item.frame,item.depth,item.fromCharacterId,item.toCharacterId]),[[64,13,15,16]])&&
  sourceTime.limits.originalRuntimeObserved===false,
  'corrected v2 source timing and replacement identity');
 demand(isDeepStrictEqual(sourceTime.buttons.map(
  (button:{characterId:number;keyAttribute:string})=>[button.characterId,button.keyAttribute]),
  BUTTONS.map(([id,key])=>[id,key]))&&
  isDeepStrictEqual(sourceTime.buttons.flatMap((button:{characterId:number;keyAttribute:string;
   instances:Array<{depth:number;firstSourceReadyFrame:number;
    sourceLabelBinding:{textId:number}}>})=>button.instances.map(item=>
     [button.keyAttribute,button.characterId,item.depth,item.sourceLabelBinding.textId,
      item.firstSourceReadyFrame])).sort((a:unknown[],b:unknown[])=>Number(a[4])-Number(b[4])),
   INSTANCE_GATES),
  'five exact AVM1 keys and seven source-instance glossary gates');
 demand(text.animationId===ID&&text.sourceSwfSha256===SOURCE.sha256&&
  text.frameDomain==='sprite-32'&&text.frameCount===648&&text.fps===12&&
  text.textDefinitions.length===17&&text.textInstances.length===38&&
  text.policy.canvasGlyphs==='preserved'&&text.policy.language==='source-en-fallback'&&
  text.policy.originalRuntimeAccepted===false&&
  isDeepStrictEqual(text.glossaryControls.map((item:{key:string;sourceButtonId:number;
   depth:number;sourceLabelTextId:number;firstCandidateFrame:number})=>
    [item.key,item.sourceButtonId,item.depth,item.sourceLabelTextId,item.firstCandidateFrame]),
   INSTANCE_GATES)&&
  text.glossaryControls.every((item:{originalClickObserved:boolean})=>
   item.originalClickObserved===false)&&
  text.inputs.some((item:{path:string;sha256:string})=>
   item.path===SOURCE_TIME.path&&item.sha256===SOURCE_TIME.sha256)&&
  text.inputs.some((item:{path:string;sha256:string})=>
   item.path===SOURCE_FRAMES.path&&item.sha256===SOURCE_FRAMES.sha256),
  'source-English native text and independent repeated glossary instances');
 demand(audio.source.swf.sha256===SOURCE.sha256&&
  audio.source.separateSa.sha256===SA_SOURCE.sha256&&
  audio.separateSa.copy.sha256===SA_COPY.sha256&&audio.streamCount===1&&
  audio.trailers.length===0&&audio.streams[0].domain==='sprite-32'&&
  isDeepStrictEqual(audio.streams[0].contiguousRanges.map(
   (range:{firstFrame:number;lastFrame:number})=>[range.firstFrame,range.lastFrame]),
   [[2,648]])&&audio.limits.separateSaExplicitTriggerRequired===true&&
  audio.limits.separateSaSplicedIntoMain===false&&audio.limits.localeChangeStartsSa===false&&
  plan.sourceAudit.sha256===AUDIO.sha256&&plan.mainAssets.length===1&&
  plan.mainAssets[0].sourceSha256===MAIN_AUDIO.sha256&&
  plan.separateSa.sourceSha256===SA_SOURCE.sha256&&
  plan.disposition.separateSaSpliced===false&&plan.disposition.localeStartsAudio===false&&
  plan.disposition.originalRuntimeAccepted===false,
  'one continuous main source stream and independent, explicit SA');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE.sha256&&
  canvas.mainFrameCount===648&&canvas.rootFrame===6&&
  canvas.outputs[0].sha256===RENDERER.sha256&&
  canvas.sourceGlyphRendering.definitions===17&&canvas.sourceGlyphRendering.preserved===true&&
  canvas.sourceClipMasks.length===4&&canvas.inputs.some((item:{path:string;sha256:string})=>
   item.path===CANVAS_XML.path&&item.sha256===CANVAS_XML.sha256)&&
  Object.values(canvas.acceptanceEffects).every(value=>value===false),
  'source-bound Canvas drawing and preserved glyphs');
 demand(crosswalk.identity.animationId===ID&&
  crosswalk.inputs.swf.sha256===SOURCE.sha256&&
  crosswalk.inputs.xml.sha256===CANVAS_XML.sha256&&
  crosswalk.inputs.lesson.sha256===XML.sha256&&
  crosswalk.inputs.en.sha256===DICTIONARY_EN.sha256&&
  crosswalk.inputs.es.sha256===DICTIONARY_ES.sha256&&
  crosswalk.active.registeredLessonPages===28&&crosswalk.active.glossaryEntryCount===27&&
  isDeepStrictEqual(crosswalk.entries.map(
   (entry:{buttonCharacterId:number;key:string;dictionary:{id:string}})=>
    [entry.buttonCharacterId,entry.key,entry.dictionary.id]),BUTTONS)&&
  isDeepStrictEqual(crosswalk.missingModernKeys,['Evaluate','Substitute','Result'])&&
  crosswalk.originalHostRunObserved===false&&crosswalk.acceptanceChanged===false,
  'five exact bilingual source dictionary entries');
 const oldIds=new Set(base.glossary.map(entry=>entry.id));
 demand(oldIds.size===27&&NEW_IDS.every(id=>!oldIds.has(id))&&
  base.glossary.filter(entry=>entry.id==='function'&&
   entry.sourceKeyAttribute==='Function').length===1&&
  base.glossary.filter(entry=>entry.id==='input-variable'&&
   entry.sourceKeyAttribute==='Input variable').length===1,
  'retain existing Function and Input variable without duplication');
 const additions:PageOnlyLessonGlossaryEntry[]=NEW_IDS.map(id=>{
  const item=crosswalk.entries.find((entry:{dictionary:{id:string}})=>entry.dictionary.id===id);
  demand(item&&item.modern.present===false&&item.modern.entryId===null&&
   item.dictionary.sourceKeyAttribute===item.key&&
   item.dictionary.definitions.en.length>0&&item.dictionary.definitions.es.length>0,
   `new exact source glossary entry: ${id}`);
  return Object.freeze({id,sourceKeyAttribute:item.key,
   labels:Object.freeze({...item.dictionary.labels}),
   definitions:Object.freeze({...item.dictionary.definitions}),
   source:Object.freeze({en:Object.freeze({...item.dictionary.source.en}),
    es:Object.freeze({...item.dictionary.source.es})})});
 });
 const glossary=Object.freeze([...base.glossary,...additions]);
 demand(glossary.length===30&&BUTTONS.every(([,key,id])=>
  glossary.filter(entry=>entry.id===id&&entry.sourceKeyAttribute===key).length===1),
  'all five exact modern glossary entries');
 const target=base.pages[17];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===18&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===8&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.source.sourceOccurrence===18&&target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p017'&&
  target.nextPlacementId==='shared-alg001-l06-p019','exact P018 VB8 placement');
 const pages=base.pages.map((page,index)=>index!==17?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-32',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p018-source-readable'}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===29&&
  isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  'exact single candidate projection');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p018-candidate-v1`,
  calibrationId:'g678-alg-l06-p018-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p018-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p018-candidate-v1`}),
  glossary,pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:29}),
 });
}
