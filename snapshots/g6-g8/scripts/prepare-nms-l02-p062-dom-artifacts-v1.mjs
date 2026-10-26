#!/usr/bin/env node
/** P062 source-locked maintained-DOM run/member producer; no registration effect. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,uniquePins,sha256} from '../lib/g678-admission-proof.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const SCRIPT=fileURLToPath(import.meta.url),ROOT=path.resolve(path.dirname(SCRIPT),'..');
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID='shared-nms002-l02-p062',CALIBRATION='g678-nms-l02-p062-conditional-host-current-js-v1';
const RUN_ROOT=`work/g678-shared-page-factory/${CALIBRATION}`;
const RUN=`${RUN_ROOT}/run-manifest.json`,MEMBER=`${RUN_ROOT}/members/${ID}/member-manifest.json`;
const MODULE=`packages/demos/src/modules/${ID}.tsx`,TIMELINE=`packages/demos/src/timelines/${ID}.ts`;
const SOURCE={path:'G6-G8-shared/NMS002/L2/TS/L2TS09.swf',bytes:564902,
 sha256:'5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50'};
const XML={path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'};
const SA={path:'G6-G8-shared/NMS002/L2/SA/L2TS09.mp3',bytes:200592,
 sha256:'868b874f9b29d21036bb0b5330bed3bd52e3f4128635f087b95d8fdea77da48d'};
const SOURCE_AUDIT={path:'output/nms-l02-p062-source-20260928/source-audit.json',bytes:195769,
 sha256:'3fa24e31b9caa51f6ff9d8a71ddc929e9bf0cf72fab2afec2d0e765eaf1c7ce3'};
const RAW={path:'output/nms-l02-p062-source-20260928/audio-raw-index.json',bytes:744707,
 sha256:'7472338c839236889c0cff30be00ea99eca0fed5b8cd708a41cf68f4f378dde3'};
const FRAME_DOMAINS={path:'output/nms-l02-p062-source-20260928/frame-domain-audit.json',bytes:10330,
 sha256:'2a5d25624913b155a271ad5bb3ccd9f7cb90f21bb6679709e27c28a706cdc4e6'};
const BEHAVIOR={path:'output/nms-l02-p062-behavior-20260928/source-behavior-v1.json',bytes:32041,
 sha256:'2a9dbda1a677eb940b03625a86477c1708841fa85de787b4227f584c2d4b3312'};
const WORDING={path:'output/nms-l02-p062-behavior-20260928/host-control-wording-v1.json',bytes:30957,
 sha256:'8fe554d99b8061df68f78af25c80b17d19eb93a2656525f65d7c2aabdaf745ed'};
const HOST={path:'output/nms-l02-p060-host-contract-20260927/host-contract-audit.json',bytes:9573,
 sha256:'dac05d6a35be8087a2162b5e94c812fd4c172f4f60d24d8d40e4b2c2be12ea32'};
const AUDIO_RECEIPT={path:'output/nms-l02-p062-audio-20260928/receipt.json',bytes:12252,
 sha256:'fd5fe3bb65e55682028245b88ca5c857d4b058000ef965645da557363ddedaa8'};
const DISPLAY_RECEIPT={path:'output/nms-l02-p062-display-20260928/receipt.json',bytes:1421,
 sha256:'be93fca44b1d51271c11a127932e6b1376bb88f24174116098f6030a076f7768'};
const DISPLAY={path:'packages/demos/src/generated/nms-l02-p062-display-list-v1.ts',bytes:136129,
 sha256:'ea164877b86c7eca621ffa8add1578fc967f9ff364141093c13922cd7648120a'};
const AUDIO={path:'packages/demos/src/generated/nms-l02-p062-audio-v1.ts',bytes:10998,
 sha256:'d87638b1dcff8849d40d2ded79d8056407b754bbe6d37a9877699a905bc069f3'};
const AUDIO_ROOT='output/nms-l02-p062-source-20260928/extraction/audio';
const DOMAINS=[85,138,150,178,192,209,230,256,288,302,315].map(id=>`sprite-${id}`);
const APPLICABLE_FEEDBACK=['sprite-138','sprite-150','sprite-178',
 'sprite-288','sprite-230','sprite-209','sprite-256'];
const MAIN_STOPS=[384,523,650,766,815,834];
const PRODUCT_TESTS=[
 'packages/demos/tests/nms-l02-p062-state-v1.test.ts',
 'packages/demos/tests/nms-l02-p062-session-v1.test.ts',
 'packages/demos/tests/nms-l02-p062-audio-v1.test.ts',
 'packages/demos/tests/nms-l02-p062-product-renderer-v1.test.tsx',
 'packages/demos/tests/nms-l02-p062-product-module-v1.test.tsx',
];
const INPUT_PATHS=[
 MODULE,TIMELINE,
 'packages/demos/src/nms-l02-p062-product-module-v1.tsx',
 'packages/demos/src/nms-l02-p062-product-renderer-v1.tsx',
 'packages/demos/src/nms-l02-p062-state-v1.ts',
 'packages/demos/src/nms-l02-p062-session-v1.ts',
 'packages/demos/src/nms-l02-p062-audio-v1.ts',
 DISPLAY.path,AUDIO.path,...PRODUCT_TESTS,
 'scripts/prepare-nms-l02-p062-source.mjs','scripts/prepare-nms-l02-p062-source.test.mjs',
 'scripts/build-g4-l3-embedded-audio-archive.mjs',
 'scripts/prepare-nms-l02-p062-audio-v1.mjs','scripts/prepare-nms-l02-p062-audio-v1.test.mjs',
 'scripts/prepare-nms-l02-p062-display-list-v1.mjs',
 'scripts/prepare-nms-l02-p062-display-list-v1.test.mjs',
 'scripts/prepare-nms-l02-p062-dom-artifacts-v1.mjs',
 'scripts/prepare-nms-l02-p062-dom-artifacts-v1.test.mjs',
 SOURCE_AUDIT.path,RAW.path,FRAME_DOMAINS.path,'output/nms-l02-p062-source-20260928/README.md',
 BEHAVIOR.path,WORDING.path,'output/nms-l02-p062-behavior-20260928/README.md',
 'output/nms-l02-p062-behavior-20260928/HOST_CONTROL_WORDING_2026-09-28.md',
 HOST.path,'output/nms-l02-p060-host-contract-20260927/README.md',
 AUDIO_RECEIPT.path,'output/nms-l02-p062-audio-20260928/README.md',
 DISPLAY_RECEIPT.path,'output/nms-l02-p062-display-20260928/README.md',
 ...DOMAINS.map(domain=>`${AUDIO_ROOT}/${domain}.mp3`),
];
const GENERATED=[MODULE,TIMELINE,DISPLAY.path,AUDIO.path,SOURCE_AUDIT.path,RAW.path,FRAME_DOMAINS.path,
 AUDIO_RECEIPT.path,DISPLAY_RECEIPT.path,...DOMAINS.map(domain=>`${AUDIO_ROOT}/${domain}.mp3`)];
/** Shared code is host-owned in a later formal admission, not page-owned run input. */
const SHARED_DEPENDENCIES=[
 'packages/demos/src/contract.ts',
 'packages/demos/src/alg-l12-glossary-pair-audio-loader.ts',
 'lib/g678-admission-proof.mjs',
 'scripts/private-current-js-registry.mjs',
];
const GENERATOR_CHECKS=[
 ['scripts/prepare-nms-l02-p062-source.mjs',SOURCE_AUDIT.path],
 ['scripts/prepare-nms-l02-p062-audio-v1.mjs',AUDIO.path],
 ['scripts/prepare-nms-l02-p062-display-list-v1.mjs',DISPLAY.path],
];
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
const same=(a,b,label)=>assert.deepStrictEqual(a,b,label);
const exact=(root,pin)=>{same(pinFile(root,pin.path),pin,`exact ${pin.path}`);return readPin(root,pin);};

function readAbsolutePin(pin){
 assert(path.isAbsolute(pin.path)&&Number.isSafeInteger(pin.bytes)&&pin.bytes>=0&&
  pin.bytes<=64*1024*1024&&/^[a-f0-9]{64}$/u.test(pin.sha256),'bounded absolute pin');
 assert.equal(fs.realpathSync(pin.path),pin.path,`physical evidence ${pin.path}`);
 const before=fs.lstatSync(pin.path,{bigint:true});
 assert(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n&&before.size===BigInt(pin.bytes),
  `ordinary evidence ${pin.path}`);
 const bytes=fs.readFileSync(pin.path),after=fs.lstatSync(pin.path,{bigint:true});
 assert(['dev','ino','mode','size','mtimeNs','ctimeNs','nlink'].every(key=>before[key]===after[key]),
  `stable evidence ${pin.path}`);
 assert.equal(sha256(bytes),pin.sha256,`evidence hash ${pin.path}`);
 return bytes;
}
function physicalSource(){
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,SOURCE_ROOT,'exact real G6-G8 source root');
 assert.equal(fs.realpathSync(SOURCE_ROOT),SOURCE_ROOT,'physical source root');
 assert(fs.lstatSync(SOURCE_ROOT).isDirectory()&&!fs.lstatSync(SOURCE_ROOT).isSymbolicLink(),
  'ordinary physical source root');
 same(pinFile(SOURCE_ROOT,SOURCE.path),SOURCE,'P062 SWF');
 same(pinFile(SOURCE_ROOT,XML.path),XML,'lesson XML');
 same(pinFile(SOURCE_ROOT,SA.path),SA,'separate SA index source');
}
function sourceEvidence(root){
 physicalSource();
 const audit=JSON.parse(exact(root,SOURCE_AUDIT)),raw=JSON.parse(exact(root,RAW));
 const frameDomains=JSON.parse(exact(root,FRAME_DOMAINS));
 const behavior=JSON.parse(exact(root,BEHAVIOR)),wording=JSON.parse(exact(root,WORDING));
 const host=JSON.parse(exact(root,HOST)),audioReceipt=JSON.parse(exact(root,AUDIO_RECEIPT));
 const displayReceipt=JSON.parse(exact(root,DISPLAY_RECEIPT));
 for(const pin of [DISPLAY,AUDIO])exact(root,pin);
 assert.equal(audit.kind,'nms-l02-p062-source-static-audit-v1');
 assert.equal(audit.animationId,ID);assert.equal(audit.sourceRoot,SOURCE_ROOT);
 same(audit.source,SOURCE,'audited SWF');same(audit.sourceXml,XML,'audited lesson XML');
 assert.equal(audit.placement.lessonPageCount,64);
 assert.equal(audit.placement.globalPageOrdinal,62);
 assert.equal(audit.placement.section,'TS');assert.equal(audit.placement.sectionPageOrdinal,8);
 assert.equal(audit.placement.reference,'TS/L2TS09.swf');
 assert.equal(audit.sourceStructure.rootFrames,10);
 assert.equal(audit.sourceStructure.teachingSpriteId,315);
 assert.equal(audit.sourceStructure.sprites['315'].frames,837);
 assert.equal(audit.sourceStructure.sprites['106'].frames,21);
 assert.equal(audit.sourceStructure.sprites['122'].frames,27);
 assert.equal(audit.sourceStructure.rootTeachingPlacement.frame,6);
 assert.equal(audit.sourceStructure.rootTeachingPlacement.attributes.depth,'3');
 same(audit.sourceStructure.rootTeachingPlacement.transform,{transX:'8247',transY:'5658'},
  'root transform');
 same(audit.sourceStructure.teachingActionFrames,[...MAIN_STOPS.slice(0,5),816,834],
  'source actions include frame 816 reset');
 assert.equal(audit.sourceStructure.sprites['315'].directTagCounts.SoundStreamBlock,820);
 assert.equal(audit.extraction.files.length,144,'finite source extraction inventory');
 assert.equal(audit.extraction.ffdecScriptCount,60);
 assert.equal(audit.extraction.files.filter(pin=>pin.path.includes('/ffdec/scripts/')).length,60,
  'all sixty extracted ActionScript pins');
 same(audit.reachableFrameDomains,FRAME_DOMAINS,'source frame-domain receipt');
 assert.equal(frameDomains.kind,'nms-l02-p062-source-reachable-frame-domains-v1');
 same(frameDomains.source,SOURCE,'frame-domain source');
 assert.equal(frameDomains.definedSpriteCount,20);
 assert.equal(frameDomains.reachableDomainCount,21);
 assert.equal(frameDomains.originalRuntimeReachabilityEstablished,false);
 assert.equal(frameDomains.domains.root.frames,10);
 assert.equal(frameDomains.domains['sprite-315'].frames,837);
 same(frameDomains.domains['sprite-315'].actionFrames,[...MAIN_STOPS.slice(0,5),816,834],
  'main sprite domain actions');
 for(const pin of audit.extraction.files){
  assert(pin.path.startsWith('output/nms-l02-p062-source-20260928/extraction/')&&
   !pin.path.includes('..'),'bounded P062 source extraction');readPin(root,pin);
 }
 same(audit.audio.rawIndex,RAW,'audited raw index');
 assert.equal(audit.audio.emptyBlockSilenceInserted,false);
 assert.equal(audit.audio.seekTrimApplied,false);
 assert.equal(audit.audio.originalRuntimeSynchronizationEstablished,false);
 assert.equal(audit.audio.listeningAccepted,false);
 assert.equal(audit.audio.separateLessonSa.sourceBinding,'lesson-index-only-not-spliced');
 same(audit.glossary.sourceKeys,[],'zero source KeyAttribute calls');
 assert.equal(audit.glossary.historicalHostBankBindingEstablished,false);
 assert(Object.values(audit.acceptanceEffects).every(value=>value===false));

 assert.equal(raw.kind,'nms-l02-p062-embedded-stream-raw-index-v1');
 assert.equal(raw.animationId,ID);same(raw.source,SOURCE,'raw audio source');
 assert.equal(raw.emptyBlockSilenceInserted,false);assert.equal(raw.seekTrimApplied,false);
 assert.equal(raw.originalRuntimeSynchronizationEstablished,false);
 assert.equal(raw.audioListeningAccepted,false);
 same(raw.streams.map(item=>item.ownerDomainId),DOMAINS,'all eleven source audio domains');
 assert.equal(raw.streams.reduce((sum,item)=>sum+item.blockCount,0),1142);
 const audioPins=raw.streams.map(stream=>{
  const relative=`${AUDIO_ROOT}/${stream.ownerDomainId}.mp3`,pin=pinFile(root,relative);
  same(stream.payload,pin,`MP3 ${stream.ownerDomainId}`);
  const audited=audit.audio.streams.find(row=>row.ownerDomainId===stream.ownerDomainId);
  assert(audited);same(audited.payload,pin,'source-audit audio payload');
  assert.equal(audited.decode.decodedSamples,stream.declaredSamples);
  return pin;
 });
 const main=raw.streams.find(row=>row.ownerDomainId==='sprite-315');
 assert.equal(main.blockCount,820);assert.equal(main.declaredSamples,1503936);
 same(main.blockFrameRange,{first:9,last:828,inclusive:true},'main source audio frames');
 same(main.negativeSeekBlocks,[{frame:828,seekSamples:-2239}],
  'retained signed final seek, not accepted cropping');
 same(main.emptyPayloadFrames,[10,828],'empty source blocks are not inserted silence');
 assert.equal(main.payload.sha256,'2d075a4f380c182816be0c3d30e5f945ad3e6cebaa9e3d169c747bea3dcce170');

 assert.equal(behavior.kind,'nms-l02-p062-source-behavior-v1');
 same(behavior.source,SOURCE,'behavior SWF');same(behavior.sourceXml,XML,'behavior XML');
 assert.equal(behavior.sourceAuditSha256,SOURCE_AUDIT.sha256);
 assert.equal(behavior.frameDomainsSha256,FRAME_DOMAINS.sha256);
 assert.equal(behavior.root.frames,10);assert.equal(behavior.main.spriteId,315);
 assert.equal(behavior.main.frames,837);same(behavior.main.stops,MAIN_STOPS,'behavior stops');
 assert.equal(behavior.main.frame816ClearsQuizSection,true);
 assert.equal(behavior.main.actionScripts.length,7);
 assert.equal(behavior.interactive.buttonScripts.length,7);
 assert.equal(behavior.interactive.clipActionPins.length,8);
 assert.equal(behavior.interactive.glossaryKeyAttributeCalls,0);
 assert.equal(behavior.interactive.helpSprites['106'].frames,21);
 assert.equal(behavior.interactive.helpSprites['122'].frames,27);
 assert.equal(behavior.audio.sourceStreamCount,11);
 assert.equal(behavior.audio.sourceBlockCount,1142);
 assert.equal(behavior.audio.mainDecodedSamples,1503936);
 assert.equal(behavior.audio.originalSynchronizationEstablished,false);
 assert.equal(behavior.audio.listeningAccepted,false);
 assert.equal(behavior.limits.sourceStaticOnly,true);
 assert.equal(behavior.limits.hostFeedbackSelectionProven,false);
 assert.equal(behavior.limits.originalRuntimeInteractionProven,false);
 assert.equal(behavior.limits.historicalGlossaryBankAssociationProven,false);
 assert.equal(behavior.limits.currentJsRegistered,false);
 assert.equal(behavior.limits.strictCompletion,false);
 for(const row of behavior.main.actionScripts){
  const pin=row.actionPin;
  assert(audit.extraction.files.some(item=>item.path===pin.path&&item.sha256===pin.sha256));
  assert.equal(readPin(root,pin).toString(),row.script,`action text ${pin.path}`);
 }

 assert.equal(wording.kind,'nms-l02-p062-identified-host-controls-and-wording-v1');
 same(wording.source.swf,SOURCE,'wording SWF');same(wording.source.xml,XML,'wording XML');
 same(wording.source.audit,SOURCE_AUDIT,'wording source audit');same(wording.source.rawAudio,RAW,'wording raw audio');
 assert(audit.extraction.files.some(pin=>pin.path===wording.source.swfmill.path&&
  pin.sha256===wording.source.swfmill.sha256),'wording source XML in extracted closure');
 assert.equal(wording.identifiedHost.associationToP062Established,false);
 assert.equal(wording.identifiedHost.selectorOriginalRuntimeObservedForP062,false);
 assert.equal(wording.identifiedHost.wrongSelector,'random(3)+1; names Mc_Wrong_Feed1..3; gotoAndPlay(2)');
 assert.equal(wording.identifiedHost.rightSelector,'random(4)+1; names Mc_Right_Feed1..4; gotoAndPlay(2)');
 same(wording.mainStops,MAIN_STOPS,'wording source stops');
 same(wording.minimalModernContract.conditionalHostWrongSelection,[138,150,178],'wrong selected');
 same(wording.minimalModernContract.conditionalHostRightSelection,[288,230,209,256],'right selected');
 same(wording.minimalModernContract.extraSourceFeedbackNotSelectedByIdentifiedHost,[192,302],
  'extra source feedback outside conditional selector');
 same(wording.helpDomains['sprite-106'],{placedAtMainFrame:650,stops:[1,15],returnReset:20,
  revealButtonId:105},'first help box');
 same(wording.helpDomains['sprite-122'],{placedAtMainFrame:766,stops:[1,21],returnReset:27,
  revealButtonId:121},'second help box');
 assert.equal(wording.controls.length,7);
 same(wording.answerRows.map(row=>row.value),['$20.08','$20.80','$21.60','$21.80'],
  'source answer labels');
 same(wording.answerRows.map(row=>row.correct),[false,false,true,false],'source answer mapping');
 same(wording.wordingConflicts.map(row=>row.issue),['tax-base','example-rate'],
  'qualified editorial math corrections');
 for(const conflict of wording.wordingConflicts){
  assert.equal(conflict.originalRuntimeVisualTextCorrectionAccepted,false);
  for(const pin of conflict.pins){
   assert(audit.extraction.files.some(item=>item.path===pin.path&&item.sha256===pin.sha256));
   readPin(root,pin);
  }
 }
 assert(Object.values(wording.acceptanceEffects).every(value=>value===false));
 assert.equal(host.kind,'nms-l02-p060-identified-host-static-contract-v1');
 assert.equal(host.host.bindingToP060Established,false);
 assert.equal(host.host.logicalPath,'NewHelpProgram/HELP_COURSES/indexMI.swf');
 same(host.host.physicalCasObject,wording.identifiedHost.physicalCasObject,
  'same conditional identified-host binary');
 same(host.host.exportedScriptPins.frame35,wording.identifiedHost.frame35Script,
  'same conditional identified-host script');

 same(audioReceipt.source,SOURCE,'audio receipt SWF');
 same(audioReceipt.sourceXml,XML,'audio receipt XML');
 same(audioReceipt.sourceAudit,SOURCE_AUDIT,'audio receipt audit');
 same(audioReceipt.sourceBehavior,BEHAVIOR,'audio receipt behavior');
 same(audioReceipt.rawIndex,RAW,'audio receipt raw index');
 same(audioReceipt.generated,AUDIO,'generated audio binding');
 same(audioReceipt.sourceMainStops,MAIN_STOPS,'audio authored stops');
 same(audioReceipt.sourceLeadFrames,[1,8],'source visual lead');
 assert.equal(audioReceipt.sourceFinalPayloadFrame,828);
 same(audioReceipt.sourceTailFrames,[829,834],'source visual tail');
 assert.equal(audioReceipt.policy.fullDecodedBufferCandidate,true);
 for(const field of ['emptyBlockSilenceInserted','seekTrimApplied',
  'originalRuntimeSynchronizationEstablished','listeningAccepted'])
  assert.equal(audioReceipt.policy[field],false,`audio policy ${field}`);
 assert.equal(audioReceipt.streams.length,11);
 for(const [index,stream] of audioReceipt.streams.entries()){
  same(stream.payload,audioPins[index],`audio receipt payload ${stream.ownerDomainId}`);
  assert.equal(stream.decodedSamples,raw.streams[index].declaredSamples);
 }
 same(audioReceipt.separateLessonSa.pin,SA,'separate SA evidence');
 assert.equal(audioReceipt.separateLessonSa.role,'index-only-not-spliced');
 assert.equal(displayReceipt.kind,'nms-l02-p062-source-display-generation-v1');
 same(displayReceipt.output,DISPLAY,'generated source display');
 assert.equal(displayReceipt.generator.path,'scripts/prepare-nms-l02-p062-display-list-v1.mjs');
 assert.equal(displayReceipt.generator.sha256,
  pinFile(root,displayReceipt.generator.path).sha256,'display generator pin');
 assert.equal(displayReceipt.source.sha256,SOURCE.sha256);
 assert.equal(displayReceipt.sourceAudit.sha256,SOURCE_AUDIT.sha256);
 assert.equal(displayReceipt.behaviorAudit.sha256,BEHAVIOR.sha256);
 assert.equal(displayReceipt.hostWordingAudit.sha256,WORDING.sha256);
 assert.equal(displayReceipt.domains,20);assert.equal(displayReceipt.textRecords,72);
 assert.equal(displayReceipt.registrationEffect,false);
 assert.equal(displayReceipt.acceptanceEffect,false);
 const externalEvidence=uniquePins([
  {...SOURCE,path:path.join(SOURCE_ROOT,SOURCE.path)},
  {...XML,path:path.join(SOURCE_ROOT,XML.path)},
  {...SA,path:path.join(SOURCE_ROOT,SA.path)},
  host.host.physicalCasObject,...Object.values(host.host.exportedScriptPins),
 ]);
 for(const pin of externalEvidence)readAbsolutePin(pin);
 return{audit,raw,behavior,wording,audioReceipt,audioPins,externalEvidence};
}
function runGeneratorChecks(root){
 return GENERATOR_CHECKS.map(([producer,output])=>{
  const run=spawnSync(process.execPath,[path.join(root,producer),'--check'],{
   cwd:root,env:{...process.env,HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT},encoding:'utf8',
   timeout:240000,maxBuffer:1024*1024});
  assert.equal(run.status,0,`${producer} --check: ${String(run.stderr??run.error??'').slice(0,1500)}`);
  return{producer:pinFile(root,producer),output:pinFile(root,output),mode:'--check',exitCode:0};
 });
}
function runValidationChecks(root){
 const run=spawnSync(process.execPath,['--import','tsx','--test',...PRODUCT_TESTS],{
  cwd:root,env:process.env,encoding:'utf8',timeout:240000,maxBuffer:1024*1024});
 assert.equal(run.status,0,`P062 state/audio/native product tests: ${String(run.stderr??run.error??'').slice(0,1500)}`);
 return[{tests:PRODUCT_TESTS.map(relative=>pinFile(root,relative)),
  mode:'node --import tsx --test',exitCode:0}];
}
function projectRegistry(root,artifacts){
 const registry=JSON.parse(readPin(root,pinFile(root,'packages/demos/private-current-js-registry.json')));
 const existing=registry.calibrations.flatMap(row=>row.entries.filter(entry=>entry.key===ID)
  .map(entry=>({calibrationId:row.calibrationId,entry})));
 if(existing.length){
  assert.equal(existing.length,1);assert.equal(existing[0].calibrationId,CALIBRATION);
  same(existing[0].entry.artifacts,artifacts,'existing P062 DOM registration exact');
  return true;
 }
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:`catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  freezeManifestBytes:1,freezeManifestSha256:'0'.repeat(64),
  entries:[{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
   complexityLane:'behavior-heavy',artifacts}]};
 const projected=upsertPrivateCurrentJsCalibration(registry,fragment);
 assert(projected.calibrations.some(row=>row.calibrationId===CALIBRATION),'DOM registry shape');
 return true;
}

export function buildP062DomArtifactPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV,
  'local engineering only');
 const source=sourceEvidence(root);
 const inputs=uniquePins([...INPUT_PATHS.map(relative=>pinFile(root,relative)),
  ...source.audit.extraction.files]);
 const sharedDependencies=uniquePins(SHARED_DEPENDENCIES.map(relative=>pinFile(root,relative)));
 assert(sharedDependencies.every(pin=>!inputs.some(item=>item.path===pin.path)),
  'page inputs and shared dependencies disjoint');
 const outputs=uniquePins(GENERATED.map(relative=>{
  const current=inputs.find(pin=>pin.path===relative);
  assert(current,`generated output in finite input closure ${relative}`);return current;
 }));
 const generatorChecks=runGeneratorChecks(root),validationChecks=runValidationChecks(root);
 for(const check of generatorChecks){
  same(inputs.find(pin=>pin.path===check.producer.path),check.producer,'producer in own closure');
  same(outputs.find(pin=>pin.path===check.output.path),check.output,'output in own closure');
 }
 const acceptanceEffects={originalRuntimeFidelity:false,audioAccepted:false,humanReviewed:false,
  ownerAccepted:false,strictComplete:false,published:false};
 const runManifest={schemaVersion:1,kind:'nms-l02-p062-maintained-dom-source-run-v1',animationId:ID,
  method:'source-locked-public-tool-IR-and-maintained-DOM-state-machine',
  complexityLane:'behavior-heavy',sourceRoot:SOURCE_ROOT,source:SOURCE,sourceXml:XML,
  sourceStructure:{stage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,
   rootSpritePlacement:{characterId:315,depth:3,transXTwips:8247,transYTwips:5658},
   frameDomain:'sprite-315',frameCount:837,authoredStopFrames:MAIN_STOPS,
   sourceIntrospectionFrameRange:[1,837],productVisualFrameRange:[1,834],
   productPlaybackMode:'once',productPlaybackEndFrame:834,
   originalRuntimeParityEstablished:false},
  sourceAudit:SOURCE_AUDIT,
  sourceBehavior:{audit:BEHAVIOR,hostWordingAudit:WORDING,identifiedHostContract:HOST,
   externalEvidence:source.externalEvidence,
   hostSelection:'conditional-indexMI-random3-wrong-random4-right',
   historicalHostAssociationEstablished:false,originalRuntimeParityEstablished:false},
  sourceAudio:{rawIndex:RAW,implementationReceipt:AUDIO_RECEIPT,
   payloads:source.audioPins,domainCount:11,applicableFeedback:APPLICABLE_FEEDBACK,
   mainBlockCount:820,mainFirstBlockFrame:9,mainLastBlockFrame:828,
   mainDecodedSamples:1503936,wholeBufferWindows:MAIN_STOPS.length,
   sourceLeadFrames:[1,8],sourceTailFrames:[829,834],
   signedFinalSeekSamples:-2239,fullDecodedBufferCandidate:true,
   emptyBlockSilenceInserted:false,seekTrimApplied:false,separateLessonSaSpliced:false,
   originalRuntimeAlignmentEstablished:false,listeningAccepted:false},
  glossary:{sourceKeyAttributeCalls:0,sourceControlCount:0,generatedTerms:null,
   expectedRegisteredPredecessorTermCount:25,originalL2XmlResolved:false,
   historicalHostAssociationEstablished:false,originalRuntimeLookupVerified:false},
  editorialCorrections:{receipt:WORDING,issues:['tax-base','example-rate'],
   sourceTextRetained:true,modernMathClarificationOnly:true,
   originalRuntimeVisualTextCorrectionAccepted:false},
  generatorChecks,validationChecks,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const runBytes=json(runManifest),runPin=bytePin(RUN,runBytes);
 const module=inputs.find(pin=>pin.path===MODULE),timeline=inputs.find(pin=>pin.path===TIMELINE);
 const memberManifest={schemaVersion:1,kind:'nms-l02-p062-maintained-dom-member-v1',animationId:ID,
  rendererBindingKind:'maintained-dom-module-v1',source:SOURCE,sourceXml:XML,
  sourceRun:runPin,module,timeline,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const memberBytes=json(memberManifest),memberPin=bytePin(MEMBER,memberBytes);
 const artifacts={kind:'maintained-dom-module-v1',module,timeline,memberManifest:memberPin,sourceRun:runPin};
 assert(projectRegistry(root,artifacts),'structural registry projection');
 return{root,runManifest,memberManifest,runPin,memberPin,artifacts,registryShapeAccepted:true,
  outputs:[{path:RUN,bytes:runBytes},{path:MEMBER,bytes:memberBytes}]};
}
export function prepareP062DomArtifacts(plan){
 assert(plan.outputs.every(item=>!fs.existsSync(path.join(plan.root,item.path))),
  'immutable DOM artifacts already exist; use --check');
 for(const item of plan.outputs){
  const file=path.join(plan.root,item.path);fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,item.bytes,{flag:'wx'});
  same(pinFile(plan.root,item.path),bytePin(item.path,item.bytes),'written DOM artifact');
 }
 return{status:'P062_DOM_ARTIFACTS_PREPARED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
export function checkP062DomArtifacts(plan){
 for(const item of plan.outputs)same(readPin(plan.root,bytePin(item.path,item.bytes)),item.bytes,
  `${item.path} manifest drift`);
 return{status:'P062_DOM_ARTIFACTS_CHECKED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT){
 try{
  assert(process.argv.length===3&&['--plan','--prepare','--check'].includes(process.argv[2]),
   'use --plan, --prepare or --check');
  const plan=buildP062DomArtifactPlan();
  const result=process.argv[2]==='--prepare'?prepareP062DomArtifacts(plan):
   process.argv[2]==='--check'?checkP062DomArtifacts(plan):
   {status:'P062_DOM_ARTIFACTS_PLAN_UNREGISTERED',artifacts:plan.artifacts,
    inputCount:plan.runManifest.inputs.length,outputCount:plan.runManifest.outputs.length,
    sharedDependencyCount:plan.runManifest.sharedDependencies.length,
    registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
