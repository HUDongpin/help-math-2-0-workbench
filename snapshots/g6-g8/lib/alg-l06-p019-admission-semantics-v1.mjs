/** Source-bound P019 local Current-JS proposal semantics; never registers a page. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p019';
export const CALIBRATION='g678-alg-l06-p019-current-js-20260929-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB12.swf',bytes:111550,
 sha256:'df8be172fd738ec4fca7bca02b0f166c88676f062170e6cee7b3a1081a91adec'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB12.mp3',bytes:238896,
 sha256:'4c9c5df0d49d8a612a00c73f9dcf31ef63a4d34ab6c458625432e71b46c129d9'};
export const MIGRATION={path:`migrations/${ID}/migration.json`,bytes:9203,
 sha256:'5f59b2ab188770cc96a1ea9bbdc23d6b2b1c677c2d3f99bf6d48c6f37951b79c'};
export const INTAKE={path:'output/alg-l06-p019-intake-recon-v1/intake-recon-v1.json',bytes:6790,
 sha256:'320fef2c23ef37d3293152b3c7ac81ae13b3a187871d899544e01bc3da0963d9'};
export const SOURCE_AUDIT={path:'output/alg-l06-p019-source-audit-v1/time-resolved-audit-v1.json',bytes:158453,
 sha256:'bfc110b15850c17cb78c874da171c2a0635b4db1ed3c2f27a0a05013cf510dc1'};
export const FRAME_AUDIT={path:'output/alg-l06-p019-source-audit-v1/frame-states-v1.json',bytes:8844901,
 sha256:'ad4913b2ac3f2086c5bc5d335bb3ebd4e8356d2782df5b13e0b1b776b04fd990'};
export const TEXT_AUDIT={path:`migrations/${ID}/audit/text-state-v1/text-state-source-v1.json`,bytes:39118,
 sha256:'a8ffb053aee25429a1a1025fb088059c6a8ab7c8ba53fcd2f433127de5ccb63d'};
export const CROSSWALK={path:'output/alg-l06-p019-glossary-audit-v1/six-term-crosswalk-v1.json',bytes:10805,
 sha256:'a7bd4ba5e23059cf8e9479859191df2cb0a2edf9e9f650b2bf3fdba76db70938'};
export const AUDIO_AUDIT={path:'output/alg-l06-p019-audio-v1/audio-source-audit-v1.json',bytes:102589,
 sha256:'b565a8e5e38fc8076a9aa43ef0f79f1dd5aa333d1cfa28895e1c6fb36f02fb8d'};
export const AUDIO_PLAN={path:'output/alg-l06-p019-audio-v1/audio-plan-v1.json',bytes:2434,
 sha256:'5c49daa9bb7ca03b1ff53487e8ff87138ecfd89af7e158b9a42b4d23508eda44'};
export const BROWSER_AUDIO={path:'output/alg-l06-p019-audio-v1/decode-receipt.json',bytes:1160,
 sha256:'4ef9b6b86bec362e67d4b3e5fbc53781a86040ad82e81657d1bbf0a27a405e6b'};
export const MAIN_AUDIO={path:'output/alg-l06-p019-audio-v1/sprite-37-source-v1.mp3',bytes:144950,
 sha256:'0817bac5188a2a24d9eb48b3c8bffd293f31b715c4816e7159467d00c83f49ad'};
export const SA_COPY={path:'output/alg-l06-p019-audio-v1/separate-sa-source-v1.mp3',bytes:SA.bytes,
 sha256:SA.sha256};
export const CANVAS_MANIFEST={path:'output/alg-l06-p019-canvas-v1/canvas-manifest.json',bytes:7220,
 sha256:'edd1932226603d9dbd19f8feadd676ca7f3655cb51f135aee2338df2a9283558'};
export const CANVAS_SOURCE={path:'output/alg-l06-p019-canvas-v1/canvas-renderer.js',bytes:1434313,
 sha256:'8e33f562010cb30f4dece352cb4167d9b3caed1128605098cea0a12d2b0db59b'};
export const CANVAS_METADATA={path:'output/alg-l06-p019-canvas-v1/canvas-metadata-v1.json',bytes:2557,
 sha256:'a42e75a15eac1b16dc9b81df25a475223bebf23ac39fad71d69362a3826abfe2'};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='behavior-heavy';
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,browserDecode:BROWSER_AUDIO,
 mainRanges:[MAIN_AUDIO],mainRangeFrames:[[2,351]],mainFrameDomain:'sprite-37',
 initialRawSeekSamples:1673,nativeAudioEndPosition:350.6078911564626,
 visualTailAfterNativeEof:true,zeroPayloadBlockFrames:[3],negativeSeekSemanticsResolved:false,
 syntheticSilenceForAbsentBlocks:false,mainRangesConcatenated:false,
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,sourceCopy:SA_COPY,browserDecode:BROWSER_AUDIO,
 trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
 mainPausedDuringPlayback:true,pendingLoadCancellation:true,returnMainSupported:true,
 audioAccepted:false});
export const GLOSSARY=Object.freeze({
 'Function table':{characterId:8,sourceKey:'Function table',entryId:'function-table',
  sourceActionSha256:'fd3c089363c637cc80cecfb8ae7e233a7fd5421b9b42df1b5013c23a0379f0cc',
  instances:[{instanceId:'sprite-37/depth-4/generation-1',depth:4,labelTextId:6,
   labelRunText:'function table',firstCandidateFrame:22,firstFullHitFrame:22,
   sourcePlacementTagSha256:'68dde6ddb9c7c0e57a6504d863b2f03821a35550af69906a2b04d04dc6241169'}],
  originalClickObserved:false},
 Input:{characterId:9,sourceKey:'Input',entryId:'input',
  sourceActionSha256:'2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5',
  instances:[{instanceId:'sprite-37/depth-6/generation-1',depth:6,labelTextId:6,
   labelRunText:'inputs',firstCandidateFrame:54,firstFullHitFrame:54,
   sourcePlacementTagSha256:'e21b59eeb9a40e811571ec90827fbbbdc0edfa03c9e637aa322c125d090d4904'}],
  originalClickObserved:false},
 Pair:{characterId:10,sourceKey:'Pair',entryId:'pair',
  sourceActionSha256:'708bba24fc8b1c7c7252dfa59b8e72c16647430a2f0b5c5b9729bc5f821eefec',
  instances:[{instanceId:'sprite-37/depth-8/generation-1',depth:8,labelTextId:6,
   labelRunText:'pairs',firstCandidateFrame:47,firstFullHitFrame:47,
   sourcePlacementTagSha256:'4e0f6fb9bc314da0824d8d199b5e5d99fb4f9eef7c7f3359cbe64f8eca8bd1a0'}],
  originalClickObserved:false},
 Table:{characterId:11,sourceKey:'Table',entryId:'table',
  sourceActionSha256:'15ba5ffa905f89dafc929bc0a204cc3521c3e705230819ae6b069f798e19b58d',
  instances:[{instanceId:'sprite-37/depth-10/generation-1',depth:10,labelTextId:6,
   labelRunText:'table',firstCandidateFrame:29,firstFullHitFrame:29,
   sourcePlacementTagSha256:'922ee775717555afa5841426df801ddb7533c4408d413fc398780dd8a32693e1'}],
  originalClickObserved:false},
 Output:{characterId:19,sourceKey:'Output',entryId:'output',
  sourceActionSha256:'1262eac21bf8a718d551c8d7b046220855f8f878214783cfdfb7d0c37f5ff5c7',
  instances:[{instanceId:'sprite-37/depth-16/generation-1',depth:16,labelTextId:18,
   labelRunText:'outputs',firstCandidateFrame:63,firstFullHitFrame:63,
   sourcePlacementTagSha256:'253d7f092895bc979d56c67dd6fce2df98b4d0261a53820cb591584ee2827740'}],
  originalClickObserved:false},
 Function:{characterId:20,sourceKey:'Function',entryId:'function',
  sourceActionSha256:'549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8',
  instances:[{instanceId:'sprite-37/depth-18/generation-1',depth:18,labelTextId:18,
   labelRunText:'function',firstCandidateFrame:74,firstFullHitFrame:74,
   sourcePlacementTagSha256:'98229d1b25215c628625ccfd59ee6a6e8e5ba1068ac712e693e83c66ff59b22c'}],
  originalClickObserved:false},
});
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`});
export const MAINTAINED_PATHS=Object.freeze([
 'packages/demos/src/alg-l06-p019-timeline-v1.ts',
 'packages/demos/src/alg-l06-p019-audio-schedule-v1.ts',
 'packages/demos/src/alg-l06-p019-clock-v1.ts',
 'packages/demos/src/alg-l06-p019-audio-owner-v1.ts',
 'packages/demos/src/alg-l06-p019-optional-spanish-audio-v1.ts',
 'packages/demos/src/alg-l06-p019-native-text-v1.tsx',
 'packages/demos/src/alg-l06-p019-player-v1.tsx',
 'packages/demos/src/generated/alg-l06-p019-text-state-v1.ts',
]);
const pin=({path,bytes,sha256})=>({path,bytes,sha256});
function collect(root,item,local,external){
 const exact=pin(item);assert(typeof exact.path==='string','P019 source input path');
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const holder=exact.path.startsWith(`${root}/`)?root:exact.path.startsWith(`${SOURCE_ROOT}/`)
  ?SOURCE_ROOT:path.dirname(exact.path);
 const ref={root:holder,pin:{...exact,path:path.relative(holder,exact.path)}};
 readPin(ref.root,ref.pin);if(holder===root)local.push(ref.pin);else external.push(ref);
}
export function proposedP019Artifacts(root){return {
 module:pinFile(root,ARTIFACT_PATHS.module),timeline:pinFile(root,ARTIFACT_PATHS.timeline),
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
};}
export function readP019Artifacts(root){
 const artifacts={module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime:pinFile(root,ARTIFACT_PATHS.runtime)};
 assert.deepEqual(artifacts.runtime,{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
  'P019 member must be exact copied Canvas source');
 return artifacts;
}
export function p019Runtime(artifacts){return Object.freeze({frameDomain:'sprite-37',frameCount:351,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false});}

/** Verify physical source and source-derived files without granting admission. */
export function readP019CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const migration=readJsonPin(root,MIGRATION),intake=readJsonPin(root,INTAKE),
  source=readJsonPin(root,SOURCE_AUDIT),frames=readJsonPin(root,FRAME_AUDIT),
  text=readJsonPin(root,TEXT_AUDIT),crosswalk=readJsonPin(root,CROSSWALK),
  audio=readJsonPin(root,AUDIO_AUDIT),plan=readJsonPin(root,AUDIO_PLAN),
  browser=readJsonPin(root,BROWSER_AUDIO),canvas=readJsonPin(root,CANVAS_MANIFEST),
  metadata=readJsonPin(root,CANVAS_METADATA);
 assert.deepEqual([migration.id,migration.animationId,migration.assetId,
  migration.source.swfSha256,migration.runtime.complexity,migration.status],
  [ID,ID,`swf-${SOURCE.sha256}`,SOURCE.sha256,COMPLEXITY_LANE,'preserved']);
 assert.deepEqual([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,migration.acceptance.ownerReview.decision],
  ['pending','pending','pending']);
 assert.equal(intake.identity.animationId,ID);
 assert.deepEqual(pin(intake.source.swf),{...SOURCE,path:path.join(SOURCE_ROOT,SOURCE.path)});
 assert.deepEqual(pin(intake.source.lessonXml),{...XML,path:path.join(SOURCE_ROOT,XML.path)});
 assert.deepEqual(pin(intake.source.separateSaCandidate),
  {...SA,path:path.join(SOURCE_ROOT,SA.path)});
 assert.deepEqual([intake.identity.globalOrdinal,intake.identity.sectionCode,
  intake.identity.sectionPageOrdinal,intake.source.samePathFlaExists],[19,'VB',9,false]);
 assert.equal(source.kind,'alg-l06-p019-time-resolved-static-audit-v1');
 assert.deepEqual(pin(source.source),{...SOURCE,path:path.join(SOURCE_ROOT,SOURCE.path)});
 assert.deepEqual([source.identity.animationId,source.identity.sourceOccurrence,
  source.identity.section,source.identity.sectionPageOrdinal,source.identity.mainDomain,
  source.identity.mainFrameCount,source.identity.rootEntryFrame,source.identity.fps],
  [ID,19,'VB',9,'sprite-37',351,6,12]);
 assert.deepEqual([source.rootPlacement.frame,source.rootPlacement.depth],[6,3]);
 assert.deepEqual([source.textDefinitions.length,source.instances.length,
  source.instances.filter(item=>item.role==='static-text').length,source.buttons.length],
  [15,44,38,6]);
 assert.deepEqual(source.maskPlacements.map(item=>
  [item.frame,item.characterId,item.depth,item.clipDepth]),
  [[2,3,1,12],[57,16,13,20],[168,25,24,33],[182,32,24,33]]);
 assert.deepEqual(source.replacementPlacements.map(item=>
  [item.frame,item.depth,item.fromCharacterId,item.toCharacterId]),
  [[261,36,33,34],[261,37,31,30]]);
 assert.equal(source.limits.morphMaskRatioSourceVerified,true);
 assert.equal(source.limits.originalRuntimeObserved,false);
 assert.equal(source.limits.authoritativeClickabilityEstablished,false);
 assert.deepEqual(pin({...source.frameEvidence,
  path:`output/alg-l06-p019-source-audit-v1/${source.frameEvidence.path}`}),FRAME_AUDIT);
 assert.deepEqual([frames.sourceSha256,frames.frameDomain,frames.frameCount,frames.frames.length],
  [SOURCE.sha256,'sprite-37',351,351]);
 assert.deepEqual([text.animationId,text.sourceSwfSha256,text.frameDomain,text.frameCount,
  text.rootEntryFrame,text.textDefinitions.length,text.textInstances.length],
  [ID,SOURCE.sha256,'sprite-37',351,6,15,38]);
 assert.deepEqual(text.reading,{prose:[6,18],sourceHighlight:[12,13,14,15,21],
  tableHeadings:[23,24],tableCells:[26,27,28,29,30,31]});
 assert.deepEqual(text.tableRows.map(row=>[row.inputText,row.outputText,
  row.firstCompletePairFrame,row.completePairSpans]),[
  ['2','3',171,[[171,351]]],['3','5',175,[[175,351]]],
  ['5','-2',178,[[178,351]]],['7','1',182,[[182,351]]]]);
 assert.deepEqual(text.tableRows.map(row=>[row.inputInstanceId,row.outputInstanceId]),[
  ['sprite-37/depth-25/generation-1','sprite-37/depth-28/generation-1'],
  ['sprite-37/depth-26/generation-1','sprite-37/depth-29/generation-1'],
  ['sprite-37/depth-27/generation-1','sprite-37/depth-30/generation-1'],
  ['sprite-37/depth-32/generation-1','sprite-37/depth-31/generation-1']]);
 assert.equal(text.policy.canvasGlyphs,'preserved');
 assert.equal(text.policy.language,'source-en-fallback');
 assert.equal(text.policy.originalRuntimeAccepted,false);
 assert.equal(text.glossaryControls.length,6);
 assert.deepEqual(crosswalk.missingModernKeys,['Function table','Pair']);
 assert.deepEqual([crosswalk.active.registeredLessonPages,crosswalk.active.glossaryEntryCount],
  [29,30]);
 for(const expected of Object.values(GLOSSARY)){
  const button=source.buttons.find(row=>row.characterId===expected.characterId);
  const dictionary=crosswalk.entries.find(row=>row.buttonCharacterId===expected.characterId);
  assert(button&&dictionary,`six source-backed glossary controls: ${expected.sourceKey}`);
  assert.deepEqual([button.keyAttribute,button.actionSha256,button.actualClickObserved,
   dictionary.key,dictionary.dictionary.id],
   [expected.sourceKey,expected.sourceActionSha256,false,expected.sourceKey,expected.entryId]);
  assert.equal(button.instances.length,1);assert.equal(expected.instances.length,1);
  const instance=expected.instances[0],original=button.instances[0];
  const native=text.glossaryControls.find(row=>row.sourceButtonInstanceId===instance.instanceId);
  assert(native,`exact P019 source instance: ${instance.instanceId}`);
  assert.deepEqual([original.instanceId,original.depth,original.sourcePlacementTagSha256,
   original.sourceLabelBinding.textId,original.sourceLabelBinding.runText,
   original.firstSourceReadyFrame,original.firstStaticFullHitFrame,
   original.lastActiveFrame,native.key,native.sourceButtonId,native.sourceActionSha256,
   native.sourceLabelTextId,native.sourceLabelRunText,native.firstCandidateFrame,
   native.firstFullHitFrame,native.originalClickObserved],
   [instance.instanceId,instance.depth,instance.sourcePlacementTagSha256,
    instance.labelTextId,instance.labelRunText,instance.firstCandidateFrame,
    instance.firstFullHitFrame,351,expected.sourceKey,expected.characterId,
    expected.sourceActionSha256,instance.labelTextId,instance.labelRunText,
    instance.firstCandidateFrame,instance.firstFullHitFrame,false]);
  assert(dictionary.dictionary.definitions.en&&dictionary.dictionary.definitions.es);
 }
 assert.equal(audio.kind,'alg-l06-p019-audio-source-audit-v1');
 assert.deepEqual(audio.domains.map(domain=>[domain.id,domain.streamHeadCount,
  domain.blockCount,domain.trailer]),
  [['root',0,0,null],['sprite-2',0,0,null],['sprite-37',1,350,null]]);
 assert.deepEqual([audio.main.domain,audio.main.declaredFrames,audio.main.firstBlockFrame,
  audio.main.lastBlockFrame,audio.main.blockCount,audio.main.firstBlockRawSeekSamples,
  audio.main.candidateNativeEndFrame],
  ['sprite-37',351,2,351,350,1673,350.6078911564626]);
 assert.deepEqual(audio.main.absentBlockFrames,[]);
 assert.deepEqual(audio.main.zeroPayloadBlocks.map(block=>block.frame),[3]);
 assert.deepEqual(audio.main.negativeSeekBlocks,[]);
 assert.deepEqual(pin(audio.main.extractedMp3),MAIN_AUDIO);
 assert.deepEqual(pin(audio.separateSa.copy),SA_COPY);
 assert.equal(audio.limits.separateSaExplicitTriggerRequired,true);
 assert.equal(audio.limits.separateSaSplicedIntoMain,false);
 assert.equal(audio.limits.localeChangeStartsSa,false);
 assert.equal(plan.kind,'alg-l06-p019-maintained-audio-plan-v1');
 assert.deepEqual([plan.mainAssets.length,plan.mainAssets[0].sourceSha256,
  plan.disposition.candidateNativeEndFrame,plan.disposition.lastVisualFrame,
  plan.optionalSpanishAudio.sourceSha256],
  [1,MAIN_AUDIO.sha256,350.6078911564626,351,SA.sha256]);
 assert.deepEqual(plan.disposition.mainRanges,CONTINUOUS.mainRangeFrames);
 assert.deepEqual(plan.disposition.sourceZeroPayloadBlockFrames,[3]);
 assert.equal(plan.disposition.separateSaSpliced,false);
 assert.equal(plan.disposition.localeStartsAudio,false);
 assert.equal(plan.disposition.originalRuntimeAccepted,false);
 assert.equal(browser.kind,'alg-l06-p019-browser-decode-v1');
 assert.deepEqual(browser.results.map(row=>[row.sourceBytes,row.sourceSha256,row.sampleRate,
  row.channels,row.decodedSamples,row.pcmSha256,row.playbackStarted]),[
  [144950,MAIN_AUDIO.sha256,22050,1,642240,
   'e2a3cde4fdb4f7626831ea295541a754562d59012af969480d9bb4b45052734b',false],
  [238896,SA.sha256,48000,1,819072,
   'acff960bea9c147864d74f2784cab292f5a96d9063c52ec76fd6b422e8b3ec9c',false]]);
 assert.equal(browser.originalRuntimeAccepted,false);assert.equal(browser.listeningAccepted,false);
 assert.equal(canvas.kind,'alg-l06-p019-maintained-canvas-v1');
 assert.deepEqual(pin(canvas.source),SOURCE);
 assert.deepEqual([canvas.rootFrame,canvas.mainFrameCount,canvas.stage.width,
  canvas.stage.height],[6,351,800,600]);
 assert.deepEqual([canvas.sourceGlyphRendering.definitions,canvas.sourceGlyphRendering.dynamicFields,
  canvas.sourceGlyphRendering.preserved],[15,0,true]);
 assert.deepEqual(canvas.sourceMorphCharacterIds,[25]);
 assert.equal(canvas.sourceClipMasks.length,4);
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_SOURCE)));
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_METADATA)));
 assert.deepEqual([metadata.animationId,metadata.sourceSwfSha256,metadata.frameDomain,
  metadata.frameCount,metadata.sourceGlyphRendering.preserved],
  [ID,SOURCE.sha256,'sprite-37',351,true]);
 const local=[MIGRATION,INTAKE,SOURCE_AUDIT,FRAME_AUDIT,TEXT_AUDIT,CROSSWALK,
  AUDIO_AUDIT,AUDIO_PLAN,BROWSER_AUDIO,MAIN_AUDIO,SA_COPY,CANVAS_MANIFEST,
  CANVAS_SOURCE,CANVAS_METADATA,...MAINTAINED_PATHS.map(relative=>pinFile(root,relative))];
 const external=[SOURCE,XML,SA].map(item=>({root:SOURCE_ROOT,pin:item}));
 for(const item of [intake.source.swfmillXml,source.inputs.swfmillXml,
  source.inputs.ffdecSpriteFrames,...text.inputs,plan.sourceAudit,plan.browserDecode,
  ...canvas.inputs,...canvas.outputs,audio.main.extractedMp3,audio.separateSa.copy])
  if(item)collect(root,item,local,external);
 for(const item of Object.values(crosswalk.inputs))collect(root,item,local,external);
 const uniqueExternal=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),prior=uniqueExternal.get(key);
  if(prior)assert.deepEqual(prior,item,`conflicting P019 external source pin: ${key}`);
  else uniqueExternal.set(key,item);}
 return {migration,intake,source,frames,text,crosswalk,audio,plan,browser,canvas,metadata,
  localInputs:uniquePins(local),external:[...uniqueExternal.values()].sort((a,b)=>
   path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
/** A proposal remains acceptance-neutral even after proof preparation. */
export function validateP019AdmissionSemantics(packet,registration,root){
 assert(root,'P019_REQUIRES_CURRENT_ROOT');
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.glossaryActions,GLOSSARY);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const artifacts=proposedP019Artifacts(root);
 assert.deepEqual(packet.entry?.artifacts,artifacts);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:19,sourceOccurrence:19,sectionCode:'VB',
  sectionPageOrdinal:9,complexityLane:COMPLEXITY_LANE,runtime:p019Runtime(artifacts)}]);
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
 const source=readP019CanonicalSource(root);
 for(const required of [...source.localInputs,...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P019 evidence: ${required.path}`);
 for(const item of packet.integrity.files)
  assert(!FORBIDDEN.has(item.path)&&item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
   `no registration-dependent P019 evidence: ${item.path}`);
 return true;
}
