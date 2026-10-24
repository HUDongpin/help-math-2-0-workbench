import {isDeepStrictEqual} from 'node:util';
import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor,
  WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L06_P004_ADMISSION_ID='shared-alg001-l06-p004';
export const ALG_L06_P004_ADMISSION_CALIBRATION='g678-alg-l06-p004-current-js-20260928-v1';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_PATH='G6-G8-shared/ALG001/L6/RW/L6RW04.swf';
const SOURCE_SHA='514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e';
const XML_PATH='G6-G8-shared/ALG001/L6/index.xml';
const XML_SHA='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const CANVAS_PATH='work/g678-shared-page-factory/g678-alg-l06-p004-current-js-20260928-v1/members/shared-alg001-l06-p004/canvas-renderer.js';
const CANVAS_SHA='6b6f124262c8b90517151ea77eee43a30843c170211d4cd76404e584c876c2d8';
const FREEZE_PATH=`catalog/product-bridge-calibrations/${ALG_L06_P004_ADMISSION_CALIBRATION}.json`;
const FORMAL_PATH=`/migration-status/g678-calibration/${ALG_L06_P004_ADMISSION_ID}/continuous-v1`;
const PREDECESSOR_ORDINALS=Object.freeze([1,2,3,5,6,7,9,11,12,30,36,37,39,40,51,52,53,54,55,59]);
const GLOSSARY_KEYS=Object.freeze(['Input','Output','Function','Relation','Value','Rule','output']);
const GLOSSARY_IDS=Object.freeze(['input','output','function','relation','value','rule','output']);
const OCCURRENCES=Object.freeze(['57@106','85@99','59@110','79@85','79@95',
  '80@87','81@89','84@97','86@101']);
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;
type SelectedPage=Readonly<{
  animationId:string;placementId:string;sourceSha256:string;globalPageOrdinal:number;
  sourceOccurrence:number;sectionCode:string;sectionPageOrdinal:number;
  runtime:Readonly<{frameDomain:string;frameCount:number;rootFrameCount:number;
    rootBeginFrame:number;fps:number;stage:Readonly<{width:number;height:number}>;
    scenario:string;seed:string;canvasRenderer:Pin;hostPlaybackCompletion:false}>;
}>;

/** The server reader must verify these physical pins, proof and registry
 * transaction before calling this pure descriptor projection. */
export interface AlgL06P004DescriptorInput {
  readonly packet:Readonly<{
    calibrationId:string;deploymentScope:'local-only';sourceRoot:string;
    sourceXml:Pin;source:Pin;freezeManifest:Pin;selectedPages:readonly SelectedPage[];
    entry:Readonly<{key:string;module:string;maturity:'private-current-js';
      artifacts:Readonly<{module:Pin;timeline:Pin;runtime:Pin}>}>;
    acceptanceEffects:PageOnlyLessonPlayerDescriptor['productBridge']['acceptanceEffects'];
    productCalibrationPassed:false;scaleOutAuthorized:false;
  }>;
  readonly registration:Readonly<{
    calibrationId:string;deploymentScope:'local-only';maturity:'private-current-js';
    freezeManifestSha256:string;moduleSha256:string;timelineSha256:string;runtimeSha256:string;
  }>;
  /** Exact source glossary audit, already read from its pinned physical file. */
  readonly glossary:Readonly<{
    kind:string;animationId:string;sourceSwf:Pin;
    entries:readonly (PageOnlyLessonGlossaryEntry & Readonly<{
      canonicalDictionaryKey:string;occurrenceIds:readonly string[];buttonIds:readonly number[];
    }>)[];
  }>;
}

function demand(ok:unknown,reason:string):asserts ok{
  if(!ok)throw Error(`ALG_L06_P004_DESCRIPTOR_INVALID: ${reason}`);
}
function validPin(pin:Pin|undefined):boolean{
  return Boolean(pin&&typeof pin.path==='string'&&Number.isSafeInteger(pin.bytes)&&pin.bytes>0&&
    /^[a-f0-9]{64}$/u.test(pin.sha256));
}
const pageId=(ordinal:number)=>`shared-alg001-l06-p${String(ordinal).padStart(3,'0')}`;
const projectGlossary=(entry:AlgL06P004DescriptorInput['glossary']['entries'][number])=>({
  id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,
  definitions:entry.definitions,source:entry.source,
});

/** Add only source-ordered RW3. Original-runtime, audio, human, owner and
 * publication decisions remain exactly as they were in the P003 base. */
export function extendAlgL6P004Descriptor(base:PageOnlyLessonPlayerDescriptor,
  input:AlgL06P004DescriptorInput):PageOnlyLessonPlayerDescriptor{
  const {packet,registration,glossary}=input;
  demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
    base.course.activePageCount===60&&base.course.expectedReleaseMemberCount===60&&
    base.course.courseShellCount===0&&base.pages.length===60&&
    base.productBridge.pageOnlyDescriptorMemberCount===60&&
    base.productBridge.registeredAnimationCount===20,'20/60 P003 predecessor');
  demand(base.source.sequenceAuthority==='course-xml-occurrence'&&
    base.source.sourceXmlPath===XML_PATH&&base.source.sourceXmlSha256===XML_SHA,
  'source-ordered lesson XML');
  const registeredBefore=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
    .map(page=>page.animationId);
  demand(isDeepStrictEqual(registeredBefore,PREDECESSOR_ORDINALS.map(pageId))&&
    isDeepStrictEqual(registeredBefore,base.productBridge.selectedAnimationIds),
  'exact predecessor registration membership');
  for(const [index,page] of base.pages.entries()){
    const id=pageId(index+1),previous=index?pageId(index):null;
    const next=index<59?pageId(index+2):null;
    demand(page.animationId===id&&page.placementId===id&&
      page.globalPageOrdinal===index+1&&page.source.sourceOccurrence===index+1&&
      page.previousPlacementId===previous&&page.previousAnimationId===previous&&
      page.nextPlacementId===next&&page.nextAnimationId===next,
    'all 60 exact source-order links');
  }
  const target=base.pages[3];
  demand(target.rendererAvailability.kind==='unavailable'&&target.sectionCode==='RW'&&
    target.sectionPageOrdinal===3&&target.source.assetId===`swf-${SOURCE_SHA}`&&
    target.previousPlacementId===pageId(3)&&target.nextPlacementId===pageId(5),
  'P004 RW3 source placement and neighbors');
  demand(packet.calibrationId===ALG_L06_P004_ADMISSION_CALIBRATION&&
    packet.deploymentScope==='local-only'&&packet.sourceRoot===SOURCE_ROOT&&
    packet.sourceXml.path===XML_PATH&&packet.sourceXml.bytes===13926&&
    packet.sourceXml.sha256===XML_SHA&&packet.source.path===SOURCE_PATH&&
    packet.source.bytes===1115626&&packet.source.sha256===SOURCE_SHA&&
    validPin(packet.freezeManifest)&&packet.freezeManifest.path===FREEZE_PATH,
  'exact source and freeze identity');
  demand(packet.selectedPages.length===1,'exactly one selected page');
  const selected=packet.selectedPages[0],runtime=selected.runtime,artifacts=packet.entry.artifacts;
  demand(selected.animationId===ALG_L06_P004_ADMISSION_ID&&
    selected.placementId===ALG_L06_P004_ADMISSION_ID&&selected.sourceSha256===SOURCE_SHA&&
    selected.globalPageOrdinal===4&&selected.sourceOccurrence===4&&
    selected.sectionCode==='RW'&&selected.sectionPageOrdinal===3,
  'exact selected RW3 identity');
  demand(runtime.frameDomain==='sprite-95'&&runtime.frameCount===831&&
    runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.fps===12&&
    runtime.stage.width===800&&runtime.stage.height===600&&
    runtime.scenario==='source-static-frame'&&runtime.seed==='0'&&
    runtime.hostPlaybackCompletion===false,
  'source frame domain and unresolved completion');
  demand(packet.entry.key===ALG_L06_P004_ADMISSION_ID&&
    packet.entry.module===`./modules/${ALG_L06_P004_ADMISSION_ID}`&&
    packet.entry.maturity==='private-current-js'&&
    validPin(artifacts.module)&&artifacts.module.path===
      `packages/demos/src/modules/${ALG_L06_P004_ADMISSION_ID}.tsx`&&
    validPin(artifacts.timeline)&&artifacts.timeline.path===
      `packages/demos/src/timelines/${ALG_L06_P004_ADMISSION_ID}.ts`&&
    validPin(artifacts.runtime)&&artifacts.runtime.path===CANVAS_PATH&&
    artifacts.runtime.bytes===7342336&&artifacts.runtime.sha256===CANVAS_SHA&&
    isDeepStrictEqual(runtime.canvasRenderer,artifacts.runtime),
  'canonical module, timeline and Canvas runtime pins');
  demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false&&
    isDeepStrictEqual(Object.keys(packet.acceptanceEffects).sort(),
      ['authoritativeOriginalRuntime','fidelityAccepted','audioAccepted','humanVisualAccepted',
       'ownerAccepted','strictComplete','published'].sort())&&
    Object.values(packet.acceptanceEffects).every(value=>value===false)&&
    Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'independent acceptance stays closed');
  demand(registration.calibrationId===packet.calibrationId&&
    registration.deploymentScope==='local-only'&&registration.maturity==='private-current-js'&&
    registration.freezeManifestSha256===packet.freezeManifest.sha256&&
    registration.moduleSha256===artifacts.module.sha256&&
    registration.timelineSha256===artifacts.timeline.sha256&&
    registration.runtimeSha256===artifacts.runtime.sha256,
  'verified registration metadata equals frozen packet');

  demand(glossary.kind==='alg-l06-p004-source-glossary-v1'&&
    glossary.animationId===ALG_L06_P004_ADMISSION_ID&&
    glossary.sourceSwf.path===`${SOURCE_ROOT}/${SOURCE_PATH}`&&
    glossary.sourceSwf.bytes===packet.source.bytes&&
    glossary.sourceSwf.sha256===packet.source.sha256&&glossary.entries.length===7&&
    isDeepStrictEqual(glossary.entries.map(entry=>entry.id),GLOSSARY_IDS)&&
    isDeepStrictEqual(glossary.entries.map(entry=>entry.sourceKeyAttribute),GLOSSARY_KEYS),
  'seven exact authored glossary keys including lowercase output');
  demand(isDeepStrictEqual(glossary.entries.flatMap(entry=>entry.occurrenceIds),OCCURRENCES)&&
    glossary.entries.every(entry=>entry.buttonIds.length>0&&
      Object.values(entry.labels).every(text=>typeof text==='string'&&text.length>0)&&
      Object.values(entry.definitions).every(text=>typeof text==='string'&&text.length>0)&&
      entry.source.en.assetId==='G678L1KTE01.xml'&&
      entry.source.en.path==='HELP_KEYTERMS/KT/XML/L1KTE01.xml'&&
      entry.source.en.sha256==='14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'&&
      entry.source.es.assetId==='G678L1KTS01.xml'&&
      entry.source.es.path==='HELP_KEYTERMS/KT/XML/L1KTS01.xml'&&
      entry.source.es.sha256==='3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'),
  'nine occurrences and exact conditional bilingual bank rows');
  demand(glossary.entries.slice(0,6).every(entry=>entry.canonicalDictionaryKey===
      entry.sourceKeyAttribute)&&glossary.entries[6].canonicalDictionaryKey==='Output'&&
    glossary.entries[6].sourceKeyAttribute==='output'&&
    isDeepStrictEqual(glossary.entries[6].labels,glossary.entries[1].labels)&&
    isDeepStrictEqual(glossary.entries[6].definitions,glossary.entries[1].definitions)&&
    isDeepStrictEqual(glossary.entries[6].source,glossary.entries[1].source),
  'explicit lowercase output mapping, never generic case folding');
  const sourceFunction=projectGlossary(glossary.entries[2]);
  const oldFunction=base.glossary.filter(entry=>entry.id==='function');
  demand(oldFunction.length===1&&isDeepStrictEqual(oldFunction[0],sourceFunction),
  'existing Function term must match exactly');
  const additions=glossary.entries.filter(entry=>entry.id!=='function'&&
    entry.sourceKeyAttribute!=='output').map(projectGlossary);
  demand(additions.length===5&&additions.every(entry=>
    !base.glossary.some(old=>old.id===entry.id))&&
    new Set(additions.map(entry=>entry.id)).size===5,
  'five new canonical terms without duplicate Output');

  const pages=base.pages.map((page,index):WholeLessonPlayerPage=>index!==3?page:Object.freeze({
    ...page,rendererAvailability:Object.freeze({kind:'registered' as const,
      moduleKey:ALG_L06_P004_ADMISSION_ID,
      runtimeQuery:Object.freeze({frameDomain:'sprite-95',language:'fixed-en' as const,
        scenario:'source-static-frame',seed:'0'})}),
    runtimeEvidenceBoundary:Object.freeze({
      runtimeKind:'source-static-current-js-candidate' as const,
      actionScriptExecution:'not-executed' as const,
      naturalTraceValidation:'not-established' as const,
      audioAcceptance:'not-established' as const,
      replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
      productVisualBehaviorComposite:'not-established' as const,
    }),
    presentation:Object.freeze({...page.presentation,
      pageInteractionCompanionTargetIdSuffix:'p004-source-readable'}),
  }));
  const registeredAfter=pages.filter(page=>page.rendererAvailability.kind==='registered')
    .map(page=>page.animationId);
  demand(registeredAfter.length===21&&registeredAfter[3]===ALG_L06_P004_ADMISSION_ID&&
    isDeepStrictEqual(registeredAfter.filter(id=>id!==ALG_L06_P004_ADMISSION_ID),
      registeredBefore),'one exact registered-page delta');
  return Object.freeze({...base,
    descriptorId:`${base.descriptorId}:${ALG_L06_P004_ADMISSION_CALIBRATION}`,
    calibrationId:ALG_L06_P004_ADMISSION_CALIBRATION,
    releaseId:ALG_L06_P004_ADMISSION_CALIBRATION,
    course:Object.freeze({...base.course,href:FORMAL_PATH}),
    source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,
      candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
    persistence:Object.freeze({...base.persistence,
      storageKey:`${base.persistence.storageKey}:${ALG_L06_P004_ADMISSION_CALIBRATION}`}),
    pages:Object.freeze(pages),glossary:Object.freeze([...base.glossary,...additions]),
    productBridge:Object.freeze({...base.productBridge,
      selectedAnimationIds:Object.freeze(registeredAfter),registeredAnimationCount:21}),
  });
}
