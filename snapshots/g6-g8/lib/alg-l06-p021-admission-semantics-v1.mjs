/** Source-bound P021 local Current-JS proposal. This module never registers a page. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p021';
export const CALIBRATION='g678-alg-l06-p021-current-js-20260929-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB14.swf',bytes:131483,
 sha256:'4e87aacf4c5f749f559817dc2c0ec8b023fba75652217b9ce2543728e06eb5eb'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB14.mp3',bytes:355152,
 sha256:'74d2579aeb963ca841d501a80e9830c05ae23153a87daa6e0a277c105f31f5d9'};
export const SOURCE_AUDIT={path:'output/alg-l06-p021-source-audit-v1/time-resolved-audit-v1.json',
 bytes:227182,sha256:'e171781cdd59278fec34388b7ba8de6ed4594d6d73afb9d9a524a172c1a99c02'};
export const FRAME_AUDIT={path:'output/alg-l06-p021-source-audit-v1/frame-states-v1.json',
 bytes:10224999,sha256:'b4f71c01e9744f7ba33a7efc0fded9ffd36557c1bde54df8f694be1f8dba9d23'};
export const TEXT_AUDIT={path:`migrations/${ID}/audit/text-state-v1/text-state-source-v1.json`,
 bytes:64921,sha256:'7650798fea1996d478b0f3de8fae2c411e31fd7f10975de16f0ecb6c426d3af1'};
export const CROSSWALK={path:'output/alg-l06-p021-glossary-audit-v1/six-term-crosswalk-v1.json',
 bytes:11627,sha256:'56354e286fe68ef3b2cc89860b76c02d801499194b25377cbd6180d022b541dc'};
export const AUDIO_AUDIT={path:'output/alg-l06-p021-audio-v1/audio-source-audit-v1.json',
 bytes:108449,sha256:'45451fc0ec1d872beb2e7fad908a75fecc98a225eb4b237c0abf8ab3ee2312f0'};
export const AUDIO_PLAN={path:'output/alg-l06-p021-audio-v1/audio-plan-v1.json',
 bytes:2435,sha256:'428809f919183e9f4044fa2583450e94d33b4d7210ae59084a1e4ea3f5630e44'};
export const BROWSER_AUDIO={path:'output/alg-l06-p021-audio-v1/decode-receipt.json',
 bytes:1162,sha256:'b0e6128363828db59fe74ef0265c76824958e9335aa9e585eeff0b4180d3d6fc'};
export const MAIN_AUDIO={path:'output/alg-l06-p021-audio-v1/sprite-43-source-v1.mp3',
 bytes:153660,sha256:'8d9675013afc1efd57dabf4cdddc12d3e54454fdef5989e4feb180f1b452f305'};
export const SA_COPY={path:'output/alg-l06-p021-audio-v1/separate-sa-source-v1.mp3',
 bytes:SA.bytes,sha256:SA.sha256};
export const CANVAS_MANIFEST={path:'output/alg-l06-p021-canvas-v1/canvas-manifest.json',
 bytes:6797,sha256:'87c189f6c1ccf771e0fce7cc48ac9595f9082f29a5596ebf6ca293faa232a8d3'};
export const CANVAS_SOURCE={path:'output/alg-l06-p021-canvas-v1/canvas-renderer.js',
 bytes:1534517,sha256:'f3af3d1445601440dbfa0ab8fce83bc9e6dd499ce14885d9e63c2ac2d80e0ca6'};
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const COMPLEXITY_LANE='behavior-heavy';
export const ARTIFACT_PATHS=Object.freeze({module:`packages/demos/src/modules/${ID}.tsx`,
 timeline:`packages/demos/src/timelines/${ID}.ts`,
 runtime:`work/g678-shared-page-factory/alg-l06-p021-20260929-v1/members/${ID}/canvas-renderer.js`});
export const MAINTAINED_PATHS=Object.freeze([
 'packages/demos/src/alg-l06-p021-timeline-v1.ts',
 'packages/demos/src/alg-l06-p021-audio-schedule-v1.ts',
 'packages/demos/src/alg-l06-p021-clock-v1.ts',
 'packages/demos/src/alg-l06-p021-audio-owner-v1.ts',
 'packages/demos/src/alg-l06-p021-optional-spanish-audio-v1.ts',
 'packages/demos/src/alg-l06-p021-native-text-v1.tsx',
 'packages/demos/src/alg-l06-p021-player-v1.tsx',
 'packages/demos/src/generated/alg-l06-p021-text-state-v1.ts']);
export const GLOSSARY_GATES=Object.freeze({Set:[8,12],Function:[11,20],Value:[12,25],
 'Ordered pair':[10,62],Input:[9,69],Output:[22,77]});
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,browserDecode:BROWSER_AUDIO,
 mainRanges:[MAIN_AUDIO],mainRangeFrames:[[7,377]],mainFrameDomain:'sprite-43',
 initialRawSeekSamples:1673,nativeAudioEndPosition:376.6103401360544,
 visualTailAfterNativeEof:true,zeroPayloadBlockFrames:[8],negativeSeekSemanticsResolved:false,
 syntheticSilenceForAbsentBlocks:false,mainRangesConcatenated:false,
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,sourceCopy:SA_COPY,
 browserDecode:BROWSER_AUDIO,trigger:'explicit-user-only',localeAutoplay:false,
 mainStreamSpliced:false,mainPausedDuringPlayback:true,pendingLoadCancellation:true,
 returnMainSupported:true,audioAccepted:false});
const pin=({path,bytes,sha256})=>({path,bytes,sha256});
function collect(root,item,local,external){
 if(!item)return;
 const exact=pin(item);
 assert(typeof exact.path==='string'&&Number.isSafeInteger(exact.bytes)&&
  /^[a-f0-9]{64}$/u.test(exact.sha256),'P021 evidence pin');
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const holder=exact.path.startsWith(`${root}/`)?root:
  exact.path.startsWith(`${SOURCE_ROOT}/`)?SOURCE_ROOT:path.dirname(exact.path);
 const relative={...exact,path:path.relative(holder,exact.path)};
 readPin(holder,relative);
 if(holder===root)local.push(relative);else external.push({root:holder,pin:relative});
}
export function proposedP021Artifacts(root){return {
 module:pinFile(root,ARTIFACT_PATHS.module),timeline:pinFile(root,ARTIFACT_PATHS.timeline),
 runtime:{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime}};}
export function readP021Artifacts(root){
 const artifacts={module:pinFile(root,ARTIFACT_PATHS.module),
  timeline:pinFile(root,ARTIFACT_PATHS.timeline),runtime:pinFile(root,ARTIFACT_PATHS.runtime)};
 assert.deepEqual(artifacts.runtime,{...CANVAS_SOURCE,path:ARTIFACT_PATHS.runtime},
  'exact copied P021 Canvas member');return artifacts;
}
export function p021Runtime(artifacts){return Object.freeze({frameDomain:'sprite-43',
 frameCount:377,rootFrameCount:10,rootBeginFrame:6,fps:12,stage:{width:800,height:600},
 scenario:'source-static-frame',seed:'0',canvasRenderer:artifacts.runtime,
 terminalPolicy:'candidate-main-end-hold',hostPlaybackCompletion:false});}
export function p021GlossaryActions(source,text,crosswalk){
 const result={};
 for(const [key,[characterId,frame]] of Object.entries(GLOSSARY_GATES)){
  const button=source.buttons.find(row=>row.keyAttribute===key);
  const native=text.glossaryControls.find(row=>row.key===key);
  const dictionary=crosswalk.entries.find(row=>row.key===key);
  assert(button&&native&&dictionary,`P021 exact glossary key ${key}`);
  assert.equal(button.characterId,characterId);assert.equal(button.instances.length,1);
  const instance=button.instances[0];
  assert.deepEqual([button.actionSha256,instance.instanceId,instance.firstSourceReadyFrame,
   instance.firstStaticFullHitFrame,instance.lastActiveFrame],
   [native.sourceActionSha256,native.sourceButtonInstanceId,frame,frame,377]);
  assert.deepEqual([native.sourceButtonId,native.firstCandidateFrame,native.firstFullHitFrame,
   native.sourcePlacementTagSha256,native.sourceLabelTextId,native.sourceLabelRunText],
   [characterId,frame,frame,instance.sourcePlacementTagSha256,
    instance.sourceLabelBinding.textId,instance.sourceLabelBinding.runText]);
  assert.deepEqual(native.availableSpans,[[frame,377]]);
  assert.equal(dictionary.buttonCharacterId,characterId);
  assert(dictionary.dictionary.definitions.en&&dictionary.dictionary.definitions.es);
  result[key]={characterId,sourceKey:key,entryId:dictionary.dictionary.id,
   sourceActionSha256:button.actionSha256,instances:[{instanceId:instance.instanceId,
    depth:instance.depth,labelTextId:instance.sourceLabelBinding.textId,
    labelRunText:instance.sourceLabelBinding.runText,
    sourcePlacementTagSha256:instance.sourcePlacementTagSha256,
    firstCandidateFrame:frame,firstFullHitFrame:frame}],originalClickObserved:false};
 }
 assert.equal(source.buttons.length,6);assert.equal(text.glossaryControls.length,6);
 return result;
}
/** Validate physical evidence and retain source-derived local/external closure. */
export function readP021CanonicalSource(root){
 for(const item of [SOURCE,XML,SA])readPin(SOURCE_ROOT,item);
 const migration=readJsonPin(root,pinFile(root,`migrations/${ID}/migration.json`));
 const intake=readJsonPin(root,pinFile(root,'output/alg-l06-p021-intake-recon-v1/intake-recon-v1.json'));
 const source=readJsonPin(root,SOURCE_AUDIT),frames=readJsonPin(root,FRAME_AUDIT);
 const text=readJsonPin(root,TEXT_AUDIT),crosswalk=readJsonPin(root,CROSSWALK);
 const audio=readJsonPin(root,AUDIO_AUDIT),plan=readJsonPin(root,AUDIO_PLAN);
 const browser=readJsonPin(root,BROWSER_AUDIO),canvas=readJsonPin(root,CANVAS_MANIFEST);
 assert.deepEqual([migration.id,migration.animationId,migration.assetId,
  migration.source.swfSha256,migration.runtime.complexity,migration.status],
  [ID,ID,`swf-${SOURCE.sha256}`,SOURCE.sha256,COMPLEXITY_LANE,'preserved']);
 assert.deepEqual([migration.acceptance.engineeringReview.decision,
  migration.acceptance.humanVisualReview.decision,migration.acceptance.ownerReview.decision],
  ['pending','pending','pending']);
 assert.deepEqual([intake.identity.animationId,intake.identity.globalOrdinal,
  intake.identity.sectionCode,intake.identity.sectionPageOrdinal,
  intake.source.samePathFlaExists],[ID,21,'VB',11,false]);
 assert.deepEqual(pin(intake.source.swf),SOURCE);assert.deepEqual(pin(intake.source.lessonXml),XML);
 assert.deepEqual(pin(intake.source.separateSaCandidate),SA);
 assert.equal(source.kind,'alg-l06-p021-time-resolved-static-audit-v1');
 assert.deepEqual([source.identity.animationId,source.identity.mainDomain,
  source.identity.mainFrameCount,source.identity.rootEntryFrame,source.identity.fps,
  source.textDefinitions.length,source.buttons.length,source.limits.originalRuntimeObserved],
  [ID,'sprite-43',377,6,12,21,6,false]);
 assert.deepEqual([source.maskPlacements.length,source.frameEvidence.sha256],[2,FRAME_AUDIT.sha256]);
 assert.deepEqual([frames.sourceSha256,frames.frameDomain,frames.frameCount,frames.frames.length],
  [SOURCE.sha256,'sprite-43',377,377]);
 assert.deepEqual([text.animationId,text.sourceSwfSha256,text.frameDomain,text.frameCount,
  text.textDefinitions.length,text.policy.canvasGlyphs,text.policy.language,
  text.policy.originalRuntimeAccepted],
  [ID,SOURCE.sha256,'sprite-43',377,21,'preserved','source-en-fallback',false]);
 assert.deepEqual(text.tableRows.map(row=>[row.inputText,row.outputText,
  row.firstCompletePairFrame]),[['2','3',204],['3','5',204],['5','-2',204],['7','1',204]]);
 assert.deepEqual(text.orderedPairs.map(row=>[row.inputText,row.outputText,
  row.firstCompletePairFrame]),[['2','3',346],['3','5',356],['5','-2',366],['7','1',376]]);
 assert.deepEqual([text.example.inputText,text.example.outputText,
  text.example.firstCompletePairFrame],['4','6',178]);
 assert.deepEqual(crosswalk.missingModernKeys,['Set','Ordered pair']);
 assert.deepEqual([crosswalk.active.registeredLessonPages,crosswalk.active.glossaryEntryCount],
  [31,32]);
 const glossary=p021GlossaryActions(source,text,crosswalk);
 assert.deepEqual([audio.main.domain,audio.main.declaredFrames,audio.main.firstBlockFrame,
  audio.main.lastBlockFrame,audio.main.blockCount,audio.main.firstBlockRawSeekSamples,
  audio.main.candidateNativeEndFrame],
  ['sprite-43',377,7,377,371,1673,376.6103401360544]);
 assert.deepEqual(audio.main.zeroPayloadBlocks.map(row=>row.frame),[8]);
 assert.deepEqual(audio.main.negativeSeekBlocks,[]);
 assert.deepEqual(pin(audio.main.extractedMp3),MAIN_AUDIO);
 assert.deepEqual(pin(audio.separateSa.copy),SA_COPY);
 assert.deepEqual([plan.kind,plan.disposition.frameDomain,plan.disposition.lastVisualFrame,
  plan.disposition.separateSaSpliced,plan.disposition.localeStartsAudio,
  plan.disposition.originalRuntimeAccepted],
  ['alg-l06-p021-maintained-audio-plan-v1','sprite-43',377,false,false,false]);
 assert.deepEqual(plan.disposition.mainRanges,[[7,377]]);
 assert.deepEqual(browser.results.map(row=>[row.sourceBytes,row.sourceSha256,row.playbackStarted]),
  [[MAIN_AUDIO.bytes,MAIN_AUDIO.sha256,false],[SA.bytes,SA.sha256,false]]);
 assert.deepEqual([canvas.kind,canvas.source.sha256,canvas.rootFrame,
  canvas.mainFrameCount,canvas.sourceGlyphRendering.definitions,
  canvas.sourceGlyphRendering.preserved],
  ['alg-l06-p021-maintained-canvas-v1',SOURCE.sha256,6,377,21,true]);
 assert(canvas.outputs.some(item=>JSON.stringify(pin(item))===JSON.stringify(CANVAS_SOURCE)));
 readPin(root,CANVAS_SOURCE);
 const local=[pinFile(root,`migrations/${ID}/migration.json`),
  pinFile(root,'output/alg-l06-p021-intake-recon-v1/intake-recon-v1.json'),
  SOURCE_AUDIT,FRAME_AUDIT,TEXT_AUDIT,CROSSWALK,AUDIO_AUDIT,AUDIO_PLAN,
  BROWSER_AUDIO,MAIN_AUDIO,SA_COPY,CANVAS_MANIFEST,CANVAS_SOURCE,
  ...MAINTAINED_PATHS.map(relative=>pinFile(root,relative))];
 const external=[SOURCE,XML,SA].map(item=>({root:SOURCE_ROOT,pin:item}));
 for(const item of [source.inputs.swfmillXml,source.inputs.ffdecSpriteFrames,
  ...text.inputs,...Object.values(crosswalk.inputs),plan.sourceAudit,plan.browserDecode,
  ...canvas.inputs,...canvas.outputs,audio.main.extractedMp3,audio.separateSa.copy])
  collect(root,item,local,external);
 const uniqueExternal=new Map();
 for(const item of external){const key=path.join(item.root,item.pin.path),old=uniqueExternal.get(key);
  if(old)assert.deepEqual(old,item,`conflicting external source: ${key}`);
  else uniqueExternal.set(key,item);}
 return {migration,intake,source,frames,text,crosswalk,audio,plan,browser,canvas,glossary,
  localInputs:uniquePins(local),external:[...uniqueExternal.values()].sort((a,b)=>
   path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)))};
}
const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
export function validateP021AdmissionSemantics(packet,registration,root){
 assert(root,'P021_REQUIRES_CURRENT_ROOT');
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.sourceRoot,packet.scope,
  packet.deploymentScope],[1,CALIBRATION,SOURCE_ROOT,'private-engineering','local-only']);
 assert.deepEqual([packet.source,packet.sourceXml,packet.continuousSource,
  packet.optionalSpanishAudio,packet.acceptanceEffects],
  [SOURCE,XML,CONTINUOUS,OPTIONAL_SPANISH,ACCEPTANCE]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 const source=readP021CanonicalSource(root),artifacts=proposedP021Artifacts(root);
 assert.deepEqual(packet.glossaryActions,source.glossary);
 assert.deepEqual(packet.entry,{key:ID,module:`./modules/${ID}`,
  maturity:'private-current-js',complexityLane:COMPLEXITY_LANE,artifacts});
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:21,sourceOccurrence:21,sectionCode:'VB',
  sectionPageOrdinal:11,complexityLane:COMPLEXITY_LANE,runtime:p021Runtime(artifacts)}]);
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert(Number.isSafeInteger(packet.freezeManifest.bytes)&&packet.freezeManifest.bytes>0);
 assert(/^[a-f0-9]{64}$/u.test(packet.freezeManifest.sha256));
 assert.deepEqual(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert.equal(packet.integrity.completeTransitiveClosure,false);
 const evidence=new Map(packet.integrity.files.map(item=>[item.path,item]));
 for(const required of [...source.localInputs,...Object.values(artifacts)])
  assert.deepEqual(evidence.get(required.path),required,`exact P021 evidence: ${required.path}`);
 for(const item of packet.integrity.files)assert(!FORBIDDEN.has(item.path)&&
  item.path!==PROOF_PATH&&item.path!==FREEZE_PATH&&
  !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(item.path),
  `no registration-dependent P021 evidence: ${item.path}`);
 return true;
}
