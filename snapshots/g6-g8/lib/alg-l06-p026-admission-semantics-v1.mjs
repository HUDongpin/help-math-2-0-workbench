/** P026 physical-source semantics. Structural and technical decode evidence only. */
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES}
 from './alg-l06-p025-admission-semantics-v1.mjs';

export const ID='shared-alg001-l06-p026';
export const CALIBRATION='g678-alg-l06-p026-current-js-20261001-v3';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const PROOF_PATH='work/g678-workflow/candidates/'+ID+'-proof-v3.json';
export const FREEZE_PATH='catalog/product-bridge-calibrations/'+CALIBRATION+'.json';
export const BINDING_PATH='output/alg-l06-p026-product-integration-v1/candidate-source-binding-v4.json';
export const BINDING={path:BINDING_PATH,bytes:35977,
 sha256:'50f5b02ba89180af45679be101070898c5a4683bf9bbfc7c6863a69fad0c0e6a'};
const HISTORICAL_BINDING={
 path:'output/alg-l06-p026-product-integration-v1/candidate-source-binding-v2.json',
 bytes:35361,sha256:'f47b99022469974093a4ad69ba228abded0825027b33fcfe2305c5ccd5c4c3cb'};
export const ENGINEERING_RECEIPT_PATH=
 'output/playwright/alg-l06-p026-candidate-host-v1/engineering-receipt-v1.json';
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB19.swf',bytes:114936,
 sha256:'a61e60f95dc597c7b0024e7f013abfade47e199ae911be77916d5b38c7828e0c'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB19.mp3',bytes:120960,
 sha256:'1ef4cbedd255911e0392e26fa5420787f6338dff70c405d4074eb86427003b06'};
export const ARTIFACT_PATHS=Object.freeze({
 module:'packages/demos/src/modules/'+ID+'.tsx',
 timeline:'packages/demos/src/timelines/'+ID+'.ts',
 runtime:'work/g678-shared-page-factory/alg-l06-p026-maintained-canvas-v1-20261001-v1/members/'+ID+'/canvas-renderer.js'});
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,
 fidelityAccepted:false,audioAccepted:false,listeningAccepted:false,
 humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
const EVIDENCE=Object.freeze({
 audit:'output/alg-l06-p026-behavior-ir-v1/behavior-ir-v1.json',
 displayList:'output/alg-l06-p026-behavior-ir-v1/source-display-list-v1.json',
 native:'output/alg-l06-p026-native-text-v1/geometry-v1.json',
 canvas:'output/alg-l06-p026-canvas-v1/canvas-manifest.json',
 canvasMetadata:'output/alg-l06-p026-canvas-v1/canvas-metadata-v1.json',
 audioPlan:'output/alg-l06-p026-audio-extraction-v1/audio-domain-plan-v2.json',
 browserDecode:'output/alg-l06-p026-chrome-decode-v1/browser-decode.json',
 crosswalk:'output/alg-l06-p026-product-integration-v1/seven-term-crosswalk-v1.json'});
const ASSETS=Object.freeze({
 canvas:'output/alg-l06-p026-canvas-v1/canvas-renderer.js',
 main1:'output/alg-l06-p026-audio-extraction-v1/main-1-source-v1.mp3',
 main2:'output/alg-l06-p026-audio-extraction-v1/main-2-source-v1.mp3',
 sa:'output/alg-l06-p026-audio-extraction-v1/separate-sa-source-v1.mp3'});
const TEXT_IDS=[6,12,15,17,20,23,26,27,28,30];
const BUTTONS=[['Independent variable',8],['Function',9],['Input variable',10],
 ['Domain',13],['Dependent variable',21],['Output variable',22],['Range',24]];
const MASKS=[[31,18,15,24],[81,18,25,30]];
const RANGES=[[31,158,232704,52520,
 'ef1eac21881278a8ad30a2c17fef520f820940bc0941aea533493c4307b5a670'],
 [196,389,356544,80470,
 'c2ee52ab31a0ada790a4ac8659c0b703e999d830d6bc5c6b734f57d399c0f4dd']];
const CHROME_PCM=['6540b6ee5ea6e2d8fb34ec2942ebb7a91514664a88914057c120e9643f552382',
 'c10e3cc7865cea5102bd7561b5b36af4f684468e4f6ee06a5945456f94f35e22',
 'b79feaf3b27da1e4948cbef96bf07399b0c8299a2c8b3713aae2d977549ffc42'];
const equal=(actual,expected,label)=>assert.deepEqual(actual,expected,label);
const core=pin=>({path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
const checked=(condition,label)=>assert(condition,label);
const samePin=(a,b)=>a?.path===b?.path&&a?.bytes===b?.bytes&&a?.sha256===b?.sha256;
const external=Object.freeze([{root:SOURCE_ROOT,pin:SOURCE},{root:SOURCE_ROOT,pin:XML},
 {root:SOURCE_ROOT,pin:SA},{root:DICTIONARY_ROOT,pin:DICTIONARY_EN},
 {root:DICTIONARY_ROOT,pin:DICTIONARY_ES}]);
const compactFrames=instance=>instance.runs.flatMap(run=>
 Array.from({length:run.lastFrame-run.firstFrame+1},(_,index)=>run.firstFrame+index));
const sourceFrames=instance=>instance.presentSpans.flatMap(([first,last])=>
 Array.from({length:last-first+1},(_,index)=>first+index));

/** A pure check so tests can mutate copied evidence without touching source bytes. */
export function validateP026SourceEvidence(e){
 const {audit,displayList,native,canvas,canvasMetadata,audioPlan,browserDecode,crosswalk}=e;
 equal([audit.identity.animationId,audit.identity.assetId,audit.identity.globalActiveOrdinal,
  audit.identity.activePageCountInLesson,audit.identity.sectionCode,
  audit.identity.sectionPageOrdinal,audit.source.swf.sha256,
  audit.source.separateSa.sha256,audit.source.lessonXml.sha256],
  [ID,'swf-'+SOURCE.sha256,26,60,'VB',16,SOURCE.sha256,SA.sha256,XML.sha256],
  'P026 source identity');
 equal(audit.frameDomains.map(domain=>[domain.id,domain.frames]),
  [['root',10],['sprite-2',1],['sprite-55',389]],'root/title/main domains');
 equal(audit.frameDomains[0].entryInstances.map(row=>[row.objectId,row.depth,row.name]),
  [[2,1,'Mc_Page_Title'],[55,3,'animation']],'root depth order');
 equal([audit.stage.widthPx,audit.stage.heightPx,audit.frameDomains[0].fps],
  [800,600,12],'source stage and FPS');
 equal(displayList.root.instances.map(row=>[row.objectId,row.depth,row.name]),
  [[2,1,'Mc_Page_Title'],[55,3,'animation']],'display-list root');
 equal([displayList.root.frameCount,displayList.sprite55.frameCount,
  displayList.textDefinitions.length,audit.text.definitions.length,
  audit.text.instances.length],
  [10,389,31,31,47],'source text and frame counts');
 const sprite=displayList.sprite55.instances;
 equal([sprite.filter(row=>row.kind==='text').length,
  sprite.filter(row=>row.kind==='button').length,
  displayList.buttonIds],
  [47,20,BUTTONS.map(([,id])=>id)],'source text/button instances');
 equal(audit.masks.map(row=>[row.firstPlacementFrame,row.shapeCharacterId,
  row.depth,row.clipDepth]),MASKS,'source clip masks');
 equal(canvas.sourceClipMasks.map(row=>[row.frame,row.characterId,row.depth,
  row.clipDepth]),MASKS,'Canvas clip masks');
 equal([native.animationId,native.sourceSwfSha256,native.rootFrameCount,
  native.rootEntryFrame,native.frameDomain,native.mainFrameCount,
  native.definitions.length,native.instances.length,native.glossary.length],
  [ID,SOURCE.sha256,10,6,'sprite-55',389,31,84,20],
  'native source geometry domains');
 equal([native.nativeTextInstanceIds.length,native.canvasFallbackTextInstanceIds.length],
  [10,37],'native/canvas text ownership split');
 const nativeById=new Map(native.instances.map(row=>[row.instanceId,row]));
 equal(nativeById.size,native.instances.length,'unique native source instances');
 for(const sourceInstance of sprite){
  const instance=nativeById.get('sprite-55/'+sourceInstance.instanceId);
  assert(instance,'missing native display instance '+sourceInstance.instanceId);
  equal([instance.objectId,instance.depth,compactFrames(instance)],
   [sourceInstance.objectId,sourceInstance.depth,sourceFrames(sourceInstance)],
   'source/native per-instance frame ownership '+sourceInstance.instanceId);
 }
 equal([...native.nativeTextInstanceIds,...native.canvasFallbackTextInstanceIds].sort(),
  sprite.filter(row=>row.kind==='text')
   .map(row=>'sprite-55/'+row.instanceId).sort(),
  'all source text instances have exactly one native or Canvas owner');
 equal(native.nativeTextInstanceIds.map(id=>nativeById.get(id)?.objectId).sort((a,b)=>a-b),
  [...TEXT_IDS].sort((a,b)=>a-b),'only audited static text has native ownership');
 for(const [firstFrame,objectId,depth,clipDepth] of MASKS){
  const instance=sprite.find(row=>row.objectId===objectId&&row.depth===depth&&
   row.placedFrame===firstFrame);
  assert(instance,'native mask source placement '+firstFrame);
  equal(nativeById.get('sprite-55/'+instance.instanceId)?.clipDepth,clipDepth,
   'native mask clip depth');
 }
 equal(audit.glossary.map(row=>[row.keyAttribute,row.buttonCharacterId]),BUTTONS,
  'seven exact source glossary keys');
 equal(audit.glossary.map(row=>row.actionsInOrder),
  BUTTONS.map(()=>['_global.KeyAttribute = key','_root.DoHyperLinks()',
   '_root.animation_mc.animation.stop()']),'source glossary action order');
 equal(native.glossary.length,20,'all source button placements are mapped');
 const nativeButtons=new Set();
 for(const control of native.glossary){
  const sourceButton=audit.glossary.find(row=>row.keyAttribute===control.key);
  const instance=nativeById.get(control.instanceId);
  const label=nativeById.get(control.label.textInstanceId);
  assert(sourceButton&&instance&&label,'glossary button/label source instance');
  equal([control.buttonId,instance.objectId,control.sourceActionSha256,
   control.label.textId,label.objectId,control.hitShapeBoundsTwips],
   [sourceButton.buttonCharacterId,sourceButton.buttonCharacterId,
    sourceButton.actionExport.sha256,control.label.textId,control.label.textId,
    [-1518,1517,-205,204]],'glossary instance and label identity');
  assert(!nativeButtons.has(control.instanceId),'duplicate button instance');
  nativeButtons.add(control.instanceId);
 }
 equal(nativeButtons.size,20,'all button instances uniquely mapped');
 equal(crosswalk.kind,'p026-seven-source-glossary-v1','source dictionary crosswalk');
 equal(crosswalk.entries.map(row=>row.sourceKeyAttribute).sort(),
  BUTTONS.map(([key])=>key).sort(),'bilingual glossary source keys');
 for(const entry of crosswalk.entries){
  assert(entry.labels.en&&entry.labels.es&&entry.definitions.en&&entry.definitions.es,
   'complete bilingual dictionary entry '+entry.sourceKeyAttribute);
  equal([entry.source.en.sha256,entry.source.es.sha256],
   [DICTIONARY_EN.sha256,DICTIONARY_ES.sha256],
   'physical bilingual dictionary '+entry.sourceKeyAttribute);
 }
 equal([canvas.animationId,canvas.source.sha256,canvas.rootFrameCount,
  canvas.mainFrameCount,canvasMetadata.assetSha256,
  canvasMetadata.sourceGlyphRendering.auditedStaticTextIds,
  canvasMetadata.sourceGlyphRendering.suppressTextIdsSupported],
  [ID,SOURCE.sha256,10,389,canvas.outputs[0].sha256,TEXT_IDS,true],
  'maintained Canvas source and selective text contract');
 equal(canvas.outputs[0].path,ASSETS.canvas,'maintained Canvas asset path');
 equal([audit.audio.embeddedMain.domain,audit.audio.embeddedMain.blockCount,
  audit.audio.embeddedMain.gapWithoutBlocks,
  audit.audio.embeddedMain.declaredSamples],
  ['sprite-55',322,[159,195],589248],'source two-run audio domain');
 equal(audit.audio.embeddedMain.ranges.map(row=>[
  ...row.frameSpan,row.declaredSamples,row.mp3Bytes,row.mp3PayloadSha256]),
  RANGES,'source main run identity');
 equal(audit.audio.embeddedMain.negativeSeekBlocks.map(row=>[
  row.frame,row.samples,row.seek,row.mp3Bytes]),[[158,0,-2267,0]],
  'negative-seek empty marker');
 equal([audioPlan.frameDomain,audioPlan.fps,audioPlan.visualFrames,
  audioPlan.gap.frames,audioPlan.gap.sourceSoundStreamBlocks],
  ['sprite-55',12,389,[159,195],0],'planned visual gap');
 equal(audioPlan.mainRanges.map(row=>[
  ...row.blockFrameRange,row.declaredSamples,row.sourceMp3.bytes,
  row.sourceMp3.sha256]),RANGES,'separate main assets');
 equal(audioPlan.mainRanges.map(row=>row.sourceMp3.path),
  [ASSETS.main1,ASSETS.main2],'non-concatenated source paths');
 equal([audioPlan.optionalSpanishAudio.asset.path,
  audioPlan.optionalSpanishAudio.asset.bytes,
  audioPlan.optionalSpanishAudio.asset.sha256,
  audioPlan.optionalSpanishAudio.activation,
  audioPlan.optionalSpanishAudio.localeAutoplay,
  audioPlan.optionalSpanishAudio.joinedWithMain],
  [ASSETS.sa,SA.bytes,SA.sha256,'explicit-user-only',false,false],
  'independent user-triggered SA');
 equal(browserDecode.results.map(row=>[
  row.id,row.sourceBytes,row.sourceSha256,row.sampleRate,row.channels,
  row.samples,row.pcmSha256]),
  [['main-1',52520,RANGES[0][4],22050,1,232704,CHROME_PCM[0]],
   ['main-2',80470,RANGES[1][4],22050,1,356544,CHROME_PCM[1]],
   ['separate-sa',SA.bytes,SA.sha256,48000,1,414720,CHROME_PCM[2]]],
  'Chrome decoded source pins');
 assert(Object.values(browserDecode.acceptanceEffects).every(value=>value===false),
  'Chrome decode does not imply listening, host or original-runtime acceptance');
 equal(audioPlan.limits,{nativeDecodeObserved:true,browserDecodeObserved:false,
  originalRuntimeObserved:false,sourceSyncAccepted:false,listeningAccepted:false,
  audioAccepted:false,registeredCurrentJs:false,playbackObserved:false},
  'audio plan retains independent limits');
 return true;
}

/** Read all source evidence and independently hash physical assets. */
export function readP026SourceEvidence(root=ROOT){
 for(const item of external)readPin(item.root,item.pin);
 const result=Object.fromEntries(Object.entries(EVIDENCE).map(([key,name])=>
  [key,readJsonPin(root,pinFile(root,name))]));
 validateP026SourceEvidence(result);
 const assetPins=Object.fromEntries(Object.entries(ASSETS).map(([key,name])=>
  [key,pinFile(root,name)]));
 equal([assetPins.canvas.bytes,assetPins.canvas.sha256],
  [result.canvas.outputs[0].bytes,result.canvas.outputs[0].sha256],
  'generated Canvas output bytes');
 equal([assetPins.main1.bytes,assetPins.main1.sha256,
  assetPins.main2.bytes,assetPins.main2.sha256,
  assetPins.sa.bytes,assetPins.sa.sha256],
  [RANGES[0][3],RANGES[0][4],RANGES[1][3],RANGES[1][4],SA.bytes,SA.sha256],
  'three independent audio assets');
 return {...result,assetPins,evidencePins:Object.fromEntries(
  Object.entries(EVIDENCE).map(([key,name])=>[key,pinFile(root,name)]))};
}

/** The binding packet is added only after every P026 source input is frozen. */
export function readP026CanonicalSource(root=ROOT){
 const evidence=readP026SourceEvidence(root);
 const bindingPin=BINDING,binding=readJsonPin(root,bindingPin);
 equal([binding.schemaVersion,binding.kind,binding.animationId,binding.source],
  [1,'alg-l06-p026-candidate-source-binding-v1',ID,SOURCE],
  'exact P026 source binding');
 equal(binding.external,external,'five physical source/dictionary pins');
 equal([binding.files.length,binding.artifacts,
  binding.limits,binding.acceptanceEffects],
  [163,proposedP026Artifacts(root,evidence.canvas),
   {candidateOnly:true,sourceEnglishFallback:true,optionalSpanishExplicit:true,
    optionalSpanishSpliced:false,originalHostRunObserved:false},
   ACCEPTANCE],'bounded source packet and staged artifacts');
 equal(binding.predecessorIndex,{path:'catalog/g678-admission-v1/index-v91.json',
  bytes:6651,sha256:'3f35ecf1104a7bb886ffa10cbed820eb48812d3337d2b5109f4616ab1520410e'},
  'predecessor index pin');
 equal(binding.predecessorHost,{path:'catalog/g678-admission-v1/host-v91.json',
  bytes:134459,sha256:'5c4818c72b54a3bc673f7dfe06a1affd555848fde54f77781d97c5c1e2b4ef95'},
  'predecessor host pin');
 equal(uniquePins(binding.files),binding.files,'unique sorted local source pins');
 const pinned=new Map(binding.files.map(pin=>[pin.path,pin]));
 for(const pin of [...Object.values(evidence.evidencePins),...Object.values(evidence.assetPins)])
  equal(pinned.get(pin.path),pin,'bound source input '+pin.path);
 for(const key of Object.keys(EVIDENCE))
  equal(binding[key],evidence.evidencePins[key],'named bound evidence '+key);
 for(const pin of binding.files)readPin(root,pin);
 const index=readJsonPin(root,binding.predecessorIndex),
  p025=index.pages.find(row=>row.animationId==='shared-alg001-l06-p025');
 checked(p025?.proof,'exact admitted P025 predecessor proof');
 const prior=readJsonPin(root,p025.proof);
 equal(prior.animationId,'shared-alg001-l06-p025','P025 predecessor identity');
 const predecessorAssets={
  canvas:prior.legacyInputs.find(pin=>pin.path===
   'output/alg-l06-p025-canvas-v2/canvas-renderer.js'),
  main1:prior.legacyInputs.find(pin=>pin.path===
   'output/alg-l06-p025-audio-v1/sprite-21-source-v1.mp3')};
 checked(predecessorAssets.canvas&&predecessorAssets.main1,
  'two exact predecessor resource pins');
 for(const pin of Object.values(predecessorAssets))readPin(root,pin);
 return {...evidence,binding,bindingPin,external,predecessorAssets};
}

export function proposedP026Artifacts(root,canvasManifest){
 const output=canvasManifest.outputs.find(row=>row.path===ASSETS.canvas);
 assert(output,'P026 maintained Canvas output');
 const runtime=pinFile(root,ARTIFACT_PATHS.runtime);
 equal([runtime.bytes,runtime.sha256],[output.bytes,output.sha256],
  'exact staged P026 Canvas bytes');
 return {module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime};
}

export function p026Runtime(artifacts){
 return {frameDomain:'sprite-55',frameCount:389,rootFrameCount:10,
  rootBeginFrame:6,fps:12,stage:{width:800,height:600},
  scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
  terminalPolicy:'two-source-main-runs-with-gap-and-final-frame-hold',
  hostPlaybackCompletion:false};
}

export function p026ProposedEntry(root,source){
 const canonical=source??readP026CanonicalSource(root);
 const artifacts=canonical.artifacts??
  proposedP026Artifacts(root,canonical.canvas);
 return {key:ID,module:'./modules/'+ID,maturity:'private-current-js',
  complexityLane:'interactive-understood',artifacts};
}

export function p026ContinuousSource(source){
 const main=source.audioPlan.mainRanges.map((range,index)=>({
  id:range.id,blockFrameRange:range.blockFrameRange,
  asset:core(source.assetPins[index===0?'main1':'main2']),
  browserDecodedSamples:source.browserDecode.results[index].samples,
  browserPcmSha256:source.browserDecode.results[index].pcmSha256}));
 return {audit:source.binding.audit,plan:source.binding.audioPlan,
  browserDecode:source.binding.browserDecode,frameDomain:'sprite-55',
  visualFrames:389,mainRuns:main,gapFrames:[159,195],
  emptyNegativeSeekMarker:{frame:158,seekSamples:-2267,payloadBytes:0},
  concatenated:false,sourceSyncAccepted:false,originalRuntimeAccepted:false,
  listeningAccepted:false,audioAccepted:false};
}
export function p026OptionalSpanishAudio(source){
 return {source:SA,asset:core(source.assetPins.sa),
  browserDecodedSamples:source.browserDecode.results[2].samples,
  browserPcmSha256:source.browserDecode.results[2].pcmSha256,
  trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
  audioAccepted:false};
}
export function p026NativeTextSource(source){
 return {state:source.binding.native,frameDomain:'sprite-55',frames:389,
  staticTextDefinitions:31,nativeInstanceCount:10,canvasFallbackInstanceCount:37,
  suppressibleTextIds:TEXT_IDS,sourceEnglishFallback:true,
  originalRuntimeAccepted:false};
}
export function p026GlossaryActions(source){
 return Object.fromEntries(BUTTONS.map(([key,id])=>{
  const entry=source.crosswalk.entries.find(row=>row.sourceKeyAttribute===key),
   action=source.audit.glossary.find(row=>row.keyAttribute===key),
   controls=source.native.glossary.filter(row=>row.key===key);
  assert(entry&&action&&controls.length,'complete P026 glossary source '+key);
  return [key,{characterId:id,sourceKey:key,entryId:entry.id,
   sourceActionSha256:action.actionExport.sha256,
   buttonInstanceIds:controls.map(row=>row.instanceId),
   originalClickObserved:false}];
 }));
}

/** Source-only page packet for freeze/preflight. It does not admit the page. */
export function validateP026SourcePacket(proof,registration,root=ROOT,sourceOverride=null){
 const source=sourceOverride??readP026CanonicalSource(root),
  entry=p026ProposedEntry(root,source);
 equal([proof.schemaVersion,proof.calibrationId,proof.sourceRoot,proof.scope,
  proof.deploymentScope,proof.source,proof.sourceXml],
  [1,CALIBRATION,SOURCE_ROOT,'private-engineering','local-only',SOURCE,XML],
  'P026 proof identity');
 equal(proof.entry,entry,'exact P026 candidate entry');
 equal(proof.selectedPages,[{animationId:ID,placementId:ID,
  assetId:'swf-'+SOURCE.sha256,sourceSha256:SOURCE.sha256,
  moduleCode:'ALG001',lessonNumber:6,globalPageOrdinal:26,
  sourceOccurrence:26,sectionCode:'VB',sectionPageOrdinal:16,
  complexityLane:'interactive-understood',runtime:p026Runtime(entry.artifacts)}],
  'source-ordered P026 page');
 equal(proof.continuousSource,p026ContinuousSource(source),
  'two separate source main runs and silent gap');
 equal(proof.optionalSpanishAudio,p026OptionalSpanishAudio(source),
  'explicit independent SA');
 equal(proof.nativeTextSource,p026NativeTextSource(source),
  'per-instance native text source');
 equal(proof.glossaryActions,p026GlossaryActions(source),
  'seven source glossary actions');
 equal(proof.acceptanceEffects,ACCEPTANCE,'separate acceptance gates');
 equal([proof.productCalibrationPassed,proof.scaleOutAuthorized],
  [false,false],'candidate-only scale boundary');
 assert.equal(proof.freezeManifest.path,FREEZE_PATH,'P026 freeze path');
 equal(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:proof.freezeManifest.bytes,
  freezeManifestSha256:proof.freezeManifest.sha256,entries:[entry]},
  'proposed registration requires exact generated artifacts');
 assert.equal(proof.integrity.completeTransitiveClosure,false,
  'source packet does not establish full completion');
 const expected=uniquePins([source.bindingPin,...source.binding.files,
  ...Object.values(entry.artifacts)]);
 const evidence=new Map(proof.integrity.files.map(pin=>[pin.path,pin]));
 equal(evidence.size,proof.integrity.files.length,'unique proof input paths');
 for(const pin of expected)
  equal(evidence.get(pin.path),pin,'current P026 source input '+pin.path);
 for(const pin of proof.integrity.files){
  assert(!FORBIDDEN.has(pin.path)&&pin.path!==PROOF_PATH&&
   pin.path!==FREEZE_PATH,'registration-dependent P026 evidence '+pin.path);
  readPin(root,pin);
 }
 return true;
}

const localRoute=locale=>`http://127.0.0.1:3331/${locale}/migration-status/g678-calibration/${ID}/candidate-v1?mode=focus`;
const assetUrl=(token,sha)=>`http://127.0.0.1:3331/flash-assets/g678-local/${ID}/${token}?sha256=${sha}`;
const player=(state,phase,frame,owner='main',sa='idle')=>{
 equal([state.p026Player,state.p026PlayerPhase,state.p026PlayerFrame,
  state.p026AudioOwner,state.p026SaPhase,state.p026AudioPolicy],
  ['true',phase,String(frame),owner,sa,
   'explicit-two-main-ranges-and-separate-sa'],'real P026 player state');
};
const noErrors=(row,label)=>{
 equal(row.pageErrors,[],`${label} page errors`);
 equal(row.consoleErrors,[],`${label} console errors`);
};

function validateNativeMain(raw,locale,source){
 equal([raw.kind,raw.locale,raw.url,raw.status],
  ['p026-real-my-lesson-native-main-v1',locale,localRoute(locale),'passed'],
  `${locale} real My Lesson route`);
 noErrors(raw,`${locale} natural main`);
 player(raw.initial.dataset,'ready',1);
 equal([raw.initial.nodes,raw.initial.saRequests],[0,0],
  `${locale} no autoplay or early Spanish request`);
 equal(raw.initial.decoded,[
  {samples:232704,sampleRate:22050,channels:1},
  {samples:356544,sampleRate:22050,channels:1}],
  `${locale} two independent browser-decoded main buffers`);
 player(raw.final.dataset,'timeline-ended',389);
 checked(raw.final.alerts?.length===0,`${locale} no runtime alert`);
 equal(raw.requests,[assetUrl('canvas-renderer.js',source.assetPins.canvas.sha256),
  assetUrl('main-1',source.assetPins.main1.sha256),
  assetUrl('main-2',source.assetPins.main2.sha256)],
  `${locale} exact main and Canvas requests without SA`);
 const audio=raw.final.audio;
 equal(audio.decoded,raw.initial.decoded,`${locale} no late audio decode`);
 equal(audio.contexts.map(row=>row.sampleRate),[22050],
  `${locale} one native main clock`);
 equal(audio.nodes.length,2,`${locale} two non-concatenated main nodes`);
 for(let i=0;i<2;i++){
  const node=audio.nodes[i],seek=i===0?1673:541,
   framesBefore=i===0?30:195,
   expectedSamples=i===0?232704:356544;
  equal([node.samples,node.contextRate,node.starts.length,node.stops.length,
   node.ended.length,node.ended[0].stopCalled],
   [expectedSamples,22050,1,0,1,false],
   `${locale} native source range ${i+1} natural EOF`);
  const start=node.starts[0],end=node.ended[0];
  checked(start.player?.frame===1&&start.player?.owner==='main'&&
   start.player?.phase==='start-pending',`${locale} main range scheduled by user Play`);
  checked(Math.abs(start.args[1]-seek/22050)<1e-8&&
   Math.abs((start.args[0]-start.time)-framesBefore/12)<0.11,
   `${locale} source range ${i+1} retained seek and frame scheduling`);
  checked(Math.abs((end.time-start.args[0])-(expectedSamples-seek)/22050)<0.03,
   `${locale} native EOF timing`);
  checked(end.player?.owner==='main'&&end.player?.phase==='playing'&&
   (i===0?end.player.frame>=156&&end.player.frame<=158:end.player.frame===389),
   `${locale} native EOF frame`);
 }
 const trace=audio.trace;
 checked(Array.isArray(trace)&&trace.length>0,`${locale} native frame trace`);
 for(const frame of [31,158,159,195,196,389])
  checked(trace.some(row=>row.frame===frame&&row.phase==='playing'&&row.owner==='main'),
   `${locale} source frame ${frame} observed while playing`);
 checked(trace.some(row=>row.frame===389&&row.phase==='timeline-ended'),
  `${locale} terminal frame held after second native EOF`);
 return true;
}

function validateControls(raw,source){
 equal([raw.kind,raw.status],['p026-real-my-lesson-controls-v1','passed'],
  'real My Lesson glossary and optional SA');
 noErrors(raw,'controls');
 equal(raw.glossary.map(row=>row.key),BUTTONS.map(([key])=>key),
  'seven exact source glossary keys');
 for(const row of raw.glossary){
  checked(source.native.glossary.some(control=>control.key===row.key&&
   control.instanceId===row.iid),`real source button instance ${row.key}`);
  equal([row.openedFrame,row.closedFrame,row.closedPhase,row.focusRestored],
   ['389','389','timeline-ended',true],`glossary hold and focus ${row.key}`);
 }
 player(raw.replay.dataset,'ready',1);
 equal(raw.replay.dataset.p026PlayerReplay,'1','Replay remains held at first frame');
 const held=Number(raw.held.dataset.p026PlayerFrame);
 checked(Number.isSafeInteger(held)&&held>=31&&held<159,
  'main pause in first source range');
 player(raw.held.dataset,'paused',held);
 player(raw.pauseCheck.dataset,'paused',held);
 player(raw.spanishPlaying.dataset,'playing',held,'spanish','playing');
 player(raw.spanishEnded.dataset,'ended',held,'spanish','ended');
 const saNodes=raw.spanishEnded.audio.nodes.filter(node=>node.samples===414720);
 equal(saNodes.length,1,'one independent optional Spanish node');
 equal([saNodes[0].contextRate,saNodes[0].starts.length,
  saNodes[0].stops.length,saNodes[0].ended.length,
  saNodes[0].ended[0].stopCalled],
  [48000,1,0,1,false],'optional Spanish natural EOF');
 checked(raw.spanishEnded.audio.nodes.filter(node=>
  [232704,356544].includes(node.samples)&&node.stops.length===1).length>=2,
  'held main nodes retired before optional Spanish audio');
 const returned=Number(raw.returned.dataset.p026PlayerFrame),
  continued=Number(raw.continued.dataset.p026PlayerFrame);
 checked(returned>=held&&returned<=held+8&&continued>held,
  'explicit Return resumes from held main cursor');
 player(raw.returned.dataset,'playing',returned);
 player(raw.continued.dataset,'playing',continued);
 return true;
}

function validateNavigation(raw){
 equal([raw.kind,raw.status],['p026-real-my-lesson-navigation-v1','passed'],
  'real My Lesson P025/P026 navigation');
 noErrors(raw,'navigation');
 checked(raw.before.p026.p026Player==='true'&&
  raw.before.p026.p026PlayerPhase==='paused','P026 active before leaving');
 equal([raw.previous.p026.p026Player,raw.previous.p025.p025Player,
  raw.previous.p025.p025PlayerPhase,raw.previous.p025.p025PlayerFrame],
  [undefined,'true','ready','1'],'previous page is actual P025');
 equal([raw.returned.p025.p025Player,raw.returned.p026.p026Player,
  raw.returned.p026.p026PlayerPhase,raw.returned.p026.p026PlayerFrame],
  [undefined,'true','ready','1'],'return creates fresh P026');
 checked(raw.previous.events.some(event=>event.event==='context-state'&&
  event.id===1&&event.state==='closed'),
  'P026 main context closed on navigation');
 const mobile=raw.mobile;
 equal([mobile.width,mobile.rootFont,mobile.documentWidth],[390,'32px',390],
  '390 px / root 32 host reflow');
 checked(mobile.canvas.x>=0&&mobile.canvas.width>0&&
  mobile.canvas.x+mobile.canvas.width<=391,'Canvas within mobile viewport');
 checked(mobile.buttons.length>0&&mobile.buttons.every(button=>
  button.x>=0&&button.x+button.width<=391&&button.height>=44),
  'visible mobile controls stay reachable');
 return true;
}

function validateHttp(raw,source){
 equal([raw.kind,raw.status,raw.origin,raw.registeredResourcePins,
  raw.bindingVersion,raw.registered,raw.locales],
  ['p026-real-local-http-boundary-v2','passed','http://127.0.0.1:3331',
   100,'v4',false,['en','es']],'exact local HTTP scope');
 equal(raw.acceptanceEffects,ACCEPTANCE,'HTTP makes no acceptance claim');
 equal(raw.testedResourceTokens,['canvas-renderer.js','main-1','main-2',
  'optional-spanish-audio-v1','p025-canvas-renderer.js','p025-main-1'],
  'bounded own and inherited HTTP resource probes');
 equal(raw.negatives,['no-referer','wrong-referer','foreign-origin','cross-site',
  'navigate-dest','range','bad-forwarded-host','bad-forwarded-proto',
  'wrong-hash','extra-query','unknown-token','post','localhost-host'],
  'exact HTTP denial matrix');
 equal(raw.requests.length,29,'two documents, twelve assets, thirteen denials and two HEADs');
 const rows=raw.requests;
 for(let localeIndex=0;localeIndex<2;localeIndex++){
  const locale=['en','es'][localeIndex],offset=localeIndex*7,
   document=rows[offset],route=localRoute(locale);
  equal([document.url,document.method,document.status],[route,'GET',200],
   `${locale} candidate document`);
  checked(document.responseHeaders['x-robots-tag']?.includes('noindex'),
   `${locale} noindex`);
  for(let i=0;i<6;i++){
   const token=raw.testedResourceTokens[i],row=rows[offset+i+1],
    isOwn=!token.startsWith('p025-'),
    ownToken=isOwn?token:null,
    inheritedToken=isOwn?null:token.slice(5),
    pin=isOwn?source.assetPins[ownToken==='canvas-renderer.js'?'canvas':
      ownToken==='main-1'?'main1':ownToken==='main-2'?'main2':'sa']:null;
   const expected=isOwn?pin:inheritedToken==='canvas-renderer.js'?
    source.predecessorAssets.canvas:source.predecessorAssets.main1;
   checked(expected,`bound ${locale} resource ${token}`);
   const pathname=isOwn?`/flash-assets/g678-local/${ID}/${token}`:
    `/flash-assets/g678-local/shared-alg001-l06-p025/${inheritedToken}`;
   equal([row.url,row.method,row.status,row.bytes,row.sha256],
    [`http://127.0.0.1:3331${pathname}?sha256=${expected.sha256}`,
     'GET',200,expected.bytes,expected.sha256],`${locale} exact HTTP bytes ${token}`);
   equal(row.headers,{referer:route,'sec-fetch-site':'same-origin',
    'sec-fetch-mode':'cors','sec-fetch-dest':token.includes('canvas')?'script':'empty',
    origin:'http://127.0.0.1:3331'},`${locale} scoped resource request ${token}`);
   checked(row.responseHeaders['x-robots-tag']?.includes('noindex')&&
    row.responseHeaders['cache-control']?.includes('no-store')&&
    row.responseHeaders['content-type']?.startsWith(token.includes('canvas')?
     'text/javascript':'audio/mpeg'),`${locale} resource protection ${token}`);
  }
 }
 const firstNegative=14,main=source.assetPins.main1;
 const url=assetUrl('main-1',main.sha256),origin='http://127.0.0.1:3331',
  headers={referer:localRoute('en'),'sec-fetch-site':'same-origin',
   'sec-fetch-mode':'cors','sec-fetch-dest':'empty',origin};
 const negativeRequests=[
  [url,{...headers,referer:''},'GET'],
  [url,{...headers,referer:origin+'/en/courses/alg001/l6'},'GET'],
  [url,{...headers,origin:'https://example.com'},'GET'],
  [url,{...headers,'sec-fetch-site':'cross-site'},'GET'],
  [url,{...headers,'sec-fetch-dest':'document'},'GET'],
  [url,{...headers,range:'bytes=0-9'},'GET'],
  [url,{...headers,'x-forwarded-host':'example.com'},'GET'],
  [url,{...headers,'x-forwarded-proto':'https'},'GET'],
  [url.replace(main.sha256,'0'.repeat(64)),headers,'GET'],
  [url+'&other=1',headers,'GET'],
  [url.replace('main-1','unknown-token'),headers,'GET'],
  [url,headers,'POST'],
  [url.replace('127.0.0.1','localhost'),headers,'GET']];
 for(let i=0;i<13;i++){
  const row=rows[firstNegative+i],name=raw.negatives[i];
  equal([row.url,row.headers,row.method,row.status,row.bytes],
   [...negativeRequests[i],name==='post'?405:404,0],
   `HTTP ${name} exact denial`);
  checked(row.sha256!==main.sha256,`HTTP ${name} without source bytes`);
 }
 const head=rows[27],scriptHead=rows[28];
 equal([head.url,head.headers,head.method,head.status,head.bytes,
  head.responseHeaders['content-length']],
  [url,headers,'HEAD',200,0,String(main.bytes)],'main HEAD metadata only');
 equal([scriptHead.url,scriptHead.headers,scriptHead.method,scriptHead.status,
  scriptHead.bytes],
  [assetUrl('canvas-renderer.js',source.assetPins.canvas.sha256),
   {...headers,'sec-fetch-dest':'script'},'HEAD',404,0],
  'script HEAD denied');
 return true;
}

function validateResponsive(raw){
 equal([raw.kind,raw.status,raw.url],
  ['p026-es-final-native-reflow-v1','passed',localRoute('es')],
  'Spanish final-frame responsive case');
 noErrors(raw,'responsive ES');
 const layout=raw.layout;
 equal([layout.width,layout.documentWidth,layout.frame,layout.textLanguage,
  layout.policy,layout.keys],
  [390,390,'389','en','source-en-fallback',BUTTONS.map(([key])=>key)],
  'source-English fallback and seven ES-route keys');
 equal(layout.alerts,[],'no mobile runtime alerts');
 checked(layout.canvas.x>=0&&layout.canvas.width>0&&
  layout.canvas.x+layout.canvas.width<=391,'responsive source drawing fits');
 checked(layout.controls.length>=7&&layout.controls.every(control=>
  BUTTONS.some(([key])=>key===control.key)&&control.x>=0&&
  control.x+control.width<=391&&control.height>=44&&
  control.fontSize==='32px'),'seven glossary terms remain usable at root 32');
 return true;
}

/** Pure replay of the raw My Lesson and HTTP observations, not receipt booleans. */
export function validateP026EngineeringRaw(raw,source){
 checked(raw&&source?.assetPins&&source?.native&&source?.binding,
  'P026 raw evidence and exact source packet required');
 validateNativeMain(raw.nativeMainEn,'en',source);
 validateNativeMain(raw.nativeMainEs,'es',source);
 validateControls(raw.controls,source);
 validateNavigation(raw.navigation);
 validateHttp(raw.http,source);
 validateResponsive(raw.responsive);
 return true;
}

const BROWSER_DIR='output/playwright/alg-l06-p026-candidate-host-v1/';
const RAW_PATHS=Object.freeze({
 nativeMainEn:BROWSER_DIR+'native-final-en.json',
 nativeMainEs:BROWSER_DIR+'native-final-v2-es.json',
 controls:BROWSER_DIR+'native-controls-v3.json',
 navigation:BROWSER_DIR+'native-navigation.json',
 http:BROWSER_DIR+'http-boundary-v2.json',
 responsive:BROWSER_DIR+'responsive-es.json'});
const STABLE_PATHS=Object.freeze({
 nativeMainEn:BROWSER_DIR+'stable-native-final-en-v1.json',
 nativeMainEs:BROWSER_DIR+'stable-native-final-es-v2.json',
 controls:BROWSER_DIR+'stable-controls-en-v3.json',
 navigation:BROWSER_DIR+'stable-navigation-v1.json',
 http:BROWSER_DIR+'stable-http-v2.json',
 responsive:BROWSER_DIR+'stable-responsive-es-v1.json'});
const CASES={nativeMainEn:true,nativeMainEs:true,glossary7:true,replay:true,
 explicitSpanish:true,explicitReturn:true,navigation:true,cleanup:true};

function validateHistoricalApplicability(receipt,source,artifacts,root){
 const pin=artifacts.get(BROWSER_DIR+'v2-to-v4-applicability-v1.json');
 checked(pin,'P026 historical applicability pin required');
 const applicability=readJsonPin(root,pin),old=readJsonPin(root,HISTORICAL_BINDING);
 equal([old.files.length,source.binding.files.length],[160,163],
  'historical and current source packet sizes');
 const before=new Map(old.files.map(item=>[item.path,item])),
  after=new Map(source.binding.files.map(item=>[item.path,item]));
 const changed=old.files.filter(item=>after.has(item.path)&&
  !samePin(item,after.get(item.path)))
  .map(item=>({before:item,after:after.get(item.path)}));
 const added=source.binding.files.filter(item=>!before.has(item.path)),
  removed=old.files.filter(item=>!after.has(item.path));
 equal([applicability.kind,applicability.changed,applicability.added,
  applicability.removed,applicability.unchangedCanvasClockNativeAudio,
  applicability.candidateMainAndHTTP],
  ['p026-v2-to-v4-evidence-applicability-v1',changed,added,removed,true,
   'fresh-v4-runs-required'],'bounded v2-to-v4 evidence applicability');
 equal(changed.map(item=>item.before.path),
  ['apps/web/lib/alg-l06-p026-resources-v1.server.ts'],
  'only resource reader changed');
 equal(added.map(item=>item.path),[
  'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l06-p026/continuous-v1/page.tsx',
  'apps/web/lib/alg-l06-p026-formal-admission-v1.server.ts',
  'apps/web/tests/alg-l06-p026-formal-admission-v1.test.ts'],
  'three formal-admission-only additions');
 checked(applicability.controlsNavigation?.includes('reusable only')&&
  applicability.acceptance?.includes('no original/runtime/listening'),
  'historical controls/navigation claim stays bounded');
 return old;
}

/** Hash-bind the receipt, six raw case sets and their stable-run source snapshots. */
export function validateP026EngineeringReceipt(receipt,root=ROOT,
 sourceOverride=null){
 const source=sourceOverride??readP026CanonicalSource(root);
 equal([receipt.schemaVersion,receipt.kind,receipt.animationId,receipt.status,
  receipt.bindingPin,receipt.indexPin,receipt.hostPin,receipt.registered,
  receipt.denominator,receipt.pageErrors,receipt.consoleErrors,
  receipt.acceptanceEffects,receipt.cases,receipt.raw],
  [1,'g678-p026-local-my-lesson-engineering-v1',ID,'passed',BINDING,
   source.binding.predecessorIndex,source.binding.predecessorHost,false,
   2282,[],[],ACCEPTANCE,CASES,RAW_PATHS],
  'exact P026 engineering receipt identity and independent gates');
 checked(Array.isArray(receipt.limits)&&receipt.limits.length>=4&&
  receipt.limits.some(line=>line.includes('Original host SA/return behavior remains unobserved')),
  'receipt retains original-host and acceptance limits');
 equal(uniquePins(receipt.artifacts),receipt.artifacts,
  'unique sorted P026 browser artifacts');
 const artifacts=new Map(receipt.artifacts.map(pin=>[pin.path,pin]));
 for(const pin of receipt.artifacts){
  checked(pin.path.startsWith(BROWSER_DIR)&&!pin.path.includes('..'),
   `bounded P026 browser artifact: ${pin.path}`);
  readPin(root,pin);
 }
 const raw={};
 for(const [name,file] of Object.entries(RAW_PATHS)){
  const pin=artifacts.get(file);
  checked(pin,`raw My Lesson artifact ${name}`);
  raw[name]=readJsonPin(root,pin);
  const screenshot=raw[name].screenshot;
  if(screenshot)checked(artifacts.has(screenshot),
   `raw screenshot is pinned: ${name}`);
 }
 validateP026EngineeringRaw(raw,source);
 const historical=validateHistoricalApplicability(receipt,source,artifacts,root);
 equal(Object.keys(receipt.stableRuns),Object.keys(STABLE_PATHS),
  'six independent stable browser runs');
 equal(receipt.stableRun,receipt.stableRuns.responsive,
  'latest responsive run is the receipt terminal run');
 const candidates=[];let registrySha256;
 for(const [name,file] of Object.entries(STABLE_PATHS)){
  const pin=receipt.stableRuns[name];
  checked(pin?.path===file&&samePin(artifacts.get(file),pin),
   `stable ${name} is an exact receipt artifact`);
  const stable=readJsonPin(root,pin);
  equal([stable.schemaVersion,stable.kind,stable.animationIds,stable.host,
   stable.phase,stable.exitCode,stable.drift,stable.status,stable.error],
   [1,'g678-stable-browser-run-v1',['shared-alg001-l06-p025'],
    source.binding.predecessorHost,'postflight',0,null,
    'stable-command-passed',null],
   `stable ${name} execution and exact predecessor host`);
  registrySha256??=stable.registrySha256;
  equal(stable.registrySha256,registrySha256,
   'one unchanged registry across all browser runs');
  checked(/^work\/g678-workflow\/browser-candidates\/p026-candidate-host-20261001-v\d+\.json$/u
   .test(stable.candidate?.path),`bounded ${name} candidate snapshot`);
  const candidate=readJsonPin(root,stable.candidate),
   historicalRun=name==='controls'||name==='navigation',
   expectedBinding=historicalRun?HISTORICAL_BINDING:BINDING,
   expectedFiles=historicalRun?historical.files:source.binding.files;
  equal([candidate.schemaVersion,candidate.kind,candidate.index,candidate.host,
   candidate.animationIds,candidate.registrySha256],
   [1,'g678-stable-browser-candidate-v1',source.binding.predecessorIndex,
    source.binding.predecessorHost,['shared-alg001-l06-p025'],registrySha256],
   `stable ${name} source and registry boundary`);
  checked(Object.values(candidate.acceptanceEffects).every(value=>value===false),
   `${name} stable candidate makes no downstream acceptance claim`);
  equal(uniquePins(candidate.files),candidate.files,
   `${name} unique stable candidate files`);
  const files=new Map(candidate.files.map(item=>[item.path,item]));
  checked(samePin(files.get(expectedBinding.path),expectedBinding),
   `${name} exact source-packet revision`);
  for(const item of expectedFiles)
   checked(samePin(files.get(item.path),item),
    `${name} frozen source input ${item.path}`);
  candidates.push(stable.candidate);
 }
 return {receipt,source,artifacts:receipt.artifacts,candidates,
  raw,registrySha256};
}

/** A source-only freeze cannot admit a page; proof closure binds later raw evidence. */
export function validateP026Page(proof,registration,root=ROOT){
 validateP026SourcePacket(proof,registration,root);
 checked(existsSync(path.join(root,ENGINEERING_RECEIPT_PATH)),
  'P026_ENGINEERING_RECEIPT_REQUIRED');
 checked(existsSync(path.join(root,PROOF_PATH)),
  'P026_ENGINEERING_PROOF_REQUIRED');
 const proofRecord=readJsonPin(root,pinFile(root,PROOF_PATH));
 equal([proofRecord.animationId,proofRecord.packet,proofRecord.registration],
  [ID,proof,registration],'exact written P026 proof packet and registration');
 const receiptPin=pinFile(root,ENGINEERING_RECEIPT_PATH),
  receipt=readJsonPin(root,receiptPin),
  engineering=validateP026EngineeringReceipt(receipt,root),
  required=uniquePins([receiptPin,...engineering.artifacts,...engineering.candidates]);
 for(const pin of required){
  checked(proofRecord.legacyInputs.some(item=>samePin(item,pin)),
   `P026 real browser evidence in legacy proof inputs: ${pin.path}`);
  checked(proofRecord.files.some(item=>samePin(item,pin)),
   `P026 real browser evidence in proof files: ${pin.path}`);
 }
 return true;
}
