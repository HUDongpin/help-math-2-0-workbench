/** Source-bound P016 local Current-JS proposal semantics. This module never registers a page. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p016';
export const CALIBRATION='g678-alg-l06-p016-current-js-20260929-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB09.swf',bytes:413745,
 sha256:'2fdeba5b4dcfcfe7d1b575ab30d76a98fca802d6be670a679a54378f32aa4ae9'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB09.mp3',bytes:468384,
 sha256:'cb2708cdd7be1dde5be7db5bf0487de74e1594d3528eed40cb79ba02a3ed1b6a'};
const AUDIT='migrations/shared-alg001-l06-p016/audit';
const SOURCE_AUDIT_BASE='output/alg-l06-p016-source-audit-v1';
export const SOURCE_AUDIT={path:`${SOURCE_AUDIT_BASE}/time-resolved-audit-v1.json`,bytes:61254,
 sha256:'5a17bae3c4c1a29072a9dbaa048ac34c24bea65cda4e763d02f6e0355c8328d9'};
export const FRAME_AUDIT={path:`${SOURCE_AUDIT_BASE}/frame-states-v1.json`,bytes:9338185,
 sha256:'29d2e56ed68510e460dc99a361df0a6386ba84b5654d4edce9a9935d9259679b'};
export const AUDIO_AUDIT={path:`${AUDIT}/audio-v1/audio-source-audit-v1.json`,bytes:249118,
 sha256:'fef22dc59ef37db976efea21921165ead844f92499ae7d5fd0331e3cc2bb001d'};
export const TEXT_AUDIT={path:`${AUDIT}/text-state-v1/text-state-source-v1.json`,bytes:20851,
 sha256:'23ded6a3d40fc2c82885d0fdcc5a68c4e45be92a15d3fb83550e4f196bc301b6'};
export const CANVAS_MANIFEST={path:'output/alg-l06-p016-canvas-v1/canvas-manifest.json',bytes:5116,
 sha256:'18cab88da6ca723add910b165a81061ef27c4c30b42e1fd3333ba894e9bf515e'};
export const BROWSER_AUDIO={path:'output/playwright/alg-l06-p016-browser-audio-v1/decode-receipt.json',bytes:1595,
 sha256:'3c405c6d6bab9857ad68355f19e086ce117e496b859951857051b9d30fcece51'};
export const CANVAS_SOURCE={path:'output/alg-l06-p016-canvas-v1/canvas-renderer.js',bytes:7477454,
 sha256:'3f6fddbf841d5cac7e28f1112971faed148c89160a8529ba81a30e12ab146b3a'};
export const CANVAS_METADATA={path:'output/alg-l06-p016-canvas-v1/canvas-metadata-v1.json',bytes:2192,
 sha256:'ffde3bf9cf108eab5c5e1547a052a671905bc487709e10c0aa58abe9343415f0'};
export const MAIN_AUDIO=Object.freeze([
 {path:`${AUDIT}/audio-v1/sprite-139-range-1-source-v1.mp3`,bytes:122980,
  sha256:'2d49d16c1376d2701d0713ddf45560029ccaf414a5df81aec6550ce93521f3d4'},
 {path:`${AUDIT}/audio-v1/sprite-139-range-2-source-v1.mp3`,bytes:208910,
  sha256:'b182a13295a7bc012a082b187164db8818390a8ac656e58db7a46ad17fc6a98b'},
]);
export const SA_COPY={path:`${AUDIT}/audio-v1/separate-sa-source-v1.mp3`,bytes:SA.bytes,sha256:SA.sha256};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='interactive-understood';
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,browserDecode:BROWSER_AUDIO,
 mainRanges:MAIN_AUDIO,mainRangeFrames:[[2,299],[312,815]],mainFrameDomain:'sprite-139',
 negativeSeekSemanticsResolved:false,syntheticSilenceForAbsentBlocks:false,
 mainRangesConcatenated:false,originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,sourceCopy:SA_COPY,browserDecode:BROWSER_AUDIO,
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
 mainPausedDuringPlayback:true,pendingLoadCancellation:true,returnMainSupported:true,
 audioAccepted:false});
export const GLOSSARY=Object.freeze({Function:{characterId:10,sourceKey:'Function',entryId:'function',
 firstCandidateFrame:72,firstFullHitFrame:null,sourceHitFraction:0.985,
 sourceActionSha256:'549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8',
 exportedScriptSha256:'bf18a4b6722a58696805f4dd043c6b04a1b1c3cc9a605ef84301790c08bb4cfa',
 originalClickObserved:false}});
export const ARTIFACT_PATHS=Object.freeze({
 module:`packages/demos/src/modules/${ID}.tsx`,timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`,
});
export const MAINTAINED_PATHS=Object.freeze([
 'packages/demos/src/alg-l06-p016-timeline-v1.ts',
 'packages/demos/src/alg-l06-p016-audio-schedule-v1.ts',
 'packages/demos/src/alg-l06-p016-clock-v1.ts',
 'packages/demos/src/alg-l06-p016-audio-owner-v1.ts',
 'packages/demos/src/alg-l06-p016-optional-spanish-audio-v1.ts',
 'packages/demos/src/alg-l06-p016-native-text-v1.tsx',
 'packages/demos/src/alg-l06-p016-player-v1.tsx',
 'packages/demos/src/generated/alg-l06-p016-audio-plan-v1.ts',
 'packages/demos/src/generated/alg-l06-p016-text-state-v1.ts',
]);
const pin=({path,bytes,sha256})=>({path,bytes,sha256});
function collect(root,item,local,external){
 const exact=pin(item);assert(typeof exact.path==='string','P016 source input path');
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const holder=exact.path.startsWith(`${root}/`)?root:exact.path.startsWith(`${SOURCE_ROOT}/`)
  ?SOURCE_ROOT:path.dirname(exact.path);
 const ref={root:holder,pin:{...exact,path:path.relative(holder,exact.path)}};
 readPin(ref.root,ref.pin);if(holder===root)local.push(ref.pin);else external.push(ref);
}
export function proposedP016Artifacts(root){return {
 module:pinFile(root,ARTIFACT_PATHS.module),timeline:pinFile(root,ARTIFACT_PATHS.timeline),
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
};}
export function readP016Artifacts(root){
 const artifacts={module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime:pinFile(root,ARTIFACT_PATHS.runtime)};
 assert.deepEqual(artifacts.runtime,{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
  'P016 runtime must be exact copied Canvas source');
 return artifacts;
}
export function p016Runtime(artifacts){return Object.freeze({frameDomain:'sprite-139',frameCount:815,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false});}

/** Verify current physical source and exact evidence without granting admission. */
export function readP016CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const source=readJsonPin(root,SOURCE_AUDIT),frames=readJsonPin(root,FRAME_AUDIT),
  audio=readJsonPin(root,AUDIO_AUDIT),text=readJsonPin(root,TEXT_AUDIT),
  canvas=readJsonPin(root,CANVAS_MANIFEST),browser=readJsonPin(root,BROWSER_AUDIO);
 assert.equal(source.kind,'alg-l06-p016-time-resolved-static-audit-v1');
 assert.deepEqual(pin(source.source),{...SOURCE,path:path.join(SOURCE_ROOT,SOURCE.path)});
 assert.deepEqual([source.identity.animationId,source.identity.sourceOccurrence,
  source.identity.section,source.identity.sectionPageOrdinal],[ID,16,'VB',6]);
 assert.deepEqual([source.identity.stage.width,source.identity.stage.height,source.identity.fps,
  source.identity.rootEntryFrame,source.identity.rootFrameCount,source.identity.mainDomain,
  source.identity.mainFrameCount],[800,600,12,6,10,'sprite-139',815]);
 assert.deepEqual([source.rootPlacement.frame,source.rootPlacement.depth,
  source.rootPlacement.sourceTagSha256],[6,2,
  'b19a7fd08967f06c309ffa8d1cc11bd04acadeff5b683ae2df548c74f6d4e421']);
 assert.equal(source.textDefinitions.length,19);assert.equal(source.instances.length,40);
 assert.deepEqual([source.button.characterId,source.button.actionSha256,
  source.button.firstStaticAnyHitFrame,source.button.firstStaticFullHitFrame,
  source.button.firstPlacementHitAreaRatio,source.button.actualClickObserved],
  [10,GLOSSARY.Function.sourceActionSha256,72,null,0.985,false]);
 assert.equal(source.limits.originalRuntimeObserved,false);
 assert.equal(source.limits.authoritativeClickabilityEstablished,false);
 assert.deepEqual(pin({...source.frameEvidence,path:`${SOURCE_AUDIT_BASE}/${source.frameEvidence.path}`}),FRAME_AUDIT);
 assert.deepEqual([frames.sourceSha256,frames.frameDomain,frames.frameCount,frames.frames.length],
  [SOURCE.sha256,'sprite-139',815,815]);
 assert.equal(text.animationId,ID);assert.equal(text.sourceSwfSha256,SOURCE.sha256);
 assert.deepEqual([text.frameDomain,text.frameCount,text.rootEntryFrame,text.textDefinitions.length,
  text.textInstances.length],['sprite-139',815,6,19,39]);
 assert.deepEqual(text.functionControl.availableSpans,[[72,815]]);
 assert.deepEqual([text.functionControl.sourceActionSha256,text.functionControl.firstCandidateFrame,
  text.functionControl.firstFullHitFrame,text.functionControl.originalClickObserved],
  [GLOSSARY.Function.sourceActionSha256,72,null,false]);
 assert.deepEqual(text.reading.unresolvedLateFragments,[128,130,131,132,134,135,136,138]);
 assert.equal(text.policy.canvasGlyphs,'preserved');
 assert.equal(text.policy.language,'source-en-fallback');
 assert.equal(audio.kind,'alg-l06-p016-audio-source-audit-v1');
 assert.deepEqual([audio.domainCount,audio.streamCount,audio.streams[0].domain,
  audio.streams[0].blockCount],[2,1,'sprite-139',802]);
 assert.deepEqual(audio.trailers,[]);
 assert.deepEqual(audio.streams[0].contiguousRanges.map(row=>[row.firstFrame,row.lastFrame]),
  CONTINUOUS.mainRangeFrames);
 assert.deepEqual(audio.streams[0].contiguousRanges.map(row=>pin(row.extractedMp3)),MAIN_AUDIO);
 assert.deepEqual(audio.streams[0].contiguousRanges.map(row=>row.firstPacket.rawSeekSamples),[1673,218]);
 assert.deepEqual(pin(audio.separateSa.copy),SA_COPY);
 assert.equal(audio.limits.negativeSeekSemanticsResolved,false);
 assert.equal(audio.limits.missingBlocksProveAudibleSilence,false);
 assert.equal(audio.limits.separateSaExplicitTriggerRequired,true);
 assert.equal(audio.limits.separateSaSplicedIntoMain,false);
 assert.equal(audio.limits.localeChangeStartsSa,false);
 assert.equal(canvas.kind,'alg-l06-p016-maintained-canvas-v1');
 assert.deepEqual(pin(canvas.source),SOURCE);
 assert.deepEqual([canvas.rootFrame,canvas.mainFrameCount,canvas.stage.width,
  canvas.stage.height],[6,815,800,600]);
 assert.deepEqual([canvas.sourceGlyphRendering.definitions,canvas.sourceGlyphRendering.dynamicFields,
  canvas.sourceGlyphRendering.preserved,canvas.sourceGlyphRendering.nativeBinding],
  [19,0,true,'semantic-flow-companion']);
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_SOURCE)));
 assert.equal(browser.kind,'alg-l06-p016-browser-decode-v1');
 assert.deepEqual(browser.results.map(row=>[row.sourceBytes,row.sourceSha256,row.sampleRate,
  row.channels,row.decodedSamples,row.pcmSha256,row.playbackStarted]),[
  [122980,MAIN_AUDIO[0].sha256,22050,1,544896,
   'e9cb984eafce0ef303f69b7f1416d3f3819c5ada2cd4ae2b056ca79be1547956',false],
  [208910,MAIN_AUDIO[1].sha256,22050,1,925632,
   '89e496ced5c6a1a28da7bb2a2a7ed626470666d1b2c4b99f87c6a92a8e29afd8',false],
  [468384,SA.sha256,48000,1,1605888,
   '3ce2462346cab21c8f3d4039b0ed2b69bfa2609d22369ab313e4e36f336a6fd1',false],
 ]);
 assert.equal(browser.originalRuntimeAccepted,false);assert.equal(browser.listeningAccepted,false);
 const local=[SOURCE_AUDIT,FRAME_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,CANVAS_MANIFEST,BROWSER_AUDIO,
  ...MAIN_AUDIO,SA_COPY,CANVAS_SOURCE,CANVAS_METADATA,
  ...MAINTAINED_PATHS.map(relative=>pinFile(root,relative))];
 const external=[SOURCE,XML,SA].map(item=>({root:SOURCE_ROOT,pin:item}));
 for(const item of [...source.inputs.shapeExports,...source.inputs.visualProbes,source.inputs.swfmillXml])
  collect(root,{...item,path:`${SOURCE_AUDIT_BASE}/${item.path}`},local,external);
 for(const item of [audio.streams[0].extractedMp3,...text.inputs,
  ...canvas.inputs,...canvas.outputs])collect(root,item,local,external);
 const uniqueExternal=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),prior=uniqueExternal.get(key);
  if(prior)assert.deepEqual(prior,item,`conflicting P016 external source pin: ${key}`);
  else uniqueExternal.set(key,item);}
 return {source,frames,audio,text,canvas,browser,localInputs:uniquePins(local),
  external:[...uniqueExternal.values()].sort((a,b)=>
   path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
/** Validate a later proposal against current source, artifacts and local-only claims. */
export function validateP016AdmissionSemantics(packet,registration,root){
 assert(root,'P016_REQUIRES_CURRENT_ROOT');
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.glossaryActions,GLOSSARY);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=proposedP016Artifacts(root);
 assert.deepEqual(packet.entry?.artifacts,artifacts);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:16,sourceOccurrence:16,sectionCode:'VB',
  sectionPageOrdinal:6,complexityLane:COMPLEXITY_LANE,runtime:p016Runtime(artifacts)}]);
 assert.deepEqual(packet.entry,{key:ID,module:`./modules/${ID}`,
  maturity:'private-current-js',complexityLane:COMPLEXITY_LANE,artifacts});
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert(Number.isSafeInteger(packet.freezeManifest.bytes)&&packet.freezeManifest.bytes>0);
 assert(/^[a-f0-9]{64}$/u.test(packet.freezeManifest.sha256));
 assert.deepEqual(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert(!('canonicalRun' in packet)&&!('canonicalMember' in packet));
 assert.equal(packet.integrity.completeTransitiveClosure,false);
 assert(Array.isArray(packet.integrity.files));
 const evidence=new Map(packet.integrity.files.map(item=>[item.path,item]));
 const source=readP016CanonicalSource(root);
 for(const required of [...source.localInputs,...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P016 evidence: ${required.path}`);
 for(const item of packet.integrity.files)
  assert(!FORBIDDEN.has(item.path)&&item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
   `no registration-dependent P016 evidence: ${item.path}`);
 return true;
}
