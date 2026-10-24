/** Source-bound P023 local Current-JS candidate; this module never registers a page. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p023';
export const CALIBRATION='g678-alg-l06-p023-current-js-20260930-v4';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v4.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB16.swf',bytes:137816,
 sha256:'40388017c66f714bdbda480558669aee11a0d3426ed55c74f0976eb2ca85097a'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB16.mp3',bytes:292320,
 sha256:'c8da225f06545b2fd3b7edb77be46af198337b168dadd3c869cd9613377c33c5'};
export const BINDING={path:'output/alg-l06-p023-host-prep-v1/candidate-source-binding-v1.json',
 bytes:11975,sha256:'bf524e4dabd6db9659f427ff9dec12dfbc5d5db7713b9cfe9eb94a7862c1c9a6'};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='behavior-heavy';
export const GATES=Object.freeze({Domain:[8,21],Function:[11,30],Set:[10,47],Input:[9,68]});
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/alg-l06-p023-20260930-v1/members/${ID}/canvas-renderer.js`});
const local=(root,relative)=>pinFile(root,relative);
const corePin=item=>({path:item.path,bytes:item.bytes,sha256:item.sha256});
const equal=(a,b,label)=>assert.deepEqual(a,b,label);

export function proposedP023Artifacts(root,canvas){
 const output=canvas.outputs.find(row=>row.path==='output/alg-l06-p023-canvas-v1/canvas-renderer.js');
 assert(output,'P023 maintained source Canvas output');
 const runtime=local(root,ARTIFACT_PATHS.runtime);
 equal([runtime.bytes,runtime.sha256],[output.bytes,output.sha256],
  'P023 copied Canvas member exact bytes');
 return {module:local(root,ARTIFACT_PATHS.module),timeline:local(root,ARTIFACT_PATHS.timeline),runtime};
}
export function p023Runtime(artifacts){return {frameDomain:'sprite-38',frameCount:410,
 rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false};}

export function readP023CanonicalSource(root){
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 const binding=readJsonPin(root,BINDING),migrationPin=local(root,`migrations/${ID}/migration.json`),
  migration=readJsonPin(root,migrationPin);
 equal([binding.kind,binding.animationId,binding.source],
  ['alg-l06-p023-candidate-source-binding-v1',ID,SOURCE]);
 equal([binding.historicalCrosswalkIndex?.path,binding.historicalCrosswalkIndex?.role],
  ['catalog/g678-admission-v1/index-v76.json',
   'dated glossary crosswalk input; not the current candidate host activation']);
 equal([migration.id,migration.animationId,migration.assetId,migration.source.swfSha256,
  migration.runtime.complexity,migration.status],
  [ID,ID,`swf-${SOURCE.sha256}`,SOURCE.sha256,COMPLEXITY_LANE,'preserved']);
 equal([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,migration.acceptance.ownerReview.decision],
  ['pending','pending','pending']);
 for(const pin of binding.files)readPin(root,pin);
 for(const row of binding.external)readPin(row.root,row.pin);
 for(const pin of [SOURCE,XML,SA])assert(binding.external.some(row=>
  row.root===SOURCE_ROOT&&JSON.stringify(row.pin)===JSON.stringify(pin)),
  `physical P023 source retained: ${pin.path}`);
 const intake=readJsonPin(root,binding.intake),audit=readJsonPin(root,binding.audit),
  framesPin=local(root,'output/alg-l06-p023-source-audit-v1/frame-states-v1.json'),
  frames=readJsonPin(root,framesPin),text=readJsonPin(root,binding.text),
  canvas=readJsonPin(root,binding.canvas),audio=readJsonPin(root,binding.audio),
  plan=readJsonPin(root,binding.audioPlan),crosswalk=readJsonPin(root,binding.crosswalk);
 equal([intake.identity.globalOrdinal,intake.identity.xmlOccurrence,
  intake.identity.sectionCode,intake.identity.sectionPageOrdinal,
  intake.source.samePathFlaExists], [23,23,'VB',13,false]);
 equal([corePin(intake.source.swf),corePin(intake.source.lessonXml),
  corePin(intake.source.separateSa)],[SOURCE,XML,SA]);
 equal([audit.kind,audit.identity.animationId,audit.identity.mainDomain,
  audit.identity.mainFrameCount,audit.identity.rootEntryFrame,audit.identity.rootFrameCount,
  audit.identity.fps,audit.textDefinitions.length,audit.instances.filter(x=>x.role==='static-text').length,
  audit.maskPlacements.map(x=>[x.frame,x.characterId,x.depth,x.clipDepth]),audit.buttons.length,
  audit.limits.originalRuntimeObserved],
  ['alg-l06-p023-time-resolved-static-audit-v1',ID,'sprite-38',410,6,10,12,21,56,
   [[11,3,3,14]],4,false]);
 equal(audit.frameEvidence,{path:'frame-states-v1.json',bytes:framesPin.bytes,
  sha256:framesPin.sha256});
 equal([frames.sourceSha256,frames.frameDomain,frames.frameCount,frames.frames.length],
  [SOURCE.sha256,'sprite-38',410,410]);
 equal([audit.teachingGeometry.definition.firstCompleteInkFrame,
  audit.teachingGeometry.table.firstCompleteGeometryFrame,
  audit.teachingGeometry.setNotation.firstAllTokensCompleteInkFrame,
  audit.teachingGeometry.setNotation.firstSameLineNonoverlappingGeometricOrderFrame,
  audit.teachingGeometry.setNotation.firstTerminalGeometryFrame], [68,173,394,401,409]);
 equal(audit.teachingGeometry.setNotation.readingOrder.map(x=>[x.text,x.instanceId]),
  [['{','sprite-38/depth-32/generation-1'],['1','sprite-38/depth-26/generation-2'],
   [',','sprite-38/depth-27/generation-7'],['10','sprite-38/depth-28/generation-7'],
   [',','sprite-38/depth-29/generation-8'],['100','sprite-38/depth-30/generation-8'],
   ['}','sprite-38/depth-31/generation-7']]);
 equal([text.animationId,text.sourceSwfSha256,text.frameDomain,text.frameCount,
  text.inventory.textDefinitions,text.inventory.textRuns,text.inventory.spritePlacementInstances,
  text.textInstances.length,text.glossaryControls.length,text.policy.canvasGlyphs,
  text.policy.language,text.policy.originalRuntimeAccepted],
  [ID,SOURCE.sha256,'sprite-38',410,21,29,69,56,4,'preserved','source-en-fallback',false]);
 equal(text.reading.definitionInstanceId,audit.teachingGeometry.definition.instanceId);
 equal(text.reading.tableRows.map(row=>[text.textInstances.find(x=>x.instanceId===row.inputInstanceId)?.text,
  text.textInstances.find(x=>x.instanceId===row.outputInstanceId)?.text]),
  [['1','1'],['10','2'],['100','3']]);
 equal([text.reading.tableFirstCompleteFrame,text.reading.setAllInkSpans,
  text.reading.setOrderedSpans,text.reading.setFirstOrderedFrame],
  [173,[[394,410]],[[401,410]],401]);
 equal([audio.main.domain,audio.main.visualFrames,audio.main.firstBlockFrame,
  audio.main.lastBlockFrame,audio.main.blockCount,audio.main.firstBlockRawSeekSamples,
  audio.main.zeroPayloadBlocks.map(x=>x.frame),audio.main.negativeSeekBlocks],
  ['sprite-38',410,11,410,400,1673,[12],[]]);
 equal([plan.main.frameDomain,plan.main.visualFrames,plan.main.asset.id,
  plan.main.asset.firstBlockFrame,plan.main.asset.lastBlockFrame,
  plan.main.asset.initialSeekSamples,plan.main.asset.decodedSamples,
  plan.main.sourceBlocks.zeroPayloadFrame,plan.main.sourceBlocks.negativeSeekBlocks,
  plan.optionalSpanishAudio.activation,plan.optionalSpanishAudio.localeAutoplay,
  plan.optionalSpanishAudio.joinedWithMain],
  ['sprite-38',410,'main-1',11,410,1673,734400,12,[],
   'explicit-user-only',false,false]);
 equal(corePin(audio.main.extractedMp3),corePin(plan.main.asset.source));
 equal(corePin(audio.separateSa.copy),corePin(plan.optionalSpanishAudio.source));
 equal([canvas.kind,canvas.source.sha256,canvas.rootFrame,canvas.mainFrameCount,
  canvas.sourceGlyphRendering.definitions,canvas.sourceGlyphRendering.preserved,
  canvas.sourceClipMasks.map(x=>[x.frame,x.characterId,x.depth,x.clipDepth]),
  canvas.sourceMorphCharacterIds.length],
  ['alg-l06-p023-maintained-canvas-v1',SOURCE.sha256,6,410,21,true,[[11,3,3,14]],0]);
 equal([crosswalk.identity.animationId,crosswalk.entries.length,
  crosswalk.missingModernKeys,crosswalk.originalHostRunObserved],
  [ID,4,['Domain'],false]);
 const glossary={};
 for(const [key,[characterId,frame]] of Object.entries(GATES)){
  const button=audit.buttons.find(x=>x.keyAttribute===key),
   native=text.glossaryControls.find(x=>x.key===key),
   dictionary=crosswalk.entries.find(x=>x.key===key);
  assert(button&&native&&dictionary,`P023 exact glossary ${key}`);
  assert.equal(button.characterId,characterId);assert.equal(button.instances.length,1);
  const instance=button.instances[0],label=instance.sourceLabelBinding;
  equal([instance.instanceId,instance.firstSourceReadyFrame,
   instance.firstStaticFullHitFrame,instance.lastActiveFrame,button.actionSha256,
   label.textId,label.textInstanceId,label.segment],
   [native.sourceButtonInstanceId,frame,frame,410,native.sourceActionSha256,
    native.sourceLabelTextId,native.sourceLabelTextInstanceId,native.sourceLabelSegment]);
  equal(native.availableSpans,[[frame,410]]);
  equal([dictionary.buttonCharacterId,dictionary.dictionary.sourceKeyAttribute,
   dictionary.dictionary.id],[characterId,key,key.toLowerCase()]);
  assert(dictionary.dictionary.definitions.en&&dictionary.dictionary.definitions.es);
  if(key==='Domain')assert.equal(dictionary.modern.present,false);
  else assert.equal(dictionary.modern.present,true);
  glossary[key]={characterId,sourceKey:key,entryId:dictionary.dictionary.id,
   sourceActionSha256:button.actionSha256,instances:[{instanceId:instance.instanceId,
    depth:instance.depth,labelTextId:label.textId,labelTextInstanceId:label.textInstanceId,
    labelRunText:label.runText,labelSegment:label.segment,
    sourcePlacementTagSha256:instance.sourcePlacementTagSha256,
    firstCandidateFrame:frame,firstFullHitFrame:frame}],originalClickObserved:false};
 }
 const artifacts=proposedP023Artifacts(root,canvas);
 const localInputs=uniquePins([BINDING,migrationPin,...binding.files,
  framesPin,...Object.values(artifacts)]);
 return {binding,migration,intake,audit,frames,text,audio,plan,crosswalk,canvas,
  glossary,artifacts,localInputs,external:binding.external};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
export function validateP023AdmissionSemantics(packet,registration,root){
 assert(root,'P023_REQUIRES_CURRENT_ROOT');
 const source=readP023CanonicalSource(root),artifacts=source.artifacts;
 equal([packet.schemaVersion,packet.calibrationId,packet.sourceRoot,
  packet.scope,packet.deploymentScope],
  [1,CALIBRATION,SOURCE_ROOT,'private-engineering','local-only']);
 equal([packet.source,packet.sourceXml,packet.optionalSpanishAudio.source,
  packet.glossaryActions,packet.acceptanceEffects],
  [SOURCE,XML,SA,source.glossary,ACCEPTANCE]);
 equal(packet.continuousSource.mainRanges,[[11,410]]);
 equal(packet.continuousSource.mainRangeAssets,[source.audio.main.extractedMp3]);
 equal([packet.continuousSource.mainFrameDomain,packet.continuousSource.zeroPayloadFrame,
  packet.continuousSource.initialSeekSamples,packet.continuousSource.mainRangesConcatenated,
  packet.continuousSource.syntheticSilenceAdded],
  ['sprite-38',12,1673,false,false]);
 equal([packet.optionalSpanishAudio.trigger,packet.optionalSpanishAudio.localeAutoplay,
  packet.optionalSpanishAudio.mainStreamSpliced],['explicit-user-only',false,false]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 equal(packet.entry,{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:COMPLEXITY_LANE,artifacts});
 equal(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:23,sourceOccurrence:23,sectionCode:'VB',
  sectionPageOrdinal:13,complexityLane:COMPLEXITY_LANE,runtime:p023Runtime(artifacts)}]);
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 equal(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert.equal(packet.integrity.completeTransitiveClosure,false);
 const evidence=new Map(packet.integrity.files.map(item=>[item.path,item]));
 for(const item of [...source.localInputs,...Object.values(artifacts)])
  equal(evidence.get(item.path),item,`exact P023 evidence: ${item.path}`);
 for(const pin of packet.integrity.files)assert(!FORBIDDEN.has(pin.path)&&
  pin.path!==PROOF_PATH&&pin.path!==FREEZE_PATH&&
  !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(pin.path),
  `no registration-dependent P023 evidence: ${pin.path}`);
 return true;
}
