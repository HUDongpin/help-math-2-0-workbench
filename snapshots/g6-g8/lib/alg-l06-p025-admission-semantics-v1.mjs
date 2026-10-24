/** Source-bound P025 admission semantics. This reads evidence; it does not register a page. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';
import {validateP025EngineeringCases} from './alg-l06-p025-native-audio-evidence-v1.mjs';

export const ID='shared-alg001-l06-p025';
export const CALIBRATION='g678-alg-l06-p025-current-js-20260930-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const DICTIONARY_ROOT='/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const ENGINEERING_RECEIPT_PATH='output/playwright/alg-l06-p025-host-v4/engineering-receipt-v1.json';
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB18.swf',bytes:102660,
 sha256:'dcb6b709d71eada47053b50bcfcc1161dec5d1717ebca6cbf8463eb6863dbde6'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB18.mp3',bytes:173040,
 sha256:'295dcabe0549764ffe03ecc4e6a332a5cb85d05329095be079ad32bdac6a044e'};
export const DICTIONARY_EN={path:'L1KTE01.xml',bytes:345838,
 sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'};
export const DICTIONARY_ES={path:'L1KTS01.xml',bytes:344456,
 sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'};
export const BINDING={path:'output/alg-l06-p025-host-prep-v1/candidate-source-binding-v5.json',
 bytes:28656,sha256:'c017ba7b9651bfdcd12c39ffbf02e29c6ff7794fba084b141b5d43561df7b6de'};
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/alg-l06-p025-maintained-canvas-v2-20260930-v1/members/${ID}/canvas-renderer.js`});
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,
 fidelityAccepted:false,audioAccepted:false,listeningAccepted:false,
 humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const equal=(actual,expected,label)=>assert.deepEqual(actual,expected,label);
const core=item=>({path:item.path,bytes:item.bytes,sha256:item.sha256});
const sameCore=(a,b)=>a.path===b.path&&a.bytes===b.bytes&&a.sha256===b.sha256;
const local=(root,relative)=>pinFile(root,relative);
const MASKS=[[2,1,10,2],[52,11,16,2]];
const TEXT_IDS=[5,10,11,12,13,15,18,20];
const KEYS=[['Independent variable',7,28,'independent-variable'],
 ['Function',8,50,'function'],['Input variable',9,41,'input-variable'],
 ['Domain',16,295,'domain']];
const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);

export function proposedP025Artifacts(root,canvasManifest){
 const output=canvasManifest.outputs.find(row=>row.path==='output/alg-l06-p025-canvas-v2/canvas-renderer.js');
 assert(output,'P025 maintained Canvas v2 output');
 const runtime=local(root,ARTIFACT_PATHS.runtime);
 equal([runtime.bytes,runtime.sha256],[output.bytes,output.sha256],
  'exact staged Canvas v2 runtime');
 return {module:local(root,ARTIFACT_PATHS.module),
  timeline:local(root,ARTIFACT_PATHS.timeline),runtime};
}

export function p025Runtime(artifacts){
 return {frameDomain:'sprite-21',frameCount:299,rootFrameCount:10,rootBeginFrame:6,
  fps:12,stage:{width:800,height:600},scenario:'source-static-frame',seed:'0',
  canvasRenderer:artifacts.runtime,
  terminalPolicy:'native-audio-eof-then-bounded-visual-tail-hold',hostPlaybackCompletion:false};
}

export function p025ProposedEntry(root,source){
 const canonical=source??readP025CanonicalSource(root);
 const artifacts=canonical.artifacts??proposedP025Artifacts(root,canonical.canvasManifest);
 return {key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'interactive-understood',artifacts};
}

export function readP025CanonicalSource(root){
 const expectedExternal=[{root:SOURCE_ROOT,pin:SOURCE},{root:SOURCE_ROOT,pin:XML},
  {root:SOURCE_ROOT,pin:SA},{root:DICTIONARY_ROOT,pin:DICTIONARY_EN},
  {root:DICTIONARY_ROOT,pin:DICTIONARY_ES}];
 for(const item of expectedExternal)readPin(item.root,item.pin);
 const binding=readJsonPin(root,BINDING);
 equal([binding.schemaVersion,binding.kind,binding.animationId,binding.source],
  [1,'alg-l06-p025-candidate-source-binding-v1',ID,SOURCE]);
 equal([binding.files.length,new Set(binding.files.map(pin=>pin.path)).size,
  binding.external,binding.limits],
  [123,123,expectedExternal,{candidateOnly:true,sourceEnglishFallback:true,
   optionalSpanishExplicit:true,optionalSpanishSpliced:false,
   originalHostRunObserved:false}]);
 equal([binding.predecessorIndex,binding.predecessorHost,
  binding.historicalCrosswalkIndex.role],
  [{path:'catalog/g678-admission-v1/index-v85.json',bytes:6370,
    sha256:'101765824a9106a4985514d80561a346714f62716e6221c717033eb387de3bb6'},
   {path:'catalog/g678-admission-v1/host-v85.json',bytes:127675,
    sha256:'c44e98ddd152f5bd6abf332835c0a128d4715395ab9a1be0e6d235f968c5810b'},
   'dated dictionary and predecessor crosswalk; not current activation']);
 const historicalCrosswalkPin=core(binding.historicalCrosswalkIndex);
 equal(historicalCrosswalkPin,{path:'catalog/g678-admission-v1/index-v84.json',
  bytes:6370,sha256:'7530fc24a8cf9aa4785b78c2ec49eb70e5c39e8c9357bdb3a8de8248ba0126cd'});
 equal(binding.files.filter(pin=>/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(pin.path)),
  [historicalCrosswalkPin], 'only the dated crosswalk is a page input');
 assert(Object.values(binding.acceptanceEffects).every(value=>value===false),
  'candidate acceptance effects remain false');
 for(const pin of binding.files)readPin(root,pin);
 for(const item of binding.external)readPin(item.root,item.pin);
 const migrationPin=local(root,`migrations/${ID}/migration.json`),
  migration=readJsonPin(root,migrationPin);
 equal([migration.id,migration.animationId,migration.assetId,migration.status,
  migration.source.swfSha256,migration.source.pairedFlaStatus,
  migration.runtime.complexity],
  [ID,ID,`swf-${SOURCE.sha256}`,'preserved',SOURCE.sha256,'missing',
   'interactive-understood']);
 equal([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,
  migration.acceptance.ownerReview.decision],['pending','pending','pending']);

 const audit=readJsonPin(root,binding.audit),geometry=readJsonPin(root,binding.geometry),
  native=readJsonPin(root,binding.native),canvasManifest=readJsonPin(root,binding.canvas),
  canvasMetadataPin=binding.files.find(pin=>pin.path==='output/alg-l06-p025-canvas-v2/canvas-metadata-v2.json'),
  canvasMetadata=readJsonPin(root,canvasMetadataPin),audio=readJsonPin(root,binding.audio),
  audioPlan=readJsonPin(root,binding.audioPlan),
  browserDecode=readJsonPin(root,binding.browserDecode),
  crosswalk=readJsonPin(root,binding.crosswalk);
 equal([audit.kind,audit.animationId,core(audit.source.swf),
  core(audit.source.lessonXml),core(audit.source.separateSa),
  audit.source.samePathFlaExists,audit.runtime.header.frameRate,
  audit.runtime.header.frameCount,audit.runtime.domains.map(row=>[row.domain,row.declaredFrames])],
  ['alg-l06-p025-source-audit-v1',ID,SOURCE,XML,SA,false,12,10,
   [['root',10],['sprite-21',299]]]);
 equal(audit.runtime.buttonActions.map(row=>[row.key,row.characterId,
  row.trigger,row.hostCall,row.playbackEffect]),
  KEYS.map(([key,id])=>[key,id,'on(release)','_root.DoHyperLinks()','stop']));
 equal([audit.audio.embedded.frameDomain,audit.audio.embedded.blockRange,
  audit.audio.embedded.blockCount,audit.audio.embedded.declaredSampleTotal,
  audit.audio.embedded.zeroSampleBlocks,audit.audio.embedded.emptyPayloadBlocks,
  core(audit.audio.separateSa)],
  ['sprite-21',[2,299],298,547200,[3],[3],SA]);
 equal([audit.complexity.classification,audit.evidenceBoundary.originalNaturalTraceObserved],
  ['interactive-understood-candidate',false]);

 equal([geometry.kind,geometry.masks.map(row=>[row.frame,row.depth,row.clipDepth,row.characterId]),
  geometry.textDefinitions.map(row=>row.characterId),
  geometry.glossary.map(row=>[row.key,row.firstSourceReadyFrame,row.firstFullHitFrame])],
  ['alg-l06-p025-source-text-geometry-v1',MASKS,TEXT_IDS,
   KEYS.map(([key,,frame])=>[key,frame,frame])]);
 equal([geometry.limitations.sourceGeometryCandidateOnly,
  geometry.limitations.originalRuntimeObserved,
  geometry.limitations.browserVisualObserved,
  geometry.limitations.productAvailabilityUnchanged],
  [true,false,false,true]);
 equal([native.kind,native.animationId,native.sourceSwfSha256,native.frameDomain,
  native.frameCount,native.fps,native.inventory.staticTextDefinitions,
  native.inventory.sourceMasks,native.inventory.glossaryControls,
  native.frames.length,native.suppressionPolicy.candidateTextIds,
  native.suppressionPolicy.sourceCanvasFallbackTextIds,
  native.suppressionPolicy.requiresActualNativeRenderedInstances,
  native.languagePolicy],
  ['alg-l06-p025-native-text-source-state-v1',ID,SOURCE.sha256,'sprite-21',
   299,12,8,2,4,299,[5,15],[10,11,12,13,18,20],true,
   {sourceTextLanguage:'en',es:'source-en-fallback',
   authoredSpanishTextAbsent:true,doNotInventTranslation:true}]);
 equal([native.suppressionPolicy.status,
  native.suppressionPolicy.sourceGlyphRendering,
  native.limits.originalRuntimeObserved,native.limits.fidelityAccepted,
  native.limits.humanVisualAccepted,native.limits.ownerAccepted],
  ['candidate-only-no-product-suppression','preserved-until-native-ownership-is-wired',
   false,false,false,false]);
 equal(KEYS.map(([key])=>native.glossaryControls.find(row=>row.key===key)).map(row=>[
  row.key,row.buttonCharacterId,row.firstSourceGeometryReadyFrame,row.originalHostClickObserved]),
  KEYS.map(([key,id,frame])=>[key,id,frame,false]));
 equal(native.nativeGroups.map(row=>[row.characterId,row.firstCompleteInkFrame]),
  [[5,50],[15,295]]);

 equal([canvasManifest.kind,canvasManifest.animationId,
  canvasManifest.suppression.auditedStaticTextIds,
  canvasManifest.suppression.eligibleFrameRanges,
  canvasManifest.outputs.map(core)],
  ['alg-l06-p025-maintained-native-canvas-v2',ID,[5,15],
   {'5':[[50,299]],'15':[[295,299]]},
   [{path:'output/alg-l06-p025-canvas-v2/canvas-renderer.js',bytes:909190,
    sha256:'a3fd0f401fa32779ddff8fc41bc423d458b2ea2a929c44a43fbe3446dc5082f9'}]]);
 assert(Object.values(canvasManifest.acceptanceEffects).every(value=>value===false),
  'Canvas makes no downstream acceptance claim');
 equal([canvasMetadata.animationId,canvasMetadata.sourceSwfSha256,
  canvasMetadata.frameDomain,canvasMetadata.frameCount,canvasMetadata.fps,
  canvasMetadata.rootFrame,canvasMetadata.stage,canvasMetadata.visualLocalization,
  canvasMetadata.sourceClipMasks.map(row=>[row.frame,row.depth,row.clipDepth,row.characterId]),
  canvasMetadata.sourceGlyphRendering.definitions,
  canvasMetadata.sourceGlyphRendering.auditedStaticTextIds,
  canvasMetadata.sourceGlyphRendering.eligibleFrameRanges,
  canvasMetadata.sourceGlyphRendering.suppressTextIdsSupported,
  canvasMetadata.sourceGlyphRendering.preserved,
  canvasMetadata.sourceGlyphRendering.unownedSourceTextFallback,
  canvasMetadata.assetSha256],
  [ID,SOURCE.sha256,'sprite-21',299,12,6,{width:800,height:600},
   'source-en-fallback',MASKS,8,[5,15],{'5':[[50,299]],'15':[[295,299]]},
   true,true,true,canvasManifest.outputs[0].sha256]);
 equal(canvasMetadata.sourceGlossaryButtons.map(row=>[row.keyAttribute,
  row.characterId,row.staticReadyFrame,row.actualClickObserved]),
  KEYS.map(([key,id,frame])=>[key,id,frame,false]));

 equal([audioPlan.kind,audioPlan.main.frameDomain,audioPlan.main.visualFrames,
  audioPlan.main.asset.id,audioPlan.main.asset.initialSeekSamples,
  audioPlan.main.asset.decodedSamples,audioPlan.main.asset.browserPcmSha256,
  audioPlan.main.asset.visualTailFrames,
  audioPlan.main.sourceBlocks.zeroPayloadFrame,
  audioPlan.optionalSpanishAudio.activation,
  audioPlan.optionalSpanishAudio.localeAutoplay,
  audioPlan.optionalSpanishAudio.joinedWithMain,
  audioPlan.optionalSpanishAudio.decodedSamples,
  audioPlan.optionalSpanishAudio.browserPcmSha256],
  ['alg-l06-p025-browser-bound-audio-plan-v2','sprite-21',299,'main-1',
   1673,547200,'251b3141cd0879bf22ab82ab81df9c071d313e438098a049df02212cf848a93a',
   0.11455782312924612,3,'explicit-user-only',false,false,593280,
   '3dd78ab1d3e31085d8f7cc93403f1ff84ef70f42c93d26f2b8c43b48bad6789c']);
 equal([browserDecode.kind,browserDecode.results.map(row=>[row.role,row.decodedSamples,
  row.sourceSha256,row.pcmSha256,row.playbackStarted]),browserDecode.sourceNodesCreated],
  ['alg-l06-p025-browser-decode-v1',
   [['main-1',547200,audioPlan.main.asset.sourceSha256,
     audioPlan.main.asset.browserPcmSha256,false],
    ['separate-sa',593280,audioPlan.optionalSpanishAudio.sourceSha256,
     audioPlan.optionalSpanishAudio.browserPcmSha256,false]],0]);
 assert(Object.values(audioPlan.limits).every(value=>value===false),
  'browser decode is not listening or original-runtime acceptance');
 equal([core(audioPlan.main.asset.source),core(audioPlan.optionalSpanishAudio.source)],
  [core(audio.main.extractedMp3),core(audio.separateSa.copy)]);

 equal([crosswalk.kind,crosswalk.identity.animationId,
  crosswalk.identity.globalOrdinal,crosswalk.identity.sectionPageOrdinal,
  crosswalk.entries.length,crosswalk.missingModernKeys,
  crosswalk.expectedNextGlossaryCount,crosswalk.originalHostRunObserved,
  crosswalk.acceptanceChanged],
  ['alg-l06-p025-four-glossary-source-crosswalk-v1',ID,25,15,4,
   ['Independent variable'],39,false,false]);
 const glossary={};
 for(const [key,id,frame,entryId] of KEYS){
  const row=crosswalk.entries.find(item=>item.key===key),
   button=audit.runtime.buttonActions.find(item=>item.key===key),
   control=native.glossaryControls.find(item=>item.key===key),
   geo=geometry.glossary.find(item=>item.key===key);
  assert(row&&button&&control&&geo,`P025 glossary source ${key}`);
  equal([row.buttonCharacterId,row.firstSourceReadyFrame,row.dictionary.id,
   row.dictionary.sourceKeyAttribute,row.modern.present,row.modern.entryId,
   row.sourceButton,control.sourceActionSha256,
   geo.firstSourceReadyFrame,geo.firstFullHitFrame],
   [id,frame,entryId,key,key!=='Independent variable',
    key==='Independent variable'?null:entryId,button,button.action.sha256,
    frame,frame]);
  assert(row.dictionary.definitions.en&&row.dictionary.definitions.es,
   `bilingual physical dictionary ${key}`);
  equal([row.dictionary.source.en.sha256,row.dictionary.source.es.sha256],
   [DICTIONARY_EN.sha256,DICTIONARY_ES.sha256]);
  glossary[key]={characterId:id,sourceKey:key,entryId,
   sourceActionSha256:button.action.sha256,buttonInstanceId:control.buttonInstanceId,
   firstReadyFrame:frame,sourceReadyIntervals:control.sourceReadyIntervals,
   originalClickObserved:false};
 }
 const artifacts=proposedP025Artifacts(root,canvasManifest);
 const localInputs=uniquePins([BINDING,migrationPin,...binding.files,...Object.values(artifacts)]);
 return {binding,migration,audit,geometry,native,canvasManifest,canvasMetadata,
  audio,audioPlan,browserDecode,crosswalk,glossary,artifacts,localInputs,
  external:expectedExternal};
}

/** `proof` is the packet returned by readPageProof, never the outer proof wrapper. */
/** Source-only contract for planning before a fresh My Lesson receipt exists. */
export function validateP025SourcePacket(proof,registration,root=ROOT){
 const source=readP025CanonicalSource(root),entry=p025ProposedEntry(root,source);
 equal([proof.schemaVersion,proof.calibrationId,proof.sourceRoot,proof.scope,
  proof.deploymentScope,proof.source,proof.sourceXml],
  [1,CALIBRATION,SOURCE_ROOT,'private-engineering','local-only',SOURCE,XML]);
 equal(proof.entry,entry);
 equal(proof.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:25,sourceOccurrence:25,sectionCode:'VB',
  sectionPageOrdinal:15,complexityLane:'interactive-understood',
  runtime:p025Runtime(entry.artifacts)}]);
 equal(proof.continuousSource,{audit:source.binding.audio,
  plan:source.binding.audioPlan,browserDecode:source.binding.browserDecode,
  mainFrameDomain:'sprite-21',mainFrames:299,mainAsset:core(source.audioPlan.main.asset.source),
  firstBlockFrame:2,lastBlockFrame:299,zeroPayloadFrame:3,
  initialSeekSamples:1673,browserDecodedSamples:547200,
  browserPcmSha256:source.audioPlan.main.asset.browserPcmSha256,
  visualTailFrames:0.11455782312924612,
  oneContinuousStream:true,concatenated:false,originalRuntimeAccepted:false,
  listeningAccepted:false,audioAccepted:false});
 equal(proof.optionalSpanishAudio,{source:SA,
  asset:core(source.audioPlan.optionalSpanishAudio.source),
  browserDecodedSamples:593280,
  browserPcmSha256:source.audioPlan.optionalSpanishAudio.browserPcmSha256,
  trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
  audioAccepted:false});
 equal(proof.nativeTextSource,{state:source.binding.native,
  frameDomain:'sprite-21',frames:299,staticTextDefinitions:8,
  suppressibleTextIds:[5,15],sourceEnglishFallback:true,
  originalRuntimeAccepted:false});
 equal(proof.glossaryActions,source.glossary);
 equal(proof.acceptanceEffects,ACCEPTANCE);
 equal([proof.productCalibrationPassed,proof.scaleOutAuthorized],[false,false]);
 assert.equal(proof.freezeManifest.path,FREEZE_PATH);
 equal(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:proof.freezeManifest.bytes,
  freezeManifestSha256:proof.freezeManifest.sha256,entries:[entry]});
 assert.equal(proof.integrity.completeTransitiveClosure,false);
 const evidence=new Map(proof.integrity.files.map(pin=>[pin.path,pin]));
 equal(evidence.size,proof.integrity.files.length,'unique P025 integrity pins');
 for(const pin of source.localInputs)
  equal(evidence.get(pin.path),pin,`current P025 producer input ${pin.path}`);
 for(const pin of proof.integrity.files){
  assert(!FORBIDDEN.has(pin.path)&&pin.path!==PROOF_PATH&&pin.path!==FREEZE_PATH&&
   (!/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(pin.path)||
    sameCore(pin,source.binding.historicalCrosswalkIndex)),
   `registration-dependent P025 evidence: ${pin.path}`);
  readPin(root,pin);
 }
 return true;
}

/** Admitted proofs must re-read the exact browser receipt and its raw inputs. */
export function validateP025Admission(proof,registration,root=ROOT){
 validateP025SourcePacket(proof,registration,root);
 const receiptPin=proof.engineeringReceipt;
 assert(receiptPin&&receiptPin.path===ENGINEERING_RECEIPT_PATH,
  'exact P025 engineering receipt required');
 const evidence=new Map(proof.integrity.files.map(pin=>[pin.path,pin]));
 equal(evidence.get(receiptPin.path),receiptPin,'engineering receipt in proof integrity');
 const receipt=readJsonPin(root,receiptPin);
 const source=readP025CanonicalSource(root);
 equal([receipt.schemaVersion,receipt.kind,receipt.animationId,receipt.sourcePacket,
  receipt.indexPin,receipt.hostPin,receipt.officialCount,receipt.registered,
  receipt.denominator,receipt.pageErrors,receipt.consoleErrors,
  receipt.acceptanceEffects],
  [1,'g678-p025-local-my-lesson-engineering-v1',ID,BINDING,
   source.binding.predecessorIndex,source.binding.predecessorHost,512,false,
   2282,[],[],source.binding.acceptanceEffects]);
 assert(Array.isArray(receipt.remainingGaps)&&receipt.remainingGaps.length>0,
  'engineering receipt retains unresolved gaps');
 assert(Array.isArray(receipt.artifacts)&&receipt.artifacts.length>0,
  'engineering receipt raw artifacts required');
 equal(uniquePins(receipt.artifacts),receipt.artifacts,
  'unique sorted engineering artifacts');
 for(const pin of receipt.artifacts){
  assert(pin.path.startsWith('output/playwright/alg-l06-p025-host-v4/'),
   `bounded engineering artifact: ${pin.path}`);
  equal(evidence.get(pin.path),pin,`engineering artifact in proof integrity: ${pin.path}`);
  readPin(root,pin);
 }
 assert(receipt.artifacts.some(pin=>sameCore(pin,receipt.casesPin)),
  'engineering cases included in artifacts');
 const cases=readJsonPin(root,receipt.casesPin);
 equal(validateP025EngineeringCases(cases),receipt.traces,
  'independent native trace and engineering case replay');
 return true;
}

export const validateP025Page=validateP025Admission;
