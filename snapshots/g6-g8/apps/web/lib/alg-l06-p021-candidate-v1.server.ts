import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P020FormalDescriptor} from './alg-l06-p020-formal-admission-v1.server';
import {P021_ID as ID,P021_SOURCE_ROOT as ROOT,p021LocalDevelopment}
 from './alg-l06-p021-preview-policy-v1';
import {P021_RESOURCE_PINS} from './alg-l06-p021-local-request-v1';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

const DICTIONARY_ROOT='/Volumes/WestWorld/HELP MATH Related Files';
const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB14.swf',bytes:131483,
 sha256:'4e87aacf4c5f749f559817dc2c0ec8b023fba75652217b9ce2543728e06eb5eb'};
const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB14.mp3',bytes:355152,
 sha256:'74d2579aeb963ca841d501a80e9830c05ae23153a87daa6e0a277c105f31f5d9'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const DICTIONARY_EN={path:'HELP_OnlineKeyTerms_XML/MI/L1KTE01.xml',bytes:345838,
 sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'};
const DICTIONARY_ES={path:'HELP_OnlineKeyTerms_XML/MI/L1KTS01.xml',bytes:344456,
 sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'};
const INTAKE={path:'output/alg-l06-p021-intake-recon-v1/intake-recon-v1.json',bytes:7657,
 sha256:'6a2fb17bfddbc90f5457306f1b9dbaed81973df9642724907a95da21bb4e5b9f'};
const TIME={path:'output/alg-l06-p021-source-audit-v1/time-resolved-audit-v1.json',bytes:227182,
 sha256:'e171781cdd59278fec34388b7ba8de6ed4594d6d73afb9d9a524a172c1a99c02'};
const FRAMES={path:'output/alg-l06-p021-source-audit-v1/frame-states-v1.json',bytes:10224999,
 sha256:'b4f71c01e9744f7ba33a7efc0fded9ffd36557c1bde54df8f694be1f8dba9d23'};
const TEXT={path:'migrations/shared-alg001-l06-p021/audit/text-state-v1/text-state-source-v1.json',bytes:64921,
 sha256:'7650798fea1996d478b0f3de8fae2c411e31fd7f10975de16f0ecb6c426d3af1'};
const TEXT_GENERATOR={path:'scripts/build-alg-l06-p021-text-state-v1.mjs',bytes:17245,
 sha256:'419807fdec9eb2e8a78ba850cc058d2ae02083d94c646e72335320ac22468cbd'};
const NATIVE_STATE={path:'packages/demos/src/generated/alg-l06-p021-text-state-v1.ts',bytes:68495,
 sha256:'5bda3fd8b5d9bde4e8988a581a65fe7336347771243155d0ad4bf6e1d79e11b5'};
const NATIVE_COMPONENT={path:'packages/demos/src/alg-l06-p021-native-text-v1.tsx',bytes:5113,
 sha256:'6be6c8ddd33c1227996b15be725c5775fddb61154cde3eec87e325dc67c38ca9'};
const CROSSWALK={path:'output/alg-l06-p021-glossary-audit-v1/six-term-crosswalk-v1.json',bytes:11627,
 sha256:'56354e286fe68ef3b2cc89860b76c02d801499194b25377cbd6180d022b541dc'};
const CANVAS={path:'output/alg-l06-p021-canvas-v1/canvas-manifest.json',bytes:6797,
 sha256:'87c189f6c1ccf771e0fce7cc48ac9595f9082f29a5596ebf6ca293faa232a8d3'};
const CANVAS_XML={path:'output/alg-l06-p021-canvas-v1/source.xml',bytes:444747,
 sha256:'8ccf06526db514f8a8e2c3ea769c515b6dfa4e48ce0385a143ee1121c97962b9'};
const AUDIO={path:'output/alg-l06-p021-audio-v1/audio-source-audit-v1.json',bytes:108449,
 sha256:'45451fc0ec1d872beb2e7fad908a75fecc98a225eb4b237c0abf8ab3ee2312f0'};
const AUDIO_PLAN={path:'output/alg-l06-p021-audio-v1/audio-plan-v1.json',bytes:2435,
 sha256:'428809f919183e9f4044fa2583450e94d33b4d7210ae59084a1e4ea3f5630e44'};
const REGISTRY_SHA='c8f7f646a717c2e3cbc8b1c527995bf200d3c5709947b8d6e05ae69ec1c9c128';
const BUTTONS=[[8,'Set','set',12],[9,'Input','input',69],
 [10,'Ordered pair','ordered-pair',62],[11,'Function','function',20],
 [12,'Value','value',25],[22,'Output','output',77]] as const;
const READY_BUTTONS=[...BUTTONS].sort((a,b)=>a[3]-b[3]);
const NEW_IDS=['set','ordered-pair'] as const;
const OWN_TOKENS=['canvas-renderer.js','main-1','optional-spanish-audio-v1'] as const;
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`P021_CANDIDATE_INVALID: ${reason}`);
}

/** Source-locked VB11 projection; active registration and prior proof bytes stay unchanged. */
export function algL6P021CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p021LocalDevelopment(),'local physical source environment');
 const base=algL6P020FormalDescriptor(),root=getWorkspaceRoot();
 const transaction=readRegistryTransaction(root);
 demand(transaction.sha256===REGISTRY_SHA&&registeredLocalOnlyAnimationKeys.length===508&&
  !localOnlyAnimationModuleRegistration(ID)&&
  !transaction.registry.calibrations.some((row:{entries:{key:string}[]})=>
   row.entries.some(entry=>entry.key===ID)),
  '508 formal pages; P021 unregistered');
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===31&&
  base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===31&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  base.glossary.length===32&&Object.values(base.productBridge.acceptanceEffects).every(v=>v===false),
  'P020 formal predecessor');
 for(const pin of [SOURCE,SA,XML])readPin(ROOT,pin);
 for(const pin of [DICTIONARY_EN,DICTIONARY_ES])readPin(DICTIONARY_ROOT,pin);
 for(const pin of [FRAMES,CANVAS_XML,TEXT_GENERATOR,NATIVE_STATE,NATIVE_COMPONENT])readPin(root,pin);
 demand(Object.keys(P021_RESOURCE_PINS).length===76,'exact 3 own plus 73 inherited resource bindings');
 for(const token of OWN_TOKENS){
  const row=P021_RESOURCE_PINS[token];
  demand(row?.root==='workspace','own asset root');
  readPin(root,{path:row.path,bytes:row.bytes,sha256:row.sha256});
 }
 const intake=readJsonPin(root,INTAKE),time=readJsonPin(root,TIME),text=readJsonPin(root,TEXT),
  crosswalk=readJsonPin(root,CROSSWALK),canvas=readJsonPin(root,CANVAS),
  audio=readJsonPin(root,AUDIO),audioPlan=readJsonPin(root,AUDIO_PLAN);
 demand(intake.identity.animationId===ID&&intake.identity.globalOrdinal===21&&
  intake.identity.xmlOccurrence===21&&intake.identity.sectionCode==='VB'&&
  intake.identity.sectionPageOrdinal===11&&intake.source.swf.sha256===SOURCE.sha256&&
  intake.source.swf.bytes===SOURCE.bytes&&intake.source.samePathFlaExists===false&&
  intake.source.authoringEvidence==='swf-only'&&
  intake.sourceStructure.mainDomain.id==='sprite-43'&&
  intake.sourceStructure.mainDomain.frames===377&&
  intake.sourceStructure.mainDomain.rootPlacementFrame===6&&
  intake.sourceStructure.text.textDefinitions===21&&
  intake.sourceStructure.text.buttonDefinitions===6&&
  intake.sourceStructure.embeddedAudio[0].blocks===371,
  'physical VB11 source identity and structure');
 demand(time.identity.animationId===ID&&time.source.sha256===SOURCE.sha256&&
  time.identity.sourceOccurrence===21&&time.identity.mainDomain==='sprite-43'&&
  time.identity.mainFrameCount===377&&time.identity.rootEntryFrame===6&&
  time.identity.fps===12&&time.textDefinitions.length===21&&time.buttons.length===6&&
  time.frameEvidence.sha256===FRAMES.sha256&&time.limits.originalRuntimeObserved===false&&
  isDeepStrictEqual(time.buttons.map((button:{characterId:number;keyAttribute:string;
   instances:Array<{firstSourceReadyFrame:number}>})=>
   [button.characterId,button.keyAttribute,button.instances.length,
    button.instances[0]?.firstSourceReadyFrame]),
   BUTTONS.map(([id,key,,frame])=>[id,key,1,frame])),
  'time-resolved six per-instance blue-ink and full-hit gates');
 demand(text.animationId===ID&&text.sourceSwfSha256===SOURCE.sha256&&
  text.frameDomain==='sprite-43'&&text.frameCount===377&&text.fps===12&&
  text.textDefinitions.length===21&&text.textInstances.length===70&&
  text.glossaryControls.length===6&&text.policy.canvasGlyphs==='preserved'&&
  text.policy.language==='source-en-fallback'&&text.policy.originalRuntimeAccepted===false&&
  isDeepStrictEqual(text.glossaryControls.map((control:{sourceButtonId:number;key:string;
   firstCandidateFrame:number})=>[control.sourceButtonId,control.key,control.firstCandidateFrame]),
   READY_BUTTONS.map(([id,key,,frame])=>[id,key,frame]))&&
  isDeepStrictEqual(text.tableRows.map((row:{inputText:string;outputText:string;
   firstCompletePairFrame:number})=>[row.inputText,row.outputText,row.firstCompletePairFrame]),
   [['2','3',204],['3','5',204],['5','-2',204],['7','1',204]])&&
  isDeepStrictEqual(text.orderedPairs.map((pair:{inputText:string;outputText:string;
   firstAllInkFrame:number;firstCompletePairFrame:number})=>
   [pair.inputText,pair.outputText,pair.firstAllInkFrame,pair.firstCompletePairFrame]),
   [['2','3',343,346],['3','5',353,356],['5','-2',363,366],['7','1',373,376]])&&
  text.inputs.some((pin:{path:string;sha256:string})=>pin.path===TIME.path&&pin.sha256===TIME.sha256)&&
  text.inputs.some((pin:{path:string;sha256:string})=>pin.path===FRAMES.path&&pin.sha256===FRAMES.sha256),
  'source-English native companion, table and moving ordered pairs');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE.sha256&&
  canvas.mainFrameCount===377&&canvas.rootFrame===6&&
  canvas.outputs[0].sha256===P021_RESOURCE_PINS['canvas-renderer.js'].sha256&&
  canvas.sourceGlyphRendering.definitions===21&&
  canvas.sourceGlyphRendering.preserved===true&&
  canvas.sourceGlyphRendering.suppression==='none'&&
  canvas.sourceClipMasks.length===2&&canvas.inputs.some(
   (pin:{path:string;sha256:string})=>pin.path===CANVAS_XML.path&&pin.sha256===CANVAS_XML.sha256)&&
  Object.values(canvas.acceptanceEffects).every(v=>v===false),
  'source-bound Canvas preserves all 21 glyph definitions');
 demand(audio.source.swf.sha256===SOURCE.sha256&&audio.source.separateSa.sha256===SA.sha256&&
  audio.main.domain==='sprite-43'&&audio.main.blockCount===371&&
  audio.main.firstBlockFrame===7&&audio.main.lastBlockFrame===377&&
  audio.main.negativeSeekBlocks.length===0&&
  audio.main.extractedMp3.sha256===P021_RESOURCE_PINS['main-1'].sha256&&
  audio.separateSa.copy.sha256===P021_RESOURCE_PINS['optional-spanish-audio-v1'].sha256&&
  audioPlan.sourceAudit.sha256===AUDIO.sha256&&audioPlan.mainAssets.length===1&&
  audioPlan.mainAssets[0].sourceSha256===P021_RESOURCE_PINS['main-1'].sha256&&
  audioPlan.optionalSpanishAudio.sourceSha256===SA.sha256&&
  audioPlan.disposition.separateSaSpliced===false&&
  audioPlan.disposition.localeStartsAudio===false&&
  audioPlan.disposition.originalRuntimeAccepted===false,
  'one intact main stream and separate explicit SA');
 demand(crosswalk.identity.animationId===ID&&crosswalk.inputs.swf.sha256===SOURCE.sha256&&
  crosswalk.inputs.xml.sha256===CANVAS_XML.sha256&&
  crosswalk.inputs.lesson.sha256===XML.sha256&&
  crosswalk.inputs.en.sha256===DICTIONARY_EN.sha256&&
  crosswalk.inputs.es.sha256===DICTIONARY_ES.sha256&&
  crosswalk.active.registeredLessonPages===31&&crosswalk.active.glossaryEntryCount===32&&
  isDeepStrictEqual(crosswalk.entries.map((entry:{buttonCharacterId:number;key:string;
   dictionary:{id:string}})=>[entry.buttonCharacterId,entry.key,entry.dictionary.id]),
   BUTTONS.map(([id,key,entry])=>[id,key,entry]))&&
  isDeepStrictEqual(crosswalk.missingModernKeys,['Set','Ordered pair'])&&
  crosswalk.originalHostRunObserved===false&&crosswalk.acceptanceChanged===false,
  'six exact source dictionary entries');
 const oldIds=new Set(base.glossary.map(entry=>entry.id));
 demand(oldIds.size===32&&NEW_IDS.every(id=>!oldIds.has(id))&&
  BUTTONS.filter(([,key])=>!['Set','Ordered pair'].includes(key)).every(([,key,id])=>
   base.glossary.filter(entry=>entry.id===id&&entry.sourceKeyAttribute===key).length===1),
  'preserve four existing dictionary entries');
 const additions:PageOnlyLessonGlossaryEntry[]=NEW_IDS.map(id=>{
  const entry=crosswalk.entries.find((row:{dictionary:{id:string}})=>row.dictionary.id===id);
  demand(entry&&entry.modern.present===false&&entry.modern.entryId===null&&
   entry.dictionary.sourceKeyAttribute===entry.key&&
   entry.dictionary.definitions.en.length>0&&entry.dictionary.definitions.es.length>0,
   `new exact dictionary entry ${id}`);
  return Object.freeze({id,sourceKeyAttribute:entry.key,
   labels:Object.freeze({...entry.dictionary.labels}),
   definitions:Object.freeze({...entry.dictionary.definitions}),
   source:Object.freeze({en:Object.freeze({...entry.dictionary.source.en}),
    es:Object.freeze({...entry.dictionary.source.es})})});
 });
 const glossary=Object.freeze([...base.glossary,...additions]);
 demand(glossary.length===34&&BUTTONS.every(([,key,id])=>
  glossary.filter(entry=>entry.id===id&&entry.sourceKeyAttribute===key).length===1),
  'six retained/new exact dictionary entries');
 const target=base.pages[20];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.globalPageOrdinal===21&&target.sectionCode==='VB'&&
  target.sectionPageOrdinal===11&&target.source.assetId===`swf-${SOURCE.sha256}`&&
  target.source.sourceOccurrence===21&&target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p020'&&
  target.nextPlacementId==='shared-alg001-l06-p022',
  'exact P021 VB11 source-order placement');
 const pages=base.pages.map((page,index)=>index!==20?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-43',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p021-source-readable'}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===32&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),'one candidate projection only');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p021-candidate-v1`,
  calibrationId:'g678-alg-l06-p021-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p021-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p021-candidate-v1`}),
  glossary,pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:32}),
 });
}
