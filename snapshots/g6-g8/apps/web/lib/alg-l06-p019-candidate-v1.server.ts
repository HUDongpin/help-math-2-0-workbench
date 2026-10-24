import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P018FormalDescriptor} from './alg-l06-p018-formal-admission-v1.server';
import {P019_ID as ID,P019_SOURCE_ROOT as ROOT,p019LocalDevelopment}
 from './alg-l06-p019-preview-policy-v1';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

const DICTIONARY_ROOT='/Volumes/WestWorld/HELP MATH Related Files';
const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB12.swf',bytes:111550,
 sha256:'df8be172fd738ec4fca7bca02b0f166c88676f062170e6cee7b3a1081a91adec'};
const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB12.mp3',bytes:238896,
 sha256:'4c9c5df0d49d8a612a00c73f9dcf31ef63a4d34ab6c458625432e71b46c129d9'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const DICTIONARY_EN={path:'HELP_OnlineKeyTerms_XML/MI/L1KTE01.xml',bytes:345838,
 sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'};
const DICTIONARY_ES={path:'HELP_OnlineKeyTerms_XML/MI/L1KTS01.xml',bytes:344456,
 sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'};
const INTAKE={path:'output/alg-l06-p019-intake-recon-v1/intake-recon-v1.json',bytes:6790,
 sha256:'320fef2c23ef37d3293152b3c7ac81ae13b3a187871d899544e01bc3da0963d9'};
const TIME={path:'output/alg-l06-p019-source-audit-v1/time-resolved-audit-v1.json',bytes:158453,
 sha256:'bfc110b15850c17cb78c874da171c2a0635b4db1ed3c2f27a0a05013cf510dc1'};
const FRAMES={path:'output/alg-l06-p019-source-audit-v1/frame-states-v1.json',bytes:8844901,
 sha256:'ad4913b2ac3f2086c5bc5d335bb3ebd4e8356d2782df5b13e0b1b776b04fd990'};
const TEXT={path:'migrations/shared-alg001-l06-p019/audit/text-state-v1/text-state-source-v1.json',bytes:39118,
 sha256:'a8ffb053aee25429a1a1025fb088059c6a8ab7c8ba53fcd2f433127de5ccb63d'};
const TEXT_GENERATOR={path:'scripts/build-alg-l06-p019-text-state-v1.mjs',bytes:14312,
 sha256:'b3ba5192e92672fcae0a1fcd7f530e6f43032df5a3c25f95dde22a8c7d2900ea'};
const NATIVE_STATE={path:'packages/demos/src/generated/alg-l06-p019-text-state-v1.ts',bytes:42356,
 sha256:'ec15dc5a8c09ffa00915c0cc4d8ce903f3decf9d861672e68ba2803c0f4ca8b6'};
const NATIVE_COMPONENT={path:'packages/demos/src/alg-l06-p019-native-text-v1.tsx',bytes:4937,
 sha256:'3919dcac16b8a0ed431111f08522adfb3b541ddc8e658c5ba9767a93baa63dbf'};
const CROSSWALK={path:'output/alg-l06-p019-glossary-audit-v1/six-term-crosswalk-v1.json',bytes:10805,
 sha256:'a7bd4ba5e23059cf8e9479859191df2cb0a2edf9e9f650b2bf3fdba76db70938'};
const CANVAS={path:'output/alg-l06-p019-canvas-v1/canvas-manifest.json',bytes:7220,
 sha256:'edd1932226603d9dbd19f8feadd676ca7f3655cb51f135aee2338df2a9283558'};
const CANVAS_XML={path:'output/alg-l06-p019-canvas-v1/source.xml',bytes:384535,
 sha256:'9009cdea1673c90dc6d781b71ac98737bbe31bfd1be22e32e672cff610ffa162'};
const RENDERER={path:'output/alg-l06-p019-canvas-v1/canvas-renderer.js',bytes:1434313,
 sha256:'8e33f562010cb30f4dece352cb4167d9b3caed1128605098cea0a12d2b0db59b'};
const AUDIO={path:'output/alg-l06-p019-audio-v1/audio-source-audit-v1.json',bytes:102589,
 sha256:'b565a8e5e38fc8076a9aa43ef0f79f1dd5aa333d1cfa28895e1c6fb36f02fb8d'};
const AUDIO_PLAN={path:'output/alg-l06-p019-audio-v1/audio-plan-v1.json',bytes:2434,
 sha256:'5c49daa9bb7ca03b1ff53487e8ff87138ecfd89af7e158b9a42b4d23508eda44'};
const MAIN={path:'output/alg-l06-p019-audio-v1/sprite-37-source-v1.mp3',bytes:144950,
 sha256:'0817bac5188a2a24d9eb48b3c8bffd293f31b715c4816e7159467d00c83f49ad'};
const SA_COPY={path:'output/alg-l06-p019-audio-v1/separate-sa-source-v1.mp3',bytes:238896,
 sha256:SA.sha256};
const REGISTRY_SHA='ee22bdc37f455362b565b66ba18d9eb681caaaee673639add2602e8e0c2efad6';
const BUTTONS=[[8,'Function table','function-table',22],[9,'Input','input',54],
 [10,'Pair','pair',47],[11,'Table','table',29],[19,'Output','output',63],
 [20,'Function','function',74]] as const;
const NEW_IDS=['function-table','pair'] as const;
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`P019_CANDIDATE_INVALID: ${reason}`);
}

/** One unregistered VB9 projection. Nothing here changes the active index. */
export function algL6P019CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p019LocalDevelopment(),'local physical source environment');
 const base=algL6P018FormalDescriptor(),root=getWorkspaceRoot(),transaction=readRegistryTransaction(root);
 demand(transaction.sha256===REGISTRY_SHA&&registeredLocalOnlyAnimationKeys.length===506&&
  !localOnlyAnimationModuleRegistration(ID)&&!transaction.registry.calibrations.some(
   (row:{entries:{key:string}[]})=>row.entries.some(entry=>entry.key===ID)),
  '506 formal pages; P019 unregistered');
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===29&&
  base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===29&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  base.glossary.length===30&&Object.values(base.productBridge.acceptanceEffects).every(v=>v===false),
  'P018 formal predecessor');
 for(const pin of [SOURCE,SA,XML])readPin(ROOT,pin);
 for(const pin of [DICTIONARY_EN,DICTIONARY_ES])readPin(DICTIONARY_ROOT,pin);
 for(const pin of [FRAMES,CANVAS_XML,RENDERER,MAIN,SA_COPY,TEXT_GENERATOR,NATIVE_STATE,
  NATIVE_COMPONENT])readPin(root,pin);
 const intake=readJsonPin(root,INTAKE),time=readJsonPin(root,TIME),
  crosswalk=readJsonPin(root,CROSSWALK),text=readJsonPin(root,TEXT),canvas=readJsonPin(root,CANVAS),
  audio=readJsonPin(root,AUDIO),audioPlan=readJsonPin(root,AUDIO_PLAN);
 demand(intake.identity.animationId===ID&&intake.identity.globalOrdinal===19&&
  intake.identity.sectionCode==='VB'&&intake.identity.sectionPageOrdinal===9&&
  intake.source.swf.sha256===SOURCE.sha256&&intake.source.samePathFlaExists===false&&
  intake.staticSwf.mainSpriteId===37&&intake.staticSwf.mainSpriteFrames===351&&
  intake.staticSwf.rootEntryFrame===6&&intake.staticSwf.buttonDefinitions===6&&
  intake.staticSwf.textDefinitions===15&&intake.staticSwf.soundStreamBlockCount===350,
  'physical VB9 source structure');
 demand(time.identity.animationId===ID&&time.source.sha256===SOURCE.sha256&&
  time.identity.sourceOccurrence===19&&time.identity.mainDomain==='sprite-37'&&
  time.identity.mainFrameCount===351&&time.identity.rootEntryFrame===6&&
  time.identity.fps===12&&time.textDefinitions.length===15&&time.buttons.length===6&&
  time.frameEvidence.sha256===FRAMES.sha256&&time.limits.originalRuntimeObserved===false&&
  isDeepStrictEqual(time.buttons.map((b:{characterId:number;keyAttribute:string;
   instances:Array<{firstSourceReadyFrame:number}>})=>
    [b.characterId,b.keyAttribute,b.instances.length,b.instances[0]?.firstSourceReadyFrame]),
   BUTTONS.map(([id,key,,frame])=>[id,key,1,frame])),
  'time-resolved six AVM1 controls');
 demand(text.animationId===ID&&text.sourceSwfSha256===SOURCE.sha256&&
  text.frameDomain==='sprite-37'&&text.frameCount===351&&text.fps===12&&
  text.textDefinitions.length===15&&text.textInstances.length===38&&
  text.glossaryControls.length===6&&text.policy.canvasGlyphs==='preserved'&&
  text.policy.language==='source-en-fallback'&&text.policy.originalRuntimeAccepted===false&&
  isDeepStrictEqual(text.glossaryControls.map((c:{key:string;sourceButtonId:number;
   firstCandidateFrame:number})=>[c.sourceButtonId,c.key,c.firstCandidateFrame]),
   [...BUTTONS].sort((a,b)=>a[3]-b[3]).map(([id,key,,frame])=>[id,key,frame]))&&
  text.inputs.some((p:{path:string;sha256:string})=>p.path===TIME.path&&p.sha256===TIME.sha256)&&
  text.inputs.some((p:{path:string;sha256:string})=>p.path===FRAMES.path&&p.sha256===FRAMES.sha256),
  'source-English native reading companion and six instance gates');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE.sha256&&
  canvas.mainFrameCount===351&&canvas.rootFrame===6&&
  canvas.outputs[0].sha256===RENDERER.sha256&&
  canvas.sourceGlyphRendering.definitions===15&&canvas.sourceGlyphRendering.preserved===true&&
  canvas.sourceClipMasks.length===4&&canvas.inputs.some(
   (p:{path:string;sha256:string})=>p.path===CANVAS_XML.path&&p.sha256===CANVAS_XML.sha256)&&
  Object.values(canvas.acceptanceEffects).every(v=>v===false),
  'source-bound Canvas and preserved glyphs');
 demand(audio.source.swf.sha256===SOURCE.sha256&&audio.source.separateSa.sha256===SA.sha256&&
  audio.main.domain==='sprite-37'&&audio.main.blockCount===350&&
  audio.main.firstBlockFrame===2&&audio.main.lastBlockFrame===351&&
  audio.main.extractedMp3.sha256===MAIN.sha256&&audio.separateSa.copy.sha256===SA_COPY.sha256&&
  audio.limits.separateSaExplicitTriggerRequired===true&&
  audio.limits.separateSaSplicedIntoMain===false&&audio.limits.localeChangeStartsSa===false&&
  audioPlan.sourceAudit.sha256===AUDIO.sha256&&audioPlan.mainAssets.length===1&&
  audioPlan.mainAssets[0].sourceSha256===MAIN.sha256&&
  audioPlan.optionalSpanishAudio.sourceSha256===SA.sha256&&
  audioPlan.disposition.separateSaSpliced===false&&audioPlan.disposition.localeStartsAudio===false&&
  audioPlan.disposition.originalRuntimeAccepted===false,
  'one intact main stream and separate explicit SA');
 demand(crosswalk.identity.animationId===ID&&crosswalk.inputs.swf.sha256===SOURCE.sha256&&
  crosswalk.inputs.xml.sha256===CANVAS_XML.sha256&&
  crosswalk.inputs.lesson.sha256===XML.sha256&&
  crosswalk.inputs.en.sha256===DICTIONARY_EN.sha256&&
  crosswalk.inputs.es.sha256===DICTIONARY_ES.sha256&&
  crosswalk.active.registeredLessonPages===29&&crosswalk.active.glossaryEntryCount===30&&
  isDeepStrictEqual(crosswalk.entries.map((e:{buttonCharacterId:number;key:string;
   dictionary:{id:string}})=>[e.buttonCharacterId,e.key,e.dictionary.id]),
   BUTTONS.map(([id,key,entry])=>[id,key,entry]))&&
  isDeepStrictEqual(crosswalk.missingModernKeys,['Function table','Pair'])&&
  crosswalk.originalHostRunObserved===false&&crosswalk.acceptanceChanged===false,
  'six exact source dictionary entries');
 const oldIds=new Set(base.glossary.map(entry=>entry.id));
 demand(oldIds.size===30&&NEW_IDS.every(id=>!oldIds.has(id))&&
  BUTTONS.filter(([,key])=>!['Function table','Pair'].includes(key)).every(([,key,id])=>
   base.glossary.filter(entry=>entry.id===id&&entry.sourceKeyAttribute===key).length===1),
  'preserve four existing dictionary entries');
 const additions:PageOnlyLessonGlossaryEntry[]=NEW_IDS.map(id=>{
  const item=crosswalk.entries.find((e:{dictionary:{id:string}})=>e.dictionary.id===id);
  demand(item&&item.modern.present===false&&item.modern.entryId===null&&
   item.dictionary.sourceKeyAttribute===item.key&&
   item.dictionary.definitions.en.length>0&&item.dictionary.definitions.es.length>0,
   `new exact source dictionary entry ${id}`);
  return Object.freeze({id,sourceKeyAttribute:item.key,
   labels:Object.freeze({...item.dictionary.labels}),
   definitions:Object.freeze({...item.dictionary.definitions}),
   source:Object.freeze({en:Object.freeze({...item.dictionary.source.en}),
    es:Object.freeze({...item.dictionary.source.es})})});
 });
 const glossary=Object.freeze([...base.glossary,...additions]);
 demand(glossary.length===32&&BUTTONS.every(([,key,id])=>
  glossary.filter(entry=>entry.id===id&&entry.sourceKeyAttribute===key).length===1),
  'six retained/new dictionary entries');
 const target=base.pages[18];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===19&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===9&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.source.sourceOccurrence===19&&target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p018'&&
  target.nextPlacementId==='shared-alg001-l06-p020','exact P019 VB9 placement');
 const pages=base.pages.map((page,index)=>index!==18?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-37',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p019-source-readable'}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===30&&
  isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  'one candidate projection only');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p019-candidate-v1`,
  calibrationId:'g678-alg-l06-p019-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p019-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p019-candidate-v1`}),
  glossary,pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:30}),
 });
}
