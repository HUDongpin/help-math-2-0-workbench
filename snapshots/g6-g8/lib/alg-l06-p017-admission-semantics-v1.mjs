/** Source-bound P017 local Current-JS proposal semantics; never registers a page. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p017';
export const CALIBRATION='g678-alg-l06-p017-current-js-20260929-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB10.swf',bytes:245604,
 sha256:'7010ecfee54a80298e3bba09400a712cfed65dad983811d9a470bf017156ffb3'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB10.mp3',bytes:617568,
 sha256:'7a00a610f17eddca68ec987978221afe07936ac0f48cb098927e2d04880eaf7f'};
export const MIGRATION={path:'migrations/shared-alg001-l06-p017/migration.json',bytes:8066,
 sha256:'aae2c8651cd408f6aae8084f509a84aecfb496acf4d245cc04997601c08ae38b'};
const AUDIT='migrations/shared-alg001-l06-p017/audit';
const SOURCE_AUDIT_BASE='output/alg-l06-p017-source-audit-v1';
export const PREFLIGHT={path:'output/alg-l06-p017-source-preflight-v1/source-preflight-v1.json',
 bytes:23476,sha256:'bfd7a3a8560839a707726551333572dbd3a91352066fa1a783801f7cff42d3f8'};
export const SOURCE_AUDIT={path:`${SOURCE_AUDIT_BASE}/time-resolved-audit-v1.json`,
 bytes:146861,sha256:'7977e0be92a77b01b6bae6afffa5746499edf446a6237026d28eb1e18a3e8c3f'};
export const FRAME_AUDIT={path:`${SOURCE_AUDIT_BASE}/frame-states-v1.json`,
 bytes:14895075,sha256:'2ac04d2e9c5ff9569d14eaa8f80878a658c432a94e97ed518b655b07621d66bc'};
export const AUDIO_AUDIT={path:`${AUDIT}/audio-v1/audio-source-audit-v1.json`,
 bytes:221673,sha256:'c20d3d47c012c16bf376d0c56aac76c3c57fcfe1acd75ad08fa6801aff1e9633'};
export const TEXT_AUDIT={path:`${AUDIT}/text-state-v1/text-state-source-v1.json`,
 bytes:26235,sha256:'3d0e3935bb139ead600c1c40e4b53802bec0d0885be0c33560ece17c70afd0b2'};
export const CROSSWALK={path:'output/alg-l06-p017-glossary-audit-v1/six-term-crosswalk-v1.json',
 bytes:16362,sha256:'e3e413a9bfe488cb4d2287db095efddeb05233c42c46c3bf350a729322d53731'};
export const CANVAS_MANIFEST={path:'output/alg-l06-p017-canvas-v1/canvas-manifest.json',
 bytes:6203,sha256:'f844a46ece7eec13f9cfb53991d66281b163318a07668e235cdfeab1340682d6'};
export const CANVAS_SOURCE={path:'output/alg-l06-p017-canvas-v1/canvas-renderer.js',
 bytes:4047416,sha256:'b78c06d8e3f0111ae28ee7d4c90f98381001fe3b3fa0e9e92d6b3ab24bda6a7f'};
export const CANVAS_METADATA={path:'output/alg-l06-p017-canvas-v1/canvas-metadata-v1.json',
 bytes:2666,sha256:'2fd69b0beb4abb0ff80c312925ac0ec0d0286098120e0761792bc419dea160cb'};
export const BROWSER_AUDIO={path:'output/playwright/alg-l06-p017-browser-audio-v1/decode-receipt.json',
 bytes:1163,sha256:'21fe7d44146475d11c3add931f7d8d8b44cb76c5de10b004a8d5e42461e690b9'};
export const MAIN_AUDIO={path:`${AUDIT}/audio-v1/sprite-42-source-v1.mp3`,bytes:298350,
 sha256:'e04bc7591c5da2c00237915391377d9826ae2ba22dc43d962e45c9a9f7c00d4f'};
export const SA_COPY={path:`${AUDIT}/audio-v1/separate-sa-source-v1.mp3`,bytes:SA.bytes,
 sha256:SA.sha256};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
// Source complexity is behavior-heavy; the maintained implementation is in the
// advanced-manual production lane. They are separate classifications.
export const COMPLEXITY_LANE='behavior-heavy';
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,browserDecode:BROWSER_AUDIO,
 mainRanges:[MAIN_AUDIO],mainRangeFrames:[[2,721]],mainFrameDomain:'sprite-42',
 initialRawSeekSamples:1673,visualTailAfterNativeEof:true,
 negativeSeekSemanticsResolved:false,syntheticSilenceForAbsentBlocks:false,
 mainRangesConcatenated:false,originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,sourceCopy:SA_COPY,browserDecode:BROWSER_AUDIO,
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
 mainPausedDuringPlayback:true,pendingLoadCancellation:true,returnMainSupported:true,
 audioAccepted:false});
export const GLOSSARY=Object.freeze({
 Equation:{characterId:7,sourceKey:'Equation',entryId:'equation',firstCandidateFrame:11,
  firstFullHitFrame:11,sourceActionSha256:'acec2ddbdec541c53aa048565d1718c6ac9de8c80537fb950d635292318ef1ff',originalClickObserved:false},
 Sentence:{characterId:8,sourceKey:'Sentence',entryId:'sentence',firstCandidateFrame:54,
  firstFullHitFrame:54,sourceActionSha256:'44b6bae99467a6644b8211d8653f308fba066faa54081ab79bd4987e14dc0922',originalClickObserved:false},
 Function:{characterId:9,sourceKey:'Function',entryId:'function',firstCandidateFrame:20,
  firstFullHitFrame:20,sourceActionSha256:'549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8',originalClickObserved:false},
 Rule:{characterId:16,sourceKey:'Rule',entryId:'rule',firstCandidateFrame:68,
  firstFullHitFrame:68,sourceActionSha256:'28bc1817d8f4443043d212b45fb6406de98c38bd0ec3bb888b953940bded24ef',originalClickObserved:false},
 'Output variable':{characterId:19,sourceKey:'Output variable',entryId:'output-variable',firstCandidateFrame:108,
  firstFullHitFrame:108,sourceActionSha256:'c0af837ab29e87b917db2ca7322295643aae9617bcc5ad6ae5f638bed49f9f8d',originalClickObserved:false},
 'Input variable':{characterId:23,sourceKey:'Input variable',entryId:'input-variable',firstCandidateFrame:173,
  firstFullHitFrame:173,sourceActionSha256:'21e104678862baa7b8b6d609bcfb79ad299d455b10e0e964d01397b39b7c954e',originalClickObserved:false},
});
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`});
export const MAINTAINED_PATHS=Object.freeze([
 'packages/demos/src/alg-l06-p017-timeline-v1.ts',
 'packages/demos/src/alg-l06-p017-audio-schedule-v1.ts',
 'packages/demos/src/alg-l06-p017-clock-v1.ts',
 'packages/demos/src/alg-l06-p017-audio-owner-v1.ts',
 'packages/demos/src/alg-l06-p017-optional-spanish-audio-v1.ts',
 'packages/demos/src/alg-l06-p017-native-text-v1.tsx',
 'packages/demos/src/alg-l06-p017-player-v1.tsx',
 'packages/demos/src/generated/alg-l06-p017-audio-plan-v1.ts',
 'packages/demos/src/generated/alg-l06-p017-text-state-v1.ts',
]);
const pin=({path,bytes,sha256})=>({path,bytes,sha256});
function collect(root,item,local,external){
 const exact=pin(item);assert(typeof exact.path==='string','P017 source input path');
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const holder=exact.path.startsWith(`${root}/`)?root:exact.path.startsWith(`${SOURCE_ROOT}/`)
  ?SOURCE_ROOT:path.dirname(exact.path);
 const ref={root:holder,pin:{...exact,path:path.relative(holder,exact.path)}};
 readPin(ref.root,ref.pin);if(holder===root)local.push(ref.pin);else external.push(ref);
}
export function proposedP017Artifacts(root){return {
 module:pinFile(root,ARTIFACT_PATHS.module),timeline:pinFile(root,ARTIFACT_PATHS.timeline),
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
};}
export function readP017Artifacts(root){
 const artifacts={module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime:pinFile(root,ARTIFACT_PATHS.runtime)};
 assert.deepEqual(artifacts.runtime,{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
  'P017 member must be exact copied Canvas source');
 return artifacts;
}
export function p017Runtime(artifacts){return Object.freeze({frameDomain:'sprite-42',frameCount:721,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false});}

/** Verify physical source and exact source-derived inputs without granting admission. */
export function readP017CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const migration=readJsonPin(root,MIGRATION),
  preflight=readJsonPin(root,PREFLIGHT),source=readJsonPin(root,SOURCE_AUDIT),
  frames=readJsonPin(root,FRAME_AUDIT),audio=readJsonPin(root,AUDIO_AUDIT),
  text=readJsonPin(root,TEXT_AUDIT),crosswalk=readJsonPin(root,CROSSWALK),
  canvas=readJsonPin(root,CANVAS_MANIFEST),browser=readJsonPin(root,BROWSER_AUDIO);
 assert.deepEqual([migration.id,migration.animationId,migration.assetId,
  migration.source.swfSha256,migration.runtime.complexity,migration.status],
  [ID,ID,`swf-${SOURCE.sha256}`,SOURCE.sha256,COMPLEXITY_LANE,'preserved']);
 assert.deepEqual([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,
  migration.acceptance.ownerReview.decision],['pending','pending','pending']);
 assert.equal(source.kind,'alg-l06-p017-time-resolved-static-audit-v1');
 assert.deepEqual(pin(source.source),{...SOURCE,path:path.join(SOURCE_ROOT,SOURCE.path)});
 assert.deepEqual([source.identity.animationId,source.identity.sourceOccurrence,
  source.identity.section,source.identity.sectionPageOrdinal,source.identity.mainDomain,
  source.identity.mainFrameCount,source.identity.rootEntryFrame,source.identity.fps],
  [ID,17,'VB',7,'sprite-42',721,6,12]);
 assert.deepEqual([source.rootPlacement.frame,source.rootPlacement.depth], [6,2]);
 assert.deepEqual([source.textDefinitions.length,source.buttons.length],[20,6]);
 assert.equal(source.limits.originalRuntimeObserved,false);
 assert.equal(source.limits.authoritativeClickabilityEstablished,false);
 assert.deepEqual(pin({...source.frameEvidence,
  path:`${SOURCE_AUDIT_BASE}/${source.frameEvidence.path}`}),FRAME_AUDIT);
 assert.deepEqual([frames.sourceSha256,frames.frameDomain,frames.frameCount,frames.frames.length],
  [SOURCE.sha256,'sprite-42',721,721]);
 assert.equal(preflight.identity.animationId,ID);
 assert.deepEqual([preflight.identity.globalOrdinal,preflight.identity.sectionPageOrdinal,
  preflight.swf.summary.staticTextDefinitions,preflight.swf.summary.buttonDefinitions],
  [17,7,20,6]);
 assert.deepEqual([text.animationId,text.sourceSwfSha256,text.frameDomain,text.frameCount,
  text.rootEntryFrame,text.textDefinitions.length,text.textInstances.length],
  [ID,SOURCE.sha256,'sprite-42',721,6,20,44]);
 assert.deepEqual(text.reading.unresolvedLateFragments,[27,29,31,33,36,38,39,40]);
 assert.equal(text.policy.canvasGlyphs,'preserved');
 assert.equal(text.policy.originalRuntimeAccepted,false);
 const expectedButtons=Object.values(GLOSSARY);
 for(const expected of expectedButtons){
  const button=source.buttons.find(row=>row.characterId===expected.characterId);
  const native=text.glossaryControls.find(row=>row.sourceButtonId===expected.characterId);
  const dictionary=crosswalk.entries.find(row=>row.buttonCharacterId===expected.characterId);
  assert(button&&native&&dictionary,`six source-backed glossary controls: ${expected.sourceKey}`);
  assert.deepEqual([button.keyAttribute,button.actionSha256,button.firstStaticFullHitFrame,
   button.actualClickObserved,native.key,native.sourceActionSha256,native.firstCandidateFrame,
   native.firstFullHitFrame,native.originalClickObserved,dictionary.key,dictionary.dictionary.id],
   [expected.sourceKey,expected.sourceActionSha256,expected.firstFullHitFrame,false,
    expected.sourceKey,expected.sourceActionSha256,expected.firstCandidateFrame,
    expected.firstFullHitFrame,false,expected.sourceKey,expected.entryId]);
  assert(dictionary.dictionary.definitions.en&&dictionary.dictionary.definitions.es);
 }
 assert.deepEqual(crosswalk.missingModernKeys,
  ['Sentence','Output variable','Input variable']);
 assert.equal(audio.kind,'alg-l06-p017-audio-source-audit-v1');
 assert.deepEqual([audio.domainCount,audio.streamCount,audio.streams[0].domain,
  audio.streams[0].blockCount],[2,1,'sprite-42',720]);
 assert.deepEqual(audio.trailers,[]);
 assert.deepEqual(audio.streams[0].contiguousRanges.map(row=>[row.firstFrame,row.lastFrame]),
  CONTINUOUS.mainRangeFrames);
 assert.deepEqual(pin(audio.streams[0].extractedMp3),MAIN_AUDIO);
 assert.equal(audio.streams[0].contiguousRanges[0].firstPacket.rawSeekSamples,1673);
 assert.deepEqual(pin(audio.separateSa.copy),SA_COPY);
 assert.equal(audio.limits.negativeSeekSemanticsResolved,false);
 assert.equal(audio.limits.missingBlocksProveAudibleSilence,false);
 assert.equal(audio.limits.separateSaExplicitTriggerRequired,true);
 assert.equal(audio.limits.separateSaSplicedIntoMain,false);
 assert.equal(audio.limits.localeChangeStartsSa,false);
 assert.equal(canvas.kind,'alg-l06-p017-maintained-canvas-v1');
 assert.deepEqual(pin(canvas.source),SOURCE);
 assert.deepEqual([canvas.rootFrame,canvas.mainFrameCount,canvas.stage.width,
  canvas.stage.height],[6,721,800,600]);
 assert.deepEqual([canvas.sourceGlyphRendering.definitions,canvas.sourceGlyphRendering.dynamicFields,
  canvas.sourceGlyphRendering.preserved,canvas.sourceGlyphRendering.nativeBinding],
  [20,0,true,'semantic-flow-companion']);
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_SOURCE)));
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_METADATA)));
 assert.equal(browser.kind,'alg-l06-p017-browser-decode-v1');
 assert.deepEqual(browser.results.map(row=>[row.sourceBytes,row.sourceSha256,row.sampleRate,
  row.channels,row.decodedSamples,row.pcmSha256,row.playbackStarted]),[
  [298350,MAIN_AUDIO.sha256,22050,1,1321920,
   '773aa84195395309de137ef77a6dc72922ea075a72e058584dcf7ab489285cb4',false],
  [617568,SA.sha256,48000,1,2117376,
   '84c24c72b5658eedadb439090b2b3fff8971a2e2ce3c12f979bcce4abbd1e0cd',false],
 ]);
 assert.equal(browser.originalRuntimeAccepted,false);assert.equal(browser.listeningAccepted,false);
 const local=[MIGRATION,PREFLIGHT,SOURCE_AUDIT,FRAME_AUDIT,AUDIO_AUDIT,TEXT_AUDIT,CROSSWALK,
  CANVAS_MANIFEST,BROWSER_AUDIO,MAIN_AUDIO,SA_COPY,CANVAS_SOURCE,CANVAS_METADATA,
  ...MAINTAINED_PATHS.map(relative=>pinFile(root,relative))];
 const external=[SOURCE,XML,SA].map(item=>({root:SOURCE_ROOT,pin:item}));
 collect(root,source.inputs.swfmillXml,local,external);
 for(const item of [audio.streams[0].extractedMp3,...text.inputs,
  ...canvas.inputs,...canvas.outputs])collect(root,item,local,external);
 for(const item of Object.values(crosswalk.inputs))collect(root,item,local,external);
 const uniqueExternal=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),prior=uniqueExternal.get(key);
  if(prior)assert.deepEqual(prior,item,`conflicting P017 external source pin: ${key}`);
  else uniqueExternal.set(key,item);}
 return {migration,preflight,source,frames,audio,text,crosswalk,canvas,browser,
  localInputs:uniquePins(local),external:[...uniqueExternal.values()].sort((a,b)=>
   path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
/** A proposal remains acceptance-neutral even after proof preparation. */
export function validateP017AdmissionSemantics(packet,registration,root){
 assert(root,'P017_REQUIRES_CURRENT_ROOT');
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.glossaryActions,GLOSSARY);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=proposedP017Artifacts(root);
 assert.deepEqual(packet.entry?.artifacts,artifacts);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:17,sourceOccurrence:17,sectionCode:'VB',
  sectionPageOrdinal:7,complexityLane:COMPLEXITY_LANE,runtime:p017Runtime(artifacts)}]);
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
 const source=readP017CanonicalSource(root);
 for(const required of [...source.localInputs,...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P017 evidence: ${required.path}`);
 for(const item of packet.integrity.files)
  assert(!FORBIDDEN.has(item.path)&&item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
   `no registration-dependent P017 evidence: ${item.path}`);
 return true;
}
