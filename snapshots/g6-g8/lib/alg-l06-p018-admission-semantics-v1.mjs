/** Source-bound P018 local Current-JS proposal semantics; never registers a page. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p018';
export const CALIBRATION='g678-alg-l06-p018-current-js-20260929-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB11.swf',bytes:223574,
 sha256:'400f0cdcb574864c7e9e2208f986e91f26e10f796623b6ea41d80a59310e167a'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB11.mp3',bytes:308112,
 sha256:'1d6f1de82903f62e5c642ce0e51b1baa03ec30c1fbfbcd46f135e2c4d5538057'};
export const MIGRATION={path:'migrations/shared-alg001-l06-p018/migration.json',bytes:8292,
 sha256:'ec675b6720634bd76b8bf8bb38f4f1e5907b847d6146dab44b6564c334060fe2'};
const AUDIT='migrations/shared-alg001-l06-p018/audit';
const SOURCE_AUDIT_BASE='output/alg-l06-p018-source-audit-v1';
export const PREFLIGHT={path:'output/alg-l06-p018-source-preflight-v1/source-preflight-v1.json',
 bytes:17663,sha256:'4ae5baf4b8a7a339c0d647bb548a035203ff797dcf42809f7b7be76ccda80604'};
export const SOURCE_AUDIT={path:`${SOURCE_AUDIT_BASE}/time-resolved-audit-v2.json`,
 bytes:143368,sha256:'6a8e289b3f4ce2c635cff61ae8b950596272d6ff835c3fae0ec6a8f1dfd66e79'};
export const FRAME_AUDIT={path:`${SOURCE_AUDIT_BASE}/frame-states-v2.json`,
 bytes:12647538,sha256:'b03f44b01075da419444ba8e11b27ee2bff2352369d7d5da3b599b1fdeadf9b0'};
export const AUDIO_AUDIT={path:`${AUDIT}/audio-v1/audio-source-audit-v1.json`,
 bytes:199476,sha256:'c70000c012ccdbb7a78de7ee8059f1e3d595e0977a2d52d81d6357a618ca0b3b'};
export const AUDIO_PLAN={path:`${AUDIT}/audio-plan-v1/audio-plan-v1.json`,
 bytes:2417,sha256:'8f376a99fa2cdc0dbb4f5b77c332a6d52ad33febf2e766f3902e314ed707eace'};
export const TEXT_AUDIT={path:`${AUDIT}/text-state-v1/text-state-source-v1.json`,
 bytes:39713,sha256:'b79014abb74c3a910e7f7e11d45d13a442c27f47f4fe4b230f299e1d46a70d88'};
export const CROSSWALK={path:'output/alg-l06-p018-glossary-audit-v1/five-term-crosswalk-v1.json',
 bytes:10887,sha256:'bc60ac167944ec74c9a0e5170363d6311319eb6c097fc532da97334bb2bfa9a1'};
export const CANVAS_MANIFEST={path:'output/alg-l06-p018-canvas-v1/canvas-manifest.json',
 bytes:6576,sha256:'5cff7085f08d0bc1cbb203f6c3497662838caa5f81c29c5ad1341c0c130f7ad9'};
export const CANVAS_SOURCE={path:'output/alg-l06-p018-canvas-v1/canvas-renderer.js',
 bytes:2638179,sha256:'0204230c05b37bc076ae7510bbb4f6ef56b25d1fe50945f2bbb35e43521e88c6'};
export const CANVAS_METADATA={path:'output/alg-l06-p018-canvas-v1/canvas-metadata-v1.json',
 bytes:2355,sha256:'bae4080aa176f679032ded3ef2b529548531f2c12d48b0bc02fa03de19acc358'};
export const BROWSER_AUDIO={path:'output/playwright/alg-l06-p018-browser-audio-v1/decode-receipt.json',
 bytes:1163,sha256:'91e54d6dfafa4835f3d29808c5f9bf5bfd587172081705b40fba610ac898e7cb'};
export const MAIN_AUDIO={path:`${AUDIT}/audio-v1/sprite-32-source-v1.mp3`,bytes:268190,
 sha256:'dbdb6229947cde1d0353c3ccc41e05514ac988559b49d26c9f8f52d637a59770'};
export const SA_COPY={path:`${AUDIT}/audio-v1/separate-sa-source-v1.mp3`,bytes:SA.bytes,
 sha256:SA.sha256};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='behavior-heavy';
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,browserDecode:BROWSER_AUDIO,
 mainRanges:[MAIN_AUDIO],mainRangeFrames:[[2,648]],mainFrameDomain:'sprite-32',
 initialRawSeekSamples:1673,nativeAudioEndPosition:647.7768707482993,
 visualTailAfterNativeEof:true,negativeSeekSemanticsResolved:false,
 syntheticSilenceForAbsentBlocks:false,mainRangesConcatenated:false,
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,sourceCopy:SA_COPY,browserDecode:BROWSER_AUDIO,
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
 mainPausedDuringPlayback:true,pendingLoadCancellation:true,returnMainSupported:true,
 audioAccepted:false});
export const GLOSSARY=Object.freeze({
 Evaluate:{characterId:8,sourceKey:'Evaluate',entryId:'evaluate',
  sourceActionSha256:'a7e02e39a8ff444b4675d4cfb851b73557b5c53083cbbbe506d4ba081d025b64',
  instances:[{instanceId:'sprite-32/depth-4/generation-1',depth:4,labelTextId:6,
   labelRunText:'evaluate',firstCandidateFrame:11,firstFullHitFrame:11,
   sourcePlacementTagSha256:'5260da2fd6709c827e619058be80cab3d707397c29c8eb795fed0f190262420f'},
   {instanceId:'sprite-32/depth-22/generation-1',depth:22,labelTextId:27,
   labelRunText:'Evaluate',firstCandidateFrame:324,firstFullHitFrame:324,
   sourcePlacementTagSha256:'63a4048b4b0845c2e8106c15c0f3786629177103484e70cbe68405861c5189a3'}],
  originalClickObserved:false},
 'Input variable':{characterId:9,sourceKey:'Input variable',entryId:'input-variable',
  sourceActionSha256:'21e104678862baa7b8b6d609bcfb79ad299d455b10e0e964d01397b39b7c954e',
  instances:[{instanceId:'sprite-32/depth-6/generation-1',depth:6,labelTextId:6,
   labelRunText:'input variable',firstCandidateFrame:65,firstFullHitFrame:65,
   sourcePlacementTagSha256:'4c6c1a677c0303cbcc84612a27be0b667ff549d41988179d2dfd4aa1046c38cf'}],
  originalClickObserved:false},
 Substitute:{characterId:10,sourceKey:'Substitute',entryId:'substitute',
  sourceActionSha256:'ee6527c288c373b60e404ed24111f80849e669b3c16ab35b18aafae4f9573b45',
  instances:[{instanceId:'sprite-32/depth-8/generation-1',depth:8,labelTextId:6,
   labelRunText:'substitute',firstCandidateFrame:43,firstFullHitFrame:43,
   sourcePlacementTagSha256:'4c58ebb2d8517515b3fd8c7d7c1045761f2157e58f76b6a43f0bcacd130e12fc'}],
  originalClickObserved:false},
 Function:{characterId:11,sourceKey:'Function',entryId:'function',
  sourceActionSha256:'549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8',
  instances:[{instanceId:'sprite-32/depth-10/generation-1',depth:10,labelTextId:6,
   labelRunText:'function',firstCandidateFrame:18,firstFullHitFrame:18,
   sourcePlacementTagSha256:'2e9f59b8727bb547d48e053a7bc39588e2c9aa5d1ca46d1999d1943612cbd943'},
   {instanceId:'sprite-32/depth-24/generation-1',depth:24,labelTextId:27,
   labelRunText:'function',firstCandidateFrame:333,firstFullHitFrame:333,
   sourcePlacementTagSha256:'721fb9c3300a25b403fdf151694137809ecd8b0538ccf4a0f8516eb51308848d'}],
  originalClickObserved:false},
 Result:{characterId:20,sourceKey:'Result',entryId:'result',
  sourceActionSha256:'1ca8d68b17b783241f00347f0c43774c786ba2c52b0b6a914526260563441360',
  instances:[{instanceId:'sprite-32/depth-16/generation-1',depth:16,labelTextId:19,
   labelRunText:'result',firstCandidateFrame:102,firstFullHitFrame:102,
   sourcePlacementTagSha256:'4a79fad4b65a306a203843b1f3d27f4970f94a3c1be57a1715eaa7af3aeb02e2'}],
  originalClickObserved:false},
});
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`});
export const MAINTAINED_PATHS=Object.freeze([
 'packages/demos/src/alg-l06-p018-timeline-v1.ts',
 'packages/demos/src/alg-l06-p018-audio-schedule-v1.ts',
 'packages/demos/src/alg-l06-p018-clock-v1.ts',
 'packages/demos/src/alg-l06-p018-audio-owner-v1.ts',
 'packages/demos/src/alg-l06-p018-optional-spanish-audio-v1.ts',
 'packages/demos/src/alg-l06-p018-native-text-v1.tsx',
 'packages/demos/src/alg-l06-p018-player-v1.tsx',
 'packages/demos/src/generated/alg-l06-p018-audio-plan-v1.ts',
 'packages/demos/src/generated/alg-l06-p018-text-state-v1.ts',
]);
const pin=({path,bytes,sha256})=>({path,bytes,sha256});
function collect(root,item,local,external){
 const exact=pin(item);assert(typeof exact.path==='string','P018 source input path');
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const holder=exact.path.startsWith(`${root}/`)?root:exact.path.startsWith(`${SOURCE_ROOT}/`)
  ?SOURCE_ROOT:path.dirname(exact.path);
 const ref={root:holder,pin:{...exact,path:path.relative(holder,exact.path)}};
 readPin(ref.root,ref.pin);if(holder===root)local.push(ref.pin);else external.push(ref);
}
export function proposedP018Artifacts(root){return {
 module:pinFile(root,ARTIFACT_PATHS.module),timeline:pinFile(root,ARTIFACT_PATHS.timeline),
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
};}
export function readP018Artifacts(root){
 const artifacts={module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime:pinFile(root,ARTIFACT_PATHS.runtime)};
 assert.deepEqual(artifacts.runtime,{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
  'P018 member must be exact copied Canvas source');
 return artifacts;
}
export function p018Runtime(artifacts){return Object.freeze({frameDomain:'sprite-32',frameCount:648,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false});}

/** Verify physical source and source-derived files without granting admission. */
export function readP018CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const migration=readJsonPin(root,MIGRATION),preflight=readJsonPin(root,PREFLIGHT),
  source=readJsonPin(root,SOURCE_AUDIT),frames=readJsonPin(root,FRAME_AUDIT),
  audio=readJsonPin(root,AUDIO_AUDIT),plan=readJsonPin(root,AUDIO_PLAN),
  text=readJsonPin(root,TEXT_AUDIT),crosswalk=readJsonPin(root,CROSSWALK),
  canvas=readJsonPin(root,CANVAS_MANIFEST),metadata=readJsonPin(root,CANVAS_METADATA),
  browser=readJsonPin(root,BROWSER_AUDIO);
 assert.deepEqual([migration.id,migration.animationId,migration.assetId,
  migration.source.swfSha256,migration.runtime.complexity,migration.status],
  [ID,ID,`swf-${SOURCE.sha256}`,SOURCE.sha256,COMPLEXITY_LANE,'preserved']);
 assert.deepEqual([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,migration.acceptance.ownerReview.decision],
  ['pending','pending','pending']);
 assert.equal(source.kind,'alg-l06-p018-time-resolved-static-audit-v2');
 assert.deepEqual(pin(source.source),{...SOURCE,path:path.join(SOURCE_ROOT,SOURCE.path)});
 assert.deepEqual([source.identity.animationId,source.identity.sourceOccurrence,
  source.identity.section,source.identity.sectionPageOrdinal,source.identity.mainDomain,
  source.identity.mainFrameCount,source.identity.rootEntryFrame,source.identity.fps],
  [ID,18,'VB',8,'sprite-32',648,6,12]);
 assert.deepEqual([source.rootPlacement.frame,source.rootPlacement.depth],[6,3]);
 assert.deepEqual([source.textDefinitions.length,source.instances.length,
  source.instances.filter(item=>item.role==='static-text').length,source.buttons.length],
  [17,45,38,5]);
 assert.deepEqual(source.replacementPlacements.map(item=>
  [item.frame,item.depth,item.fromCharacterId,item.toCharacterId]),[[64,13,15,16]]);
 assert.equal(source.limits.originalRuntimeObserved,false);
 assert.equal(source.limits.authoritativeClickabilityEstablished,false);
 assert.deepEqual(pin({...source.frameEvidence,
  path:`${SOURCE_AUDIT_BASE}/${source.frameEvidence.path}`}),FRAME_AUDIT);
 assert.deepEqual([frames.sourceSha256,frames.frameDomain,frames.frameCount,frames.frames.length],
  [SOURCE.sha256,'sprite-32',648,648]);
 assert.deepEqual([preflight.identity.animationId,preflight.identity.globalOrdinal,
  preflight.identity.sectionPageOrdinal,preflight.structuralSourceFacts.tagCounts.DefineText,
  preflight.structuralSourceFacts.tagCounts.DefineButton2],
  [ID,18,8,17,5]);
 assert.deepEqual([text.animationId,text.sourceSwfSha256,text.frameDomain,text.frameCount,
  text.rootEntryFrame,text.textDefinitions.length,text.textInstances.length],
  [ID,SOURCE.sha256,'sprite-32',648,6,17,38]);
 assert.deepEqual(text.reading,{prose:[6,19,27,28],equation:[22,29,30],
  sourceHighlight:[12,13,14,15,16,21,23,24,25,31]});
 assert.equal(text.policy.canvasGlyphs,'preserved');
 assert.equal(text.policy.language,'source-en-fallback');
 assert.equal(text.policy.originalRuntimeAccepted,false);
 for(const expected of Object.values(GLOSSARY)){
  const button=source.buttons.find(row=>row.characterId===expected.characterId);
  const dictionary=crosswalk.entries.find(row=>row.buttonCharacterId===expected.characterId);
  assert(button&&dictionary,`five source-backed glossary controls: ${expected.sourceKey}`);
  assert.deepEqual([button.keyAttribute,button.actionSha256,button.actualClickObserved,
   dictionary.key,dictionary.dictionary.id],[expected.sourceKey,expected.sourceActionSha256,
   false,expected.sourceKey,expected.entryId]);
  assert.equal(button.instances.length,expected.instances.length);
  for(const instance of expected.instances){
   const original=button.instances.find(row=>row.instanceId===instance.instanceId);
   const native=text.glossaryControls.find(row=>row.sourceButtonInstanceId===instance.instanceId);
   assert(original&&native,`separate P018 source instance: ${instance.instanceId}`);
   assert.deepEqual([original.depth,original.sourcePlacementTagSha256,
    original.sourceLabelBinding.textId,original.sourceLabelBinding.runText,
    original.firstSourceReadyFrame,original.firstStaticFullHitFrame,
    native.key,native.sourceButtonId,native.sourceActionSha256,native.sourceLabelTextId,
    native.sourceLabelRunText,native.firstCandidateFrame,native.firstFullHitFrame,
    native.originalClickObserved],
   [instance.depth,instance.sourcePlacementTagSha256,instance.labelTextId,
    instance.labelRunText,instance.firstCandidateFrame,instance.firstFullHitFrame,
    expected.sourceKey,expected.characterId,expected.sourceActionSha256,instance.labelTextId,
    instance.labelRunText,instance.firstCandidateFrame,instance.firstFullHitFrame,false]);
  }
  assert(dictionary.dictionary.definitions.en&&dictionary.dictionary.definitions.es);
 }
 assert.deepEqual(crosswalk.missingModernKeys,['Evaluate','Substitute','Result']);
 assert.deepEqual([crosswalk.active.registeredLessonPages,crosswalk.active.glossaryEntryCount],
  [28,27]);
 assert.equal(audio.kind,'alg-l06-p018-audio-source-audit-v1');
 assert.deepEqual([audio.domainCount,audio.streamCount,audio.streams[0].domain,
  audio.streams[0].blockCount],[3,1,'sprite-32',647]);
 assert.deepEqual(audio.trailers,[]);
 assert.deepEqual(audio.streams[0].contiguousRanges.map(row=>[row.firstFrame,row.lastFrame]),
  CONTINUOUS.mainRangeFrames);
 assert.deepEqual(pin(audio.streams[0].extractedMp3),MAIN_AUDIO);
 assert.equal(audio.streams[0].contiguousRanges[0].firstPacket.rawSeekSamples,1673);
 assert.deepEqual(pin(audio.separateSa.copy),SA_COPY);
 assert.equal(audio.limits.separateSaExplicitTriggerRequired,true);
 assert.equal(audio.limits.separateSaSplicedIntoMain,false);
 assert.equal(audio.limits.localeChangeStartsSa,false);
 assert.deepEqual([plan.mainAssets.length,plan.mainAssets[0].sourceSha256,
  plan.nativeAudioEndPosition,plan.lastVisualFrame,plan.separateSa.sourceSha256],
  [1,MAIN_AUDIO.sha256,647.7768707482993,648,SA.sha256]);
 assert.equal(plan.disposition.separateSaSpliced,false);
 assert.equal(plan.disposition.localeStartsAudio,false);
 assert.equal(plan.disposition.originalRuntimeAccepted,false);
 assert.equal(canvas.kind,'alg-l06-p018-maintained-canvas-v1');
 assert.deepEqual(pin(canvas.source),SOURCE);
 assert.deepEqual([canvas.rootFrame,canvas.mainFrameCount,canvas.stage.width,
  canvas.stage.height],[6,648,800,600]);
 assert.deepEqual([canvas.sourceGlyphRendering.definitions,canvas.sourceGlyphRendering.dynamicFields,
  canvas.sourceGlyphRendering.preserved],[17,0,true]);
 assert.equal(canvas.sourceClipMasks.length,4);
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_SOURCE)));
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_METADATA)));
 assert.deepEqual([metadata.animationId,metadata.sourceSwfSha256,metadata.frameDomain,
  metadata.frameCount,metadata.sourceGlyphRendering.preserved],
  [ID,SOURCE.sha256,'sprite-32',648,true]);
 assert.equal(browser.kind,'alg-l06-p018-browser-decode-v1');
 assert.deepEqual(browser.results.map(row=>[row.sourceBytes,row.sourceSha256,row.sampleRate,
  row.channels,row.decodedSamples,row.pcmSha256,row.playbackStarted]),[
  [268190,MAIN_AUDIO.sha256,22050,1,1188288,
   'ad9e674f5e3123ef4f50bdc79ea66163294b467b27d20295e02b2795299328cb',false],
  [308112,SA.sha256,48000,1,1056384,
   '0fb5b3fc9260275f86016478e73ac4edcc5eadab3d73bdfbed0747420446925e',false],
 ]);
 assert.equal(browser.originalRuntimeAccepted,false);assert.equal(browser.listeningAccepted,false);
 const local=[MIGRATION,PREFLIGHT,SOURCE_AUDIT,FRAME_AUDIT,AUDIO_AUDIT,AUDIO_PLAN,
  TEXT_AUDIT,CROSSWALK,CANVAS_MANIFEST,CANVAS_SOURCE,CANVAS_METADATA,
  BROWSER_AUDIO,MAIN_AUDIO,SA_COPY,
  ...MAINTAINED_PATHS.map(relative=>pinFile(root,relative))];
 const external=[SOURCE,XML,SA].map(item=>({root:SOURCE_ROOT,pin:item}));
 for(const item of [source.inputs.swfmillXml,audio.streams[0].extractedMp3,
  ...text.inputs,...canvas.inputs,...canvas.outputs,plan.sourceAudit,plan.browserDecode])
  collect(root,item,local,external);
 for(const item of Object.values(crosswalk.inputs))collect(root,item,local,external);
 const uniqueExternal=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),prior=uniqueExternal.get(key);
  if(prior)assert.deepEqual(prior,item,`conflicting P018 external source pin: ${key}`);
  else uniqueExternal.set(key,item);}
 return {migration,preflight,source,frames,audio,plan,text,crosswalk,canvas,metadata,browser,
  localInputs:uniquePins(local),external:[...uniqueExternal.values()].sort((a,b)=>
   path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
/** A proposal remains acceptance-neutral even after proof preparation. */
export function validateP018AdmissionSemantics(packet,registration,root){
 assert(root,'P018_REQUIRES_CURRENT_ROOT');
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.glossaryActions,GLOSSARY);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=proposedP018Artifacts(root);
 assert.deepEqual(packet.entry?.artifacts,artifacts);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:18,sourceOccurrence:18,sectionCode:'VB',
  sectionPageOrdinal:8,complexityLane:COMPLEXITY_LANE,runtime:p018Runtime(artifacts)}]);
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
 const source=readP018CanonicalSource(root);
 for(const required of [...source.localInputs,...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P018 evidence: ${required.path}`);
 for(const item of packet.integrity.files)
  assert(!FORBIDDEN.has(item.path)&&item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
   `no registration-dependent P018 evidence: ${item.path}`);
 return true;
}
