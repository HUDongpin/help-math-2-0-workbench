/** P027 source semantics for a future local-only admission. No host acceptance. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';
import {DICTIONARY_ROOT,DICTIONARY_EN,DICTIONARY_ES}
 from './alg-l06-p025-admission-semantics-v1.mjs';

export const ID='shared-alg001-l06-p027';
export const CALIBRATION='g678-alg-l06-p027-source-only-preflight-20261001-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const BINDING_PATH='output/alg-l06-p027-product-integration-v1/candidate-source-binding-v2.json';
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB20.swf',bytes:262207,
 sha256:'689318e75aac8740344e8ff119df34a288e7da24dc3dc0c62c0f22601666f984'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB20.mp3',bytes:381360,
 sha256:'445005ae7c0a6f4896c686ad46c35e56847e4e977b991d5aa40add7a5e271cc0'};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,
 fidelityAccepted:false,audioAccepted:false,listeningAccepted:false,
 humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const KEYS=Object.freeze([
 ['Vertical-line test',7],['Function',8],['Graph',9],
 ['Vertical',16],['Line',17],['Point',21]]);
export const MASKS=Object.freeze([[2,2,1,10],[66,2,11,18],[195,2,19,24]]);
export const MORPH_WINDOWS=Object.freeze([[300,315],[414,429],[618,633],[660,675]]);
export const EVIDENCE=Object.freeze({
 sourcePlan:'output/alg-l06-p027-source-planning-20261001-v1/source-plan-v1.json',
 displayList:'output/alg-l06-p027-source-planning-20261001-v1/source-display-list-v1.json',
 native:'output/alg-l06-p027-native-text-v1/geometry-v1.json',
 canvas:'output/alg-l06-p027-canvas-v1/canvas-manifest.json',
 canvasMetadata:'output/alg-l06-p027-canvas-v1/canvas-metadata-v1.json',
 audioPlan:'output/alg-l06-p027-audio-extraction-v1/audio-domain-plan-v1.json',
 browserDecode:'output/alg-l06-p027-chrome-decode-v1/browser-decode.json',
 stableDecode:'output/alg-l06-p027-chrome-decode-v1/stable-decode-v1.json',
 crosswalk:'output/alg-l06-p027-product-integration-v1/six-term-crosswalk-v2.json'});
export const ASSETS=Object.freeze({
 canvas:'output/alg-l06-p027-canvas-v1/canvas-renderer.js',
 main:'output/alg-l06-p027-audio-extraction-v1/main-source-v1.mp3',
 sa:'output/alg-l06-p027-audio-extraction-v1/separate-sa-source-v1.mp3'});
const ROOT=fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const equal=(actual,expected,label)=>assert.deepEqual(actual,expected,label);
const core=pin=>({path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
const EXTERNAL=Object.freeze([{root:SOURCE_ROOT,pin:SOURCE},{root:SOURCE_ROOT,pin:XML},
 {root:SOURCE_ROOT,pin:SA},{root:DICTIONARY_ROOT,pin:DICTIONARY_EN},
 {root:DICTIONARY_ROOT,pin:DICTIONARY_ES}]);

/** Pure assertions permit mutation tests without touching preserved evidence. */
export function validateP027SourceEvidence(e){
 const {sourcePlan:plan,native,canvas,canvasMetadata,audioPlan,
  browserDecode,stableDecode,crosswalk}=e;
 equal([plan.identity.animationId,plan.identity.assetId,
  plan.identity.globalActiveOrdinal,plan.identity.activePageCountInLesson,
  plan.identity.sectionCode,plan.identity.sectionPageOrdinal,
  plan.source.swf,plan.source.lessonXml,plan.source.separateSa],
  [ID,'swf-'+SOURCE.sha256,27,60,'VB',17,SOURCE,XML,SA],
  'P027 source-ordered identity');
 equal(plan.frameDomains.map(row=>[row.id,row.frames,row.fps]),
  [['root',10,12],['sprite-46',770,12]],'source frame domains');
 equal([plan.frameDomains[0].entryFrame,
  plan.frameDomains[0].entrySprite.characterId,
  plan.stage.widthPx,plan.stage.heightPx],
  [6,46,800,600],'root entry and stage');
 equal([plan.visualStructure.textDefinitions,plan.visualStructure.textInstances,
  native.definitions.length,native.instances.filter(row=>
   new Set(native.definitions.map(item=>item.textId)).has(row.objectId)).length],
  [17,36,17,36],'all source text definitions and instances retained');
 equal(plan.visualStructure.masks.map(row=>[
  row.presentSpans[0][0],row.objectId,row.depth,row.clipDepth]),
  MASKS,'three source clip masks');
 equal(canvas.sourceClipMasks.map(row=>[row.frame,row.characterId,row.depth,row.clipDepth]),
  MASKS,'three maintained clip masks');
 equal(plan.visualStructure.morphCharacterIds,[37],'graph morph character');
 equal(plan.visualStructure.morphInstances.map(row=>row.presentSpans[0]),
  MORPH_WINDOWS,'four source graph morph windows');
 equal(canvas.sourceMorph,{characterId:37,windows:MORPH_WINDOWS,
  ratioStepsPerWindow:16},'maintained graph morph windows');
 equal(canvasMetadata.sourceMorph,canvas.sourceMorph,'runtime morph metadata');
 equal([native.animationId,native.sourceSwfSha256,native.frameDomain,
  native.rootFrameCount,native.rootEntryFrame,native.mainFrameCount,
  native.canvasSourceGlyphsPreserved,native.canvasInstanceSuppressionSupported],
  [ID,SOURCE.sha256,'sprite-46',10,6,770,true,false],
  'native geometry and no glyph suppression');
 equal([canvas.animationId,canvas.source.sha256,canvas.rootFrame,
  canvas.rootFrameCount,canvas.mainFrameCount,
  canvas.sourceGlyphRendering.default,
  canvas.sourceGlyphRendering.suppressTextIdsSupported],
  [ID,SOURCE.sha256,6,10,770,'preserve-all',false],
  'Canvas source glyph policy');
 equal(canvasMetadata.sourceGlyphRendering,canvas.sourceGlyphRendering,
  'runtime glyph policy');
 equal(plan.glossary.map(row=>[row.keyAttribute,row.buttonCharacterId]),
  KEYS,'six physical source glossary actions');
 equal(plan.glossary.map(row=>row.action.orderedEffects),
  KEYS.map(()=>['set _global.KeyAttribute','call _root.DoHyperLinks()',
   'stop _root.animation_mc.animation']),'source glossary action order');
 equal(native.glossary.map(row=>[row.key,row.buttonId]),KEYS,
  'six native source button bindings');
 equal(crosswalk.entries.map(row=>row.sourceKeyAttribute),KEYS.map(row=>row[0]),
  'six dictionary keys');
 for(const row of crosswalk.entries){
  assert(row.labels?.en&&row.labels?.es&&row.definitions?.en&&row.definitions?.es,
   'bilingual dictionary entry '+row.sourceKeyAttribute);
  equal([row.source.en.sha256,row.source.es.sha256],
   [DICTIONARY_EN.sha256,DICTIONARY_ES.sha256],
   'physical dictionary '+row.sourceKeyAttribute);
 }
 equal([audioPlan.frameDomain,audioPlan.fps,audioPlan.rootEntryFrame,
  audioPlan.visualFrames,audioPlan.main.firstBlockFrame,
  audioPlan.main.lastBlockFrame,audioPlan.main.blockCount,
  audioPlan.main.declaredSamples,audioPlan.main.zeroPayloadFrames],
  ['sprite-46',12,6,770,2,770,769,1412352,[3]],
  'source main audio domain');
 equal([audioPlan.sourceSwf,audioPlan.sourceXml,
  audioPlan.main.asset,audioPlan.optionalSpanishAudio.source,
  audioPlan.optionalSpanishAudio.asset],
  [SOURCE,XML,
   {path:ASSETS.main,bytes:318760,
    sha256:'8b2d1bf09c88647b4799108ad85ff563e744cc899226d1bb1b07ee1cc5551929'},
   SA,{path:ASSETS.sa,bytes:SA.bytes,sha256:SA.sha256}],
  'exact separate audio source assets');
 equal([audioPlan.optionalSpanishAudio.trigger,
  audioPlan.optionalSpanishAudio.localeAutoplay,
  audioPlan.optionalSpanishAudio.joinedWithMain],
  ['explicit-user-only',false,false],'independent optional SA');
 equal(browserDecode.results.map(row=>[row.id,row.sourceBytes,
  row.sourceSha256,row.sampleRate,row.channels,row.samples,row.pcmSha256]),
  [['main',318760,audioPlan.main.asset.sha256,22050,1,1412352,
    '3e10596ffffb94af1e262601a6d3e394769e59c3e944fa6e722309cae463c01b'],
   ['separate-sa',SA.bytes,SA.sha256,48000,1,1307520,
    '53e43c2fec6f2d845534ea4da6c94d25ef04aac268227da6fae678a7d71123d8']],
  'actual Chrome PCM decode, separate from FFmpeg');
 equal([browserDecode.kind,stableDecode.kind,stableDecode.status,
  stableDecode.phase,stableDecode.exitCode,stableDecode.drift],
  ['p027-chrome-native-decode-only','g678-stable-browser-run-v1',
   'stable-command-passed','postflight',0,null],
  'technical Chrome decode receipt');
 assert(Object.values(browserDecode.acceptanceEffects).every(value=>value===false),
  'decode does not grant playback or listening acceptance');
 assert(Object.values(audioPlan.limits).every(value=>value===false),
  'source audio plan retained pending gates');
 return true;
}

export function readP027SourceEvidence(root=ROOT){
 for(const item of EXTERNAL)readPin(item.root,item.pin);
 const evidence=Object.fromEntries(Object.entries(EVIDENCE).map(([key,file])=>
  [key,readJsonPin(root,pinFile(root,file))]));
 validateP027SourceEvidence(evidence);
 const evidencePins=Object.fromEntries(Object.entries(EVIDENCE).map(([key,file])=>
  [key,pinFile(root,file)]));
 const assetPins=Object.fromEntries(Object.entries(ASSETS).map(([key,file])=>
  [key,pinFile(root,file)]));
 equal(assetPins.canvas,evidence.canvas.outputs.find(row=>row.path===ASSETS.canvas),
  'exact maintained Canvas bytes');
 equal(assetPins.main,evidence.audioPlan.main.asset,'main MP3 bytes');
 equal(assetPins.sa,evidence.audioPlan.optionalSpanishAudio.asset,'SA MP3 bytes');
 readPin(root,evidence.sourcePlan.extraction.swfmillXml);
 readPin(root,evidence.sourcePlan.extraction.displayList);
 return {...evidence,evidencePins,assetPins,external:EXTERNAL};
}

/** The packet producer writes this separately; no provisional binding is inferred. */
export function readP027CanonicalSource(root=ROOT){
 const source=readP027SourceEvidence(root),bindingPin=pinFile(root,BINDING_PATH),
  binding=readJsonPin(root,bindingPin);
 equal([binding.schemaVersion,binding.kind,binding.animationId,binding.source],
  [1,'alg-l06-p027-candidate-source-binding-v1',ID,SOURCE],
  'P027 candidate source binding');
 equal(binding.external,EXTERNAL,'physical sources and dictionary scope');
 equal(binding.acceptanceEffects,ACCEPTANCE,'pending acceptance gates');
 equal(uniquePins(binding.files),binding.files,'sorted unique source pins');
 const bound=new Map(binding.files.map(pin=>[pin.path,pin]));
 for(const pin of [...Object.values(source.evidencePins),
  ...Object.values(source.assetPins)])
  equal(bound.get(pin.path),pin,'bound P027 source input '+pin.path);
 for(const pin of binding.files)readPin(root,pin);
 for(const [key,pin] of Object.entries(source.evidencePins)){
  if(key==='stableDecode')continue; // Frozen as an input, not a semantic field.
  equal(binding[key],pin,'named P027 evidence '+key);
 }
 equal(binding.audit,source.evidencePins.sourcePlan,
  'audit and source plan name the same exact source record');
 equal(binding.artifacts.module.path,
  `packages/demos/src/modules/${ID}.tsx`,'canonical module path');
 equal(binding.artifacts.timeline.path,
  `packages/demos/src/timelines/${ID}.ts`,'canonical timeline path');
 for(const pin of Object.values(binding.artifacts))readPin(root,pin);
 equal([binding.artifacts.runtime.bytes,binding.artifacts.runtime.sha256],
  [source.assetPins.canvas.bytes,source.assetPins.canvas.sha256],
  'staged Canvas runtime exact source bytes');
 assert(binding.limits?.candidateOnly===true&&
  binding.limits?.optionalSpanishExplicit===true&&
  binding.limits?.optionalSpanishSpliced===false&&
  binding.limits?.originalHostRunObserved===false,
  'source binding does not claim host or joined SA');
 return {...source,binding,bindingPin};
}

export function p027Entry(source){
 return {key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'interactive-understood',artifacts:source.binding.artifacts};
}
export function p027Runtime(artifacts){
 return {frameDomain:'sprite-46',frameCount:770,rootFrameCount:10,
  rootBeginFrame:6,fps:12,stage:{width:800,height:600},
  scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
  terminalPolicy:'native-main-audio-eof-and-final-frame-hold',
  hostPlaybackCompletion:false};
}
export function p027PacketSource(source){
 return {
  continuousSource:{plan:source.binding.audioPlan,
   browserDecode:source.binding.browserDecode,frameDomain:'sprite-46',
   visualFrames:770,blockCount:769,
   mainRuns:[{blockFrameRange:[2,770],asset:core(source.assetPins.main),
    browserDecodedSamples:source.browserDecode.results[0].samples,
    browserPcmSha256:source.browserDecode.results[0].pcmSha256}],
   sourceSyncAccepted:false,originalRuntimeAccepted:false,
   listeningAccepted:false,audioAccepted:false},
  optionalSpanishAudio:{source:SA,asset:core(source.assetPins.sa),
   browserDecodedSamples:source.browserDecode.results[1].samples,
   browserPcmSha256:source.browserDecode.results[1].pcmSha256,
   trigger:'explicit-user-only',localeAutoplay:false,
   mainStreamSpliced:false,audioAccepted:false},
  nativeTextSource:{state:source.binding.native,frameDomain:'sprite-46',
   frames:770,staticTextDefinitions:17,sourceTextInstances:36,
   canvasGlyphsPreserved:true,canvasInstanceSuppressionSupported:false,
   sourceEnglishFallback:true,originalRuntimeAccepted:false},
  glossaryActions:Object.fromEntries(KEYS.map(([key,id])=>{
   const action=source.sourcePlan.glossary.find(row=>row.keyAttribute===key),
    entry=source.crosswalk.entries.find(row=>row.sourceKeyAttribute===key),
    control=source.native.glossary.find(row=>row.key===key);
   assert(action&&entry&&control,'source glossary '+key);
   return [key,{characterId:id,sourceKey:key,entryId:entry.id,
    sourceActionSha256:action.action.sha256,
    buttonInstanceId:control.instanceId,originalClickObserved:false}];
  }))
 };
}

/** Shared with the later receipt-gated producer; no calibration status is implied. */
export function validateP027SourceProjection(packet,source){
 equal([packet.schemaVersion,packet.sourceRoot,packet.scope,
  packet.deploymentScope,packet.source,packet.sourceXml],
  [1,SOURCE_ROOT,'private-engineering','local-only',SOURCE,XML],
  'P027 candidate source identity');
 equal(packet.entry,p027Entry(source),'P027 candidate entry');
 equal(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:'swf-'+SOURCE.sha256,sourceSha256:SOURCE.sha256,
  moduleCode:'ALG001',lessonNumber:6,globalPageOrdinal:27,
  sourceOccurrence:27,sectionCode:'VB',sectionPageOrdinal:17,
  complexityLane:'interactive-understood',runtime:p027Runtime(packet.entry.artifacts)}],
  'source-ordered page and frame contract');
 const projection=p027PacketSource(source);
 for(const [key,value] of Object.entries(projection))
  equal(packet[key],value,'source-owned '+key);
 equal(packet.acceptanceEffects,ACCEPTANCE,'independent acceptance gates');
 return true;
}

export function validateP027SourcePacket(packet,registration,source){
 validateP027SourceProjection(packet,source);
 equal(packet.calibrationId,CALIBRATION,'source-only preflight identity');
 equal([packet.productCalibrationPassed,packet.scaleOutAuthorized],
  [false,false],'candidate-only scope');
 assert(packet.integrity.completeTransitiveClosure===false,
  'source packet is not final completion');
 const expected=uniquePins([source.bindingPin,...source.binding.files,
  ...Object.values(packet.entry.artifacts)]),
  bound=new Map(packet.integrity.files.map(pin=>[pin.path,pin]));
 equal(bound.size,packet.integrity.files.length,'unique P027 input paths');
 for(const pin of expected)equal(bound.get(pin.path),pin,
  'source packet input '+pin.path);
 equal(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:packet.freezeManifest.path,
  freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,
  entries:[packet.entry]},'real writer fragment proposal');
 return true;
}
