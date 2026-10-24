/** Source-bound P024 semantic reader. This does not register a page or execute AVM1. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p024';
export const CALIBRATION='g678-alg-l06-p024-current-js-20260930-v2';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v2.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB17.swf',bytes:462836,
 sha256:'e36c6c293f1e620f82fa84d57a1b91fd0a977d24d365772126f87333ce359d05'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB17.mp3',bytes:166320,
 sha256:'dd7f04214d8bfcdaf9ae98b99e542aa7f72f70accd1703381990ff4f43f57f0e'};
export const BINDING={path:'output/alg-l06-p024-host-prep-v5/candidate-source-binding-v1.json',
 bytes:41881,sha256:'a138c675328dd5a232e667843d2f382601e78d751dc99767168a5d537d336593'};
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/alg-l06-p024-maintained-canvas-v2-20260930-v1/members/${ID}/canvas-renderer.js`});
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,
 fidelityAccepted:false,audioAccepted:false,listeningAccepted:false,
 humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const equal=(actual,expected,label)=>assert.deepEqual(actual,expected,label);
const core=item=>({path:item.path,bytes:item.bytes,sha256:item.sha256});
const local=(root,relative)=>pinFile(root,relative);
const FEEDBACK=Object.freeze([
 {id:69,kind:'wrong',variant:1,frames:31,stop:22,close:23,end:31,button:61},
 {id:83,kind:'wrong',variant:2,frames:29,stop:23,close:24,end:29,button:78},
 {id:97,kind:'wrong',variant:3,frames:28,stop:20,close:21,end:28,button:92},
 {id:123,kind:'right',variant:3,frames:31,stop:null,close:null,end:31,button:null},
 {id:155,kind:'right',variant:1,frames:25,stop:null,close:null,end:25,button:null},
 {id:188,kind:'right',variant:4,frames:27,stop:null,close:null,end:27,button:null},
 {id:196,kind:'right',variant:2,frames:27,stop:null,close:null,end:27,button:null},
]);
const KEYS=Object.freeze(['Range','Function','Output','Set','Function table']);
const GATES=Object.freeze([
 ['Range','Range',7],['Function','Function',7],['Output','Output',7],
 ['Set','Set',7],['Function table','Function table',80],
 ['Function','Function in table paragraph',109],['Range','Range in question',134],
]);
const MASKS=Object.freeze([['sprite-123',98,2,1,7],
 ['sprite-208',35,67,11,18],['sprite-208',35,124,19,24]]);
const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);

export function proposedP024Artifacts(root,canvas){
 const output=canvas.outputs.find(row=>row.path==='output/alg-l06-p024-canvas-v2/canvas-renderer.js');
 assert(output,'P024 maintained Canvas v2 output');
 const runtime=local(root,ARTIFACT_PATHS.runtime);
 equal([runtime.bytes,runtime.sha256],[output.bytes,output.sha256],
  'exact staged Canvas v2 runtime');
 return {module:local(root,ARTIFACT_PATHS.module),
  timeline:local(root,ARTIFACT_PATHS.timeline),runtime};
}

export function p024Runtime(artifacts){
 return {frameDomain:'sprite-208',frameCount:381,rootFrameCount:10,rootBeginFrame:6,
  quizStopFrame:154,feedbackFrameDomains:Object.fromEntries(FEEDBACK.map(row=>
   [`sprite-${row.id}`,row.frames])),fps:12,stage:{width:800,height:600},
  scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
  terminalPolicy:'candidate-branch-resume-main-end-hold',hostPlaybackCompletion:false};
}

export function p024ProposedEntry(root,source){
 const canonical=source??readP024CanonicalSource(root);
 const artifacts=canonical.artifacts??proposedP024Artifacts(root,canonical.canvas);
 return {key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'behavior-heavy',artifacts};
}

export function readP024CanonicalSource(root){
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 const binding=readJsonPin(root,BINDING),migrationPin=local(root,`migrations/${ID}/migration.json`),
  migration=readJsonPin(root,migrationPin);
 equal([binding.schemaVersion,binding.kind,binding.animationId,binding.source],
  [1,'alg-l06-p024-candidate-source-binding-v1',ID,SOURCE]);
 equal([binding.files.length,new Set(binding.files.map(pin=>pin.path)).size,
  binding.external.length,binding.limits],
  [177,177,4,{candidateOnly:true,sourceEnglishFallback:true,
   optionalSpanishExplicit:true,optionalSpanishSpliced:false,branchCoveragePending:true}]);
 assert(Object.values(binding.acceptanceEffects).every(value=>value===false),
  'candidate gates remain false');
 for(const pin of binding.files)readPin(root,pin);
 for(const row of binding.external)readPin(row.root,row.pin);
 for(const pin of [SOURCE,XML])assert(binding.external.some(row=>
  row.root===SOURCE_ROOT&&JSON.stringify(row.pin)===JSON.stringify(pin)),
  `physical P024 source retained: ${pin.path}`);
 assert(!binding.external.some(row=>row.pin.path===SA.path),
  'candidate four-pin history preserved; SA is added to formal proof separately');
 equal([migration.id,migration.animationId,migration.assetId,migration.status,
  migration.source.swfSha256,migration.runtime.complexity],
  [ID,ID,`swf-${SOURCE.sha256}`,'preserved',SOURCE.sha256,'behavior-heavy']);
 equal([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,
  migration.acceptance.ownerReview.decision],['pending','pending','pending']);

 const intake=readJsonPin(root,binding.intake),behavior=readJsonPin(root,binding.behavior),
  scope=readJsonPin(root,binding.scope),audio=readJsonPin(root,binding.audio),
  plan=readJsonPin(root,binding.audioPlan),native=readJsonPin(root,binding.native),
  geometry=readJsonPin(root,binding.geometry),
  presentation=readJsonPin(root,binding.presentation),
  canvas=readJsonPin(root,binding.canvas),crosswalk=readJsonPin(root,binding.crosswalk);
 equal([intake.identity.globalOrdinal,intake.identity.xmlOccurrence,
  intake.identity.sectionCode,intake.identity.sectionPageOrdinal,
  intake.source.samePathFlaExists],[24,24,'VB',14,false]);
 equal([core(intake.source.swf),core(intake.source.lessonXml),
  core(intake.source.separateSa)],[SOURCE,XML,SA]);
 equal([behavior.kind,behavior.animationId,behavior.frameDomains.root,
  behavior.frameDomains.main.timelineId,behavior.frameDomains.main.frames,
  behavior.frameDomains.main.quizStop,behavior.frameDomains.main.hostConditionalTerminal,
  behavior.frameDomains.fps],
  ['alg-l06-p024-source-behavior-audit-v1',ID,10,'sprite-208',381,154,381,12]);
 equal(behavior.feedback.map(row=>[row.id,row.kind,row.stop??null,row.closeGoto??null,
  row.end,row.closeButton??null]),
  FEEDBACK.map(row=>[row.id,row.kind,row.stop,row.close,row.end,row.button]));
 equal(behavior.frameDomains.feedback.map(row=>[row.timelineId,row.frames]),
  FEEDBACK.map(row=>[`sprite-${row.id}`,row.frames]));
 equal(behavior.question.table.rows.map(row=>[row.input,row.output]),
  [['1','–1'],['10','0'],['100','1']]);
 equal(behavior.question.answers.map(row=>[row.label,row.verdict,row.buttonCharacterId]),
  [['A','wrong',198],['B','wrong',198],['C','right',197],['D','wrong',199]]);
 equal([behavior.question.answerRemovedOnParentFrame,
  behavior.sourceBranchContract.random.includes('random(3)')], [155,true]);
 equal(scope.cases.map(row=>[row.feedbackSprite,row.popupSprite,row.buttonCharacterId,
  row.feedbackStopFrame,row.declaredGotoFrame,row.feedbackTerminalFrame]),
  [[69,65,61,22,23,31],[83,80,78,23,24,29],[97,94,92,20,21,28]]);
 assert(scope.maintainedStateContract.includes('First wrong keeps quizSection')&&
  scope.maintainedStateContract.includes('second clears quizSection'),
  'two wrong attempts retain source-qualified Close boundary');
 assert(scope.limitations.some(row=>row.includes('not authoritative Adobe')),
  'Ruffle scope is not original-runtime proof');

 equal([audio.kind,audio.domains.length,plan.frameDomain,plan.visualFrames,
  plan.quizStopFrame,plan.domains.length],
  ['alg-l06-p024-audio-source-audit-v1',8,'sprite-208',381,154,8]);
 equal(plan.domains.map(row=>[row.id,row.declaredFrames]),
  [...FEEDBACK.map(row=>[`sprite-${row.id}`,row.frames]),['sprite-208',381]]);
 equal(audio.domains.map(row=>[row.id,core(row.extractedMp3)]),
  plan.domains.map(row=>[row.id,core(row.extractedMp3)]));
 equal([plan.domains.at(-1).blockRange,plan.domains.at(-1).staticBranch.mainStopFrame,
  plan.optionalSpanishAudio.source,core(plan.optionalSpanishAudio.asset)],
  [[2,381],154,SA,core(audio.separateSa.copy)]);
 equal([plan.policy.independentDomains,plan.policy.concatenated,
  plan.policy.feedbackActivationRequiresQuizState,
  plan.policy.wrongPopupCloseToTerminalUnproved,plan.policy.listeningAccepted,
  plan.policy.audioAccepted,audio.separateSa.activation,
  audio.separateSa.localeAutoplay,audio.separateSa.splicedIntoAnyDomain,
  plan.optionalSpanishAudio.activation,plan.optionalSpanishAudio.joinedWithMain],
  [true,false,true,true,false,false,'explicit-user-only',false,false,
   'explicit-user-only',false]);
 assert(Object.values(audio.limits).every(value=>value===false),
  'source audio audit makes no acceptance claim');

 equal([native.kind,native.animationId,native.inventory.staticTextDefinitions,
  native.inventory.dynamicFields,native.inventory.textInstances,
  native.inventory.mainAndFeedbackDomains,native.inventory.popupDomains,
  native.masks.map(row=>[row.domainId,row.characterId,row.firstFrame,row.depth,row.clipDepth])],
  ['alg-l06-p024-native-text-source-v1',ID,40,3,77,8,3,
   [['sprite-208',35,67,11,18],['sprite-208',35,124,19,24],
    ['sprite-123',98,2,1,7]]]);
 equal(native.reading.table.sourceOrder.map(row=>[row.input,row.output]),
  [['1','–1'],['10','0'],['100','1']]);
 equal(native.answers.map(row=>[row.label,row.value,row.verdict]),
  behavior.question.answers.map(row=>[row.label,row.value,row.verdict]));
 equal([native.reading.answerRevealGate.mainFrame,
  native.reading.answerRevealGate.quizActiveRequired,native.policy.canvasGlyphs,
  native.policy.language,native.policy.translatedSpanishSourceAbsent,
  native.policy.answerBeforeQuiz,native.policy.originalRuntimeObserved],
  [154,true,'preserved','source-en-fallback',true,false,false]);
 equal([geometry.table.firstCompleteGeometryFrame,
  geometry.tableParagraph.firstCompleteInkFrame,
  geometry.question.firstCompleteInkFrame,
  geometry.masks.map(row=>[row.characterId,row.frame,row.depth,row.clipDepth])],
  [7,109,142,MASKS.slice(1).map(row=>row.slice(1))]);
 equal([presentation.table.firstFrame,presentation.paragraph.firstFrame,
  presentation.question.firstFrame,presentation.gates.length,
  presentation.popup.map(row=>row.dynamicSourceTextId),presentation.localePolicy],
  [7,109,142,7,[64,79,93],'source-en-fallback']);
 equal(presentation.gates.map(row=>[row.key,row.context,row.firstFrame]),GATES);
 equal(geometry.glossary.map(row=>[row.key,row.firstSourceReadyFrame]),
  GATES.map(row=>[row[1],row[2]]));

 equal([canvas.kind,canvas.animationId,canvas.source,canvas.rootFrame,
  canvas.mainFrameCount,canvas.mainQuizStopFrame,canvas.stage,
  canvas.feedbackDomains,canvas.sourceMasks.map(row=>[row.timelineId,
   row.characterId,row.frame,row.depth,row.clipDepth]),
  canvas.sourceMorphCharacterCount,canvas.bitmapDefinitions],
  ['alg-l06-p024-maintained-canvas-v2',ID,SOURCE,6,381,154,
   {width:800,height:600},Object.fromEntries(FEEDBACK.map(row=>[row.id,row.frames])),
   MASKS,61,4]);
 equal([canvas.sourceGlyphRendering.staticDefinitions,
  canvas.sourceGlyphRendering.preserved,
  canvas.sourceGlyphRendering.suppressTextIdsSupported,
  canvas.sourceGlyphRendering.dynamicSuppressionSupported,
  canvas.sourceGlyphRendering.dynamicInkInFFDec,
  canvas.sourceGlyphRendering.nativeFeedbackTextNeeded,
  canvas.sourceGlyphRendering.unownedSourceTextFallback,
  canvas.sourceGlyphRendering.sourceEnglishUnderSpanishHost],
  [40,true,true,false,false,true,true,true]);
 equal(canvas.sourceGlyphRendering.auditedStaticTextIds,
  [12,13,14,15,16,17,18,37,41]);
 assert(Object.values(canvas.acceptanceEffects).every(value=>value===false),
  'Canvas renderer does not grant downstream acceptance');

 equal([crosswalk.identity.animationId,crosswalk.identity.globalOrdinal,
  crosswalk.identity.sectionPageOrdinal,crosswalk.entries.length,
  crosswalk.missingModernKeys,crosswalk.originalHostRunObserved],
  [ID,24,14,5,['Range'],false]);
 equal(crosswalk.entries.map(row=>[row.key,row.buttonCharacterId]),
  [['Range',7],['Function',8],['Output',9],['Set',10],['Function table',38]]);
 const glossary={};
 for(const key of KEYS){
  const dictionary=crosswalk.entries.find(row=>row.key===key),
   sourceButton=behavior.glossary.find(row=>row.key===key),
   nativeButton=native.glossary.find(row=>row.key===key);
  assert(dictionary&&sourceButton&&nativeButton,`source glossary ${key}`);
  equal([dictionary.buttonCharacterId,nativeButton.buttonCharacterId,
   sourceButton.buttonCharacterId,dictionary.dictionary.sourceKeyAttribute],
   [sourceButton.buttonCharacterId,sourceButton.buttonCharacterId,
    sourceButton.buttonCharacterId,key]);
  assert(dictionary.dictionary.definitions.en&&dictionary.dictionary.definitions.es);
  assert.equal(dictionary.modern.present,key!=='Range');
  const instances=presentation.gates.filter(row=>row.key===key).map(row=>{
   const geo=geometry.glossary.find(item=>item.key===row.context);
   assert(geo,`source hit/ink geometry ${row.context}`);
   equal([geo.firstSourceReadyFrame,geo.firstFullHitFrame,
    geo.firstFullBlueInkFrame,row.readyIntervals],
    [row.firstFrame,row.firstFrame,row.firstFrame,geo.sourceReadyIntervals]);
   return {context:row.context,buttonInstanceId:row.buttonInstanceId,
    labelInstanceId:row.labelInstanceId,firstReadyFrame:row.firstFrame,
    sourceReadyIntervals:row.readyIntervals};
  });
  glossary[key]={characterId:sourceButton.buttonCharacterId,sourceKey:key,
   entryId:dictionary.dictionary.id,sourceActionSha256:sourceButton.sourceAction.sha256,
   instances,originalClickObserved:false};
 }
 assert.equal(Object.values(glossary).reduce((n,row)=>n+row.instances.length,0),7);
 const artifacts=proposedP024Artifacts(root,canvas);
 const localInputs=uniquePins([BINDING,migrationPin,...binding.files,
  ...Object.values(artifacts)]);
 const external=[...binding.external,{root:SOURCE_ROOT,pin:SA}];
 equal(external.length,5);
 return {binding,migration,intake,behavior,scope,audio,plan,native,geometry,
  presentation,canvas,crosswalk,glossary,artifacts,localInputs,external};
}

/** Validate a proposed frozen page packet and one registration; final browser proof is supplied later. */
export function validateP024Page(page,registration,root=ROOT){
 assert(root,'P024_REQUIRES_CURRENT_ROOT');
 const source=readP024CanonicalSource(root),entry=p024ProposedEntry(root,source);
 equal([page.schemaVersion,page.calibrationId,page.sourceRoot,page.scope,
  page.deploymentScope,page.source,page.sourceXml],
  [1,CALIBRATION,SOURCE_ROOT,'private-engineering','local-only',SOURCE,XML]);
 equal(page.entry,entry);
 equal(page.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:24,sourceOccurrence:24,sectionCode:'VB',
  sectionPageOrdinal:14,complexityLane:'behavior-heavy',runtime:p024Runtime(entry.artifacts)}]);
 equal(page.optionalSpanishAudio.source,SA);
 equal([page.optionalSpanishAudio.trigger,page.optionalSpanishAudio.localeAutoplay,
  page.optionalSpanishAudio.mainStreamSpliced,page.optionalSpanishAudio.audioAccepted],
  ['explicit-user-only',false,false,false]);
 equal(page.glossaryActions,source.glossary);
 equal([page.continuousSource.audit,page.continuousSource.plan,
  page.continuousSource.mainFrameDomain,page.continuousSource.mainFrames,
  page.continuousSource.quizStopFrame,page.continuousSource.domainAssets,
  page.continuousSource.independentDomains,page.continuousSource.concatenated,
  page.continuousSource.branchCoverageComplete,
  page.continuousSource.originalRuntimeAccepted,
  page.continuousSource.listeningAccepted,page.continuousSource.audioAccepted],
  [source.binding.audio,source.binding.audioPlan,'sprite-208',381,154,
   source.plan.domains.map(row=>({id:row.id,frames:row.declaredFrames,
    asset:core(row.extractedMp3)})),true,false,false,false,false,false]);
 equal(page.feedbackSource,FEEDBACK.map(row=>({id:`sprite-${row.id}`,kind:row.kind,
  variant:row.variant,frames:row.frames,stop:row.stop,closeGoto:row.close,
  terminal:row.end})));
 equal(page.acceptanceEffects,ACCEPTANCE);
 equal([page.productCalibrationPassed,page.scaleOutAuthorized], [false,false]);
 assert.equal(page.freezeManifest.path,FREEZE_PATH);
 equal(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:page.freezeManifest.bytes,
  freezeManifestSha256:page.freezeManifest.sha256,entries:[entry]});
 assert.equal(page.integrity.completeTransitiveClosure,false);
 const evidence=new Map(page.integrity.files.map(pin=>[pin.path,pin]));
 equal(evidence.size,page.integrity.files.length,'unique P024 integrity pins');
 for(const pin of [...source.localInputs,...Object.values(entry.artifacts)])
  equal(evidence.get(pin.path),pin,`current P024 producer input ${pin.path}`);
 for(const pin of page.integrity.files){
  assert(!FORBIDDEN.has(pin.path)&&pin.path!==PROOF_PATH&&pin.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(pin.path),
   `registration-dependent P024 evidence: ${pin.path}`);
  readPin(root,pin);
 }
 return true;
}
