/** Source-only P028 checks for a proposed Current-JS packet. No host acceptance. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p028';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB21.swf',bytes:47191,
 sha256:'12b9912231512d5622b96708b83331217691169fadf185b3b2d0a27733e3c297'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB21.mp3',bytes:37632,
 sha256:'f056221dc3c4251538c3a1d2c201bec5abe92c18a58f6ce1d185a8a6cf6703cf'};
export const KEYS=[['Relation',7],['Set',8],['Ordered pair',9]];
export const ACCEPTANCE={authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,listeningAccepted:false,humanVisualAccepted:false,
 ownerAccepted:false,strictComplete:false,published:false};
export const EVIDENCE={
 sourcePlan:'output/alg-l06-p028-source-planning-20261001-v1/source-plan-v1.json',
 displayList:'output/alg-l06-p028-source-planning-20261001-v1/source-display-list-v1.json',
 native:'output/alg-l06-p028-native-text-v1/geometry-v1.json',
 canvas:'output/alg-l06-p028-canvas-v1/canvas-manifest.json',
 canvasMetadata:'output/alg-l06-p028-canvas-v1/canvas-metadata-v1.json',
 audioPlan:'output/alg-l06-p028-audio-extraction-v1/audio-domain-plan-v1.json',
 browserDecode:'output/alg-l06-p028-chrome-decode-v1/browser-decode.json',
 stableDecode:'output/alg-l06-p028-chrome-decode-v1/stable-decode-v1.json',
 crosswalk:'output/alg-l06-p028-product-integration-v1/three-term-crosswalk-v1.json'};
export const ASSETS={
 canvas:'output/alg-l06-p028-canvas-v1/canvas-renderer.js',
 main:'output/alg-l06-p028-audio-extraction-v1/main-source-v1.mp3',
 sa:'output/alg-l06-p028-audio-extraction-v1/separate-sa-source-v1.mp3'};
export const BINDING_PATH='output/alg-l06-p028-product-integration-v1/candidate-source-binding-v4.json';
export const INDEX={path:'catalog/g678-admission-v1/index-v95.json',bytes:7213,
 sha256:'abc289363ad1de972e53bc4eeed881db05ab82fb1c59c9aed56a4dedcf4acb69'};
export const HOST={path:'catalog/g678-admission-v1/host-v94.json',bytes:136221,
 sha256:'3aa87dbbb8fe1576efb1faae191614053e4ab5ee7d8cefb4e0a68a411dfc23cc'};
const same=(a,b,message)=>assert.deepEqual(a,b,message);

/** Pure semantic checks make altered source data rejectable without editing evidence. */
export function validateSourceEvidence(e){
 const {sourcePlan:plan,native,canvas,canvasMetadata,audioPlan:audio,
  browserDecode:browser,stableDecode:stable,crosswalk}=e;
 same([plan.identity.animationId,plan.identity.globalActiveOrdinal,
  plan.identity.activePageCountInLesson,plan.identity.sectionCode,
  plan.identity.sectionPageOrdinal,plan.source.swf,plan.source.lessonXml,
  plan.source.separateSa],
  [ID,28,60,'VB',18,SOURCE,XML,SA],'source-ordered P028 identity');
 same(plan.frameDomains.map(row=>[row.id,row.frames]),
  [['root',10],['sprite-30',134]],'physical frame domains');
 same([plan.frameDomains[0].entryFrame,plan.frameDomains[0].entrySprite.characterId,
  plan.stage.widthPx,plan.stage.heightPx,plan.stage.fps],
  [6,30,800,600,12],'root entry, stage and clock');
 same([plan.visualStructure.textDefinitions,plan.visualStructure.textInstances,
  native.definitions.length,native.nativeCandidateTextInstanceIds.length],
  [21,51,21,51],'physical text inventory');
 same(plan.visualStructure.masks.map(row=>[row.objectId,row.depth,row.clipDepth,
  row.presentSpans]),[[2,1,10,[[2,134]]]],'one source clip mask');
 same(canvas.sourceClipMasks.map(row=>[row.characterId,row.depth,row.clipDepth]),
  [[2,1,10]],'maintained clip mask');
 same(plan.glossary.map(row=>[row.keyAttribute,row.buttonCharacterId]),
  KEYS,'three source glossary buttons');
 same(plan.glossary.map(row=>row.action.orderedEffects),
  KEYS.map(()=>['set _global.KeyAttribute','call _root.DoHyperLinks()',
   'stop _root.animation_mc.animation']),'ActionScript glossary order');
 same(native.glossary.map(row=>[row.key,row.buttonId]),KEYS,
  'native source button binding');
 same(crosswalk.entries.map(row=>row.sourceKeyAttribute),KEYS.map(row=>row[0]),
  'exact dictionary keys');
 for(const row of crosswalk.entries)
  assert(row.labels?.en&&row.labels?.es&&row.definitions?.en&&row.definitions?.es&&
   row.caseBinding==='exact',`bilingual key ${row.sourceKeyAttribute}`);
 same([native.animationId,native.sourceSwfSha256,native.frameDomain,
  native.rootFrameCount,native.rootEntryFrame,native.mainFrameCount,
  native.canvasSourceGlyphsPreserved,native.canvasInstanceSuppressionSupported],
  [ID,SOURCE.sha256,'sprite-30',10,6,134,true,false],
  'source-native geometry and unsuppressed glyphs');
 same([canvas.animationId,canvas.source.sha256,canvas.rootFrame,
  canvas.rootFrameCount,canvas.mainFrameCount,
  canvas.sourceGlyphRendering.default,
  canvas.sourceGlyphRendering.suppressTextIdsSupported],
  [ID,SOURCE.sha256,6,10,134,'preserve-all',false],
  'source Canvas and glyph policy');
 same(canvasMetadata.sourceClipMasks,canvas.sourceClipMasks,
  'Canvas runtime mask metadata');
 same([audio.frameDomain,audio.fps,audio.rootEntryFrame,audio.visualFrames,
  audio.main.firstBlockFrame,audio.main.lastBlockFrame,
  audio.main.blockCount,audio.main.declaredSamples,audio.main.zeroPayloadFrames],
  ['sprite-30',12,6,134,2,134,133,243648,[3]],
  'continuous embedded stream domain');
 same([audio.sourceSwf,audio.sourceXml,audio.optionalSpanishAudio.source],
  [SOURCE,XML,SA],'audio source ownership');
 same([audio.optionalSpanishAudio.trigger,audio.optionalSpanishAudio.localeAutoplay,
  audio.optionalSpanishAudio.joinedWithMain],
  ['explicit-user-only',false,false],'independent optional Spanish audio');
 same(browser.results.map(row=>[row.id,row.sourceBytes,row.sourceSha256,
  row.sampleRate,row.channels,row.samples,row.pcmSha256]),[
   ['main',54990,'4f6453056b67a9eb37859eba02a0f0c31d1619d50fd7c83863c55f0fd7c41a70',
    22050,1,243648,'a37a3a97c61557bcbf7634a84fb70b4097fdbef247d9ae771ea512f2e780c12f'],
   ['separate-sa',37632,SA.sha256,48000,1,129024,
    'fda7eef75eb7d8346fbe84c87ec2ce9bbd8842ed520e298e256cb1a84b39ca78']],
  'actual Chrome PCM decode, separate from FFmpeg');
 same([stable.kind,stable.status,stable.phase,stable.exitCode,stable.drift],
  ['g678-stable-browser-run-v1','stable-command-passed','postflight',0,null],
  'technical Chrome decode stable run');
 assert(Object.values(browser.acceptanceEffects).every(value=>value===false),
  'Chrome decode grants no acceptance');
 assert(Object.values(audio.limits).every(value=>value===false),
  'source audio plan grants no acceptance');
 return true;
}

export function readSourceEvidence(root){
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 const evidence=Object.fromEntries(Object.entries(EVIDENCE).map(([key,file])=>
  [key,readJsonPin(root,pinFile(root,file))]));
 validateSourceEvidence(evidence);
 const evidencePins=Object.fromEntries(Object.entries(EVIDENCE).map(([key,file])=>
  [key,pinFile(root,file)]));
 const assetPins=Object.fromEntries(Object.entries(ASSETS).map(([key,file])=>
  [key,pinFile(root,file)]));
 same(assetPins.canvas,evidence.canvas.outputs.find(row=>row.path===ASSETS.canvas),
  'maintained Canvas byte pin');
 same(assetPins.main,evidence.audioPlan.main.asset,'physical embedded MP3 pin');
 same(assetPins.sa,evidence.audioPlan.optionalSpanishAudio.asset,
  'physical separate SA pin');
 same(uniquePins(Object.values(evidencePins)),
  uniquePins(Object.values(evidencePins)),'unique source evidence');
 return {...evidence,evidencePins,assetPins};
}

/** The root-owned packet is an input, never an authority to change identity. */
export function validateCandidateBinding(binding,source){
 same([binding.schemaVersion,binding.kind,binding.animationId,binding.source,
  binding.predecessorIndex,binding.predecessorHost],
  [1,'alg-l06-p028-candidate-source-binding-v1',ID,SOURCE,INDEX,HOST],
  'root-owned exact candidate identity');
 same(binding.acceptanceEffects,ACCEPTANCE,'independent acceptance gates');
 same(binding.limits,{candidateOnly:true,sourceEnglishFallback:true,
  optionalSpanishExplicit:true,optionalSpanishSpliced:false,
  originalHostRunObserved:false,canvasSourceGlyphsPreserved:true},
  'bounded source candidate');
 same(uniquePins(binding.files),binding.files,'unique sorted packet input pins');
 same(binding.external.slice(0,3),[SOURCE,XML,SA].map(pin=>({root:SOURCE_ROOT,pin})),
  'three exact AWS source owners');
 assert(binding.external.length===5&&
  binding.external.slice(3).every(item=>item.root===
   '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI'),
  'two exact dictionary sources');
 const bound=new Map(binding.files.map(pin=>[pin.path,pin]));
 for(const [key,pin] of Object.entries(source.evidencePins)){
  assert.deepEqual(bound.get(pin.path),pin,`bound source evidence ${key}`);
  if(key!=='stableDecode')same(binding[key==='sourcePlan'?'sourcePlan':key],pin,
   `named source evidence ${key}`);
 }
 same(binding.audit,source.evidencePins.sourcePlan,'source audit alias');
 for(const pin of Object.values(source.assetPins))
  same(bound.get(pin.path),pin,`bound physical output ${pin.path}`);
 assert(binding.artifacts&&Object.keys(binding.artifacts).sort().join(',')===
  'module,runtime,timeline','exact canvas artifact triple');
 same(binding.artifacts.module.path,`packages/demos/src/modules/${ID}.tsx`,
  'canonical module path');
 same(binding.artifacts.timeline.path,`packages/demos/src/timelines/${ID}.ts`,
  'canonical timeline path');
 assert(binding.artifacts.runtime.path.startsWith('work/g678-shared-page-factory/')&&
  binding.artifacts.runtime.path.endsWith(`/members/${ID}/canvas-renderer.js`),
  'canonical runtime path');
 same([binding.artifacts.runtime.bytes,binding.artifacts.runtime.sha256],
  [source.assetPins.canvas.bytes,source.assetPins.canvas.sha256],
  'factory runtime is reviewed Canvas bytes');
 for(const pin of Object.values(binding.artifacts))same(bound.get(pin.path),pin,
  `bound artifact ${pin.path}`);
 return true;
}

export function readCanonicalSource(root){
 const source=readSourceEvidence(root),bindingPin=pinFile(root,BINDING_PATH),
  binding=readJsonPin(root,bindingPin);
 validateCandidateBinding(binding,source);
 for(const pin of binding.files)readPin(root,pin);
 for(const item of binding.external)readPin(item.root,item.pin);
 return {...source,binding,bindingPin,external:binding.external};
}

/** Page-owned packet fields use the exact shape consumed by the maintained
 * formal reader, while retaining the source action and dictionary identity. */
export function p028PacketSource(source){
 const core=pin=>({path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
 return {
  continuousSource:{plan:source.binding.audioPlan,
   browserDecode:source.binding.browserDecode,frameDomain:'sprite-30',
   visualFrames:134,blockCount:133,
   mainRuns:[{blockFrameRange:[2,134],asset:core(source.assetPins.main),
    browserDecodedSamples:source.browserDecode.results[0].samples,
    browserPcmSha256:source.browserDecode.results[0].pcmSha256}],
   sourceSyncAccepted:false,originalRuntimeAccepted:false,
   listeningAccepted:false,audioAccepted:false},
  optionalSpanishAudio:{source:SA,asset:core(source.assetPins.sa),
   browserDecodedSamples:source.browserDecode.results[1].samples,
   browserPcmSha256:source.browserDecode.results[1].pcmSha256,
   trigger:'explicit-user-only',localeAutoplay:false,
   mainStreamSpliced:false,audioAccepted:false},
  nativeTextSource:{state:source.binding.native,frameDomain:'sprite-30',
   frames:134,staticTextDefinitions:21,sourceTextInstances:51,
   canvasGlyphsPreserved:true,canvasInstanceSuppressionSupported:false,
   sourceEnglishFallback:true,originalRuntimeAccepted:false},
  glossaryActions:Object.fromEntries(KEYS.map(([key,id])=>{
   const action=source.sourcePlan.glossary.find(row=>row.keyAttribute===key),
    entry=source.crosswalk.entries.find(row=>row.sourceKeyAttribute===key),
    control=source.native.glossary.find(row=>row.key===key);
   assert(action&&entry&&control,`source glossary ${key}`);
   return [key,{characterId:id,sourceKey:key,entryId:entry.id,
    sourceActionSha256:action.action.sha256,
    buttonInstanceId:control.instanceId,originalClickObserved:false}];
  }))};
}

export function validateFormalReaderSourceShape(packet,source){
 const expected=p028PacketSource(source);
 for(const [key,value] of Object.entries(expected))
  same(packet[key],value,`formal reader source field ${key}`);
 same(Object.keys(packet.glossaryActions),KEYS.map(([key])=>key),
  'formal reader glossary object order');
 assert(KEYS.every(([key])=>packet.glossaryActions[key].sourceKey===key&&
  packet.glossaryActions[key].originalClickObserved===false),
  'formal reader original click remains unobserved');
 assert(packet.optionalSpanishAudio.localeAutoplay===false&&
  packet.optionalSpanishAudio.mainStreamSpliced===false,
  'formal reader Spanish Audio remains independent');
 same([packet.continuousSource.mainRuns[0].blockFrameRange,
  packet.continuousSource.mainRuns[0].asset.sha256,
  packet.continuousSource.mainRuns[0].browserPcmSha256,
  packet.optionalSpanishAudio.browserPcmSha256],
  [[2,134],source.assetPins.main.sha256,
   source.browserDecode.results[0].pcmSha256,
   source.browserDecode.results[1].pcmSha256],
  'formal reader main and Spanish Chrome bindings');
 return true;
}

export const readP028CanonicalSource=readCanonicalSource;
