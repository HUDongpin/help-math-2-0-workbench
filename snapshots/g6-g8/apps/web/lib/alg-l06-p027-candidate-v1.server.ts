import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {algL6P026FormalDescriptor} from './alg-l06-p026-formal-admission-v1.server';
import {P027_CANDIDATE_BINDING} from './alg-l06-p027-candidate-binding-v1';
import {P027_ID as ID,p027LocalDevelopment} from './alg-l06-p027-preview-policy-v1';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonPlayerDescriptor,PageOnlyLessonGlossaryEntry}
 from './whole-lesson-player-descriptor';

const SOURCE_SHA='689318e75aac8740344e8ff119df34a288e7da24dc3dc0c62c0f22601666f984';
const KEYS=['Vertical-line test','Function','Graph','Vertical','Line','Point'];
const ENTRY_IDS=['vertical-line-test','function','graph','vertical','line','point'];
const demand=(ok:unknown,message:string)=>{if(!ok)throw Error('P027_CANDIDATE_INVALID: '+message);};

/** Private renderable projection only. Actual registry membership is unchanged. */
export function algL6P027SourceProjection():PageOnlyLessonPlayerDescriptor{
 demand(p027LocalDevelopment(),'local development/physical source');
 const root=getWorkspaceRoot(),binding=P027_CANDIDATE_BINDING;
 demand(binding.packet&&binding.index&&binding.host&&binding.candidateRegistrySha256&&
  binding.browserMain&&binding.browserSpanish,'frozen packet and real Chrome PCM required');
 const index=readJsonPin(root,binding.index!),packet=readJsonPin(root,binding.packet!);
 readJsonPin(root,binding.host!);
 demand(isDeepStrictEqual(index.host,binding.host)&&
  isDeepStrictEqual(packet.predecessorIndex,binding.index)&&
  isDeepStrictEqual(packet.predecessorHost,binding.host),
  'exact predecessor index and host');
 demand(packet.kind==='alg-l06-p027-candidate-source-binding-v1'&&
  packet.animationId===ID&&Object.values(packet.acceptanceEffects).every(v=>v===false),
  'bound own packet and separate gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const item of packet.external)readPin(item.root,item.pin);
 const base=algL6P026FormalDescriptor(),audit=readJsonPin(root,packet.audit),
  native=readJsonPin(root,packet.native),canvas=readJsonPin(root,packet.canvas),
  audio=readJsonPin(root,packet.audioPlan),crosswalk=readJsonPin(root,packet.crosswalk),
  browser=readJsonPin(root,packet.browserDecode);
 demand(packet.source.sha256===SOURCE_SHA&&audit.identity.animationId===ID&&
  audit.identity.globalActiveOrdinal===27&&audit.identity.sectionPageOrdinal===17&&
  audit.source.swf.sha256===SOURCE_SHA&&audit.source.samePathFlaExists===false&&
  isDeepStrictEqual(audit.frameDomains.map((d:{id:string;frames:number})=>[d.id,d.frames]),
   [['root',10],['sprite-46',770]])&&audit.glossary.length===6,
  'source page, frame domain and six glossary actions');
 demand(native.animationId===ID&&native.sourceSwfSha256===SOURCE_SHA&&
  native.frameDomain==='sprite-46'&&native.mainFrameCount===770&&
  native.rootFrameCount===10&&native.definitions.length===17&&
  native.canvasSourceGlyphsPreserved===true,
  'own source-native text');
 demand(canvas.animationId===ID&&canvas.rootFrame===6&&canvas.mainFrameCount===770&&
  canvas.sourceGlyphRendering.default==='preserve-all'&&
  canvas.sourceGlyphRendering.suppressTextIdsSupported===false&&
  audio.main.blockCount===769&&audio.main.firstBlockFrame===2&&
  audio.main.lastBlockFrame===770&&audio.main.browserBinding===null&&
  audio.optionalSpanishAudio.localeAutoplay===false&&
  audio.optionalSpanishAudio.joinedWithMain===false,
  'drawing and source audio ownership');
 const browserRows=browser.results;
 const expectedHashes=[audio.main.asset.sha256,audio.optionalSpanishAudio.asset.sha256];
 demand(Array.isArray(browserRows)&&browserRows.length===2&&
  expectedHashes.every(hash=>browserRows.filter((row:{sourceSha256:string})=>
   row.sourceSha256===hash).length===1),
  'exact two real browser audio sources');
 const bindings=expectedHashes.map(hash=>{
  const row=browserRows.find((item:{sourceSha256:string})=>item.sourceSha256===hash);
  return {sourceSha256:row.sourceSha256,sourceBytes:row.sourceBytes,
   sampleRate:row.sampleRate,channels:row.channels,decodedSamples:row.samples,
   pcmSha256:row.pcmSha256};
 });
 demand(isDeepStrictEqual(bindings,[binding.browserMain,binding.browserSpanish])&&
  binding.browserMain!.sourceBytes===audio.main.asset.bytes&&
  binding.browserMain!.sampleRate===audio.main.sourceSampleRate&&
  binding.browserSpanish!.sourceBytes===audio.optionalSpanishAudio.asset.bytes&&
  binding.browserSpanish!.sampleRate===audio.optionalSpanishAudio.sourceSampleRate,
  'real browser decode pins equal runtime bindings');
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===37&&
  base.glossary.length===40,'exact registered P026 predecessor');
 const keys=audit.glossary.map((g:{keyAttribute:string})=>g.keyAttribute);
 demand(isDeepStrictEqual(keys,KEYS),'six exact source glossary actions');
 const glossary=[...base.glossary],newlyAdded:string[]=[];
 for(let i=0;i<KEYS.length;i++){
  const key=KEYS[i],dictionary=crosswalk.entries.filter((e:PageOnlyLessonGlossaryEntry)=>
   e.sourceKeyAttribute===key);
  demand(dictionary.length===1&&dictionary[0].id===ENTRY_IDS[i]&&
   dictionary[0].dictionaryKeyAttribute===(i===0?'vertical-line test':key)&&
   dictionary[0].caseBinding===(i===0?
    'unique-case-insensitive-source-dictionary-match':'exact'),
   'one source-cased bilingual dictionary entry '+key);
  const d=dictionary[0],modern=glossary.filter(e=>e.sourceKeyAttribute===key);
  demand(modern.length<=1,'unambiguous host key '+key);
  if(modern.length)
   demand(isDeepStrictEqual(modern[0].labels,d.labels)&&
    isDeepStrictEqual(modern[0].definitions,d.definitions),
    'exact existing bilingual dictionary '+key);
  else{
   newlyAdded.push(key);
   glossary.push(Object.freeze({id:d.id,sourceKeyAttribute:key,
    labels:Object.freeze({...d.labels}),definitions:Object.freeze({...d.definitions}),
    source:Object.freeze({...d.source})}) as PageOnlyLessonGlossaryEntry);
  }
 }
 demand(glossary.length===44&&isDeepStrictEqual(newlyAdded,['Vertical-line test','Vertical','Line','Point']),
  'four new glossary terms with unchanged predecessors');
 const target=base.pages[26];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===27&&
  target.sectionCode==='VB'&&target.sectionPageOrdinal===17&&
  target.source.assetId===`swf-${SOURCE_SHA}`&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p026'&&
  target.nextPlacementId==='shared-alg001-l06-p028',
  'exact source-ordered VB17 target');
 const pages=base.pages.map((page,i)=>i!==26?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-46',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p027-source-readable'})}));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===38&&isDeepStrictEqual(selected.filter(id=>id!==ID),
  base.productBridge.selectedAnimationIds),
  'one candidate; all other placements preserved');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p027-candidate-v1`,
  calibrationId:'g678-alg-l06-p027-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p027-candidate-v1`,
  course:Object.freeze({...base.course,
   href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,
   storageKey:`${base.persistence.storageKey}:p027-candidate-v1`}),
  glossary:Object.freeze(glossary),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:38})});
}

/** Candidate membership check is separate from the source-bound projection so
 * the later registered proof can reuse the same unchanged page/glossary delta. */
export function algL6P027CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p027LocalDevelopment(),'local development/physical source');
 const tx=readRegistryTransaction(getWorkspaceRoot()),binding=P027_CANDIDATE_BINDING;
 demand(tx.sha256===binding.candidateRegistrySha256&&
  !localOnlyAnimationModuleRegistration(ID),
  'exact candidate registry and unregistered P027');
 return algL6P027SourceProjection();
}
