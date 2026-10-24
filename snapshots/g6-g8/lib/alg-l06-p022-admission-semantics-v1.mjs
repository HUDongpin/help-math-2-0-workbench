/** Source-bound P022 local Current-JS proposal. It never registers a page. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p022';
export const CALIBRATION='g678-alg-l06-p022-current-js-20260930-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB15.swf',bytes:135254,
 sha256:'a5868c68164c6401d2d79a8548f60f0d62401ca14f01f0494ef8ae6fd0e2d7c1'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB15.mp3',bytes:252000,
 sha256:'2ced2d44148da73af856808834d32083d61d61d8073acdfe48650c1e9809a7bb'};
export const AUDIT={path:'output/alg-l06-p022-source-audit-v1/time-resolved-audit-v1.json',
 bytes:354947,sha256:'9653e1a21712f98590f35bb9522424c25c391efbca790946ab9177d8fff7d08c'};
export const FRAMES={path:'output/alg-l06-p022-source-audit-v1/frame-states-v1.json',
 bytes:17690673,sha256:'25d24c99b5923ddf09ed452982c8b2483f2ab679103f93b951a603ea5303fd6f'};
export const TEXT={path:'output/alg-l06-p022-native-text-v1/text-state-source-v1.json',
 bytes:75302,sha256:'016841c1f900d1460c2c15ce2fd54945d1e7bbd68a4efa7d2322dc3e180c1d21'};
export const AUDIO={path:'output/alg-l06-p022-audio-v1/audio-source-audit-v1.json',
 bytes:123876,sha256:'d0518a73cd88ef55ef6f5f46ad31c86ffe6678667b8df85c2d2c8531ac3fcdc6'};
export const AUDIO_PLAN={path:'output/alg-l06-p022-audio-v1/audio-domain-plan-v2.json',
 bytes:5314,sha256:'130aee754215123f8416750910c1ad90f2252101e90c6661d7b788aa55b91b26'};
export const CROSSWALK={path:'output/alg-l06-p022-glossary-audit-v1/six-term-crosswalk-v1.json',
 bytes:11235,sha256:'d4bb6b50bbbeb205770443c260e62a381bbd8dbd654c98cac6f6d4befbba46ec'};
export const CANVAS={path:'output/alg-l06-p022-canvas-v1/canvas-manifest.json',
 bytes:6931,sha256:'1c0301a3af46f847bd6a5830b39385a32ff7004c5d3f1ec7abe08a46d3aee048'};
export const BINDING={path:'output/alg-l06-p022-host-prep-v1/candidate-source-binding-v1.json',
 bytes:12295,sha256:'25c9c29020d113117f2050fa2ae125c36cb77e121fa511501115db5532440ab4'};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='behavior-heavy';
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/alg-l06-p022-20260930-v1/members/${ID}/canvas-renderer.js`});
export const GATES=Object.freeze({Graph:[7,8],Function:[9,17],Representation:[8,42],
 'Ordered pair':[15,85],Input:[16,91],Output:[17,99]});
const samePin=(a,b)=>assert.deepEqual(a,b);
const local=(root,relative)=>pinFile(root,relative);
const sourcePin=(item)=>({path:item.path,bytes:item.bytes,sha256:item.sha256});

export function proposedP022Artifacts(root,canvas){
 const output=canvas.outputs.find(row=>row.path==='output/alg-l06-p022-canvas-v1/canvas-renderer.js');
 assert(output,'maintained source Canvas output');
 const runtime=local(root,ARTIFACT_PATHS.runtime);
 assert.deepEqual([runtime.bytes,runtime.sha256],[output.bytes,output.sha256],
  'exact copied Canvas member');
 return {module:local(root,ARTIFACT_PATHS.module),timeline:local(root,ARTIFACT_PATHS.timeline),runtime};
}
export function p022Runtime(artifacts){return {frameDomain:'sprite-67',frameCount:422,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false};}

export function readP022CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const binding=readJsonPin(root,BINDING),migration=readJsonPin(root,
  local(root,`migrations/${ID}/migration.json`));
 assert.deepEqual([binding.kind,binding.animationId,binding.source],
  ['alg-l06-p022-candidate-source-binding-v1',ID,SOURCE]);
 assert.deepEqual([migration.id,migration.animationId,migration.assetId,
  migration.source.swfSha256,migration.runtime.complexity,migration.status],
  [ID,ID,`swf-${SOURCE.sha256}`,SOURCE.sha256,COMPLEXITY_LANE,'preserved']);
 assert.deepEqual([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,migration.acceptance.ownerReview.decision],
  ['pending','pending','pending']);
 for(const item of binding.files)readPin(root,item);
 for(const item of binding.external)readPin(item.root,item.pin);
 for(const item of [SOURCE,XML,SA])assert(binding.external.some(row=>
  row.root===SOURCE_ROOT&&JSON.stringify(row.pin)===JSON.stringify(item)),
  `physical P022 source retained: ${item.path}`);
 const intake=readJsonPin(root,binding.intake),audit=readJsonPin(root,AUDIT),
  frames=readJsonPin(root,local(root,FRAMES.path)),text=readJsonPin(root,TEXT),
  audio=readJsonPin(root,AUDIO),plan=readJsonPin(root,AUDIO_PLAN),
  crosswalk=readJsonPin(root,CROSSWALK),canvas=readJsonPin(root,CANVAS);
 for(const item of [AUDIT,TEXT,AUDIO,AUDIO_PLAN,CROSSWALK,CANVAS])
  assert(binding.files.some(row=>JSON.stringify(row)===JSON.stringify(item)),
   `frozen P022 candidate source pin: ${item.path}`);
 assert.deepEqual([intake.identity.animationId,intake.identity.globalOrdinal,
  intake.identity.xmlOccurrence,intake.identity.sectionCode,
  intake.identity.sectionPageOrdinal,intake.source.samePathFlaExists],
  [ID,22,22,'VB',12,false]);
 assert.deepEqual(sourcePin(intake.source.swf),SOURCE);
 assert.deepEqual(sourcePin(intake.source.lessonXml),XML);
 assert.deepEqual(sourcePin(intake.source.separateSa),SA);
 assert.deepEqual([audit.kind,audit.identity.animationId,audit.identity.mainDomain,
  audit.identity.mainFrameCount,audit.identity.rootEntryFrame,
  audit.identity.rootFrameCount,audit.identity.fps,audit.textDefinitions.length,
  audit.instances.filter(row=>row.role==='static-text').length,
  audit.maskPlacements.length,audit.buttons.length,audit.limits.originalRuntimeObserved],
  ['alg-l06-p022-time-resolved-static-audit-v1',ID,'sprite-67',422,6,10,12,
   36,87,3,6,false]);
 assert.deepEqual(audit.frameEvidence,{path:'frame-states-v1.json',
  bytes:FRAMES.bytes,sha256:FRAMES.sha256});
 samePin(FRAMES,local(root,FRAMES.path));
 assert.deepEqual([frames.sourceSha256,frames.frameDomain,frames.frameCount,frames.frames.length],
  [SOURCE.sha256,'sprite-67',422,422]);
 assert.deepEqual([text.animationId,text.sourceSwfSha256,text.frameDomain,text.frameCount,
  text.textDefinitions.length,text.textInstances.length,text.policy.canvasGlyphs,
  text.policy.language,text.policy.originalRuntimeAccepted],
  [ID,SOURCE.sha256,'sprite-67',422,36,87,'preserved','source-en-fallback',false]);
 assert.deepEqual(text.reading.proseInstanceIds.map(id=>text.textInstances.find(x=>x.instanceId===id)
  ?.completeInkSpans),[[[71,422]],[[110,422]]]);
 assert.deepEqual(text.reading.stepInstanceIds.map(id=>text.textInstances.find(x=>x.instanceId===id)
  ?.completeInkSpans),[[[244,422]],[[273,303]],[[301,303]]]);
 assert.deepEqual([text.orderedPair.firstCompletePairFrame,text.orderedPair.completePairSpans,
  text.orderedPair.sourceTextIds],[361,[[361,422]],[65,64,59,62]]);
 assert.deepEqual([audio.main.domain,audio.main.declaredFrames,audio.main.blockCount,
  audio.main.ranges.length,audio.main.absentBlockFrames,
  audio.main.negativeSeekBlocks.map(x=>[x.frame,x.rawSeekSamples])],
  ['sprite-67',422,404,2,Array.from({length:17},(_,i)=>133+i),[[132,-2018]]]);
 assert.deepEqual(audio.main.ranges.map(x=>[x.id,x.firstBlockFrame,x.lastBlockFrame,
  x.firstBlockRawSeekSamples]),[['main-1',2,132,1673],['main-2',150,422,416]]);
 assert.deepEqual(plan.main.assets.map(x=>[x.id,x.firstBlockFrame,x.lastBlockFrame,
  x.initialSeekSamples,x.source.sha256]),audio.main.ranges.map(x=>[x.id,
   x.firstBlockFrame,x.lastBlockFrame,x.firstBlockRawSeekSamples,x.extractedMp3.sha256]));
 assert.deepEqual([plan.main.sourceBoundary.rawSeekAt132,
  plan.main.sourceBoundary.originalFlashMeaning,
  plan.main.proposedModernTransport.originalRuntimeAccepted,
  plan.optionalSpanishAudio.activation,plan.optionalSpanishAudio.localeAutoplay,
  plan.optionalSpanishAudio.joinedWithMain],
  [-2018,'unresolved; missing blocks do not prove audible silence',false,
   'explicit-user-only',false,false]);
 assert.deepEqual(sourcePin(audio.separateSa.copy),sourcePin(plan.optionalSpanishAudio.source));
 assert.deepEqual([audio.separateSa.copy.bytes,audio.separateSa.copy.sha256],
  [SA.bytes,SA.sha256]);
 assert.deepEqual([canvas.kind,canvas.source.sha256,canvas.rootFrame,
  canvas.mainFrameCount,canvas.sourceGlyphRendering.definitions,
  canvas.sourceGlyphRendering.preserved,canvas.sourceClipMasks.length,
  canvas.sourceGlossaryButtons.length],
  ['alg-l06-p022-maintained-canvas-v1',SOURCE.sha256,6,422,36,true,3,6]);
 assert.deepEqual(canvas.sourceClipMasks.map(x=>[x.frame,x.depth,x.clipDepth]),
  [[2,1,10],[72,11,20],[211,59,61]]);
 assert.deepEqual([crosswalk.identity.animationId,crosswalk.entries.length,
  crosswalk.missingModernKeys,crosswalk.originalHostRunObserved],
  [ID,6,['Graph','Representation'],false]);
 const glossary={};
 for(const [key,[characterId,frame]] of Object.entries(GATES)){
  const button=audit.buttons.find(x=>x.keyAttribute===key),
   native=text.glossaryControls.find(x=>x.key===key),
   dictionary=crosswalk.entries.find(x=>x.key===key);
  assert(button&&native&&dictionary,`P022 exact glossary ${key}`);
  assert.equal(button.characterId,characterId);assert.equal(button.instances.length,1);
  const instance=button.instances[0],label=instance.sourceLabelBinding;
  assert.deepEqual([instance.instanceId,instance.firstSourceReadyFrame,
   instance.firstStaticFullHitFrame,instance.lastActiveFrame,
   button.actionSha256,label.textId,label.textInstanceId,label.segment],
   [native.sourceButtonInstanceId,frame,frame,422,native.sourceActionSha256,
    native.sourceLabelTextId,native.sourceLabelTextInstanceId,native.sourceLabelSegment]);
  assert.deepEqual(native.availableSpans,[[frame,422]]);
  assert.deepEqual([dictionary.buttonCharacterId,dictionary.dictionary.sourceKeyAttribute,
   dictionary.dictionary.id],[characterId,key,key.toLowerCase().replaceAll(' ','-')]);
  assert(dictionary.dictionary.definitions.en&&dictionary.dictionary.definitions.es);
  if(key==='Graph'||key==='Representation')assert.equal(dictionary.modern.present,false);
  glossary[key]={characterId,sourceKey:key,entryId:dictionary.dictionary.id,
   sourceActionSha256:button.actionSha256,instances:[{instanceId:instance.instanceId,
    depth:instance.depth,labelTextId:label.textId,labelTextInstanceId:label.textInstanceId,
    labelRunText:label.runText,labelSegment:label.segment,
    sourcePlacementTagSha256:instance.sourcePlacementTagSha256,
    firstCandidateFrame:frame,firstFullHitFrame:frame}],originalClickObserved:false};
 }
 const artifacts=proposedP022Artifacts(root,canvas);
 const localInputs=uniquePins([BINDING,local(root,`migrations/${ID}/migration.json`),
  ...binding.files,...Object.values(artifacts)]);
 return {binding,migration,intake,audit,frames,text,audio,plan,crosswalk,canvas,
  glossary,artifacts,localInputs,external:binding.external};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
export function validateP022AdmissionSemantics(packet,registration,root){
 assert(root,'P022_REQUIRES_CURRENT_ROOT');
 const source=readP022CanonicalSource(root),artifacts=source.artifacts;
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.sourceRoot,
  packet.scope,packet.deploymentScope],
  [1,CALIBRATION,SOURCE_ROOT,'private-engineering','local-only']);
 assert.deepEqual([packet.source,packet.sourceXml,packet.optionalSpanishAudio.source,
  packet.glossaryActions,packet.acceptanceEffects],
  [SOURCE,XML,SA,source.glossary,ACCEPTANCE]);
 assert.deepEqual(packet.continuousSource.mainRanges,[[2,132],[150,422]]);
 assert.equal(packet.continuousSource.mainRangeAssets.length,2);
 assert.deepEqual(packet.continuousSource.sourceNegativeSeek,{frame:132,samples:-2018});
 assert.deepEqual(packet.continuousSource.sourceMissingBlockFrames,
  Array.from({length:17},(_,i)=>133+i));
 assert.equal(packet.continuousSource.mainRangesConcatenated,false);
 assert.equal(packet.continuousSource.syntheticSilenceAdded,false);
 assert.equal(packet.optionalSpanishAudio.trigger,'explicit-user-only');
 assert.equal(packet.optionalSpanishAudio.localeAutoplay,false);
 assert.equal(packet.optionalSpanishAudio.mainStreamSpliced,false);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert.deepEqual(packet.entry,{key:ID,module:`./modules/${ID}`,
  maturity:'private-current-js',complexityLane:COMPLEXITY_LANE,artifacts});
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:22,sourceOccurrence:22,sectionCode:'VB',
  sectionPageOrdinal:12,complexityLane:COMPLEXITY_LANE,runtime:p022Runtime(artifacts)}]);
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert.deepEqual(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert.equal(packet.integrity.completeTransitiveClosure,false);
 const evidence=new Map(packet.integrity.files.map(item=>[item.path,item]));
 for(const item of [...source.localInputs,...Object.values(artifacts)])
  assert.deepEqual(evidence.get(item.path),item,`exact P022 evidence: ${item.path}`);
 for(const item of packet.integrity.files)assert(!FORBIDDEN.has(item.path)&&
  item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
  !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
  `no registration-dependent P022 evidence: ${item.path}`);
 return true;
}
